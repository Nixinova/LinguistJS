import pcre from '../../program/utils/pcre.js';
import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';
import byFilename from './byFilename.js';
import byModeline from './byModeline.js';
import byShebang from './byShebang.js';

function collectPatterns(heuristic: any, heuristicsData: any): string[] {
	const patterns: string[] = [];
	const add = (value: string | string[] | undefined) => {
		if (!value) return;
		if (Array.isArray(value)) {
			patterns.push(...value);
		} else {
			patterns.push(value);
		}
	};
	add(heuristic.pattern as string | string[] | undefined);
	add(heuristicsData.named_patterns?.[heuristic.named_pattern] as string | string[] | undefined);
	if (heuristic.and) {
		for (const entry of heuristic.and) {
			add(entry.pattern as string | string[] | undefined);
			add(heuristicsData.named_patterns?.[entry.named_pattern] as string | string[] | undefined);
		}
	}
	return patterns;
}

export default function byHeuristics(
	file: T.VirtualFile,
	candidateLanguages: string[],
	heuristicsData: any,
	langData: LanguagesScema,
	opts: T.Options
): string[] {
	// Parse heuristics if applicable
	if (!opts.checkHeuristics || file.content === undefined) return [];
	// Skip if file has explicit association
	if (file.attributes?.language) return [];
	if (byFilename(file, langData).length) return [];
	if (byShebang(file, langData, opts).length) return [];
	if (byModeline(file, langData, opts).length) return [];
	if (candidateLanguages.length <= 1) return [];
	const extension = file.extension ?? '';
	for (const heuristics of heuristicsData.disambiguations ?? []) {
		// Make sure the extension matches the current file
		if (!heuristics.extensions.includes(extension)) continue;

		// Load heuristic rules
		for (const heuristic of heuristics.rules) {
			// Make sure the language is not an array
			const language = Array.isArray(heuristic.language) ? heuristic.language[0] : heuristic.language;
			const languageGroup = langData[language]?.group;
			const matchesLang = candidateLanguages.includes(language);
			const matchesParent = languageGroup ? candidateLanguages.includes(languageGroup) : false;
			// Make sure the results includes this language
			if (!matchesLang && !matchesParent) continue;

			// Normalise heuristic data
			const patterns = collectPatterns(heuristic, heuristicsData);
			// Check file contents and apply heuristic patterns
			if (!patterns.length || patterns.some((pattern) => pcre(pattern).test(file.content!))) {
				// Apply heuristics
				return [language];
			}
		}
	}
	return [];
}
