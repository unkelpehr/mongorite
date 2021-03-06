'use strict';

const {Promise, hide} = require('./common');

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

	action (names, data, action) {
		// action(<names, <action>)
		if (typeof data === 'function') {
			action = data;
			data = {};
		}

		// Convert `names` into an array.
		names = (names || '').replace(/\s/g,'').split(',');

		const Class = this.constructor;
		const listeners = Class._listeners;
		const isSynchronous = !action;
		const event = {};

		event.Collection = this.constructor;
		event.collection = this;
		event.data = data;

		// Can be used by plugins to store private information between
		// listeners. E.g. `e._.runtime = {start: process.hr()}`.
		hide(event, '_', {});

		function run (type) {
			var promises = [];

			for (let i = 0; i < names.length; ++i) {
				let name = names[i];
				let funcs = listeners[type][name];

				if (funcs) {
					event.type = type;
					event.name = name;

					for (let i = 0; i < funcs.length; ++i) {
						let promise = funcs[i](event);

						if (promise && promise.then) {
							promises.push(promise);
						}
					}
				}
			}

			if (!isSynchronous) {
				if (type === 'after') {
					return Promise.all(promises).then(() => event.res);
				}

				return Promise.all(promises).then(() => event);
			}
		}

		if (isSynchronous) {
			run('before');
			
			return () => run('after');
		}

		return run('before')
			.then(e => {
				if (action.length <= 1) {
					return action(e);
				}

				return new Promise((resolve, reject) => {
					action(e, (err, res) => {
						if (err) {
							reject(err);
						} else {
							resolve(res);
						}
					});
				});
			})
			.then(res => event.res = res)
			.then(e => run('after'));
	}
}

Pluggable._listeners = {
	before: {},
	after: {}
};

Pluggable._listeners2 = {
	before: {},
	after: {}
};

['before', 'after'].forEach(method => {
	Pluggable[method] = function (names, callback) {
		const Class = this;
		const listeners = Class._listeners[method];

		names = (names || '').replace(/\s/g,'').split(',');

		if (!names.length) {
			return this;	
		}

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