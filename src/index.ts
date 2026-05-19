import ignore from 'ignore';
import { isBinaryFile } from 'isbinaryfile';
import FS from 'node:fs';
import Path from 'node:path';
import retrieveData from './program/data/retrieveData.js';
import { normPath } from './program/fs/normalisedPath.js';
import readFileChunk from './program/fs/readFile.js';
import getFiles from './program/processFiles.js';
import pcre from './program/utils/pcre.js';
import * as T from './types/types.js';

async function analyse(path?: string, opts?: T.Options): Promise<T.Results>;
async function analyse(paths?: string[], opts?: T.Options): Promise<T.Results>;
async function analyse(content?: Record<string, string>, opts?: T.Options): Promise<T.Results>;
async function analyse(rawInput?: string | string[] | Record<string, string>, opts: T.Options = {}): Promise<T.Results> {
	const inputs = {
		path: typeof rawInput === 'string' ? rawInput : null,
		paths: Array.isArray(rawInput) ? rawInput : null,
		content: typeof rawInput === 'object' && !Array.isArray(rawInput) ? rawInput : null,
	};
	const inputPaths = inputs.paths ?? (inputs.path ? [inputs.path] : null);
	const inputContent = inputs.content;
	const useRawContent = inputContent !== null;

	const input = useRawContent ? Object.keys(inputContent) : (inputPaths ?? []);

	// Normalise input option arguments
	opts = {
		calculateLines: opts.calculateLines ?? true, // default to true if unset
		checkIgnored: !opts.quick,
		checkDetected: !opts.quick,
		checkAttributes: !opts.quick,
		checkHeuristics: !opts.quick,
		checkShebang: !opts.quick,
		checkModeline: !opts.quick,
		...opts,
	};

	// Load data from github-linguist web repo
	const { langData, heuristicsData, vendorPaths } = await retrieveData(opts.offline ?? false);

	// Setup main variables
	const fileAssociations: Record<T.AbsFile, T.LanguageResult[]> = {};
	const extensions: Record<T.AbsFile, string> = {};
	const globOverrides: Record<T.AbsFile, T.LanguageResult> = {};
	const results: T.Results = {
		files: { count: 0, bytes: 0, lines: { total: 0, content: 0 }, results: {}, alternatives: {} },
		languages: { count: 0, bytes: 0, lines: { total: 0, content: 0 }, results: {} },
		unknown: { count: 0, bytes: 0, lines: { total: 0, content: 0 }, extensions: {}, filenames: {} },
		repository: {},
	};

	//*PREPARE FILES AND DATA*//

	const { files, manualAttributes, relPath } = await getFiles(input, opts, useRawContent, vendorPaths);
	const fileMatchesGlobs = (file: T.AbsFile, ...globs: T.FileGlob[]) => ignore().add(globs).ignores(relPath(file));

	// Ignore specific languages
	for (const lang of opts.ignoredLanguages ?? []) {
		for (const key in langData) {
			if (lang.toLowerCase() === key.toLowerCase()) {
				delete langData[key];
				break;
			}
		}
	}

	// Establish language overrides taken from gitattributes
	const forcedLangs = Object.entries(manualAttributes.attributes).filter(([, attrs]) => attrs.language);
	for (const [globPath, attrs] of forcedLangs) {
		let forcedLang = attrs.language;
		if (!forcedLang) continue;

		// If specified language is an alias, associate it with its full name
		if (!langData[forcedLang]) {
			const overrideLang = Object.entries(langData).find((entry) => entry[1].aliases?.includes(forcedLang!.toLowerCase()));
			if (overrideLang) {
				forcedLang = overrideLang[0];
			}
		}
		globOverrides[globPath] = forcedLang;
	}

	//*PARSE LANGUAGES*//

	const addResult = (file: T.AbsFile, result: T.LanguageResult) => {
		if (!fileAssociations[file]) {
			fileAssociations[file] = [];
			extensions[file] = '';
		}
		// Set parent to result group if it is present
		// Is nullish if either `opts.childLanguages` is set or if there is no group
		const finalResult = (!opts.childLanguages && result && langData[result] && langData[result].group) || result;
		if (!fileAssociations[file].includes(finalResult)) {
			fileAssociations[file].push(finalResult);
		}
		extensions[file] = Path.extname(file).toLowerCase();
	};

	const definiteness: Record<T.AbsFile, true | undefined> = {};
	const fromShebang: Record<T.AbsFile, true | undefined> = {};

	fileLoop: for (const file of files) {
		// Check manual override
		for (const globMatch in globOverrides) {
			if (!fileMatchesGlobs(file, globMatch)) continue;

			// If the given file matches the glob, apply the override to the file
			const forcedLang = globOverrides[globMatch];
			addResult(file, forcedLang);
			definiteness[file] = true;
			continue fileLoop; // no need to check other heuristics, the classified language has been found
		}

		// Check first line for readability
		let firstLine: string | null;
		if (useRawContent) {
			firstLine = inputContent[file]?.split('\n')[0] ?? null;
		} else if (FS.existsSync(file) && !FS.lstatSync(file).isDirectory()) {
			firstLine = await readFileChunk(file, true).catch(() => null);
		} else continue;

		// Skip if file is unreadable or blank
		if (firstLine === null) continue;

		// Check first line for explicit classification
		const modelineRegex = /-\*-|(?:syntax|filetype|ft)\s*=/;
		const hasShebang = opts.checkShebang && /^#!/.test(firstLine);
		const hasModeline = opts.checkModeline && modelineRegex.test(firstLine);
		if (!opts.quick && (hasShebang || hasModeline)) {
			const matches = [];
			for (const [lang, data] of Object.entries(langData)) {
				const langMatcher = (lang: string) => `\\b${lang.toLowerCase().replace(/\W/g, '\\$&')}(?![\\w#+*]|-\*-)`;
				// Check for interpreter match
				if (opts.checkShebang && hasShebang) {
					const matchesInterpretor = data.interpreters?.some((interpreter) => firstLine.match(`\\b${interpreter}\\b`));
					if (matchesInterpretor) matches.push(lang);
				}
				// Check modeline declaration
				if (opts.checkModeline && hasModeline) {
					const modelineText = firstLine.toLowerCase().split(modelineRegex)[1];
					const matchesLang = modelineText.match(langMatcher(lang));
					const matchesAlias = data.aliases?.some((lang) => modelineText.match(langMatcher(lang)));
					if (matchesLang || matchesAlias) matches.push(lang);
				}
			}
			// Add identified language(s)
			if (matches.length) {
				for (const match of matches) addResult(file, match);
				if (matches.length === 1) definiteness[file] = true;
				fromShebang[file] = true;
				continue;
			}
		}
		// Search each language
		let skipExts = false;
		// Check if filename is a match
		for (const lang in langData) {
			const matchesName = langData[lang].filenames?.some((name) => Path.basename(file.toLowerCase()) === name.toLowerCase());
			if (matchesName) {
				addResult(file, lang);
				skipExts = true;
			}
		}
		// Check if extension is a match
		const possibleExts: { ext: string; lang: T.Language }[] = [];
		if (!skipExts)
			for (const lang in langData) {
				const extMatches = langData[lang].extensions?.filter((ext) => file.toLowerCase().endsWith(ext.toLowerCase()));
				if (extMatches?.length) {
					for (const ext of extMatches) possibleExts.push({ ext, lang });
				}
			}
		// Apply more specific extension if available
		const isComplexExt = (ext: string) => /\..+\./.test(ext);
		const hasComplexExt = possibleExts.some((data) => isComplexExt(data.ext));
		for (const { ext, lang } of possibleExts) {
			if (hasComplexExt && !isComplexExt(ext)) continue;
			if (!hasComplexExt && isComplexExt(ext)) continue;
			addResult(file, lang);
		}
		// Fallback to null if no language matches
		if (!fileAssociations[file]) {
			addResult(file, null);
		}
	}
	// Narrow down file associations to the best fit
	for (const file in fileAssociations) {
		// Skip if file has explicit association
		if (definiteness[file]) {
			results.files.results[file] = fileAssociations[file][0];
			continue;
		}

		// Skip binary files
		if (!useRawContent && !opts.keepBinary) {
			if (await isBinaryFile(file)) continue;
		}

		// Parse heuristics if applicable
		if (opts.checkHeuristics)
			for (const heuristics of heuristicsData.disambiguations) {
				// Make sure the extension matches the current file
				if (!fromShebang[file] && !heuristics.extensions.includes(extensions[file])) continue;
				// Load heuristic rules
				for (const heuristic of heuristics.rules) {
					// Make sure the language is not an array
					if (Array.isArray(heuristic.language)) {
						heuristic.language = heuristic.language[0];
					}

					// Make sure the results includes this language
					const languageGroup = langData[heuristic.language]?.group;
					const matchesLang = fileAssociations[file].includes(heuristic.language);
					const matchesParent = languageGroup && fileAssociations[file].includes(languageGroup);
					if (!matchesLang && !matchesParent) continue;

					// Normalise heuristic data
					const patterns: string[] = [];
					const normalise = (contents: string | string[]) => patterns.push(...[contents].flat());
					if (heuristic.pattern) normalise(heuristic.pattern);
					if (heuristic.named_pattern) normalise(heuristicsData.named_patterns[heuristic.named_pattern]);
					if (heuristic.and) {
						for (const data of heuristic.and) {
							if (data.pattern) normalise(data.pattern);
							if (data.named_pattern) normalise(heuristicsData.named_patterns[data.named_pattern]);
						}
					}

					// Check file contents and apply heuristic patterns
					const fileContent = useRawContent ? inputContent[file] : await readFileChunk(file).catch(() => null);

					// Skip if file read errors
					if (fileContent === null) continue;

					// Apply heuristics
					if (!patterns.length || patterns.some((pattern) => pcre(pattern).test(fileContent))) {
						results.files.results[file] = heuristic.language;
						break;
					}
				}
			}
		// If no heuristics, assign a language
		if (!results.files.results[file]) {
			const possibleLangs = fileAssociations[file];
			// Assign first language as a default option
			const defaultLang = possibleLangs[0];
			const alternativeLangs = possibleLangs.slice(1);
			results.files.results[file] = defaultLang;
			// List alternative languages if there are any
			if (alternativeLangs.length > 0) results.files.alternatives[file] = alternativeLangs;
		}
	}

	// Skip specified categories
	if (opts.categories?.length) {
		const categories: T.Category[] = ['data', 'markup', 'programming', 'prose'];
		const hiddenCategories = categories.filter((cat) => !opts.categories!.includes(cat));
		for (const [file, lang] of Object.entries(results.files.results)) {
			// Skip if language is not hidden
			if (!hiddenCategories.some((cat) => lang && langData[lang]?.type === cat)) continue;
			// Skip if language is forced as detectable
			if (opts.checkDetected) {
				const detectable = ignore().add(manualAttributes.getFlaggedGlobs('detectable', true));
				if (detectable.ignores(relPath(file))) continue;
			}
			// Delete result otherwise
			delete results.files.results[file];
			if (lang) delete results.languages.results[lang];
		}
		for (const category of hiddenCategories) {
			for (const [lang, { type }] of Object.entries(results.repository)) {
				if (type === category) {
					delete results.languages.results[lang];
				}
			}
		}
	}

	// Convert paths to relative
	if (!useRawContent && opts.relativePaths) {
		const newMap: Record<T.RelFile, T.LanguageResult> = {};
		for (const [file, lang] of Object.entries(results.files.results)) {
			let relPath = normPath(Path.relative(process.cwd(), file));
			if (!relPath.startsWith('../')) {
				relPath = './' + relPath;
			}
			newMap[relPath] = lang;
		}
		results.files.results = newMap;
	}

	// Load language bytes size
	for (const [file, lang] of Object.entries(results.files.results)) {
		if (lang && !langData[lang]) continue;
		// Calculate file size
		const fileSize = useRawContent ? inputContent[file]?.length : FS.statSync(file).size;
		// Calculate lines of code
		const loc = { total: 0, content: 0 };
		if (opts.calculateLines) {
			const fileContent = useRawContent ? inputContent[file] : FS.readFileSync(file).toString();
			const allLines = fileContent.split(/\r?\n/gm);
			loc.total = allLines.length;
			loc.content = allLines.filter((line) => line.trim().length > 0).length;
		}
		// Apply to files totals
		results.files.bytes += fileSize;
		results.files.lines.total += loc.total;
		results.files.lines.content += loc.content;
		// Add results to 'languages' section if language match found, or 'unknown' section otherwise
		if (lang) {
			// update language in repository if not yet present
			if (!results.repository[lang]) {
				const { type, color } = langData[lang];
				results.repository[lang] = { type, color };
				if (opts.childLanguages) {
					results.repository[lang].parent = langData[lang].group;
				}
			}
			// set default if unset
			results.languages.results[lang] ??= { count: 0, bytes: 0, lines: { total: 0, content: 0 } };
			// apply results to 'languages' section
			results.languages.results[lang].count++;
			results.languages.results[lang].bytes += fileSize;
			results.languages.bytes += fileSize;
			results.languages.results[lang].lines.total += loc.total;
			results.languages.results[lang].lines.content += loc.content;
			results.languages.lines.total += loc.total;
			results.languages.lines.content += loc.content;
		} else {
			const ext = Path.extname(file);
			const unknownType = ext ? 'extensions' : 'filenames';
			const name = ext || Path.basename(file);
			// apply results to 'unknown' section
			results.unknown[unknownType][name] ??= 0;
			results.unknown[unknownType][name] += fileSize;
			results.unknown.bytes += fileSize;
			results.unknown.lines.total += loc.total;
			results.unknown.lines.content += loc.content;
		}
	}

	// Set lines output to NaN when line calculation is disabled
	if (opts.calculateLines === false) {
		results.files.lines = { total: NaN, content: NaN };
	}

	// Set counts
	results.files.count = Object.keys(results.files.results).length;
	results.languages.count = Object.keys(results.languages.results).length;
	results.unknown.count = Object.keys({ ...results.unknown.extensions, ...results.unknown.filenames }).length;

	// Return
	return results;
}
export default analyse;
