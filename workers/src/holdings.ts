/**
 * Server-side on-chain reads.
 *
 * SpaceScan endpoints (confirmed):
 *   GET {base}/1/xch/cat/{address}?asset_id={id}
 *   GET {base}/1/nft/address/{address}?page=1&page_size=100
 *
 * MintGarden endpoints:
 *   GET {base}/nfts/{nft_id}
 */
import type { Env } from './index'

export interface Holdings {
  standardOgs:   number
  goldenOgs:     number
  limitedPoints: number
  hasLP:         boolean
}

export async function readHoldings(env: Env, address: string): Promise<Holdings> {
  const [{ standardOgs, goldenOgs, limitedPoints }, lpBalance] = await Promise.all([
    readNftCounts(env, address),
    readCatBalance(env, address, env.LP_ASSET_ID),
  ])
  return {
    standardOgs,
    goldenOgs,
    limitedPoints,
    hasLP: lpBalance > 0.001,
  }
}

async function readNftCounts(env: Env, address: string) {
  if (!env.OG_COLLECTION_ID && !env.LIMITED_COLLECTION_ID) {
    return { standardOgs: 0, goldenOgs: 0, limitedPoints: 0 }
  }

  const url = `${env.SPACESCAN_BASE}/1/nft/address/${address}?page_size=100`
  const res = await fetch(url, env.SPACESCAN_KEY
    ? { headers: { 'Authorization': `Bearer ${env.SPACESCAN_KEY}` } }
    : undefined)
  if (!res.ok) throw new Error(`spacescan_nft_${res.status}`)
  const json = await res.json() as {
    data?: { nft_id: string; collection_id?: string }[]
  }
  const nfts = json.data ?? []

  // Partition by collection
  const ogs     = nfts.filter(n => n.collection_id === env.OG_COLLECTION_ID).map(n => n.nft_id)
  const limited = nfts.filter(n => n.collection_id === env.LIMITED_COLLECTION_ID).map(n => n.nft_id)

  // For each OG, check Golden flag from MintGarden metadata
  const goldenFlags = await Promise.all(ogs.map(id => isGolden(env, id)))
  const goldenOgs   = goldenFlags.filter(Boolean).length
  const standardOgs = ogs.length - goldenOgs

  // For each Limited, read its `points` attribute (15-40)
  const limitedPoints = (await Promise.all(limited.map(id => readPointsAttr(env, id))))
    .reduce((acc, p) => acc + p, 0)

  return { standardOgs, goldenOgs, limitedPoints }
}

async function isGolden(env: Env, nftId: string): Promise<boolean> {
  try {
    const r = await fetch(`${env.MINTGARDEN_BASE}/nfts/${nftId}`)
    if (!r.ok) return false
    const meta = await r.json() as { attributes?: { trait_type: string; value: unknown }[] }
    return (meta.attributes ?? []).some(a =>
      a.trait_type?.toLowerCase() === 'golden' && (a.value === true || a.value === 'true' || a.value === 'Yes')
    )
  } catch { return false }
}

async function readPointsAttr(env: Env, nftId: string): Promise<number> {
  try {
    const r = await fetch(`${env.MINTGARDEN_BASE}/nfts/${nftId}`)
    if (!r.ok) return 15
    const meta = await r.json() as { attributes?: { trait_type: string; value: unknown }[] }
    const attr = (meta.attributes ?? []).find(a => a.trait_type?.toLowerCase() === 'points')
    const val  = Number(attr?.value ?? 15)
    return Number.isFinite(val) ? Math.min(40, Math.max(15, val)) : 15
  } catch { return 15 }
}

async function readCatBalance(env: Env, address: string, assetId: string): Promise<number> {
  const url = `${env.SPACESCAN_BASE}/1/xch/cat/${address}?asset_id=${assetId}`
  const res = await fetch(url, env.SPACESCAN_KEY
    ? { headers: { 'Authorization': `Bearer ${env.SPACESCAN_KEY}` } }
    : undefined)
  if (!res.ok) return 0
  const json = await res.json() as { success: boolean; data?: { confirmed?: number } }
  if (!json.success) return 0
  return (json.data?.confirmed ?? 0) / 1_000
}

// ─── Cocoa Units math (mirrors src/constants.ts) ─────────────────────────────

export function computeCocoaPoints(h: Holdings, weeklyBonus = 0): number {
  const ogPoints   = h.standardOgs * 10 + h.goldenOgs * 30
  const multiplied = h.hasLP ? ogPoints * 3 : ogPoints
  return multiplied + h.limitedPoints + weeklyBonus
}
