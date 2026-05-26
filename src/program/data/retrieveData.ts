import YAML from 'js-yaml';
import { HeuristicsSchema, LanguagesScema, VendorSchema } from '../../types/schema.js';
import { loadFile } from './loadDataFiles.js';

type LoadedData = {
	langData: LanguagesScema;
	vendorData: VendorSchema;
	docData: VendorSchema;
	heuristicsData: HeuristicsSchema;
	generatedData: string[];
	vendorPaths: string[];
};

let data: LoadedData = null!;

async function initRetrieveData(offline: boolean): Promise<void> {
	// Only load the data on mont
	if (data) return;

	const langData = (await loadFile('languages.yml', offline).then(YAML.load)) as LanguagesScema;
	const vendorData = (await loadFile('vendor.yml', offline).then(YAML.load)) as VendorSchema;
	const docData = (await loadFile('documentation.yml', offline).then(YAML.load)) as VendorSchema;
	const heuristicsData = (await loadFile('heuristics.yml', offline).then(YAML.load)) as HeuristicsSchema;
	const generatedData = (await loadFile('generated.rb', offline).then(YAML.load)) as string[];
	const vendorPaths = [...vendorData, ...docData, ...generatedData];

	data = {
		langData,
		vendorData,
		docData,
		heuristicsData,
		generatedData,
		vendorPaths,
	};
}

/** Load data from github-linguist web repo or cached local file. */
export default async function retrieveData(offline: boolean): Promise<LoadedData> {
	await initRetrieveData(offline);
	return data;
}
