import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// Placeholder feed — real version pulls from MintGarden:
//   GET https://api.mintgarden.io/collections/{OG_COLLECTION_ID}/nfts
//   ?sort=mint_date_desc&size=12
// Each entry below will be replaced with: { id, edition, rarity, thumbnail }
const RECENT_MINTS = [
  { edition: 1,   rarity: 'common',    tilt: -2 },
  { edition: 2,   rarity: 'rare',      tilt:  3 },
  { edition: 3,   rarity: 'common',    tilt: -1 },
  { edition: 4,   rarity: 'golden',    tilt:  4 },
  { edition: 5,   rarity: 'common',    tilt: -3 },
  { edition: 6,   rarity: 'rare',      tilt:  2 },
  { edition: 7,   rarity: 'common',    tilt: -4 },
  { edition: 8,   rarity: 'common',    tilt:  1 },
  { edition: 9,   rarity: 'golden',    tilt: -2 },
  { edition: 10,  rarity: 'rare',      tilt:  3 },
  { edition: 11,  rarity: 'common',    tilt: -1 },
  { edition: 12,  rarity: 'common',    tilt:  2 },
]

const RARITY: Record<string, string> = {
  common: 'text-cream-500',
  rare:   'text-mint',
  golden: 'text-gold',
}

export default function Gallery() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="gallery" className="py-24 px-6 grain relative">
      <div ref={ref} className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <div className="flex items-baseline gap-3 mb-3 flex-wrap">
              <span className="chip">04 · fresh out the oven</span>
              <span className="hand text-gold text-2xl rotate-p2 inline-block">latest cooks</span>
            </div>
            <h2 className="display text-5xl md:text-7xl text-cream-50 leading-none">
              Just minted.
            </h2>
            <p className="font-serif text-lg text-cream-300 mt-3 max-w-xl">
              Every OG that gets cooked in the kitchen lands here.
              {' '}<span className="hand text-gold">gold ones are the Golden Tickets.</span>
            </p>
          </div>
          <a href="https://mintgarden.io" target="_blank" rel="noopener noreferrer"
             className="btn-outline">
            See them all on MintGarden →
          </a>
        </motion.div>

        {/* Scattered grid, slight rotations make it feel hand-pinned */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {RECENT_MINTS.map((nft, i) => (
            <motion.div
              key={nft.edition}
              initial={{ opacity: 0, y: 20, rotate: 0 }}
              animate={inView ? { opacity: 1, y: 0, rotate: nft.tilt } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ rotate: 0, y: -4 }}
              className="bg-cream-50 p-2 shadow-xl cursor-pointer"
            >
              {/* Art slot */}
              <div className="aspect-square bg-cocoa-800 flex items-center justify-center">
                <div className="w-8 h-8 border border-cream-300/15 rounded-md" />
              </div>
              {/* Caption */}
              <div className="px-1 pt-2 pb-1 flex items-baseline justify-between">
                <span className="display text-cocoa-900 text-base">
                  OG #{String(nft.edition).padStart(3, '0')}
                </span>
                <span className={`mono text-2xs uppercase tracking-widest ${RARITY[nft.rarity]}`}>
                  {nft.rarity === 'golden' ? '★ golden' : nft.rarity}
                </span>
              </div>
              <p className="hand text-cocoa-700 px-1 pb-1 text-sm">
                {nft.rarity === 'golden' ? 'lucky one' : 'fresh batch'}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing flourish */}
        <p className="hand text-3xl text-cream-300 text-center mt-12 rotate-n2 inline-block w-full">
          ~ keep them coming ~
        </p>
      </div>
    </section>
  )
}
