import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';
import byAttributes from '../classifiers/byAttributes.js';
import byExtension from '../classifiers/byExtension.js';
import byFilename from '../classifiers/byFilename.js';
import byModeline from '../classifiers/byModeline.js';
import byShebang from '../classifiers/byShebang.js';

function dedupeClassifications(classifications: string[]): string[] {
	const seen = new Set<string>();
	const ordered: string[] = [];
	for (const classification of classifications) {
		if (!seen.has(classification)) {
			seen.add(classification);
			ordered.push(classification);
		}
	}
	return ordered;
}

export function classifyFiles(files: T.VirtualFile[], langData: LanguagesScema, opts: T.Options): Record<string, string[]> {
	const classifications: Record<string, string[]> = {};
	for (const file of files) {
		// Search each language
		const candidates: string[] = [
			...byAttributes(file, langData),
			...byFilename(file, langData),
			...byShebang(file, langData, opts),
			...byModeline(file, langData, opts),
			...byExtension(file, langData),
		];
		classifications[file.path] = dedupeClassifications(candidates);
	}
	return classifications;
}
