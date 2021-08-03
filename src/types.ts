import { LanguageType } from "./schema"

export type Language = string | null
export type LanguageName = string
export type FilePath = string
export type Bytes = Integer
export type Integer = number

export interface Options {
	keepVendored?: boolean
	quick?: boolean
	checkIgnored?: boolean
	checkAttributes?: boolean
	checkHeuristics?: boolean
	ignore?: string[]
}

export interface LanguagesData {
	all: Record<LanguageName, {
		bytes: Bytes
		type: LanguageType
		color?: `#${string}`
	}>
	data: Record<LanguageName, Bytes>
	markup: Record<LanguageName, Bytes>
	programming: Record<LanguageName, Bytes>
	prose: Record<LanguageName, Bytes>
	unknown: Record<LanguageName, Bytes>
	total: {
		unique: Integer
		bytes: Bytes
		unknownBytes: Bytes
	}
}

export interface Results {
	count: Integer
	languages: LanguagesData
	results: Record<FilePath, Language>
}
