import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { COCOA, PAYDAY } from '../constants'
import Toast, { type ToastVariant } from '../components/Toast'

function PointLine({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-cocoa-700/30 last:border-0">
      <div>
        <span className="font-serif text-cocoa-900">{label}</span>
        {sub && <span className="ml-2 hand text-cocoa-700 text-base">{sub}</span>}
      </div>
      <span className="display text-cocoa-900 text-lg">{value}</span>
    </div>
  )
}

function ConnectedView() {
  const {
    standardOgs, goldenOgs, limitedPoints, lpBalance, lpMultiplier,
    cocoaPoints, tier, weeklyEstimateCAT, claimableCAT,
    claimRewards,
  } = useWallet()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed]   = useState(false)
  const [toast, setToast]       = useState<{ msg: string; variant: ToastVariant } | null>(null)

  async function handleClaim() {
    setClaiming(true)
    setToast({ msg: 'Building your claim offer...', variant: 'loading' })
    const result = await claimRewards()
    setClaiming(false)
    if (result.success) {
      setClaimed(true)
      setToast({ msg: `Claimed ${result.amount?.toFixed(2) ?? ''} $🍫🌮. Sweet.`, variant: 'success' })
      setTimeout(() => setClaimed(false), 4000)
    } else {
      setToast({ msg: result.error ?? 'Claim failed', variant: 'error' })
    }
    setTimeout(() => setToast(null), 4500)
  }

  const ogPoints = standardOgs * COCOA.perOg + goldenOgs * COCOA.perGolden
  const lpBonus  = ogPoints * (lpMultiplier - 1)

  return (
    <div className="grid md:grid-cols-12 gap-8">
      {/* Receipt */}
      <div className="md:col-span-5">
        <div className="bg-cream-50 text-cocoa-900 p-6 rounded-lg shadow-2xl rotate-n2">
          <div className="text-center pb-3 border-b border-dashed border-cocoa-700/30">
            <p className="display text-2xl">Factory Floor</p>
            <p className="mono text-xs opacity-60">Cocoa Units breakdown</p>
          </div>
          <div className="py-4 mono text-sm">
            <PointLine
              label="Standard OGs"
              value={`${standardOgs} × ${COCOA.perOg}`}
              sub={standardOgs === 0 ? '(none yet)' : ''}
            />
            <PointLine
              label="Golden Tickets"
              value={`${goldenOgs} × ${COCOA.perGolden}`}
              sub={goldenOgs > 0 ? '★★★' : ''}
            />
            <PointLine
              label="Limited Editions"
              value={`+${limitedPoints}`}
            />
            <PointLine
              label="LP multiplier"
              value={lpMultiplier > 1 ? `${lpMultiplier.toFixed(2)}× on OGs` : 'inactive'}
              sub={lpMultiplier > 1 ? `(+${Math.floor(lpBonus)})` : '(add LP)'}
            />
          </div>
          <div className="pt-3 border-t-2 border-double border-cocoa-700/40 flex justify-between items-baseline">
            <span className="font-serif text-cocoa-900">Total</span>
            <span className="display text-3xl text-chili">{Math.floor(cocoaPoints)}</span>
          </div>
          <p className="text-center hand text-cocoa-700 text-lg mt-3">Cocoa Units</p>
        </div>

        {/* Tiny LP breakdown */}
        <div className="mt-4 mono text-xs text-cream-500 text-center">
          you hold {lpBalance.toFixed(3)} LP · multiplier scales with LP, no cap
        </div>
      </div>

      {/* Claim */}
      <div className="md:col-span-7 flex flex-col justify-center gap-6">
        <div>
          <p className="mono text-xs text-cream-500 uppercase tracking-widest mb-2">
            you are a
          </p>
          <p className="display text-5xl md:text-6xl text-cream-50 capitalize">
            {tier}.
          </p>
        </div>

        <div className="border-t border-cream-500/10 pt-6">
          <div className="flex items-baseline gap-3">
            <p className="display text-6xl md:text-7xl text-gold leading-none">
              {claimableCAT.toFixed(2)}
            </p>
            <p className="font-serif text-2xl text-cream-300">
              <span className="mono">$🍫🌮</span>
            </p>
          </div>
          <p className="hand text-cream-400 text-xl mt-2 rotate-n2 inline-block">
            unclaimed from past paydays
          </p>
        </div>

        {claimed ? (
          <div className="flex items-center gap-3">
            <span className="sticker sticker-mint text-base">★ Claimed</span>
            <span className="hand text-cream-300 text-xl">see you next wednesday</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming || claimableCAT <= 0}
            className="btn-gold text-lg px-8 py-4 self-start disabled:opacity-40"
          >
            {claiming ? 'pouring chocolate...' : `Claim ${claimableCAT.toFixed(2)} $🍫🌮 →`}
          </button>
        )}

        {/* Payday explainer */}
        <div className="pt-4 border-t border-cream-500/10 mono text-xs text-cream-500 space-y-1">
          <p>next snapshot · wednesday {PAYDAY.snapshotHourUTC}:00 utc</p>
          <p>estimated weekly · ~{weeklyEstimateCAT} $🍫🌮</p>
          <p>full payout window · {PAYDAY.gracePeriodDays} days after snapshot</p>
          <p>after grace · {PAYDAY.postGraceDecayPct}% decay per day on that week's portion</p>
          <p>unclaimed weeks stack · they never disappear, just shrink</p>
        </div>
      </div>
      <Toast message={toast?.msg ?? null} variant={toast?.variant ?? 'loading'} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default function EarnDashboard() {
  const { connected, connect, verifying, error } = useWallet()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="earn" className="py-24 px-6 grain relative">
      <div ref={ref} className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span className="chip">01 · the factory floor</span>
            <span className="hand text-gold text-2xl rotate-n2 inline-block">payday every wednesday</span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-cream-50 max-w-3xl leading-none">
            Stack Cocoa, <span className="display-italic text-gold">claim chocolate.</span>
          </h2>
          <p className="font-serif text-xl text-cream-300 mt-4 max-w-2xl">
            Every OG NFT is 10 Cocoa Units. Golden Tickets are 30. Holding LP multiplies
            your OG total: more LP, bigger boost, no cap.
            <br />
            <span className="hand text-cream-400 text-lg">
              ↑ stack more LP to mint more chocolate every week.
            </span>
          </p>
        </motion.div>

        {verifying && (
          <div className="flex items-center gap-3 mb-6 text-cream-300">
            <div className="w-3 h-3 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            <p className="font-serif italic">checking your holdings...</p>
          </div>
        )}

        {error && !verifying && (
          <p className="mb-6 text-chili font-serif italic">{error}</p>
        )}

        {connected ? (
          <ConnectedView />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="wrapper wrapper-drip p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="max-w-md">
              <p className="font-serif text-2xl text-cream-100 leading-tight">
                <span className="display-italic">Pssst,</span> clock in to see your Cocoa stack.
              </p>
              <p className="text-cream-400 mt-2">
                We read your NFTs and LP on-chain. Nothing leaves your wallet.
              </p>
            </div>
            <button onClick={connect} className="btn-cream text-base">
              → Clock in
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
