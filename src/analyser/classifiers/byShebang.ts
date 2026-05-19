import { LanguagesScema } from '../../types/schema.js';
import * as T from '../../types/types.js';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const categoryPriority: Record<string, number> = {
	programming: 0,
	markup: 1,
	prose: 2,
	data: 3,
};

export default function byShebang(file: T.VirtualFile, langData: LanguagesScema, opts: T.Options): string[] {
	if (!opts.checkShebang || opts.quick) return [];
	const firstLine = file.firstLine;
	if (!firstLine || !firstLine.startsWith('#!')) return [];

	const matches = Object.entries(langData).flatMap(([lang, data]) => {
		const interpreters = data.interpreters ?? [];
		// Check for interpreter match
		const matchesInterpretor = interpreters.some((interpreter) => new RegExp(`\\b${escapeRegExp(interpreter)}\\b`).test(firstLine));
		return matchesInterpretor ? [lang] : [];
	});

	return [...new Set(matches)].sort((a, b) => {
		const aType = langData[a]?.type;
		const bType = langData[b]?.type;
		const aPriority = categoryPriority[aType ?? ''] ?? 4;
		const bPriority = categoryPriority[bType ?? ''] ?? 4;
		return aPriority - bPriority;
	});
}
