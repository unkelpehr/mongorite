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

// This runs before all tests
test.before(() => db.connect());

// This runs after each test
// test.afterEach.always(() => );

// This runs after all tests
test.after.always(() => (new TestCollection(db)).query.remove().then(() => db.disconnect()));

test('document.refresh', async assert => {
	let tests1 = (new TestCollection(db)).push({first_name: 'skurt', last_name: 'hornberg'});

	await tests1.save();

	let tests2 = tests1.clone(true);

	let doc1 = tests1[0];
	let doc2 = tests2[0];
	
	await doc1.set('first_name', 'not_skurt');
	await doc2.refresh();

	assert.deepEqual(doc1.data, doc2.data);
});