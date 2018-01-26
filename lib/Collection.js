'use strict';

const util = require('util');

const pluralize = require('pluralize');

const Query = require('./Query');
const Database = require('./Database');
const Document = require('./Document');
const Pluggable = require('./Pluggable');

const {Promise, hide, CONST} = require('./common');

/**
 * MongoDB Collection abstraction.
 */
class Collection extends Pluggable {
	/**
	 * Constructor.
	 * @param {Mongorite.Database} db
	 */
	constructor (db) {
		super();

		const after = this.action('construct');

		// Public
		let name;
		name = this.constructor.name.replace(/Collection$/i, '');
		name = name.charAt(0).toLowerCase() + name.substr(1); // We'll use .charAt instead of brackets if the name is empty.
		name = pluralize(name);

		hide(this, 'name', name);
		hide(this, 'length', 0);
		hide(this, 'isMongoriteCollection', true);

		hide(this, 'options', {
			collection: {}, // https://mongodb.github.io/node-mongodb-native/api-generated/db.html#collection
			bulkWrite: {ordered: false} // https://docs.mongodb.com/manual/reference/method/db.collection.bulkWrite/#db.collection.bulkWrite
		});

		hide(this, '_mongo', {db: null, collection: null});

		if (db != null) {
			this.db = db;
		}

		if (this.configure) {
			this.configure();
		}

		after();
	}

	/**
	 * Static helper bool to identify this constructor as an mongorite collection.
	 */
	static get isMongoriteCollection () {
		return true;
	}

	/**
	 * Default document to use when initalizing new documents.
	 * Static.
	 */
	static get Document () {
		return Document;
	}

	/**
	 * Default document to use when initalizing new documents.
	 * Non-static.
	 */
	get Document () {
		return this.constructor.Document;
	}

	/**
	 * Returns native mongodb components.
	 * @return {Object}
	 * @return {Object.db} MongoDB.Database
	 * @return {Object.collection} MongoDB.Collection
	 */
	get mongo () {
		if (!this._mongo.db) {
			if (this.db.state !== Database.STATE_CONNECTED) {
				// throw?
			}

			this._mongo.db = this.db._connection;
			this._mongo.collection = this.db.getCollection(this.name);

			this._mongo.collection['@@mongorite_'] = this;
		}

		return this._mongo;
	}

	/**
	 * Getter for returning a new Query.
	 * @return {Mongorite.Query}
	 */
	get query () {
		return new Query(this);
	}

	/**
	 * Creates and returns a new Document instance.
	 * Shortcut for:
	 * const document = (new collection.Document(collection)).set(data)
	 * @param  {...mixed} setArgs Optional arguments to be passed to the document `set` method.
	 * @return {Document}         The new document.
	 */
	createDocument (...setArgs) {
		const Document = this.Document;
		const document = new Document(this);

		if (setArgs.length) {
			document.set(...setArgs);
		}

		return document;
	}

