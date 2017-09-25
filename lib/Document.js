'use strict';

const Ajv = require('ajv');
const extend = require('deep-extend');
const ObjectID = require('mongodb').ObjectID;
const dotProp = require('dot-prop');

const {hide, Promise} = require('./common');

const EMSG_INVALID = 'Could not save document - it did not pass schema validation.\nCheck the `validationErrors` property on this error object for details.';

class Document {
	constructor (collection) {
		this.data = {};

		hide(this, 'changes');
		hide(this, 'isMongoriteDocument', true);
		hide(this, '_isSaved', false);
		hide(this, '_refs', {});

		if (arguments.length) {
			this.collection = collection;
		}	

		if (typeof this.configure === 'function') {
			this.configure();
		}
	}

	get collection () {
		return this._refs.collection;
	}

	set collection (collection) {
		if (!(collection.isMongoriteCollection)) {
			throw new TypeError(`Expected \`collection\` to be an instance of mongorite.Collection, got ${typeof collection}`);
		}

		extend(collection._refs, this._refs);

		this._refs = collection._refs;
	}

	schema (schema, options) {
		let ajv = this._refs.ajv;
		
		if (!ajv) {
			ajv = this._refs.ajv = {};
		}

		if (!arguments.length) {
			return ajv;
		}

		if (schema === false) {
			this._refs.ajv = {};	
		} else {
			ajv.schema = schema || ajv.schema || {};
			ajv.options = options ? extend({}, options) : {};
			ajv.validate = (new Ajv(ajv.options)).compile(ajv.schema);
		}

		return this;
	}

	validate () {
		let data;
		let validate

		if (!this._refs.ajv || !(validate = this._refs.ajv.validate)) {
			return null;
		}

		data = extend({}, this.data, this.changes);

		validate(data);

		return validate.errors;
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
		const mdbc = this._refs.mongoCollection;

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

		return info;
	}

	_pullChanges (changes) {
		//extend(this.data, (changes || this.changes || {}));
		Object.assign(this.data, (changes || this.changes || {}));
		this.changes = null;
	}

	save (force) {
		if (!this._refs.mongoCollection) {
			this._refs.mongoCollection = this._refs.database.getCollection(this._refs.collection.name);
		}

		const info = hide(this._generateWriteOperation(force), 'originalResolvedValue');
		const mdbc = this._refs.mongoCollection;
		const validationErrors = this.validate();

		let promise;

		if (validationErrors) {
			return Promise.reject(Object.assign(new TypeError(EMSG_INVALID), {validationErrors}));
		}

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

			//if (info.changes) {
			//	extend(this.data, info.changes);
			//	this.changes = null;
			//}
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