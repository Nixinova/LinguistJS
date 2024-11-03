import Path from 'path';

export const normPath = function normalisedPath(...inputPaths: string[]) {
	return Path.join(...inputPaths).replace(/\\/g, '/');
}

export const normAbsPath = function normalisedAbsolutePath(...inputPaths: string[]) {
	return Path.resolve(...inputPaths).replace(/\\/g, '/');
}

