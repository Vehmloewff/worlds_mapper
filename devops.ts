import { getPathsFromShapeFile } from './geo_shape/mod.ts'
import { EARTH_LAND_DATA } from './sources.ts'
import { fillTiles } from './tasks/fill_tiles.ts'
import { generateTileGroups } from './tasks/mod.ts'
import { dtils } from './deps.ts'
import { convertPathsToSvg } from './svg.ts'

export async function ci(): Promise<void> {
	await dtils.check({ permissions: 'all', unstable: true })
}

export async function earth(): Promise<void> {
	const size = 24000

	console.log('Getting land paths...')
	const paths = await getPathsFromShapeFile(EARTH_LAND_DATA)

	console.log('Converting paths into an SVG...')
	await dtils.writeText('temp/map.svg', convertPathsToSvg(paths))

	// console.log('Generating tile groups...')
	// await generateTileGroups(size, size)

	// console.log('Filling in the land...')
	// await fillTiles({ paths, resources: {}, terrain: 'forest' })
}
