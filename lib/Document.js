'use strict';

const util = require('util');

const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const Pluggable = require('./Pluggable');
const {hide, Promise, CONST} = require('./common');

const _set = require('./Document.set');

class Document extends Pluggable {
	constructor (collection) {
		super();

		hide(this, 'data', {
			changes: null,
			written: null,
			merged: null
		});

		hide(this, 'isMongoriteDocument', true);
		hide(this, '_isSaved', false);
		hide(this, '_refs', {});
		hide(this, 'collection');

		this.set.reindex = _set.reindex;
		
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
			return this.data.changes['@@dotnot'];
		} else {
			return this.data.changes;
		}
	}

	get (includeChanges, key) {
		var data = this.data;

		// Optional parameter 'includeChanges'
		if (includeChanges !== true && includeChanges !== false) {
			key = includeChanges;
			includeChanges = true;
		}

		// Reindex the `data`-property on demand,
		// instead of doing it on each `set`-operation.
		if (includeChanges && !data.merged) {
			this.set.reindex(data);
		}

		if (includeChanges) {
			data = data.merged;
		} else {
			data = data.written;
		}

		// Retrieve everything
		if (key === undefined) {
			return data;
		}

		return data['@@dotnot'][key];
	}

	set (merge, key, val) {
		var source = {},
			asWritten = false;

		// Optional parameter 'merge'
		if (typeof merge !== 'boolean') {
			if (merge === CONST.SET_MERGE_WRITE) {
				merge = true;
				asWritten = true;
			} else if (merge === CONST.SET_WRITE) {
				merge = false;
				asWritten = true;
			} else {
				val = key;
				key = merge;
				merge = false;
			}
		}

		// Normalize changes
		if (typeof key !== 'string') {
			source = key;
		} else {
			source[key] = val;
		}

		if (!key) {
			return this;
		}
		
		_set(asWritten, merge, this.data, source);

		return this;
	}

	unset (persistentStorage, key) {
		// Optional `persistentStorage`
		if (!key) {
			key = persistentStorage;
			persistentStorage = false;
		}

		const data = this.data;
		var isEmpty = true;

		// Return early if the user did not supply a key
		// or if the user is removing a previously made change
		// and we do not have any changes stored.
		if (!key || (!persistentStorage && !data.changes)) {
			return this;
		}

		// Unset previously made change
		if (!persistentStorage) {
			dotProp.delete(data.changes, key);
			data.merged = null;

			// Set `changes` to null if it's now empty
			for (key in data.changes) {
				isEmpty = false;
				break;
			}

			if (isEmpty) {
				data.changes = null;
			}

			return this;
		}

		// Mark for $unset db command
		return this.set(key, '$unset');
	}

	refresh (omitChanges) {
		const _id = this.get('_id');
		const mdbc = this.collection.mongo.collection;

		if (!_id) {
			return Promise.reject(new Error('Cannot refresh local document'));
		}
		
		return this.action('refresh', e => mdbc.findOne({_id}).then(res => {
			this.data.written = null;
			this.set(CONST.SET_WRITE, res);

			if (omitChanges) {
				this.data.changes = null;
			}
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
			info.fields = this.data.written['@@dotnot'];
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
			info.fields = this.get();
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
		const data = this.data;

		if (data.changes) {

			this.set(CONST.SET_MERGE_WRITE, data.changes)
			//this.merge(SET_MERGE_WRITE, data.changes)

			data.changes = null;
		}
	}

	save (force) {
		return this.collection.save(force, this);
	}

	isDirty () {
		return !!this.data.changes;
	}

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
		const dtns = '@@dotnot';

		// "Manual" doc.inspect();
		if (arguments.length < 2) {
			return console.log(util.inspect(this, depth || {colors: true, breakLength: 0, depth: depth}));
		}

		const stg1 = {};
		const stg2 = {};

		const nested = this.data;

		const changes = (this.data.changes || {})[dtns];
		const written = (this.data.written || {})[dtns];
		const merged = (this.data.merged || {})[dtns];

		const oldKey = 'HeZLVYlEnIiGECo6bWe8TqlfuEj2HfrwSt9SqFwF';
		const newKey = 'PDH6rnMFKT57bR4tO6ewjLlONhlfbUKgCoyBFlPa';
		const nulKey = 'HpOc8hceKog5ot01ykrhlf3hPqoWQqM5WTb5K86p';

		const oldRe = new RegExp(oldKey, 'g');
		const newRe = new RegExp(newKey, 'g');
		const nulRe = new RegExp("'" + nulKey + "'", 'g');

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