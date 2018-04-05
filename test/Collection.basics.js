const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_basics');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

test('instantiation', assert => {
	assert.notThrows(() => new Collection());
});

test('name resolution', assert => {
	class UsersCollection extends Collection {}
	class UserCollection extends Collection {}
	class userscollection extends Collection {}
	class Users extends Collection {}

	const test1 = new UsersCollection();
	const test2 = new UserCollection();
	const test3 = new userscollection();
	const test4 = new Users();

	assert.is(test1.name, 'users');
	assert.is(test2.name, 'users');
	assert.is(test3.name, 'users');
	assert.is(test4.name, 'users');
});

test('should not have any enumerable properties', assert => {
	assert.deepEqual(Object.keys(new Collection()), []);
});

test('prototype methods expectations', assert => {
	const expect = [
		'Document',
		'clone',
		'constructor',
		'each',
		'filter',
		'forEach',
		'get',
		'_inspect',
		'map',
		'mongo',
		'pop',
		'push',
		'query',
		'refresh',
		'save',
		'set',
		'shift',
		'slice',
		'toArray',
		'createDocument'
	].sort();

	assert.deepEqual(expect, Object.getOwnPropertyNames(Collection.prototype).sort());
});
