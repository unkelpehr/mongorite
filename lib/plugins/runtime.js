module.exports = Class => {
	Class.before('save', e => {
		e.data.runtimePlugin = process.hrtime();
	});

	Class.after('save', e => {
		const hr = process.hrtime(e.data.runtimePlugin);

		const nanoseconds = (hr[0] * 1e9) + hr[1];
		const milliseconds = nanoseconds / 1e6;
		const seconds = nanoseconds / 1e9;

		e.data.res.runtime = {
			seconds,
			milliseconds,
			nanoseconds
		};
	});
};