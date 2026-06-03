/**
 * OG Mint flow
 *
 * Two modes (toggle via VITE_MINT_MODE in .env):
 *
 *   MODE "mintgarden"  (default — easiest, no backend signing)
 *     Opens MintGarden's drop page in a new tab.
 *     User mints there. MintGarden handles offer creation, payment,
 *     and NFT delivery. Royalty puzzle hash is set when you create
 *     the Drop on MintGarden.
 *
 *   MODE "offer"  (advanced — self-hosted offer file)
 *     Backend Worker pre-creates offer files (treasury → NFT for 1 XCH).
 *     Frontend fetches an unclaimed offer + has user accept via
 *     WalletConnect's `chia_takeOffer` RPC.
 */

import { requestRpc, type ChiaSession } from './walletconnect'

const MINT_MODE  = (import.meta.env.VITE_MINT_MODE ?? 'mintgarden') as 'mintgarden' | 'offer'
const WORKER_URL = (import.meta.env.VITE_WORKER_URL ?? '') as string

// MintGarden drop slug — fill this in once the drop is published.
// Example: 'chocotaco-og'  → opens https://mintgarden.io/drops/chocotaco-og
const MINTGARDEN_DROP_SLUG = (import.meta.env.VITE_MINTGARDEN_DROP_SLUG ?? '') as string

export interface MintResult {
  success: boolean
  error?:  string
  txId?:   string
}

/**
 * Trigger a mint. Returns success: true once the wallet has accepted.
 */
export async function mintOg(session: ChiaSession | null, quantity: number): Promise<MintResult> {
  if (MINT_MODE === 'mintgarden') {
    return mintViaMintGarden()
  }
  return mintViaOffer(session, quantity)
}

// ─── Mode A — MintGarden drop ────────────────────────────────────────────────

function mintViaMintGarden(): MintResult {
  if (!MINTGARDEN_DROP_SLUG) {
    return { success: false, error: 'Mint not configured (missing VITE_MINTGARDEN_DROP_SLUG)' }
  }
  if (typeof window !== 'undefined') {
    window.open(`https://mintgarden.io/drops/${MINTGARDEN_DROP_SLUG}`, '_blank', 'noopener')
    return { success: true }
  }
  return { success: false, error: 'No window context' }
}

// ─── Mode B — Self-hosted offer ──────────────────────────────────────────────

async function mintViaOffer(session: ChiaSession | null, quantity: number): Promise<MintResult> {
  if (!session) return { success: false, error: 'Wallet not connected' }
  if (!WORKER_URL) return { success: false, error: 'Backend not configured' }

  try {
    // 1) Ask backend to allocate {quantity} offer files (one per NFT)
    const res = await fetch(`${WORKER_URL}/api/mint/reserve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address: session.address, quantity }),
    })
    const data = await res.json() as { success: boolean; offers?: string[]; error?: string }
    if (!data.success || !data.offers?.length) {
      return { success: false, error: data.error ?? 'Failed to reserve mint' }
    }

    // 2) Have the wallet accept each offer in sequence
    for (const offer of data.offers) {
      await requestRpc(session, 'chia_takeOffer', { offer, fee: 0 })
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Mint failed' }
  }
}
