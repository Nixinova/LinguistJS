[![Latest version](https://img.shields.io/github/v/release/Nixinova/Linguist?label=latest%20version&style=flat-square)](https://github.com/Nixinova/Linguist/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/Linguist?label=updated&style=flat-square)](https://github.com/Nixinova/Linguist/releases)
[![npm downloads](https://img.shields.io/npm/dt/linguist-js?logo=npm)](https://www.npmjs.com/package/linguist-js)

# Linguist

Analyses all files located in a given folder and collates the results.

Powered by [github-linguist](https://github.com/github/linguist), although it doesn't need to be installed.

## Install

Linguist is available [on npm](https://npmjs.com/package/linguist-js) as `linguist-js`.

Install locally using `npm install linguist-js` and import it into your code like so:

```js
const linguist = require('linguist-js');
```

Or install globally using `npm install -g linguist-js` and run using the CLI command `linguist`.

```
linguist --help
```

## Usage

Linguist contains one function which analyses a given folder.

As an example, take the following file structure:

```
.
| src
| | cli.js 1kB
| | index.ts 2kB
| readme.md 3kB
| no-lang 10B
```

Running Linguist on this folder will return the following JSON:

```json
{
  "files": {
    "count": 4,
    "bytes": 6010,
    "results": {
      "src/index.ts": "TypeScript",
      "src/cli.js": "JavaScript",
      "readme.md": "Markdown",
      "no-lang": null,
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

## API

### Node

```js
const linguist = require('linguist-js');
let folder = './src';
let options = { keepVendored: false, quick: false };
let { count, results, languages } = linguist(folder, options);
```

- `linguist(entry?, opts?)` (default export):
  Analyse the language of all files found in a folder.
  - `entry` (optional; string or string array):
    The folder(s) to analyse (defaults to `./`).
    Analyse multiple folders using the syntax `"{folder1,folder2,...}"`.
  - `opts` (optional; object):
    An object containing analyser options.
    - `ignoreFiles` (string array):
      A list of file path globs to explicitly ignore.
    - `ignoreLanguages` (string array):
      A list of languages to ignore.
    - `categories` (string array):
      A list of programming language categories that should be included in the results.
      Defaults to `['data', 'markup', 'programming', 'prose']`.
    - `quick` (boolean):
      Whether to skip the checking of `.gitattributes` and `.gitignore` files for manual language classifications (defaults to `false`).
      Alias for `checkAttributes:false, checkIgnored:false, checkHeuristics:false, checkShebang:false`.
    - `keepVendored` (boolean):
      Whether to keep vendored files (dependencies, etc) (defaults to `false`).
    - `keepBinary` (boolean):
      Whether binary files should be included in the output (defaults to `false`).
    - `checkAttributes` (boolean):
      Force the checking of `.gitattributes` files (defaults to `true` unless `quick` is set).
    - `checkIgnored` (boolean):
      Force the checking of `.gitignore` files (defaults to `true` unless `quick` is set).
    - `checkHeuristics` (boolean):
      Apply heuristics to ambiguous languages (defaults to `true` unless `quick` is set).
    - `checkShebang` (boolean):
      Check shebang (`#!`) lines for explicit language classification (defaults to `true` unless `quick` is set).

### Command-line

CLI usage requires `commander`, which is marked as an optional dependency.
If an error saying `Cannot find module 'commander'` is thrown, run `npm install commander --no-save`.

```
linguist --analyze [<folder>] [<...options>]
linguist --help
```

- `--analyze`:
  Analyse the language of all files found in a folder.
  - `<folders...>` (optional):
    The folders to analyse (defaults to `./`).
  - `--ignoreFiles <paths...>` (optional):
    A list of space-delimited file path globs to ignore.
  - `--ignoreLanguages` (optional):
    A list of languages to ignore.
  - `--files` (optional):
    Whether to print a full list of all files analysed.
    Does nothing when `--summary` is specified.
  - `--categories <categories...>` (optional):
    A list of space-delimited categories that should be displayed in the output.
  - `--summary` (optional):
    Output language data in a human-readable manner instead of JSON.
  - `--tree <traversal>` (optional):
    A dot-delimited traversal to the nested object that should be logged to the console instead of the entire output.
    Does nothing when `--summary` is specified.
  - `--quick` (optional):
    Whether to skip the checking of `.gitattributes` and `.gitignore` files for manual language classifications.
    Alias for `--checkAttributes=false --checkIgnored=false --checkHeuristics=false --checkShebang=false`.
  - `--keepVendored` (optional):
    Whether to include vendored files (auto-generated files, dependencies folder, etc).
  - `--keepBinary` (optional):
    Whether binary files should be excluded from the output.
  - `--checkAttributes` (optional):
    Force the checking of `.gitatributes` files (use alongside `--quick` to overwrite).
  - `--checkIgnored` (optional):
    Force the checking of `.gitignore` files (use alongside `--quick` to overwrite).
  - `--checkHeuristics` (optional):
    Apply heuristics to ambiguous languages (use alongside `--quick` to overwrite).
  - `--checkShebang` (optional):
    Check shebang (`#!`) lines for explicit classification (use alongside `--quick` to overwrite).
- `--help`:
  Display a help message.
- `--version`:
  Display the current version of linguist-js.
