const Ajv = require('ajv');
const extend = require('deep-extend');

const validators = new WeakMap();

module.exports = Class => {
	
	// Collection before construct =>
	// add prototype 'validate' method.
	Class.before('construct', e => {
		const Collection = e.Collection;

		// 
		Collection.prototype.validate = function () {
			const result = new Map();

			this.each(doc => {
				const errors = doc.validate();

				if (errors) {
					result.set(doc, errors);
				}
			});

			return result.size ? result : null;
		};
	});

	// Collection after construct =>
	// add Document prototype 'validate' and 'schema' methods.
	Class.after('construct', e => {
		const Document = e.collection.Document;

		// 
		Document.prototype.validate = function () {
			const Class = this.constructor;
			const ajv = validators[Class];

			let data;
			let validate

			if (!ajv || !(validate = ajv.validate)) {
				return null;
			}

			data = extend({}, this.data, this.changes);

			validate(data);

			return validate.errors;
		};

		//
		Document.prototype.schema = function (schema, options) {
			const Class = this.constructor;

			if (!arguments.length) {
				return validators[Class];
			}

			if (schema === false) {
				validators[Class] = null;

				return this;
			}

			if (!validators[Class]) {
				const ajv = validators[Class] = {};

				ajv.schema = schema || ajv.schema || {};
				ajv.options = options ? extend({}, options) : {};
				ajv.validate = (new Ajv(ajv.options)).compile(ajv.schema);
			}

			return this;
		};
	});

	// Collection before save =>
	// validate all documents against the schema.
	Class.before('save', e => {
		const ops = e.data;

		console.log(ops);
	});
};



