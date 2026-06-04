/**
 * On-demand NFT mint
 *
 * Pipeline:
 *   1. Compose image from trait layers (sharp)
 *   2. Upload image -> Pinata IPFS
 *   3. Build CHIP-0007 metadata JSON, upload -> Pinata IPFS
 *   4. Call wallet RPC `nft_mint_nft` with image+metadata URIs + 25% royalty
 *   5. Wait for chain confirmation, grab the launcher_id
 *   6. Call wallet RPC `create_offer_for_ids`: treasury gives NFT, asks for 0.5 XCH
 *   7. Return offer string
 *
 * Notes:
 *   - Royalty enforced on-chain by NFT1 standard (no off-chain trust needed)
 *   - All images get both ipfs:// and https:// (gateway) URIs in metadata for
 *     maximum wallet compatibility
 */
import crypto from 'crypto'
import { rpc, getNftWalletId } from './chia.js'
import { composeImage } from './compose.js'
import { uploadImage, uploadMetadata } from './ipfs.js'

const TRAIT_NAMES = {
  shell:      ['Crispy Gold', 'Soft Warm', 'Dark Choco', 'Rainbow', 'Ghost'],
  filling:    ['Classic Beef', 'Triple Cheese', 'Jalapeño', 'Pineapple', 'Void'],
  sauce:      ['Choco Drizzle', 'Gold Dust', 'Fire Sauce', 'Sour Cream', 'None'],
  accessory:  ['Crown', 'Sunglasses', 'Laser Eyes', 'Halo', 'None'],
  background: ['Choco Swirl', 'Caramel', 'Inferno', 'Neon', 'Void'],
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

function buildMetadata({ traits, mintNumber, imageIpfs, imageHttps, isGolden }) {
  return {
    format:            'CHIP-0007',
    name:              `ChocoTaco OG #${String(mintNumber).padStart(3, '0')}`,
    description:       'Factory Employee Badge. ChocoTaco — the sweetest memecoin on Chia.',
    minting_tool:      'chocotaco-signer/0.1',
    sensitive_content: false,
    series_number:     mintNumber,
    series_total:      500,
    attributes: [
      { trait_type: 'Edition', value: 'OG' },
      { trait_type: 'Golden',  value: Boolean(isGolden) },
      ...Object.entries(traits).map(([k, v]) => ({
        trait_type: cap(k),
        value:      TRAIT_NAMES[k]?.[v] ?? 'Unknown',
      })),
    ],
    collection: {
      name:       'ChocoTaco OGs',
      id:         process.env.OG_COLLECTION_UUID,
      attributes: [{ type: 'icon', value: process.env.COLLECTION_ICON_URL ?? '' }],
    },
    data: { image_ipfs: imageIpfs, image_https: imageHttps },
  }
}

/**
 * @param body  {
 *   recipient_address,    // xch1...
 *   traits,               // { shell, filling, sauce, accessory, background }
 *   treasury_address,     // xch1...
 *   price_xch_mojos,      // 0.5 XCH = 500_000_000_000
 *   royalty_percent,      // 25
 * }
 */
export async function buildMintOffer(body) {
  const {
    recipient_address,
    traits = {},
    treasury_address,
    price_xch_mojos = 500_000_000_000,
    royalty_percent = 25,
  } = body

  if (!recipient_address || !treasury_address) {
    throw new Error('missing_required_fields')
  }

  // 1) Compose image
  const imageBuf  = await composeImage(traits)
  const imageHash = crypto.createHash('sha256').update(imageBuf).digest('hex')

  // 2) Upload image to IPFS (Pinata)
  const img = await uploadImage(imageBuf, `og-${imageHash.slice(0, 8)}.png`)

  // 3) Build + upload metadata
  const mintNumber = await nextMintNumber()
  const metadata   = buildMetadata({
    traits,
    mintNumber,
    imageIpfs:  img.ipfs,
    imageHttps: img.https,
    isGolden:   false,
  })
  const metaHash = crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex')
  const meta     = await uploadMetadata(metadata)

  // 4) Mint NFT to treasury wallet
  const nftWalletId = await getNftWalletId()
  const mintRes = await rpc('nft_mint_nft', {
    wallet_id:          nftWalletId,
    royalty_address:    treasury_address,
    target_address:     treasury_address,            // mint to treasury, then offer to user
    uris:               [img.https, img.ipfs],       // primary + fallback
    hash:               imageHash,
    meta_uris:          [meta.https, meta.ipfs],
    meta_hash:          metaHash,
    royalty_percentage: royalty_percent * 100,        // basis points (10000 = 100%)
    edition_number:     mintNumber,
    edition_total:      500,
    did_id:             process.env.OG_COLLECTION_DID,
    fee:                Number(process.env.MINT_FEE_MOJOS ?? 100),
  })

  // Chia returns launcher_id either as `nft_id` or in `spend_bundle`
  const launcherIdRaw = mintRes.nft_id
                     ?? mintRes.spend_bundle?.coin_spends?.[0]?.coin?.parent_coin_info
  if (!launcherIdRaw) throw new Error('mint_returned_no_nft_id')

  const launcherIdHex = launcherIdRaw.replace(/^0x/, '')

  // 5) Wait for confirmation
  await waitForNftConfirmation(nftWalletId, launcherIdHex, 60_000)

  // 6) Build offer: treasury offers NFT, requests price_xch_mojos XCH
  //    Offer dict: launcher_id_hex -> -1 (giving), wallet_id 1 (XCH) -> +mojos (receiving)
  const offerRes = await rpc('create_offer_for_ids', {
    offer: {
      [launcherIdHex]: -1,
      1:               price_xch_mojos,
    },
    fee:           0,
    validate_only: false,
    driver_dict:   {},
  })

  return {
    nft_id: launcherIdHex,
    offer:  offerRes.offer,
  }
}

// ─── Mint number counter ─────────────────────────────────────────────────────
// Production: store in Postgres/Redis. Here: env-seeded in-process counter.
let _mintCounter = 0
async function nextMintNumber() {
  if (_mintCounter === 0) _mintCounter = Number(process.env.MINT_START_NUMBER ?? 51)
  return _mintCounter++
}

// ─── Confirmation polling ────────────────────────────────────────────────────
async function waitForNftConfirmation(walletId, launcherIdHex, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const nfts = await rpc('nft_get_nfts', { wallet_id: walletId, start_index: 0, num: 50 })
      const hit = (nfts.nft_list ?? []).some(n =>
        (n.launcher_id ?? '').replace(/^0x/, '') === launcherIdHex
      )
      if (hit) return
    } catch { /* keep polling */ }
    await new Promise(r => setTimeout(r, 3000))
  }
  console.warn('[mint] confirmation timeout for', launcherIdHex)
  // Soft fail: offer creation may still succeed since the wallet sees the coin
}
