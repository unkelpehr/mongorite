const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('prototype methods expectations', assert => {
	const expect = [
		'constructor',
		'set',
		'get',
		'refresh',
		'delete',
		'save',
		'isDirty',
		'isChanged',
		'isSaved',
		'collection',
		'_generateWriteOperation',
		'_pullChanges'
	].sort();

	assert.deepEqual(expect, Object.getOwnPropertyNames(Document.prototype).sort());
});

test('should throw when constructor is given something other than an instance of Collection', assert => {
	assert.throws(() => new Document(null));
	assert.throws(() => new Document({}));
	assert.throws(() => new Document(0));
	assert.notThrows(() => new Document(new Collection()));
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

test('prototype.set, prototype.get', assert => {
	let document = new Document();

	document.set('myKey', 'myVal');

	assert.is(document.changes.myKey, 'myVal');

	document.set({myKey2: 'myVal2'});

	assert.is(document.changes.myKey2, 'myVal2');

	document.set({
		_id: 'abcdefghijkl',
		myKey3: 'myVal3'
	});

	assert.is(document.data.myKey3, 'myVal3');
});