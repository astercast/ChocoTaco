/**
 * POST /api/social/verify
 *   Verifies a #ChocotacoFactory tweet for +15 weekly Cocoa Units.
 *
 *   Body: { address, tweetUrl }
 *
 *   Verification rules (server-side):
 *     1. URL must be x.com / twitter.com
 *     2. Tweet text must include "#ChocotacoFactory"
 *     3. Tweet text must include user's wallet (first 8 chars of xch address) for proof
 *     4. Idempotent — one bonus per address per ISO week
 */
import type { Env } from '../index'
import { currentWeekIso } from '../snapshot'

export async function handleSocialVerify(env: Env, address: string, tweetUrl: string) {
  if (!address || !address.startsWith('xch1') || !tweetUrl) {
    return { success: false, error: 'invalid_input' }
  }

  const weekIso = currentWeekIso()

  // Already claimed this week?
  const existing = await env.DB.prepare(
    `SELECT 1 FROM social_bonuses WHERE week_iso = ?1 AND address = ?2`
  ).bind(weekIso, address).first()
  if (existing) {
    return { success: false, error: 'already_claimed_this_week' }
  }

  // Fetch tweet content (X has no free API; use a public scrape proxy or oEmbed)
  let tweetText = ''
  try {
    const oembed = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`)
    if (!oembed.ok) throw new Error('oembed_failed')
    const data = await oembed.json() as { html?: string }
    tweetText = (data.html ?? '').toLowerCase()
  } catch {
    return { success: false, error: 'fetch_tweet_failed' }
  }

  if (!tweetText.includes('#chocotacofactory')) {
    return { success: false, error: 'missing_hashtag' }
  }
  // Wallet proof — first 8 chars of address
  const proofToken = address.slice(0, 8).toLowerCase()
  if (!tweetText.includes(proofToken)) {
    return { success: false, error: 'missing_address_proof' }
  }

  await env.DB.prepare(
    `INSERT INTO social_bonuses (week_iso, address, tweet_url, granted_at)
     VALUES (?1, ?2, ?3, ?4)`
  ).bind(weekIso, address, tweetUrl, Date.now()).run()

  return { success: true, bonus: 15, weekIso }
}
