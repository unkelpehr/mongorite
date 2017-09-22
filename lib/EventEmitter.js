'use strict';

const {hide} = require('./common');

class EventEmitter {
	constructor () {
		hide(this, '_EventEmitter', {});
	}

	on (event, handler) {
		var handlers;

		if (!(handlers = this._EventEmitter[event])) {
			handlers = this._EventEmitter[event] = [];
		}

		handlers.push(handler)

		return this;
	}

	emit (event, args) {
		let handlers = this._EventEmitter[event];

		args = args || [];

		if (handlers) {
			for (let i = 0; i < handlers.length; ++i) {
				handlers[i](...args);
			}
		}

		return this;
	}
}

module.exports = EventEmitter;