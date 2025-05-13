import { dtils, pathUtils } from './deps.ts'

export function sum(numbers: number[]): number {
	let sum = 0

	for (const number of numbers) sum += number

	return sum
}

export function getDifferences(numbers: number[]): number[] {
	const differences: number[] = []

	for (const num of numbers) {
		const lastNum = differences[differences.length - 1]
		if (!lastNum) continue

		differences.push(num - lastNum)
	}

	return differences
}

export function formatMilliseconds(ms: number): string {
	if (ms < 1000) return `${ms}ms`
	if (ms < 1000 * 60) return `${Math.round(ms / 1000)}s`
	if (ms < 1000 * 60 * 60) return `${Math.round(ms / (1000 * 60))}m`

	return `${Math.round(ms / (1000 * 60 * 60))}h`
}

export async function unzipPath(zipPath: string, outputPath: string): Promise<void> {
	await dtils.shCapture(`unzip -o ${zipPath} -d ${outputPath}`)
}

export async function findFileWithExtension(dirPath: string, extension: string): Promise<string> {
	for await (const entry of Deno.readDir(dirPath)) {
		if (entry.name.endsWith(`.${extension}`) && entry.isFile) {
			return pathUtils.join(dirPath, entry.name)
		}
	}

	throw new Error(`A file with extension "${extension}" was not found in directory: ${dirPath}`)
}

export async function runPythonScript(path: string, args: string[]): Promise<void> {
	await dtils.sh(`python3 ${path} ${args.join(' ')}`)
}
