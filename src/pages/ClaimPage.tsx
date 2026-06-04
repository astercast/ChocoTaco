/**
 * Dedicated /claim page
 *
 *   - Large taco-truck animation slot (placeholder until art arrives)
 *   - Live countdown to next Wednesday 17:00 UTC snapshot
 *   - Big claimable balance + claim CTA
 *   - Per-week breakdown showing decay
 *   - Full claim history
 *   - Auto-refreshes from Worker every 60s
 */
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { fetchHistory, type HistoryEntry } from '../api/claims'
import { PAYDAY } from '../constants'
import Toast, { type ToastVariant } from '../components/Toast'
import ChocolateDrip from '../components/ChocolateDrip'

// ─── Countdown helper ────────────────────────────────────────────────────────

function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return useMemo(() => {
    if (!targetIso) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true }
    const target = new Date(targetIso).getTime()
    const diff = Math.max(0, target - now)
    const secs  = Math.floor(diff / 1000) % 60
    const mins  = Math.floor(diff / (1000 * 60)) % 60
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
    const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
    return { days, hours, mins, secs, expired: diff === 0 }
  }, [targetIso, now])
}

// ─── Taco Truck art slot (placeholder until art lands) ──────────────────────

function TacoTruckSlot() {
  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-cocoa-800 rounded-2xl border border-cream-500/10 overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 70% at 50% 65%, rgba(232,156,59,0.12) 0%, transparent 60%)',
        }}
      />
      <p className="modern-display text-4xl sm:text-6xl text-cream-300 uppercase tracking-tight">
        claim soon
      </p>
    </div>
  )
}

// ─── Countdown card ──────────────────────────────────────────────────────────

