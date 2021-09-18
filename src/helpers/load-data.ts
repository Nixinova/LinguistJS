import fetch from 'cross-fetch';
import Cache from 'node-cache';

const cache = new Cache({});

/** Load a data file from github-linguist. */
export async function loadFile(file: string): Promise<string> {
	// Return cache if it exists
	const cachedContent = cache.get<string>(file);
	if (cachedContent) return cachedContent;
	// Otherwise cache the request
	const dataUrl = (file: string): string => `https://raw.githubusercontent.com/github/linguist/HEAD/${file}`;
	const fileContent = await fetch(dataUrl(file)).then(data => data.text());
	cache.set(file, fileContent);
	return fileContent;
}

/** Load a data file from github-linguist. */
export async function loadApi(path: string): Promise<object> {
	// Return cache if it exists
	const cachedContent = cache.get<object>(path);
	if (cachedContent) return cachedContent;
	// Otherwise cache the request
	const dataUrl = (file: string): string => `https://api.github.com/repos/github/linguist/${file}`;
	const fileContent = <object>await fetch(dataUrl(path)).then(data => data.json());
	cache.set(path, fileContent);
	return fileContent;
}
