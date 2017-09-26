'use strict';

const {Database, Collection, Document} = require('../index');
const UserDocument = require('./UserDocument');

class UserCollection extends Collection {
	get Document () {
		return UserDocument;
	}
}

module.exports = UserCollection;