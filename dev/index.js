'use strict';

const {Database, Collection, Document} = require('../index');

const TestDocument = require('./TestDocument');
const TestCollection = require('./TestCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

const db = new Database('localhost/mongorite_test');

function doStuff () {
	var tests = new TestCollection(db);

	tests.push({
		foo: 'bar',
		bar: 5
	});

	inspect(tests);
	
	return tests.save();
}

db.connect()
.then(() => doStuff())
.then(() => db.disconnect())
.catch(err => {
	console.log('Unhandled Promise Rejection', err);
	process.exit();
});