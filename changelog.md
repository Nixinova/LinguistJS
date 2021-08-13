# Changelog

## Next
- Fixed PCRE regular expressions causing a crash.
- Fixed shebang lines not being fully checked.
- Fixed heuristics with two fallback languages not choosing just one of them.
- Fixed extensions being checked alongside filenames instead of being checked after, as the latter should take priority.

## 1.5.0
*2021-08-12*
- Added checking of shebang (`#!`) lines for explicit language classification.
- Added `checkShebang` API option to implement shebang checking (defaults to `true` unless `quick` is set).
- Added `--checkShebang` CLI option (ditto).

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
- Improved performance.

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
