/**
 * GET /api/snapshot/:address
 *   Returns total unclaimed CHOCO + this week's estimate
 *
 * GET /api/network-stats
 *   Returns: minted count, vault remaining, holder count, total points
 */
import type { Env } from '../index'
import { currentWeekIso, weeklyEmission } from '../snapshot'

export async function handleSnapshot(env: Env, address: string) {
  if (!address || !address.startsWith('xch1')) {
    return { error: 'invalid_address' }
  }

  // Record holder for future snapshots
  await env.DB.prepare(
    `INSERT OR REPLACE INTO known_holders (address, first_seen, last_active)
     VALUES (?1, COALESCE((SELECT first_seen FROM known_holders WHERE address = ?1), ?2), ?2)`
  ).bind(address, Date.now()).run()

  // Sum all unclaimed snapshots
  const totalClaimable = await env.DB.prepare(
    `SELECT COALESCE(SUM(claimable_cat), 0) AS amt
     FROM snapshots WHERE address = ?1 AND claimed_at IS NULL`
  ).bind(address).first<{ amt: number }>()

  // Estimate this week's payout from last snapshot row + current points share
  const currentWeek = currentWeekIso()
  const currentRow = await env.DB.prepare(
    `SELECT claimable_cat FROM snapshots WHERE address = ?1 AND week_iso = ?2`
  ).bind(address, currentWeek).first<{ claimable_cat: number }>()

  return {
    claimableCAT:     totalClaimable?.amt ?? 0,
    estimatedNextCAT: currentRow?.claimable_cat ?? weeklyEmission(env, currentWeek) / 100,
    nextSnapshotIso:  nextSundayIso(),
  }
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
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilSunday = day === 0 ? 7 : (7 - day)
  const next = new Date(now)
  next.setUTCDate(now.getUTCDate() + daysUntilSunday)
  next.setUTCHours(17, 0, 0, 0)
  return next.toISOString()
}
