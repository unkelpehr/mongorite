'use strict';
const {Database, Collection, Document, plugins, ObjectId, Promise} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

Collection.use(plugins.runtime);
Collection.use(plugins.schemas({allErrors: true, before: 'save'}));


var users = new UserCollection(db);

async function tests () {
	await db.connect();

	const user = await users.query.findById('59cbadac039c201fe44313c6');

	user.set('last_name', 'Gordon2');

	console.log(user.get('last_name'))
	inspect(user);


	await db.disconnect();
}

tests().catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
});

class Document2 {
	save () { 
		return this.action('save', e)/*before*/.then(e => {

		}) /* after */;
	}
}