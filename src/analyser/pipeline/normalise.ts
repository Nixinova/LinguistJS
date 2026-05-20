import { getFileExtension } from '../../program/fs/normalisedPath.js';
import * as T from '../../types/types.js';

export function normaliseFiles(files: T.VirtualFile[]): T.VirtualFile[] {
	return files.map((file) => ({
		...file,
		extension: file.extension ?? getFileExtension(file.path),
		firstLine: file.firstLine ?? file.content?.split(/\r?\n/)[0],
		size: file.size ?? file.content?.length,
	}));
}
