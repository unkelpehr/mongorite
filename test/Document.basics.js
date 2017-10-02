const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('prototype methods expectations', assert => {
	const expect = [
		 '_generateWriteOperation',
		  '_pullChanges',
		  'changes',
		  'constructor',
		  'get',
		  'inspect',
		  'isDirty',
		  'isSaved',
		  'refresh',
		  'reindex',
		  'save',
		  'set',
		  'unset'
	].sort();

	assert.deepEqual(expect, Object.getOwnPropertyNames(Document.prototype).sort());
});

/*
test('should throw when constructor is given something other than an instance of Collection', assert => {
	assert.throws(() => new Document(null));
	assert.throws(() => new Document({}));
	assert.throws(() => new Document(0));
	assert.notThrows(() => new Document(new Collection()));
});
*/