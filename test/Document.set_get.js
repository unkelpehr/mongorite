const {test} = require('ava');
const {Database, Collection, Document} = require('../');
const {CONST} = require('../lib/common');

test('set / get using dot notation', assert => {
	const doc = new Document();

	doc.set('k1', 'v1');
	doc.set('k2', {});
	doc.set('k3.l1k1.l2k1', 'l2v1');
	doc.set('k4.l1k1.l2k1', 'l2v1');
	doc.set('k4.l1k1.l2k2', 'l2v2');

	assert.deepEqual(doc.get(), {
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
	});
});

test('set / get using regular objects', assert => {
	const doc = new Document();

	doc.set('k1', 'v1');
	doc.set('k2', {});
	doc.set('k3', {l1k1: {l2k1: 'l2v1'}});
	doc.set('k4', {l1k1: {l2k1: 'l2v1', l2k2: 'l2v2'}});

	assert.deepEqual(doc.get(), {
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
	});
});

test('bulk set/get', assert => {
	const doc = new Document();
	const obj = {
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

	doc.set(obj);

	assert.deepEqual(doc.get(), obj);
});

test('set/get destroys any references to the original object', assert => {
	const doc = new Document();
	const obj = {
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

	const clone = JSON.parse(JSON.stringify(obj));

	doc.set(obj);

	obj.k1 = 'x';
	obj.k2.e = 'x';
	obj.k3.l1k1.l2k1 = 'x';
	obj.k4.l1k1.e = 'x';

	assert.deepEqual(doc.get(), clone);
});

test('bulk set/get on object that already has changes', assert => {
	const doc = new Document();
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

	const obj2 = {
		k1: 'v1x',
		k2: null,
		k3: {
			l1k1: {
				l2k1: 'l2v1',
				more: 'stuff'
			}
		},
		k4: {
			l1k1: {
				fool: 'l2v1',
				l2k2: 'l2v2'
			}
		}
	};

	assert.deepEqual(doc.set(obj1).get(), obj1);
	assert.deepEqual(doc.set(obj2).get(), obj2);
});

/*---------------------------------------------*\
    SET / GET AS WRITTEN DATA
/*---------------------------------------------*/
test('set / get using dot notation', assert => {
	const doc = new Document();

	const asWritten = CONST.SET_WRITE;

	doc.set(asWritten, 'k1', 'v1');
	doc.set(asWritten, 'k2', {});
	doc.set(asWritten, 'k3.l1k1.l2k1', 'l2v1');
	doc.set(asWritten, 'k4.l1k1.l2k1', 'l2v1');
	doc.set(asWritten, 'k4.l1k1.l2k2', 'l2v2');

	assert.deepEqual(doc.get(false), {
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
	});
});

test('set / get using regular objects', assert => {
	const doc = new Document();

	const asWritten = CONST.SET_WRITE;

	doc.set(asWritten, 'k1', 'v1');
	doc.set(asWritten, 'k2', {});
	doc.set(asWritten, 'k3', {l1k1: {l2k1: 'l2v1'}});
	doc.set(asWritten, 'k4', {l1k1: {l2k1: 'l2v1', l2k2: 'l2v2'}});

	assert.deepEqual(doc.get(false), {
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
	});
});

test('bulk set / get', assert => {
	const doc = new Document();

	const asWritten = CONST.SET_WRITE;

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

	const obj2 = {
		k1: 'v1x',
		k2: null,
		k3: {
			l1k1: {
				l2k1: 'l2v1',
				more: 'stuff'
			}
		},
		k4: {
			l1k1: {
				fool: 'l2v1',
				l2k2: 'l2v2'
			}
		}
	};

	assert.is(doc.set(obj1).get(/* includeChanges */ false), null);

	assert.deepEqual(doc.set(asWritten, obj2).get(false), obj2);
});

/*---------------------------------------------*\
    GET USING DOTTED
/*---------------------------------------------*/
test('get(using.dot.notation)', assert => {
	const doc = new Document();

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

	assert.deepEqual(doc.get('k1'), 'v1');
	assert.deepEqual(doc.get('k2'), {});
	assert.deepEqual(doc.get('k3.l1k1.l2k1'), 'l2v1');
	assert.deepEqual(doc.get('k4.l1k1.l2k1'), 'l2v1');
	assert.deepEqual(doc.get('k4.l1k1.l2k2'), 'l2v2');

	assert.deepEqual(doc.get('k3'), obj1.k3);
	assert.deepEqual(doc.get('k3.l1k1'), obj1.k3.l1k1);

	assert.deepEqual(doc.get('k4'), obj1.k4);
	assert.deepEqual(doc.get('k4.l1k1'), obj1.k4.l1k1);

	assert.deepEqual(doc.get(), obj1);
});