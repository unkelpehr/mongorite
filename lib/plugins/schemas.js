const Ajv = require('ajv');
const extend = require('deep-extend');


module.exports = Class => {
	
	Class.after('Document', e => {
		
	});

	Class.before('save', e => {
		const ops = e.data;

		console.log(ops);
	});
};