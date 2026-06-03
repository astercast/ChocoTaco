import { motion, useInView } from 'framer-motion'
import { useRef, useState, useCallback } from 'react'
import { Shuffle } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

const TRAITS: Record<string, { label: string; options: string[] }> = {
  shell:      { label: 'shell',      options: ['crispy gold', 'soft warm', 'dark choco', 'rainbow', 'ghost'] },
  filling:    { label: 'filling',    options: ['classic beef', 'triple cheese', 'jalapeño', 'pineapple', 'void'] },
  sauce:      { label: 'sauce',      options: ['choco drizzle', 'gold dust', 'fire sauce', 'sour cream', 'none'] },
  accessory:  { label: 'accessory',  options: ['crown', 'sunglasses', 'laser eyes', 'halo', 'none'] },
  background: { label: 'background', options: ['choco swirl', 'caramel', 'inferno', 'neon', 'void'] },
}

type Key = keyof typeof TRAITS

function rand(): Record<Key, number> {
  const r: Record<string, number> = {}
  for (const k of Object.keys(TRAITS)) r[k] = Math.floor(Math.random() * TRAITS[k].options.length)
  return r
}

export default function Generator() {
  const { connected, connect } = useWallet()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [sel, setSel] = useState<Record<Key, number>>(rand)
  const [minting, setMinting] = useState(false)
  const [minted, setMinted]   = useState(false)

  const shuffle = useCallback(() => { setSel(rand()); setMinted(false) }, [])

  async function handleMint() {
    if (!connected) { await connect(); return }
    setMinting(true); await new Promise(r => setTimeout(r, 2000))
    setMinting(false); setMinted(true)
  }

  const keys = Object.keys(TRAITS) as Key[]

  return (
    <section id="generator" className="py-24 px-6 grain relative">
      <div ref={ref} className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span className="chip">03 · limited editions</span>
            <span className="hand text-gold text-2xl rotate-n2 inline-block">artist drops every 6 to 8 weeks</span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-cream-50 max-w-3xl leading-none">
            New flavors. <span className="display-italic text-gold">Small batches.</span>
          </h2>
          <p className="font-serif text-xl text-cream-300 mt-4 max-w-2xl">
            Community artist collabs. Each Limited NFT adds 15 to 40 Cocoa Units
            based on rarity, stacked on top of your OGs.{' '}
            <span className="hand text-cream-400 text-lg">preview below is a stand-in.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-12 gap-8"
        >
          {/* Trait selectors (categories only, names hidden until launch) */}
          <div className="md:col-span-7 space-y-5">
            {keys.map(k => (
              <div key={k} className="pb-4 border-b border-cream-500/10">
                <p className="hand text-gold text-xl mb-2">{TRAITS[k].label}</p>
                <div className="flex flex-wrap gap-2">
                  {TRAITS[k].options.map((_opt, i) => {
                    const active = sel[k] === i
                    return (
                      <button
                        key={i}
                        onClick={() => { setSel(p => ({ ...p, [k]: i })); setMinted(false) }}
                        className={`w-10 h-8 rounded-full font-serif text-base transition-all ${
                          active
                            ? 'bg-cream-50 text-cocoa-900 font-semibold'
                            : 'bg-cream-500/10 text-cream-400 hover:bg-cream-500/20'
                        }`}
                        aria-label={`${TRAITS[k].label} option ${i + 1}`}
                      >
                        {active ? '●' : '·'}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <p className="hand text-cream-400 text-lg rotate-n2 inline-block">
              ↑ trait names hidden until launch
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={shuffle} className="btn-outline">
                <Shuffle size={14} /> Randomize
              </button>
              {minted ? (
                <span className="sticker sticker-mint text-base self-center">★ Minted!</span>
              ) : (
                <button onClick={handleMint} disabled={minting} className="btn-gold">
                  {minting ? 'cooking...' : connected ? 'Mint this one →' : 'Connect to mint'}
                </button>
              )}
            </div>
          </div>

          {/* Preview — right, polaroid */}
          <div className="md:col-span-5 relative">
            <div className="sticky top-24">
              <div className="bg-cream-50 p-3 rotate-p2 shadow-2xl">
                <div className="aspect-square bg-cocoa-800 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                  <motion.div
                    key={JSON.stringify(sel)}
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-20 h-20 border border-cream-300/20 rounded-xl opacity-30" />
                    <p className="mono text-xs text-cream-500 uppercase tracking-widest">art coming soon</p>
                  </motion.div>
                </div>
                <div className="py-3 px-2">
                  <p className="hand text-cocoa-900 text-2xl leading-tight">
                    one-of-one <span className="display-italic">recipe</span>
                  </p>
                  <p className="mono text-xs text-cocoa-700 mt-1">
                    {keys.map(() => '???').join(' · ')}
                  </p>
                </div>
              </div>
              {connected && (
                <p className="hand text-cream-400 text-xl text-center mt-4 rotate-n2">
                  ~ 0.001 XCH to mint
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
