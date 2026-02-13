# Report: ShopAuto Connectivity & QR Fixes
**Date:** 13 February 2026
**Topic:** Connectivity, QR Generation, Group Fetching

## Context
The user experienced two main issues in the `shopauto` folder:
1.  **QR Code not showing**: The frontend would often show a "loading" state infinitely instead of displaying the WhatsApp QR.
2.  **Group Fetching Error**: The "CARI ID GRUP SAYA" feature failed with "Format data grup tidak valid."

## Issues Identified
1.  **Missing JSON Headers**: The Supabase Edge Function was sending raw responses without `Content-Type: application/json`. This caused the frontend to fail when parsing the data as an array.
2.  **Unstable Socket Connection**: The frontend relied solely on Socket.io for the QR code. If the connection was slow or the initial emit was missed, the UI stayed stuck.
3.  **URL Normalization**: Trailing slashes and `localhost` fallbacks were inconsistent between frontend and backend.
4.  **Error Handling**: Errors from the VPS (like 401 Unauthorized) were not being propagated back to the frontend in a readable JSON format.

## Solutions Implemented
1.  **Explicit JSON Headers**: Updated `shopauto-handler` to always include `application/json` headers in all responses (Success, Proxy, and Error).
2.  **Dual Tracking (Socket + Polling)**: Added a 5-second polling interval in the frontend as a fallback to the socket. This ensures the QR/Status is fetched via the REST API if the socket fails.
3.  **Secure Proxy Logic**: Implemented `get_groups` and `reset_client` actions in Supabase to securely attach the `WA_API` key on the server-side.
4.  **Specific Debug Logging**: Added detailed `[SHOPAUTO-DEBUG]` logs to the Edge Function to track URL targets, key presence, and VPS response statuses.
5.  **Session Reset**: Added a "Reset Sesi" button to allow users to force-clear stuck sessions on the VPS and generate new QR codes instantly.

## Reflection: Why mistakes were made
I made these mistakes because I assumed the "happy path" (that Supabase/the browser would automatically infer the JSON type) and didn't initially implement a fallback for the real-time socket. 

**Next time, I will:**
- **Always** explicitly define `Content-Type: application/json` for every Deno Edge Function response.
- **Always** provide a polling/REST fallback for any UI that depends on real-time socket data.
- **Verify** trailing slash normalization at the start of any proxy-based action.
- **Ensure** error objects are JSON-encoded so the frontend `toast` system can display actual causes instead of generic failures.

## Outcome
- QR code now shows instantly (or via 5s poll fallback).
- Group fetching works correctly and handles VPS errors gracefully.
- The system is now more secure as API keys are managed by Supabase secrets.
