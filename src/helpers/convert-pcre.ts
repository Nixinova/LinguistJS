/** Convert a PCRE regex into JS. */
export default function pcre(regex: string): RegExp {
	let finalRegex = regex;
	let finalFlags = new Set<string>();
	const inlineMatches = regex.matchAll(/\?([a-z]):/g);
	const startMatches = regex.matchAll(/\(\?([a-z]+)\)/g);
	for (const [match, flags] of [...inlineMatches, ...startMatches]) {
		finalRegex = finalRegex.replace(match, '');
		[...flags].forEach(flag => finalFlags.add(flag));
	}
	finalRegex = finalRegex
		.replace(/([*+]){2}/g, '$1') // ++ and *+ modifiers
		.replace(/\\A/g, '^').replace(/\\Z/g, '$') // start- and end-of-file markers
	return RegExp(finalRegex, [...finalFlags].join(''));
}
