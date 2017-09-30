const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('connect and disconnect', async assert => {
	var res, db = new Database('localhost/mongorite_test');

	assert.is(db.state, 'disconnected');

	res = await db.connect();
	assert.is(db.state, 'connected');
	assert.truthy(res instanceof Database);

	res = await db.disconnect();
	assert.is(db.state, 'disconnected');
	assert.truthy(res instanceof Database);
});

test('disconnect should throw when not connected', async assert => {
	await assert.throws((new Database('localhost/mongorite_test')).disconnect(), 'Database is already disconnected');
});

test('disconnect should throw when already disconnecting', async assert => {
	const db = new Database('localhost/mongorite_test');
	
	await db.connect();

	db.disconnect();

	await assert.throws(db.disconnect(), 'Database is already in the progress of disconnecting');
});

test('disconnect should wait for a pending connection to be established, before disconnecting it', async assert => {
	const db = new Database('localhost/mongorite_test');

	db.connect();
	assert.is(db.state, Database.STATE_CONNECTING);
	await assert.notThrows(db.disconnect());
});

test('db should be able to connect and disconnect multiple times', async assert => {
	const db = new Database('localhost/mongorite_test');

	assert.is(db.state, Database.STATE_DISCONNECTED);

	await db.connect();
	await db.disconnect();
	await db.connect();
	await db.disconnect();
	await db.connect();
	await db.disconnect();

	assert.is(db.state, Database.STATE_DISCONNECTED);
});