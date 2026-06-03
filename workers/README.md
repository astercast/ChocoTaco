# ChocoTaco Worker

The backend for ChocoTaco. Runs on Cloudflare Workers + D1.

## What it does

- **Cron (Sun 17:00 UTC)** — reads every known holder's on-chain holdings, computes Cocoa Units, calculates each holder's share of the weekly emission, writes `snapshots` table
- **`GET /api/snapshot/:address`** — returns unclaimed CHOCO total + next snapshot time
- **`POST /api/claim`** — builds a Chia offer (treasury → CHOCO out) for user to take
- **`GET /api/network-stats`** — minted count, vault remaining, holder count
- **`POST /api/social/verify`** — verifies a #ChocotacoFactory tweet, grants +15 weekly points
- **`POST /api/mint/reserve`** — (mode B only) hands out pre-built mint offers

## Setup

```bash
cd workers
npm install
npm install -g wrangler        # if you don't have it
wrangler login
```

### 1. Create D1 database

```bash
wrangler d1 create chocotaco
# copy the database_id into wrangler.toml
npm run db:init                # runs schema.sql
```

### 2. Fill in wrangler.toml

- `OG_COLLECTION_ID`     — your MintGarden collection ID
- `TREASURY_ADDRESS`     — xch1… wallet that holds 1011 CHOCO + receives royalties
- `ALLOWED_ORIGIN`       — your site's deploy URL (e.g. `https://chocotaco.xyz`)
- `database_id` (in `[[d1_databases]]`)

### 3. Set secrets

```bash
wrangler secret put TREASURY_MNEMONIC    # 24-word seed of the signer wallet
wrangler secret put SPACESCAN_KEY        # optional, for higher rate limits
wrangler secret put SIGNER_URL           # URL of your offer-signer sidecar (see below)
```

### 4. Deploy

```bash
npm run deploy
```

Worker URL will be `https://chocotaco-api.<your-subdomain>.workers.dev`.
Paste it into the frontend `.env.local`:

```
VITE_WORKER_URL=https://chocotaco-api.<your-subdomain>.workers.dev
```

## Offer signer sidecar

Cloudflare Workers can't directly use the `chia-blockchain` Python or Node libraries
to sign offers from a mnemonic. You need a tiny sidecar service.

Recommended: deploy this to **Fly.io**, **Railway**, or a $5 VPS:

```js
// signer/index.js — needs two endpoints
import express from 'express'
import { createCATOffer, mintNftFromCollection } from 'chia-rpc-wrapper'  // pick any: @rigidity/chia, chia-rpc, custom

const app = express()
app.use(express.json())

// (1) /api/claim hits this — build a CHOCO offer for the claim
app.post('/build-claim', async (req, res) => {
  const { recipient_address, cat_amount_mojos, cat_asset_id } = req.body
  const offer = await createCATOffer({
    mnemonic:         process.env.TREASURY_MNEMONIC,
    catAssetId:       cat_asset_id,
    catAmountMojos:   cat_amount_mojos,
    recipientAddress: recipient_address,
  })
  res.json({ offer })
})

// (2) /api/mint hits this — mint a new OG NFT with user's chosen traits
app.post('/build-mint', async (req, res) => {
  const {
    recipient_address, traits, og_collection_id,
    treasury_address, price_xch_mojos, royalty_percent, edition_total,
  } = req.body

  // a) Compose metadata JSON from traits, upload to IPFS (or R2)
  const metadata = composeMetadata(traits, edition_total)
  const metadataUri = await uploadToIpfs(metadata)

  // b) Mint the NFT to treasury with 25% royalty puzzle hash, then offer it
  //    for price_xch_mojos. Treasury_address receives the XCH (which you
  //    then immediately seed into TibetSwap LP).
  const { offer, nft_id } = await mintNftFromCollection({
    mnemonic:         process.env.TREASURY_MNEMONIC,
    collectionId:     og_collection_id,
    metadataUri,
    royaltyAddress:   treasury_address,
    royaltyPercent:   royalty_percent,
    priceXchMojos:    price_xch_mojos,
    recipient:        recipient_address,
  })
  res.json({ offer, nft_id })
})

app.listen(8080)
```

Once that's running at e.g. `https://choco-signer.fly.dev`, set:

```bash
wrangler secret put SIGNER_URL
# paste https://choco-signer.fly.dev
```

## Testing locally

```bash
npm run dev               # starts Worker on localhost:8787
npm run db:local          # initializes local D1 SQLite db
```

In another terminal, hit endpoints:

```bash
curl http://localhost:8787/health
curl http://localhost:8787/api/snapshot/xch1...
```

## Cron testing

The Sunday cron runs automatically once deployed. To test manually:

```bash
curl https://chocotaco-api.<your-subdomain>.workers.dev/__scheduled
```
