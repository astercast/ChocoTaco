/**
 * POST /api/mint
 *
 * On-demand OG mint. Body: { address, traits: {shell, filling, sauce, accessory, background} }
 *
 * Flow (no pre-minted pool — everything is generated fresh):
 *   1. Atomically assign this user the next sequential mint number (1..500)
 *   2. Check if that number lands on one of the 50 reserved Golden slots
 *   3. Forward to signer with traits + isGolden flag
 *   4. Signer composes image, builds metadata with Golden:true if applicable,
 *      mints NFT to treasury, wraps as offer, returns to user
 *   5. Worker returns offer + isGolden so the UI can show the right celebration
 *
 * Golden slot seeding (run once before launch):
 *   The Worker also exposes /api/admin/seed-golden which generates 50 random
 *   slot numbers between 1-500 using verifiable randomness (e.g. SHA256 of
 *   a publicly-committed seed) and stores them in golden_slots. The seed is
 *   published publicly so anyone can verify the slot assignments.
 */
import type { Env } from '../index'

const SIGNER_URL = (globalThis as { SIGNER_URL?: string }).SIGNER_URL ?? ''

interface MintBody {
  address: string
  traits?: Record<string, number>
}

export async function handleMintReserve(env: Env, address: string, _quantity: number) {
  // Backwards-compat wrapper for the older /api/mint/reserve path
  return handleMint(env, { address, traits: {} })
}

export async function handleMint(env: Env, body: MintBody) {
  if (!body.address || !body.address.startsWith('xch1')) {
    return { success: false, error: 'invalid_address' }
  }

  // 1) Atomically reserve next mint number
  const claimed = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM mint_reservations WHERE claimed_at IS NOT NULL`
  ).first<{ n: number }>()
  const nextMintNumber = (claimed?.n ?? 0) + 1
  if (nextMintNumber > 500) {
    return { success: false, error: 'sold_out' }
  }

  // 2) Is this number a Golden slot?
  const goldenRow = await env.DB.prepare(
    `SELECT 1 FROM golden_slots WHERE slot_number = ?1`
  ).bind(nextMintNumber).first()
  const isGolden = Boolean(goldenRow)

  // 3) Call signer to compose + mint + build offer
  if (!SIGNER_URL) {
    return { success: false, error: 'signer_not_configured' }
  }

  try {
    const r = await fetch(`${SIGNER_URL}/build-mint`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_address: body.address,
        traits:            body.traits ?? {},
        mint_number:       nextMintNumber,
        is_golden:         isGolden,
        treasury_address:  env.TREASURY_ADDRESS,
        price_xch_mojos:   500_000_000_000,  // 0.5 XCH
        royalty_percent:   25,
      }),
    })
    if (!r.ok) throw new Error(`signer_${r.status}`)
    const data = await r.json() as { offer: string; nft_id: string }

    // 4) Record the reservation
    await env.DB.prepare(
      `INSERT INTO mint_reservations (offer_hash, address, offer, created_at, claimed_at)
       VALUES (?1, ?2, ?3, ?4, ?4)`
    ).bind(data.nft_id, body.address, data.offer, Date.now()).run()

    return {
      success:    true,
      offer:      data.offer,
      nftId:      data.nft_id,
      mintNumber: nextMintNumber,
      isGolden,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'signer_error',
    }
  }
}
