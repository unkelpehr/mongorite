'use strict';

/* eslint-disable */

const {Database, Collection, Document, plugins, ObjectId, Promise, common} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

function getTestData () {
	return {
		a: {
			b: 'c'
		}
	};
}

const db = new Database('localhost/mongorite_test');
const users = new UserCollection(db);
const user = new UserDocument(users);

console.log('isDirty', user.isDirty());

user.set('foo', 'bar');

console.log('isDirty', user.isDirty());

user.unset('foo');

console.log('isDirty', user.isDirty());

return;

(async function () {
	await db.connect();

	const user = await users.query.findById(ObjectId("5aa9399f229cbe35cc9174ca"));
	// const user = users.createDocument();
	
	user.set('creep', getTestData());

	console.log(user);
	// user.data._inspect();
	// console.log(user);

	const result = await user.save();

	await db.disconnect();
}()).catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
});;
