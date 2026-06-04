/**
 * Weekly snapshot, runs Wednesday 17:00 UTC.
 *
 * For every known holder:
 *   1. read on-chain holdings
 *   2. compute Cocoa Units
 * Then for the whole network:
 *   3. compute share = points / total_points
 *   4. payout = share × this week's emission
 *   5. write snapshots table row (claimable_cat, claimed_at=NULL)
 */
import type { Env } from './index'
import { readHoldings, computeCocoaPoints } from './holdings'

export async function computeWeeklySnapshot(env: Env): Promise<void> {
  const weekIso = currentWeekIso()
  const emission = weeklyEmission(env, weekIso)

  // 1) Get all known holders
  const holders = await env.DB.prepare(`SELECT address FROM known_holders`).all<{ address: string }>()
  if (!holders.results || holders.results.length === 0) {
    console.log('[snapshot] no known holders yet')
    return
  }

  // 2) Read holdings + compute points for each
  const rows = await Promise.all(holders.results.map(async ({ address }) => {
    try {
      const h = await readHoldings(env, address)
      // Check weekly social bonus
      const bonus = await env.DB.prepare(
        `SELECT 1 FROM social_bonuses WHERE week_iso = ?1 AND address = ?2`
      ).bind(weekIso, address).first()
      const points = computeCocoaPoints(h, bonus ? 15 : 0)
      return { address, points }
    } catch (err) {
      console.error(`[snapshot] read error for ${address}:`, err)
      return { address, points: 0 }
    }
  }))

  // 3) Compute network total
  const totalPoints = rows.reduce((acc, r) => acc + r.points, 0)
  if (totalPoints === 0) {
    console.log('[snapshot] zero total points')
    return
  }

  // 4) Safety: clamp the week's effective emission to what's actually left in
  //    the vault. If somehow we tried to emit more than remaining, we cap it
  //    so cumulative distribution can never exceed 1011.
  const vaultRemaining = await computeVaultRemaining(env)
  const effectiveEmission = Math.min(emission, Math.max(0, vaultRemaining))

  if (effectiveEmission <= 0) {
    console.log('[snapshot] vault exhausted, no emission this week')
    return
  }

  // 5) Build snapshot rows (proportional to points / total)
  const inserts = rows.map(r => {
    const claimable = (r.points / totalPoints) * effectiveEmission
    return env.DB.prepare(
      `INSERT OR REPLACE INTO snapshots (week_iso, address, points, claimable_cat, claimed_at)
       VALUES (?1, ?2, ?3, ?4, NULL)`
    ).bind(weekIso, r.address, r.points, claimable)
  })

  // 6) Network stats summary (note: vaultRemaining now reflects PRE-insert state;
  //    the new snapshots will subtract from it on next computation)
  const remainingAfter = vaultRemaining - effectiveEmission
  inserts.push(env.DB.prepare(
    `INSERT OR REPLACE INTO network_stats (week_iso, total_points, weekly_emission, vault_remaining, computed_at)
     VALUES (?1, ?2, ?3, ?4, ?5)`
  ).bind(weekIso, totalPoints, effectiveEmission, remainingAfter, Date.now()))

  await env.DB.batch(inserts)
  console.log(`[snapshot] ${weekIso} → ${rows.length} holders, ${totalPoints} pts, ${effectiveEmission.toFixed(4)} $🍫🌮 emitted, ${remainingAfter.toFixed(4)} remaining`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function currentWeekIso(): string {
  const d = new Date()
  // ISO week year + week
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Halving schedule: 1011 $🍫🌮 over 156 weeks.
 *
 * Precise emission: total = 52E + 26E + 13E = 91E = 1011  →  E = 1011/91
 * Using exact fractions guarantees cumulative = 1011 exactly with zero drift.
 *
 *   Year 1 (weeks 0-51):    E   = 11.1099/wk  =  577.7143 total  (57.14%)
 *   Year 2 (weeks 52-103):  E/2 =  5.5549/wk  =  288.8571 total  (28.57%)
 *   Year 3 (weeks 104-155): E/4 =  2.7775/wk  =  144.4286 total  (14.29%)
 *
 * After week 156: emission = 0 (vault exhausted, distribution ends).
 */
const VAULT_E = 1011 / 91

export function weeklyEmission(env: Env, weekIso: string): number {
  const launchWeek = (env as { LAUNCH_WEEK_ISO?: string }).LAUNCH_WEEK_ISO || '2026-W01'
  const weekIndex  = isoWeekDiff(launchWeek, weekIso)
  if (weekIndex < 0)   return 0
  if (weekIndex < 52)  return VAULT_E
  if (weekIndex < 104) return VAULT_E / 2
  if (weekIndex < 156) return VAULT_E / 4
  return 0
}

function isoWeekDiff(a: string, b: string): number {
  const [ay, aw] = a.split('-W').map(Number)
  const [by, bw] = b.split('-W').map(Number)
  return (by - ay) * 52 + (bw - aw)
}

const VAULT_TOTAL = 1011  // total $🍫🌮 to distribute across 3 years
async function computeVaultRemaining(env: Env): Promise<number> {
  const r = await env.DB.prepare(
    `SELECT COALESCE(SUM(claimable_cat), 0) AS total FROM snapshots`
  ).first<{ total: number }>()
  return VAULT_TOTAL - (r?.total ?? 0)
}
