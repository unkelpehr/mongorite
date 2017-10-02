const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test-Document_isDirty_isSaved');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

// This runs before all tests
test.before(() => db.connect());

// This runs after each test
// test.afterEach.always(() => );

// This runs after all tests
test.after.always(() => (new TestCollection(db)).query.remove().then(() => db.disconnect()));

test('Document.prototype.isDirty, sync tests', async assert => {
	const col = new TestCollection(db);
	const doc = new TestDocument(col);

	assert.is(doc.isDirty(), false);

	doc.set('foo', 'bar');

	assert.is(doc.isDirty(), true);

	doc.unset.change('foo');

	assert.is(doc.isDirty(), false);

	doc.set({foo: {bar: 'qux'}}),

	assert.is(doc.isDirty(), true);

	doc.unset.change('foo');

	assert.is(doc.isDirty(), false);

	await doc.set('foo', 'bar').save();

	assert.is(doc.isDirty(), false);
});

test('Document.prototype.isSaved', async assert => {
	const col = new TestCollection(db);
	const doc = new TestDocument(col);

	assert.is(doc.isSaved(), false);

	doc.set('foo', 'bar');

	assert.is(doc.isSaved(), false);

	await doc.set('foo', 'bar').save();

	assert.is(doc.isSaved(), true);
});