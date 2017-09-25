'use strict';
const {Database, Collection, Document, plugins} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

//Collection.use(plugins.runtime);
Collection.use(plugins.schemas);

async function tests () {
	var users = new UserCollection(db);

	users.push({
		first_name: 'Flash',
		last_name: 'Gordon'
	});

	console.time('save');
	const res = await users.save();
	//inspect(res.runtime);
	console.timeEnd('save');
}

db.connect()
.then(() => tests())
.then(() => db.disconnect())
.catch(err => {
	console.log('Unhandled Promise Rejection', err);
	process.exit();
});

class Schema {
	validate () {

	}
}

