import { OptionValues } from 'commander';
import { Results } from '../../types/types.js';

export default function treeOutput(args: OptionValues, data: Results) {
	const treeParts: string[] = args.tree.split('.');
	let nestedData: Record<string, any> = data;
	for (const part of treeParts) {
		if (!nestedData[part]) {
			throw Error(`TraversalError: Key '${part}' cannot be found on output object.`);
		}
		nestedData = nestedData[part];
	}
	console.log(nestedData);
}
