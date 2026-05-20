import analyseFs from './entry/analyseFs.js';
import analyseRaw from './entry/analyseRaw.js';

// Entry point of the program
export default {
	/**
	 * Analyse a list of folders and return language statistics
	 * @param inputPaths - An array of file paths to analyse
	 * @param options - Configuration options for the analysis
	 * @returns A promise that resolves to the analysis results
	 */
	analyseFolders: analyseFs,
	/**
	 * Analyse raw content and return language statistics
	 * @param inputContent - An object where keys are filenames and values are file contents
	 * @param options - Configuration options for the analysis
	 * @returns A promise that resolves to the analysis results
	 */
	analyseRawContent: analyseRaw,
};
