/**
 * POST /api/claim
 *
 * Pull model:
 *   - User comes to claim. No automatic payouts.
 *   - For each unclaimed snapshot row, we compute the *currently effective*
 *     amount based on how many days past the 3-day grace window we are:
 *       day 1-3 after snapshot   = 100%
 *       day 4                    = 90%
 *       day 5                    = 80%
 *       ...etc, by POST_GRACE_DECAY% per day
 *       floor                    = 0%
 *   - Unclaimed weeks stack. You can let them sit and still claim later,
 *     they just shrink.
 *
 * Then we build one CHOCO offer for the total effective sum, the user
 * signs it via WalletConnect, and we mark every snapshot row claimed.
 */
import type { Env } from '../index'

const SIGNER_URL = (globalThis as { SIGNER_URL?: string }).SIGNER_URL ?? ''

const GRACE_DAYS         = 3
const POST_GRACE_DECAY   = 0.10   // 10% per day after grace
const SNAPSHOT_INTERVAL  = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

/** Multiplier applied to a snapshot based on age (ms since snapshot). */
function ageMultiplier(ageMs: number): number {
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays <= GRACE_DAYS) return 1
  const daysPastGrace = Math.floor(ageDays - GRACE_DAYS)
  const mult = 1 - daysPastGrace * POST_GRACE_DECAY
  return Math.max(0, mult)
}

export async function handleClaim(env: Env, address: string) {
  if (!address || !address.startsWith('xch1')) {
    return { success: false, error: 'invalid_address' }
  }

  // 1) Get all unclaimed snapshots with their week iso
  const rows = await env.DB.prepare(
    `SELECT week_iso, claimable_cat FROM snapshots
     WHERE address = ?1 AND claimed_at IS NULL`
  ).bind(address).all<{ week_iso: string; claimable_cat: number }>()

  if (!rows.results || rows.results.length === 0) {
    return { success: false, error: 'nothing_to_claim' }
  }

  // 2) Compute effective total (apply decay per snapshot age)
  const now = Date.now()
  let effectiveTotal = 0
  const breakdown: { week: string; raw: number; effective: number; multiplier: number }[] = []
  for (const r of rows.results) {
    const snapshotTime = isoWeekToTimestamp(r.week_iso)
    const ageMs        = now - snapshotTime
    const mult         = ageMultiplier(ageMs)
    const eff          = r.claimable_cat * mult
    effectiveTotal    += eff
    breakdown.push({ week: r.week_iso, raw: r.claimable_cat, effective: eff, multiplier: mult })
  }

  if (effectiveTotal <= 0) {
    return { success: false, error: 'all_decayed_to_zero' }
  }

  // 3) Build offer via signer service
  if (!SIGNER_URL) {
    return { success: false, error: 'signer_not_configured' }
  }
  let offer: string
  try {
    const r = await fetch(`${SIGNER_URL}/build-claim`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_address: address,
        cat_amount_mojos:  Math.floor(effectiveTotal * 1000),  // 3 decimals
        cat_asset_id:      env.CHOCO_ASSET_ID,
      }),
    })
    if (!r.ok) throw new Error(`signer_${r.status}`)
    const data = await r.json() as { offer: string }
    offer = data.offer
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'signer_error',
    }
  }

  // 4) Mark all current unclaimed rows as claimed
  await env.DB.prepare(
    `UPDATE snapshots SET claimed_at = ?1 WHERE address = ?2 AND claimed_at IS NULL`
  ).bind(now, address).run()

  return {
    success:   true,
    amount:    effectiveTotal,
    offer,
    breakdown,                                  // for UI to show "you lost X to decay"
    snapshotsClaimed: rows.results.length,
    interval:  SNAPSHOT_INTERVAL,                // unused but exposed for clients
  }
}

// ─── ISO week helpers ────────────────────────────────────────────────────────

function isoWeekToTimestamp(weekIso: string): number {
  const [yearStr, weekStr] = weekIso.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)
  // ISO weeks start Monday; we want the Wednesday 17:00 UTC of that week
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1)
  const wednesday = new Date(mondayWeek1)
  wednesday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7 + 2)
  wednesday.setUTCHours(17, 0, 0, 0)
  return wednesday.getTime()
}
