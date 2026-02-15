# ShopAuto Implementation Guide

## Frontend Integration (`shopauto.tsx`)

### 1. State Management
Add state variables for the new platforms:
```typescript
const [isTokopediaConnected, setIsTokopediaConnected] = useState(false);
const [isTikTokConnected, setIsTikTokConnected] = useState(false);
// ... store names, IDs, etc.
```

### 2. UI Updates
Add cards or sections in the "Dashboard" or a new "Integrations" tab for Tokopedia and TikTok Shop.
- Use `Button` to initiate connection flows.
- Use `Badge` to show connection status.

### 3. Settings Persistence
Update `saveSettings` to include the new platform details in the `shopauto_settings` JSON column in Supabase.

## Backend Integration (Supabase Edge Function)

### 1. Webhook Handler
Update the `shopauto-handler` function to distinguish between Shopee, Tokopedia, and TikTok payloads.
- **Shopee**: Check for `shop_id` or specific Shopee headers.
- **TikTok**: Check for `app_key` or `Authorization` signature header.
- **Tokopedia**: Check for Tokopedia-specific payload structure.

### 2. Signature Verification
Implement verification logic for each platform to ensure requests are legitimate.

### 3. Forwarding to WhatsApp
- Parse the platform-specific payload into a unified "Order Detail" object.
- Use the `whatsappDestination` from user settings.
- Call the WhatsApp VPS API (`/send-message`) to notify the warehouse.

## AI Engine Updates
- Update the AI prompt to include the marketplace name so the AI can tailor its response style (e.g., "Anda adalah Asisten Penjualan Tokopedia...").
