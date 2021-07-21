# Changelog

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
