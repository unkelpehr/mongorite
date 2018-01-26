'use strict';

/**
 * Sets given keys on `obj` as non-enumerable.
 * @param {Object} obj	The object on which to hide properties.
 * @param {String} key
 * @param {String} val
 * @return {Object}
 */
function hide (obj, key, val) {
	Object.defineProperty(obj, key, {
		enumerable: false,
		configurable: true,
		writable: true,
		value: val
	});

	return obj;
}

module.exports = hide;
