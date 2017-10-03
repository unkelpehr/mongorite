const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_pop_shift_forEach_each_map_filter_toArray_slice');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

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