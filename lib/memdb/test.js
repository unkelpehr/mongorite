'use strict';

const Database = require('./Database');

const db = new Database('users_db');


db.set('a.b', 1);

db.set(true, 'a.b.c', 2);

db._inspect(db.getChanges());

// a.b = 1
// a.b.c = 2
// impossiblePaths: [ignore, overwrite, throw]


db.set(db.FLAG_AS_WRITTEN, {
	phones: {
		a: 1,
		b: 2
	}
});


db.set(true, {
	phones: {
		a: 1,
		b: 2
	}
});

db.set('phones.a', {
	one: 1,
	two: 2
});

db.set(true, 'phones.emergency', 3);

db._inspect({
	written: db.getWritten(),
	changes: db.getChanges(),
	merged: db.get()
});

/* db.set({
	names: {
		regular: {
			first: 'Jonas',
			last: 'Boman'
		}
	}
});

db.set(true, {
	names: {
		reversed: {
			first: 'sanoJ',
			last: 'namoB'
		}
	}
});


db.set(true, {

	names: {
		regular: {
			nickname: 'Boom!'
		},

		reversed: {
			nickname: '!mooB'
		}
	}
});
 */
// const result = db.get();

db._inspect(db.diff());
