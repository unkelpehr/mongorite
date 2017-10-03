const Ajv = require('ajv');

class ValidationError extends Error {
	constructor (subject, validationErrors, message) {
		// Calling parent constructor of base Error class.
		super(message);

		// Capturing stack trace, excluding constructor call from it.
		Error.captureStackTrace(this, this.constructor);

		this.subject = subject;
		this.validationErrors = validationErrors;
	}
};

/**
 * Configures the supplied `Document` to support schemas.
 */
function setupDocument (Document, options) {
	if (Document.prototype._ajv) {
		return;
	}
	
	Document.prototype._ajv = (new Ajv(options)).compile(Document.schema || true);

	Document.prototype.validate = function () {
		const ajv = this._ajv;

		if (!ajv) {
			return null;
		}

		ajv(this.get());

		return ajv.errors;
	};
}

/**
 * Configures the supplied `Collection` to support schemas.
 */
function setupCollection (Collection, options) {
	if (Collection.prototype.validate) {
		return;
	}

	// Validates all Document instances in `this` Collection instance.
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

	// We can be setting up the super Collection - so we cannot access the static Collection.Document
	// (which would be the super Document) but need to listen for Collection constructs and grab the Document there.
	Collection.after('construct', e => {
		setupDocument(e.collection.Document, options);
	});

	// Validates all Document instances in the collection.
	Collection.before(options.before, e => {
		const collection = e.collection
		const errors = collection.validate();

		if (errors) {
			return Promise.reject(new ValidationError(collection, errors,
				`Could not save collection - ${errors.size}/${e.collection.length} document(s) did not pass validation.\n` +
				`Check the 'validationErrors' map property on this error object for details.`
			));
		}
	});
}

const plugin = options => Class => {
	options = options || {};

	if (Class.isMongoriteCollection) {
		return setupCollection(Class, options);
	}

	if (Class.isMongoriteDocument) {
		return setupDocument(Class, options);
	}

	throw new TypeError(`Expected 'Class' to be an instance of mongorite.Document or mongorite.Collection, got ${typeof Class}`);
};

plugin.ValidationError = ValidationError;

module.exports = plugin;