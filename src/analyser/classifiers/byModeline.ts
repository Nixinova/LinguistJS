import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';

const modelineRegex = /-\*-|(?:syntax|filetype|ft)\s*=/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function byModeline(file: T.VirtualFile, langData: LanguagesScema, opts: T.Options): string[] {
	if (!opts.checkModeline || opts.quick) return [];
	const firstLine = file.firstLine;
	// Check modeline declaration
	if (!firstLine || !modelineRegex.test(firstLine)) return [];

	const modelineText = firstLine.toLowerCase().split(modelineRegex)[1] ?? '';
	// Add identified language(s)
	return Object.entries(langData).flatMap(([lang, data]) => {
		const safeLang = escapeRegExp(lang.toLowerCase());
		const matchesLang = new RegExp(`\\b${safeLang}(?![\\w#+*]|-\\*-)`).test(modelineText);
		const aliases = data.aliases ?? [];
		const matchesAlias = aliases.some((alias) => {
			const safeAlias = escapeRegExp(alias.toLowerCase());
			return new RegExp(`\\b${safeAlias}(?![\\w#+*]|-\\*-)`).test(modelineText);
		});
		return matchesLang || matchesAlias ? [lang] : [];
	});
}
