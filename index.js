'use strict';

exports.Promise = require('bluebird');

exports.Database = require('./lib/Database');
exports.Collection = require('./lib/Collection');
exports.Document = require('./lib/Document');

exports.plugins = {
	runtime: require('./lib/plugins/runtime'),
	schemas: require('./lib/plugins/schemas')
};