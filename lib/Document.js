'use strict';

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

		this.data = {};

		hide(this, 'changes');
		hide(this, 'isMongoriteDocument', true);
		hide(this, '_isSaved', false);
		hide(this, '_refs', {});

		if (collection) {
			this.collection = collection;
		}	

		if (this.configure) {
			this.configure();
		}
	}

	get (key) {
		if (key == null) {
			return this.data;
		}

		return dotProp.get(this.data, key);
	}

	set (key, val) {
		let changes = {};

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
				changes._id = ObjectID(changes._id);
			}

			this.data = extend({}, changes);
		} else {
			if (!this.changes) {
				this.changes = {};
			}

			extend(this.changes, changes);
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
		const _id = this.data._id;
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
		return !!this.changes;
	}

	isSaved () {
		return !!this.get('_id');
	}
}

module.exports = Document;