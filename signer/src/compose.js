/**
 * Image composer — stacks trait layers into the final NFT PNG.
 *
 * Expected directory layout in art/:
 *   art/
 *     background/  0.png  1.png  2.png  3.png  4.png
 *     shell/       0.png  1.png  ...
 *     filling/     ...
 *     sauce/       ...
 *     accessory/   ...
 *
 * Layer order (bottom up): background, shell, filling, sauce, accessory
 */
import sharp from 'sharp'
import path from 'path'

const ART_DIR = process.env.ART_DIR ?? './art'
const LAYER_ORDER = ['background', 'shell', 'filling', 'sauce', 'accessory']

/**
 * @param traits  { background?: 0..4, shell?: 0..4, ... }
 * @returns Buffer  PNG bytes
 */
export async function composeImage(traits) {
  const base = path.join(ART_DIR, 'background', `${traits.background ?? 0}.png`)
  let img = sharp(base).resize(1500, 1500)

  const overlays = []
  for (const layer of LAYER_ORDER.slice(1)) {
    if (traits[layer] === undefined) continue
    overlays.push({
      input: path.join(ART_DIR, layer, `${traits[layer]}.png`),
      gravity: 'center',
    })
  }
  if (overlays.length > 0) img = img.composite(overlays)

  return img.png().toBuffer()
}
