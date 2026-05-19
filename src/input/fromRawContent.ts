import { getFileExtension } from '../program/fs/normalisedPath.js';
import * as T from '../types/types.js';

export default function fromRawContent(contents: Record<string, string>, vendorPaths: string[] = []): T.VirtualFile[] {
	return Object.entries(contents).map(([path, content]) => {
		const extension = getFileExtension(path);
		const metadata: T.VirtualFile['metadata'] = {};
		if (vendorPaths.some((pathPtn) => RegExp(pathPtn, 'i').test(path))) {
			metadata.vendored = true;
		}
		return {
			path,
			content,
			firstLine: content.split(/\r?\n/)[0] ?? '',
			size: Buffer.byteLength(content, 'utf-8'),
			extension,
			isBinary: false,
			metadata: Object.keys(metadata).length ? metadata : undefined,
		};
	});
}
