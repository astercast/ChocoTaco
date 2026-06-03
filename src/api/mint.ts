/**
 * OG Mint — user-customized NFT mint flow (verified against wojak-ink pattern)
 *
 * Chia tech path (NFT1 standard):
 *
 *   1. User picks traits in the generator UI (sections/WeeklyMint.tsx)
 *   2. Client POSTs {address, traits} to Worker /api/mint
 *   3. Worker -> signer sidecar:
 *        a. Compose the NFT metadata JSON (CHIP-0007 schema) with chosen traits
 *        b. Pin metadata + image to IPFS (or upload to R2)
 *        c. Build the nft_mint_nft coin spend with that metadata URI,
 *           the OG collection DID, and 25% royalty puzzle hash
 *        d. Wrap it as an offer: treasury offers the new NFT, requests 0.5 XCH
 *        e. Sign offer with treasury hot key, return offer string
 *   4. Worker also checks if this mint should be a Golden Ticket pull
 *      (against `golden_tickets` table — 50 pre-minted spots reserved)
 *      If hit, returns a pre-built Golden offer instead of the custom one.
 *   5. Client passes offer to WalletConnect `chia_takeOffer`
 *   6. User signs in Sage / Reference Wallet
 *   7. Chain confirms. NFT lands in user's wallet with chosen traits and the
 *      on-chain 25% royalty puzzle enforced by NFT1.
 */

import { requestRpc, type ChiaSession } from './walletconnect'

const WORKER_URL = (import.meta.env.VITE_WORKER_URL ?? '') as string

export interface MintTraits {
  shell?:      number
  filling?:    number
  sauce?:      number
  accessory?:  number
  background?: number
}

export interface MintResult {
  success:  boolean
  error?:   string
  txId?:    string
  isGolden?: boolean
}

/**
 * Mint an OG NFT with the user's chosen traits.
 * If the backend rolls a Golden Ticket, returns isGolden: true and the user
 * gets a pre-minted Golden NFT (custom traits ignored on that path).
 */
export async function mintOg(
  session: ChiaSession | null,
  traits:  MintTraits = {},
): Promise<MintResult> {
  if (!session) return { success: false, error: 'Wallet not connected' }
  if (!WORKER_URL) {
    // Dev mode without a backend: simulate
    if (import.meta.env.DEV) {
      await new Promise(r => setTimeout(r, 1800))
      return { success: true, isGolden: Math.random() < 0.1 }
    }
    return { success: false, error: 'Backend not configured' }
  }

  try {
    // 1) Ask backend to build/reserve a mint offer for these traits
    const res = await fetch(`${WORKER_URL}/api/mint`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address: session.address, traits }),
    })
    const data = await res.json() as {
      success:  boolean
      offer?:   string
      isGolden?: boolean
      error?:   string
    }
    if (!data.success || !data.offer) {
      return { success: false, error: data.error ?? 'Mint reservation failed' }
    }

    // 2) User accepts the offer via WalletConnect
    await requestRpc(session, 'chia_takeOffer', {
      offer:       data.offer,
      fee:         0,
      fingerprint: session.fingerprint,
    })

    return { success: true, isGolden: data.isGolden }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Mint failed' }
  }
}
