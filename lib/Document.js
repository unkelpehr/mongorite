'use strict';

const util = require('util');

const Ajv = require('ajv');
const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const {hide, Promise, obj2dot, merge} = require('./common');
const Pluggable = require('./Pluggable');

const GET_DOTNOT = {};
const UNSET_CHANGE = {};

class Document extends Pluggable {
	constructor (collection) {
		super();

		hide(this, 'dataDotted', {
			changes: null,
			written: null,
			merged: {}
		});


		hide(this, 'dataNested', {
			changes: null,
			written: null,
			merged: {}
		});

		hide(this, 'isMongoriteDocument', true);
		hide(this, '_isSaved', false);
		hide(this, '_refs', {});
		hide(this, 'collection');

		// Create the subproperty method 'dotted' on the 'get'
		// method for retrieving this document`s data in dot notation.
		// I.e. `user.get.dotted('user.sessions')`
		this.get.dotted = (includeChanges, key) => {
			return this.get(includeChanges, key, GET_DOTNOT);
		};

		this.get.changes = () => {
			return this.dataNested.changes;
		};

		this.unset.change = (key) => {
			return this.unset(key, UNSET_CHANGE);
		};

		if (collection) {
			this.collection = collection;
		}	

		if (this.configure) {
			this.configure();
		}
	}

	static get isMongoriteDocument () {
		return true;
	}

	changes (dotted=true) {
		if (dotted) {
			return this.dataDotted.changes;
		} else {
			return this.dataNested.changes;
		}
	}

	get (includeChanges, key, sentinel) {
		const dotnot = sentinel === GET_DOTNOT;

		var res, otherKey, data = dotnot ? this.dataDotted : this.dataNested;

		// Optional parameter 'includeChanges'
		if (includeChanges !== true && includeChanges !== false) {
			key = includeChanges;
			includeChanges = true;
		}

		// Retrieve everything
		if (key === undefined) {
			return includeChanges ? data.merged : data.written;
		}

		if (includeChanges) {
			data = data.merged;
		} else {
			data = data.written;
		}

		if (!data) {
			return;
		}

		if (dotnot) {
			res = {};

			for (otherKey in data) {
				if (otherKey.indexOf(key) === 0) {
					res[otherKey] = data[otherKey];
				}
			}

			return res;
		}

		// If the key exists in the dottedData,
		// use that instead of dotProp for better performance.
		return this.dataDotted[key] || dotProp.get(data, key);
	}

	set (asWritten, key, val) {
		var data = this.dataNested,
			changes = {};

		// Optional parameter 'asWritten'
		if (asWritten !== true && asWritten !== false) {
			val = key;
			key = asWritten;
			asWritten = false;
		}

		if (!key) {
			return this;
		}

		// Normalize changes
		if (typeof key === 'string') {
			changes[key] = merge(true, val);
		} else {
			changes = merge(true, key);
			key = null;
		}

		// Convert _id from string to an ObjectID instance.
		if (typeof changes._id === 'string') {
			changes._id = new ObjectID(changes._id);
		}

		if (asWritten) {
			data = data.written = (data.written || {});
		} else {
			data = data.changes = (data.changes || {});
		}

		if (key && key.indexOf('.') !== -1) {
			dotProp.set(data, key, changes[key]);
		} else {
			merge(data, changes);
		}

		return this.reindex();
	}

	unset (key, sentinel) {
		const data = this.dataNested;
		const change = sentinel === UNSET_CHANGE;

		var isEmpty = true;

		if (!key || (change && !data.changes)) {
			return this;
		}

		// Unset previously made change
		if (change) {
			dotProp.delete(data.changes, key);

			// Set `changes` to null if it's now empty
			for (key in data.changes) {
				isEmpty = false;
				break;
			}

			if (isEmpty) {
				data.changes = null;
			}

			return this.reindex();
		}

		// Mark for $unset db command
		return this.set(key, '$unset').reindex();
	}

	/*
	merge (key, ...objects) {
		
	}
	*/
	
	reindex () {
		const dotted = this.dataDotted;
		const nested = this.dataNested;
		const types = ['written', 'changes', 'merged'];

		var i, type, key;

		// Save the merge of dirty and non-dirty
		// data into 'merged' for fast retrieval.
		nested.merged = {};
		merge(nested.merged, nested.written, nested.changes);

		dotted.merged = dotted.written = dotted.changes = null;

		for (i = 0; i < types.length; ++i) {
			type = types[i];

			if (nested[type]) {
				dotted[type] = obj2dot(nested[type]);
			}
		}

		return this;
	}

