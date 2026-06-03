/**
 * Chia WalletConnect integration
 *
 * Uses @walletconnect/sign-client v2 with Chia's CAIP-10 account format:
 *   chia:mainnet:{fingerprint}
 *
 * SETUP:
 *   npm install @walletconnect/sign-client @walletconnect/utils qrcode
 *   Set VITE_WALLETCONNECT_PROJECT_ID in .env.local
 *
 * Supported wallets: Chia Reference Wallet, Sage Wallet (both support WalletConnect)
 *
 * Key RPC methods available after session:
 *   chia_getWalletAddresses   → get xch bech32 address from puzzle hash
 *   chia_getTransaction       → fetch tx details
 *   chia_sendTransaction      → sign & push (for claiming via offer)
 *   chia_signCoinSpends       → sign arbitrary spend bundles
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChiaSession {
  fingerprint: string   // numeric wallet fingerprint
  address: string       // xch1… bech32 address
  chainId: string       // 'chia:mainnet' | 'chia:testnet'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string

export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID ?? 'chia:mainnet'

// Namespaces Chia wallets expose under WalletConnect — used inside connectWallet
// (kept here so it's easy to find / extend when adding new RPC methods)
export const REQUIRED_NAMESPACES = {
  chia: {
    methods: [
      'chia_getWalletAddresses',
      'chia_sendTransaction',
      'chia_signCoinSpends',
      'chia_takeOffer',
    ],
    chains:  [CHAIN_ID],
    events:  ['chainChanged', 'accountsChanged'],
  },
}

// ─── Connect ─────────────────────────────────────────────────────────────────

/**
 * Opens the WalletConnect QR modal and resolves once the user approves.
 * Returns a ChiaSession with the wallet fingerprint + bech32 address.
 *
 * PRODUCTION: uncomment the real implementation below and remove the mock.
 */
export async function connectWallet(): Promise<ChiaSession> {
  if (import.meta.env.DEV || !PROJECT_ID) {
    return mockSession()
  }

  /* ── Real implementation (uncomment when ready) ──────────────────────────
  const { SignClient } = await import('@walletconnect/sign-client')

  const client = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name:        'ChocoTaco',
      description: 'The sweetest memecoin on Chia',
      url:         window.location.origin,
      icons:       [`${window.location.origin}/taco.svg`],
    },
  })

  const { uri, approval } = await client.connect({ requiredNamespaces: REQUIRED_NAMESPACES })

  // Show QR code — in a real implementation you'd render a modal here
  if (uri) {
    console.log('[walletconnect] Pair URI:', uri)
    // TODO: render QR modal using 'qrcode' package or @walletconnect/modal
  }

  const session = await approval()

  // Extract fingerprint from CAIP-10 account string: "chia:mainnet:1234567890"
  const accounts    = Object.values(session.namespaces).flatMap(ns => ns.accounts)
  const fingerprint = accounts[0]?.split(':')[2] ?? ''

  // Get the bech32 address for this fingerprint
  const addrResult = await client.request<{ addresses: { address: string }[] }>({
    topic:   session.topic,
    chainId: CHAIN_ID,
    request: {
      method: 'chia_getWalletAddresses',
      params: { fingerprints: [Number(fingerprint)], index: 0, count: 1 },
    },
  })

  const address = addrResult.addresses?.[0]?.address ?? ''

  return { fingerprint, address, chainId: CHAIN_ID }
  ─────────────────────────────────────────────────────────────────────────── */

  throw new Error('WalletConnect not configured — set VITE_WALLETCONNECT_PROJECT_ID')
}

// ─── Mock (dev only) ──────────────────────────────────────────────────────────

async function mockSession(): Promise<ChiaSession> {
  await new Promise(r => setTimeout(r, 1100))
  return {
    fingerprint: '1234567890',
    address:     'xch1demo000000000000000000000000000000000000000000000000000000000',
    chainId:     'chia:mainnet',
  }
}
