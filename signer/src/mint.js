/**
 * On-demand NFT mint
 *
 * Steps:
 *   1. Compose image from trait layers
 *   2. Upload image to IPFS
 *   3. Build CHIP-0007 metadata, upload to IPFS
 *   4. Call wallet RPC `nft_mint_nft` with metadata URI + royalty puzzle
 *   5. Call wallet RPC `create_offer_for_ids` to wrap as an offer:
 *        treasury offers NFT, requests 0.5 XCH
 *   6. Return offer string
 */
import { rpc, getNftWalletId } from './chia.js'
import { composeImage } from './compose.js'
import { uploadImage, uploadMetadata } from './ipfs.js'
import crypto from 'crypto'

const TRAIT_NAMES = {
  shell:      ['Crispy Gold', 'Soft Warm', 'Dark Choco', 'Rainbow', 'Ghost'],
  filling:    ['Classic Beef', 'Triple Cheese', 'Jalapeño', 'Pineapple', 'Void'],
  sauce:      ['Choco Drizzle', 'Gold Dust', 'Fire Sauce', 'Sour Cream', 'None'],
  accessory:  ['Crown', 'Sunglasses', 'Laser Eyes', 'Halo', 'None'],
  background: ['Choco Swirl', 'Caramel', 'Inferno', 'Neon', 'Void'],
}

function buildMetadata(traits, mintNumber, imageUri, isGolden = false) {
  return {
    format:      'CHIP-0007',
    name:        `ChocoTaco OG #${String(mintNumber).padStart(3, '0')}`,
    description: 'Factory Employee Badge. ChocoTaco — the sweetest memecoin on Chia.',
    minting_tool: 'chocotaco-signer/0.1',
    sensitive_content: false,
    series_number: mintNumber,
    series_total:  500,
    attributes: [
      { trait_type: 'Edition', value: 'OG' },
      { trait_type: 'Golden',  value: isGolden },
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
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

/**
 * @param body  {
 *   recipient_address,       // xch1...
 *   traits,                  // { shell, filling, sauce, accessory, background }
 *   og_collection_id,        // unused at runtime, kept for parity
 *   treasury_address,        // xch1... where the royalty + price XCH lands
 *   price_xch_mojos,         // 0.5 XCH = 500_000_000_000
 *   royalty_percent,         // 25
 *   edition_total,           // 500
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
  const imageBuf = await composeImage(traits)
  const imageHash = crypto.createHash('sha256').update(imageBuf).digest('hex')

  // 2) Upload image
  const imageUri = await uploadImage(imageBuf, `og-${imageHash.slice(0, 8)}.png`)

  // 3) Build + upload metadata
  const mintNumber = await nextMintNumber()
  const metadata   = buildMetadata(traits, mintNumber, imageUri, false)
  const metaUri    = await uploadMetadata(metadata)

  // 4) Mint the NFT to the treasury wallet
  const nftWalletId = await getNftWalletId()
  const mintRes = await rpc('nft_mint_nft', {
    wallet_id:        nftWalletId,
    royalty_address:  treasury_address,
    target_address:   treasury_address,             // mint to treasury first
    uris:             [imageUri.replace('ipfs://', 'https://nftstorage.link/ipfs/')],
    hash:             imageHash,
    meta_uris:        [metaUri.replace('ipfs://', 'https://nftstorage.link/ipfs/')],
    meta_hash:        crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex'),
    royalty_percentage: royalty_percent * 100,        // basis points; 25% = 2500
    edition_number:   mintNumber,
    edition_total:    500,
    did_id:           process.env.OG_COLLECTION_DID,  // collection DID
    fee:              0,
  })

  const nftId = mintRes.nft_id ?? mintRes.spend_bundle?.nft_id
  if (!nftId) throw new Error('mint_returned_no_nft_id')

  // Wait for confirmation (poll for ~30s)
  await waitForNftConfirmation(nftWalletId, nftId, 30_000)

  // 5) Create offer: treasury offers this NFT, requests price_xch_mojos XCH
  const offerRes = await rpc('create_offer_for_ids', {
    offer: {
      [nftId]:     -1,             // offering 1 of this NFT (negative = giving)
      'xch':       price_xch_mojos, // requesting price_xch_mojos mojos (positive = receiving)
    },
    fee:               0,
    validate_only:     false,
    driver_dict:       {},
  })

  return {
    nft_id: nftId,
    offer:  offerRes.offer,
  }
}

let _mintCounter = 0
async function nextMintNumber() {
  // Production: read from D1 via Worker, or use a Redis counter.
  // Here we use an in-process counter; restart-safe via env override.
  if (_mintCounter === 0) _mintCounter = Number(process.env.MINT_START_NUMBER ?? 51)  // Goldens are 1-50
  return _mintCounter++
}

async function waitForNftConfirmation(walletId, nftId, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const nfts = await rpc('nft_get_nfts', { wallet_id: walletId, start_index: 0, num: 50 })
      if (nfts.nft_list?.some(n => n.launcher_id === nftId)) return
    } catch {}
    await new Promise(r => setTimeout(r, 2000))
  }
  // Soft fail: return without throwing — offer creation may still succeed
  console.warn('[mint] confirmation timeout for', nftId)
}
