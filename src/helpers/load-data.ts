import FS from 'node:fs';
import Path from 'node:path';
import fetch from 'cross-fetch';
import Cache from 'node-cache';

const cache = new Cache({});

async function loadWebFile(file: string): Promise<string> {
	// Return cache if it exists
	const cachedContent = cache.get<string>(file);
	if (cachedContent) return cachedContent;
	// Otherwise cache the request
	const dataUrl = (file: string): string => `https://raw.githubusercontent.com/github/linguist/HEAD/lib/linguist/${file}`;
	// Load file content, falling back to the local file if the request fails
	const fileContent = await fetch(dataUrl(file)).then(data => data.text()).catch(async () => await loadLocalFile(file));
	cache.set(file, fileContent);
	return fileContent;
}

async function loadLocalFile(file: string): Promise<string> {
	const filePath = Path.resolve(__dirname, '../../ext', file);
	return FS.promises.readFile(filePath).then(buffer => buffer.toString());
}

/** Nukes unused `generated.rb` file content. */
export function parseGeneratedDataFile(fileContent: string): string[] {
	return [...fileContent.match(/(?<=name\.match\(\/).+?(?=(?<!\\)\/)/gm) ?? []];
}

/** Load a data file from github-linguist. */
export default function loadFile(file: string, offline: boolean = false): Promise<string> {
	return offline ? loadLocalFile(file) : loadWebFile(file);
}