function CountdownCard({ targetIso }: { targetIso: string | null }) {
  const { days, hours, mins, secs, expired } = useCountdown(targetIso)
  const segments = [
    { v: days,  l: 'days' },
    { v: hours, l: 'hrs' },
    { v: mins,  l: 'min' },
    { v: secs,  l: 'sec' },
  ]
  return (
    <div className="wrapper p-6">
      <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-3">
        next snapshot · wed {PAYDAY.snapshotHourUTC}:00 utc
      </p>
      {expired ? (
        <p className="modern-display text-3xl text-gold">Snapshot soon...</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {segments.map(s => (
            <div key={s.l} className="flex flex-col items-center">
              <span className="modern-display text-4xl md:text-5xl text-cream-50 tabular-nums">
                {String(s.v).padStart(2, '0')}
              </span>
              <span className="mono text-2xs text-cream-500 uppercase tracking-widest mt-1">
                {s.l}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Breakdown row ───────────────────────────────────────────────────────────

function BreakdownRow({ entry }: { entry: { week: string; raw: number; effective: number; multiplier: number } }) {
  const pct = Math.round(entry.multiplier * 100)
  return (
    <div className="flex items-center justify-between py-3 border-b border-cream-500/10 last:border-0">
      <div className="flex items-baseline gap-3">
        <span className="mono text-xs text-cream-500">{entry.week}</span>
        {pct < 100 && (
          <span className="mono text-2xs text-chili">decayed to {pct}%</span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        {pct < 100 && (
          <span className="mono text-xs text-cream-600 line-through">
            {entry.raw.toFixed(3)}
          </span>
        )}
        <span className="modern text-base text-cream-50 tabular-nums">
          {entry.effective.toFixed(3)} <span className="text-cream-500 mono text-xs">$🍫🌮</span>
        </span>
      </div>
    </div>
  )
}

// ─── History row ─────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const date = entry.claimed
    ? new Date(entry.claimed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'unclaimed'
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-cream-500/5 last:border-0">
      <div className="flex items-baseline gap-3">
        <span className="mono text-xs text-cream-500">{entry.week}</span>
        <span className="mono text-2xs text-cream-600">{date}</span>
      </div>
      <span className={`modern text-sm tabular-nums ${entry.claimed ? 'text-cream-300' : 'text-gold'}`}>
        {entry.amount.toFixed(3)} <span className="text-cream-500 mono text-xs">$🍫🌮</span>
      </span>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ClaimPage() {
  const {
    connected, connect, verifying, error,
    address, claimableCAT, snapshot, nextSnapshotIso,
    cocoaPoints, lpMultiplier, tier,
    claimRewards, refreshSnapshot,
  } = useWallet()

  const [claiming, setClaiming] = useState(false)
  const [toast, setToast]       = useState<{ msg: string; variant: ToastVariant } | null>(null)
  const [history, setHistory]   = useState<HistoryEntry[]>([])

  // Load history when address is known
  useEffect(() => {
    if (!address) { setHistory([]); return }
    fetchHistory(address).then(setHistory)
  }, [address])

  async function handleClaim() {
    setClaiming(true)
    setToast({ msg: 'Building your claim offer...', variant: 'loading' })
    const result = await claimRewards()
    setClaiming(false)
    if (result.success) {
      setToast({
        msg: `Claimed ${result.amount?.toFixed(2) ?? ''} $🍫🌮. The truck is rolling.`,
        variant: 'success',
      })
      refreshSnapshot()
      if (address) fetchHistory(address).then(setHistory)
    } else {
      setToast({ msg: result.error ?? 'Claim failed', variant: 'error' })
    }
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <main className="pt-24 pb-24 px-6 grain min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="modern-display text-6xl md:text-8xl text-cream-50 uppercase leading-[0.9]">
              Pick up
              <br />
              <span className="text-gold">your chocolate.</span>
            </h1>
            <p className="hand text-gold text-2xl mt-4 rotate-n2 inline-block">
              the taco truck comes every wednesday
            </p>
          </div>
          <p className="modern-light text-base text-cream-400 max-w-sm">
            Pulls up at 17:00 UTC sharp. You have 3 days for the full payout,
            then it shrinks 10% per day. Unclaimed weeks stack in your
            balance but each one keeps decaying on its own clock.
          </p>
        </div>

        {/* Taco truck animation slot - drop your art here */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <TacoTruckSlot />
        </motion.div>

        <ChocolateDrip className="mb-8" opacity={0.7} />

        {/* Not connected */}
        {!connected ? (
          <div className="wrapper wrapper-drip p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-8">
            <div className="max-w-md">
              <p className="modern text-2xl text-cream-100 leading-tight">
                Connect to see your claim.
              </p>
              <p className="text-cream-400 mt-2 modern-light">
                We read your wallet on-chain. Nothing moves without your signature.
              </p>
              {error && <p className="text-chili text-sm mt-3">{error}</p>}
            </div>
            <button onClick={connect} disabled={verifying} className="btn-cream">
              {verifying ? 'checking...' : '→ Connect wallet'}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-8">

            {/* LEFT: claimable + claim CTA + countdown */}
            <div className="md:col-span-7 flex flex-col gap-6">
              {/* Big claimable */}
              <div className="wrapper wrapper-drip p-8">
                <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-3">
                  ready to claim
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="modern-display text-6xl md:text-8xl text-gold tabular-nums leading-none">
                    {claimableCAT.toFixed(2)}
                  </span>
                  <span className="mono text-cream-300 text-xl">$🍫🌮</span>
                </div>
                {claimableCAT > 0 ? (
                  <p className="hand text-cream-400 text-xl mt-3 rotate-n2 inline-block">
                    ↑ stacked from your unclaimed weeks
                  </p>
                ) : (
                  <p className="modern-light text-cream-400 mt-3">
                    Nothing to claim right now. Check back after the next snapshot.
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3 items-center">
                  <button
                    onClick={handleClaim}
                    disabled={claiming || claimableCAT <= 0}
                    className="btn-gold disabled:opacity-40"
                  >
                    {claiming ? 'pouring chocolate...' : 'Claim now →'}
                  </button>
                  <button onClick={refreshSnapshot} className="btn-outline text-sm">
                    Refresh
                  </button>
                </div>
              </div>

              {/* Breakdown by week */}
              {snapshot?.breakdown && snapshot.breakdown.length > 0 && (
                <div className="wrapper p-6">
                  <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-3">
                    breakdown
                  </p>
                  <div>
                    {snapshot.breakdown.map(b => (
                      <BreakdownRow key={b.week} entry={b} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: countdown + wallet snapshot + history */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <CountdownCard targetIso={nextSnapshotIso} />

              {/* Wallet snapshot */}
              <div className="wrapper p-6">
                <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-3">
                  your factory floor
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="modern-light text-cream-400">Tier</span>
                    <span className="modern text-cream-50 capitalize">{tier}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="modern-light text-cream-400">Cocoa Units</span>
                    <span className="modern text-cream-50 tabular-nums">{Math.floor(cocoaPoints)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="modern-light text-cream-400">LP multiplier</span>
                    <span className="modern text-gold tabular-nums">
                      {lpMultiplier > 1 ? `${lpMultiplier.toFixed(2)}×` : 'inactive'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="modern-light text-cream-400">Address</span>
                    <span className="mono text-xs text-cream-500">
                      {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="wrapper p-6">
                <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-3">
                  past claims
                </p>
                {history.length === 0 ? (
                  <p className="modern-light text-sm text-cream-500">
                    No claims yet. Your first one will show up here.
                  </p>
                ) : (
                  <div>
                    {history.map(h => <HistoryRow key={h.week} entry={h} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast message={toast?.msg ?? null} variant={toast?.variant ?? 'loading'} onDismiss={() => setToast(null)} />
    </main>
  )
}
