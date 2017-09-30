const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('getCollection returns a mongodb collection when already connected', async assert => {
	const db = await (new Database('localhost/mongorite_test')).connect();

	const collection = db.getCollection('bleh');
	
	assert.is(collection.s.name, 'bleh');
});

test('getCollection throws when not connected', assert => {
	const db = new Database('localhost/mongorite_test');

	assert.throws(() => db.getCollection('bleh'));
});