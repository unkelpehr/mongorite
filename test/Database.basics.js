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

test('exposes STATE_ constants', assert => {
	assert.is(Database.STATE_CONNECTED, 'connected');
	assert.is(Database.STATE_CONNECTING, 'connecting');
	assert.is(Database.STATE_DISCONNECTING, 'disconnecting');
	assert.is(Database.STATE_DISCONNECTED, 'disconnected');
});