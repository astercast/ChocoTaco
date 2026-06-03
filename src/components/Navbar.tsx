import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

const NAV = [
  { label: 'shop',       href: '#earn' },
  { label: 'menu',       href: '#mint' },
  { label: 'lab',        href: '#generator' },
  { label: 'wall',       href: '#gallery' },
]

export default function Navbar() {
  const { connected, address, connect, disconnect } = useWallet()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true); try { await connect() } finally { setLoading(false) }
  }

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-cocoa-900/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <a href="#" className="flex items-baseline gap-2 group">
          <span className="display text-2xl text-cream-50">ChocoTaco</span>
          <span className="hand text-gold text-xl -ml-1 rotate-n4 inline-block">co.</span>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {NAV.map(l => (
            <a key={l.href} href={l.href}
              className="font-serif italic text-base text-cream-300 hover:text-gold transition-colors">
              {l.label}
            </a>
          ))}
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
            <button onClick={handleConnect} disabled={loading} className="btn-cream py-2 px-4 text-sm">
              {loading ? '…' : 'Connect'}
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
            <div className="px-6 py-4 flex flex-col gap-3">
              {NAV.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="font-serif italic text-lg text-cream-300 hover:text-gold">
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
