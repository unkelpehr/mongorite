const {test} = require('ava');
const {Database, Collection, Document} = require('../');

test('db-unset: simple key:val', assert => {
	assert.is((new Document()).set('foo', 'bar').unset('foo').get('foo'), '$unset');
});

test('db-unset: dotted key:val, one level down', assert => {
	assert.is((new Document()).set('foo.bar', 'qux').unset('foo').get('foo'), '$unset');
});

test('db-unset: dotted key:val, two levels down', assert => {
	assert.is((new Document()).set('foo.bar', 'qux').unset('foo.bar').get('foo.bar'), '$unset');
});

test('db-unset: dotted key:val, three levels down', assert => {
	assert.is((new Document()).set('foo.bar.quz', 'quux').unset('foo.bar.qux').get('foo.bar.qux'), '$unset');
});

test('change-unset: dotted key:val', assert => {
	assert.deepEqual((new Document()).set('foo', 'bar').unset.change('foo').get(), {});
});

// TODO: async database unset commands