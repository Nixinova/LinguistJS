import FS from 'node:fs';
import { ArgsHelpBuilder, cliArgs as args } from './cli/args.js';
import runCliAnalysis from './cli/runCliAnalysis.js';

const packageJson = JSON.parse(FS.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const VERSION = packageJson.version;

const getHelpMessage = () => new ArgsHelpBuilder()
	.name('linguist')
	.usage('--analyse [<folders...>] [<options...>]')

	.option('-a|--analyse [folders...]', 'Analyse the languages of all files in a folder')
	.break()
	.option('-i|--ignoredFiles <files...>', `A list of file path globs to ignore`)
	.option('-l|--ignoredLanguages <languages...>', `A list of languages to ignore`)
	.option('-c|--categories <categories...>', 'Language categories to include in output')
	.option('-C|--childLanguages [bool]', 'Display child languages instead of their parents', false)
	.option('-j|--json [bool]', 'Display the output as JSON', false)
	.option('-t|--tree <traversal>', 'Which part of the output JSON to display (dot-delimited)')
	.option('-F|--listFiles [bool]', 'Whether to list every matching file under the language results', false)
	.option('-m|--minSize <size>', 'Minimum size of file to show language results for (must have a unit: b, kb, mb, %, or loc)')
	.option('-q|--quick [bool]', 'Skip complex language analysis (alias for -{A|I|H|S}=false)', false)
	.option('-o|--offline [bool]', 'Use packaged data files instead of fetching latest from GitHub', false)
	.option('-L|--calculateLines [bool]', 'Calculate lines of code totals', true)
	.option('-V|--keepVendored [bool]', 'Prevent skipping over vendored/generated files', false)
	.option('-B|--keepBinary [bool]', 'Prevent skipping over binary files', false)
	.option('-r|--relativePaths [bool]', 'Convert absolute file paths to relative', false)
	.option('-A|--checkAttributes [bool]', 'Force the checking of gitattributes files', true)
	.option('-I|--checkIgnored [bool]', 'Force the checking of gitignore files', true)
	.option('-D|--checkDetected [bool]', 'Force files marked with linguist-detectable to always appear in output', true)
	.option('-H|--checkHeuristics [bool]', 'Apply heuristics to ambiguous languages', true)
	.option('-S|--checkShebang [bool]', 'Check shebang lines for explicit classification', true)
	.option('-M|--checkModeline [bool]', 'Check modelines for explicit classification', true)
	.option('-h|--help', 'Display this help message')
	.option('-v|--version', 'Display the installed version of linguist-js')
	.toString();

// Run Linguist
if (args.help) {
	console.log(getHelpMessage());
} else if (args.version) {
	console.log(`linguist-js ${VERSION}`);
} else if (args.analyse) {
	void runCliAnalysis(args);
} else {
	console.log(`Welcome to linguist-js, a JavaScript port of the github-linguist language analyser.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
