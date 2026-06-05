import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'
import Mascot from './Mascot'

export type ConnectPhase = 'init' | 'qr' | 'syncing' | 'success' | 'error'

interface Props {
  phase:   ConnectPhase
  uri:     string | null
  address: string | null
  error:   string | null
  onClose: () => void
  canClose?: boolean
}

const PHASE_COPY: Record<ConnectPhase, { title: string; sub: string }> = {
  init: {
    title: 'Connect wallet',
    sub: 'Starting WalletConnect…',
  },
  qr: {
    title: 'Connect wallet',
    sub: 'Scan with Sage, or copy the link below',
  },
  syncing: {
    title: 'Approved',
    sub: 'Reading your wallet on-chain…',
  },
  success: {
    title: 'You\'re in',
    sub: 'Wallet connected. Welcome to the factory floor.',
  },
  error: {
    title: 'Connection failed',
    sub: 'Something went wrong. Close and try again.',
  },
}

export default function QrModal({ phase, uri, address, error, onClose, canClose = true }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)
  const copy = PHASE_COPY[phase]

  useEffect(() => {
    if (!uri || phase !== 'qr') {
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
      .catch(() => { if (!cancelled) setDataUrl(null) })
    return () => { cancelled = true }
  }, [uri, phase])

  useEffect(() => {
    setCopied(false)
  }, [phase, uri])

  function copyLink() {
    if (!uri) return
    navigator.clipboard.writeText(uri)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const shortAddr = address
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : null

  return (
    <AnimatePresence>
      <motion.div
        key="wc-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-cocoa-950/75 backdrop-blur-md"
        onClick={canClose ? onClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, y: 10, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="factory-ticket text-cocoa-900 max-w-[360px] w-full relative mx-auto"
          onClick={e => e.stopPropagation()}
        >
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-cocoa-900/8 flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <X size={16} className="text-cocoa-700" />
            </button>
          )}

          <div className="factory-ticket-header">
            <p className="modern text-xl text-cocoa-900 tracking-tight">{copy.title}</p>
            <p className="modern-light text-sm text-cocoa-700 mt-1">{copy.sub}</p>
          </div>

          <div className="factory-ticket-body">
            {phase === 'init' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                <p className="mono text-2xs text-cocoa-500 uppercase tracking-widest">
                  preparing pairing…
                </p>
              </div>
            )}

            {phase === 'qr' && (
              <>
                <div className="rounded-lg p-3 bg-cream-100/60 border border-cocoa-900/8 flex flex-col items-center justify-center min-h-[280px] gap-3">
                  {dataUrl ? (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      src={dataUrl}
                      alt="WalletConnect QR"
                      className="w-full max-w-[260px] rounded-md"
                    />
                  ) : (
                    <>
                      <div className="w-[260px] h-[260px] bg-cocoa-900/5 animate-pulse rounded-md" />
                      <p className="mono text-2xs text-cocoa-500 uppercase tracking-widest">
                        rendering qr…
                      </p>
                    </>
                  )}
                </div>
                {uri && (
                  <button
                    onClick={copyLink}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cocoa-900/15 text-sm modern-light text-cocoa-800 hover:bg-cocoa-900/5 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                )}
              </>
            )}

            {phase === 'syncing' && (
              <div className="flex flex-col items-center gap-5 py-10">
                <div className="relative">
                  <Mascot size={88} float={false} />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin bg-cream-50" />
                </div>
                <p className="hand text-cocoa-700 text-xl rotate-n2">reading your wallet…</p>
              </div>
            )}

            {phase === 'success' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="stamp text-mint border-mint/60 text-sm px-5 py-2">
                  ✓ connected
                </div>
                <Mascot size={96} float={false} />
                {shortAddr && (
                  <p className="mono text-xs text-cocoa-600 bg-cocoa-900/5 px-3 py-2 rounded-full">
                    {shortAddr}
                  </p>
                )}
                <p className="hand text-gold text-xl">see you on the factory floor</p>
              </div>
            )}

            {phase === 'error' && (
              <div className="flex flex-col items-center gap-4 py-8 px-2">
                <p className="modern-light text-sm text-chili text-center leading-relaxed">
                  {error ?? 'Connection failed'}
                </p>
                <button onClick={onClose} className="btn-outline text-sm mt-2">
                  Close
                </button>
              </div>
            )}
          </div>

          <div className="factory-ticket-footer mono text-2xs text-cocoa-500 uppercase tracking-widest text-center">
            walletconnect · sage / chia wallet
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
