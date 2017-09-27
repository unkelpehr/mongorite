'use strict';

const util = require('util');

const Ajv = require('ajv');
const pluralize = require('pluralize');

const Query = require('./Query');
const Database = require('./Database');
const Document = require('./Document');
const Pluggable = require('./Pluggable');

const {Promise, hide} = require('./common');

class Collection extends Pluggable {
	constructor (db) {
		super();

		const after = this.dispatchEvent('construct', {db});

		// Public
		var name;
		name = this.constructor.name.replace(/Collection$/i, '');
		name = name.charAt(0).toLowerCase() + name.substr(1); // We'll use .charAt instead of brackets if the name is empty.
		name = pluralize(name);

		hide(this, 'name', name);
		hide(this, 'length', 0);
		hide(this, 'isMongoriteCollection', true);

		hide(this, 'options', {
			collection: {}, // https://mongodb.github.io/node-mongodb-native/api-generated/db.html#collection
			bulkWrite: { ordered: false } // https://docs.mongodb.com/manual/reference/method/db.collection.bulkWrite/#db.collection.bulkWrite
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

	static get Document () {
		return Document;
	}

	get mongo () {
		if (!this._mongo.db) {
			if (this.db.state !== Database.STATE_CONNECTED) {
				// throw?
			}

			this._mongo.db = this.db._connection;
			this._mongo.collection = this.db.getCollection(this.name);
		}
		
		return this._mongo;
	}

	get Document () {
		return this.constructor.Document;
	}

	get query () {
		return new Query(this);
	}

	save () {
		const mdbc = this.mongo.collection;

		const full_ops = [];
		const operations = [];

		this.each(doc => {
			const op = doc._generateWriteOperation();

			if (op.operation) {
				full_ops.push(op);
				operations.push(op.operation);
			}
		});

		/*
		const eventObject = {
			operations: operations,
			options: this.options.bulkWrite
		};

		return this.action('save,bulkSave', eventObject)
			.then(e => mdbc.bulkWrite(e.operations, e.options))
			.then(e => res => {
				this.each(doc => doc._pullChanges());

				res.collection = this;
				res.operations = operations;

				dispatch.after(e => e.data.res = res);

				return res;
			});*/

		const dispatch = this.dispatchEvent('save', full_ops);

		if (dispatch.error) {
			return Promise.reject(dispatch.error);
		}

		return mdbc.bulkWrite(operations, this.options.bulkWrite).then(res => {
			this.each(doc => doc._pullChanges());

			res.collection = this;
			res.operations = operations;

			dispatch.after(e => e.data.res = res);

			return res;
		});
	}
	
	refresh () {
		return Promise.all(this.map(doc => doc.refresh()));
	}

	get (key) {
		return this.map(doc => doc.get(key));
	}

	set (...args) {
		return this.map(doc => doc.set(...args));
	}

	// Primarly for internal node.js use, formats `this` Collection as an array when logged/formatted.
	inspect (depth, opts) {
		return this.constructor.name + ' ' + util.inspect(this.toArray(), opts).replace('[', '[\n ');
	}

	// Returns a new instance of `this` that inherits all own properties.
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

	// Removes the last Document from this collection and returns that Document.
	pop () {
		let element;

		if (this.length > 0) {
			element = this[this.length - 1];
			delete this[this.length - 1];
			this.length -= 1;
		}

		return element;
	}

	//  Removes the first Document from this collection and returns that Document.
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

	// Adds one or more documents to the end of this collection and returns `this`.
	// Supports a mix of array, object and Document arguments.
	push () {
		const Document = this.Document;

		for (let i = 0; i < arguments.length; ++i) {
			var arg = arguments[i];

			if (!arg) {
				continue;
			}

			if (!arg.isMongoriteCollection && !Array.isArray(arg)) {
				this[this.length++] = arg.isMongoriteDocument ? arg : (new Document(this)).set(arg);
				continue;
			}

			for (let i = 0; i < arg.length; ++i)  {
				if (arg[i]) {
					this[this.length++] = arg[i].isMongoriteDocument ? arg[i] : (new Document(this)).set(arg[i]);
				}
			}
		}

		return this;
	}


	// Executes a provided function (`callback`) once for each document in this collection.
	forEach (callback) {
		for (let i = 0, len = this.length; i < len; ++i) {
			if (callback(this[i], i, this) === false) {
				break;
			}
		}

		return this;
	}

	// Alias for `forEach`
	each (callback) {
		return this.forEach(callback);
	}

	map (callback) {
		return [].map.call(this, callback);
	}

	// Creates a new collection with all documents that pass the test implemented by the provided function.
	filter (callback) {
		return this.clone().push([].filter.call(this, callback));
	}

	// Returns an native array containing all document in this collection.
	toArray () {
		return [].slice.call(this);
	}

	slice (...args) {
		return this.clone().push([].slice.call(this, ...args));
	}
}

module.exports = Collection;