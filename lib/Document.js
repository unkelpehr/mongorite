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

	changes () {
		return this.data.changes;
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
		const _id = this.get(false, '_id');
		const mdbc = this.collection.mongo.collection;

		if (!_id) {
			return Promise.reject(new Error('Cannot refresh local document'));
		}

		return this.action('refresh', e => mdbc.findOne({_id}).then(res => {
			this.data.written = res || {};
			return this;
		}));
	}

	delete () {

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
			info.fields = this.get(false);
			info.method = 'update';
		} else if (isSaved) {
			// Dirty but saved document. Update.
			info.method = 'update';
			info.fields = this.changes();
		} else {
			// Dirty and unsaved document. Insert.
			// Create an _id if the user hasn't.
			if (!this.data.merged._id) {
				this.data.merged._id = new ObjectID();
				this.data.changes._id = this.data.merged._id;
			}

			info.method = 'insert';
			info.fields = this.data.merged;
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

	_pullChanges (changes) {
		extend(this.data.written, (changes || this.data.changes || {}));
		//Object.assign(this.data, (changes || this.changes() || {}));
		this.data.changes = null;
	}

	save (force) {
		return this.collection.save(force, this);
	}

	isDirty () {
		return (this.isChanged() || !this.isSaved());
	}

	isChanged () {
		return !!this.data.changes;
	}

	isSaved () {
		return !!this.get(false, '_id');
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