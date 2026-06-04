import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'

interface Props {
  uri:    string | null
  busy?:  boolean
  onClose: () => void
}

export default function QrModal({ uri, busy = false, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)
  const open = Boolean(uri) || busy

  useEffect(() => {
    if (!uri) {
      setDataUrl(null)
      return
    }
    let cancelled = false
    QRCode.toDataURL(uri, {
      margin: 1,
      width:  280,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a0d05', light: '#fef9ef' },
    })
      .then(url => { if (!cancelled) setDataUrl(url) })
      .catch(console.error)
    return () => { cancelled = true }
  }, [uri])

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  function copy() {
    if (!uri) return
    navigator.clipboard.writeText(uri)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-cocoa-950/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-cream-50 text-cocoa-900 rounded-2xl p-5 sm:p-6 max-w-[340px] w-full relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full hover:bg-cocoa-900/8 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-cocoa-700" />
            </button>

            <div className="text-center mb-4 pr-6">
              <p className="modern text-xl text-cocoa-900 tracking-tight">Connect wallet</p>
              <p className="modern-light text-sm text-cocoa-700 mt-1.5">
                Scan in Sage, or copy the link below
              </p>
            </div>

            <div className="rounded-xl p-3 bg-cream-100/50 border border-cocoa-900/8 flex items-center justify-center min-h-[280px]">
              {busy && !uri ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                </div>
              ) : dataUrl ? (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  src={dataUrl}
                  alt="WalletConnect QR"
                  className="w-full max-w-[260px] rounded-md"
                />
              ) : (
                <div className="w-[260px] h-[260px] bg-cocoa-900/5 animate-pulse rounded-md" />
              )}
            </div>

            {uri && !busy && (
              <button
                onClick={copy}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cocoa-900/15 text-sm modern-light text-cocoa-800 hover:bg-cocoa-900/5 transition-colors"
              >
                {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
