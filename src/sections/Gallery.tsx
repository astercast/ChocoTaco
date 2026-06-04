import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// Placeholder feed - real version pulls from MintGarden:
//   GET https://api.mintgarden.io/collections/{OG_COLLECTION_ID}/nfts
//   ?sort=mint_date_desc&size=12
// Each entry below will be replaced with: { id, edition, thumbnail }
const RECENT_MINTS = [
  { edition: 1,   tilt: -2 },
  { edition: 2,   tilt:  3 },
  { edition: 3,   tilt: -1 },
  { edition: 4,   tilt:  4 },
  { edition: 5,   tilt: -3 },
  { edition: 6,   tilt:  2 },
  { edition: 7,   tilt: -4 },
  { edition: 8,   tilt:  1 },
  { edition: 9,   tilt: -2 },
  { edition: 10,  tilt:  3 },
  { edition: 11,  tilt: -1 },
  { edition: 12,  tilt:  2 },
]

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
            <h2 className="modern-display text-6xl md:text-8xl text-cream-50 uppercase leading-[0.9]">
              Fresh out
              <br />
              <span className="text-gold">the oven.</span>
            </h2>
            <p className="modern-light text-lg text-cream-300 mt-4 max-w-xl">
              Every factory taco that gets cooked lands here.
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
              <p className="display text-cocoa-900 text-base px-1 pt-2 pb-2 text-center">
                #{String(nft.edition).padStart(3, '0')}
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
