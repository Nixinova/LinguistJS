import * as T from '../types/types.js';

export default function normaliseOpts(opts: T.Options): T.Options {
	// Normalise input option arguments
	return {
		calculateLines: opts.calculateLines ?? true, // default to true if unset
		checkIgnored: !opts.quick,
		checkDetected: !opts.quick,
		checkAttributes: !opts.quick,
		checkHeuristics: !opts.quick,
		checkShebang: !opts.quick,
		checkModeline: !opts.quick,
		...opts,
	};
}
