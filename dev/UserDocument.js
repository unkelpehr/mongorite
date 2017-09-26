'use strict';

const {Database, Collection, Document} = require('../index');
const schema =  require('./UserSchema');

class UserDocument extends Document {
	static get schema () {
		return schema;
	}
}

module.exports = UserDocument;