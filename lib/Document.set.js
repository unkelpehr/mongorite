'use strict';

const {hide} = require('./common');

const CONST = Object.freeze({
	GET_DOTNOT: {},
	UNSET_CHANGE: {},
	SET_WRITE: {},
	SET_MERGE_WRITE: {}
});

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

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

function setDot (dots, val, target) {
	const keys = dots.split('.');
	const root = target;

	for (let i = 0; i < keys.length; ++i) {
		const key = keys[i];

		if (!mergeable(target[key])) {
			target[key] = {};
		}

		if (i === keys.length - 1) {
			target[key] = val;
		}

		target = target[key];
	}

	return root;
}

function transform (target, source, dotnot, prefix) {
	var key,
		dot,
		sourceVal,
		targetVal;

	if (!dotnot) {
		if (!target['@@dotnot']) {
			hide(target, '@@dotnot', {});
		}

		dotnot = target['@@dotnot'];
	}

	for (key in source) {
		sourceVal = source[key];
		targetVal = target[key];

		dot = (prefix ? prefix + '.' + key : key);

		if (key.indexOf('.') > 0) {
			dot = dot + '.' + key;
			dotnot[dot] = setDot(key, sourceVal, target);
		} else if (Array.isArray(sourceVal)) {
			dotnot[dot] = target[key] = sourceVal; // Clone array
		} else if (!mergeable(sourceVal)) {
			dotnot[dot] = target[key] = sourceVal; // Source not mergeable - leaf - regular copy
		} else if (mergeable(targetVal)) {
			transform(targetVal, sourceVal, dotnot, dot); // Target and source mergeable, merge `source` into `target`
		} else {
			dotnot[dot] = target[key] = transform({}, sourceVal, dotnot, dot); // Target not mergeable, source is, clone source into `target`
		}
	}

	return target;
}

function set (merge, key, val) {
	var data = this.data,
		dtns = '@@dotnot',
		target,
		source = {},
		absolutePath,
		asWritten = false;

	// Optional parameter 'merge'
	if (typeof merge !== 'boolean') {
		if (merge === CONST.SET_MERGE_WRITE) {
			merge = true;
			asWritten = true;
		} else if (merge === CONST.SET_WRITE) {
			merge = false;
			asWritten = true;
		} else {
			val = key;
			key = merge;
			merge = false;
		}
	}

	// Normalize changes
	if (typeof key !== 'string') {
		source = key;
	} else {
		source[key] = val;
	}

	if (!key) {
		return this;
	}

	// Empty the written/changes merge as it's soon to be outdated.
	data.merged = null;

	// Reference target (written data or staged for save)
	if (asWritten) {
		target = data.written || (data.written = hide({}, dtns, {}));
	} else {
		target = data.changes || (data.changes = hide({}, dtns, {}));
	}

	// 
	if (merge) {
		transform(target, source);
		return this;
	}

	// 
	for (let key in source) {
		var val = source[key];

		if (mergeable(source[key])) {
			target[key] = transform({}, val, target[dtns]);
		} else {
			val = {};
			val[key] = source[key];
			transform(target, val, target[dtns]);
		}
	}

	return this;
}

set.reindex = function (data)  {
	data.merged = hide({}, '@@dotnot', {});
	transform(data.merged, data.written, data.merged['@@dotnot']);
	transform(data.merged, data.changes, data.merged['@@dotnot']);
};

set.CONST = CONST;

module.exports = set;