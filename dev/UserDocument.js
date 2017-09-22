'use strict';

const {Database, Collection, Document} = require('../index');
const schema =  require('./UserSchema');

class UserDocument extends Document {
	configure () {
		//this.schema(schema.schema, schema.options);
	}
}

module.exports = UserDocument;