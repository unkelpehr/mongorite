const {test} = require('ava');
const {Database, Collection, Document} = require('../');

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
		'inspect',
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
		'toArray'
	].sort();

	assert.deepEqual(expect, Object.getOwnPropertyNames(Collection.prototype).sort());
});

/*
test('should throw when constructor is given something other than mongodb', assert => {
	assert.throws(() => new Collection(null));
	assert.throws(() => new Collection({}));
	assert.throws(() => new Collection(0));
	assert.notThrows(() => new Collection(new Database()));
});
*/

test('prototype.clone', assert => {
	let database = new Database(),
		collection1 = new Collection(database),
		collection2;
	
	collection1.a = 'abc';
	collection1.b = '';
	collection1.c = 0;
	collection1.d = false;
	collection1.e = null;
	collection1.f = undefined;
	collection1.g = {};
	collection1.h = {foo: 'bar'};
	collection1.i = {foo: {bar: 'bar'}};
	collection1.j = function bleh () {};

	collection2 = collection1.clone();
	
	assert.deepEqual(collection1, collection2);
});

test('prototype.push', assert => {
	let collection = new Collection();

	assert.is(collection.length, 0);

	collection.push({});
	collection.push({});
	collection.push({});
	collection.push({});

	assert.is(collection.length, 4);
});

test('prototype.push', assert => {
	let collection = new Collection();

	assert.is(collection.length, 0);
	collection.push({});
	assert.is(collection.length, 1);

	collection.push({});
	assert.is(collection.length, 2);

	collection.push({}, {});
	assert.is(collection.length, 4);

	collection.push([{}, {}]);
	assert.is(collection.length, 6);

	collection.push([{}, {}], {}, [{}]);
	assert.is(collection.length, 10);
});


test('prototype.push converts objects to documents', assert => {
	let collection = new Collection();
	collection.push({});
	assert.truthy(collection[0] instanceof Document);
});

test('prototype.pop', assert => {
	let collection = new Collection(),
		object1 = {a:1},
		object2 = {a:2},
		object3 = {a:3},
		object4 = {a:4};

	collection.push(object1, object2, object3, object4);

	assert.is(collection.pop().changes().a, 4);
	assert.is(collection.length, 3);

	assert.is(collection.pop().changes().a, 3);
	assert.is(collection.length, 2);

	assert.is(collection.pop().changes().a, 2);
	assert.is(collection.length, 1);

	assert.is(collection.pop().changes().a, 1);
	assert.is(collection.length, 0);

	assert.is(collection.pop(), undefined);
	assert.is(collection.length, 0);

	assert.is(collection.pop(), undefined);
	assert.is(collection.length, 0);
});

test('prototype.shift', assert => {
	let collection = new Collection(),
		object1 = {a:1},
		object2 = {a:2},
		object3 = {a:3},
		object4 = {a:4};

	collection.push(object1, object2, object3, object4);

	assert.is(collection.shift().changes().a, 1);
	assert.is(collection.length, 3);

	assert.is(collection.shift().changes().a, 2);
	assert.is(collection.length, 2);

	assert.is(collection.shift().changes().a, 3);
	assert.is(collection.length, 1);

	assert.is(collection.shift().changes().a, 4);
	assert.is(collection.length, 0);

	assert.is(collection.shift(), undefined);
	assert.is(collection.length, 0);
	
	assert.is(collection.shift(), undefined);
	assert.is(collection.length, 0);
});

test('prototype.forEach', assert => {
	let collection = new Collection(),
		objects = [{a:1}, {a:2}, {a:3}, {a:4}],
		count = 0;

	collection.push(objects).forEach((doc, index, self) => {
		count++;
		assert.is(doc.changes().a, count);
		assert.is(index, count - 1);
		assert.truthy(collection === self);
	});

	assert.is(count, 4);
});

test('prototype.each', assert => {
	let collection = new Collection(),
		objects = [{a:1}, {a:2}, {a:3}, {a:4}],
		count = 0;

	collection.push(objects).each((doc, index, self) => {
		count++;
		assert.is(doc.changes().a, count);
		assert.is(index, count - 1);
		assert.truthy(collection === self);
	});

	assert.is(count, 4);
});

test('prototype.map', assert => {
	let collection = (new Collection()).push([{a:1}, {a:2}, {a:3}, {a:4}]),
		count = 0;

	assert.deepEqual(collection.map(doc => ++count), [1,2,3,4]);
});

test('prototype.filter', assert => {
	let collection1 = (new Collection()).push([{a:1}, {a:2}, {a:3}, {a:4}]),
		collection2 = collection1.filter(doc => (doc.changes().a === 1 || doc.changes().a === 4));

	assert.is(collection2.length, 2);
	assert.is(collection2[0].changes().a, 1);
	assert.is(collection2[1].changes().a, 4);
});

test('prototype.toArray', assert => {
	let collection = (new Collection()).push([{a:1}, {a:2}, {a:3}, {a:4}]);

	collection = collection.toArray();

	assert.truthy(Array.isArray(collection));
	assert.is(collection.length, 4);
});

test('prototype.slice', assert => {
	let collection1 = (new Collection()).push([{a:1}, {a:2}, {a:3}, {a:4}]),
		collection2;

	collection1.slice(1);
	collection1.slice(1);
	assert.is(collection1.length, 4);

	collection2 = collection1.slice(1);
	assert.is(collection2.length, 3);

	collection2 = collection1.slice(2);
	assert.is(collection2.length, 2);

	collection2 = collection1.slice(0, 1);
	assert.is(collection2.length, 1);

	collection2 = collection1.slice(1);
	assert.is(collection2.length, 3);

	assert.is(collection1.slice(0, 1)[0].changes().a, 1);
	assert.truthy(collection1.slice(0, 1)[0] instanceof Document);

	assert.is(collection1.length, 4);
});