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

test('Collection.prototype.save', async assert => {
	let tests = new TestCollection(db);

	await assert.notThrows(tests.push({foo: 1}).save());
	assert.is(await tests.query.count().where('foo').in([1]), 1);

	await assert.notThrows(tests.push({foo: 2}).save());
	assert.is(await tests.query.count().where('foo').in([1,2]), 2);

	await assert.notThrows(tests.push({foo: 3}, {foo: 4}).save());
	assert.is(await tests.query.count().where('foo').in([1,2,3,4]), 4);

	await assert.notThrows(tests.push([{foo: 5}, {foo: 6}]).save());
	assert.is(await tests.query.count().where('foo').in([1,2,3,4,5,6]), 6);
});

test('Collection.prototype.remove', async assert => {
	let tests = new TestCollection(db);

	tests = tests.clone();
	await tests.push({foo: 7}).save();
	assert.is(await tests.query.count().where('foo').in([7]), 1);
	await tests.query.remove().where('foo').in([7]);
	assert.is(await tests.query.count().where('foo').in([7]), 0);

	tests = tests.clone();
	await tests.push({foo: 8}, {foo: 9}).save();
	assert.is(await tests.query.count().where('foo').in([7,8,9]), 2);
	await tests.query.remove().where('foo').in([7,8,9]);
	assert.is(await tests.query.count().where('foo').in([7,8,9]), 0);
});

test('Collection.prototype.set / save / find', async assert => {
	let tests = new TestCollection(db);
	let object = {
		first_name: 'skurt',
		last_name: 'hornberg'
	};

	await tests.push(object).save();

	let test = await tests.query.findOne({first_name: object.first_name});

	assert.truthy(object._id === undefined); // Make sure the original object isn't modified
	assert.is(test.get('first_name'), object.first_name);
	assert.is(test.get('last_name'), object.last_name);

	await test.set('last_name', 'random').set({username: 'bleh', hooblah: 'something'}).save();

	test = await tests.query.findOne({first_name: object.first_name});

	test.unset(true, true, '_id');

	assert.deepEqual(test.get(), {
		first_name: 'skurt',
		last_name: 'random',
		username: 'bleh',
		hooblah: 'something'
	});
});

test('Collection.prototype.isDirty, Collection.prototype.isSaved, Collection.prototype.isChanged', async assert => {
	let tests = new TestCollection(db).push({first_name: 'skurt', last_name: 'hornberg'});
	let document = tests[0];

	assert.truthy( document.isDirty() );
	assert.false( document.isSaved() );
	assert.truthy( document.isChanged() );

	await document.save();
	assert.false( document.isDirty() );
	assert.true( document.isSaved() );
	assert.false( document.isChanged() );

	document.set('first_name', 'not_skurt');
	assert.truthy( document.isDirty() );
	assert.truthy( document.isSaved() );
	assert.truthy( document.isChanged() );
});


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