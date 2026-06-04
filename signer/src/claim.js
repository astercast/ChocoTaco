/**
 * Build a $🍫🌮 (CHOCO CAT) claim offer
 *
 * Treasury offers `cat_amount_mojos` of CHOCO, requests 1 mojo XCH
 * (the 1 mojo is a placeholder so the offer is well-formed).
 *
 * The user takes this offer via WalletConnect's `chia_takeOffer` RPC,
 * losing 1 mojo and gaining the CHOCO.
 */
import { rpc, getCatWalletId } from './chia.js'

export async function buildClaimOffer(body) {
  const { recipient_address, cat_amount_mojos, cat_asset_id } = body
  if (!recipient_address || !cat_amount_mojos || !cat_asset_id) {
    throw new Error('missing_required_fields')
  }

  const catWalletId = await getCatWalletId(cat_asset_id)

  // Offer dict: treasury wallet's CAT wallet GIVES (-), XCH wallet (1) RECEIVES (+)
  const offerRes = await rpc('create_offer_for_ids', {
    offer: {
      [catWalletId]: -Math.floor(Number(cat_amount_mojos)),
      1:              1,   // 1 mojo XCH placeholder
    },
    fee:           0,
    validate_only: false,
    driver_dict:   {},
  })

  return { offer: offerRes.offer }
}
