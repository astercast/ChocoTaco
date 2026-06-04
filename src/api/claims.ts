/**
 * Claim flow - fetch offer from Worker → user accepts via WalletConnect
 *
 *   POST /api/claim
 *     Body:  { address: string }
 *     200:   { success: true, amount: number, offer: string }
 *             ↑ Worker built a CHOCO offer (treasury → user, 1 mojo XCH back)
 *     400:   { success: false, error: 'cooldown'|'nothing_to_claim'|'ineligible' }
 *
 *   GET /api/snapshot/:address
 *     200:   { claimableCAT: number, estimatedNextCAT: number, nextSnapshotIso: string }
 */

import { requestRpc, type ChiaSession } from './walletconnect'

const WORKER_URL = (import.meta.env.VITE_WORKER_URL ?? '') as string

export interface ClaimResult {
  success: boolean
  amount?: number
  error?:  string
}

/**
 * Complete the claim end-to-end:
 *   1. Worker generates a signed offer
 *   2. User's wallet takes the offer
 *   3. CHOCO lands in user's wallet, snapshot row marked claimed
 */
export async function submitClaim(session: ChiaSession): Promise<ClaimResult> {
  // Dev mode: simulate
  if (import.meta.env.DEV && !WORKER_URL) {
    await new Promise(r => setTimeout(r, 1500))
    return { success: true, amount: 4.2 }
  }

  if (!WORKER_URL) return { success: false, error: 'Backend not configured' }

  try {
    // 1) Ask Worker to build the claim offer
    const res = await fetch(`${WORKER_URL}/api/claim`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address: session.address }),
    })
    const data = await res.json() as {
      success: boolean
      offer?:  string
      amount?: number
      error?:  string
    }
    if (!data.success || !data.offer) {
      return { success: false, error: data.error ?? 'Worker rejected claim' }
    }

    // 2) User signs/accepts the offer through their wallet
    await requestRpc(session, 'chia_takeOffer', {
      offer:       data.offer,
      fee:         0,
      fingerprint: session.fingerprint,
    })

    return { success: true, amount: data.amount }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Claim failed' }
  }
}

export interface SnapshotData {
  claimableCAT:     number
  estimatedNextCAT: number
  nextSnapshotIso:  string
  breakdown?: { week: string; raw: number; effective: number; multiplier: number }[]
}

export interface HistoryEntry {
  week:    string         // ISO week e.g. 2026-W12
  amount:  number         // CHOCO claimed
  claimed: number | null  // unix ms or null if unclaimed
  decay:   number         // 1.0 = full, 0.0 = fully decayed
}

/**
 * Get the latest snapshot (claimable amount + next-week estimate + per-week breakdown).
 */
export async function fetchSnapshot(address: string): Promise<SnapshotData | null> {
  if (import.meta.env.DEV && !WORKER_URL) {
    return {
      claimableCAT:     4.2,
      estimatedNextCAT: 3.8,
      nextSnapshotIso:  nextWednesdayIso(),
      breakdown: [
        { week: '2026-W10', raw: 2.5, effective: 2.5, multiplier: 1.0 },
        { week: '2026-W09', raw: 2.5, effective: 1.7, multiplier: 0.7 },
      ],
    }
  }
  if (!WORKER_URL) return null
  try {
    const res = await fetch(`${WORKER_URL}/api/snapshot/${address}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Full claim history for an address.
 */
export async function fetchHistory(address: string): Promise<HistoryEntry[]> {
  if (import.meta.env.DEV && !WORKER_URL) {
    return [
      { week: '2026-W08', amount: 2.1, claimed: Date.now() - 86400000 * 14, decay: 1.0 },
      { week: '2026-W07', amount: 1.8, claimed: Date.now() - 86400000 * 21, decay: 1.0 },
      { week: '2026-W06', amount: 2.4, claimed: null,                       decay: 0.4 },
    ]
  }
  if (!WORKER_URL) return []
  try {
    const res = await fetch(`${WORKER_URL}/api/history/${address}`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function nextWednesdayIso(): string {
  const now = new Date()
  const day = now.getUTCDay()
  let daysUntil = (3 - day + 7) % 7
  if (daysUntil === 0 && now.getUTCHours() >= 17) daysUntil = 7
  const next = new Date(now)
  next.setUTCDate(now.getUTCDate() + daysUntil)
  next.setUTCHours(17, 0, 0, 0)
  return next.toISOString()
}
