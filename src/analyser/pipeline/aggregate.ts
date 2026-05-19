import Path from 'node:path';
import * as T from '../../types/types.js';

const categoryKeys: T.Category[] = ['data', 'markup', 'programming', 'prose'];

function pickBestLanguage(classifications: string[]): string | null {
	return classifications[0] ?? null;
}

function makeRelPath(path: string): string {
	let relPath = normPath(Path.relative(process.cwd(), path));
	if (!relPath.startsWith('../') && !relPath.startsWith('./')) {
		relPath = `./${relPath}`;
	}
	return relPath;
}

function normPath(filePath: string): string {
	return filePath.replace(/\\\\/g, '/');
}

export function aggregateResults(
	files: T.VirtualFile[],
	classifications: Record<string, string[]>,
	heuristicResolutions: Record<string, string | undefined>,
	langData: Record<string, unknown>,
	opts: T.Options
): T.Results {
	const results: T.Results = {
		files: { count: 0, bytes: 0, lines: { total: 0, content: 0 }, results: {}, alternatives: {} },
		languages: { count: 0, bytes: 0, lines: { total: 0, content: 0 }, results: {} },
		unknown: { count: 0, bytes: 0, lines: { total: 0, content: 0 }, extensions: {}, filenames: {} },
		repository: {},
	};

	// Skip specified categories
	const allowedCategories = opts.categories ?? categoryKeys;
	const hiddenCategories = categoryKeys.filter((category) => !allowedCategories.includes(category));

	for (const file of files) {
		// Narrow down file associations to the best fit
		const candidates = classifications[file.path] ?? [];
		// If no heuristics, assign a language
		const selectedLanguage = heuristicResolutions[file.path] ?? pickBestLanguage(candidates);
		const alternativeLanguages = [...new Set(candidates.filter((lang) => lang !== selectedLanguage))];
		// Assign first language as a default option
		// List alternative languages if there are any
		// Load language bytes size
		const size = file.size ?? file.content?.length ?? 0;
		// Calculate lines of code
		const lineContent = file.content ?? '';
		const allLines = opts.calculateLines === false ? [] : lineContent.split(/\r?\n/gm);
		const loc = {
			total: opts.calculateLines === false ? NaN : allLines.length,
			content: opts.calculateLines === false ? NaN : allLines.filter((line) => line.trim().length > 0).length,
		};
		const outputPath = opts.relativePaths && Path.isAbsolute(file.path) ? makeRelPath(file.path) : file.path;

		if (!selectedLanguage) {
			const extension = file.extension || Path.extname(file.path);
			const unknownType = extension ? 'extensions' : 'filenames';
			const name = extension || Path.basename(file.path);
			results.files.results[outputPath] = null;
			results.files.bytes += size;
			results.files.lines.total += Number.isNaN(loc.total) ? 0 : loc.total;
			results.files.lines.content += Number.isNaN(loc.content) ? 0 : loc.content;
			results.unknown[unknownType][name] ??= 0;
			results.unknown[unknownType][name] += size;
			results.unknown.bytes += size;
			results.unknown.lines.total += loc.total || 0;
			results.unknown.lines.content += loc.content || 0;
			continue;
		}

		const languageMeta = langData[selectedLanguage] as Record<string, unknown> | undefined;
		const category = languageMeta?.type as T.Category | undefined;
		const allowed = !hiddenCategories.includes(category ?? 'programming') || file.attributes?.detectable === true;
		if (!allowed) {
			continue;
		}

		if (!results.repository[selectedLanguage]) {
			results.repository[selectedLanguage] = {
				type: (languageMeta?.type as T.Category) ?? 'programming',
				color: languageMeta?.color as `#${string}` | undefined,
			};
			if (opts.childLanguages) {
				results.repository[selectedLanguage].parent = languageMeta?.group as string | undefined;
			}
		}

		results.files.results[outputPath] = selectedLanguage;
		if (alternativeLanguages.length) {
			results.files.alternatives[outputPath] = alternativeLanguages;
		}
		// Apply to files totals
		results.files.bytes += size;
		results.files.lines.total += Number.isNaN(loc.total) ? 0 : loc.total;
		results.files.lines.content += Number.isNaN(loc.content) ? 0 : loc.content;
		results.languages.results[selectedLanguage] ??= { count: 0, bytes: 0, lines: { total: 0, content: 0 } };
		results.languages.results[selectedLanguage].count += 1;
		results.languages.results[selectedLanguage].bytes += size;
		results.languages.results[selectedLanguage].lines.total += Number.isNaN(loc.total) ? 0 : loc.total;
		results.languages.results[selectedLanguage].lines.content += Number.isNaN(loc.content) ? 0 : loc.content;
		results.languages.bytes += size;
		results.languages.lines.total += Number.isNaN(loc.total) ? 0 : loc.total;
		results.languages.lines.content += Number.isNaN(loc.content) ? 0 : loc.content;
	}

	if (opts.calculateLines === false) {
		results.files.lines = { total: NaN, content: NaN };
	}

	results.files.count = Object.keys(results.files.results).length;
	results.languages.count = Object.keys(results.languages.results).length;
	results.unknown.count = Object.keys({ ...results.unknown.extensions, ...results.unknown.filenames }).length;

	return results;
}
