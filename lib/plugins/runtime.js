const {hide} = require('../common');

function hr2human (hr) {
	const
		diff = process.hrtime(hr),
		nanoseconds = (diff[0] * 1e9) + diff[1],
		milliseconds = nanoseconds / 1e6,
		seconds = nanoseconds / 1e9;

	return {nanoseconds, milliseconds, seconds};
}

const ns = '@@runtimePlugin';

module.exports = Class => {
	Class.before('query', e => {
		e._[ns] = process.hrtime();
	});

	Class.after('query', e => {
		if (e.res) {
			hide(e.res, 'runtime', {
				runtime:	hr2human(e._[ns]),
				method:		e.data.method,
				conditions:	e.data.conditions,
				options:	e.data.options,
				fields:		e.data.fields,
				count:		isNaN(e.res.length) ? 1 : e.res.length
			});
		}
	});
};