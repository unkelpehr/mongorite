'use strict';

const Mquery = require('mquery');

const {hide, Promise} = require('./common');

Mquery.Promise = Promise;

const ns = '@@mongorite_';

/* eslint key-spacing: off */
const methodTypes = {
	find:			'find',
	findOne:		'find',
	count:			'misc',
	distinct:		'find',
	update:			'update',
	updateMany:		'update',
	updateOne:		'update',
	replaceOne:		'update',
	deleteOne:		'remove',
	deleteMany:		'remove',
	remove:			'remove',
	findAndModify:	'find',
	findStream:		'misc',
	findCursor:		'misc'
};

/**
 * Patches all mQuery methods so that we can control their return values.
 * @param {String} name The method name to patch
 * @param {String} alias The new name for the method
 * @return {Function} The patched mQuery method.
 */
function patch (name, alias) {
	const isFindOperation = methodTypes[name] === 'find';
	const isUpdateOperation = methodTypes[name] === 'update';
	const isRemoveOperation = methodTypes[name] === 'remove';

	const eventNames = (isFindOperation ? [name, 'find*', 'query'] : [name, 'query']).join();

	return function (...args) {
		// No callback specified -> not supported.
		// Could be a stream or cursor.
		if (typeof args[args.length - 1] !== 'function') {
			return this[alias](...args);
		}

		const mquery = this[ns + 'mquery'];
		const collection = this.collection[ns];
		const Document = collection.Document;
		const vanilla = !!(mquery[ns + 'vanilla']);
		const callback = args.pop();
		const eventData = {
			method: name,
			vanilla,
			isFindOperation,
			isUpdateOperation,
			isRemoveOperation,
			conditions: mquery._conditions,
			options: mquery._optionsForExec(),
			fields: mquery._fieldsForExec(),
		};

		const action = (e, next) => {
			// Execute the original method, but substitue
			// the callback to one of our own.
			/* eslint no-invalid-this: off */
			this[alias](...args, (err, res) => {
				// Convert result into mongorite Collection/Document
				if (res && !vanilla && isFindOperation) {
					if (Array.isArray(res)) {
						res = collection.clone().push(res);
					} else if (res && typeof res === 'object') {
						res = (new Document(collection)).set(true, res);
					}
				}

				// Call the original callback function
				// and then tell the collection that we're done.
				callback(err, res);
				next(err, res);
			});
		};

		return collection.action(eventNames, eventData, action);
	};
}

// Loop through all the methods of the internally
// used mquery 'Collection' and patch them into mongorite.
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

/**
 * Mongorites abstraction of mQuery.
 * Adds a few QoL methods but primarly hooks into the results and converts
 * the return values into mongorite collections/document.
 */
class Query extends Mquery {
	/**
	 * Constructor.
	 * @param {Mongorite.Collection} collection
	 */
	constructor (collection) {
		// Construct mquery superclass with the native mongodb collection.
		super(collection.mongo.collection);

		// And hide the mongorite collection in this instance for later use.
		hide(this, ns, collection);
	}

	/**
	 * If executed, disables the instantination of mongorite
	 * Collection/Documents and returns the vanilla result.
	 * @param  {Bool} enable 	If set to FALSE, enables instantation. Everything else disables it.
	 * @return {Object}        `this`
	 */
	vanilla (enable) {
		this[ns + 'vanilla'] = enable === false ? false : true;

		return this;
	}

	/**
	 * Overwrites mQuery's `collection` method.
	 * TODO: For an unknown reason.
	 * @param {MongoDB.Collection} coll
	 * @return {Mongorite.Query} `this`
	 */
	collection (coll) {
		this._collection = new Query.Collection(coll);

		hide(this._collection, ns + 'mquery', this);

		return this;
	}

	/**
	 * Finds a single document by its _id field.
	 * @param  {Object|String|Number} _id value to match against _id.
	 * @return {Promise<Mongorite.Collection>}
	 */
	findById (_id) {
		return this.findOne({_id});
	}

	/**
	 * QoL method to return all documents in this collection.
	 * @return {Promise<Mongorite.Collection>}
	 */
	all () {
		return this.find({});
	}
}

module.exports = Query;
