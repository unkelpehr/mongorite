'use strict';

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

function obj2dot (obj, prefix, res) {
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

module.exports = obj2dot;