import FS from 'fs';

/**
 * Read part of a file on disc.
 * @throws 'EPERM' if the file is not readable.
 */
export default async function readFileChunk(filename: string, onlyFirstLine: boolean = false): Promise<string> {
	const chunkSize = 100;
	const stream = FS.createReadStream(filename, { highWaterMark: chunkSize });
	let content = '';
	for await (const data of stream) { // may throw
		content += data.toString();
		if (onlyFirstLine && content.includes('\n')) {
			return content.split(/\r?\n/)[0];
		}
	}
	return content;
}
