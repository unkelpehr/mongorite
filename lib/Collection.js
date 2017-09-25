'use strict';

const util = require('util');

const Ajv = require('ajv');
const pluralize = require('pluralize');

const Query = require('./Query');
const Database = require('./Database');
const Document = require('./Document');
const Pluggable = require('./Pluggable');

const {Promise, hide, hr2ms} = require('./common');

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

		hide(this, '_refs', {
			Document,
			Collection: this.constructor,
			collection: this,
			database: Database.dummy,
			mongoCollection: null,

			ajv: {
				schema: null,
				options: {}, // https://www.npmjs.com/package/ajv#options
				validate: null
			}
		});

		if (arguments.length) {
			this.db = db;
		}

		if (typeof this.configure === 'function') {
			this.configure();
		}

		after();
	}

	get db () {
		return this._refs.database;
	}

	set db (db) {
		const after = this.dispatchEvent('db', {db});

		if (!(db instanceof Database)) {
			throw new TypeError(`Expected \`db\` to be an instance of mongorite.Database, got ${typeof db}`);
		}
		
		// Delete this setter/getter
		delete this.db;

		// Redefine property as normal
		hide(this, 'db', db);

		this._refs.database = this.db;

		if (this.db.state === Database.STATE_CONNECTED) {
			this._refs.mongoCollection = this.db.getCollection(this.name);
		}

		return after();
	}

	get Document () {
		return this._refs.Document;
	}

	set Document (Document) {
		return this.dispatchEvent('Document', {Document})(e => {
			this._refs.Document = Document;
		});
	}

	/*
		return this.dispatchEvent('Document', {Document})(e => {
			Object.defineProperty(this, 'Document', {
				configure: true,
				writable: true,
				enumerable: false,
			    value: e.Document
			});
		});
	 */

	get query () {
		if (!this._refs.mongoCollection) {
			this._refs.mongoCollection = this.db.getCollection(this.name);
		}

		return new Query(this);
	}

	save () {
		if (!this._refs.mongoCollection) {
			this._refs.mongoCollection = this.db.getCollection(this.name);
		}

		const mdbc = this._refs.mongoCollection;
		const operations = [];
		const validationErrors = new Map();

		this.each(doc => {
			let op, validationError = doc.validate();

			if (validationError) {
				return validationErrors.set(doc, validationError);
			}

			op = doc._generateWriteOperation();

			if (op.operation) {
				operations.push(op.operation);
			}
		});

		if (!operations.length && validationErrors.size) {
			return Promise.reject(Object.assign(new Error(
				`Could not save collection - none of the ${this.length} document(s) passed validation.\n` +
				`Check the 'validationErrors' map property on this error object for details.`
			), {validationErrors}));
		}

		const ops = this.map(doc => doc._generateWriteOperation());
		const after = this.dispatchEvent('save', ops);

		return mdbc.bulkWrite(operations, this.options.bulkWrite).then(res => {
			this.each(doc => doc._pullChanges());

			res.collection = this;
			res.operations = operations;

			after(e => e.data.res = res);

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

	/**
	 * Validates the json-schema attached to this collection.
	 * If no schema is attached, this method will always return `null`.
	 *
	 * @param      {(array|Collection)}  documents     Collection of `document` to validate.
	 * @returns    {(null|TypeError)}                  Returns `null` if no errors were found and and `TypeError` instance containing
	 *                                                 the validation errors if one or more `documents` did not pass validation.
	 */
	validate (documents) {
		var result = new Map();

		this.each(doc => {
			const errors = doc.validate();

			if (errors) {
				result.set(doc, errors);
			}
		});

		return result.size ? result : null;
	}

	// Primarly for internal node.js use, formats `this` Collection as an array when logged/formatted.
	inspect (depth, opts) {
		return this.constructor.name + ' ' + util.inspect(this.toArray(), opts).replace('[', '[\n ');
	}

	// Returns a new instance of `this` that inherits all own properties.
	clone (keepDocuments) {
		const clone = new this.constructor();
		const props = Object.getOwnPropertyNames(this);

		for (let i = 0; i < props.length; ++i) {
			if ((keepDocuments || isNaN(props[i]))) {
				clone[props[i]] = this[props[i]];
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
		const Document = this._refs.Document;

		for (let i = 0; i < arguments.length; ++i) {
			let arg = arguments[i];

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