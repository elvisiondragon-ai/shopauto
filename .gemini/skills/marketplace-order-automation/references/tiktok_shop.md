# TikTok Shop Integration Reference

## Authentication
TikTok Shop uses OAuth 2.0.
- **Base URL**: `https://auth.tiktok-shop.com/api/v2/shop/auth`
- **Required Parameters**: `app_key`, `state` (optional).
- **Token Exchange**: Exchange `code` for `access_token` and `refresh_token` via `/api/v2/token/get`.

## Order Management
- **Retrieve Order Details**: `GET /api/v2/order/detail`
- **Get Order List**: `GET /api/v2/order/list`
- **Fulfillment**: Use `/api/v2/order/ship` to update shipping status.

## Webhooks
TikTok Shop sends real-time notifications via HTTP POST.
- **Header**: `Authorization` (contains the signature).
- **Signature Calculation**: 
  - Algorithm: HMAC-SHA256
  - Secret: `app_secret`
  - Payload: Concatenation of `app_key`, `timestamp`, and the raw request body.

### Event Types
- `ORDER_STATUS_UPDATE`: Triggered when an order status changes.
- `ORDER_PAID`: Triggered when a buyer completes payment.

## Security
- All webhook URLs must be HTTPS.
- TLS v1.2+ is required.
- Response must be HTTP 200 within a few seconds.
