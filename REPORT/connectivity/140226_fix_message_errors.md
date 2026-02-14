# Report: WhatsApp Messaging Error Analysis & Fixes
**Date:** 14 February 2026
**Topic:** Connectivity / Messaging Errors

## Context
Users were experiencing `500 Internal Server Error` and `No LID for user` errors when attempting to send WhatsApp messages (Test Message feature). This prevented the automation from successfully forwarding order details to warehouses.

## Issues Identified

### 1. Incorrect Number Format (`No LID for user`)
- **Symptoms**: The server responded with "No LID for user".
- **Root Cause**: The WhatsApp engine (whatsapp-web.js) requires numbers in strict international format (e.g., `628...`). If a user entered a local number starting with `0` (e.g., `0812...`), the server could not resolve the internal Linked Device ID (LID) for that contact.
- **Result**: Crash on the VPS side, returning a 500 error to the client.

### 2. Multi-User Identification Failure
- **Symptoms**: `500 Internal Server Error`.
- **Root Cause**: With the move to unlimited User Senders, the VPS required a `sender` field in the POST payload to know which WhatsApp session to use. The client was previously sending a generic payload without the `user.id`.
- **Result**: The VPS didn't know which account to send from and aborted the request.

### 3. Insecure/Unreliable Transport
- **Symptoms**: `400 Bad Request` during connection.
- **Root Cause**: Using `polling` transport caused session mismatch errors. Restricting to `websocket` solved the connection, but previous logic was too aggressive in clearing QR codes during initialization.

## Solutions Implemented

### 1. Robust Number Sanitization & Formatting
- **Code Change**: Updated `handleTestWaMessage` to:
    1. Strip all non-digit characters (`\D`).
    2. Detect if the number starts with `0`.
    3. Automatically convert `0` to `62` (e.g., `0812` -> `62812`).
- **Outcome**: The VPS now always receives valid international numbers, eliminating the "No LID" error.

### 2. Multi-User Payload Integration
- **Code Change**: Added `sender: user.id` to the `send-message` payload.
- **Outcome**: The VPS now correctly identifies the specific user's WhatsApp session for every message sent.

### 3. Improved Error Feedback
- **Code Change**: Added Indonesian error mapping for technical VPS errors.
- **Outcome**: Users now see "Nomor tujuan tidak terdaftar di WhatsApp atau format salah" instead of technical logs.

### 4. UI Visibility
- **Code Change**: Added "Data Pengirim" and "Penerima" indicators under the activation switch.
- **Outcome**: Users can immediately see which sender is active and which number is being targeted.

## Verification
- **Build**: Successful.
- **Test Message**: Logic verified to format numbers correctly before hitting the API.
