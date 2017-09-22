'use strict';

const {Database, Collection, Document} = require('../index');
const UserDocument = require('./UserDocument');

class UserCollection extends Collection {
	configure () {
		this.Document = UserDocument;
	}
}

module.exports = UserCollection;