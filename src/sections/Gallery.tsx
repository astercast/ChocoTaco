import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const NFTS = [
  { id: 1,  week: 1,  rarity: 'common',    tilt: -2 },
  { id: 2,  week: 2,  rarity: 'rare',      tilt:  3 },
  { id: 3,  week: 3,  rarity: 'common',    tilt: -1 },
  { id: 4,  week: 4,  rarity: 'legendary', tilt:  4 },
  { id: 5,  week: 5,  rarity: 'epic',      tilt: -3 },
  { id: 6,  week: 6,  rarity: 'common',    tilt:  2 },
  { id: 7,  week: 7,  rarity: 'rare',      tilt: -4 },
  { id: 8,  week: 8,  rarity: 'common',    tilt:  1 },
  { id: 9,  week: 9,  rarity: 'epic',      tilt: -2 },
  { id: 10, week: 10, rarity: 'common',    tilt:  3 },
  { id: 11, week: 11, rarity: 'legendary', tilt: -1 },
  { id: 12, week: 12, rarity: 'rare',      tilt:  2 },
]

const RARITY: Record<string, string> = {
  common:    'text-cream-500',
  rare:      'text-mint',
  epic:      'text-gold',
  legendary: 'text-chili',
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
              <span className="chip">04 · the wall</span>
              <span className="hand text-gold text-2xl rotate-p2 inline-block">every one a keeper</span>
            </div>
            <h2 className="display text-5xl md:text-7xl text-cream-50 leading-none">
              The whole <span className="display-italic text-gold">batch.</span>
            </h2>
          </div>
          <a href="https://mintgarden.io" target="_blank" rel="noopener noreferrer"
             className="btn-outline">
            See them on MintGarden →
          </a>
        </motion.div>

        {/* Scattered grid — slight rotations make it feel hand-pinned */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {NFTS.map((nft, i) => (
            <motion.div
              key={nft.id}
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
              {/* Caption — receipt style */}
              <div className="px-1 pt-2 pb-1 flex items-baseline justify-between">
                <span className="display text-cocoa-900 text-base">No. {nft.id}</span>
                <span className={`mono text-2xs uppercase tracking-widest ${RARITY[nft.rarity]}`}>
                  {nft.rarity}
                </span>
              </div>
              <p className="hand text-cocoa-700 px-1 pb-1 text-sm">wk {nft.week}</p>
            </motion.div>
          ))}
        </div>

        {/* Closing flourish */}
        <p className="hand text-3xl text-cream-300 text-center mt-12 rotate-n2 inline-block w-full">
          ~ and there will be more ~
        </p>
      </div>
    </section>
  )
}
