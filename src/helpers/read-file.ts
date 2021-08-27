import fs from 'fs';

/** Read part of a file on disc. */
export default async function readFile(filename: string, onlyFirstLine: boolean = false): Promise<string> {
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
