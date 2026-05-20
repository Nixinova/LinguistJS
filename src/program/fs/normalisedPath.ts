import Path from 'node:path';

export const normPath = function normalisedPath(...inputPaths: string[]) {
	return Path.join(...inputPaths).replace(/\\/g, '/');
};

export const normAbsPath = function normalisedAbsolutePath(...inputPaths: string[]) {
	return Path.resolve(...inputPaths).replace(/\\/g, '/');
};

export const getFileExtension = function getFileExtension(filePath: string) {
	const extension = Path.extname(filePath).toLowerCase();
	if (extension) return extension;
	const basename = Path.basename(filePath);
	if (basename.startsWith('.') && basename.length > 1 && basename.indexOf('.', 1) === -1) {
		return basename.toLowerCase();
	}
	return '';
};
