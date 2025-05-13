import { dtils } from './deps.ts'
import urls from './urls.json' assert { type: 'json' }
import * as api from './mod.ts'
import { Meta } from './map_types.ts'

export async function ci(): Promise<void> {
	await dtils.check({ permissions: 'all', unstable: true })
}

export async function test(): Promise<void> {
	await dtils.test({ permissions: 'all', unstable: true })
}

/**
 * Generates tile groups for a new map. Accepts 4 args: x, y, width, and height.
 *
 * NOTE: all dimensions are in thousands. For example, the x and y of tile group 1x1.json is 1 and 1, not
 * 1000 and 1000. The same is true of with and height. */
export async function generateGroups(args: string[]): Promise<void> {
	const ensureIsNumArg = (name: string, pos: number, arg: unknown) => {
		if (!arg) throw new Error(`Expected argument ${name} at position ${pos} to be specified`)
		if (typeof arg !== 'string') throw new Error(`Weird, all CLI arguments should be strings, but ${name} at pos ${pos} was not`)

		const numberArg = parseInt(arg)
		if (isNaN(numberArg)) throw new Error(`Expected a valid integer for arg ${name} at pos ${pos}, but found ${arg}`)

		return numberArg
	}

	const [xRaw, yRaw, widthRaw, heightRaw] = args

	const x = ensureIsNumArg('x', 0, xRaw)
	const y = ensureIsNumArg('y', 1, yRaw)
	const width = ensureIsNumArg('width', 2, widthRaw)
	const height = ensureIsNumArg('height', 3, heightRaw)

	await api.generateTileGroups({ x, y, width, height })

	// Write the meta to contain the new data
	const meta: Partial<Meta> = await dtils.readJson('map/meta.json')
	const newMeta: Meta = { id: meta.id || 'new_map', name: meta.id || 'New Map', x, y, height, width }
	await dtils.writeJson('map/meta.json', newMeta, { separator: '\t' })
}

/** Downloads a URL or URL constant (see url urls.json), parses the result as a series of paths, and writes them to temp/paths.json */
export async function downloadPaths(args: string[]): Promise<void> {
	const [url] = args
	if (!url) throw new Error('Expected a URL as an argument')

	// @ts-ignore will always be string because of the '||'
	const fullUrl = urls[url] || url

	await api.downloadPaths(fullUrl)
}

/** Applies the mercator projection to temp/paths.json */
export async function projectPaths(): Promise<void> {
	const paths = await dtils.readJson('temp/paths.json')
	if (!Array.isArray(paths)) throw new Error('temp/paths.json does not contain valid data')

	await dtils.writeJson('temp/paths.json', paths.map((path) => path.map(api.applyMercatorProjection)), { separator: '\t' })
}

/** Applies the paths in temp/paths.json to the current map, filling all polygons with the specified terrain */
export async function fill(args: string[]): Promise<void> {
	const [terrain] = args
	if (!terrain) throw new Error('Expected a terrain as an argument')

	const paths = await dtils.readJson('temp/paths.json')
	if (!Array.isArray(paths)) throw new Error('temp/paths.json does not contain valid data')

	await api.fillTiles({ paths, resources: {}, terrain: api.ensureIsTerrain(terrain) })
}

/** Builds an SVG of temp/paths.json filling all polygons with the specified color at temp/paths.svg */
export async function buildPathsSvg(args: string[]): Promise<void> {
	const [color] = args
	if (!color) throw new Error('Expected a color as an argument')

	const paths = await dtils.readJson('temp/paths.json')
	if (!Array.isArray(paths)) throw new Error('temp/paths.json does not contain valid data')

	await dtils.writeText('temp/paths.svg', api.convertPathsToSvg(paths))
}

/** Applies a grid to temp/paths.svg with `color` at intervals of `interval` */
export async function applySvgGrid(args: string[]): Promise<void> {
	const [color, intervalRaw] = args
	if (!color) throw new Error('Expected a color as the first argument')
	if (!intervalRaw) throw new Error('Expected an interval as the second argument')

	const interval = parseInt(intervalRaw)
	if (isNaN(interval)) throw new Error(`Expected an interval as a number, but got "${intervalRaw}"`)

	const svg = await dtils.readText('temp/paths.svg')
	if (!svg) throw new Error('There is no temp/paths.svg')

	await dtils.writeText('temp/paths.svg', api.applySvgGrid(svg, color, interval))
}

/** Adds a dot at `x`,`y` with `color` */
export async function markSvgPoint(args: string[]): Promise<void> {
	const [xRaw, yRaw, color] = args

	const x = parseInt(xRaw)
	if (isNaN(x)) throw new Error(`Expected an X coordinate as a number, but got "${xRaw}"`)

	const y = parseInt(yRaw)
	if (isNaN(y)) throw new Error(`Expected an X coordinate as a number, but got "${yRaw}"`)

	if (!color) throw new Error('Expected a color as an argument')

	const svg = await dtils.readText('temp/paths.svg')
	if (!svg) throw new Error('There is no temp/paths.svg')

	await dtils.writeText('temp/paths.svg', api.markSvgPoint(svg, { x, y }, color))
}

/** Serve temp/paths.svg */
export async function serveSvg(): Promise<void> {
	const server = Deno.serve({ port: 4000 }, async () => {
		const svg = await dtils.readText('temp/paths.svg')
		if (!svg) return new Response('No temp/paths.svg exists', { status: 404 })

		return new Response(svg, {
			headers: { 'content-type': 'image/svg+xml' },
		})
	})

	await server.finished
}

/** Converts the current map into a png image. Zoom must be a number less than 1 */
export async function mapToPng(args: string[]): Promise<void> {
	const [zoomRaw] = args
	if (!zoomRaw) throw new Error('Expected a zoom argument')

	const zoom = parseFloat(zoomRaw)
	if (isNaN(zoom)) throw new Error(`Expected zoom as a number, but got "${zoomRaw}"`)

	await api.mapToPng('temp/map.png', zoom)
}

/** Labels the map with `id` and `name` */
export async function labelMap(args: string[]): Promise<void> {
	const [id, name] = args

	if (!id) throw new Error('Expected the first argument to be the map id')
	if (!name) throw new Error('Expected the second argument to be the map name')

	const meta: Partial<Meta> = await dtils.readJson('map/meta.json')

	const newMeta: Meta = {
		id,
		name,
		x: meta.x || 0,
		y: meta.y || 0,
		height: meta.height || 0,
		width: meta.width || 0,
	}

	await dtils.writeJson('map/meta.json', newMeta, { separator: '\t' })
}

/** Downloads `url` and parses the elevation data to temp/elevation.json */
export async function downloadElevation(args: string[]): Promise<void> {
	const [url] = args
}

/** Clean up artifacts from previous jobs */
export async function clean(): Promise<void> {
	await Deno.remove('temp', { recursive: true })
	await Deno.remove('map', { recursive: true })
}
