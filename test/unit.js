const linguist = require('..');

let i = 0;
let errors = 0;

function desc(text) {
	console.info(`Testing: ${text}`);
}

async function test([filename, fileContent = ''], [type, testVal]) {
	const actual = await linguist(filename, { fileContent, childLanguages: true });
	const testContent = {
		'files': actual.files.results[filename],
		'size': actual.files.bytes,
		'count': actual.files.count,
		'unsure_count': Object.entries(actual.files.unsure).length,
	}[type];
	const result = testContent === testVal;
	i = `${+i + 1}`.padStart(2, '0');
	if (result) {
		console.info(`- #${i} passed: '${filename}': ${testVal}`);
	}
	else {
		errors++;
		console.error(`- #${i} failed: '${filename}': ${testContent} instead of ${testVal}`);
	}
}

async function unitTest() {
	console.info('Unit tests\n' + '-'.repeat(10));
	desc('metadata');
	await test(['file_size', '0123456789'], ['size', 10]);
	await test(['empty', ''], ['size', 0]);
	await test(['count.js', ''], ['count', 1]);
	desc('file extensions');
	await test(['x.js'], ['files', 'JavaScript']);
	await test(['x.cpp'], ['files', 'C++']);
	await test(['x.c'], ['files', 'C']);
	await test(['x.R'], ['files', 'R']);
	await test(['.m'], ['unsure_count', 1])
	desc('filenames');
	await test(['Dockerfile'], ['files', 'Dockerfile']);
	await test(['CMakeLists.txt'], ['files', 'CMake']);
	await test(['tsconfig.json'], ['files', 'JSON with Comments']);
	await test(['index.tsx'], ['files', 'TSX'])
	await test(['file.antlers.php'], ['files', 'Antlers'])
	await test(['file.other.php', '<?php?>'], ['files', 'PHP'])
	desc('shebangs');
	await test(['node_js', '#!/usr/bin/env node'], ['files', 'JavaScript']);
	await test(['rake_ruby', '#!/usr/bin/env rake'], ['files', 'Ruby']);
	await test(['sh_shell', '#!/bin/sh'], ['files', 'Shell']);
	desc('modelines');
	await test(['emacs_cpp', '# -*- mode:c++ -*-'], ['files', 'C++']);
	await test(['emacs_cs', '# -*- c# -*-'], ['files', 'C#']);
	await test(['vim_sh', '# vim: filetype=sh'], ['files', 'Shell']);
	await test(['vim_ruby', '# vim: syntax = ruby'], ['files', 'Ruby']);
	await test(['XCompose', '# for Emacs: -*- coding: utf-8 -*-'], ['files', 'XCompose'])
	desc('heuristics');
	await test(['c-sharp.cs', 'namespace example {} // empty'], ['files', 'C#']);
	await test(['smalltalk.cs', '!interface methodsFor: instance'], ['files', 'Smalltalk']);
	await test(['eclipse.ecl', 'var:-val'], ['files', 'ECLiPSe']);
	await test(['ecl.ecl', 'var:=val'], ['files', 'ECL']);
	await test(['frege.fr', 'import package'], ['files', 'Frege']);
	await test(['forth.fr', 'new-device 1'], ['files', 'Forth']);
	await test(['raku','#!/usr/bin/env perl6\n module'], ['files', 'Raku']);
	desc('vendored');
	await test(['gradlew'], ['files', undefined]);
	await test(['decl.d.ts'], ['files', undefined]);
	await test(['deps/file.c'], ['files', undefined]);
	await test(['node_modules/file.js'], ['files', undefined]);
	desc('generated');
	await test(['file.Feature.cs'], ['files', undefined]);
	await test(['package-lock.json'], ['files', undefined]);
	await test(['Pipfile.lock'], ['files', undefined]);
	desc('documentation');
	await test(['README.md'], ['files', undefined]);
	await test(['docs/demo.js'], ['files', undefined]);
	await test(['samples/head.h'], ['files', undefined]);
	desc('unknown');
	await test(['unknown'], ['files', null]);

	if (errors) {
		const message = `\nExited with ${errors} errors.\n`;
		throw console.error(message), message;
	}
	else console.info('All unit tests passed');
}
unitTest();
