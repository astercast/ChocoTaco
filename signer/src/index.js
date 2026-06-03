/**
 * ChocoTaco signer sidecar — on-demand NFT mint + claim offer builder
 *
 * Two endpoints:
 *   POST /build-mint    body: { recipient_address, traits, ... }
 *                       returns: { offer, nft_id }
 *   POST /build-claim   body: { recipient_address, cat_amount_mojos, cat_asset_id }
 *                       returns: { offer }
 *
 * This server must run on a host where you also run `chia start wallet`
 * with your treasury mnemonic loaded. The wallet RPC listens on
 * https://localhost:9256 by default.
 */
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { buildMintOffer } from './mint.js'
import { buildClaimOffer } from './claim.js'

const app = express()
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? '*' }))
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, service: 'chocotaco-signer' }))

// ─── /build-mint ─────────────────────────────────────────────────────────────

app.post('/build-mint', async (req, res) => {
  try {
    const result = await buildMintOffer(req.body)
    res.json(result)
  } catch (err) {
    console.error('[build-mint]', err)
    res.status(500).json({ error: err.message ?? 'mint_failed' })
  }
})

// ─── /build-claim ────────────────────────────────────────────────────────────

app.post('/build-claim', async (req, res) => {
  try {
    const result = await buildClaimOffer(req.body)
    res.json(result)
  } catch (err) {
    console.error('[build-claim]', err)
    res.status(500).json({ error: err.message ?? 'claim_failed' })
  }
})

const PORT = process.env.PORT ?? 8080
app.listen(PORT, () => console.log(`signer listening on :${PORT}`))
