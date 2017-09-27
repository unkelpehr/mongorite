const Ajv = require('ajv');
const extend = require('deep-extend');

const validators = new WeakMap();

const plugin = options => Class => {

	Class.prototype.validate = function () {
		const result = new Map();

		this.each(doc => {
			const errors = doc.validate();

			if (errors) {
				result.set(doc, errors);
			}
		});

		return result.size ? result : null;
	};

	Class.after('construct', e => {
		const Document = e.collection.Document;

		if (Document.prototype.validate) {
			return;
		}

		Document.prototype._ajv = (new Ajv(options)).compile(Document.schema || true);

		// 
		Document.prototype.validate = function () {
			const ajv = this._ajv;

			if (!ajv) {
				return null;
			}

			if (!this.changes) {
				ajv(this.data);
			} else {
				ajv(extend({}, this.data, this.changes));
			}

			return ajv.errors;
		};
	});

	// Collection before save =>
	// validate all documents against the schema.
	Class.before('save', e => {
		const validationErrors = e.collection.validate();

		if (validationErrors.size) {
			let error = {error: new Error(
				`Could not save collection - ${validationErrors.size}/${e.collection.length} document(s) did not pass validation.\n` +
				`Check the 'validationErrors' map property on this error object for details.`
			)};

			error.error.validationErrors = validationErrors;
			
			return error;
		}
	});
};

module.exports = plugin;