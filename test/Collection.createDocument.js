const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_createDocument');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

// This runs before all tests
test.before(() => db.connect());

// This runs after each test
// test.afterEach.always(() => );

// This runs after all tests
test.after.always(() => (new TestCollection(db)).query.remove().then(() => db.disconnect()));

test('collection.createDocument', async assert => {
	const collection = new TestCollection(db);

	// Should return an instance of TestDocument
	assert.truthy(collection.createDocument() instanceof TestDocument);

	// Should take optional `set` arguments
	const data = {foo: 'bar', koo: 'yes'};
	const document = collection.createDocument(data);

	// `includeChanges` = true
	assert.deepEqual(document.get(), data);

	// `includeChanges` = false
	assert.deepEqual(document.get(false), null);
});