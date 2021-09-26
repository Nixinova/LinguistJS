import globToRegexp from 'glob-to-regexp';

export default function parseGitGlob(path: string): RegExp {
	const globPath = `**/${path}`.replace(/\[:(space|digit):\]/, (_, val) => `\\${val[0]}`);
	return globToRegexp(globPath, { globstar: true, extended: true });
}
