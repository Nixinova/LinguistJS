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

interface HeuristicsRules {
	pattern?: string
	named_pattern?: string
	named_patterns?: string[]
	negative_pattern?: string
}
export interface HeuristicsSchema {
	disambiguations: Array<{
		extensions: string[]
		rules: Array<HeuristicsRules & {
			language: string
			and?: HeuristicsRules[]
		}>
	}>
	namedPatterns: Record<string, string | string[]>
}

export type VendorSchema = string[]
