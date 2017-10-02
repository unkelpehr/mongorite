const {test} = require('ava');
const merge = require('../').common.merge;

const inspect = (obj, depth) => {
	console.log(require('util').inspect(obj, {colors: true, breakLength: 0, depth: depth}));
};

function getTestData () {
	return {
		source1: {
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
			}
		},

		source2: {
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
		},

		expect: {
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
		}
	};
}

function messup (obj) {
	function rand () {
		return Math.random().toString(36).substr(2, 5);
	}

	function flip () {
		return Math.random() >= 0.5;
	}

	for (var key in obj) {
		if (!obj.hasOwnProperty(key)) {
			continue;
		}

		if (typeof obj[key] === 'object') {
			if (flip()) {
				obj[rand()] = rand();
			}

			if (flip()) {
				messup(obj[rand()] = obj[key]);
				delete obj[key];
			} else {
				messup(obj[key]);
			}

		} else if (flip()) {
			obj[rand()] = '(' + key + ') ' + rand();
		}
	}
}

test('merge is a function', assert => {
	assert.is(typeof merge, 'function')
});

test('shallow: basic merge', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(false, target, source1, source2);

	assert.deepEqual(target, expect);
});

test('shallow: should keep object references', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(false, target, source1, source2);

	source1.c.d = 'not e';
	expect.c.d = 'not e';

	assert.deepEqual(target, expect);
});

test('shallow: is the default option', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(target, source1, source2);

	source1.c.d = 'not e';
	expect.c.d = 'not e';

	assert.deepEqual(target, expect);
});

test('deep/shallow: ignores non-object sources', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(true, target, null, null, source1, 0, {}, source2, undefined, 'string', {});

	assert.deepEqual(target, expect);
});

test('deep: basic merge', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(true, target, source1, source2);

	assert.deepEqual(target, expect);
});

test('deep: simple reference test', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(true, target, source1, source2);

	source1.c.d = 'not e';

	assert.deepEqual(target, expect);
});

test('deep: destroys all object references', assert => {
	const target = {};
	const {source1, source2, expect} = getTestData();

	merge(true, target, source1, source2);

	messup(source1);
	messup(source2);

	assert.deepEqual(target, expect);
});
