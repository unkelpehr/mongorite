'use strict';

function mergeable (val) {
	const str = Object.prototype.toString.call(val);

	return (
		val &&
		typeof val === 'object' &&
		val.id === undefined && // Is this sufficient enough or should we check if it's and instance of ObjectID?
		str !== '[object RegExp]' &&
		str !== '[object Date]'
	);
}

function deep (target, source) {
	var key,
		sourceVal,
		targetVal;

	for (key in source) {
		sourceVal = source[key];
		targetVal = target[key];

		if (Array.isArray(sourceVal)) {
			target[key] = sourceVal; // Clone array
		} if (!mergeable(sourceVal)) {
			target[key] = sourceVal; // Source mergeable - regular copy
		} else if (mergeable(targetVal)) {
			deep(targetVal, sourceVal); // Target and source mergeable, merge `source` into `target`
		} else {
			target[key] = deep({}, sourceVal); // Target not mergeable, source is, clone source into `target`
		}

	}

	return target;
}

function shallow (target, source) {
	var key;

	for (key in source) {
		target[key] = source[key];
	}

	return target;
}

module.exports = function merge (/* deep, target, ...sources */) {
	var i,
		target,
		method,
		arg0 = arguments[0],
		arg1 = arguments[1],
		sources;

	if (arg0 !== true && arg0 !== false) { // Default: shallow
		i = 1;
		target = arg0;
		method = shallow;
	} else if (arg0 === false) { // Explicit shallow
		i = 2;
		target = arg1;
		method = shallow;
	} else { // Deep
		i = 2;
		target = arg1;
		method = deep;
	}

	// No sources, just clone the target.
	if (arguments.length === i) {
		if (mergeable(target)) {
			return merge(true, {}, target);
		}

		return target;
	}

	for ( ; i < arguments.length; ++i) {
		if (arguments[i] && typeof arguments[i] === 'object') {
			method(target, arguments[i]);
		}
	}

	return target;
};