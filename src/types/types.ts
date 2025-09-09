export type LanguageResult = string | null
export type Language = string
export type Category = 'data' | 'markup' | 'programming' | 'prose'
export type FilePath = string
export type Bytes = Integer
export type Integer = number

export type RelFile = string & {}
export type AbsFile = string & {}
export type AbsFolder = string & {}
export type FileGlob = string & {}

export interface Options {
	ignoredFiles?: string[]
	ignoredLanguages?: Language[]
	categories?: Category[]
	keepVendored?: boolean
	keepBinary?: boolean
	relativePaths?: boolean
	childLanguages?: boolean
	quick?: boolean
	offline?: boolean
	calculateLines?: boolean
	checkIgnored?: boolean
	checkDetected?: boolean
	checkAttributes?: boolean
	checkHeuristics?: boolean
	checkShebang?: boolean
	checkModeline?: boolean
}

type LinesOfCode = {
	total: Integer
	content: Integer
}

export interface Results {
	files: {
		count: Integer
		bytes: Bytes
		lines: LinesOfCode
		/** Note: Results use slashes as delimiters even on Windows. */
		results: Record<FilePath, LanguageResult>
		alternatives: Record<FilePath, LanguageResult[]>
	}
	languages: {
		count: Integer
		bytes: Bytes
		lines: LinesOfCode
		results: Record<Language, {
			count: Integer
			bytes: Bytes
			lines: LinesOfCode
		}>
	}
	unknown: {
		count: Integer
		bytes: Bytes
		lines: LinesOfCode
		extensions: Record<string, Bytes>
		filenames: Record<string, Bytes>
	}
	repository: Record<Language, {
		type: Category
		parent?: Language
		color?: `#${string}`
	}>
}
