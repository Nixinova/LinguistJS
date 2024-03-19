export default function parseGitignore(content: string): string[] {
	const readableData = content
		// Remove comments unless escaped
		.replace(/(?<!\\)#.+/g, '')
		// Remove whitespace unless escaped
		.replace(/(?:(?<!\\)\s)+$/g, '')
	const arrayData = readableData.split(/\r?\n/).filter(data => data);
	return arrayData;
}
