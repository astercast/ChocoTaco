/**
 * IPFS pinning via Pinata
 *
 * Get a free API key at https://app.pinata.cloud (1 GB free, perfect for 500 NFTs).
 * Set PINATA_JWT env var to the JWT token from the API Keys page.
 */
import fetch from 'node-fetch'
import FormData from 'form-data'

const JWT = process.env.PINATA_JWT ?? ''
const PUBLIC_GATEWAY = process.env.PINATA_GATEWAY ?? 'https://gateway.pinata.cloud'

function ensureJwt() {
  if (!JWT) throw new Error('Missing PINATA_JWT env var')
}

/** Upload a PNG buffer, return { cid, ipfs (ipfs://), https (gateway URL) } */
export async function uploadImage(buffer, filename = 'image.png') {
  ensureJwt()
  const form = new FormData()
  form.append('file', buffer, { filename, contentType: 'image/png' })
  form.append('pinataMetadata', JSON.stringify({ name: filename }))

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method:  'POST',
    headers: { Authorization: `Bearer ${JWT}` },
    body:    form,
  })
  if (!res.ok) throw new Error(`pinata_image_${res.status}: ${await res.text()}`)
  const data = await res.json()
  const cid  = data.IpfsHash
  return {
    cid,
    ipfs:  `ipfs://${cid}`,
    https: `${PUBLIC_GATEWAY}/ipfs/${cid}`,
  }
}

/** Upload metadata JSON, return { cid, ipfs, https } */
export async function uploadMetadata(metadata) {
  ensureJwt()
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${JWT}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      pinataContent:  metadata,
      pinataMetadata: { name: `${metadata.name ?? 'metadata'}.json` },
    }),
  })
  if (!res.ok) throw new Error(`pinata_json_${res.status}: ${await res.text()}`)
  const data = await res.json()
  const cid  = data.IpfsHash
  return {
    cid,
    ipfs:  `ipfs://${cid}`,
    https: `${PUBLIC_GATEWAY}/ipfs/${cid}`,
  }
}
