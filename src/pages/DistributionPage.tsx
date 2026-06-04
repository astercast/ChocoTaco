/**
 * /distribution
 *
 * Public transparency page showing the full 3-year 1011 $🍫🌮 distribution.
 *   - Headline numbers: total / distributed / remaining
 *   - Step chart: weekly emission across all 156 weeks (year 1/2/3 halvings)
 *   - Current week marker
 *   - Yearly breakdown
 *   - Live stats pulled from Worker /api/network-stats
 *
 * In dev mode (no Worker URL set) we fall back to mock values that line up
 * with the launch-week ISO so the page is fully explorable.
 */
import { useEffect, useMemo, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { PAYDAY, weeklyEmission, weekIndexFromIso } from '../constants'

interface NetworkStats {
  mintedCount?:     number
  supply?:          number
  vaultRemaining?:  number
  totalHolders?:    number
  totalPoints?:     number
  weeklyEmission?:  number
}

const WORKER_URL = (import.meta.env.VITE_WORKER_URL ?? '') as string

// ─── Current week index (rough, based on calendar) ──────────────────────────
function currentWeekIso(): string {
  const d   = new Date()
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

// ─── Step chart over 156 weeks ───────────────────────────────────────────────

function EmissionChart({ currentWeek }: { currentWeek: number }) {
  const W = 1000
  const H = 220
  const padX = 40
  const padY = 30
  const max = PAYDAY.year1WeeklyCAT * 1.1
  const xStep = (W - padX * 2) / 156
  const y = (v: number) => H - padY - (v / max) * (H - padY * 2)

  // Build the step polyline
  const pts: [number, number][] = []
  for (let w = 0; w < 156; w++) {
    const x = padX + w * xStep
    pts.push([x, y(weeklyEmission(w))])
    pts.push([x + xStep, y(weeklyEmission(w))])
  }

  // Areas per year for shading
  const areaPath = (startW: number, endW: number, em: number) => {
    const x0 = padX + startW * xStep
    const x1 = padX + endW * xStep
    return `M ${x0} ${H - padY} L ${x0} ${y(em)} L ${x1} ${y(em)} L ${x1} ${H - padY} Z`
  }

  const currentX = padX + Math.min(156, Math.max(0, currentWeek)) * xStep

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Year shading */}
      <path d={areaPath(0,   52,  PAYDAY.year1WeeklyCAT)} fill="#e89c3b" opacity="0.30" />
      <path d={areaPath(52,  104, PAYDAY.year2WeeklyCAT)} fill="#e89c3b" opacity="0.20" />
      <path d={areaPath(104, 156, PAYDAY.year3WeeklyCAT)} fill="#e89c3b" opacity="0.12" />

      {/* Step outline */}
      <polyline
        points={pts.map(([x, yy]) => `${x},${yy}`).join(' ')}
        fill="none"
        stroke="#e89c3b"
        strokeWidth="2"
      />

      {/* Year dividers */}
      {[52, 104].map(w => (
        <line key={w} x1={padX + w * xStep} y1={padY - 10} x2={padX + w * xStep} y2={H - padY}
              stroke="#fef4e2" strokeOpacity="0.15" strokeDasharray="3 3" />
      ))}

      {/* Year labels */}
      <g fontFamily="Geist, sans-serif" fontSize="11" fontWeight="600" fill="#888" textAnchor="middle">
        <text x={padX + 26 * xStep} y={H - 8}>YEAR 1 · 11.11/wk</text>
        <text x={padX + 78 * xStep} y={H - 8}>YEAR 2 · 5.55/wk</text>
        <text x={padX + 130 * xStep} y={H - 8}>YEAR 3 · 2.78/wk</text>
      </g>

      {/* Current-week marker */}
      {currentWeek >= 0 && currentWeek <= 156 && (
        <g>
          <line x1={currentX} y1={padY - 10} x2={currentX} y2={H - padY}
                stroke="#7fb069" strokeWidth="2" />
          <circle cx={currentX} cy={y(weeklyEmission(currentWeek))} r="5" fill="#7fb069" />
          <text x={currentX + 8} y={padY + 2} fontFamily="Geist, sans-serif" fontSize="11"
                fontWeight="700" fill="#7fb069">we are here · wk {currentWeek + 1}</text>
        </g>
      )}

      {/* Y-axis label */}
      <text x={padX} y={padY - 12} fontFamily="Geist Mono, monospace" fontSize="10" fill="#888">
        $🍫🌮 / week
      </text>
    </svg>
  )
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="wrapper p-6 flex flex-col gap-1">
      <span className="modern-display text-4xl md:text-5xl text-cream-50 tabular-nums leading-none">
        {value}
      </span>
      <span className="mono text-2xs text-cream-500 uppercase tracking-widest mt-2">{label}</span>
      {sub && <span className="mono text-xs text-cream-400 mt-0.5">{sub}</span>}
    </div>
  )
}

// ─── Yearly breakdown row ────────────────────────────────────────────────────

