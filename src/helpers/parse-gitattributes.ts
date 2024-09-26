import * as T from '../types.ts';
import { normPath } from './norm-path.ts';

export type FlagAttributes = {
	'vendored': boolean | null,
	'generated': boolean | null,
	'documentation': boolean | null,
	'detectable': boolean | null,
	'binary': boolean | null,
	'language': T.LanguageResult;
};

export type ParsedGitattributes = Array<{
	glob: T.FileGlob,
	attrs: FlagAttributes,
}>;

/**
 * Parses a gitattributes file.
 */
export default function parseAttributes(content: string, folderRoot: string = '.'): ParsedGitattributes {
	const output: ParsedGitattributes = [];

	for (const rawLine of content.split('\n')) {
		const line = rawLine.replace(/#.*/, '').trim();
		if (!line) continue;

		const parts = line.split(/\s+/g);
		const fileGlob = parts[0];
		const relFileGlob = normPath(folderRoot, fileGlob);
		const attrParts = parts.slice(1);
		const isTrue = (str: string) => !str.startsWith('-') && !str.endsWith('=false');
		const isFalse = (str: string) => str.startsWith('-') || str.endsWith('=false');
		const trueParts = (str: string) => attrParts.filter(part => part.includes(str) && isTrue(part));
		const falseParts = (str: string) => attrParts.filter(part => part.includes(str) && isFalse(part));
		const hasTrueParts = (str: string) => trueParts(str).length > 0;
		const hasFalseParts = (str: string) => falseParts(str).length > 0;
		const boolOrNullVal = (str: string) => hasTrueParts(str) ? true : hasFalseParts(str) ? false : null;

		const attrs = {
			'generated': boolOrNullVal('linguist-generated'),
			'vendored': boolOrNullVal('linguist-vendored'),
			'documentation': boolOrNullVal('linguist-documentation'),
			'detectable': boolOrNullVal('linguist-detectable'),
			'binary': hasTrueParts('binary') || hasFalseParts('text') ? true : hasFalseParts('binary') || hasTrueParts('text') ? false : null,
			'language': trueParts('linguist-language').at(-1)?.split('=')[1] ?? null,
		}

		output.push({ glob: relFileGlob, attrs });
	}

	return output;
}
