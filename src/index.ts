import fs from 'fs';
import paths from 'path';
import yaml from 'js-yaml';
import ignore from 'ignore';
import commonPrefix from 'common-path-prefix';
import binaryData from 'binary-extensions';
import { isBinaryFile } from 'isbinaryfile';

import walk from './helpers/walk-tree';
import loadFile, { parseGeneratedDataFile } from './helpers/load-data';
import readFile from './helpers/read-file';
import parseAttributes, { FlagAttributes } from './helpers/parse-gitattributes';
import pcre from './helpers/convert-pcre';
import * as T from './types';
import * as S from './schema';

async function analyse(path?: string, opts?: T.Options): Promise<T.Results>
async function analyse(paths?: string[], opts?: T.Options): Promise<T.Results>
async function analyse(input?: string | string[], opts: T.Options = {}): Promise<T.Results> {
	const useRawContent = opts.fileContent !== undefined;
	input = [input ?? []].flat();

	// Normalise input option arguments
	opts = {
		checkIgnored: !opts.quick,
		checkAttributes: !opts.quick,
		checkHeuristics: !opts.quick,
		checkShebang: !opts.quick,
		checkModeline: !opts.quick,
		fileContent: [opts.fileContent ?? []].flat(),
		...opts,
	};

	// Load data from github-linguist web repo
	const langData = <S.LanguagesScema>await loadFile('languages.yml', opts.offline).then(yaml.load);
	const vendorData = <S.VendorSchema>await loadFile('vendor.yml', opts.offline).then(yaml.load);
	const docData = <S.VendorSchema>await loadFile('documentation.yml', opts.offline).then(yaml.load);
	const heuristicsData = <S.HeuristicsSchema>await loadFile('heuristics.yml', opts.offline).then(yaml.load);
	const generatedData = <string[]>await loadFile('generated.rb', opts.offline).then(parseGeneratedDataFile);
	const vendorPaths = [...vendorData, ...docData, ...generatedData];

	// Setup main variables
	const fileAssociations: Record<T.FilePath, T.LanguageResult[]> = {};
	const extensions: Record<T.FilePath, string> = {};
	const overrides: Record<T.FilePath, T.LanguageResult> = {};
	const results: T.Results = {
		files: { count: 0, bytes: 0, results: {}, alternatives: {} },
		languages: { count: 0, bytes: 0, results: {} },
		unknown: { count: 0, bytes: 0, extensions: {}, filenames: {} },
	};

	//*PREPARE FILES AND DATA*//

	// Set a common root path so that vendor paths do not incorrectly match parent folders
	const normPath = (file: string) => file.replace(/\\/g, '/');
	const resolvedInput = input.map(path => normPath(paths.resolve(path)));
	const commonRoot = (input.length > 1 ? commonPrefix(resolvedInput) : resolvedInput[0]).replace(/\/?$/, '');
	const localRoot = (folder: string) => folder.replace(commonRoot, '').replace(/^\//, '');
	const relPath = (file: string) => normPath(paths.relative(commonRoot, file));
	const unRelPath = (file: string) => normPath(paths.resolve(commonRoot, file));
	const localPath = (file: string) => localRoot(unRelPath(file));

	// Prepare list of ignored files
	const ignored = ignore();
	ignored.add('.git/');
	ignored.add(opts.ignoredFiles ?? []);
	const regexIgnores: RegExp[] = [];
	if (!opts.keepVendored) regexIgnores.push(...vendorPaths.map(path => RegExp(path, 'i')));

	// Load file paths and folders
	let files: string[];
	let folders: string[];
	if (useRawContent) {
		// Uses raw file content
		files = input;
		folders = [''];
	}
	else {
		// Uses directory on disc
		const data = walk({ init: true, commonRoot, folderRoots: resolvedInput, folders: resolvedInput, ignored });
		files = data.files;
		folders = data.folders;
	}

	// Load gitignore data and apply ignores rules
	if (!useRawContent) {
		for (const folder of folders) {
			// Parse gitignores
			const ignoresFile = paths.join(folder, '.gitignore');
			if (opts.checkIgnored && fs.existsSync(ignoresFile)) {
				const ignoresData = await readFile(ignoresFile);
				const localIgnoresData = ignoresData.replace(/^[\/\\]/g, localRoot(folder) + '/');
				ignored.add(localIgnoresData);
				files = ignored.filter(files.map(relPath)).map(unRelPath);
			}
		}
	}

	// Fetch and normalise gitattributes data of all subfolders and save to metadata
	const manualAttributes: Record<T.FilePath, FlagAttributes> = {}; // Maps file globs to gitattribute boolean flags
	const getFlaggedGlobs = (attr: keyof FlagAttributes, val: boolean) => {
		return Object.entries(manualAttributes).filter(([, attrs]) => attrs[attr] === val).map(([glob,]) => glob)
	};
	if (!useRawContent && opts.checkAttributes) {
		const nestedAttrFiles = files.filter(file => file.endsWith('.gitattributes'));
		for (const attrFile of nestedAttrFiles) {
			const relAttrFile = relPath(attrFile);
			const relAttrFolder = paths.dirname(relAttrFile);
			const contents = await readFile(attrFile);
			const parsed = parseAttributes(contents, relAttrFolder);
			for (const { glob, attrs } of parsed) {
				manualAttributes[glob] = attrs;
			}
		}
	}

	// Apply vendor file path matches and filter out vendored files
	if (!opts.keepVendored) {
		// Get data of files that have been manually marked with metadata
		const vendorTrueGlobs = [...getFlaggedGlobs('vendored', true), ...getFlaggedGlobs('generated', true), ...getFlaggedGlobs('documentation', true)];
		const vendorFalseGlobs = [...getFlaggedGlobs('vendored', false), ...getFlaggedGlobs('generated', false), ...getFlaggedGlobs('documentation', false)];
		// Set up glob ignore object to use for expanding globs to match files
		const vendorOverrides = ignore();
		vendorOverrides.add(vendorFalseGlobs);
		// Remove all files marked as vendored by default
		const excludedFiles = files.filter(file => vendorPaths.some(vPath => RegExp(vPath).test(relPath(file))));
		files = files.filter(file => !excludedFiles.includes(file));
		// Re-add removed files that are overridden manually in gitattributes
		const overriddenExcludedFiles = excludedFiles.filter(file => vendorOverrides.ignores(relPath(file)));
		files.push(...overriddenExcludedFiles);
		// Remove files explicitly marked as vendored in gitattributes
		files = files.filter(file => !vendorTrueGlobs.includes(relPath(file)));
	}

	// Filter out binary files
	// TODO FIX doesnt work
	if (!opts.keepBinary) {
		const binaryIgnored = ignore();
		binaryIgnored.add(getFlaggedGlobs('binary', true));
		files = binaryIgnored.filter(files.map(relPath)).map(unRelPath);
	}

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
	const forcedLangs = Object.entries(manualAttributes).filter(([, attrs]) => attrs.language);
	for (const [path, attrs] of forcedLangs) {
		let forcedLang = attrs.language;
		if (!forcedLang) continue;

		// If specified language is an alias, associate it with its full name
		if (!langData[forcedLang]) {
			const overrideLang = Object.entries(langData).find(entry => entry[1].aliases?.includes(forcedLang!.toLowerCase()));
			if (overrideLang) {
				forcedLang = overrideLang[0];
			}
		}
		overrides[unRelPath(path)] = forcedLang;
	}

	//*PARSE LANGUAGES*//

	// Load all files and parse languages
	const addResult = (file: string, result: T.LanguageResult) => {
		if (!fileAssociations[file]) {
			fileAssociations[file] = [];
			extensions[file] = '';
		}
		// Set parent to result group if it is present
		// Is nullish if either `opts.childLanguages` is set or if there is no group
		const finalResult = !opts.childLanguages && result && langData[result] && langData[result].group || result;
		if (!fileAssociations[file].includes(finalResult))
			fileAssociations[file].push(finalResult);
		extensions[file] = paths.extname(file).toLowerCase();
	};

	// List all languages that could be associated with a given file
	const definiteness: Record<T.FilePath, true | undefined> = {};
	const fromShebang: Record<T.FilePath, true | undefined> = {};
	for (const file of files) {
		// Check manual override
		if (file in overrides) {
			addResult(file, overrides[file]);
			definiteness[file] = true;
			continue;
		}

		// Check first line for readability
		let firstLine: string | null;
		if (useRawContent) {
			firstLine = opts.fileContent?.[files.indexOf(file)]?.split('\n')[0] ?? null;
		}
		else if (fs.existsSync(file) && !fs.lstatSync(file).isDirectory()) {
			firstLine = await readFile(file, true).catch(() => null);
		}
		else continue;

		// Skip if file is unreadable
		if (firstLine === null) continue;

		// Check first line for explicit classification
		const hasShebang = opts.checkShebang && /^#!/.test(firstLine);
		const hasModeline = opts.checkModeline && /-\*-|(syntax|filetype|ft)\s*=/.test(firstLine);
		if (!opts.quick && (hasShebang || hasModeline)) {
			const matches = [];
			for (const [lang, data] of Object.entries(langData)) {
				const langMatcher = (lang: string) => `\\b${lang.toLowerCase().replace(/\W/g, '\\$&')}(?![\\w#+*]|-\*-)`;
				// Check for interpreter match
				if (opts.checkShebang && hasShebang) {
					const matchesInterpretor = data.interpreters?.some(interpreter => firstLine!.match(`\\b${interpreter}\\b`));
					if (matchesInterpretor)
						matches.push(lang);
				}
				// Check modeline declaration
				if (opts.checkModeline && hasModeline) {
					const modelineText = firstLine!.toLowerCase().replace(/^.*-\*-(.+)-\*-.*$/, '$1');
					const matchesLang = modelineText.match(langMatcher(lang));
					const matchesAlias = data.aliases?.some(lang => modelineText.match(langMatcher(lang)));
					if (matchesLang || matchesAlias)
						matches.push(lang);
				}
			}
			// Add identified language(s)
			if (matches.length) {
				for (const match of matches)
					addResult(file, match);
				if (matches.length === 1)
					definiteness[file] = true;
				fromShebang[file] = true;
				continue;
			}
		}
		// Search each language
		let skipExts = false;
		// Check if filename is a match
		for (const lang in langData) {
			const matchesName = langData[lang].filenames?.some(name => paths.basename(file.toLowerCase()) === name.toLowerCase());
			if (matchesName) {
				addResult(file, lang);
				skipExts = true;
			}
		}
		// Check if extension is a match
		const possibleExts: { ext: string, lang: T.Language }[] = [];
		if (!skipExts) for (const lang in langData) {
			const extMatches = langData[lang].extensions?.filter(ext => file.toLowerCase().endsWith(ext.toLowerCase()));
			if (extMatches?.length) {
				for (const ext of extMatches)
					possibleExts.push({ ext, lang });
			}
		}
		// Apply more specific extension if available
		const isComplexExt = (ext: string) => /\..+\./.test(ext);
		const hasComplexExt = possibleExts.some(data => isComplexExt(data.ext));
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

		// Parse heuristics if applicable
		if (opts.checkHeuristics) for (const heuristics of heuristicsData.disambiguations) {
			// Make sure the extension matches the current file
			if (!fromShebang[file] && !heuristics.extensions.includes(extensions[file]))
				continue;
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
				if (!matchesLang && !matchesParent)
					continue;

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
				const fileContent = opts.fileContent?.length ? opts.fileContent[files.indexOf(file)] : await readFile(file).catch(() => null);
				// Skip if file read errors
				if (fileContent === null) continue;
				// Apply heuristics
				if (!patterns.length || patterns.some(pattern => pcre(pattern).test(fileContent))) {
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
			const alternativeLangs = possibleLangs.slice(1)
			results.files.results[file] = defaultLang;
			// List alternative languages if there are any
			if (alternativeLangs.length > 0)
				results.files.alternatives[file] = alternativeLangs;
		}
	}

	// Skip specified categories
	if (opts.categories?.length) {
		const categories: T.Category[] = ['data', 'markup', 'programming', 'prose'];
		const hiddenCategories = categories.filter(cat => !opts.categories!.includes(cat));
		for (const [file, lang] of Object.entries(results.files.results)) {
			if (!hiddenCategories.some(cat => lang && langData[lang]?.type === cat)) {
				continue;
			}
			delete results.files.results[file];
			if (lang) {
				delete results.languages.results[lang];
			}
		}
		for (const category of hiddenCategories) {
			for (const [lang, { type }] of Object.entries(results.languages.results)) {
				if (type === category) {
					delete results.languages.results[lang];
				}
			}
		}
	}

	// Convert paths to relative
	if (!useRawContent && opts.relativePaths) {
		const newMap: Record<T.FilePath, T.LanguageResult> = {};
		for (const [file, lang] of Object.entries(results.files.results)) {
			let relPath = paths.relative(process.cwd(), file).replace(/\\/g, '/');
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
		const fileSize = opts.fileContent?.[files.indexOf(file)]?.length ?? fs.statSync(file).size;
		results.files.bytes += fileSize;
		// If no language found, add extension in other section
		if (!lang) {
			const ext = paths.extname(file);
			const unknownType = ext === '' ? 'filenames' : 'extensions';
			const name = ext === '' ? paths.basename(file) : ext;
			results.unknown[unknownType][name] ??= 0;
			results.unknown[unknownType][name] += fileSize;
			results.unknown.bytes += fileSize;
			continue;
		}
		// Add language and bytes data to corresponding section
		const { type } = langData[lang];
		results.languages.results[lang] ??= { type, bytes: 0, color: langData[lang].color };
		if (opts.childLanguages) {
			results.languages.results[lang].parent = langData[lang].group;
		}
		results.languages.results[lang].bytes += fileSize;
		results.languages.bytes += fileSize;
	}

	// Set counts
	results.files.count = Object.keys(results.files.results).length;
	results.languages.count = Object.keys(results.languages.results).length;
	results.unknown.count = Object.keys({ ...results.unknown.extensions, ...results.unknown.filenames }).length;

	// Return
	return results;
}
export = analyse;