	refresh (omitChanges) {
		const _id = this.get('_id');
		const mdbc = this.collection.mongo.collection;

		if (!_id) {
			return Promise.reject(new Error('Cannot refresh local document'));
		}
		
		return this.action('refresh', e => mdbc.findOne({_id}).then(res => {
			this.dataNested.written = res;

			if (omitChanges) {
				this.dataNested.changes = null;
			}

			return this.reindex();
		}));
	}

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
			info.fields = this.dataDotted.written;
			info.method = 'update';
		} else if (isSaved) {
			// Dirty but saved document. Update.
			info.method = 'update';
			info.fields = this.changes();
		} else {
			// Dirty and unsaved document. Insert.
			// Create an _id if the user hasn't.
			if (!this.get('_id')) {
				this.set('_id', new ObjectID());
			}

			info.method = 'insert';
			info.fields = this.dataNested.merged;
		}

		// We'll hide the mongodb-specific 'bulkWrite' `operation`.
		// Can't see how this is would be interesting in most cases.
		hide(info, 'operation', {});
		
		if (info.method === 'insert') {
			info.operation = {
				insertOne: { document: info.fields }
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

	_pullChanges () {
		const data = this.dataNested;

		if (data.changes) {
			if (!this.dataNested.written) {
				this.dataNested.written = {};
			}

			merge(true, this.dataNested.written, this.dataNested.changes);

			data.changes = null;
		}

		this.reindex();
	}

	save (force) {
		return this.collection.save(force, this);
	}

	isDirty () {
		return !!this.dataNested.changes;
	}

	isSaved () {
		return !!this.dataNested.written;
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
		// "Manual" doc.inspect();
		if (arguments.length < 2) {
			return console.log(util.inspect(this, depth || {colors: true, breakLength: 0, depth: depth}));
		}

		const stg1 = {};
		const stg2 = {};

		const nested = this.dataNested;

		const changes = this.dataDotted.changes;
		const written = this.dataDotted.written;
		const merged = this.dataDotted.merged;

		const oldKey = 'HeZLVYlEnIiGECo6bWe8TqlfuEj2HfrwSt9SqFwF';
		const newKey = 'PDH6rnMFKT57bR4tO6ewjLlONhlfbUKgCoyBFlPa';
		const nulKey = 'HpOc8hceKog5ot01ykrhlf3hPqoWQqM5WTb5K86p';

		const oldRe = /HeZLVYlEnIiGECo6bWe8TqlfuEj2HfrwSt9SqFwF/g;
		const newRe = /PDH6rnMFKT57bR4tO6ewjLlONhlfbUKgCoyBFlPa/g;
		const nulRe = /'HpOc8hceKog5ot01ykrhlf3hPqoWQqM5WTb5K86p'/g;

		var key;

		function format (obj) {
			const c = !!opts.colors;

			const r = util.inspect(obj, opts)
				.replace(oldRe, opts.stylize('old', 'special'))
				.replace(newRe, opts.stylize('new', 'special'))
				.replace(nulRe, opts.stylize('nothing', 'special'));

			return r;
		}

		// No `changes` => format `written`
		if (!nested.changes) {
			return this.constructor.name + ' ' + util.inspect(nested.written || {}, opts);
		}

		// Got `changes` but nothing `written` => format `changes`
		if (!nested.written) {
			for (key in nested.changes) {
				stg2[key] = {};
				stg2[key][oldKey] = nulKey;
				stg2[key][newKey] = nested.changes[key];
			}
			
			return this.constructor.name + '*  ' + format(stg2);
		}

		// Got `changes` and `written` => format diff
		for (key in merged) {
			if (changes[key]) {
				stg2[key] = {};
				stg2[key][oldKey] = (key in written) ? written[key] : nulKey;
				stg2[key][newKey] = changes[key];
			} else {
				stg1[key] = written[key];
			}
		}

		for (key in stg1) {
			dotProp.set(stg2, key, stg1[key]);
		}

		return this.constructor.name + (this.isDirty() ? '*' : '') + ' ' + format(stg2);
	}
}

module.exports = Document;