'use strict';

const mongodb = require('mongodb');

exports.Promise = require('bluebird');

exports.Database = require('./lib/Database');
exports.Collection = require('./lib/Collection');
exports.Document = require('./lib/Document');
exports.common = require('./lib/common');

exports.plugins = {
	runtime: require('./lib/plugins/runtime'),
	schemas: require('./lib/plugins/schemas')
};

['ObjectId', 'Timestamp'].forEach(prop => {
	exports[prop] = mongodb[prop];
});