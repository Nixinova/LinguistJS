import { LanguagesScema } from '../types/schema.js';
import * as T from '../types/types.js';
import { aggregateResults } from './pipeline/aggregate.js';
import { classifyFiles } from './pipeline/classify.js';
import { filterFiles } from './pipeline/filter.js';
import { resolveHeuristics } from './pipeline/heuristics.js';
import { normaliseFiles } from './pipeline/normalise.js';

export default function analyseVirtualFiles(
	files: T.VirtualFile[],
	langData: LanguagesScema,
	heuristicsData: unknown,
	opts: T.Options
): T.Results {
	const normalizedFiles = normaliseFiles(files);
	const filteredFiles = filterFiles(normalizedFiles, opts);
	const classifications = classifyFiles(filteredFiles, langData, opts);
	const heuristicResolutions = resolveHeuristics(filteredFiles, classifications, heuristicsData, langData, opts);
	return aggregateResults(filteredFiles, classifications, heuristicResolutions, langData, opts);
}
