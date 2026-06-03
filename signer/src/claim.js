/**
 * Build a $🍫🌮 (CHOCO CAT) claim offer
 *
 * Treasury offers `cat_amount_mojos` of CHOCO, requests 1 mojo XCH
 * (the 1 mojo is a placeholder so the offer is well-formed).
 */
import { rpc, getCatWalletId } from './chia.js'

export async function buildClaimOffer(body) {
  const { recipient_address, cat_amount_mojos, cat_asset_id } = body
  if (!recipient_address || !cat_amount_mojos || !cat_asset_id) {
    throw new Error('missing_required_fields')
  }

  const catWalletId = await getCatWalletId(cat_asset_id)

  // The offer dict: positive numbers = receiving, negative = giving
  // We GIVE cat_amount_mojos CHOCO (key = wallet_id), RECEIVE 1 mojo XCH (key = 'xch')
  const offerRes = await rpc('create_offer_for_ids', {
    offer: {
      [catWalletId]: -Number(cat_amount_mojos),  // giving CHOCO
      'xch':          1,                          // requesting 1 mojo XCH back
    },
    fee:           0,
    validate_only: false,
    driver_dict:   {},
  })

  return { offer: offerRes.offer }
}
