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
        foo: {
            type: 'string',
			minLength: 2,
			maxLength: 45
        },

        bar: {
            type: 'integer',
            minimum: 0,
            maximum: 10
        }
    }
};

module.exports = {schema, options};