	/**
	 * TODO.
	 * @param {Boolean} force If true, saves each document whether it's dirty or not.
	 * @param {Mongorite.Document=} doc
	 * @return {Object} `this`
	 */
	save (force, doc) {
		const mdbc = this.mongo.collection;
		const data = {
			collection: this,
			operations: [],
			options: this.options.bulkWrite,
			force: !!force,
			mode: (doc && doc.isMongoriteDocument) ? 'single' : 'multi'
		};

		hide(data, '_operations', []);

		/**
		 * TODO.
		 * @param {Mongorite.Document} doc
		 */
		function collectOps (doc) {
			const op = doc._generateWriteOperation(force);

			if (op.operation) {
				data.operations.push(op);
				data._operations.push(op.operation);
			}
		}

		if (data.mode === 'single') {
			collectOps(doc);
		} else {
			this.each(collectOps);
		}

		// TODO:
		// db.collection.initializeUnorderedBulkOp()
		// https://docs.mongodb.com/manual/reference/method/db.collection.initializeUnorderedBulkOp/
		// and maybe change `force` to `ordered`?

		return this
			.action('save', data, e =>
				mdbc.bulkWrite(e.data._operations, e.data.options).then(_res => {
					const res = {};

					// Provide access to the original result but keep in non-enumerable
					// so it doesn't cluttre up terminals.
					hide(res, 'BulkWriteResult', _res);

					// http://mongodb.github.io/node-mongodb-native/2.0/api/BulkWriteResult.html
					// At least nUpdated does not exist on my version of mongodb (2.2.31), hence the fallback to 0.
					res.nInserted	= _res.nInserted	|| 0;	// number	number of inserted documents
					res.nUpdated	= _res.nUpdated		|| 0;	// number	number of documents updated logically
					res.nUpserted	= _res.nUpserted	|| 0;	// number	Number of upserted documents
					res.nModified	= _res.nModified	|| 0;	// number	Number of documents updated physically on disk
					res.nRemoved	= _res.nRemoved		|| 0;	// number	Number of removed documents

					// Sum of all affected rows.
					res.nAffected = (res.nInserted + res.nUpdated + res.nUpserted + res.nModified + res.nRemoved);

					// The documentation says that get(Inserted|Upserted)Ids() "returns an array with inserted ids".
					// Well, yeah, it's true but not what you'd expect. The elements look like this:
					// [
					// 		{ index: 0, _id: 59ccda2f67548e2edc567901 },
					//		{ index: 1, _id: 59ccda2f67548e2edc567902 }
					// ]
					//
					// The 'index' property is incremental so I'm guessing it has to do with unordered operations.
					// But I do think that it's kinda unintuitive, so we'll iterate over their array and copy over only the
					// string id's to their corresponding `index` into new arrays.
					const insertedIds = _res.getInsertedIds();
					const upsertedIds = _res.getUpsertedIds();

					res.insertedIds = new Array(insertedIds.length);
					res.upsertedIds = new Array(upsertedIds.length);

					for (let i = 0; i < res.insertedIds.length; ++i) {
						res.insertedIds[i] = insertedIds[i]._id;
					}

					for (let i = 0; i < res.upsertedIds.length; ++i) {
						res.upsertedIds[i] = upsertedIds[i]._id;
					}

					res.errors = _res.getWriteErrors();
					res.operations = data.operations;
					res.collection = this;

					if (doc) {
						doc._pullChanges();
					} else {
						this.each(doc => doc._pullChanges());
					}

					return res;
				})
			);
	}

	/**
	 * Refreshes each Document in this collection.
	 * @return {Object} `this`
	 */
	refresh () {
		return this.action('bulkRefresh', {}, e => Promise.all(this.map(doc => doc.refresh())));
	}

	/**
	 * Executes the `Document.get` command on each document in this collection
	 * and returns the result as an array.
	 * @param {Mixed} key
	 * @return {Array}
	 */
	get (key) {
		return this.map(doc => doc.get(key));
	}

	/**
	 * Executes the `Document.set` command on each document in this collection
	 * and returns the result as an array.
	 * @param {Mixed} args
	 * @return {Array}
	 */
	set (...args) {
		return this.map(doc => doc.set(...args));
	}

	/**
	 * Returns a new instance of `this` that inherits all own properties.
	 * @param {Mongorite.Collection} keepDocuments If TRUE, all documents in this collection is copied onto the new collection.
	 * @return {Mongorite.Collection}
	 */
	clone (keepDocuments) {
		const clone = new (this.constructor)();
		const props = Object.getOwnPropertyNames(this);

		for (let i = 0; i < props.length; ++i) {
			let name = props[i];

			if ((keepDocuments || isNaN(name))) {
				clone[name] = this[name];
			}
		}

		if (!keepDocuments) {
			clone.length = 0;
		}

		return clone;
	}

