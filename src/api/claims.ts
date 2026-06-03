/**
 * Backend API — Cloudflare Worker endpoints
 *
 * BASE: VITE_WORKER_URL (e.g. https://chocotaco-api.yourname.workers.dev)
 *
 * Endpoints the Worker needs to expose:
 *
 *   POST  /api/claim
 *     Body:  { address: string }
 *     Action: re-verify holdings, check snapshot table for unclaimed CHOCO,
 *             create offer from treasury (CHOCO out, 1 mojo XCH placeholder back),
 *             return offer string for user to accept in wallet.
 *     200:   { success: true, amount: number, offer: string }
 *     400:   { success: false, error: 'cooldown'|'nothing_to_claim'|'ineligible' }
 *
 *   GET   /api/snapshot/:address
 *     Returns current week's claimable amount + estimated next-week payout.
 *     200:   { claimableCAT: number, estimatedNextCAT: number, nextSnapshotIso: string }
 *
 *   GET   /api/network-stats
 *     Returns aggregate stats for the dashboard (mint progress, vault remaining, etc.)
 *     200:   { mintedCount, vaultRemaining, totalHolders, totalPoints }
 *
 *   POST  /api/social/verify
 *     Body:  { address, tweetUrl }
 *     Action: scrape tweet, check it contains #ChocotacoFactory + wallet address proof,
 *             grant +15 weekly Cocoa Units. Idempotent per week.
 *
 *   POST  /api/golden-tickets/reveal
 *     Worker-only (cron). After mint closes:
 *     1. Read first-mint tx hash + block height (Chia full-node RPC)
 *     2. Use SHA256(seed) → pick 50 NFTs from minted set
 *     3. Push metadata update to MintGarden with `golden: true` attribute
 *     4. Publish the seed publicly on a tx memo for verifiability
 */

const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string) ?? ''

export async function submitClaim(address: string, _expectedAmount: number): Promise<boolean> {
  if (import.meta.env.DEV || !WORKER_URL) {
    await new Promise(r => setTimeout(r, 1500))
    return true
  }

  try {
    const res = await fetch(`${WORKER_URL}/api/claim`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address }),
    })
    const data = await res.json() as { success: boolean; offer?: string; error?: string }
    if (!data.success) {
      console.warn('[claims] rejected:', data.error)
      return false
    }
    // TODO: pass `data.offer` to WalletConnect for user to sign:
    //   await client.request({ topic, chainId, request: { method: 'chia_takeOffer', params: { offer: data.offer } } })
    return true
  } catch (err) {
    console.error('[claims] network error:', err)
    return false
  }
}
