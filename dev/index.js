'use strict';

const {Database, Collection, Document} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

function tests () {
	var users = new UserCollection(db);

	users.push({
		first_name: 'Flash',
		last_name: 'Gordon'
	});

	inspect(users);

	return users.save();
}

db.connect()
.then(() => tests())
.then(() => db.disconnect())
.catch(err => {
	console.log('Unhandled Promise Rejection', err);
	process.exit();
});