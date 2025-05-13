import { dtils } from '../deps.ts'
import { findFileWithExtension, runPythonScript, unzipPath } from '../helpers.ts'

export async function downloadElevation(url: string): Promise<void> {
	const zipFilePath = 'temp/elevation.zip'
	const elevationDirectoryPath = 'temp/elevation'
	const shapeJsonPath = 'temp/elevation.json'

	console.log('Downloading...')
	const response = await fetch(url)

	await dtils.writeBinary(zipFilePath, new Uint8Array(await response.arrayBuffer()))

	console.log('Unzipping...')
	await unzipPath(zipFilePath, elevationDirectoryPath)

	console.log('Finding shape file...')
	const shapeFilePath = await findFileWithExtension(elevationDirectoryPath, 'shp')

	console.log('Parsing shapes file...')
	await runPythonScript('download_elevation/geo_tiff_to_json.py', [shapeFilePath, shapeJsonPath])
}
