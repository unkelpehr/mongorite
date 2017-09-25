'use strict';

const {MongoClient, Db, Server} = require('mongodb');
const extend = require('deep-extend');
const {map, Promise, hide} = require('./common');

const EventEmitter = require('./EventEmitter');

const STATE_CONNECTED = 'connected';
const STATE_CONNECTING = 'connecting';
const STATE_DISCONNECTING = 'disconnecting';
const STATE_DISCONNECTED = 'disconnected';

const defaultOptions = {
	promiseLibrary: Promise
};

class Database extends EventEmitter {
	/**
	 * Constructor.
	 *
	 * @param      {(string|array)} [urls=['localhost']]   One or more MongoClient connection strings: https://docs.mongodb.com/manual/reference/connection-string/
	 * @param      {object}         [options]              MongoClient.connect options Object: https://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html#connect
	 * @returns    {Promise.<MongoClient.Database>}
	 */
	constructor (urls = ['localhost'], options = {}) {
		super();

		var state = STATE_DISCONNECTED;

		// Public properties
		this.urls = map(urls, url => (!url.startsWith('mongodb://') ? 'mongodb://' : '') + url);
		this.options = extend({}, defaultOptions, options);

		// Private properties
		hide(this, '_connection');
		hide(this, '_connectPromise');
		hide(this, '_awaitingConnection', []);

		Object.defineProperty(this, 'state', {
			get: () => state,
			set: (newState) => {
				var oldState = state;
				state = newState;
				this.emit(state);
				this.emit('state-change', [oldState, newState]);
			}
		});
	}

	/**
	 * Connects to a Mongo Database using the connection string and options object this class was constructed with.
	 *
	 * @returns    {Promise.<MongoClient.Database>}
	 */
	connect () {
		let notifyQueue;

		if (this._connection) {
			return Promise.resolve(this);
		}

		this.state = STATE_CONNECTING;
    
    	notifyQueue = (res, isResolved) => {
			const queue = this._awaitingConnection;
			const method = isResolved ? 'resolve' : 'reject';

			for (let i = 0; i < queue.length; ++i) {
				queue[i][method](res); // MongoDB Connection object or Error object
			}

			this._awaitingConnection = [];

			return Promise[method](this); // This instance
		};

		this._connectPromise = MongoClient.connect(this.urls.join(), this.options).then(db => {
			notifyQueue(db, true);

			this._connection = db;
			this.state = STATE_CONNECTED;

			return Promise.resolve(this);
		}).catch(notifyQueue);

		return this._connectPromise;
	}

	/**
	 * Disconnects the current database connection, including all the child db instances.
	 *
	 * @returns {Promise.<undefined>}
	 */
	disconnect () {
		if (this.state === STATE_DISCONNECTING) {
			return Promise.reject(new Error('Database is already in the progress of disconnecting'));
		}

		if (this.state === STATE_DISCONNECTED) {
			return Promise.reject(new Error('Database is already disconnected'));
		}

		if (this.state === STATE_CONNECTING) {
			return this.getConnection().then(() => this.disconnect());
		}

		this.state = STATE_DISCONNECTING;

		return this.getConnection().then(mdb => mdb.close()).then(() => {
			this._connection = null;
			this.state = STATE_DISCONNECTED;
			return this;
		});
	}

	/**
	 * Returns the MongoClient Connection attached to this Database.
	 *
	 * @param      {String>}  name         The name of the collection
	 * @returns    {Promise.<Connection>}
	 */
	getConnection (ignoreState) {
		if (this.state === STATE_CONNECTED || this.state === STATE_DISCONNECTING) {
			return Promise.resolve(this._connection);
		}

		if (this.state === STATE_CONNECTING) {
			return this._connectPromise.then(() => this._connection);
		}

		if (this.state === STATE_DISCONNECTED) {
			if (ignoreState) {
				return new Promise((resolve, reject) => this._awaitingConnection.push({resolve, reject}));
			}

			return Promise.reject(new Error('Database is disconnected.'));
		}
	}

	/**
	 * Returns the mongorite Collection object with given `name`.
	 *
	 * @param      {String>}  name         The name of the collection
	 * @returns    {Promise.<Collection>}
	 */
	getCollection (name, options, ignoreState) {
		if (this.state !== STATE_CONNECTED) {
			throw new Error(`Database not connected (it's ${this.state})`);
		}

		if (options && options.strict) {
			throw new Error('Collection strict mode is not yet supported');
		}

		return this._connection.collection(name, options);
		return this.getConnection(ignoreState).then(conn => conn.collection(name, options));
	}

	//getCollectionNames (ignoreState) {
	//	return this.getConnection(ignoreState).then(conn => conn.getCollectionNames());
	//}
}

Database.STATE_CONNECTED = 'connected';
Database.STATE_CONNECTING = 'connecting';
Database.STATE_DISCONNECTING = 'disconnecting';
Database.STATE_DISCONNECTED = 'disconnected';

// An error-throwing proxy that is used to handle cases when code is trying
// to access properties belonging to an database instance that does not exist.
Database.dummy = (function () {
	const because = [
		'because the instance you are trying to access does not exist.\n\n',
		'If you are trying to access the database indirectly via a Collection or Document class, you have to set the property (`db`) manually ',
		'or by passing it as the first argument to the class constructor. Example:\n\n',
		'const users = new UserCollection(db);\n',
		'users.db = new Database(\'localhost/myapp\'); // or like this'
	].join('');

	return new Proxy({}, {
		set: (obj, key) => {
			throw new Error(`Cannot set property \`mongorite.Database.prototype.${key}\` ${because}`);
		},

	    get: (obj, key) => {
	    	// https://github.com/nodejs/node/issues/10731
	    	if (typeof key !== 'string') {
	    		return () => undefined;
	    	}

	    	if (key === 'toJSON') {
	    		return JSON.stringify({error: `Cannot get property \`mongorite.Database.prototype.${key}\` ${because}`});
	    	}

	    	if (typeof Database.prototype[key] === 'function') {
	    		return () => Promise.reject(new Error(`Cannot execute method \`mongorite.Database.prototype.${key}\` ${because}`));
	    	}

			throw new Error(`Cannot get property \`mongorite.Database.prototype.${key}\` ${because}`);
	    }
	});
}());

module.exports = Database;