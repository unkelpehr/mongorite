const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_basics');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

test('set root key-val', async assert => {
	const col = new TestCollection();

	col.push([
		{foo: ''},
		{foo: ''},
		{foo: ''},
		{foo: ''}
	]);

	col.set('foo', 'bar');

	col.each(doc => assert.deepEqual(doc.get(), {foo: 'bar'}));
});

test('set two level key-val using dot notation', async assert => {
	const col = new TestCollection();

	col.push([
		{foo: {bar: ''}},
		{foo: {bar: ''}},
		{foo: {bar: ''}},
		{foo: {bar: ''}}
	]);

	col.set('foo.bar', 'qux');

	col.each(doc => assert.deepEqual(doc.get(), {foo: {bar: 'qux'}}));
});

test('set two level key-val using nested object', async assert => {
	const col = new TestCollection();

	col.push([
		{foo: {bar: ''}},
		{foo: {bar: ''}},
		{foo: {bar: ''}},
		{foo: {bar: ''}}
	]);

	col.set({
		foo: {
			bar: 'qux'
		}
	});

	col.each(doc => assert.deepEqual(doc.get(), {foo: {bar: 'qux'}}));
});

test('set multiple keys at once', async assert => {
	const col = new TestCollection();
	const obj = {
		foo: 'foo',
		bar: {
			bar: 'bar',
			qux: 'qux'
		},
	};

	col.push([
		{},
		{},
		{},
		{}
	]);

	col.set(obj);

	col.each(doc => assert.deepEqual(doc.get(), obj));
});

test('get root key', async assert => {
	const col = new TestCollection();

	col.push([
		{'a': 1},
		{'a': 2},
		{'a': 3},
		{'a': 4}
	]);

	assert.deepEqual(col.get('a'), [1,2,3,4]);
});

test('get multilevel using dot notation', async assert => {
	const col = new TestCollection();

	col.push([
		{'a': {'b': {'c': 1}}},
		{'a': {'b': {'c': 2}}},
		{'a': {'b': {'c': 3}}},
		{'a': {'b': {'c': 4}}}
	]);

	assert.deepEqual(col.get('a.b.c'), [1,2,3,4]);
});