'use strict';

const Mquery = require('mquery');
const _wrapCallback = Mquery.prototype._wrapCallback;

const {hide, Promise} = require('./common');

Mquery.Promise = Promise;

// mquery `method`s that returns one or more documents.
const isFindOperation = {
	find: true,
	findOne: true,
	count: true,
	distinct: true,
	findAndModify: true,
	cursor: true
};

const ns = '@@mongorite';

class Query extends Mquery {
	constructor (collection) {
		super(collection.mongo.collection);

		hide(this, ns, collection);
	}

	// It is very convinent for us that mquery uses the method `_wrapCallback` internally for the use of tracing calls to the database.
	// We'll just wrap this method and convert the returned document(s) to our Collection/Document.
	_wrapCallback (method, callback, queryInfo) {
		const collection = this[ns];
		const Document = collection.Document;

		var after;
		if (isFindOperation[method]) {
			after = collection.dispatchEvent('before', 'find*', {method, queryInfo});
		}

		// When we execute _wrapCallback, mquery will execute function the user has set with setTraceFunction.
		return _wrapCallback.call(this, method, (err, res) => {
			if (after) {
				after(e => {
					e.data.err = err;
					e.data.res = res;
				});
			}

			if (!res) {
				// Ignore?
			}

			if (isFindOperation[method]) {
				if (Array.isArray(res)) {
					res = collection.clone().push(res);
				} else if (typeof res === 'object') {
					res = (new Document(collection)).set(res);
				}
			}

			if (callback) {
				// And by executing the callback mquery execute the function returned by the tracer.
				callback.call(this, err, res);
			}
		}, queryInfo);
	}
}

module.exports = Query;