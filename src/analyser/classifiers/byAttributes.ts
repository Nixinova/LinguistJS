import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';

export default function byAttributes(file: T.VirtualFile, langData: LanguagesScema): string[] {
	// Check manual override from gitattributes or explicit language metadata
	const requestedLang = file.attributes?.language;
	if (!requestedLang) return [];
	// If specified language is an alias, associate it with its full name
	const normalizedLang = Object.keys(langData).find((lang) => {
		const aliases = langData[lang]?.aliases ?? [];
		return (
			lang.toLowerCase() === requestedLang.toLowerCase() ||
			aliases.some((alias) => alias.toLowerCase() === requestedLang.toLowerCase())
		);
	});
	return [normalizedLang ?? requestedLang];
}
