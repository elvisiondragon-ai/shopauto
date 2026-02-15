# Tokopedia Integration Reference

## Authentication
Tokopedia uses OAuth 2.0 Client Credentials or Authorization Code flow.
- **Credentials**: `client_id`, `client_secret`, `app_id`.
- **Token Endpoint**: `https://accounts.tokopedia.com/token?grant_type=client_credentials`
- **Headers**: `Authorization: Basic [Base64(client_id:client_secret)]`

## Order Management
- **Order Notification**: Webhook payload contains `order_id`.
- **Get Order Details**: `GET /v2/order/[order_id]/fs/[fs_id]`
- **Accept Order**: `POST /v1/order/[order_id]/accept`

## Webhooks
- **Configuration**: Set in Tokopedia Developer Console.
- **Security**:
  - **IP Whitelisting**: You MUST whitelist your server IP in the Tokopedia console.
  - **Signature**: Some webhooks include a signature in the header to verify the payload.
- **Response**: Return HTTP 200 to acknowledge receipt.

## Constraints
- Tokopedia API is strictly rate-limited.
- Webhook endpoints must be publicly accessible but secured via IP whitelisting.
