import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'

interface Props {
  uri:    string | null
  onClose: () => void
}

export default function QrModal({ uri, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    if (!uri) return
    QRCode.toDataURL(uri, {
      margin: 1,
      width:  320,
      color: { dark: '#1a0d05', light: '#fef9ef' },
    }).then(setDataUrl).catch(console.error)
  }, [uri])

  function copy() {
    if (!uri) return
    navigator.clipboard.writeText(uri)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <AnimatePresence>
      {uri && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-cocoa-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="bg-cream-50 text-cocoa-900 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-cocoa-900/10 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-4">
              <p className="hand text-gold text-2xl rotate-n2 inline-block">— knock knock —</p>
              <p className="display text-3xl text-cocoa-900 mt-1">Scan with your wallet</p>
              <p className="font-serif italic text-cocoa-700 text-sm mt-1">
                Sage · Chia Reference Wallet
              </p>
            </div>

            {/* QR */}
            <div className="bg-cream-50 rounded-xl p-3 flex items-center justify-center">
              {dataUrl ? (
                <img src={dataUrl} alt="WalletConnect QR" className="w-full max-w-[280px]" />
              ) : (
                <div className="aspect-square w-full max-w-[280px] bg-cocoa-100/40 animate-pulse rounded-lg" />
              )}
            </div>

            {/* Copy URI fallback */}
            <button
              onClick={copy}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-cocoa-900/20 text-sm hover:border-cocoa-900/40 transition-colors"
            >
              {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Or copy pairing URI'}
            </button>

            <p className="hand text-cocoa-700 text-lg text-center mt-3">
              waiting for you to approve…
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
