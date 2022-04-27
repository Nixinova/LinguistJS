import fetch from 'cross-fetch';
import Cache from 'node-cache';

const cache = new Cache({});

/** Load a data file from github-linguist. */
export default async function loadFile(file: string): Promise<string> {
	// Return cache if it exists
	const cachedContent = cache.get<string>(file);
	if (cachedContent) return cachedContent;
	// Otherwise cache the request
	const dataUrl = (file: string): string => `https://raw.githubusercontent.com/github/linguist/master/lib/linguist/${file}`;
	const fileContent = await fetch(dataUrl(file)).then(data => data.text());
	cache.set(file, fileContent);
	return fileContent;
}
