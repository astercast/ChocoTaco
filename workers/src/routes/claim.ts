/**
 * POST /api/claim
 *   1. Look up unclaimed snapshots for address
 *   2. Build a Chia offer:  treasury sends N CHOCO  ↔  user gives 1 mojo XCH
 *   3. Mark snapshots claimed_at = now (optimistic — reverted if user doesn't accept within 1h)
 *   4. Return offer string to client → client uses chia_takeOffer
 *
 * NOTE on offer creation:
 *   Cloudflare Workers can't run chia-blockchain natively. Two options:
 *
 *   OPTION A (recommended) — separate signer service
 *     Run a tiny Node.js sidecar (Fly.io / Railway / your own VPS) that
 *     uses chia-rpc or @rigidity/chia to build & sign offers from your
 *     treasury mnemonic. Worker POSTs to it; signer returns offer string.
 *
 *   OPTION B — pre-built offer pool
 *     Once a week after snapshot, your own machine pre-builds N offers
 *     (one per holder), uploads them to D1 / R2. Worker just hands them
 *     out by address. Simpler, no live signing required.
 *
 *   Both approaches use the same wire format. This file shows Option A.
 */
import type { Env } from '../index'

const SIGNER_URL = (globalThis as { SIGNER_URL?: string }).SIGNER_URL ?? ''

export async function handleClaim(env: Env, address: string) {
  if (!address || !address.startsWith('xch1')) {
    return { success: false, error: 'invalid_address' }
  }

  // 1) Find unclaimed amount
  const unclaimed = await env.DB.prepare(
    `SELECT COALESCE(SUM(claimable_cat), 0) AS amt
     FROM snapshots WHERE address = ?1 AND claimed_at IS NULL`
  ).bind(address).first<{ amt: number }>()

  const amount = unclaimed?.amt ?? 0
  if (amount <= 0) {
    return { success: false, error: 'nothing_to_claim' }
  }

  // 2) Build offer via signer service
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
        cat_amount_mojos:  Math.floor(amount * 1000),   // CHOCO uses 1000 mojos / token (3 decimals)
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

  // 3) Mark claimed (optimistic — a cron sweep can revert stale claims)
  await env.DB.prepare(
    `UPDATE snapshots SET claimed_at = ?1 WHERE address = ?2 AND claimed_at IS NULL`
  ).bind(Date.now(), address).run()

  return { success: true, amount, offer }
}
