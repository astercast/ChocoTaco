import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const NAV = [
  { label: 'mint',          to: '/#mint' },
  { label: 'claim',         to: '/claim' },
  { label: 'distribution',  to: '/distribution' },
  { label: 'faq',           to: '/faq' },
]

export default function Navbar() {
  const { connected, address, connect, disconnect, pairingUri, verifying } = useWallet()
  const [open, setOpen] = useState(false)
  const connecting = Boolean(pairingUri) || verifying
  const location = useLocation()

  async function handleConnect() {
    try { await connect() } catch { /* surfaced in context */ }
  }

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-cocoa-900/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto page-x h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-baseline gap-1.5 sm:gap-2 group shrink-0">
          <span className="modern text-lg sm:text-xl text-cream-50 tracking-tight whitespace-nowrap">ChocoTaco</span>
          <span className="hand text-gold text-sm sm:text-base -ml-0.5 rotate-n4 inline-block whitespace-nowrap">
            by BearMarket
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV.map(l => {
            const isActive = !l.to.startsWith('/#') && location.pathname === l.to
            return l.to.startsWith('/#') ? (
              <a key={l.to} href={l.to} className="modern text-sm text-cream-300 hover:text-gold transition-colors">
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className={`modern text-sm transition-colors ${isActive ? 'text-gold' : 'text-cream-300 hover:text-gold'}`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {connected ? (
            <div className="flex items-center gap-2">
              <span className="mono text-xs text-cream-500 hidden sm:block">{shortAddr}</span>
              <button onClick={disconnect}
                className="text-xs py-1.5 px-3 rounded-full border border-cream-500/30 text-cream-400 hover:border-chili hover:text-chili transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} disabled={connecting} className="btn-cream py-2 px-3 sm:px-4 text-sm shrink-0">
              {connecting ? '…' : 'Connect'}
            </button>
          )}

          <button onClick={() => setOpen(o => !o)}
            className="md:hidden text-cream-300 p-1">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden overflow-hidden bg-cocoa-900 border-t border-cream-500/10"
          >
            <div className="page-x py-4 flex flex-col gap-3">
              {NAV.map(l =>
                l.to.startsWith('/#') ? (
                  <a key={l.to} href={l.to} onClick={() => setOpen(false)}
                    className="modern text-lg text-cream-300 hover:text-gold">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                    className="modern text-lg text-cream-300 hover:text-gold">
                    {l.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
