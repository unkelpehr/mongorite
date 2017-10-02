'use strict';

function shallowCopy (target, ...sources) {
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

module.exports = shallowCopy;