'use strict';

const {Database, Collection, Document, plugins, ObjectId, Promise} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

//Collection.use(plugins.runtime);
//Collection.use(plugins.schemas({allErrors: true, before: 'save'}));


var users = new UserCollection(db);

UserCollection.before('save', e => {
	console.log('before save');
}).after('save', e => {
	console.log('after save');
}).before('bulkSave', e => {
	console.log('before bulkSave');
}).after('bulkSave', e => {
	console.log('after bulkSave....');

	return new Promise((resolve, reject) => {
		setTimeout(() =>{
			console.log('after bulkSave....!');
			resolve();
		}, 500)
	});
});


console.time('loop');
users.action('save, bulkSave', {foo:'bar'}, e => {
	
}).then(() => {
	console.timeEnd('loop');
	//console.log('All done', counts);
});

return;
async function tests () {
	await db.connect();

	const user = await users.query.findById('59c96feac83e6c65a039d03c');

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

/*
const counts = {
	afterSave: 0,
	afterBulkSave: 0,
	beforeSave: 0,
	beforeBulkSave: 0
}

for (let i = 0; i < 1000; ++i) {
	UserCollection.before2('save', e => {
		counts.beforeSave++;
		//console.log('before save');
	}).after2('save', e => {
		counts.afterSave++;
		//console.log('after save');
	}).before2('bulkSave', e => {
		counts.beforeBulkSave++;
		//console.log('before bulkSave');
	}).after2('bulkSave', e => {
		counts.afterBulkSave++;
		//console.log('after bulkSave');

		return new Promise((resolve, reject) => {
			setTimeout(resolve, 1000)
		});
	});
}
setTimeout(() => {
	console.log('starting loop');

	console.time('loop');
	users.action('save, bulkSave', {foo:'bar'}, e => {
		console.log('OK - doing stuff');
	}).then(() => {
		console.timeEnd('loop');
		//console.log('All done', counts);
	});
});

return;

*/