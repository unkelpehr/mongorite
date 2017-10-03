'use strict';

const {Database, Collection, Document, plugins, ObjectId, Promise, common} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

//Collection.use(plugins.runtime);
Collection.use(plugins.schemas({
	allErrors: true,
	before: 'save',
	verbose: true
}));

async function tests () {
	await db.connect();

	const users = new UserCollection(db);
	const user = new UserDocument(users);

	user.set({
		first_name: 'Flash',
		last_name: 'Gordon'
	});

	users.push(user);

	await user.save();

	user.set({
		first_name: 'Flashy',
		department: 'Justice'
	});

	user.inspect();

	await db.disconnect();
}

tests().catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
});