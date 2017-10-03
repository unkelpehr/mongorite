const {test} = require('ava');
const {Database, Collection, Document} = require('../');
const mquery = require('mquery');

const db = new Database('localhost/mongorite_test_Collection_query');

class TestDocument extends Document {}
class TestCollection extends Collection {
	get Document () {
		return TestDocument;
	}
}

function isPlainObject (obj) {
	return	typeof obj === 'object'
		&& obj != null
		&& obj.constructor === Object
		&& Object.prototype.toString.call(obj) === '[object Object]';
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

test('is an instance of mquery', async assert => {
	const col = new TestCollection(db);

	assert.truthy(col.query instanceof mquery);
});

/*---------------------------------------------*\
    .find()
/*---------------------------------------------*/
test('returns matches as a mongorite collection', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo: 'bar'}, {foo: 'bar'}, {foo: 'bar'}]).save();

	const res = await col.query.find({foo: 'bar'});

	assert.truthy(res instanceof TestCollection);
	assert.is(res.length, 3);
});

test('returns an empty mongorite collection if there was no matches', async assert => {
	const col = new TestCollection(db);
	const res = await col.query.find({di2982jd02wmsks: 'i298kKD9"jojfjdpw291xsfb'});

	assert.truthy(res instanceof TestCollection);
	assert.is(res.length, 0);
});

/*---------------------------------------------*\
    .findOne()
/*---------------------------------------------*/
test('returns a mongorite Document when using findOne', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo2: 'bar2'}, {foo2: 'bar2'}, {foo2: 'bar2'}]).save();

	const res = await col.query.findOne({foo2: 'bar2'});

	assert.truthy(res instanceof TestDocument);
});

test('returns null when findOne got no match', async assert => {
	const col = new TestCollection(db);
	const res = await col.query.findOne({fk09j0f92093jf029j3f09j23fsdghg: '5d5d5f9we1f6w1ef91we9g1294er19hdfjh1cbvae'});

	assert.is(res, null);
});

/*---------------------------------------------*\
    .find().vanilla()
/*---------------------------------------------*/
test('returns a native array when using implicit .vanilla() with find()', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo3: 'bar3'}, {foo3: 'bar3'}, {foo3: 'bar3'}]).save();

	const res = await col.query.find({foo3: 'bar3'}).vanilla();

	assert.truthy(Array.isArray(res));
});

test('returns a native array when using explicit .vanilla(true) with find()', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo4: 'bar4'}, {foo4: 'bar4'}, {foo4: 'bar4'}]).save();

	const res = await col.query.find({foo4: 'bar4'}).vanilla(true);

	assert.truthy(Array.isArray(res));
	assert.is(res.length, 3);
});

test('returns matches as a mongorite collection when using explicit .vanilla(false) with find()', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo5: 'bar5'}, {foo5: 'bar5'}, {foo5: 'bar5'}]).save();

	const res = await col.query.find({foo5: 'bar5'}).vanilla(false);

	assert.truthy(res instanceof TestCollection);
	assert.is(res.length, 3);
});

/*---------------------------------------------*\
    .findOne().vanilla()
/*---------------------------------------------*/
test('returns match as a plain object when using implicit .vanilla() with findOne()', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo6: 'bar6'}, {foo6: 'bar6'}, {foo6: 'bar6'}]).save();

	const res = await col.query.findOne({foo6: 'bar6'}).vanilla();

	assert.truthy(!(res instanceof TestDocument));
	assert.truthy(isPlainObject(res));
});

test('returns match as a plain object when using explicit .vanilla(true) with findOne()', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo7: 'bar7'}, {foo7: 'bar7'}, {foo7: 'bar7'}]).save();

	const res = await col.query.findOne({foo7: 'bar7'}).vanilla(true);

	assert.truthy(!(res instanceof TestDocument));
	assert.truthy(isPlainObject(res));
});

test('returns match as a mongorite document when using explicit .vanilla(false) with findOne()', async assert => {
	const col = new TestCollection(db);

	await col.push([{foo8: 'bar8'}, {foo8: 'bar8'}, {foo8: 'bar8'}]).save();

	const res = await col.query.findOne({foo8: 'bar8'}).vanilla(false);

	assert.truthy(res instanceof TestDocument);
});

/*---------------------------------------------*\
    .findById()
    .findById.vanilla()
/*---------------------------------------------*/
test('findById should work as expected......', async assert => {
	const col = new TestCollection(db);
	const _id = (await col.push([{foo9: 'bar9'}, {foo9: 'woopwoop'}, {foo9: 'bar9'}]).save()).insertedIds[1];
	const res = await col.query.findById(_id);

	assert.truthy(res instanceof TestDocument);
	assert.is(res.get('foo9'), 'woopwoop');
});

test('findById - implicit .vanilla()', async assert => {
	const col = new TestCollection(db);
	const _id = (await col.push([{foo10: 'bar10'}, {foo10: 'woopwoop'}, {foo10: 'bar10'}]).save()).insertedIds[1];
	const res = await col.query.findById(_id).vanilla();

	assert.truthy(!(res instanceof TestDocument));
	assert.truthy(isPlainObject(res));
});

test('findById - explicit .vanilla(true)', async assert => {
	const col = new TestCollection(db);
	const _id = (await col.push([{foo10: 'bar10'}, {foo10: 'woopwoop'}, {foo10: 'bar10'}]).save()).insertedIds[1];
	const res = await col.query.findById(_id).vanilla(true);

	assert.truthy(!(res instanceof TestDocument));
	assert.truthy(isPlainObject(res));
});

test('findById - explicit .vanilla(false)', async assert => {
	const col = new TestCollection(db);
	const _id = (await col.push([{foo10: 'bar10'}, {foo10: 'woopwoop'}, {foo10: 'bar10'}]).save()).insertedIds[1];
	const res = await col.query.findById(_id).vanilla(false);

	assert.truthy(res instanceof TestDocument);
});