const {test} = require('ava');
const mongorite = require('../');

test('exposed properties', assert => {
	const expect = ['Database', 'Collection', 'Document', 'Promise'].sort();
	const actual = Object.keys(mongorite).sort();

	assert.deepEqual(expect, actual);
});