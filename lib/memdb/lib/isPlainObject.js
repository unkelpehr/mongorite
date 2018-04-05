'use strict';

function isObjectObject (thingy) {
    return (
        thingy != null &&
        typeof thingy === 'object' &&
        Array.isArray(thingy) === false &&
        Object.prototype.toString.call(thingy) === '[object Object]'
    );
}

module.exports = function (thingy) {
    if (!thingy || !isObjectObject(thingy)) {
        return false;
    }

    const ctor = thingy.constructor;

    // If has modified constructor
    if (!ctor || typeof ctor !== 'function') {
        return false;
    }

    const prot = ctor.prototype;

    // If has modified prototype
    if (!prot || !isObjectObject(prot)) {
        return false;
    }

    // If constructor does not have an Object-specific method
    if (!prot.hasOwnProperty('isPrototypeOf')) {
        return false;
    }

    // Most likely a plain Object
    return true;
};
