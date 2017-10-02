'use strict';

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