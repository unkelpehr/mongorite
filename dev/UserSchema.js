'use strict';

const options = {
	// https://github.com/epoberezkin/ajv#options
};

// http://json-schema.org/
const schema ={
    type: 'object',
    description: 'A dummy schema for mongorite development',
    required: [],
    additionalProperties: true,

    properties: {
        first_name: {
            type: 'string',
			minLength: 3,
			maxLength: 45
        },

        last_name: {
            type: 'string',
            minLength: 3,
            maxLength: 45
        }
    }
};

module.exports = {schema, options};