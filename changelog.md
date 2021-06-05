# Changelog

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
