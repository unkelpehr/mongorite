'use strict';

/**
 * Executes the native `Array.map` method on the given value.
 * If the value is not an array, it will be placed in an array before map is executed.
 * @param {Array|Mixed} val
 * @param {Function} fn
 * @return {Array}
 */
function map (val, fn) {
	return (val == null ? [] : Array.isArray(val) ? val : [val]).map(fn);
}

module.exports = map;
