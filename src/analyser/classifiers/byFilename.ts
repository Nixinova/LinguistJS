import Path from 'node:path';
import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';

export default function byFilename(file: T.VirtualFile, langData: LanguagesScema): string[] {
	const filename = Path.basename(file.path).toLowerCase();
	// Check if filename is a match
	return Object.entries(langData)
		.flatMap(([lang, data]) => {
			const matches = data.filenames?.some((name) => name.toLowerCase() === filename);
			return matches ? [lang] : [];
		});
}
