const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('db-unset: simple key:val', assert => {
	assert.is((new Document()).set('foo', 'bar').unset(true, 'foo').get('foo'), '$unset');
});

test('db-unset: dotted key:val, one level down', assert => {
	assert.is((new Document()).set('foo.bar', 'qux').unset(true, 'foo').get('foo'), '$unset');
});

test('db-unset: dotted key:val, two levels down', assert => {
	assert.is((new Document()).set('foo.bar', 'qux').unset(true, 'foo.bar').get('foo.bar'), '$unset');
});

test('db-unset: dotted key:val, three levels down', assert => {
	assert.is((new Document()).set('foo.bar.quz', 'quux').unset(true, 'foo.bar.qux').get('foo.bar.qux'), '$unset');
});

test('change-unset: dotted key:val', assert => {
	assert.deepEqual((new Document()).set('foo', 'bar').unset('foo').get(), {});
});

test('change-unset: nested with one prop', assert => {
	const doc = new Document().set({
		foo: {
			bar: 'qux'
		}
	});

	doc.unset('foo.bar');

	assert.deepEqual(doc.get('foo'), {});
});

// TODO: async database unset commands