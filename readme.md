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
			"Markdown": 5000
		}
	}
}
```

## API

Node:

```js
const linguist = require('linguist-js');
let folder = './src';
let { count, results, languages } = linguist(folder);
```

Command-line:

```cmd
linguist --analyze [<folder>]
```
