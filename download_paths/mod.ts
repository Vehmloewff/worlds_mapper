import { dtils } from '../deps.ts'
import { findFileWithExtension, runPythonScript, unzipPath } from '../helpers.ts'

export async function downloadPaths(url: string): Promise<void> {
	const zipFilePath = 'temp/shape.zip'
	const shapesDirectoryPath = 'temp/shape'
	const shapeJsonPath = 'temp/paths.json'

	console.log('Downloading...')
	const response = await fetch(url)

	await dtils.writeBinary(zipFilePath, new Uint8Array(await response.arrayBuffer()))

	console.log('Unzipping...')
	await unzipPath(zipFilePath, shapesDirectoryPath)

	console.log('Finding shape file...')
	const shapeFilePath = await findFileWithExtension(shapesDirectoryPath, 'shp')

	console.log('Parsing shapes file...')
	await runPythonScript('download_paths/shape_to_json.py', [shapeFilePath, shapeJsonPath])
}
