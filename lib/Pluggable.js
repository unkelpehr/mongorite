'use strict';

class Pluggable {
	dispatchEvent (type, name, data) {
		if (arguments.length === 2) {
			data = name;
			name = type;
			type = 'before';
		}

		const event = {};
		const Class = this.constructor;
		const listeners = Class._listeners[type][name];
		const isAfter = type === 'after';

		event.Collection = this.constructor;
		event.collection = this;
		event.type = type;
		event.name = name;
		event.data = data;

		if (listeners && listeners.length) {
			for (let i = 0; i < listeners.length; ++i) {
				listeners[i](event);
			}
		}

		if (isAfter) {
			return this;
		}

		return val => {
			if (typeof val === 'function') {
				val = val(event);
			}

			this.dispatchEvent('after', name, data);

			return val || this;
		};
	}
}

Pluggable._listeners = {
	before: {},
	after: {}
};

Pluggable.use = function (...plugins) {
	const Class = this;

	for (let i = 0; i < plugins.length; ++i) {
		let plugin = plugins[i];

		if (Array.isArray(plugins[i])) {
			Class.use(...plugin);
		} else {
			plugins[i](Class);
		}
	}

	return this;
};

['before', 'after'].forEach(method => {
	Pluggable[method] = function (name, callback) {
		const Class = this;
		const listeners = Class._listeners[method];

		if (!listeners[name]) {
			listeners[name] = [];
		}

		listeners[name].push(callback);

		return this;
	};
});

module.exports = Pluggable;