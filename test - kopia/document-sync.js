const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('prototype methods expectations', assert => {
	const expect = [
		 '_generateWriteOperation',
		  '_pullChanges',
		  'changes',
		  'constructor',
		  'delete',
		  'get',
		  'inspect',
		  'isChanged',
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

test('prototype.set, prototype.get', assert => {
	let document = new Document();

	document.set('myKey', 'myVal');

	assert.is(document.get('myKey'), 'myVal');

	document.set({myKey2: 'myVal2'});

	assert.is(document.get('myKey2'), 'myVal2');

	document.set({
		_id: 'abcdefghijkl',
		myKey3: 'myVal3'
	});

	assert.is(document.get(false, 'myKey3'), 'myVal3');
});