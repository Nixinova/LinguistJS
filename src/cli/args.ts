import { parseArgs } from "node:util";

const options = {
	help: { type: 'boolean', short: 'h' },
	version: { type: 'boolean', short: 'v' },

	analyse: { type: 'string', multiple: true, short: 'a' },

	ignoredFiles: { type: 'string', multiple: true, short: 'i' },
	ignoredLanguages: { type: 'string', multiple: true, short: 'l' },
	categories: { type: 'string', multiple: true, short: 'c' },
	childLanguages: { type: 'boolean', short: 'C' },
	json: { type: 'boolean', short: 'j' },
	tree: { type: 'string', short: 't' },
	listFiles: { type: 'boolean', short: 'F' },
	minSize: { type: 'string', short: 'm' },
	quick: { type: 'boolean', short: 'q' },
	offline: { type: 'boolean', short: 'o' },
	calculateLines: { type: 'boolean', short: 'L' },
	keepVendored: { type: 'boolean', short: 'V' },
	keepBinary: { type: 'boolean', short: 'B' },
	relativePaths: { type: 'boolean', short: 'r' },
	checkAttributes: { type: 'boolean', short: 'A' },
	checkIgnored: { type: 'boolean', short: 'I' },
	checkDetected: { type: 'boolean', short: 'D' },
	checkHeuristics: { type: 'boolean', short: 'H' },
	checkShebang: { type: 'boolean', short: 'S' },
	checkModeline: { type: 'boolean', short: 'M' },
} as const;

let argParams = {} as Record<keyof typeof options, { long: string, short: string }>;
for (const _key in options) {
	const key = _key as keyof typeof options;
	argParams[key] = { long: '--' + key, short: '-' + options[key].short };
}

// Manually adjust argv so that the node util parseArgs func will not throw for Linguist's usage
// For --analyse, we want the type to be `string[]?` so we will add an empty '' value if no value follows `-a`
let argv = process.argv.slice(2);
if (argv.includes(argParams.analyse.long) || argv.includes(argParams.analyse.short)) {
	const index = getArgIndex(argParams.analyse.long) ?? getArgIndex(argParams.analyse.short)!;
	// insert empty string param after the -a param value
	argv = [...argv.slice(0, index + 1), '', ...argv.slice(index + 1)];
}

export let { values: cliArgs } = parseArgs({ options, allowPositionals: true, args: argv });
export type OptionValues = typeof cliArgs;

// Now, the above will not parse `multiple` properties properly
// This is because the `multiple` prop requires the option be respecified for each call
// i.e. `-a folder1 -a folder2` instead of `-a folder1 folder2`
// So we need to manually handle the multiple options
for (const _key in (options)) {
	const key = _key as keyof typeof options;
	const option = options[key];
	if (!('multiple' in option) || !option.multiple) continue;

	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === `--${key}` || argv[i] === `-${option.short}`) {
			i++; // consume this arg
			while (i < argv.length && !argv[i].startsWith('-')) {
				if (Array.isArray(cliArgs[key]) && !cliArgs[key].includes(argv[i])) {
					(cliArgs[key] as string[]).push(argv[i]);
				}
				i++; // consume this arg
			}
		}
	}
}

export class ArgsHelpBuilder {
	#name: string = '';
	#usage: string = '';
	#argsHelp: Array<{ command: string, description: string, default?: any } | null> = [];

	name(name: string) {
		this.#name = name;
		return this;
	}

	usage(usage: string) {
		this.#usage = usage;
		return this;
	}

	option(command: string, description: string, defaultValue?: any) {
		this.#argsHelp.push({ command, description, default: defaultValue });
		return this;
	}

	break() {
		this.#argsHelp.push(null);
		return this;
	}

	toString() {
		const lines: string[] = [];

		lines.push(`Usage: ${this.#name} ${this.#usage}`);
		lines.push('');
		lines.push('Options:');

		const maxLineLength = Math.max(...this.#argsHelp.map(option => option?.command.length ?? 0));

		for (const option of this.#argsHelp) {
			if (option == null) {
				lines.push('')
			} else {
				const defaultText = option.default !== undefined ? ` (default: ${option.default})` : '';
				lines.push(`  ${option.command.padEnd(maxLineLength, ' ')}  ${option.description}${defaultText}`);
			}
		}
		return lines.join('\n');
	}
}

function getArgIndex(x: string) {
	const index = argv.indexOf(x);
	return index < 0 ? null : index;
}
