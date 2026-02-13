# Report: WhatsApp Socket Connection & QR UI Fixes
**Date:** 14 February 2026
**Topic:** Connectivity / WhatsApp Integration

## Context
The application was experiencing `400 Bad Request` errors when attempting to connect to the WhatsApp Socket.io server on the VPS. Additionally, the QR code display was sometimes stale, and the UI contained unnecessary buttons and loading states that cluttered the user experience.

## Issues Identified
1. **Socket.io 400 Errors**: Caused by the `polling` transport failing to synchronize Session IDs (`sid`) or failing to upgrade to `websocket` due to strict server settings or stale client sessions.
2. **Stale QR Timer**: The expiration timer for the QR code was not consistently updating when new QR data was received via polling.
3. **UI Clutter**: The WhatsApp connection section had multiple "Reset" and "Retry" buttons that were redundant, along with a loading spinner that stayed active even when waiting for server initialization.

## Solutions Implemented
1. **Force Websocket Transport**: Updated `shopauto.tsx` to use `transports: ["websocket"]` and `upgrade: false`. This bypasses the polling phase entirely, which is the primary source of `400 Bad Request` errors in Socket.io.
2. **Session Isolation**: Added `forceNew: true` to the Socket.io configuration to ensure every connection attempt starts with a clean slate, ignoring any broken or stale sessions stored in the browser.
3. **QR Timer Restoration**: 
    - Re-enabled the `qrTimestamp` logic in both Socket.io listeners and the polling fallback.
    - Restored the visual countdown overlay (e.g., `40s`) on the QR code.
4. **UI Cleanup**:
    - Removed "Retry", "Reset View", and "Reset Sesi" buttons.
    - Removed the loading spinner and "Menghubungkan to VPS" text.
    - Updated the "Connected" state to show **"User Connected"** with a clear **"Logout"** button.
    - Implemented a clean placeholder box while waiting for the QR code to be generated.
5. **Robust Polling Fallback**: Ensured the polling interval correctly updates the `qrTimestamp` when it detects a new QR code from the `/status` endpoint.

## Results
The connection to the VPS is now direct and stable via WebSockets. The UI is cleaner, focusing only on the essential actions (Scan or Logout), and the QR code accurately reflects its remaining valid time.
