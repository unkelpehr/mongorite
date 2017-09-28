'use strict';

const {Database, Collection, Document} = require('../index');
const schema =  require('./UserSchema');

class UserDocument extends Document {

	//validate () {
	//	console.log(this.constructor.validate);
	//	return this.constructor.validate(this);
	//}

    setLastName (newName) {
        return this.set('last_name', newName);
    }

	static get schema () {
		return {
            type: 'object',
            properties: {
            	first_name: {
                    type: 'string',
                    minLength: 5,
                    maxLength: 15,
            	}
            }
		};

		return {
		    // http://json-schema.org/
            type: 'object',
            description: 'User!',
            title: "Användare",
            required: [],
            additionalProperties: true,
            properties: {
                profile: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        name: {
                            type: 'string',
                        	title: "Visningsnamn"
                        }
                    }
                },
                local: {
                    type: 'object',
                    additionalProperties: false,
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                        	title: "E-Post"
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            maxLength: 1024,
                        	title: "Lösenord"
                        }
                    }
                },
                google: {
                    type: 'object',
                    additionalProperties: false,
                    required: ["id", "token", "email"],
                    properties: {
                        id: {
                            type: 'string'
                        },
                        token: {
                            type: 'string'
                        },
                        email: {
                            type: 'string',
                            format: 'email'
                        },
                        name: {
                            type: 'string'
                        }
                    }
                },
            }
        };;
	}
}

module.exports = UserDocument;