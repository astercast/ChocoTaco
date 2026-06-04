/**
 * GET /api/snapshot/:address
 *   Returns total unclaimed CHOCO + this week's estimate
 *
 * GET /api/network-stats
 *   Returns: minted count, vault remaining, holder count, total points
 */
import type { Env } from '../index'
import { currentWeekIso, weeklyEmission } from '../snapshot'

const GRACE_DAYS = 3
const POST_GRACE_DECAY = 0.10

function isoWeekToWednesdayMs(weekIso: string): number {
  const [yearStr, weekStr] = weekIso.split('-W')
  const year = Number(yearStr); const week = Number(weekStr)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1)
  const wed = new Date(mondayWeek1)
  wed.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7 + 2)
  wed.setUTCHours(17, 0, 0, 0)
  return wed.getTime()
}

function ageMultiplier(ageMs: number): number {
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays <= GRACE_DAYS) return 1
  const daysPastGrace = Math.floor(ageDays - GRACE_DAYS)
  return Math.max(0, 1 - daysPastGrace * POST_GRACE_DECAY)
}

export async function handleSnapshot(env: Env, address: string) {
  if (!address || !address.startsWith('xch1')) {
    return { error: 'invalid_address' }
  }

  // Record holder for future snapshots
  await env.DB.prepare(
    `INSERT OR REPLACE INTO known_holders (address, first_seen, last_active)
     VALUES (?1, COALESCE((SELECT first_seen FROM known_holders WHERE address = ?1), ?2), ?2)`
  ).bind(address, Date.now()).run()

  // Pull every unclaimed snapshot with per-week breakdown + decay applied
  const rows = await env.DB.prepare(
    `SELECT week_iso, claimable_cat FROM snapshots
     WHERE address = ?1 AND claimed_at IS NULL ORDER BY week_iso DESC`
  ).bind(address).all<{ week_iso: string; claimable_cat: number }>()

  const now = Date.now()
  const breakdown = (rows.results ?? []).map(r => {
    const age = now - isoWeekToWednesdayMs(r.week_iso)
    const mult = ageMultiplier(age)
    return {
      week:       r.week_iso,
      raw:        r.claimable_cat,
      effective:  r.claimable_cat * mult,
      multiplier: mult,
    }
  })

  const claimableCAT = breakdown.reduce((sum, b) => sum + b.effective, 0)

  // Estimate next week's payout from current week's row (if exists)
  const currentWeek = currentWeekIso()
  const currentRow = await env.DB.prepare(
    `SELECT claimable_cat FROM snapshots WHERE address = ?1 AND week_iso = ?2`
  ).bind(address, currentWeek).first<{ claimable_cat: number }>()

  return {
    claimableCAT,
    estimatedNextCAT: currentRow?.claimable_cat ?? weeklyEmission(env, currentWeek) / 100,
    nextSnapshotIso:  nextSundayIso(),
    breakdown,
  }
}

/** GET /api/history/:address — full claim history (claimed + unclaimed) */
export async function handleHistory(env: Env, address: string) {
  if (!address || !address.startsWith('xch1')) {
    return []
  }
  const rows = await env.DB.prepare(
    `SELECT week_iso, claimable_cat, claimed_at FROM snapshots
     WHERE address = ?1 ORDER BY week_iso DESC LIMIT 52`
  ).bind(address).all<{ week_iso: string; claimable_cat: number; claimed_at: number | null }>()

  const now = Date.now()
  return (rows.results ?? []).map(r => {
    const age = now - isoWeekToWednesdayMs(r.week_iso)
    const decay = ageMultiplier(age)
    return {
      week:    r.week_iso,
      amount:  r.claimable_cat,
      claimed: r.claimed_at,
      decay,
    }
  })
}

export async function handleNetworkStats(env: Env) {
  const weekIso = currentWeekIso()
  const stats = await env.DB.prepare(
    `SELECT total_points, weekly_emission, vault_remaining FROM network_stats WHERE week_iso = ?1`
  ).bind(weekIso).first<{ total_points: number; weekly_emission: number; vault_remaining: number }>()

  const holderCount = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM known_holders`
  ).first<{ n: number }>()

  // Mint progress — read from mintgarden collection
  // TODO: replace with real MintGarden collection query
  const mintedCount = 0

  return {
    mintedCount,
    supply:           500,
    vaultRemaining:   stats?.vault_remaining ?? 1011,
    totalHolders:     holderCount?.n ?? 0,
    totalPoints:      stats?.total_points ?? 0,
    weeklyEmission:   stats?.weekly_emission ?? 15,
  }
}

function nextSundayIso(): string {
  // Wednesday = 3
  const now = new Date()
  const day = now.getUTCDay()
  let daysUntil = (3 - day + 7) % 7
  if (daysUntil === 0 && now.getUTCHours() >= 17) daysUntil = 7
  const next = new Date(now)
  next.setUTCDate(now.getUTCDate() + daysUntil)
  next.setUTCHours(17, 0, 0, 0)
  return next.toISOString()
}
