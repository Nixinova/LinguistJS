export type Language = string | null
export type FilePath = string
export type Bytes = Integer
export type Integer = number

export interface Options {
	keepVendored?: boolean
	quick?: boolean
}

export interface LanguagesData {
	data: Record<FilePath, Bytes>
	markup: Record<FilePath, Bytes>
	programming: Record<FilePath, Bytes>
	prose: Record<FilePath, Bytes>
	total: {
		unique: Integer
		bytes: Bytes
	}
}

export interface Results {
	count: Integer
	languages: LanguagesData
	results: Record<FilePath, Language>
}
