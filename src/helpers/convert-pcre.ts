/** Convert a PCRE regex into JS. */
export default function pcre(regex: string): RegExp {
	let finalRegex = regex;
	let finalFlags = new Set<string>();
	// Convert inline flag declarations
	const inlineMatches = regex.matchAll(/\?([a-z]):/g);
	const startMatches = regex.matchAll(/\(\?([a-z]+)\)/g);
	for (const [match, flags] of [...inlineMatches, ...startMatches]) {
		finalRegex = finalRegex.replace(match, '');
		[...flags].forEach(flag => finalFlags.add(flag));
	}
	// Remove invalid modifiers
	finalRegex = finalRegex.replace(/([*+]){2}/g, '$1')
	// Remove start/end-of-file markers
	if (/\\[AZ]/.test(finalRegex)) {
		finalRegex = finalRegex.replace(/\\A/g, '^').replace(/\\Z/g, '$');
		finalFlags.delete('m');
	}
	else finalFlags.add('m');
	
	return RegExp(finalRegex, [...finalFlags].join(''));
}
