'use strict';

const util = require('util');

const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const Pluggable = require('./Pluggable');
const {hide, Promise, CONST} = require('./common');

const _set = require('./Document.set');

const memdb = require('./memdb/Database');
const dotbox = require('dotbox');

const flags = {
	FLAG_DEEP: 1,
	FLAG_AS_WRITTEN: 2,
	FLAG_NO_CLONE: 3,
};

/**
 * Base Document.
 */
class Document extends Pluggable {
	/**
	 * Constructor.
	 * @param {Mongorite.Collection} collection
	 */
	constructor (collection) {
		super();

		this.data = dotbox.createDocument();
		// hide(this, 'data', data);

		hide(this, 'isMongoriteDocument', true);
		hide(this, '_isSaved', false);
		hide(this, '_refs', {});
		hide(this, 'collection');

		// this.set.reindex = _set.reindex;

		if (collection) {
			this.collection = collection;
		}

		if (this.configure) {
			this.configure();
		}
	}

	/**
	 * A shorthand for retrieving the _id property.
	 */
	get id () {
		return this.get('_id');
	}

	/**
	 * Helper property to identify this constructor as a mongorite Document.
	 */
	static get isMongoriteDocument () {
		return true;
	}

	/**
	 * Returns all changes made on this document.
	 * @param {Boolean} dotted If TRUE, returns the changes using dot notation. Otherwise as a nested plain object.
	 * @param {Boolean} flatten
	 * @return {Object}
	 */
	changes () {
		return dotbox.dereference(this.data.changes);
	}

	/**
	 * Alias for `this.data.get()`
	 * @return {Mixed}
	 */
	get (...args) {
		return this.data.get(...args);
	}

	/**
	 * Alias for `this.data.set()`
	 * @return {Document} `this`
	 */
	set (...args) {
		this.data.set(...args);
		return this;
	}

	/**
	 * TODO.
	 * @param {Boolean} persistentStorage
	 * @param {String|ObjectID} key
	 * @return {Document} `this`
	 */
	unset (persistentStorage, key) {
		// Optional `persistentStorage`
		if (!key) {
			key = persistentStorage;
			persistentStorage = false;
		}

		const data = this.data;

		// Return early if the user did not supply a key
		// or if the user is removing a previously made change
		// and we do not have any changes stored.
		if (!key || (!persistentStorage && !data.changes)) {
			return this;
		}

		// Unset previously made change
		if (!persistentStorage) {
			data.unset(key);

			return this;
		}

		// Mark for $unset db command
		return this.set(key, '$unset');
	}

	/**
	 * Fetches the document with this '_id' and replaces
	 * the information this document currently holds.
	 * @param {Boolean} omitChanges If TRUE; all unsaved changes will be discarded.
	 * @return {Document} `this`
	 */
	refresh (omitChanges) {
		const _id = this.get('_id');
		const mdbc = this.collection.mongo.collection;

		if (!_id) {
			return Promise.reject(new Error('Cannot refresh local document'));
		}

		return this.action('refresh', e => mdbc.findOne({_id}).then(res => {
			this.data.written = null;
			this.data.merged = null;
			this.set(dotbox.WRITE, res);

			if (omitChanges) {
				this.data.changes = null;
			}
		}));
	}

	/**
	 * TODO.
	 * @param {Boolean} force
	 * @return {Object}
	 */
	_generateWriteOperation (force) {
		const _id = this.get('_id');
		const info = {};
		const isSaved = this.isSaved();
		const isDirty = this.isDirty();

		if (!isDirty) {
			if (!force) {
				// Non-forced save of non-dirty documents.
				// We'll call it an update with no fields (changes).
				info.fields = {};
				info.method = 'update';
				return info;
			}

			// Forced save of non-dirty document. Use the written data as "changes".
			info.fields = this.get(false); // this.data.written['@@dotnot'];
			info.method = 'update';
		} else if (isSaved) {
			// Dirty but saved document. Update.
			info.method = 'update';
			info.fields = this.data.changes; // this.changes(true, true);
		} else {
			// Dirty and unsaved document. Insert.
			// Create an _id if the user hasn't.
			if (!this.get('_id')) {
				this.set('_id', new ObjectID());
			}

			info.method = 'insert';
			info.fields = this.data.changes;
		}

		// We'll hide the mongodb-specific 'bulkWrite' `operation`.
		// Can't see how this is would be interesting in most cases.
		hide(info, 'operation', {});

		if (info.method === 'insert') {
			info.operation = {
				insertOne: {document: info.fields}
			};
		} else if (info.method === 'update') {
			info.query = {_id};
			info.options = {
				upsert: false,
				multi: false
			};

			info.operation = {
				updateOne: {
					filter: info.query,
					update: {$set: info.fields},
					upsert: !!info.options.upsert
				}
			};
		}

		return info;
	}

	/**
	 * Internal method that merges all set changes with
	 * the 'written' data on this document.
	 */
	_pullChanges () {
		this.data.save();
	}

	/**
	 * Saves this document to the database.
	 * @param {Boolean} [throwOnError=false] If TRUE; throws if an write error occurs.
	 * @param {Boolean} [force=false] If TRUE; the document is saved even if it isn't dirty.
	 * @return {Object}
	 */
	save (throwOnError, force) {
		return this.collection.save(force, (throwOnError === undefined || throwOnError), this, new Error());
	}

	/**
	 * Returns TRUE if this document has unsaved changes. Otherwise FALSE.
	 * @return {Boolean}
	 */
	isDirty () {
		return !!this.data.changes;
	}

	/**
	 * Returns TRUE if this document has been saved to the database. Otherwise FALSE.
	 * @return {Boolean}
	 */
	isSaved () {
		return !!this.data.written;
	}

	/**
	 * Custom formatting that we'll use to produce more meaningful result than the
	 * empty `Document {}` we'd otherwise get when the user is inspecting/logging this instance.
	 *
	 * @param  {number} depth Specifies the number of times to recurse while formatting the object.
	 * @param  {object} opts  Options for the native `util.inspect` method.
	 * @return {string}       This class as a human-readable string.
	 */
	inspect (depth, opts) {
		return JSON.stringify(this.data.get(), null, '\t');
	}
}

module.exports = Document;
