/**
 * Chia full-node wallet RPC client
 *
 * Reads cert + key from your local Chia install (chia-ssca/wallet).
 * If you're on a fresh server, the paths are usually:
 *   ~/.chia/mainnet/config/ssl/wallet/private_wallet.crt
 *   ~/.chia/mainnet/config/ssl/wallet/private_wallet.key
 *
 * RPC docs: https://docs.chia.net/wallet-rpc/
 */
import fetch from 'node-fetch'
import fs from 'fs'
import https from 'https'

const CERT = fs.readFileSync(process.env.CHIA_CERT_PATH ?? `${process.env.HOME}/.chia/mainnet/config/ssl/wallet/private_wallet.crt`)
const KEY  = fs.readFileSync(process.env.CHIA_KEY_PATH  ?? `${process.env.HOME}/.chia/mainnet/config/ssl/wallet/private_wallet.key`)
const RPC_URL = process.env.CHIA_RPC_URL ?? 'https://localhost:9256'

const agent = new https.Agent({ cert: CERT, key: KEY, rejectUnauthorized: false })

/**
 * Call any wallet RPC method.
 * Example: rpc('nft_mint_nft', { wallet_id: 2, royalty_address, ... })
 */
export async function rpc(method, params = {}) {
  const res = await fetch(`${RPC_URL}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
    agent,
  })
  const data = await res.json()
  if (!data.success) {
    throw new Error(`chia_rpc_${method}: ${data.error ?? 'unknown'}`)
  }
  return data
}

/** Get the NFT wallet ID for the OG collection */
export async function getNftWalletId() {
  if (process.env.CHIA_NFT_WALLET_ID) return Number(process.env.CHIA_NFT_WALLET_ID)
  const wallets = await rpc('get_wallets', { type: 10 })
  const nftWallet = wallets.wallets?.[0]
  if (!nftWallet) throw new Error('no_nft_wallet')
  return nftWallet.id
}

/** Get the CAT wallet ID for $🍫🌮 */
export async function getCatWalletId(assetId) {
  const wallets = await rpc('get_wallets', { type: 6 })  // CAT wallet type
  for (const w of wallets.wallets ?? []) {
    const info = await rpc('cat_get_asset_id', { wallet_id: w.id })
    if (info.asset_id === assetId) return w.id
  }
  throw new Error(`no_cat_wallet_for_${assetId}`)
}
