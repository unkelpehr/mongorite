const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_clone');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

test('Regular clone', assert => {
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
	collection1.i = {foo: {bar: 'qux'}};
	collection1.j = function bleh () {};

	collection2 = collection1.clone();
	
	assert.deepEqual(collection1, collection2);
});

test('Clone that should keep the documents', assert => {
	let database = new Database(),
		collection1 = new Collection(database),
		collection2;
	
	collection1.push([
		{a: 'b'},
		{c: 'd'},
		{e: 'f'},
		{g: 'h'}
	]);

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

	collection2 = collection1.clone(true);
	
	assert.deepEqual(collection1, collection2);
});

// TODO: Check that non-enumerable properties (e.g. db) still works