import analyseVirtualFiles from '../analyser/index.js';
import fromFilesystem from '../input/fromFilesystem.js';
import normaliseOpts from '../input/normaliseOpts.js';
import retrieveData from '../program/data/retrieveData.js';
import * as T from '../types/types.js';

export default async function analyseFs(inputPaths: string[], inputOptions: T.Options = {}): Promise<T.Results> {
	const options = normaliseOpts(inputOptions);

	// Load data from github-linguist web repo
	const { langData, heuristicsData, vendorPaths } = await retrieveData(options.offline ?? false);

	const files = await fromFilesystem(inputPaths, options, vendorPaths);

	return analyseVirtualFiles(files, langData, heuristicsData, options);
}
