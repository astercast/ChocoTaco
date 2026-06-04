/**
 * Chain reads — on-chain holdings verification (V2)
 *
 * Sources:
 *   - SpaceScan       → NFT list by address + CAT balances
 *   - MintGarden API  → NFT metadata (to detect Golden Ticket flag)
 *   - TibetSwap       → LP CAT balance (alt: SpaceScan CAT query)
 *
 * IMPORTANT: production should proxy through your Cloudflare Worker so:
 *   - rate-limit keys never hit the browser
 *   - the snapshot computation is server-authoritative (anti-spoof)
 */
import { CHOCO_LP_ASSET_ID, COCOA, SPACESCAN_API, MINTGARDEN_API } from '../constants'

export interface Holdings {
  standardOgs:   number       // OG NFTs without Golden Ticket flag
  goldenOgs:     number       // OG NFTs that minted into a Golden slot (flag in metadata)
  limitedPoints: number       // sum of point values from Limited Edition NFTs
  lpBalance:     number       // CHOCO/XCH LP CAT balance (drives uncapped multiplier)
  claimableCAT:  number       // latest snapshot's pending claim (backend-supplied)
}

// ─── Collection IDs (fill in after deploy) ───────────────────────────────────
export const OG_COLLECTION_ID      = ''   // e.g. 'col1abc...' from MintGarden
export const LIMITED_COLLECTION_ID = ''   // future limited edition collection

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function fetchHoldings(address: string): Promise<Holdings> {
  if (import.meta.env.DEV) return mockHoldings()

  const [{ standardOgs, goldenOgs }, limitedPoints, lpBalance] = await Promise.all([
    fetchOgBreakdown(address),
    fetchLimitedPoints(address),
    fetchCatBalance(address, CHOCO_LP_ASSET_ID),
  ])

  return {
    standardOgs,
    goldenOgs,
    limitedPoints,
    lpBalance,
    claimableCAT: 0, // backend Worker supplies this from snapshot table
  }
}

// ─── OG NFT classification ───────────────────────────────────────────────────

async function fetchOgBreakdown(address: string): Promise<{ standardOgs: number; goldenOgs: number }> {
  if (!OG_COLLECTION_ID) return { standardOgs: 0, goldenOgs: 0 }

  // 1) Get all NFTs in OG collection held by this address (SpaceScan)
  const res  = await fetch(`${SPACESCAN_API}/1/nft/address/${address}?page_size=100`)
  if (!res.ok) throw new Error(`SpaceScan NFT ${res.status}`)
  const json = await res.json() as {
    data?: { nft_id: string; collection_id?: string }[]
  }
  const ogNftIds = (json.data ?? [])
    .filter(n => n.collection_id === OG_COLLECTION_ID)
    .map(n => n.nft_id)

  // 2) For each, check the Golden Ticket metadata flag (MintGarden)
  const flags = await Promise.all(
    ogNftIds.map(id => isGoldenTicket(id))
  )

  return {
    goldenOgs:   flags.filter(Boolean).length,
    standardOgs: flags.filter(f => !f).length,
  }
}

async function isGoldenTicket(nftId: string): Promise<boolean> {
  try {
    const res  = await fetch(`${MINTGARDEN_API}/nfts/${nftId}`)
    if (!res.ok) return false
    const meta = await res.json() as {
      attributes?: { trait_type: string; value: string | boolean }[]
    }
    return (meta.attributes ?? []).some(a =>
      a.trait_type?.toLowerCase().includes('golden') && Boolean(a.value)
    )
  } catch {
    return false
  }
}

// ─── Limited Edition NFT points ──────────────────────────────────────────────

async function fetchLimitedPoints(address: string): Promise<number> {
  if (!LIMITED_COLLECTION_ID) return 0
  const res  = await fetch(`${SPACESCAN_API}/1/nft/address/${address}?page_size=100`)
  if (!res.ok) return 0
  const json = await res.json() as {
    data?: { nft_id: string; collection_id?: string }[]
  }
  const ltdNfts = (json.data ?? []).filter(n => n.collection_id === LIMITED_COLLECTION_ID)
  // Each Limited NFT has its own point value in metadata (15-40 by rarity)
  // For now use the floor; backend reads each NFT's `points` attribute
  return ltdNfts.length * COCOA.perLimitedMin
}

// ─── CAT balance (used for LP detection) ─────────────────────────────────────

async function fetchCatBalance(address: string, assetId: string): Promise<number> {
  const res  = await fetch(`${SPACESCAN_API}/1/xch/cat/${address}?asset_id=${assetId}`)
  if (!res.ok) return 0
  const json = await res.json() as {
    success: boolean
    data?: { confirmed?: number }
  }
  if (!json.success) return 0
  return (json.data?.confirmed ?? 0) / 1_000
}

// ─── Dev mock ────────────────────────────────────────────────────────────────

function mockHoldings(): Holdings {
  return {
    standardOgs:   2,
    goldenOgs:     1,
    limitedPoints: 50,
    lpBalance:     1.5,   // 1.5 LP → 4× OG multiplier
    claimableCAT:  4.2,
  }
}
