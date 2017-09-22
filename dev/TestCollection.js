'use strict';

const {Database, Collection, Document} = require('../index');
const TestDocument = require('./TestDocument');

class TestCollection extends Collection {
	configure () {
		this.Document = TestDocument;
	}
}

module.exports = TestCollection;