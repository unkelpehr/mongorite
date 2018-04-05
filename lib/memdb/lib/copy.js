'use strict';

const clone = require('./clone');
const isPlainObject = require('./isPlainObject');

function assign (deep, target, source) {
    const keys = Object.keys(source);

    var i;

    for (i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const val = source[key];

        if (val === undefined) {
            continue;
        }

        if (deep && isPlainObject(val)) {
            if (!isPlainObject(target[key])) {
                target[key] = clone(val);
            } else {
                assign(deep, target[key], val);
            }
        } else {
            target[key] = clone(val);
        }
    }

    return target;
}

module.exports = function (deep, _target, _source1, _source2) {
    let target;

    let idx = 1; // Skip `deep`
    let val;

    const len = arguments.length;

    for (; idx < len; ++idx) {
        if (val = arguments[idx]) {
            if (!target) {
                target = val;

                if (idx === len) {
                    return clone(target);
                }
            } else if (val) {
                assign(deep, target, val);
            }
        }
    }

    return target;
};
