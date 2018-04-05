'use strict';

const clone = require('./clone');
const isPlainObject = require('./isPlainObject');

/* function dottify (object, _target, _prefix) {
    var i;
    var key;
    var val;
    var path;
    var type;

    const keys = Object.keys(object).sort();
    const target = _target || {};
    const prefix = _prefix ? (_prefix + '.') : '';

    target.lookup = target.lookup || {};
    target.leafs = target.leafs || {};

    for (i = 0; i < keys.length; ++i) {
        key = keys[i];
        val = object[key];

        path = prefix + key;
        type = typeof val;

        if (type === 'function') {
            throw new TypeError(`Invalid data type '${type}' for property '${path}'`);
        }

        if (isPlainObject(val)) {
            target.lookup[path] = val;
            dottify(val, target, path);
        } else {
            target.lookup[path] = target.leafs[path] = val;
        }
    }

    return target;
} */

/**
 * TODO.
 * @param {String} path
 */
function getPathSegments (path) {
    const pathArr = path.split('.');
    const parts = [];

    for (let i = 0; i < pathArr.length; i++) {
        let p = pathArr[i];

        while (p[p.length - 1] === '\\' && pathArr[i + 1] !== undefined) {
            p = p.slice(0, -1) + '.';
            p += pathArr[++i];
        }

        parts.push(p);
    }

    return parts;
}

/**
 * TODO.
 * @param {String} path
 * @param {Object} object
 * @return {Boolean}
 */
function walk (path, object) {
    const segments = path.split('.');

    let child = object;

    for (let i = 0; i < segments.length; ++i) {
        const segment = segments[i];
        
        if (child[segment] !== undefined && !isPlainObject(child[segment])) {
            child[segment] = {};
        }

        child = child[segment];

        /* if (!child) {
            child = 
        } */
    }

    return true;
}

/**
 * TODO.
 * @param {Object} object
 * @param {Object} [_target=]
 * @param {String} [_prefix='']
 * @return {Object}
 */
function dottify (object, _target, _prefix) {
    let i;
    let key;
    let val;
    let path;
    let type;

    const keys = Object.keys(object).sort();
    const target = _target || {};
    const prefix = _prefix ? (_prefix + '.') : '';

    for (i = 0; i < keys.length; ++i) {
        key = keys[i];
        val = object[key];

        path = prefix + key;
        type = typeof val;

        if (type === 'function') {
            throw new TypeError(`Invalid data type '${type}' for property '${path}'`);
        }

        // const segments = getPathSegments(path);

        // walk(key, target);
        if (target[key]) {
            dottify(target[key], target, key);
            delete target[key];
        }

        if (isPlainObject(val)) {
            dottify(val, target, path);
        } else {
            target[path] = clone(val);
        }
    }

    return target;
}

/* const target = {
    a: {b: 1}
};
dottify({'a.b.c': 1}, target);
console.log(target);
// process.exit(); */

module.exports = dottify;
