import { OptionValues } from 'commander';
import analyseFs from '../entry/analyseFs.js';
import normaliseOpts from '../input/normaliseOpts.js';
import defaultOutput from './output/default.js';
import treeOutput from './output/tree.js';

const validCategories = ['data', 'programming', 'prose', 'markup'];

export default async function runCliAnalysis(args: OptionValues) {
	// Check arguments
	if (args.categories?.some((category: string) => !validCategories.includes(category))) {
		console.log(`Error: '${args.categories.join(', ')}' contains an invalid category.`);
		console.log(`\tValid options: ${validCategories.join(', ')}.`);
		return;
	}

	// Analyse language data
	const folders = args.analyse === true ? ['.'] : args.analyse;
	const data = await analyseFs(folders, normaliseOpts(args));

	// Print output
	if (!args.json) {
		defaultOutput(args, data);
	} else if (args.tree) {
		treeOutput(args, data);
	} else {
		console.dir(data, { depth: null });
	}
}
