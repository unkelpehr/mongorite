'use strict';

const ObjectID = require('mongodb').ObjectID;
const Mquery = require('mquery');
const _wrapCallback = Mquery.prototype._wrapCallback;

const {hide, Promise} = require('./common');

Mquery.Promise = Promise;

// mquery `method`s that returns one or more documents.
const isFindOperation = {
	find: true,
	findOne: true,
	// count: true,
	distinct: true,
	//findAndModify: true,
	cursor: true
};

const ns = '@@mongorite_';

function patch (name, alias) {
	return function (...args) {
		let callback;
		let collection = this.collection[ns];
		console.log(collection);
		if (typeof args[args.length - 1] === 'function') {
			callback = args.pop();
		}

		console.log('executing', name);
		return this[alias](...args);
	};
}

for (let name in Mquery.Collection.prototype) {
	// Skip constructor and private properties
	if (name === 'constructor' || name[0] === '_' || !Mquery.Collection.prototype.hasOwnProperty(name)) {
		continue;
	}

	let oldName = name;
	let newName = ns + name;

	// Save the old method under a new name, with our namespace (`ns`)
	Mquery.Collection.prototype[newName] = Mquery.Collection.prototype[oldName];

	// Create a new function in its stead.
	Mquery.Collection.prototype[oldName] = patch(oldName, newName);
}

// console.log(Mquery.Collection.prototype);

/*
Object.keys(Mquery.Collection.prototype).forEach(name => {
	const oldName = name;
	const newName = ns + name;

	// Skip constructor and private properties
	if (name === 'constructor' || name[0] === '_') {
		return;
	}

	// Save the old method under a new name, with our namespace (`ns`)
	Mquery.Collection.prototype[newName] = Mquery.Collection.prototype[oldName];

	// Create a new function in its stead.
	Mquery.Collection.prototype[oldName] = function (...args) {
		return this[newName](...args);
	};
});
*/
class Query extends Mquery {
	constructor (collection) {
		super(collection.mongo.collection);

		hide(this, ns, collection);
	}

	// Small convinience method to get one document by it's _id-field.
	findById (_id) {
		if (typeof _id === 'string') {
			_id = new ObjectID(_id);
		}

		return this.findOne({_id});
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

			if (isFindOperation[method]) {
				if (Array.isArray(res)) {
					res = collection.clone().push(res);
				} else if (res && typeof res === 'object') {
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