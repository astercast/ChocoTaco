import { motion } from 'framer-motion'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { CHOCO_TACO_ASSET_ID } from '../constants'

export default function Hero() {
  const { connect, connected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleConnect() {
    setLoading(true); try { await connect() } finally { setLoading(false) }
  }
  function copyAssetId() {
    navigator.clipboard.writeText(CHOCO_TACO_ASSET_ID)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="relative min-h-[92vh] pt-20 pb-12 px-6 overflow-hidden grain">
      {/* Off-center warm glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 30% 35%, rgba(232,156,59,0.12) 0%, transparent 65%)' }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Top label row */}
        <div className="flex items-center justify-between mb-12 mt-6">
          <span className="hand text-cream-300 text-2xl">est. 2026</span>
          <span className="mono text-xs text-cream-500 hidden sm:block">
            Made fresh on Chia
          </span>
        </div>

        {/* Headline — asymmetric, big and weird */}
        <div className="relative mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="display text-[clamp(3rem,12vw,8.5rem)] text-cream-50">
              Choco<span className="display-italic text-gold">Taco</span>.
            </h1>
          </motion.div>

          {/* Floating sticker — "FRESH" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="absolute -top-4 right-4 md:right-12 hidden sm:block"
          >
            <span className="sticker sticker-mint text-base px-4 py-2">
              ★ Fresh weekly
            </span>
          </motion.div>

          {/* Hand-drawn callout pointing at "Taco" */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute right-2 md:right-32 top-1/2 mt-2 hidden md:flex items-center gap-2"
          >
            <span className="hand text-cream-300 text-2xl rotate-n4">↗ yes, you can eat it</span>
          </motion.div>
        </div>

        {/* Asymmetric two-column under headline */}
        <div className="grid md:grid-cols-12 gap-8 items-end mb-12">
          {/* Tagline — left, intentionally not centered */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="md:col-span-7"
          >
            <p className="text-2xl md:text-3xl text-cream-100 font-serif font-light leading-tight max-w-xl">
              The sweetest memecoin on Chia.
              {' '}
              <span className="display-italic text-cream-300">500 OG badges, weekly <span className="mono">$🍫🌮</span> paydays.</span>
            </p>
            <p className="hand text-gold text-3xl mt-4 ml-1 rotate-n2 inline-block">
              ↳ all mint proceeds → LP. all of it.
            </p>
          </motion.div>

          {/* CTA stack — right */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="md:col-span-5 flex flex-col gap-3 items-start md:items-end"
          >
            <div className="flex flex-wrap gap-3">
              {connected ? (
                <a href="#earn" className="btn-cream">→ Open the shop</a>
              ) : (
                <button onClick={handleConnect} disabled={loading} className="btn-cream">
                  {loading ? 'one sec…' : '→ Connect wallet'}
                </button>
              )}
              <a href="https://dexie.space/offers/%F0%9F%8D%AB%F0%9F%8C%AE/XCH" target="_blank" rel="noopener noreferrer" className="btn-outline">
                Get $🍫🌮
              </a>
            </div>

            {/* Asset ID — looks like a receipt code */}
            <button onClick={copyAssetId} className="group flex items-center gap-2 text-cream-500 hover:text-cream-200 transition-colors mt-2">
              <span className="mono text-xs">
                #{CHOCO_TACO_ASSET_ID.slice(0, 6)}…{CHOCO_TACO_ASSET_ID.slice(-6)}
              </span>
              {copied ? <Check size={12} className="text-mint" /> : <Copy size={12} className="opacity-50 group-hover:opacity-100" />}
            </button>
          </motion.div>
        </div>

        {/* Bottom row — live indicator + something cheeky */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-cream-500/10"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            <span className="mono text-xs text-cream-500 uppercase tracking-widest">
              Currently melting on Chia
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hand text-cream-400 text-xl">scroll down →</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
