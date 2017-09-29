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

UserCollection.before('find, save', e => {
	console.log('before', e.name);
	inspect({ops: e.data._operations})
}).after('find, save', e => {
	console.log('after', e.name);
});

async function tests () {
	await db.connect();

	const users = new UserCollection(db);

	var user = new UserDocument(users);

	user.set({
		names: {
			first: 'Anders',
			last: 'Billfors'
		}
	});

	await user.save();
	await user.refresh();

	user.set('names.last', 'Snigelfors');

	await user.save();
	await user.refresh();

	inspect(user.get())

	await db.disconnect();
}

tests().catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
});

return;


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