import Path from 'path';

import * as T from '../types';

export const normPath = function normalisedPath<X extends T.RelFile | T.AbsFile>(...paths: X[]): X {
	return Path.join(...paths).replace(/\\/g, '/') as X;
}

export const normAbsPath = function normalisedAbsolutePath(...paths: T.AbsFile[]): T.AbsFile {
	return Path.resolve(...paths).replace(/\\/g, '/') as T.AbsFile;
}

export const pathResolve = (...paths: string[]) => Path.resolve(...paths) as T.AbsFile;

export const pathRelative = (from: string, to: string) => Path.relative(from, to) as T.RelFile;
