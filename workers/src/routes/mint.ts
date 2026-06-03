/**
 * POST /api/mint
 *
 * User-customized OG mint. Body: { address, traits: {shell, filling, sauce, accessory, background} }
 *
 * Flow:
 *   1. Roll a die against unfilled Golden Ticket slots.
 *      - If hit: serve a pre-built Golden offer from `golden_tickets` table.
 *        User gets a Golden NFT (curated traits, not theirs). Mark slot filled.
 *      - If miss: ask signer to build a fresh custom mint offer with the
 *        user's chosen traits, then return.
 *   2. Insert the mint record into `mint_reservations` with status "pending".
 *   3. Return the offer string. Client takes it via chia_takeOffer.
 *      Confirmation watcher (separate cron) marks the row "minted".
 */
import type { Env } from '../index'

const SIGNER_URL = (globalThis as { SIGNER_URL?: string }).SIGNER_URL ?? ''

interface MintBody {
  address: string
  traits?: Record<string, number>
}

export async function handleMintReserve(env: Env, address: string, _quantity: number) {
  // Backwards-compat wrapper kept for the older /api/mint/reserve path.
  return handleMint(env, { address, traits: {} })
}

export async function handleMint(env: Env, body: MintBody) {
  if (!body.address || !body.address.startsWith('xch1')) {
    return { success: false, error: 'invalid_address' }
  }

  // Supply check
  const totalMinted = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM mint_reservations WHERE claimed_at IS NOT NULL`
  ).first<{ n: number }>()
  if ((totalMinted?.n ?? 0) >= 500) {
    return { success: false, error: 'sold_out' }
  }

  // 1) Try Golden Ticket allocation
  const goldenSlot = await env.DB.prepare(
    `SELECT nft_id FROM golden_tickets
     WHERE nft_id NOT IN (SELECT offer_hash FROM mint_reservations WHERE claimed_at IS NOT NULL)
     ORDER BY RANDOM() LIMIT 1`
  ).first<{ nft_id: string }>()

  // Random chance: roughly 50/450 = 10% per remaining mint
  const remainingGolden  = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM golden_tickets
     WHERE nft_id NOT IN (SELECT offer_hash FROM mint_reservations WHERE claimed_at IS NOT NULL)`
  ).first<{ n: number }>()
  const remainingTotal   = 500 - (totalMinted?.n ?? 0)
  const goldenChance     = (remainingGolden?.n ?? 0) / Math.max(1, remainingTotal)

  if (goldenSlot && Math.random() < goldenChance) {
    return serveGoldenOffer(env, body.address, goldenSlot.nft_id)
  }

  // 2) Custom mint via signer
  if (!SIGNER_URL) {
    return { success: false, error: 'signer_not_configured' }
  }

  try {
    const r = await fetch(`${SIGNER_URL}/build-mint`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_address:    body.address,
        traits:               body.traits ?? {},
        og_collection_id:     env.OG_COLLECTION_ID,
        treasury_address:     env.TREASURY_ADDRESS,
        price_xch_mojos:      500_000_000_000, // 0.5 XCH (1 XCH = 1e12 mojos)
        royalty_percent:      25,
        edition_total:        500,
      }),
    })
    if (!r.ok) throw new Error(`signer_${r.status}`)
    const data = await r.json() as { offer: string; nft_id: string }

    // Track the reservation
    await env.DB.prepare(
      `INSERT INTO mint_reservations (offer_hash, address, offer, created_at)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind(data.nft_id, body.address, data.offer, Date.now()).run()

    return { success: true, offer: data.offer, isGolden: false, nftId: data.nft_id }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'signer_error',
    }
  }
}

async function serveGoldenOffer(env: Env, address: string, nftId: string) {
  // Pre-built offer for this Golden NFT lives in mint_reservations.
  // Operator uploads them after pre-mint with claimed_at = NULL.
  const row = await env.DB.prepare(
    `SELECT offer FROM mint_reservations WHERE offer_hash = ?1 AND claimed_at IS NULL`
  ).first<{ offer: string }>()
  if (!row) {
    return { success: false, error: 'golden_offer_missing' }
  }

  await env.DB.prepare(
    `UPDATE mint_reservations SET claimed_at = ?1, address = ?2 WHERE offer_hash = ?3`
  ).bind(Date.now(), address, nftId).run()

  return { success: true, offer: row.offer, isGolden: true, nftId }
}
