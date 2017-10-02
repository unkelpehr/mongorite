'use strict';

function map (val, fn) {
	return (val == null ? [] : Array.isArray(val) ? val : [val]).map(fn);
}

module.exports = map;