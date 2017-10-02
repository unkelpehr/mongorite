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

exports.hr2ms = hr => ((hr = process.hrtime(hr)), (hr[0] * 1E3) + (hr[1] / 1E6));

exports.obj2dot = (function () {
	const toString = Object.prototype.toString;

	function isEmptyObject (obj) {
	    for(var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	            return false;
	        }
	    }

	    return true;
	}
	
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

	return function obj2dot (obj, prefix, res) {
		var key, val, dot;

		res = res || {};

		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				val = obj[key];
				dot = (prefix ? prefix + '.' + key : key);

				// TODO! ta ned något kloningsverktyg och klona arrayer och dyl för att döda referenser.
				if (shouldMerge(key, val)) {
					obj2dot(val, dot, res);
				} else {
					res[dot] = val;
				}
			}
		}

		return res;
	};

}());

exports.shallowCopy = function (target, ...sources) {
	var i, source, key;

	for (i = 0; i < sources.length; ++i) {
		source = sources[i];

		if (source && typeof source === 'object') {
			for (key in source) {
				if (source[key] !== undefined && source.hasOwnProperty(key)) {
					target[key] = source[key];
				}
			}
		}
	}

	return target;
};

exports.Promise = bluebird;