function YearRow({ year, weekly, total, pct, current, status }: {
  year: number; weekly: number; total: number; pct: string; current: boolean; status: string
}) {
  return (
    <div className={`flex items-center justify-between py-4 border-b border-cream-500/10 last:border-0 ${current ? 'opacity-100' : 'opacity-70'}`}>
      <div className="flex items-baseline gap-4">
        <span className={`modern-display text-3xl tabular-nums ${current ? 'text-gold' : 'text-cream-50'}`}>
          Y{year}
        </span>
        <div>
          <p className="modern text-sm text-cream-100">{weekly.toFixed(2)} <span className="mono text-cream-500 text-xs">/ week</span></p>
          <p className="mono text-2xs text-cream-500">{status}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="modern-display text-xl text-cream-50 tabular-nums">{total.toFixed(2)}</p>
        <p className="mono text-2xs text-cream-500">{pct} of vault</p>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DistributionPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const [stats, setStats] = useState<NetworkStats | null>(null)
  useEffect(() => {
    if (!WORKER_URL) return
    fetch(`${WORKER_URL}/api/network-stats`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  // Pre-launch: gate everything that depends on distribution being active
  const launched = PAYDAY.distributionLaunched
  const currentWeek = useMemo(
    () => launched ? weekIndexFromIso(currentWeekIso()) : -1,
    [launched]
  )
  const currentEmission = launched ? weeklyEmission(currentWeek) : 0

  // Compute distributed = vault total - remaining (always 0 pre-launch)
  const vaultRemaining = launched ? (stats?.vaultRemaining ?? PAYDAY.vaultTotalCAT) : PAYDAY.vaultTotalCAT
  const distributed    = Math.max(0, PAYDAY.vaultTotalCAT - vaultRemaining)
  const distPct        = Math.round((distributed / PAYDAY.vaultTotalCAT) * 100)

  // Year: 0 = pre-launch, 1/2/3 = active, 4 = ended
  const currentYear = !launched ? 0
    : currentWeek < 0   ? 0
    : currentWeek < 52  ? 1
    : currentWeek < 104 ? 2
    : currentWeek < 156 ? 3
    : 4

  return (
    <main ref={ref} className="pt-24 pb-24 px-6 grain min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="modern-display text-6xl md:text-8xl text-cream-50 uppercase leading-[0.9]">
            The whole
            <br />
            <span className="text-gold">distribution.</span>
          </h1>
          <p className="modern-light text-lg text-cream-300 mt-4 max-w-2xl">
            1011 $🍫🌮 paid out across 156 weeks (3 years). Halvings every 52 weeks
            so early holders earn the most. Every token is publicly accounted for.
          </p>
          {!launched && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="modern text-sm text-gold uppercase tracking-widest">
                distribution starts after mint closes
              </span>
            </div>
          )}
        </motion.div>

        {/* Headline stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatTile
            value={PAYDAY.vaultTotalCAT.toString()}
            label="total vault"
            sub="$🍫🌮 over 3 years"
          />
          <StatTile
            value={distributed.toFixed(2)}
            label="distributed so far"
            sub={launched ? `${distPct}% of vault` : 'not started yet'}
          />
          <StatTile
            value={vaultRemaining.toFixed(2)}
            label="remaining in vault"
            sub={!launched ? 'launches after the mint closes'
              : currentYear > 3 ? 'distribution ended'
              : `currently ${currentEmission.toFixed(2)} / week`}
          />
        </div>

        {/* Step chart */}
        <div className="wrapper p-6 mb-10">
          <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-4">
            emission schedule · 156 weeks
          </p>
          <EmissionChart currentWeek={currentWeek} />
        </div>

        {/* Year breakdown */}
        <div className="wrapper p-6 mb-10">
          <p className="mono text-2xs text-cream-500 uppercase tracking-widest mb-4">
            yearly breakdown
          </p>
          <YearRow year={1} weekly={PAYDAY.year1WeeklyCAT} total={PAYDAY.year1TotalCAT} pct="57.1%"
                   current={launched && currentYear === 1}
                   status={!launched ? 'starts at launch' : currentYear === 1 ? 'active now' : currentYear > 1 ? 'completed' : 'upcoming'} />
          <YearRow year={2} weekly={PAYDAY.year2WeeklyCAT} total={PAYDAY.year2TotalCAT} pct="28.6%"
                   current={launched && currentYear === 2}
                   status={!launched ? 'starts 52 weeks after launch' : currentYear === 2 ? 'active now' : currentYear > 2 ? 'completed' : 'upcoming'} />
          <YearRow year={3} weekly={PAYDAY.year3WeeklyCAT} total={PAYDAY.year3TotalCAT} pct="14.3%"
                   current={launched && currentYear === 3}
                   status={!launched ? 'starts 104 weeks after launch' : currentYear === 3 ? 'active now' : currentYear > 3 ? 'completed' : 'upcoming'} />
        </div>

        {/* Live network stats (only after launch) */}
        {launched && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile value={String(stats.totalHolders ?? 0)} label="active holders" />
            <StatTile value={String(Math.floor(stats.totalPoints ?? 0))} label="network cocoa units" />
            <StatTile value={String(stats.mintedCount ?? 0) + ' / ' + (stats.supply ?? 500)} label="OG NFTs minted" />
            <StatTile
              value={currentEmission.toFixed(2)}
              label="this week's emission"
              sub="paid to holders proportionally"
            />
          </div>
        )}

        {/* The fairness explainer */}
        <div className="mt-12 wrapper p-8">
          <p className="hand text-gold text-2xl mb-2 rotate-n2 inline-block">how shares work</p>
          <h3 className="modern-display text-3xl text-cream-50 mb-4">your slice = your cocoa / total network cocoa</h3>
          <div className="space-y-3 modern-light text-cream-300">
            <p>Every Wednesday at 17:00 UTC the Factory snapshots every wallet's
              Cocoa Units (OG NFTs, Limited Editions, LP balance).</p>
            <p>That week's emission is divided by the network total. Your wallet
              gets paid <span className="text-cream-50 font-medium">(your points / total points) × weekly emission</span>.</p>
            <p>You then have 3 days to come claim 100%, after which your portion
              shrinks 10% per day. Anything still unclaimed after the next snapshot
              keeps stacking but keeps decaying.</p>
            <p>After week 156 the vault is empty and the truck stops coming.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
