# ChocoTaco Signer

The on-demand NFT minting service. Sits between your Cloudflare Worker and a Chia full node + wallet. Composes images, pins to IPFS, mints NFTs with user-chosen traits, builds offers.

This is the only piece of the system that needs persistent infrastructure.
Everything else (Vercel + Cloudflare Worker) is serverless.

> **You do NOT need a Chia full node.** Just a wallet, which syncs in minutes
> on a $5/mo VPS. See "Setup" below for the actual requirements.

---

## What it does

```
User clicks mint
       ↓
Vercel frontend → Cloudflare Worker /api/mint → THIS service /build-mint
                                                         ↓
                                                  1. compose image from layers
                                                  2. pin to IPFS (NFT.Storage)
                                                  3. wallet RPC: nft_mint_nft
                                                  4. wallet RPC: create_offer_for_ids
                                                         ↓
                                                  returns offer string
                                                         ↓
                  user signs in Sage via WalletConnect chia_takeOffer
                                                         ↓
                                              NFT lands in user's wallet
```

---

## Setup (one-time)

### 1. Get a small VPS

You only need to run a Chia **wallet**, not a full node. The wallet syncs
through Chia's public full nodes, so resource requirements are tiny:

- Ubuntu 22.04
- 1-2 GB RAM
- 5 GB SSD
- 1 vCPU

A $5/mo Hetzner CX11 or any basic droplet is plenty.

### 2. Install Chia (wallet mode only)

```bash
curl -sL https://repo.chia.net/install.sh | sudo bash
chia init
```

### 3. Import treasury wallet

```bash
chia keys add
# paste your 24-word treasury mnemonic
```

### 4. Start the wallet (NOT the full node)

```bash
chia start wallet
chia wallet show
# wait ~5-10 minutes for the wallet to find and sync your coins
# note the NFT wallet id (usually 2), and CAT wallet id once funded
```

**You do NOT need `chia start full_node`.** Running a full node would
require ~500 GB disk + 24 hours of chain sync. The wallet alone uses
remote full nodes and is ready in minutes.

### 5. Get a Pinata JWT (free)

NFT.Storage stopped accepting new uploads in 2024. We use Pinata instead — same idea, free tier gives you 1 GB which is plenty for 500 NFTs at ~1 MB each.

- Sign up at [app.pinata.cloud](https://app.pinata.cloud)
- API Keys → New Key → enable `pinFileToIPFS` and `pinJSONToIPFS` scopes
- Copy the **JWT** (long string starting `eyJhbGc...`)
- Paste into `.env` as `PINATA_JWT`

For faster image loads on your site, also create a dedicated gateway in Pinata's dashboard (Settings → Gateways) and set `PINATA_GATEWAY` to that URL.

### 6. Get a MintGarden DID (collection identifier)

When you create your collection on MintGarden, it generates a DID. Copy it.

### 7. Upload art layers to the VPS

Put your trait layers in `art/`:

```
art/
  background/
    0.png  1.png  2.png  3.png  4.png
  shell/
    0.png  1.png  2.png  3.png  4.png
  filling/
    0.png  1.png  2.png  3.png  4.png
  sauce/
    0.png  1.png  2.png  3.png  4.png
  accessory/
    0.png  1.png  2.png  3.png  4.png
```

Each PNG should be 1500×1500 with transparent background. The composer stacks them in order: background → shell → filling → sauce → accessory.

### 8. Install + configure the signer

```bash
git clone https://github.com/astercast/ChocoTaco.git
cd ChocoTaco/signer
npm install
cp .env.example .env
nano .env   # fill in all the values
```

### 9. Run with PM2

```bash
sudo npm install -g pm2
pm2 start src/index.js --name chocotaco-signer
pm2 save
pm2 startup
```

### 10. Expose with Caddy or nginx (HTTPS required)

```caddy
choco-signer.yourdomain.com {
  reverse_proxy localhost:8080
}
```

### 11. Tell the Cloudflare Worker about it

```bash
cd ../workers
wrangler secret put SIGNER_URL
# paste https://choco-signer.yourdomain.com
```

---

## API contract

### POST `/build-mint`

Body:
```json
{
  "recipient_address": "xch1...",
  "traits": { "shell": 0, "filling": 2, "sauce": 1, "accessory": 4, "background": 0 },
  "treasury_address":  "xch1...",
  "price_xch_mojos":   500000000000,
  "royalty_percent":   25,
  "edition_total":     500
}
```

Response:
```json
{
  "nft_id": "nft1...",
  "offer":  "offer1qqz...long-bech32-string..."
}
```

### POST `/build-claim`

Body:
```json
{
  "recipient_address": "xch1...",
  "cat_amount_mojos":  1234,
  "cat_asset_id":      "46ec3dc2...532b15"
}
```

Response:
```json
{
  "offer": "offer1qqz..."
}
```

---

## Pre-minting the 50 Goldens (do before launch)

The Goldens aren't minted on-demand. You pre-mint them so they're already in the treasury when the launch starts.

```bash
# In Chia CLI, mint 50 NFTs with Golden: true metadata
for i in {1..50}; do
  chia wallet nft mint \
    -w 2 \
    -ra "$TREASURY_ADDRESS" \
    -ta "$TREASURY_ADDRESS" \
    -u "https://your-ipfs/golden-${i}.png" \
    -mu "https://your-ipfs/golden-${i}.json" \
    -rp 2500 \
    -en $i \
    -et 500 \
    -did "$OG_COLLECTION_DID"
done
```

Then create offer files for each Golden (treasury offers each one for 0.5 XCH) and insert them into the Worker's D1 `mint_reservations` table:

```bash
wrangler d1 execute chocotaco --command \
  "INSERT INTO mint_reservations (offer_hash, address, offer, created_at) VALUES ('nft1...', '', 'offer1...', $(date +%s))"
```

The Worker will randomly hand these out when users mint (10% chance per remaining mint).

---

## Troubleshooting

- **`no_nft_wallet`** → run `chia wallet show`, copy the NFT wallet id into `CHIA_NFT_WALLET_ID`
- **`chia_rpc_nft_mint_nft: insufficient funds`** → treasury wallet needs ~0.001 XCH per mint for blockchain fees
- **NFT.Storage rate limit** → free tier has 31 GB / month; consider Pinata if you outgrow it
- **Slow mints** → each `nft_mint_nft` waits for chain confirmation (~30s); use a queue for high-volume launches

---

## Alternative: skip this entirely

If running a Chia node feels like too much, you have two simpler paths:

**Option A: MintGarden Drop**
- Pre-mint all 500 NFTs (50 Golden + 450 standard) to treasury
- Create a Drop on MintGarden at 0.5 XCH each
- Set `VITE_MINT_MODE=mintgarden` and `VITE_MINTGARDEN_DROP_SLUG=chocotaco-og` in Vercel
- Users get random NFTs (no custom traits), but everything works with zero backend work

**Option B: Pre-mint with off-chain randomness**
- Pre-generate all 500 trait combinations + images + metadata
- Pre-mint all to treasury
- Use Mode B in the Worker with pre-built offer pool
- User picks traits in generator, but receives next available pre-minted match

The Mode A path is the easiest if you want to launch fast. The signer service is only required for **true on-demand minting** where users get NFTs with the exact traits they picked.
