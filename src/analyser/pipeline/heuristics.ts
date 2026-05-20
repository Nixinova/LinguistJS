import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';
import byHeuristics from '../classifiers/byHeuristics.js';

export function resolveHeuristics(
	files: T.VirtualFile[],
	classifications: Record<string, string[]>,
	heuristicsData: unknown,
	langData: LanguagesScema,
	opts: T.Options
): Record<string, string | undefined> {
	const resolved: Record<string, string | undefined> = {};
	for (const file of files) {
		const candidateLanguages = classifications[file.path] ?? [];
		const heuristicLanguage = byHeuristics(file, candidateLanguages, heuristicsData, langData, opts)[0];
		if (heuristicLanguage) {
			resolved[file.path] = heuristicLanguage;
		}
	}
	return resolved;
}
