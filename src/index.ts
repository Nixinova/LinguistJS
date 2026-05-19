import analyseVirtualFiles from './analyser/index.js';
import fromFilesystem from './input/fromFilesystem.js';
import fromRawContent from './input/fromRawContent.js';
import retrieveData from './program/data/retrieveData.js';
import * as T from './types/types.js';

async function analyse(path?: string, opts?: T.Options): Promise<T.Results>;
async function analyse(paths?: string[], opts?: T.Options): Promise<T.Results>;
async function analyse(content?: Record<string, string>, opts?: T.Options): Promise<T.Results>;
async function analyse(rawInput?: string | string[] | Record<string, string>, opts: T.Options = {}): Promise<T.Results> {
	const inputs = {
		path: typeof rawInput === 'string' ? rawInput : null,
		paths: Array.isArray(rawInput) ? rawInput : null,
		content: typeof rawInput === 'object' && !Array.isArray(rawInput) ? rawInput : null,
	};
	const inputPaths = inputs.paths ?? (inputs.path ? [inputs.path] : null);
	const inputContent = inputs.content;

	// Normalise input option arguments
	opts = {
		calculateLines: opts.calculateLines ?? true, // default to true if unset
		checkIgnored: !opts.quick,
		checkDetected: !opts.quick,
		checkAttributes: !opts.quick,
		checkHeuristics: !opts.quick,
		checkShebang: !opts.quick,
		checkModeline: !opts.quick,
		...opts,
	};

	// Load data from github-linguist web repo
	const { langData, heuristicsData, vendorPaths } = await retrieveData(opts.offline ?? false);

	// Setup main variables
	const files = inputContent ? fromRawContent(inputContent, vendorPaths) : await fromFilesystem(inputPaths ?? [], opts, vendorPaths);

	return analyseVirtualFiles(files, langData, heuristicsData, opts);
}

export default analyse;
