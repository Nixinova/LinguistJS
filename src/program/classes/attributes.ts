import ignore from 'ignore';
import { FileGlob, RelFile } from '../../types/types.js';
import { FlagAttributes } from '../parsing/parseGitattributes.js';

/** Stores parsed attribute information per file glob */
export default class Attributes {
	#attributes: Record<FileGlob, FlagAttributes>;

	constructor() {
		this.#attributes = {};
	}

	get attributes() {
		return this.#attributes;
	}

	add(glob: FileGlob, attributes: FlagAttributes) {
		this.#attributes[glob] = attributes;
	}

	getFlaggedGlobs(attr: keyof FlagAttributes, val: boolean) {
		return Object.entries(this.#attributes)
			.filter(([, attrs]) => attrs[attr] === val)
			.map(([glob]) => glob);
	}

	findAttrsForPath(relFilePath: RelFile): FlagAttributes | null {
		const resultAttrs: Record<string, string | boolean | null> = {};
		for (const glob in this.#attributes) {
			const matchingAttrs = this.#attributes[glob];
			// Check if glob matches rel path
			if (ignore().add(glob).ignores(relFilePath)) {
				for (const [attr, val] of Object.entries(matchingAttrs)) {
					if (val !== null) {
						resultAttrs[attr] = val;
					}
				}
			}
		}

		if (!JSON.stringify(resultAttrs).length) {
			return null;
		}
		return resultAttrs as FlagAttributes;
	}
}
