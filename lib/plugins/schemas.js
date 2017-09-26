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

	// Collection after construct =>
	// add Document prototype 'validate' and 'schema' methods.
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
		const ops = e.data;

		console.log(ops);
	});
};

module.exports = plugin;