const {test} = require('ava');
const {Database, Collection, Document} = require('../');


test('getConnection returns a mongodb connection when already connected', async assert => {
	const db = new Database('localhost/mongorite_test');

	await db.connect();
	const conn = await db.getConnection();

	assert.truthy(conn.close);
});

test('getConnection throws when not connected and `ignoreState` is not `TRUE`', async assert => {
	const db = new Database('localhost/mongorite_test');

	await assert.throws(db.getConnection());
});

test('getConnection ignoreState waits for a connection and does not throw', async assert => {
	const db = new Database('localhost/mongorite_test');

	db.getConnection(true).then(conn => {
		assert.truthy(conn.close);
	});

	await db.connect();
	await db.disconnect();
});