import { LanguageType } from "./schema"

export type Language = string | null
export type LanguageName = string
export type FilePath = string
export type Bytes = Integer
export type Integer = number

export interface Options {
	ignoredFiles?: string[]
	ignoredLanguages?: LanguageName[]
	categories?: LanguageType[]
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
		results: Record<FilePath, Language>
	}
	languages: {
		count: Integer
		bytes: Bytes
		results: Record<LanguageName, {
			bytes: Bytes
			type: LanguageType
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
