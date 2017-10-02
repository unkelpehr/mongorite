'use strict';

function mergeable (key, val) {
	const str = Object.prototype.toString.call(val);

	return (
		val &&
		typeof val === 'object' &&
		key !== '_id' && // Is this sufficient enough or should we check if it's and instance of ObjectID?
		str !== '[object RegExp]' &&
		str !== '[object Date]'
	);
}

function merge (target, source) {
	var key,
		sourceVal,
		targetVal;

	for (key in source) {
		sourceVal = source[key];
		targetVal = target[key];

		if (Array.isArray(sourceVal)) {
			target[key] = sourceVal; // Clone array
		} else if (mergeable(key, targetVal)) {
			merge(targetVal, sourceVal);
		} else {
			target[key] = sourceVal;
		}
	}

	return target;
}

module.exports = function (target) {
	for (var i = 1; i < arguments.length; i++) {
		merge(target, arguments[i]);
	}

	return target;
};