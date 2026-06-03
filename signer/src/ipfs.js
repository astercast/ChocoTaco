/**
 * IPFS pinning via NFT.Storage (free tier)
 *
 * Get a free API token at https://nft.storage
 * Set NFT_STORAGE_KEY env var.
 */
import { NFTStorage, File } from 'nft.storage'

const client = new NFTStorage({ token: process.env.NFT_STORAGE_KEY ?? '' })

/** Upload a PNG buffer, return ipfs:// URI */
export async function uploadImage(buffer, filename = 'image.png') {
  const cid = await client.storeBlob(new File([buffer], filename, { type: 'image/png' }))
  return `ipfs://${cid}`
}

/** Upload metadata JSON, return ipfs:// URI */
export async function uploadMetadata(metadata) {
  const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  const cid  = await client.storeBlob(blob)
  return `ipfs://${cid}`
}
