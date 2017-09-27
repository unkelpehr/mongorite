'use strict';

const util = require('util');

const Ajv = require('ajv');
const extend = require('deep-extend');
const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const {hide, Promise} = require('./common');
const Pluggable = require('./Pluggable');

const EMSG_INVALID = 'Could not save document - it did not pass schema validation.\nCheck the `validationErrors` property on this error object for details.';

class Document extends Pluggable {
	constructor (collection) {
		super();

		hide(this, 'data', {
			changes: null,
			written: {},
			merged: {}
		});

		hide(this, 'changes');
		hide(this, 'isMongoriteDocument', true);
		hide(this, '_isSaved', false);
		hide(this, '_refs', {});
		hide(this, 'collection');

		if (collection) {
			this.collection = collection;
		}	

		if (this.configure) {
			this.configure();
		}
	}

	get (includeChanges, key) {
		var data;

		// Optional parameter 'includeChanges'
		if (includeChanges !== true && includeChanges !== false) {
			key = includeChanges;
			includeChanges = true;
		}

		if (includeChanges) {
			data = this.data.merged;
		} else {
			data = this.data.written;
		}

		if (key == null) {
			return data;
		}

		return dotProp.get(data, key);
	}

	set (key, val) {
		var changes = {};
		var target;

		if (!key) {
			return this;
		}

		if (typeof key !== 'object') {
			dotProp.set(changes, key, val);
		} else {
			changes = key;
		}

		if (changes._id) {
			if (typeof changes._id === 'string') {
				changes._id = new ObjectID(changes._id);
			}

			target = 'written';
		} else {
			if (!this.data.changes) {
				this.data.changes = {};
			}

			target = 'changes';
		}

		extend(this.data[target], changes);

		this.data.merged = {};
		
		if (this.data.changes) {
			extend(this.data.merged, this.data.written, this.data.changes);
		} else {
			this.data.merged = this.data.written;
		}

		return this;
	}

	refresh () {
		const _id = this.get('_id');
		const mdbc = this.collection.mongo.collection;

		if (!this.isSaved()) {
			return Promise.reject(new Error('Cannot refresh local document'));
		}

		return mdbc.findOne({_id}).then(res => {
			this.data = res || {};
			return Promise.resolve(this.data);
		});
	}

	delete () {

	}

	_generateWriteOperation (force) {
		const _id = this.get('_id');
		const info = {operation: null};
		const isSaved = this.isSaved();
		const isDirty = this.isDirty();

		const after = this.dispatchEvent('before', 'writeOperation', {_id, force, isSaved, isDirty});

		if (!isDirty) {
			if (!force) {
				return info; // Non-forced save of non-dirty documents.
			}

			// Forced save of non-dirty document. Use the data property as "changes".
			info.changes = this.data;
			info.method = 'update';
		} else if (isSaved) {
			// Dirty but saved document. Update.
			info.method = 'update';
			info.changes = this.changes;
		} else {
			// Dirty and unsaved document. Insert.
			info.method = 'insert';
			info.changes = Object.assign({}, this.data, this.changes);
			//info.changes = extend({}, this.data, this.changes);

			if (!info.changes._id) {
				this.changes._id = info.changes._id = new ObjectID();
			}
		}

		info.operation = {};

		if (info.method === 'insert') {
			info.operation = {
				insertOne: { document: info.changes }
			};
		} else if (info.method === 'update') {
			info.query = {_id};
			info.fields = {$set: info.changes};
			info.options = {
				upsert: false,
				multi: false
			};

			info.operation = {
				updateOne: {
					filter: info.query,
					update: info.fields,
					upsert: !!info.options.upsert
				}
			};
		}

		return after(e => {
			e.data.info = info;
			return info;
		});
	}

	_pullChanges (changes) {
		//extend(this.data, (changes || this.changes || {}));
		Object.assign(this.data, (changes || this.changes || {}));
		this.changes = null;
	}

	save (force) {
		const info = hide(this._generateWriteOperation(force), 'originalResolvedValue');
		const mdbc = this.collection.mongo.collection;

		let promise;

		if (info.method === 'insert') {
			promise = mdbc.insertOne(info.changes);
		} else if (info.method === 'update') {
			promise = mdbc.update(info.query, info.fields, info.options);
		} else {
			promise = Promise.resolve({}); // Not dirty, not forced.
		}

		return promise.then((res) => {
			info.originalResolvedValue = res;

			this._pullChanges(info.changes);

			return info;
		});
	}

	isDirty () {
		return (this.isChanged() || !this.isSaved());
	}

	isChanged () {
		return !!this.data.changes;
	}

	isSaved () {
		return !!this.get('_id');
	}

	inspect (depth, opts) {
		return this.constructor.name + ' ' + util.inspect({
			data: {
				written: this.data.written,
				changes: this.data.changes
			}
		}, opts);
	}
}

module.exports = Document;


/*

{ changes: { last_name: 'Gordon2' },
  written:
   { _id:
      { _bsontype: 'ObjectID',
        id: <Buffer 59 ca 5a ab 09 2c a0 2e ec 0a 34 8c> },
     first_name: 'Flash',
     last_name: 'Gordon' },
  merged:
   { _id:
      { _bsontype: 'ObjectID',
        id: <Buffer 59 ca 5a ab 09 2c a0 2e ec 0a 34 8c> },
     first_name: 'Flash',
     last_name: 'Gordon2' } }


 */