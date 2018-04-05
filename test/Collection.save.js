const {test} = require('ava');
const {Database, Collection, Document} = require('../');

const db = new Database('localhost/mongorite_test_Collection_save');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

function getTestData () {
	return {
		a: 'b',
		c: {
			d: 'e'
		},
		f: {
			g: {
				h: {
					i: 'j'
					}
				}
			},
		k: 'l',
		m: {
			n: {
				o: {
					p: 'q',
					r: 's'
				}
			}
		},
		t: null,
		u: 'v',
		w: {
			x: 'y',
			z: {}
		}
	};
}

// This runs before all tests
test.before(() => db.connect());

// This runs after all tests
test.after.always(() => (new TestCollection(db)).query.remove().then(() => db.disconnect()));

test('Save simple object', async assert => {
	let tests = new TestCollection(db);

	await tests.push({fooX: 1}).save();
	assert.is(await tests.query.count().where('fooX').in([1]), 1);

	await tests.push({fooX: 2}).save();
	assert.is(await tests.query.count().where('fooX').in([1,2]), 2);

	await tests.push({fooX: 3}, {fooX: 4}).save();
	assert.is(await tests.query.count().where('fooX').in([1,2,3,4]), 4);

	await tests.push([{fooX: 5}, {fooX: 6}]).save();
	assert.is(await tests.query.count().where('fooX').in([1,2,3,4,5,6]), 6);
});

test('Save complex object', async assert => {
	const col = new TestCollection(db);
	const obj = getTestData();
	const _id = (await col.push(obj).save()).insertedIds[0];

	obj._id = _id;

	assert.deepEqual(col[0].get(), obj);
});

test('Partial update of complex object', async assert => {
	const col = new TestCollection(db);
	const obj = getTestData();
	const _id = (await col.push(obj).save()).insertedIds[0];
	const doc = col[0];

	obj._id = _id;

	obj.m.n.o.p = 'not p';
	obj.m.n.o.r = {dafuk: 'lolwhut'};
	obj.m.n.o.X = null;
	obj.u = undefined;
	obj.w.z._ = 0;

	doc.set('m.n.o.p', 'not p');
	doc.set('m.n.o.r', {dafuk: 'lolwhut'});
	doc.set('m.n.o.X', null);
	doc.set('u', undefined);
	doc.set('w.z._', 0);

	await col.save();

	assert.deepEqual(doc.get(), obj);
});
