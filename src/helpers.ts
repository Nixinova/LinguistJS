import fs from 'fs';
import fetch from 'cross-fetch';
import Cache from 'node-cache';
import glob2regex from 'glob-to-regexp';

export const convertToRegex = (path: string): RegExp => glob2regex('**/' + path, { globstar: true, extended: true });
export const last = <T>(arr: T[]): T => arr[arr.length - 1];

const dataUrl = (file: string): string => `https://raw.githubusercontent.com/github/linguist/HEAD/lib/linguist/${file}`;

const cache = new Cache({});
export async function loadFile(file: string): Promise<string> {
	// Return cache if it exists
	const cachedContent = cache.get<string>(file);
	if (cachedContent) return cachedContent;
	// Otherwise cache the request
	const fileContent = await fetch(dataUrl(file)).then(data => data.text());
	cache.set(file, fileContent);
	return fileContent;
}

export function pcre(regex: string): RegExp {
	let finalRegex = regex;
	let finalFlags = new Set<string>();
	const inlineMatches = regex.matchAll(/\?([a-z]):/g);
	const startMatches = regex.matchAll(/\(\?([a-z]+)\)/g);
	for (const [match, flags] of [...inlineMatches, ...startMatches]) {
		finalRegex = finalRegex.replace(match, '');
		[...flags].forEach(flag => finalFlags.add(flag));
	}
	finalRegex = finalRegex
		.replace(/([*+]){2}/g, '$1') // ++ and *+ modifiers
		.replace(/\\A/g, '^').replace(/\\Z/g, '$') // start- and end-of-file markers
	return RegExp(finalRegex, [...finalFlags].join(''));
}

export async function readFile(filename: string, onlyFirstLine: boolean = false): Promise<string> {
	const chunkSize = 100;
	const stream = fs.createReadStream(filename, { highWaterMark: chunkSize });
	let content = '';
	for await (const data of stream) {
		content += data.toString();
		if (onlyFirstLine && content.includes('\n')) {
			return content.split(/\r?\n/)[0];
		}
	}
	return content;
}
