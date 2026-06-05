import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

export default function WalletBadge() {
  const { connected, address, disconnect, verifying } = useWallet()
  const [copied, setCopied] = useState(false)

  if (!connected || !address) {
    return null
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`

  function copyAddr() {
    navigator.clipboard.writeText(address!)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="wallet-badge flex items-center gap-2 sm:gap-2.5">
      <span className="wallet-badge-pulse" aria-hidden />
      <div className="flex flex-col items-start leading-none min-w-0">
        <span className="mono text-2xs text-mint uppercase tracking-widest font-semibold">
          connected
        </span>
        <button
          type="button"
          onClick={copyAddr}
          className="mono text-xs text-cream-200 hover:text-gold transition-colors flex items-center gap-1 mt-0.5 max-w-[9rem] sm:max-w-none truncate"
          title={address}
        >
          {short}
          {copied
            ? <Check size={11} className="text-mint shrink-0" />
            : <Copy size={11} className="opacity-40 shrink-0" />}
        </button>
      </div>
      {verifying && (
        <span className="w-3 h-3 rounded-full border-2 border-gold border-t-transparent animate-spin shrink-0" />
      )}
      <button
        type="button"
        onClick={disconnect}
        className="wallet-badge-exit mono text-2xs uppercase tracking-wider"
        title="Disconnect wallet"
      >
        out
      </button>
    </div>
  )
}
