# Linguist

Analyses all files located in a given folder and collates the results.
Powered by [github-linguist](https://github.com/github/linguist), although it doesn't need to be installed.

## Install

Linguist is available [on npm](https://npmjs.com/package/linguist-js) as `linguist-js`.

Install locally using `npm install linguist-js` and import it into your code like so:

```js
const linguist = require('linguist-js'); // old import syntax
/*or*/
import linguist from 'linguist-js'; // modern import syntax
```

Or install globally using `npm install -g linguist-js` and run using the CLI command `linguist`.

```cmd
linguist --help
```

## Usage

Linguist contains one function which analyses a given folder.

As an example, take the following file structure:

```tree
.
| src
| | index.ts 2kB
| | cli.js 1kB
| readme.md 5kB
```

Running Linguist on this folder will return the following JSON:

```json
{
	"count": 3,
	"results": {
		"src/index.ts": "TypeScript",
		"src/cli.js": "JavaScript",
		"readme.md": "Markdown"
	},
	"languages": {
		"programming": {
			"JavaScript": 1000,
			"TypeScript": 2000,
		},
		"markup": {},
		"data": {},
		"prose": {
			"Markdown": 5000
		}
	}
}
```

## API

### Node

```js
const linguist = require('linguist-js');
let folder = './src';
let options = { keepVendored: false };
let { count, results, languages } = linguist(folder, options);
```

- `linguist(folder?, opts?)` (default export): Analyse the language of all files found in a folder.
  - `folder` (optional; string): The folder to analyse (defaults to `./`).
  - `opts` (optional; object): An object containing analyser options.
    - `keepVendored` (boolean): Whether to keep vendored files (dependencies, etc) (defaults to `false`).

### Command-line

```cmd
linguist --analyze [<folder>] [--full] [--vendored]
linguist --help
```

- `--analyze`: Analyse the language of all files found in a folder.
  - `<folder>` (optional): The folder to analyse (defaults to `./`).
  - `--full` (optional): Whether to print a full list of all files analysed.
  - `--vendored` (optional): Whether to include vendored files (dependencies, etc).
- `--help`: Display a help message.
