'use strict';

const toString = Object.prototype.toString;

/**
 * Check if given object has any enumerable properties.
 * @param {Object} obj
 * @return {Boolean} TRUE if the object is empty, otherwise FALSE.
 */
function isEmptyObject (obj) {
	let key;

	for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }

    return true;
}

/**
 * TODO.
 * @param {String} key
 * @param {Mixed} val
 * @return {Boolean}
 */
function shouldMerge (key, val) {
	const str = toString.call(val);

	return (
		val &&
		typeof val === 'object' &&
		key !== '_id' && // Is this sufficient enough or should we check if it's and instance of ObjectID?
		str !== '[object RegExp]' &&
		str !== '[object Date]' &&
		!isEmptyObject(val) && // Or empty objects will not be included in the result
		!Array.isArray(val)
	);
}

/**
 * TODO.
 * @param {Object} obj
 * @param {String=} prefix
 * @param {Object} res
 * @return {Object}
 */
function obj2dot (obj, prefix, res) {
	let key;
	let val;
	let dot;

	res = res || {};

	for (key in obj) {
		if (obj.hasOwnProperty(key)) {
			val = obj[key];
			dot = (prefix ? prefix + '.' + key : key);

			// TODO. Check if we should grab another dependency to deep clone objects to kill refs.
			if (shouldMerge(key, val)) {
				obj2dot(val, dot, res);
			} else {
				res[dot] = val;
			}
		}
	}

	return res;
};

module.exports = obj2dot;
