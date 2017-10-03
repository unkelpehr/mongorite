const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_refresh');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

test('something', assert => {
	assert.pass();
});


/*
test('prototype.schema - no collection', assert => {
	let document = new Document();
	let schema = {foo: 'bar', bleh: {foo: 'koo'}};
	let options = {foo2: 'bar2', bleh2: {foo2: 'koo2'}};

	document.schema(schema, options);
	assert.deepEqual(document.schema().schema, schema);
	assert.deepEqual(document.schema().options, options);

	document.schema({}, {});
	assert.deepEqual(document.schema().schema, {});
	assert.deepEqual(document.schema().options, {});
});

test('prototype.schema - with collection', assert => {
	let collection = new Collection();
	let document = new Document(collection);
	let schema = {foo: 'bar', bleh: {foo: 'koo'}};
	let options = {foo2: 'bar2', bleh2: {foo2: 'koo2'}};

	document.schema(schema, options);
	assert.deepEqual(document.schema().schema, schema);
	assert.deepEqual(document.schema().options, options);

	document.schema({}, {});
	assert.deepEqual(document.schema().schema, {});
	assert.deepEqual(document.schema().options, {});
});

test('prototype.schema - with collection, after schema', assert => {
	let collection = new Collection();
	let document = new Document();
	let schema = {foo: 'bar', bleh: {foo: 'koo'}};
	let options = {foo2: 'bar2', bleh2: {foo2: 'koo2'}};

	document.schema(schema, options);
	assert.deepEqual(document.schema().schema, schema);
	assert.deepEqual(document.schema().options, options);

	document.collection = collection;

	document.schema({}, {});
	assert.deepEqual(document.schema().schema, {});
	assert.deepEqual(document.schema().options, {});
});

test('prototype.validate, no collection', assert => {
	let document = new Document();
	let schema = {
		properties: {
			val1: { type: 'string' },
			val2: { type: 'number' }
		}
	};

	document.schema(schema, {allErrors: true});
	assert.is(document.set({val1: 'val1', val2: 100}).validate(), null);
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 2);

	document.schema(null, {allErrors: false});
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 1);

	document.schema(null, {allErrors: true});
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 2);

	document.schema({
		properties: {
			val1: { type: 'number' },
			val2: { type: 'string' }
		}
	}, {allErrors: true});
	assert.is(document.set({val1: 100, val2: '100'}).validate(), null);

	document.schema(false);
	assert.is(document.set({val1: 100, val2: '100'}).validate(), null);
});

test('prototype.validate - with collection', assert => {
	let collection = new Collection();
	let document = new Document(collection);
	let schema = {
		properties: {
			val1: { type: 'string' },
			val2: { type: 'number' }
		}
	};

	document.schema(schema, {allErrors: true});
	assert.is(document.set({val1: 'val1', val2: 100}).validate(), null);
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 2);

	document.schema(null, {allErrors: false});
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 1);

	document.schema(null, {allErrors: true});
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 2);

	document.schema({
		properties: {
			val1: { type: 'number' },
			val2: { type: 'string' }
		}
	}, {allErrors: true});
	assert.is(document.set({val1: 100, val2: '100'}).validate(), null);

	document.schema(false);
	assert.is(document.set({val1: 100, val2: '100'}).validate(), null);
});

test('prototype.validate - with collection, after schema', assert => {
	let collection = new Collection();
	let document = new Document(collection);
	let schema = {
		properties: {
			val1: { type: 'string' },
			val2: { type: 'number' }
		}
	};

	document.schema(schema, {allErrors: true});
	document.collection = collection;
	assert.is(document.set({val1: 'val1', val2: 100}).validate(), null);
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 2);

	document.schema(null, {allErrors: false});
	assert.is(document.set({val1: 100, val2: '100'}).validate().length, 1);
});
*/