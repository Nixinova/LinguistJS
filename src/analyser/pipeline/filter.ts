import ignore from 'ignore';
import * as T from '../../types/types.js';

export function filterFiles(files: T.VirtualFile[], opts: T.Options): T.VirtualFile[] {
	return files.filter((file) => {
		// Skip binary files
		if (!opts.keepBinary && (file.isBinary || file.attributes?.binary === true)) {
			return false;
		}
		if (
			!opts.keepVendored &&
			(file.metadata?.vendored === true || file.metadata?.generated === true || file.metadata?.documentation === true)
		) {
			// Skip vendored, generated, or documentation files
			return false;
		}
		// Skip manually ignored files
		if (opts.ignoredFiles?.length && ignore().add(opts.ignoredFiles).ignores((file.path))) {
			return false;
		}
		return true;
	});
}
