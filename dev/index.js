'use strict';

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

//Collection.use(plugins.runtime);
Collection.use(plugins.schemas({
	allErrors: true,
	before: 'save',
	verbose: true
}));

const users = new UserCollection(db);
const user = new UserDocument(users);
const data = {
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

return (function () {
	//await db.connect();

	const col = new UserCollection(db).push({});
	const doc = col[0];
	
	const obj1 = {
		k1: 'v1',
		k2: {},
		k3: {
			l1k1: {
				l2k1: 'l2v1'
			}
		},
		k4: {
			l1k1: {
				l2k1: 'l2v1',
				l2k2: 'l2v2'
			}
		}
	};

	doc.set(obj1)

	inspect(doc.get.dotted('k1'));

	//db.disconnect();
}());

user.set({foo: {bar: ''}});

user.set('foo.bar', 'qux');
return;

(function () {
	const Benchmark = require('Benchmark');
	const suite = new Benchmark.Suite;
	 
	suite.add('set();', function() {
		user.set(data);
	});

	suite.add('set2()', function() {
		user.set2(data);
	});

	suite.on('cycle', function(event) {
		console.log(String(event.target));
	}).on('complete', function() {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	});
	
	suite.run({ 'async': true });
}())


return;
async function tests () {
	await db.connect();

	const users = new UserCollection(db);
	const user = new UserDocument(users);

	user.set({
		first_name: 'Flash',
		last_name: 'Gordon'
	});

	users.push(user);

	await user.save();

	user.set({
		first_name: 'Flashy',
		department: 'Justice'
	});

	user.inspect();

	await db.disconnect();
}

tests().catch(err => {
	console.log('Unhandled Promise Rejection');
	inspect(err);
	process.exit();
});