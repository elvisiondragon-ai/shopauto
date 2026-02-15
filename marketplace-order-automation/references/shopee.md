# Shopee Integration Reference

## Authentication
Shopee uses a Partner Auth flow.
- **Auth URL**: `https://partner.shopeemobile.com/api/v1/shop/auth_partner`
- **Parameters**: `partner_id`, `token` (HMAC-SHA256 of `partner_id` + `partner_key` + `redirect_url`), `redirect_url`.

## Order Management
- **Get Order Details**: `POST /api/v2/order/get_order_detail`
- **Get Order List**: `POST /api/v2/order/get_order_list`
- **Handle Shipping**: `POST /api/v2/logistics/ship_order`

## Webhooks
- **Configuration**: Set in Shopee Seller Centre > Webhook Settings.
- **Verification**: 
  - Header: `X-Shopee-Signature`
  - Calculation: HMAC-SHA256 of the full request body using `partner_key` as the secret.

## Implementation Details
- Shopee's API v2 requires a `timestamp`, `partner_id`, `shop_id`, and `access_token` for most calls.
- Signs every request using a specific algorithm involving the API path and parameters.
