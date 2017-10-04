'use strict';

const util = require('util');

const Ajv = require('ajv');
const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const {hide, Promise, obj2dot, merge} = require('./common');
const Pluggable = require('./Pluggable');

const GET_DOTNOT = {};
const UNSET_CHANGE = {};
const SET_WRITE = {};
const SET_MERGE_WRITE = {};

const CONST = Object.freeze({
	GET_DOTNOT: {},
	UNSET_CHANGE: {},
	SET_WRITE: {},
	SET_MERGE_WRITE: {}
});

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const transform = (function () {
	function mergeable (val) {
		const str = Object.prototype.toString.call(val);

		return (
			val &&
			typeof val === 'object' &&
			val.id === undefined && // Is this sufficient enough or should we check if it's and instance of ObjectID?
			str !== '[object RegExp]' &&
			str !== '[object Date]'
		);
	}

	// Clone changes
	return function walk (target, source, dotnot, prefix) {
		var key,
			dot,
			sourceVal,
			targetVal;

		if (!dotnot) {
			if (!target['@@dotnot']) {
				hide(target, '@@dotnot', {});
			}

			dotnot = target['@@dotnot'];
		}

		for (key in source) {
			sourceVal = source[key];
			targetVal = target[key];

			dot = (prefix ? prefix + '.' + key : key);

			if (Array.isArray(sourceVal)) {
				dotnot[dot] = target[key] = sourceVal; // Clone array
			} if (!mergeable(sourceVal)) {
				dotnot[dot] = target[key] = sourceVal; // Source not mergeable - leaf - regular copy
			} else if (mergeable(targetVal)) {
				walk(targetVal, sourceVal, dotnot, dot); // Target and source mergeable, merge `source` into `target`
			} else {
				dotnot[dot] = target[key] = walk({}, sourceVal, dotnot, dot); // Target not mergeable, source is, clone source into `target`
			}

		}

		return target;
	};
}());

class Document extends Pluggable {
	constructor (collection) {
		super();

		hide(this, 'dataDotted', {
			changes: null,
			written: null,
			merged: {}
		});

		hide(this, 'data', {
			changes: null,
			written: null,
			merged: null
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

		this.get.changes = () => {
			return this.data.changes;
		};

		this.unset.change = (key) => {
			return this.unset(key, CONST.UNSET_CHANGE);
		};

		if (collection) {
			this.collection = collection;
		}	

		if (this.configure) {
			this.configure();
		}
	}

	get CONST () {
		return CONST;
	}

	static get CONST () {
		return CONST;
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

	// Apparently it HAS TO return `this` - check why
	set (merge, key, val) {
		var data = this.data,
			dtns = '@@dotnot',
			target,
			source = {},
			absolutePath,
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

		// Normalize key/val into `source`
		//if (typeof key !== 'string') {
		//	source = key;
		//} else {
		//	source[key] = val;
		//}

		// Normalize changes
		if (typeof key !== 'string') {
			source = key;
		} else {
			absolutePath = key.indexOf('.') !== -1;

			if (absolutePath) {
				dotProp.set(source, key, val);
			} else {
				source[key] = val;
			}
		}

		if (!key) {
			return this;
		}

		// Empty the written/changes merge as it's soon to be outdated.
		data.merged = null;

		if (merge) {
			// Reference target (written data or staged for save)
			if (asWritten) {
				transform(data.written || (data.written = {}), source);
			} else {
				transform(data.changes || (data.changes = {}), source);
			}

			return this;
		}

		transform(target = {}, source);

		
		if (asWritten) {
			if (!data.written) {
				data.written = hide({}, dtns, {});
			}

			if (absolutePath) {
				dotProp.set(data.written, key, target[dtns][key]);
				dotProp.set(data.written[dtns], key, target[dtns][key]);
			} else {
				Object.assign(data.written, target);
				Object.assign(data.written[dtns], target[dtns]);
			}
		} else {
			if (!data.changes) {
				data.changes = hide({}, dtns, {});
			}

			if (absolutePath) {
				dotProp.set(data.changes, key, target[dtns][key]);
				dotProp.set(data.changes[dtns], key, target[dtns][key]);
			} else {
				Object.assign(data.changes, target);
				Object.assign(data.changes[dtns], target[dtns]);
			}
		}


		return this;
	}

	get (includeChanges, key, sentinel) {
		const dotnot = sentinel === CONST.GET_DOTNOT;

		var res,
			otherKey,
			data = this.data;

		// Optional parameter 'includeChanges'
		if (includeChanges !== true && includeChanges !== false) {
			key = includeChanges;
			includeChanges = true;
		}

		// 
		if (includeChanges && !data.merged) {
			data.merged = hide({}, '@@dotnot', {});
			transform(data.merged, data.written, data.merged['@@dotnot']);
			transform(data.merged, data.changes, data.merged['@@dotnot']);
		}

		// 
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

	unset (key, sentinel) {
		const data = this.data;
		const change = sentinel === CONST.UNSET_CHANGE;

		var isEmpty = true;

		if (!key || (change && !data.changes)) {
			return this;
		}

		// Unset previously made change
		if (change) {
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