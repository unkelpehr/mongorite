function hr2human (hr) {
	const
		diff = process.hrtime(hr),
		nanoseconds = (diff[0] * 1e9) + diff[1],
		milliseconds = nanoseconds / 1e6,
		seconds = nanoseconds / 1e9;

	return {nanoseconds, milliseconds, seconds};
}

function hr2ms (hr) {
	const diff = process.hrtime(hr);

	return (diff[0] * 1e9) + diff[1] / 1e6;
}

module.exports = Class => {
	Class.before('save, find*', e => {
		e.data.runtimePlugin = process.hrtime();
	});

	Class.after('save', e => {
		e.data.res.runtime = hr2human(e.data.runtimePlugin)
	});

	Class.after('find*', e => {
		const runtime = {};

		runtime.roundtrip = hr2ms(e.data.runtimePlugin);
		runtime.method = e.data.method;
		runtime.conditions = e.data.queryInfo.conditions;
		runtime.options = e.data.queryInfo.options;
		runtime.count = e.data.res ? e.data.res.length : 0;

		// if (type e.res === 'object') { place runtime on document }
		e.collection.runtime = runtime;
	});
};