export type LanguageResult = string | null
export type Language = string
export type Category = 'data' | 'markup' | 'programming' | 'prose'
export type FilePath = string
export type Bytes = Integer
export type Integer = number

export interface Options {
	ignoredFiles?: string[]
	ignoredLanguages?: Language[]
	categories?: Category[]
	keepVendored?: boolean
	keepBinary?: boolean
	quick?: boolean
	checkIgnored?: boolean
	checkAttributes?: boolean
	checkHeuristics?: boolean
	checkShebang?: boolean
}

export interface Results {
	files: {
		count: Integer
		bytes: Bytes
		/** Note: Results use slashes as delimiters even on Windows. */
		results: Record<FilePath, LanguageResult>
	}
	languages: {
		count: Integer
		bytes: Bytes
		results: Record<Language, {
			bytes: Bytes
			type: Category
			color?: `#${string}`
		}>
	}
	unknown: {
		count: Integer
		bytes: Bytes
		extensions: Record<string, Bytes>
		filenames: Record<string, Bytes>
	}
}
