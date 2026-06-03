/**
 * Claim flow — fetch offer from Worker → user accepts via WalletConnect
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

/**
 * Get the latest snapshot (claimable amount + next-week estimate).
 */
export async function fetchSnapshot(address: string): Promise<{ claimableCAT: number; estimatedNextCAT: number } | null> {
  if (import.meta.env.DEV && !WORKER_URL) {
    return { claimableCAT: 4.2, estimatedNextCAT: 3.8 }
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
