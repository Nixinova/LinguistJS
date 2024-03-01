import path from 'path';

import * as T from '../types';

export type FlagAttributes = {
	'vendored': boolean | null,
	'generated': boolean | null,
	'documentation': boolean | null,
	'binary': boolean | null,
	'language': T.LanguageResult;
};

export type ParsedGitattributes = Array<{
	glob: string,
	attrs: FlagAttributes,
}>;

/**
 * Parses a gitattributes file.
 */
export default function parseAttributes(content: string, folderRoot: string = '.'): ParsedGitattributes {
	const output: ParsedGitattributes = [];

	for (const line of content.split('\n')) {
		if (!line) continue;

		const parts = line.split(/\s+/g);
		const fileGlob = parts[0];
		const relFileGlob = path.join(folderRoot, fileGlob).replace(/\\/g, '/');
		const attrParts = parts.slice(1);
		const isTrue = (str: string) => !str.startsWith('-') && !str.endsWith('=false');
		const isFalse = (str: string) => str.startsWith('-') || str.endsWith('=false');
		const trueParts = (str: string) => attrParts.filter(part => part.includes(str) && isTrue(part));
		const falseParts = (str: string) => attrParts.filter(part => part.includes(str) && isFalse(part));
		const hasTrueParts = (str: string) => trueParts(str).length > 0;
		const hasFalseParts = (str: string) => falseParts(str).length > 0;

		const attrs = {
			'generated': hasTrueParts('linguist-generated') ? true : hasFalseParts('linguist-generated') ? false : null,
			'vendored': hasTrueParts('linguist-vendored') ? true : hasFalseParts('linguist-vendored') ? false : null,
			'documentation': hasTrueParts('linguist-documentation') ? true : hasFalseParts('linguist-documentation') ? false : null,
			'binary': hasTrueParts('binary') || hasFalseParts('text') ? true : hasFalseParts('binary') || hasTrueParts('text') ? false : null,
			'language': trueParts('linguist-language').at(-1)?.split('=')[1] ?? null,
		}

		output.push({ glob: relFileGlob, attrs });
	}

	return output;
}
