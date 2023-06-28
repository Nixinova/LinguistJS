import fs from 'fs';
import paths from 'path';
import yaml from 'yaml';
import ignore from 'ignore';
import commonPrefix from 'common-path-prefix';
import binaryData from 'binary-extensions';
import { isBinaryFile } from 'isbinaryfile';

import walk from './helpers/walk-tree';
import loadFile from './helpers/load-data';
import readFile from './helpers/read-file';
import pcre from './helpers/convert-pcre';
import * as T from './types';
import * as S from './schema';

async function analyse(path?: string, opts?: T.Options): Promise<T.Results>
async function analyse(paths?: string[], opts?: T.Options): Promise<T.Results>
async function analyse(input?: string | string[], opts: T.Options = {}): Promise<T.Results> {
	const useRawContent = opts.fileContent !== undefined;
	input = [input ?? []].flat();
	opts.fileContent = [opts.fileContent ?? []].flat();

	// Load data from github-linguist web repo
	const yamlParse = (doc: string) => yaml.parse(doc);
	const langData = <S.LanguagesScema>await loadFile('languages.yml', opts.offline).then(yamlParse);
	const vendorData = <S.VendorSchema>await loadFile('vendor.yml', opts.offline).then(yamlParse);
	const docData = <S.VendorSchema>await loadFile('documentation.yml', opts.offline).then(yamlParse);
	const heuristicsData = <S.HeuristicsSchema>await loadFile('heuristics.yml', opts.offline).then(yamlParse);
	const generatedData = await loadFile('generated.rb', opts.offline).then(text => text.match(/(?<=name\.match\(\/).+?(?=(?<!\\)\/)/gm) ?? []);
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

	// Prepare list of ignored files
	const gitignores = ignore();
	const regexIgnores: RegExp[] = [];
	gitignores.add('/.git');
	if (!opts.keepVendored) regexIgnores.push(...vendorPaths.map(path => RegExp(path, 'i')));
	if (opts.ignoredFiles) gitignores.add(opts.ignoredFiles);

	// Set a common root path so that vendor paths do not incorrectly match parent folders
	const resolvedInput = input.map(path => paths.resolve(path).replace(/\\/g, '/'));
	const commonRoot = (input.length > 1 ? commonPrefix(resolvedInput) : resolvedInput[0]).replace(/\/?$/, '');
	const relPath = (file: string) => paths.relative(commonRoot, file).replace(/\\/g, '/');
	const unRelPath = (file: string) => paths.resolve(commonRoot, file).replace(/\\/g, '/');

	// Load file paths and folders
	let files, folders;
	if (useRawContent) {
		// Uses raw file content
		files = input;
		folders = [''];
	}
	else {
		// Uses directory on disc
		const data = walk(true, commonRoot, input, gitignores, regexIgnores);
		files = data.files;
		folders = data.folders;
	}

	// Apply aliases
	opts = {
		checkIgnored: !opts.quick,
		checkAttributes: !opts.quick,
		checkHeuristics: !opts.quick,
		checkShebang: !opts.quick,
		checkModeline: !opts.quick,
		...opts
	};

	// Ignore specific languages
	for (const lang of opts.ignoredLanguages ?? []) {
		for (const key in langData) {
			if (lang.toLowerCase() === key.toLowerCase()) {
				delete langData[key];
				break;
			}
		}
	}

	// Load gitignores and gitattributes
	const customBinary = ignore();
	const customText = ignore();
	if (!useRawContent && opts.checkAttributes) {
		for (const folder of folders) {

			// Skip if folder is marked in gitattributes
			if (relPath(folder) && gitignores.ignores(relPath(folder))) {
				continue;
			}

			// Parse gitignores
			const ignoresFile = paths.join(folder, '.gitignore');
			if (opts.checkIgnored && fs.existsSync(ignoresFile)) {
				const ignoresData = await readFile(ignoresFile);
				gitignores.add(ignoresData);
			}

			// Parse gitattributes
			const attributesFile = paths.join(folder, '.gitattributes');
			if (opts.checkAttributes && fs.existsSync(attributesFile)) {
				const attributesData = await readFile(attributesFile);
				// Explicit text/binary associations
				const contentTypeMatches = attributesData.matchAll(/^(\S+).*?(-?binary|-?text)(?!=auto)/gm);
				for (const [_line, path, type] of contentTypeMatches) {
					if (['text', '-binary'].includes(type)) {
						customText.add(path);
					}
					if (['-text', 'binary'].includes(type)) {
						customBinary.add(path);
					}
				}
				// Custom vendor options
				const vendorMatches = attributesData.matchAll(/^(\S+).*[^-]linguist-(vendored|generated|documentation)(?!=false)/gm);
				for (const [_line, path] of vendorMatches) {
					gitignores.add(path);
				}
				// Custom file associations
				const customLangMatches = attributesData.matchAll(/^(\S+).*[^-]linguist-language=(\S+)/gm);
				for (let [_line, path, forcedLang] of customLangMatches) {
					// If specified language is an alias, associate it with its full name
					if (!langData[forcedLang]) {
						const overrideLang = Object.entries(langData).find(entry => entry[1].aliases?.includes(forcedLang.toLowerCase()));
						if (overrideLang) {
							forcedLang = overrideLang[0];
						}
					}
					const fullPath = paths.join(relPath(folder), path);
					overrides[fullPath] = forcedLang;
				}
			}

		}
	}
	// Check vendored files
	if (!opts.keepVendored) {
		// Filter out any files that match a vendor file path
		if (useRawContent) {
			files = gitignores.filter(files);
			files = files.filter(file => !regexIgnores.find(match => match.test(file)));
		}
		else {
			files = gitignores.filter(files.map(relPath)).map(unRelPath);
		}
	}

	// Load all files and parse languages
	const addResult = (file: string, result: T.LanguageResult) => {
		if (!fileAssociations[file]) {
			fileAssociations[file] = [];
			extensions[file] = '';
		}
		const parent = !opts.childLanguages && result && langData[result].group || false;
		fileAssociations[file].push(parent || result);
		extensions[file] = paths.extname(file).toLowerCase();
	};
	const overridesArray = Object.entries(overrides);
	// List all languages that could be associated with a given file
	const definiteness: Record<T.FilePath, true | undefined> = {};
	const fromShebang: Record<T.FilePath, true | undefined> = {};
	for (const file of files) {
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
		// Check override for manual language classification
		if (!useRawContent && !opts.quick && opts.checkAttributes) {
			const isOverridden = (path: string) => ignore().add(path).ignores(relPath(file));
			const match = overridesArray.find(item => isOverridden(item[0]));
			if (match) {
				const forcedLang = match[1];
				addResult(file, forcedLang);
				definiteness[file] = true;
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
		// Skip binary files
		if (!useRawContent && !opts.keepBinary) {
			const isCustomText = customText.ignores(relPath(file));
			const isCustomBinary = customBinary.ignores(relPath(file));
			const isBinaryExt = binaryData.some(ext => file.endsWith('.' + ext));
			if (!isCustomText && (isCustomBinary || isBinaryExt || await isBinaryFile(file))) {
				continue;
			}
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
				if (fileContent === null) continue;
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
			results.files.results[file] = possibleLangs[0];
			// List alternative languages if there are any
			if (possibleLangs.length > 1)
				results.files.alternatives[file] = possibleLangs;
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
