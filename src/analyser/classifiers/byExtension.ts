import { getFileExtension } from '../../program/fs/normalisedPath.js';
import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';

function isComplexExt(ext: string): boolean {
	return /\..+\./.test(ext);
}

export default function byExtension(file: T.VirtualFile, langData: LanguagesScema): string[] {
	// Check if extension is a match
	const extension = file.extension ?? getFileExtension(file.path);
	if (!extension) return [];

	const possible: Array<{ ext: string; lang: string }> = [];
	for (const [lang, data] of Object.entries(langData)) {
		const extMatches = data.extensions?.filter((ext) => file.path.toLowerCase().endsWith(ext.toLowerCase()));
		if (extMatches?.length) {
			for (const ext of extMatches) {
				possible.push({ ext, lang });
			}
		}
	}

	// Apply more specific extension if available
	const hasComplexExt = possible.some((entry) => isComplexExt(entry.ext));
	return possible
		.filter((entry) => {
			const complex = isComplexExt(entry.ext);
			if (hasComplexExt && !complex) return false;
			if (!hasComplexExt && complex) return false;
			return true;
		})
		.map((entry) => entry.lang);
}
