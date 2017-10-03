'use strict';

const {Database, Collection, Document} = require('../index');
const schema =  require('./UserSchema');

class UserDocument extends Document {

	//validate () {
	//	console.log(this.constructor.validate);
	//	return this.constructor.validate(this);
	//}

	static get schema () {
		return schema;
	}
}

module.exports = UserDocument;