/** Convert a PCRE regex into JS. */
export default function pcre(regex: string): RegExp {
	let finalRegex = regex;
	const replace = (search: string | RegExp, replace: string) => finalRegex = finalRegex.replace(search, replace);
	const finalFlags = new Set<string>();
	// Convert inline flag declarations
	const inlineMatches = regex.matchAll(/\?([a-z]):/g);
	const startMatches = regex.matchAll(/\(\?([a-z]+)\)/g);
	for (const [match, flags] of [...inlineMatches, ...startMatches]) {
		replace(match, '');
		[...flags].forEach(flag => finalFlags.add(flag));
	}
	// Remove PCRE-only syntax
	replace(/([*+]){2}/g, '$1');
	replace(/\(\?>/g, '(?:');
	// Remove start/end-of-file markers
	if (/\\[AZ]/.test(finalRegex)) {
		replace(/\\A/g, '^');
		replace(/\\Z/g, '$');
		finalFlags.delete('m');
	}
	else {
		finalFlags.add('m');
	}
	// Reformat free-spacing mode
	if (finalFlags.has('x')) {
		finalFlags.delete('x');
		replace(/#.+/g, '');
		replace(/^\s+|\s+$|\n/gm, '');
		replace(/\s+/g, ' ');
	}
	// Return final regex
	return RegExp(finalRegex, [...finalFlags].join(''));
}
