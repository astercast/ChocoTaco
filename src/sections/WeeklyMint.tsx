/**
 * The Mint section. This is BOTH the launch event copy AND the generator UI.
 *
 * CHIA NFT GENERATOR FLOW (verified against wojak-ink architecture):
 *
 * 1. User picks traits in the kitchen UI below.
 * 2. Click mint -> POST /api/mint to Worker with {address, traits}.
 * 3. Worker -> signer sidecar: build CHIP-0007 metadata JSON, upload to IPFS or
 *    R2, then build an offer that mints a fresh NFT with that metadata URI
 *    (treasury offers the NFT for 0.5 XCH).
 * 4. Worker returns the offer string. Client passes it to WalletConnect's
 *    `chia_takeOffer` RPC. User signs in Sage / Chia Reference Wallet.
 * 5. Chain confirms. The NFT (with the user's chosen traits + 25% royalty
 *    enforced by NFT1) lands in the user's wallet.
 *
 * Golden Tickets: all 500 mints are on-demand. The Worker reserves 50 random
 * mint slots between 1..500 at deploy time and stores them in D1. When a user
 * mints, the Worker checks if the next sequential mint number is a Golden slot.
 * On a hit, it tells the signer to stamp Golden:true into the metadata. The
 * NFT is then minted with that flag baked in. No pre-minting required.
 */

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useCallback } from 'react'
import { Shuffle } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { OG_MINT } from '../constants'
import Toast, { type ToastVariant } from '../components/Toast'

const TRAITS: Record<string, { label: string; count: number }> = {
  shell:      { label: 'shell',      count: 5 },
  filling:    { label: 'filling',    count: 5 },
  sauce:      { label: 'sauce',      count: 5 },
  accessory:  { label: 'accessory',  count: 5 },
  background: { label: 'background', count: 5 },
}
type Key = keyof typeof TRAITS

function rand(): Record<Key, number> {
  const r: Record<string, number> = {}
  for (const k of Object.keys(TRAITS)) r[k] = Math.floor(Math.random() * TRAITS[k].count)
  return r
}

const MINT_STATE: 'pre' | 'live' | 'sold-out' =
  (import.meta.env.VITE_MINT_STATE as 'pre' | 'live' | 'sold-out' | undefined) ?? 'pre'
const MINTED_COUNT = Number(import.meta.env.VITE_MINTED_COUNT ?? 0)

export default function OgMint() {
  const { connected, connect, mint } = useWallet()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [sel, setSel] = useState<Record<Key, number>>(rand)
  const [minting, setMinting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null)

  const shuffle = useCallback(() => setSel(rand()), [])

  async function handleMint() {
    setMinting(true)
    setToast({ msg: 'Cooking your taco...', variant: 'loading' })
    const result = await mint(sel)
    setMinting(false)
    if (result.success) {
      setToast({
        msg: result.isGolden
          ? '★★★ Golden Ticket! Lucky you.'
          : 'Minted. Welcome to the factory.',
        variant: 'success',
      })
    } else {
      setToast({ msg: result.error ?? 'Mint failed', variant: 'error' })
    }
    setTimeout(() => setToast(null), 5000)
  }

  const keys = Object.keys(TRAITS) as Key[]
  const remaining = OG_MINT.supply - MINTED_COUNT

  return (
    <section id="mint" className="py-24 px-6 grain relative">
      <div ref={ref} className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="grid md:grid-cols-12 gap-6 items-end mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="md:col-span-8"
          >
            <h2 className="modern-display text-6xl md:text-8xl text-cream-50 uppercase leading-[0.9]">
              Five hundred
              <br />
              <span className="text-gold">tacos.</span>
            </h2>
            <p className="hand text-gold text-3xl rotate-n2 inline-block mt-4">
              half an XCH a pop.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="md:col-span-4 text-cream-300 font-serif text-lg leading-relaxed"
          >
            Pick your traits in the kitchen. Every XCH from the mint goes straight into TibetSwap LP.
            <span className="hand text-gold"> 50 random slots are Golden Tickets.</span>
          </motion.div>
        </div>

        {/* Kitchen */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-12 gap-8 md:gap-12"
        >
          {/* Preview (polaroid) */}
          <div className="md:col-span-5">
            <div className="sticky top-24">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-cream-100/40 rotate-n4 z-10" />
              <div className="bg-cream-50 p-3 rotate-n2 shadow-2xl">
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
                <div className="py-3 px-2 text-center">
                  <p className="display text-cocoa-900 text-xl">OG Badge</p>
                  <p className="hand text-cocoa-700 text-lg">your one-of-one</p>
                  <p className="mono text-xs text-cocoa-700 mt-1">
                    {keys.map(() => '???').join(' · ')}
                  </p>
                </div>
              </div>

              {/* Supply progress */}
              <div className="mt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="hand text-gold text-xl">{remaining} left</span>
                  <span className="mono text-xs text-cream-500">{MINTED_COUNT} / {OG_MINT.supply}</span>
                </div>
                <div className="h-2 bg-cocoa-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-500"
                    style={{ width: `${(MINTED_COUNT / OG_MINT.supply) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trait selectors */}
          <div className="md:col-span-7 space-y-5">
            {keys.map(k => (
              <div key={k} className="pb-4 border-b border-cream-500/10">
                <p className="hand text-gold text-xl mb-2">{TRAITS[k].label}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: TRAITS[k].count }).map((_, i) => {
                    const active = sel[k] === i
                    return (
                      <button
                        key={i}
                        onClick={() => setSel(p => ({ ...p, [k]: i }))}
                        className={`w-12 h-10 rounded-full font-serif text-base transition-all ${
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

            {/* Mint controls */}
            <div className="flex flex-wrap gap-3 pt-4 items-center">
              <button onClick={shuffle} className="btn-outline">
                <Shuffle size={14} /> Surprise me
              </button>
              {MINT_STATE === 'pre' ? (
                <a href="https://x.com/ChiaChocoTaco" target="_blank" rel="noopener noreferrer" className="btn-gold">
                  Follow for launch →
                </a>
              ) : MINT_STATE === 'sold-out' ? (
                <span className="font-serif italic text-cream-400">
                  Sold out. Grab one on{' '}
                  <a href="https://mintgarden.io" target="_blank" rel="noopener noreferrer"
                    className="underline decoration-gold underline-offset-4 hover:text-gold">MintGarden</a>.
                </span>
              ) : !connected ? (
                <button onClick={connect} className="btn-gold">Connect to mint</button>
              ) : (
                <button onClick={handleMint} disabled={minting} className="btn-gold">
                  {minting ? 'cooking...' : `Mint mine for ${OG_MINT.priceXCH} XCH →`}
                </button>
              )}
            </div>

            {/* Limited Editions mention */}
            <div className="mt-8 pt-6 border-t border-cream-500/10">
              <p className="hand text-gold text-xl">limited editions</p>
              <p className="font-serif italic text-cream-400 text-sm mt-1 max-w-md leading-relaxed">
                Very rare community artist drops happen at random. No schedule, no warning.
                If you're holding when they go live, you get first dibs. Each Limited NFT
                stacks 15 to 40 Cocoa Units on top of your OGs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Toast message={toast?.msg ?? null} variant={toast?.variant ?? 'loading'} onDismiss={() => setToast(null)} />
    </section>
  )
}
