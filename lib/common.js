'use strict';

const mongorite = require('../index');

const bluebird = require('bluebird');

exports.map = function (val, fn) {
	return (val == null ? [] : Array.isArray(val) ? val : [val]).map(fn);
};

exports.hide = function (obj, key, val) {
	Object.defineProperty(obj, key, {
		enumerable: false,
		configurable: true,
		writable: true,
		value: val
	});

	return obj;
};

exports.Promise = bluebird;