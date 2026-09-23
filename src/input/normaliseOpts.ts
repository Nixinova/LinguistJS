import { OptionValues } from '../cli/args.js';
import * as T from '../types/types.js';

/** Map cli arg values to the analyser's options model */
export default function normaliseOpts(opts: OptionValues): T.Options {
	return {
		...opts,
		// Normalise input option arguments
		calculateLines: opts.calculateLines ?? true, // default to true if unset
		checkIgnored: !opts.quick,
		checkDetected: !opts.quick,
		checkAttributes: !opts.quick,
		checkHeuristics: !opts.quick,
		checkShebang: !opts.quick,
		checkModeline: !opts.quick,
		// Map/cast other options that need to be mapped
		categories: opts.categories as T.Category[] | undefined,
	};
}
