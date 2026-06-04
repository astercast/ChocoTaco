/**
 * Rasterize public/og-banner.svg → public/og-banner.png for X / Discord embeds.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'public', 'og-banner.svg')
const outPath = join(root, 'public', 'og-banner.png')

const svg = readFileSync(svgPath)
await sharp(svg, { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(outPath)

console.log('Wrote', outPath)
