const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test');

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

test('document.refresh', async assert => {
	const tests1 = await (new TestCollection(db)).push({
		first_name: 'skurt',
		last_name: 'hornberg'
	});

	await tests1.save();

	const tests2 = tests1.clone(true);

	const doc1 = tests1[0];
	const doc2 = tests2[0];
	
	await doc1.set('first_name', 'not_skurt');
	await doc2.refresh();

	assert.deepEqual(doc1.data, doc2.data);
});