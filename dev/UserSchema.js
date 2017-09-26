'use strict';

// http://json-schema.org/
module.exports = {
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