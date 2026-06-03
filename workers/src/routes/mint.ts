/**
 * POST /api/mint/reserve
 *   Mode B mint: hand out pre-built offer files (treasury → NFT for 1 XCH).
 *
 *   Body: { address, quantity }
 *
 *   The treasury operator pre-uploads offer files (one per OG NFT) into
 *   the `mint_reservations` table. This endpoint allocates them FIFO.
 *
 *   If you're using MintGarden Drops (mode A, the default), this endpoint
 *   isn't used — the frontend just opens mintgarden.io directly.
 */
import type { Env } from '../index'

export async function handleMintReserve(env: Env, address: string, quantity: number) {
  if (!address || !address.startsWith('xch1') || !quantity || quantity < 1 || quantity > 10) {
    return { success: false, error: 'invalid_input' }
  }

  // Pull `quantity` unclaimed offers atomically
  const offers: string[] = []
  for (let i = 0; i < quantity; i++) {
    const row = await env.DB.prepare(
      `SELECT offer_hash, offer FROM mint_reservations
       WHERE claimed_at IS NULL ORDER BY created_at ASC LIMIT 1`
    ).first<{ offer_hash: string; offer: string }>()

    if (!row) {
      return { success: false, error: i === 0 ? 'sold_out' : 'partial_fill' }
    }

    await env.DB.prepare(
      `UPDATE mint_reservations SET claimed_at = ?1, address = ?2 WHERE offer_hash = ?3`
    ).bind(Date.now(), address, row.offer_hash).run()

    offers.push(row.offer)
  }

  return { success: true, offers }
}
