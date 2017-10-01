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

test('refresh', async assert => {
	const col = new TestCollection(db);
	const doc1 = new Document(col);

	await doc1.set({
		first_name: 'skurt',
		last_name: 'hornberg'
	}).save();

	const doc2 = await col.query.findById(doc1.get('_id'));

	await doc1.set('first_name', 'not_skurt').save();
	
	await doc2.refresh();

	assert.is(
		doc1.get(false, 'first_name'),
		doc2.get(false, 'first_name')
	);
});