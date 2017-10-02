const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Document_save_refresh');

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

test('save multidimensional object', async assert => {
	const col = new TestCollection(db);
	const doc = new Document(col);

	const obj1 = {
		k1: 'v1',
		k2: {},
		k3: {
			l1k1: {
				l2k1: 'l2v1'
			}
		},
		k4: {
			l1k1: {
				l2k1: 'l2v1',
				l2k2: 'l2v2'
			}
		}
	};

	// deepEqual with 'obj1' after insertion and refresh
	await doc.set(obj1).save();
	obj1._id = doc.get('_id');
	await doc.refresh();
	assert.deepEqual(doc.get(false), obj1);

	// deepEqual after update of nested prop
	obj1.k3.l1k1.l2k1 = 'something else';
	doc.set('k3.l1k1.l2k1', 'something else')
	await doc.save();
	assert.deepEqual(doc.get(false), obj1);

	obj1.k3.l1k1.lol = 'whut';
	doc.set('k3.l1k1.lol', 'whut');
	await doc.save();

	assert.deepEqual(doc.get(false), obj1);
});

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