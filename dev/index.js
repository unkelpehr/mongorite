'use strict';
const {Database, Collection, Document, plugins, ObjectId} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

Collection.use(plugins.runtime);
Collection.use(plugins.schemas({allErrors: true, validateOnSave: true}));


var users = new UserCollection(db);

async function tests () {
	await db.connect();
	const user = users.push({first_name: ''})[0];

	await users.save();
	//console.log(res);

	await db.disconnect();
}

tests().catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
})