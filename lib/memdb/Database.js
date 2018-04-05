'use strict';

const util = require('util');

const dotProp = require('dot-prop');

const clone = require('./lib/clone');
const assign = require('./lib/copy');
const dottify = require('./lib/dottify');

/**
 * TODO.
 * @param {Object} target
 * @param {Object} source
 * @param {Object} debug
 * @return {Object}
 */
function patch (target, source, debug) {
	if (!source) {
		return;
	}

	const keys = Object.keys(source);

	let idx;
	let key;
	let val;

	for (idx = 0; idx < keys.length; ++idx) {
		key = keys[idx];
		dotProp.set(target, key, source[key]);
	}

	return target;
}

/**
 * Bla.
 */
class MemoryDatabase {
	/**
	 * Constrcutor.
	 * @param {String} name
	 */
	constructor (name) {
		const data = this.data = {};

		this.name = name;

		data.merged = undefined;
		data.written = undefined;
		data.changes = undefined;

		this.FLAG_DEEP = 1;
		this.FLAG_AS_WRITTEN = 2;
		this.FLAG_NO_CLONE = 3;
	}

	/**
	 * @type {Boolean} TRUE if this document has unsaved changes. Otherwise FALSE.
	 */
	get isDirty () {
		return !!this.data.changes;
	}

	/**
	 * @type {Boolean} TRUE if this document has been written to the database. Otherwise FALSE.
	 */
	get isSaved () {
		return !!this.data.written;
	}

	/**
	 * TODO.
	 * @param {Boolean} [_clone=true]
	 * @return {Object|null}
	 */
	getChanges (_clone=true) {
		const changes = this.data.changes;

		if (!clone || !changes) {
			return changes;
		}

		return clone(changes);
	}

	/**
	 * TODO.
	 * @param {Boolean} [_clone=true]
	 * @return {Object|null}
	 */
	getWritten (_clone = true) {
		const written = this.data.written;

		if (!clone || !written) {
			return written;
		}

		return clone(written);
	}

	/**
	 * TODO.
	 * @return {Object}
	 */
	diff () {
		const written = this.getWritten();
		const changes = this.getChanges();

		if (!changes) {
			return written || {};
		}

		if (!written) {
			return Object.keys(changes).map(key => ({
				old: undefined,
				new: changes[key]
			}));
		}

		const result = this.getWritten();

		Object.keys(changes).forEach(key => {
			dotProp.set(result, key, {
				old: dotProp.get(written, key),
				new: changes[key]
			});
		});

		return result;
	}

	/**
	 * Return the value with the key `key`, as previously set via the `set`-method.
	 * The `includeChanges` parameter is an optional setting (being `true` as default)
	 * which prioritizes (and includes) local (dirty) values.
	 * @param {Boolean} [bitmask=]
	 * @param {String} key
	 * @param {String} val
	 * @return {Mixed}
	 */
	set (bitmask, key, val) {
		const data = this.data;

		const DEEP = this.FLAG_DEEP;
		const AS_WRITTEN = this.FLAG_AS_WRITTEN;
		const NO_CLONE = this.FLAG_NO_CLONE;

		let source;
		let target;

		if (typeof bitmask !== 'number') {
			if (bitmask === true) {
				bitmask = DEEP;
			} else {
				if (bitmask !== false) {
					val = key;
					key = bitmask;
				}

				bitmask = 0;
			}
		}

		const asWritten = bitmask & AS_WRITTEN;
		const deepMerge = bitmask & DEEP;
		const dontClone = bitmask & NO_CLONE;

		// Normalize [key, val] into `source` ({key: val})
		if (typeof key === 'object') {
			source = key;
		} else if (typeof key !== 'string') {
			throw new TypeError('Wot are y doni');
		} else {
			source = {};
			source[key] = val;
		}

		source = patch({}, source);

		// 
		if (asWritten) {
			if (!data.written) {
				data.written = clone(source);
			} else {
				assign(deepMerge, data.written, source);
			}
		}

		// 
		if (!asWritten) {
			if (deepMerge) {
				if (!data.changes) {
					data.changes = {};
				}

				patch(data.changes, dottify(source), true);
			} else {
				if (!data.changes) {
					data.changes = clone(source);
				} else {
					assign(deepMerge, data.changes, source);
				}
			}
		}

		// Reset the written/changes merge as it's now outdated.
		data.merged = undefined;

		return this;
	}

	/**
	 * Return the value with the key `key`, as previously set via the `set`-method.
	 * The `includeChanges` parameter is an optional setting (being `true` as default)
	 * which prioritizes (and includes) local (dirty) values.
	 * @param {Boolean} [includeChanges=true]
	 * @param {String} key
	 * @return {Mixed}
	 */
	get (includeChanges, key) {
		let data = this.data;

		// Optional parameter 'includeChanges'
		if (includeChanges !== true && includeChanges !== false) {
			key = includeChanges;
			includeChanges = true;
		}

		if (!includeChanges || !data.changes) {
			data = data.written;
		} else {
			// Build the `data.merged`-property on demand,
			// instead of doing it on each `set`-operation.
			if (!data.merged) {
				data.merged = {};
				patch(data.merged, data.written);
				patch(data.merged, data.changes);
			}

			data = data.merged;
		}

		// Retrieve everything
		if (key === undefined) {
			return clone(data);
		}

		return dotProp.get(data, key);
	}

	/**
	 * Internal method that merges all set changes with
	 * the 'written' data on this document.
	 */
	_writeChanges () {
		const data = this.data;

		if (data.changes) {
			return;
		}

		if (!data.written) {
			data.written = {};
		}

		patch(data.written, data.changes);
		data.changes = undefined;
	}

	/**
	 * Save.
	 */
	async save () {

	}

	/**
	 * Inspect.
	 * @param {Object} [obj=`this.data`]
	 */
	_inspect (obj) {
		console.log('\nInspect:', util.inspect(obj || this.data, {depth: null, colors: true, breakLength: 0}));
	}
}

module.exports = MemoryDatabase;
