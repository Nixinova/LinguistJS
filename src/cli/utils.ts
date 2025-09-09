export function colouredMsg([r, g, b]: [number, number, number], msg: string): string {
	return `\u001B[${38};2;${r};${g};${b}m${msg}\u001b[0m`;
}

export function hexToRgb(hex: string): [number, number, number] {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return [r, g, b];
}
