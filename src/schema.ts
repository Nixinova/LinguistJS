export type LanguageType = 'data' | 'markup' | 'programming' | 'prose'

export interface LanguagesScema {
	[name: string]: {
		language_id: number
		fs_name?: string
		type: LanguageType
		color?: `#${string}`
		aliases?: string[]
		extensions?: string[]
		filenames?: string[]
		interpreters?: string[]
		tm_scope?: string
		ace_mode?: string
		codemirror_mode?: string
		codemirror_mime_type?: string
		wrap?: boolean
	}
}

export interface HeuristicsSchema {
	disambiguations: Array<{
		extensions: string[]
		rules: Array<{
			language: string
			[I: string]: any
		}>
	}>
	namedPatterns: any
}

export type VendorSchema = string[]
