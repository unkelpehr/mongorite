'use strict';

const {Database, Collection, Document} = require('../index');
const schema =  require('./TestSchema');

class TestDocument extends Document {
	configure () {
		//this.schema(schema.schema, schema.options);
	}
}

module.exports = TestDocument;