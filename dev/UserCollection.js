'use strict';

const {Collection, Document} = require('../index');
const UserDocument = require('./UserDocument');

class UserCollection extends Collection {
	static get Document () {
		return UserDocument;
	}
}

module.exports = UserCollection;