const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('prototype methods expectations', assert => {
	const expect = [
		'constructor',
		'connect',
		'disconnect',
		'getConnection',
		'getCollection'
	].sort();

	assert.deepEqual(expect, Object.getOwnPropertyNames(Database.prototype).sort());
});

test('connect and disconnect', async assert => {
	const db = new Database('localhost/mongorite_test');
	let returnvalue;

	returnvalue = await db.connect();
	assert.is(db.state, 'connected');
	assert.truthy(returnvalue instanceof Database);

	returnvalue = await db.disconnect();
	assert.is(db.state, 'disconnected');
	assert.truthy(returnvalue instanceof Database);
});

test('expect disconnect to throw when not connected', async assert => {
	await assert.throws((new Database('localhost/mongorite_test')).disconnect(), 'Database is already disconnected');
});

test('expect disconnect to throw when already disconnecting', async assert => {
	const db = new Database('localhost/mongorite_test');
	await db.connect();

	db.disconnect();
	await assert.throws(db.disconnect(), 'Database is already in the progress of disconnecting');
});

test('expect disconnect to wait for a pending connection to be established, before disconnecting it', async assert => {
	const db = new Database('localhost/mongorite_test');

	db.connect();
	assert.is(db.state, Database.STATE_CONNECTING);
	await assert.notThrows(db.disconnect());
});

test('expect db to be able to connect and disconnect multiple times', async assert => {
	const db = new Database('localhost/mongorite_test');

	await db.connect();
	await db.disconnect();
	await db.connect();
	await db.disconnect();
	await db.connect();
	await db.disconnect();

	assert.pass();
});

test('getConnection returns a mongodb connection when already connected', async assert => {
	const db = new Database('localhost/mongorite_test');

	await db.connect();
	const conn = await db.getConnection();

	assert.truthy(conn.close);
});

test('getConnection throws when not connected', async assert => {
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

test('getCollection returns a mongodb collection when already connected', async assert => {
	const db = await (new Database('localhost/mongorite_test')).connect();

	const collection = db.getCollection('bleh');
	
	assert.is(collection.s.name, 'bleh');
});

test('getCollection throws when not connected', assert => {
	const db = new Database('localhost/mongorite_test');

	assert.throws(db.getCollection);
});