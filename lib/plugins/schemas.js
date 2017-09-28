const Ajv = require('ajv');
const extend = require('deep-extend');

class ValidationError extends Error {
	constructor (isCollection, validationErrors) {
		// Calling parent constructor of base Error class.
		super(message);

		// Capturing stack trace, excluding constructor call from it.
		Error.captureStackTrace(this, this.constructor);
		this.validationErrors = validationErrors;
	}
};

const plugin = options => Collection => {

	options = options || {};

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

	Collection.after('construct', e => {
		const Document = e.collection.Document;

		if (Document.validate) {
			return;
		}

		Document.validate = function (doc) {
			const ajv = doc._ajv;

			if (!ajv) {
				return null;
			}

			if (!doc.changes) {
				ajv(doc.get(false));
			} else {
				ajv(doc.get());
			}

			return ajv.errors;
		};

		Document.prototype._ajv = (new Ajv(options)).compile(Document.schema || true);

		// 
		Document.prototype.validate = function () {
			return this.constructor.validate(this);
		};
	});

	// Collection before save =>
	// validate all documents against the schema.
	Collection.before(options.before, e => {
		const validationErrors = e.collection.validate();

		if (validationErrors && validationErrors.size) {
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