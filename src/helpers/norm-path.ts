import paths from 'path';

export const normPath = function normalisedPath(...inputPaths: string[]) {
	return paths.join(...inputPaths).replace(/\\/g, '/');
}

export const normAbsPath = function normalisedAbsolutePath(...inputPaths: string[]) {
	return paths.resolve(...inputPaths).replace(/\\/g, '/');
}

