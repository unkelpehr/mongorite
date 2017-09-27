'use strict';
const {Database, Collection, Document, plugins, ObjectId} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

Collection.use(plugins.runtime);
Collection.use(plugins.schemas({allErrors: true}));


var users = new UserCollection(db);

async function tests () {

	//const res = await users.query.where("local.email").equals('sdfsdf').find(); 
	//inspect(res);
	//return;
	// console.time('find');
	// users = await users.query.find({}).limit(10000);
	// inspect(users.runtime);
	// console.timeEnd('find');

}

db.connect()
.then(() => tests().catch(err => {}))
.then(() => db.disconnect())
.catch(err => {
	console.log('Unhandled Promise Rejection', err);
	process.exit();
});