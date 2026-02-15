---
name: marketplace-order-automation
description: Automate order management for marketplaces like Shopee, Tokopedia, and TikTok Shop. Use when Gemini CLI needs to implement, troubleshoot, or understand integrations including OAuth 2.0 authentication, webhook processing, and AI-driven chat responses for these platforms.
---

# Marketplace Order Automation

This skill provides expert guidance and reusable resources for integrating and automating online store platforms, specifically focusing on Shopee, Tokopedia, and TikTok Shop.

## Core Workflows

### 1. Connecting a New Marketplace
To connect a store, you must implement the OAuth 2.0 flow:
- **Shopee**: Redirect to Partner Auth URL with `partner_id`, `partner_key`, and `redirect_url`.
- **Tokopedia**: Use `client_id`, `client_secret`, and `app_id` to obtain an `access_token`.
- **TikTok Shop**: Redirect to Auth URL using `app_key` and `app_secret`.

### 2. Handling Incoming Webhooks
Webhooks provide real-time notifications for new orders and status updates.
- **Verification**: Always verify the digital signature in the request header to ensure authenticity.
- **Parsing**: Extract order ID, buyer details, product items, shipping method, and total amount.
- **Forwarding**: Send the parsed details to the configured WhatsApp destination (Warehouse/Supplier).

### 3. AI-Driven Chat Automation
Automate customer interactions using AI (OpenAI/Gemini).
- **Context**: Use the `aiKnowledgeEssay` to provide store-specific knowledge.
- **Platform Awareness**: Ensure the AI knows which marketplace it is responding to (e.g., "Shopee Sales Assistant").

## Platform References
For platform-specific technical details, refer to:
- [tiktok_shop.md](references/tiktok_shop.md): Order API, Webhook verification, and event types for TikTok Shop.
- [tokopedia.md](references/tokopedia.md): OAuth, IP whitelisting, and webhook signatures for Tokopedia.
- [shopee.md](references/shopee.md): Partner API, webhook push URLs, and auth flows for Shopee.
- [shopauto_implementation.md](references/shopauto_implementation.md): Instructions for adding these platforms to the `shopauto` React/Supabase project.

## Verification Tools
Use the provided scripts to test signature verification:
- `scripts/verify_tiktok_signature.cjs`: Verify TikTok Shop webhook signatures.
- `scripts/verify_tokopedia_signature.cjs`: Verify Tokopedia webhook signatures.
