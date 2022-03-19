[![Latest version](https://img.shields.io/github/v/release/Nixinova/Linguist?label=latest%20version&style=flat-square)](https://github.com/Nixinova/Linguist/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/Linguist?label=updated&style=flat-square)](https://github.com/Nixinova/Linguist/releases)
[![npm downloads](https://img.shields.io/npm/dt/linguist-js?logo=npm)](https://www.npmjs.com/package/linguist-js)

# LinguistJS

Analyses the languages of all files in a given folder and collates the results.

Powered by [github-linguist](https://github.com/github/linguist), although it doesn't need to be installed.

## Install

[Node.js](https://nodejs.org) must be installed to be able to use this.
LinguistJS is available [on npm](https://npmjs.com/package/linguist-js) as `linguist-js`.

Install locally using `npm install linguist-js` and import it into your code like so:

```js
const linguist = require('linguist-js');
```

Or install globally using `npm install -g linguist-js` and run using the CLI command `linguist`.

```
linguist --help
```

## Usage

LinguistJS contains one function which analyses a given folder.

As an example, take the following file structure:

```
/
| src
| | cli.js 1kB
| | index.ts 2kB
| readme.md 3kB
| no-lang 10B
```

Running LinguistJS on this folder will return the following JSON:

```json
{
  "files": {
    "count": 4,
    "bytes": 6010,
    "results": {
      "/src/index.ts": "TypeScript",
      "/src/cli.js": "JavaScript",
      "/readme.md": "Markdown",
      "/no-lang": null,
    }
  },
  "languages": {
    "count": 3,
    "bytes": 6000,
    "results": {
      "JavaScript": { "type": "programming", "bytes": 1000, "color": "#f1e05a" },
      "TypeScript": { "type": "programming", "bytes": 2000, "color": "#2b7489" },
      "Markdown": { "type": "prose", "bytes": 3000, "color": "#083fa1" },
    },
  },
  "unknown": {
    "count": 1,
    "bytes": 10,
    "filenames": {
      "no-lang": 10,
    },
    "extensions": {},
  },
}
```

### Notes

- File paths in the output use only forward slashes as delimiters, even on Windows.
- This tool does not work when offline.
- Do not rely on any language classification output from LinguistJS being unchanged between runs.
  Language data is fetched each run from the latest classifications of [`github-linguist`](https://github.com/github/linguist).
  This data is subject to change at any time and may change the results of a run even when using the same version of Linguist.

## API

### Node

```js
const linguist = require('linguist-js');
let folder = './src';
let options = { keepVendored: false, quick: false };
const { files, languages, unknown } = linguist(folder, options);
```

- `linguist(entry?, opts?)` (default export):
  Analyse the language of all files found in a folder.
  - `entry` (optional; string or string array):
    The folder(s) to analyse (defaults to `./`).
  - `opts` (optional; object):
    An object containing analyser options.
    - `fileContent` (string or string array):
      Provides the file content associated with the file name(s) given as `entry` to analyse instead of reading from a folder on disk.
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
      Alias for `checkAttributes:false, checkIgnored:false, checkHeuristics:false, checkShebang:false, checkModeline:false`.
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
    - `checkHeuristics` (boolean):
      Apply heuristics to ambiguous languages (defaults to `true` unless `quick` is set).
    - `checkShebang` (boolean):
      Check shebang (`#!`) lines for explicit language classification (defaults to `true` unless `quick` is set).
    - `checkModeline` (boolean):
      Check modelines for explicit language classification (defaults to `true` unless `quick` is set).

### Command-line

```
linguist --analyze [<folder>] [<...options>]
linguist --help
```

- `--analyze`:
  Analyse the language of all files found in a folder.
  - `<folders...>`:
    The folders to analyse (defaults to `./`).
  - `--ignoredFiles <paths...>`:
    A list of space-delimited file path globs to ignore.
  - `--ignoredLanguages`:
    A list of languages to ignore.
  - `--categories <categories...>`:
    A list of space-delimited categories that should be displayed in the output.
  - `--childLanguages`:
    Whether to display sub-languages instead of their parents, when possible.
  - `--json`:
    Display the outputted language data as JSON.
  - `--tree <traversal>`:
    A dot-delimited traversal to the nested object that should be logged to the console instead of the entire output.
    Requires `--json` to be specified.
  - `--quick`:
    Whether to skip the checking of `.gitattributes` and `.gitignore` files for manual language classifications.
    Alias for `--checkAttributes=false --checkIgnored=false --checkHeuristics=false --checkShebang=false --checkModeline=false`.
  - `--keepVendored`:
    Whether to include vendored files (auto-generated files, dependencies folder, etc).
  - `--keepBinary`:
    Whether binary files should be excluded from the output.
  - `--relativePaths`:
    Change the absolute file paths in the output to be relative to the current working directory.
  - `--checkAttributes`:
    Force the checking of `.gitatributes` files (use alongside `--quick` to overwrite).
  - `--checkIgnored`:
    Force the checking of `.gitignore` files (use alongside `--quick` to overwrite).
  - `--checkHeuristics`:
    Apply heuristics to ambiguous languages (use alongside `--quick` to overwrite).
  - `--checkShebang`:
    Check shebang (`#!`) lines for explicit classification (use alongside `--quick` to overwrite).
  - `--checkModeline`:
    Check modelines for explicit classification (use alongside `--quick` to overwrite).
- `--help`:
  Display a help message.
- `--version`:
  Display the current version of linguist-js.
