'use strict';

class Pluggable {
	static use (...plugins) {
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
	}
	
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

		var error;
		if (listeners && listeners.length) {
			for (let i = 0; i < listeners.length; ++i) {
				if ((error = listeners[i](event)) && (error = error.error)) {
					break;
				}
			}
		}

		if (isAfter) {
			return this;
		}

		const dispatch = val => {
			if (typeof val === 'function') {
				val = val(event);
			}

			this.dispatchEvent('after', name, data);

			return val || this;
		};

		dispatch.after = dispatch;
		dispatch.error = error;

		return dispatch;
	}
}

Pluggable._listeners = {
	before: {},
	after: {}
};

['before', 'after'].forEach(method => {
	Pluggable[method] = function (names, callback) {
		const Class = this;
		const listeners = Class._listeners[method];

		names = names.replace(/\s/g,'').split(',');

		for (let i = 0; i < names.length; ++i) {
			let name = names[i];
			
			if (!listeners[name]) {
				listeners[name] = [];
			}

			listeners[name].push(callback);
		}

		return this;
	};
});

module.exports = Pluggable;