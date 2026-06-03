import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { OG_MINT } from '../constants'
import Toast, { type ToastVariant } from '../components/Toast'

// Mint state — overwrite when launch is live
const MINT_STATE: 'pre' | 'live' | 'sold-out' =
  (import.meta.env.VITE_MINT_STATE as 'pre' | 'live' | 'sold-out' | undefined) ?? 'pre'

const MINTED_COUNT = Number(import.meta.env.VITE_MINTED_COUNT ?? 0)  // overridden at build or via /api/network-stats

export default function OgMint() {
  const { connected, connect, mint } = useWallet()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [minting, setMinting] = useState(false)
  const [mintCount, setMintCount] = useState(1)
  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null)

  async function handleMint() {
    setMinting(true)
    setToast({ msg: `Reserving ${mintCount} OG${mintCount > 1 ? 's' : ''}…`, variant: 'loading' })
    const result = await mint(mintCount)
    setMinting(false)
    if (result.success) {
      setToast({ msg: `Minted ${mintCount} OG${mintCount > 1 ? 's' : ''}. Welcome to the factory.`, variant: 'success' })
    } else {
      setToast({ msg: result.error ?? 'Mint failed', variant: 'error' })
    }
    setTimeout(() => setToast(null), 4500)
  }

  const remaining = OG_MINT.supply - MINTED_COUNT
  const totalCost = (mintCount * OG_MINT.priceXCH).toFixed(2)

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
            <div className="flex items-baseline gap-3 mb-3 flex-wrap">
              <span className="chip">02 · the launch</span>
              <span className="hand text-gold text-2xl rotate-p2 inline-block">one-time only</span>
            </div>
            <h2 className="display text-5xl md:text-7xl text-cream-50 leading-none">
              500 OG badges.
              <br />
              <span className="display-italic text-gold">Half an XCH each.</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="md:col-span-4 text-cream-300 font-serif text-lg leading-relaxed"
          >
            Every XCH raised goes straight into TibetSwap LP.
            <span className="hand text-gold"> deepest pool on chia, day one.</span>
          </motion.div>
        </div>

        {/* Featured drop card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-12 gap-8 md:gap-12 items-center"
        >
          {/* Polaroid art slot */}
          <div className="md:col-span-7 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-cream-100/40 rotate-n4 z-10" />
            <div className="aspect-[4/5] max-w-md mx-auto bg-cream-50 p-3 rotate-n2 shadow-2xl">
              <div className="w-full h-full bg-cocoa-800 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                <div className="w-20 h-20 border border-cream-300/20 rounded-xl" />
                <p className="mono text-xs text-cream-500 uppercase tracking-widest">art coming soon</p>
              </div>
              <div className="pt-3 pb-1 text-center">
                <p className="display text-cocoa-900 text-xl">OG Badge</p>
                <p className="hand text-cocoa-700 text-lg">factory employee</p>
              </div>
            </div>
            <div className="absolute top-6 -right-2 md:-right-6 stamp text-chili rotate-p4 z-20 hidden sm:flex">
              {MINT_STATE === 'pre' ? 'Soon' : MINT_STATE === 'live' ? 'Live' : 'Sold out'}
            </div>

            {/* Golden ticket callout */}
            <div className="mt-6 max-w-md mx-auto text-center">
              <p className="hand text-gold text-2xl">
                ↑ 50 of these are pre-minted Golden Tickets
              </p>
              <p className="font-serif italic text-cream-400 text-sm mt-1">
                3× points forever · shuffled into the mint order, you find out when you mint
              </p>
            </div>
          </div>

          {/* Info / action */}
          <div className="md:col-span-5 flex flex-col gap-6">

            {/* Mint stats */}
            <div className="space-y-3 mono text-sm">
              <div className="flex justify-between border-b border-cream-500/10 pb-2">
                <span className="text-cream-500 uppercase tracking-widest text-xs">supply</span>
                <span className="text-cream-50 text-base">{OG_MINT.supply} OG NFTs</span>
              </div>
              <div className="flex justify-between border-b border-cream-500/10 pb-2">
                <span className="text-cream-500 uppercase tracking-widest text-xs">price</span>
                <span className="text-cream-50 text-base">{OG_MINT.priceXCH} XCH each</span>
              </div>
              <div className="flex justify-between border-b border-cream-500/10 pb-2">
                <span className="text-cream-500 uppercase tracking-widest text-xs">golden tickets</span>
                <span className="text-gold text-base">{OG_MINT.goldenTickets} pre-minted</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-cream-500 uppercase tracking-widest text-xs">all proceeds</span>
                <span className="text-mint text-base">→ TibetSwap LP</span>
              </div>
            </div>

            {/* Remaining indicator */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="hand text-gold text-xl">{remaining} left</span>
                <span className="mono text-xs text-cream-500">{MINTED_COUNT} / {OG_MINT.supply}</span>
              </div>
              <div className="h-2 bg-cocoa-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full"
                  style={{ width: `${(MINTED_COUNT / OG_MINT.supply) * 100}%` }}
                />
              </div>
            </div>

            {/* Quantity selector */}
            {MINT_STATE === 'live' && connected && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMintCount(c => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-full border border-cream-500/30 text-cream-300 hover:border-cream-50"
                >
                  –
                </button>
                <span className="display text-3xl text-cream-50 w-12 text-center">{mintCount}</span>
                <button
                  onClick={() => setMintCount(c => Math.min(10, c + 1))}
                  className="w-9 h-9 rounded-full border border-cream-500/30 text-cream-300 hover:border-cream-50"
                >
                  +
                </button>
                <span className="ml-3 font-serif italic text-cream-400">
                  = {totalCost} XCH
                </span>
              </div>
            )}

            {/* Action */}
            {MINT_STATE === 'pre' ? (
              <div>
                <p className="font-serif text-cream-300 mb-3">
                  Mint opens once the art is locked. Get on the list:
                </p>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="btn-gold self-start">
                  Follow for launch →
                </a>
              </div>
            ) : MINT_STATE === 'sold-out' ? (
              <p className="font-serif italic text-cream-400">
                Sold out. Grab one on{' '}
                <a href="https://mintgarden.io" className="underline decoration-gold underline-offset-4 hover:text-gold">MintGarden</a>.
              </p>
            ) : !connected ? (
              <button onClick={connect} className="btn-gold self-start">Connect to mint</button>
            ) : (
              <button onClick={handleMint} disabled={minting} className="btn-gold self-start">
                {minting ? 'minting…' : `Mint ${mintCount} for ${totalCost} XCH →`}
              </button>
            )}
          </div>
        </motion.div>
      </div>
      <Toast message={toast?.msg ?? null} variant={toast?.variant ?? 'loading'} onDismiss={() => setToast(null)} />
    </section>
  )
}
