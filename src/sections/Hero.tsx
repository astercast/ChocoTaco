import { motion } from 'framer-motion'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import Mascot from '../components/Mascot'
import { CHOCO_TACO_ASSET_ID } from '../constants'

export default function Hero() {
  const { connect, connected, pairingUri, verifying } = useWallet()
  const connecting = Boolean(pairingUri) || verifying
  const [copied, setCopied] = useState(false)

  async function handleConnect() {
    try { await connect() } catch { /* surfaced in context */ }
  }
  function copyAssetId() {
    navigator.clipboard.writeText(CHOCO_TACO_ASSET_ID)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="relative min-h-0 sm:min-h-[min(88vh,900px)] pt-20 pb-10 sm:pb-12 page-x overflow-hidden grain factory-floor">
      {/* Off-center warm glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 30% 35%, rgba(232,156,59,0.12) 0%, transparent 65%)' }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Headline */}
        <div className="relative mb-8 sm:mb-12 mt-4 sm:mt-6">
          <div className="flex flex-col gap-4 sm:block md:pr-44 lg:pr-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="heading-page text-cream-50 uppercase">
                The
                <br />
                <span className="text-gold">Factory</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="self-start sm:absolute sm:top-4 sm:right-8 md:right-12 z-10"
            >
              <span className="sticker sticker-mint text-xs sm:text-base px-2.5 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap">
                ★ Fresh weekly
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 160 }}
              className="hidden md:block absolute right-6 top-[38%] z-0 pointer-events-none"
            >
              <Mascot size={160} className="hidden md:block lg:hidden" />
              <Mascot size={200} className="hidden lg:block" />
            </motion.div>
          </div>
        </div>

        {/* Asymmetric two-column under headline */}
        <div className="grid md:grid-cols-12 gap-6 sm:gap-8 items-end mb-8 sm:mb-12">
          {/* Tagline - left, intentionally not centered */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="md:col-span-7"
          >
            <p className="modern-light text-lg sm:text-xl md:text-2xl text-cream-100 leading-snug max-w-xl text-pretty">
              The sweetest memecoin on Chia.
              {' '}
              <span className="text-cream-300">
                500 factory tacos, weekly <span className="mono">$🍫🌮</span> paydays from the distribution vault.
              </span>
            </p>
            <p className="hand text-gold text-xl sm:text-2xl md:text-3xl mt-3 sm:mt-4 ml-1 rotate-n2 keep-together">
              ↳ all mint proceeds → LP. all of it.
            </p>
          </motion.div>

          {/* CTA stack - right */}
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
                <button onClick={handleConnect} disabled={connecting} className="btn-cream">
                  {connecting ? 'Connecting…' : '→ Connect wallet'}
                </button>
              )}
              <a href="https://dexie.space/offers/%F0%9F%8D%AB%F0%9F%8C%AE/XCH" target="_blank" rel="noopener noreferrer" className="btn-outline">
                Get $🍫🌮
              </a>
            </div>

            {/* Asset ID - looks like a receipt code */}
            <button onClick={copyAssetId} className="group flex items-center gap-2 text-cream-500 hover:text-cream-200 transition-colors mt-2">
              <span className="mono text-xs">
                #{CHOCO_TACO_ASSET_ID.slice(0, 6)}…{CHOCO_TACO_ASSET_ID.slice(-6)}
              </span>
              {copied ? <Check size={12} className="text-mint" /> : <Copy size={12} className="opacity-50 group-hover:opacity-100" />}
            </button>
          </motion.div>
        </div>

        {/* Bottom row - live indicator + something cheeky */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-cream-500/10"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            <span className="mono text-2xs sm:text-xs text-cream-500 uppercase tracking-widest">
              Currently melting on Chia
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hand text-cream-400 text-lg sm:text-xl keep-together">scroll down →</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
