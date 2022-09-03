# Changelog

# 2.5.3
*2022-09-03*
- Fixed a crash occurring when parsing heuristics for `.txt` files ([#16](https://github.com/Nixinova/LinguistJS/issues/16)).

## 2.5.2
*2022-06-28*
- Fixed file extensions with multiple delimiters not being prioritised over basic extensions.
- Fixed modeline checking not trimming comments from the first line.
- Fixed modeline checking being applied to the first line even when it does not contain a modeline.
- Fixed fallback language detection not being applied when an ambiguous interpreter is declared in a shebang line.

## 2.5.1
*2022-06-26*
- Fixed heuristics not being applied to files.
- Fixed heuristics with multiple rules not being parsed.

## 2.5.0
*2022-05-14*
- Added boolean option `offline` to allow the use of pre-packaged metadata files instead of having them fetched from GitHub at runtime.
- Added `linguist-js` as an alias of the `linguist` executable.

## 2.4.2
*2022-03-20*
- Fixed a crash occurring because of outdated file caches.
- Fixed heuristics not being applied when using raw file input.

## 2.4.1
*2022-02-24*
- Fixed parsing of gitignore statements not matching its specification.
- Fixed generated file names being applied case-sensitively.
- Fixed generated files not being excluded from the input when using raw file mode.
- Fixed modeline language selection not working for languages containing non-alphanumeric characters.

## 2.4.0
*2022-02-19*
- Added boolean option `checkModeline` (defaults to `true`) to check the modeline of files for explicit classification.
- Fixed shebang statements not taking priority over other methods of disambiguation.

## 2.3.2
*2022-02-18*
- Changed vendored checking to include paths marked as documentation.
- Fixed array input not being parsed properly when used with `fileContent`.
- Fixed vendor patterns being erroneously applied to parent folders.
- Fixed vendor patterns made for relative paths not being applied.

## 2.3.1
*2022-02-16*
- Fixed a crash occurring when parsing heuristics containing atomic groups.
- Fixed option `fileContent` being ignored if set to an empty string.
- Fixed file extensions being treated as case sensitive.

## 2.3.0
*2022-02-13*
- Added option `fileContent` to provide manual file content to analyse instead of reading from a folder on disk.

## 2.2.1
*2022-02-11*
- Fixed files marked as `text=auto` being classified as text.
- Fixed a crash occurring when attempting to load unreadable files.

## 2.2.0
*2022-01-06*
- Added option `relativePaths` to allow output results to be shown as relative paths (defaults to `false`).
- Changed CLI output to display the number of skipped files.
- Fixed git config entries containing backslashes causing a crash.

## 2.1.4
*2021-09-29*
- Fixed gitignore entries containing dots not being parsed properly.
- Fixed git config files containing character classes like `[[:digit:]]` not being parsed properly.

## 2.1.3
*2021-09-19*
- Changed gitattributes parsing to support `text` and `binary` parameters.
- Fixed a crash occurring when compiling regular expressions.

## 2.1.2
*2021-09-14*
- Fixed languages without a colour not having their icon displayed properly in the CLI output.
- Fixed unknown extensions erroneously having an extra dot prefix in the CLI output.

## 2.1.1
*2021-09-12*
- Changed CLI output to display associated language colours.
- Fixed filenames not taking precedence over extensions when classifying.
- Fixed parent languages not being checked when parsing heuristics relating to their children.

## 2.1.0
*2021-09-11*
- Added nullable `parent` property to each entry in `languages.results` to display the parent language.
- Added option `childLanguages` to control whether child languages are displayed instead of their parent (defaults to `false`).

## 2.0.3
*2021-09-11*
- Changed the error thrown when traversing an invalid tree via CLI to contain a more useful description.
- Fixed heuristics not applying start- and end-of-line markers properly ([#5](https://github.com/Nixinova/Linguist/issues/5)).
- Fixed heuristic language fallback not being applied properly.

## 2.0.2
*2021-09-09*
- Fixed CLI usage not working when installed with Yarn ([#2](https://github.com/Nixinova/Linguist/issues/2)).
- Fixed a crash that occurred when file contents changed between runs ([#4](https://github.com/Nixinova/Linguist/issues/4)).
- Fixed heuristics containing dot wildcards being incorrectly applied ([#5](https://github.com/Nixinova/Linguist/issues/5)).
- Fixed vendored/generated files containing dots not being classified as vendored.

## 2.0.1
*2021-09-08*
- Changed file paths in CLI output JSON to be absolute instead of relative ([#3](https://github.com/Nixinova/Linguist/issues/3)).
- Fixed percentages in CLI output displaying `NaN` when the total byte count is `0`.

## 2.0.0
*2021-09-05*
- **Breaking:** Changed output schema:
  - `count` &rarr; `files.count`
  - `results` &rarr; `files.results`
  - `languages.all` &rarr; `languages.results`
  - `languages.data` &rarr; (*deleted*)
  - `languages.markup` &rarr; (*deleted*)
  - `languages.programming` &rarr; (*deleted*)
  - `languages.prose` &rarr; (*deleted*)
  - `languages.unknown` &rarr; `unknown.{filenames|extensions}`
  - `languages.total.unique` &rarr; `languages.count`
  - `languages.total.bytes` &rarr; `languages.bytes`
  - `languages.total.unknownBytes` &rarr; `unknown.bytes`
- **Breaking:** Changed the default CLI output format from JSON to summary.
- **Breaking:** Changed CLI array arguments to require delimiters to be spaces instead of other characters.
- **Breaking:** Changed the name of option `ignoreFiles` to `ignoredFiles`.
- **Breaking:** Changed the name of option `ignoreLanguages` to `ignoredLanguages`.
- Added CLI option `--json` to display the results as JSON (the previous default behavior).
- Removed CLI option `--summary` as it is now the default output format.
- Removed CLI option `--files` to list all files parsed.
- Removed deprecated option `ignore` which was superceded by `ignoredFiles`.

## 1.9.1
*2021-08-29*
- Fixed a crash occurring when using both the `categories` and `ignoreLanguages` options together.

## 1.9.0
*2021-08-29*
- Added `ignoreLanguages` option to configure which languages to ignore.
- Added alias `ignoreFiles` for option `ignore`.
- Added CLI argument `--tree` to traverse the output tree to a specific object instead of logging the entire results.
- Deprecated option `ignore` as it is now ambiguous.

## 1.8.2
*2021-08-28*
- Fixed known vendored files not being removed from output.

## 1.8.1
*2021-08-28*
- Fixed input folder paths being case sensitive.
- Fixed dotfiles not showing up in the output.

## 1.8.0
*2021-08-24*
- Added support for the first argument to `analyse()` to be an array of paths.

## 1.7.1
*2021-08-21*
- Changed file paths specified in option `ignore` to remain hidden even when `keepVendored` is enabled.
- Fixed file results not being listed when using globbed input.
- Fixed command-line arguments not being fully normalised.

## 1.7.0
*2021-08-19*
- Added `categories` option to control which language categories (`data`, `markup`, `programming`, and/or `prose`) should be included in the output.
- Fixed some files being incorrectly classified as binary.

## 1.6.1
*2021-08-17*
- Changed binary file checking to check file content as well as extension.
- Fixed filename matching not comparing the full base name to the list of filename matches.

## 1.6.0
*2021-08-15*
- Added checking of binary files to avoid including them in the language results.
- Added `keepBinary` option to control whether binary files are checked (defaults to `false`).

## 1.5.5
*2021-08-15*
- Fixed a crash occurring when using the CLI.

## 1.5.4
*2021-08-15*
- Fixed CLI options not being able to be negated.
- Fixed CLI option `--ignore` not allowing delimited paths.

## 1.5.3
*2021-08-14*
- Fixed shebang interpreter checking more than just the first line.

## 1.5.2
*2021-08-14*
- Changed web requests to be cached upon fetch, improving performance of successive runs.

## 1.5.1
*2021-08-14*
- Fixed PCRE regular expressions causing a crash.
- Fixed shebang lines not being fully checked.
- Fixed heuristics with two fallback languages not choosing just one of them.
- Fixed extensions being checked alongside filenames instead of being checked after, as the latter should take priority.

## 1.5.0
*2021-08-12*
- Added checking of shebang (`#!`) lines for explicit language classification.
- Added `checkShebang` option to implement shebang checking (defaults to `true` unless `quick` is set).

## 1.4.5
*2021-08-10*
- Fixed files prefixed with a dot not being checked.
- Changed input of command-line `--ignore` to be delimited by spaces.

## 1.4.4
*2021-08-03*
- Added an nullable `color` key to each entry in `languages.all`.

## 1.4.3
*2021-08-01*
- Changed outputted file paths to always be absolute regardless of input.

## 1.4.2
*2021-08-01*
- Fixed crash occurring when checking named patterns.

## 1.4.1
*2021-08-01*
- Added `all` key to `languages` which collates all language data into one object.

## 1.4.0
*2021-08-01*
- Added heuristics checking, using option `checkHeuristics` (defaults to `true` unless `quick` is set).
- Added `--summary` CLI option to output language data in human-readable manner instead of JSON.
- Added `unknownBytes` key to `languages.total` which lists the bytes size of unknown languages.
- Changed vendored file checking to classify generated files as well.

## 1.3.2
*2021-07-31*
- Added `unknown` key to `languages` which lists file extensions that cannot be matched with a given language.
- Change ignored files list to be globs instead of raw regexes.
- Fixed CLI usage defaulting to quick checking instead of full checking.

## 1.3.1
*2021-07-31*
- Changed the delimiter for ignored paths in the CLI `--ignored` argument from `;` to `:`/`;`/`|` as a semicolon is actually valid on Windows.

## 1.3.0
*2021-07-31*
- Added checking of `.gitignore` files.
- Added option `ignore` for specifying explicitly-ignored file paths.
- Added specific options `checkIgnored` and `checkAttributes`, which can be set together using the inverse of `quick`.
- Fixed unique language count being incorrect.

## 1.2.5
*2021-07-25*
- Fixed file name matching not working.
- Fixed file extensions being case sensitive.

## 1.2.4
*2021-07-22*
- Added type definitions due to TypeScript rewrite.

## 1.2.3
*2021-07-21*
- Added CLI argument `--quick`/`-q` for skipping the checking of gitattributes files.
- Changed the checking of gitattributes files to be default behaviour.
- Removed CLI argument `--gitattributes`/`-g` as it is now the default behaviour.

## 1.2.2
*2021-07-21*
- Added CLI argument alias `-V` for `--vendored`.
- Changed files with no language to output a language of `null` instead of being removed from the list.
- Fixed gitattributes statements not being checked.

## 1.2.1
*2021-06-24*
- Added alias `--files` for `--full`.
- Added CLI command `--version`.
- Fixed the analyser crashing when it comes across a heuristic that cannot be matched to a language.

## 1.2.0
*2021-06-06*
- Added gitattributes checking using option `checkAttributes` (Node) or `--gitattributes` (CLI).
- Added unique language count and total bytes size to output as `languages.total`.

## 1.1.2
*2021-06-05*
- Changed file classification to use the default heuristic value if applicable.

## 1.1.1
*2021-06-05*
- Changed file analysis to filter out vendored files first before analysing languages, increasing performance.

## 1.1.0
*2021-06-05*
- Added options argument to analyser function.
- Added `keepVendored` option to control whether vendored files are kept or not.
- Added CLI option `--full` to log a full list of parsed files.
- Added CLI option `--vendored` to include vendored files in output.
- Fixed input folder not being parsed.

## 1.0.1
*2021-06-05*
- Fixed command-line usage not working.

## 1.0.0
*2021-06-05*
- Added function to analyse the languages used in a repository.
- Added CLI command `linguist`.