	/**
	 * Removes the last Document from this collection and returns that Document.
	 * @return {Mongorite.Document} The removed document from this collection; undefined if this collection is empty.
	 */
	pop () {
		let element;

		if (this.length > 0) {
			element = this[this.length - 1];
			delete this[this.length - 1];
			this.length -= 1;
		}

		return element;
	}

	/**
	 * Removes the first Document from this collection and returns that Document.
	 * @return {Mongorite.Document} The removed document from this collection; undefined if this collection is empty.
	 */
	shift () {
		let element;

		if (this.length > 0) {
			element = this[0];

			for (let i = 0; i < this.length; ++i) {
				this[i - 1] = this[i];
			}

			delete this[-1];
			this.length -= 1;
		}

		return element;
	}

	/**
	 * Adds one or more documents to the end of this collection and returns `this`.
	 * Supports a mix of array, object and Document arguments.
	 * @param {Boolean=} mode Optional. If TRUE, sets each object pushed as non-dirty.
	 * @return {Mongorite.Collection} `this`
	 */
	push (...args) {
		const Document = this.Document;

		let i;
		let mode;

		if (args[0] !== true && args[0] !== false) {
			i = 0;
			mode = false;
		} else {
			i = 1;
			mode = args[0] === true ? CONST.SET_WRITE : false;
		}

		for (; i < args.length; ++i) {
			const arg = args[i];

			if (!arg) {
				continue;
			}

			if (!arg.isMongoriteCollection && !Array.isArray(arg)) {
				this[this.length++] = arg.isMongoriteDocument ? arg : (new Document(this)).set(mode, arg);
				continue;
			}

			for (let i = 0; i < arg.length; ++i) {
				if (arg[i]) {
					this[this.length++] = arg[i].isMongoriteDocument ? arg[i] : (new Document(this)).set(mode, arg[i]);
				}
			}
		}

		return this;
	}


	/**
	 * Executes a provided function (`callback`) once for each document in this collection.
	 * @param {Function} callback
	 * @return {Object} `this`
	 */
	forEach (callback) {
		for (let i = 0, len = this.length; i < len; ++i) {
			if (callback(this[i], i, this) === false) {
				break;
			}
		}

		return this;
	}

	/**
	 * Alias for `forEach`.
	 * @param {Function} callback
	 * @return {Object} `this`
	 */
	each (callback) {
		return this.forEach(callback);
	}

	/**
	 * Iterates over the documents in this collection and executes given callback on each document.
	 * @param {Function} callback
	 * @return {Array}
	 */
	map (callback) {
		const len = this.length;
		const res = new Array(len);

		for (let i = 0; i < len; ++i) {
			res[i] = callback(this[i], i, this);
		}

		return res;
	}

	/**
	 * Creates a new collection with all documents that pass the test implemented by the provided function.
	 * @param {Function} callback
	 * @return {Mongorite.Collection}
	 */
	filter (callback) {
		const len = this.length;
		const res = this.clone();

		for (let i = 0; i < len; ++i) {
			if (callback(this[i], i, this)) {
				res.push(this[i]);
			}
		}

		return res;
	}

	/**
	 * Returns an native array containing all document in this collection.
	 * @return {Array}
	 */
	toArray () {
		let len = this.length;
		let res = new Array(len);

		for (let i = 0; i < len; ++i) {
			res[i] = this[i];
		}

		return res;
	}

	/**
	 * Executed the native `Array.slice` method on this collection
	 * and returns a new collection with the result.
	 * @param {Mixed} args
	 * @return {Mongorite.Collection}
	 */
	slice (...args) {
		return this.clone().push([].slice.call(this, ...args));
	}

	/**
	 * Primarly for internal node.js use, formats `this` Collection as an array when logged/formatted.
	 * @param {Mixed} depth
	 * @param {Mixed} opts
	 * @return {String}
	 */
	inspect (depth, opts) {
		return this.constructor.name + ' ' + util.inspect(this.toArray(), opts).replace('[', '[\n ');
	}
}

module.exports = Collection;
