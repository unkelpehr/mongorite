'use strict';

/* eslint-disable */

const {Database, Collection, Document, plugins, ObjectId, Promise, common} = require('../index');

const UserDocument = require('./UserDocument');
const UserCollection = require('./UserCollection');

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

function getTestData () {
	return {
		a: 'b',
		c: {
			d: 'e'
		},
		f: {
			g: {
				h: {
					i: 'j'
					}
				}
			},
		k: 'l',
		m: {
			n: {
				o: {
					p: 'q',
					r: 's'
				}
			}
		},
		t: null,
		u: 'v',
		w: {
			x: 'y',
			z: {}
		}
	};
}

const db = new Database('localhost/mongorite_test');
const users = new UserCollection(db);
const user = new UserDocument(users);

(async function () {
	await db.connect();

	const user = await users.query.findById(ObjectId("5aa255191f3a6742981f605f"));
	// const user = users.createDocument();

	// user.set('lvl1.bla1', true);
	// user.set('lvl1.bla2', false);

	user.set({
		lvl1: {
			bla1: Math.random()
		},

		lvl2: {
			bla2: Math.random()
		}
	});

	user.set('mittdatum', new Date());
	await user.save();

	await db.disconnect();
}()).catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
});;
