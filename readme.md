[![Latest version](https://img.shields.io/github/v/release/Nixinova/Linguist?label=latest%20version&style=flat-square)](https://github.com/Nixinova/Linguist/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/Linguist?label=updated&style=flat-square)](https://github.com/Nixinova/Linguist/releases)
[![npm downloads](https://img.shields.io/npm/dt/linguist-js?logo=npm)](https://www.npmjs.com/package/linguist-js)

# LinguistJS

Analyses the languages of all files in a given folder or folders and collates the results.

Powered by [github-linguist](https://github.com/github/linguist), although it doesn't need to be installed.

## Install

[Node.js](https://nodejs.org) must be installed to be able to use LinguistJS.

LinguistJS is available [on npm](https://npmjs.com/package/linguist-js) as `linguist-js`.

Install locally using `npm install linguist-js` and import it into your code like so:

```js
const linguist = require('linguist-js');
```

Or install globally using `npm install -g linguist-js` and run using the CLI command `linguist` or `linguist-js`.

```
linguist --help
linguist-js --help
```

## Usage

LinguistJS analyses a folder, or a dictionary of already-read file content, and determines what programming languages are used within.

As an example, take the following file structure:

```
/
| src
| | cli.js 1kB
| | index.ts 2kB
| readme.md 3kB
| no-lang 10B
| x.pluginspec 10B
```
*(or, an object with keys `"/src", "/src/cli.js", ...` and preloaded file content)*

Running LinguistJS on this will return the following JSON:

```json
{
  "files": {
    "count": 5,
    "bytes": 6020,
    "lines": {
      "total": 100,
      "content": 90,
    },
    "results": {
      "/src/index.ts": "TypeScript",
      "/src/cli.js": "JavaScript",
      "/readme.md": "Markdown",
      "/no-lang": null,
      "/x.pluginspec": "Ruby",
    },
  },
  "languages": {
    "count": 3,
    "bytes": 6010,
    "lines": {
      "total": 90,
      "content": 80,
    },
    "results": {
      "JavaScript": { "bytes": 1000, "lines": { "total": 49, "content": 49 }, },
      "Markdown": { "bytes": 3000, "lines": { "total": 10, "content": 5 }, },
      "Ruby": { "bytes": 10, "lines": { "total": 1, "content": 1 }, },
      "TypeScript": { "bytes": 2000, "lines": { "total": 30, "content": 25 }, },
    },
  },
  "unknown": {
    "count": 1,
    "bytes": 10,
    "lines": {
      "total": 10,
      "content": 10,
    },
    "filenames": {
      "no-lang": 10,
    },
    "extensions": {},
  },
  "repository": {
    "JavaScript": { "type": "programming", "color": "#f1e05a" },
    "Markdown": { "type": "prose", "color": "#083fa1" },
    "Ruby": { "type": "programming", "color": "#701516" },
    "TypeScript": { "type": "programming", "color": "#2b7489" },
  }
}
```

### Notes

- File paths in the output use only forward slashes as delimiters, even on Windows.
- Unless running in offline mode: do not rely on any language classification output from LinguistJS being unchanged between runs.
  Language data is fetched each run from the latest classifications of [`github-linguist`](https://github.com/github/linguist).
  This data is subject to change at any time and may change the results of a run even when using the same version of Linguist.

## API

### Node

```js
import linguist from 'linguist-js';

// Analyse folder on disc
const folders = ['./src'];
const options = { keepVendored: false, quick: false };
const { files, languages, unknown, repository } = await linguist.analyseFolders(folder, options);

// Analyse file content from raw input
const fileContent = {
	['file1.ts']: '#!/usr/bin/env node',
	['file2.ts']: 'console.log("Example");',
	['ignoreme.js']: 'ignored!',
}
const options = { ignoredFiles: ['ignoreme.*'] };
const { files, languages, unknown, repository } = await linguist.analyseRawContent(fileContent, options);
```

**Exports:**

- `analyseFolders(folders?, opts?)`:
  Analyse the language of all files found in a folder or folders.
  - `folders` (optional; string array):
    A list of folders to analyse (defaults to `['./']`).
  - `opts` (optional; object):
    An object containing analyser options.
- `analyseRawContent(folders?, opts?)`:
  Analyse the language of all files found in a folder or folders.
  - `entry` (optional; string or string array):
    A list of folders to analyse (defaults to `['./']`).
  - `opts` (optional; object):
    An object containing analyser options.

**Analyser options:**
- `ignoredFiles` (string array):
  A list of file path globs to explicitly ignore.
- `ignoredLanguages` (string array):
  A list of languages to ignore.
- `categories` (string array):
  A list of programming language categories that should be included in the results.
  Defaults to `['data', 'markup', 'programming', 'prose']`.
- `childLanguages` (boolean):
  Whether to display sub-languages instead of their parents when possible (defaults to `false`).
- `quick` (boolean):
  Whether to skip complex language analysis such as the checking of heuristics and gitattributes statements (defaults to `false`).
  Alias for `checkAttributes:false, checkIgnored:false, checkDetected:false, checkHeuristics:false, checkShebang:false, checkModeline:false`.
- `offline` (boolean):
  Whether to use pre-packaged metadata files instead of fetching them from GitHub at runtime (defaults to `false`).
- `calculateLines` (boolean):
  Whether to calculate line of code totals (defaults to `true`).
- `keepVendored` (boolean):
  Whether to keep vendored files (dependencies, etc) (defaults to `false`).
  Does nothing when `fileContent` is set.
- `keepBinary` (boolean):
  Whether binary files should be included in the output (defaults to `false`).
- `relativePaths` (boolean):
  Change the absolute file paths in the output to be relative to the current working directory (defaults to `false`).
- `checkAttributes` (boolean):
  Force the checking of `.gitattributes` files (defaults to `true` unless `quick` is set).
  Does nothing when `fileContent` is set.
- `checkIgnored` (boolean):
  Force the checking of `.gitignore` files (defaults to `true` unless `quick` is set).
  Does nothing when `fileContent` is set.
- `checkDetected` (boolean):
  Force files marked with `linguist-detectable` to show up in the output, even if the file is not part of the declared `categories`.
- `checkHeuristics` (boolean):
  Apply heuristics to ambiguous languages (defaults to `true` unless `quick` is set).
- `checkShebang` (boolean):
  Check shebang (`#!`) lines for explicit language classification (defaults to `true` unless `quick` is set).
- `checkModeline` (boolean):
  Check modelines for explicit language classification (defaults to `true` unless `quick` is set).

### Command-line

```
linguist --analyse [<folders...>] [<options...>]
linguist --help
linguist --version
```

- `--analyse`:
  Analyse the language of all files found in a folder or folders.
  - `[<folders...>]`:
    The folders to analyse (defaults to `./`).
  - `--ignoredFiles <globs...>`:
    A list of file path globs to ignore.
  - `--ignoredLanguages <languages...>`:
    A list of languages to exclude from the output.
  - `--categories <categories...>`:
    A list of language categories that should be displayed in the output.
    Must be one or more of `data`, `prose`, `programming`, `markup`.
  - `--childLanguages`:
    Display sub-languages instead of their parents, when possible.
  - `--json`:
    Only affects the CLI output.
    Display the outputted language data as JSON.
  - `--tree <traversal>`:
    Only affects the CLI output.
    A dot-delimited traversal to the nested object that should be logged to the console instead of the entire output.
    Requires `--json` to be specified.
  - `--listFiles`:
    Only affects the visual CLI output.
    List each matching file and its size under each outputted language result.
    Does nothing if `--json` is specified.
  - `--quick`:
    Skip the checking of `.gitattributes` and `.gitignore` files for manual language classifications.
    Alias for `--checkAttributes=false --checkIgnored=false --checkHeuristics=false --checkShebang=false --checkModeline=false`.
  - `--offline`:
    Use pre-packaged metadata files instead of fetching them from GitHub at runtime.
  - `--calculateLines`:
    Calculate line of code totals from files.
  - `--keepVendored`:
    Include vendored files (auto-generated files, dependencies folder, etc) in the output.
  - `--keepBinary`:
    Include binary files in the output.
  - `--relativePaths`:
    Change the absolute file paths in the output to be relative to the current working directory.
  - `--checkAttributes`:
    Force the checking of `.gitatributes` files.
    Use alongside `--quick` to override it disabling this option.
  - `--checkIgnored`:
    Force the checking of `.gitignore` files.
    Use alongside `--quick` to override it disabling this option.
  - `--checkDetected`:
    Force files marked with `linguist-detectable` to show up in the output, even if the file is not part of the declared `--categories`.
    Use alongside `--quick` to override it disabling this option.
  - `--checkHeuristics`:
    Apply heuristics to ambiguous languages.
    Use alongside `--quick` to override it disabling this option.
  - `--checkShebang`:
    Check shebang (`#!`) lines for explicit classification.
    Use alongside `--quick` to override it disabling this option.
  - `--checkModeline`:
    Check modelines for explicit classification.
    Use alongside `--quick` to override it disabling this option.
- `--help`:
  Display the help message.
- `--version`:
  Display the current installed version of LinguistJS.
