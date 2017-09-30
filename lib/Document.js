'use strict';

const util = require('util');

const Ajv = require('ajv');
const extend = require('deep-extend');
const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const {hide, Promise, obj2dot, shallowCopy} = require('./common');
const Pluggable = require('./Pluggable');

const GET_DOTNOT = {};

// Clone function build specifically for
// destroying all references for objects that
// the user has supplied to the `set` method. 
const cloneDocumentData = (function () {
	function replacer (key, val) {
		if (val === undefined) {
			return null;
		}

		return val;
	}

	return function (data) {
		return JSON.parse(JSON.stringify(data, replacer));
	};
}())


class Document extends Pluggable {
	constructor (collection) {
		super();

		hide(this, 'dataDotted', {
			changes: null,
			written: null,
			merged: {}
		});


		hide(this, 'dataRegular', {
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

		if (collection) {
			this.collection = collection;
		}	

		if (this.configure) {
			this.configure();
		}
	}

	changes (dotted=true) {
		if (dotted) {
			return this.dataDotted.changes;
		} else {
			return this.dataRegular.changes;
		}
	}

	get (includeChanges, key, sentinel) {
		const dotnot = sentinel === GET_DOTNOT;

		var res, otherKey, data = dotnot ? this.dataDotted : this.dataRegular;

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
		var data = this.dataRegular,
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

		// Convert changes into dot notation
		if (typeof key === 'string') {
			changes[key] = cloneDocumentData(val);
		} else {
			changes = cloneDocumentData(key);
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
			shallowCopy(data, changes);
		}

		return this.reindex();
	}

	/*
	set_old (asWritten, key, val) {
		const data = this.dataDotted;

		var changes = {};

		// Optional parameter 'asWritten'
		if (asWritten !== true && asWritten !== false) {
			val = key;
			key = asWritten;
			asWritten = false;
		}

		if (!key) {
			return this;
		}

		// Convert changes into dot notation
		if (typeof key === 'object') {
			changes = obj2dot(key);
		} else {
			changes[key] = cloneDocumentData(val);
		}

		// Handle case when the user has supplied an _id field,
		// which we will assume means that these are not really changes
		// but is originating from persistent storage (i.e. mongo database).
		if (asWritten || changes._id) {
			// Convert _id from string to an ObjectID instance.
			if (typeof changes._id === 'string') {
				changes._id = new ObjectID(changes._id);
			}

			// Merge the new "changes" into the written data.
			if (data.written) {
				shallowCopy(data.written, cloneDocumentData(changes));
			} else {
				data.written = changes;
			}
		}

		// Handle case when the user is adding changes to those which we already have.
		else if (data.changes) {
			// Merge these changes with the ones we already have.
			shallowCopy(data.changes, cloneDocumentData(changes));
		}

		// Handle case when we currently does not have any changes in store.
		else {
			data.changes = cloneDocumentData(changes);
		}

		return this.reindex();
	}
	*/

	unset (_local, _includeWritten, _key) {
		const argslen = arguments.length;
		const dotted = this.dataDotted;

		var otherKey,
			key, local, includeWritten;

		if (argslen === 0) {
			return this;
		}

		if (argslen === 1) {
			key = _local;
			local = false;
			includeWritten = false;
		} else if (argslen === 2) {
			key = _includeWritten;
			local = _local;
			includeWritten = false;
		} else {
			local = _local;
			includeWritten = _includeWritten;
			key = _key;
		}

		// Regular delete that sets the key for
		// unset during the next save operation.
		if (!local) {
			return this.set(key, '$unset');
		}

		// Delete local change
		if (local) {
			for (otherKey in dotted.changes) {
				if (otherKey.indexOf(key) === 0) {
					delete dotted.changes[otherKey];
				}
			}
		}

		// Delete local written data
		if (includeWritten) {
			for (otherKey in dotted.written) {
				if (otherKey.indexOf(key) === 0) {
					delete dotted.written[otherKey];
				}
			}
		}

		return this.reindex();
	}

	/*
	merge (key, ...objects) {
		
	}
	*/
	
	reindex () {
		const dotted = this.dataDotted;
		const regular = this.dataRegular;
		const types = ['written', 'changes', 'merged'];

		var i, type, key;

		// Save the merge of dirty and non-dirty
		// data into 'merged' for fast retrieval.
		dotted.merged = {};
		shallowCopy(regular.merged, regular.written, regular.changes);

		for (i = 0; i < types.length; ++i) {
			type = types[i];

			if (regular[type]) {
				dotted[type] = obj2dot(regular[type]);
			}
		}

		return this;
	}

	/*
	reindex_old () {
		const dotted = this.dataDotted;
		const regular = this.dataRegular;
		const types = ['written', 'changes', 'merged'];

		var i, type, key;

		// Save the merge of dirty and non-dirty
		// data into 'merged' for fast retrieval.
		dotted.merged = {};
		shallowCopy(dotted.merged, dotted.written, dotted.changes);

		for (i = 0; i < types.length; ++i) {
			type = types[i];

			if (dotted[type]) {
				regular[type] = {};

				for (key in dotted[type]) {
					dotProp.set(regular[type], key, dotted[type][key])
				}
			}
		}

		return this;
	}
	*/

	refresh (omitChanges) {
		const _id = this.get('_id');
		const mdbc = this.collection.mongo.collection;

		if (!_id) {
			return Promise.reject(new Error('Cannot refresh local document'));
		}
		
		return this.action('refresh', e => mdbc.findOne({_id}).then(res => {
			this.dataRegular.written = res;

			if (omitChanges) {
				this.dataRegular.changes = null;
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
			info.fields = this.dataRegular.merged;
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
		const data = this.dataRegular;

		if (data.changes) {
			if (!this.dataRegular.written) {
				this.dataRegular.written = {};
			}

			shallowCopy(this.dataRegular.written, this.dataRegular.changes);
		}

		data.changes = null;
	}

	save (force) {
		return this.collection.save(force, this);
	}

	isDirty () {
		return (this.isChanged() || !this.isSaved());
	}

	isChanged () {
		return !!this.dataDotted.changes;
	}

	isSaved () {
		return !!this.dataDotted.written;
	}

	/**
	 * Custom formatting that we'll use to produce more meaningful result than the
	 * empty `Document {}` we'd otherwise get when the user is inspecting/logging this instance.
	 *
	 * It may not be the most elegant (or fastest) solution, but it's simple.
	 * @param  {number} depth Specifies the number of times to recurse while formatting the object.
	 * @param  {object} opts  Options for the native `util.inspect` method.
	 * @return {string}       This class as a human-readable string.
	 */
	inspect (depth, opts) {
		const stg1 = {};
		const stg2 = {};
		const data = this.dataDotted;

		var key;

		if (!data.changes) {
			return this.constructor.name + ' ' + util.inspect(this.dataRegular.written, opts);
		}

		for (key in data.merged) {
			if (data.changes[key]) {
				stg1[key] = {$old: data.written[key], $new: data.changes[key]};
			} else {
				stg1[key] = data.written[key];
			}
		}

		for (key in stg1) {
			dotProp.set(stg2, key, stg1[key]);
		}

		return this.constructor.name + (this.isDirty() ? '*' : '') + ' ' + util.inspect(stg2, opts);
	}
}

module.exports = Document;