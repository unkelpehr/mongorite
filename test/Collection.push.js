const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_push');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

test('Pushin\'', assert => {
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