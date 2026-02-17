<?php
/**
 * ShopAuto Webhook Handler (PHP Replacement for Supabase)
 * This script receives order notifications from Marketplaces (Shopee, TikTok, Tokopedia)
 * and forwards them to the WhatsApp API.
 */

header('Content-Type: application/json');

// 1. Configuration - Update these with your real values
$WA_API_URL = "http://103.150.101.58:2341/api/message";
$WA_TOKEN = "4f46b29bf8e0e4443d9e631007324b29199443786d8b4befab3a2d529208583f";
$DESTINATION_NUMBER = "6281383838013"; // Default destination if not provided

// 2. Get incoming payload
$rawPayload = file_get_contents('php://input');
$data = json_decode($rawPayload, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
    exit;
}

// 3. Simple logic to format message based on platform
// This is a basic example, you can expand it for Shopee/TikTok/Tokopedia specific fields
$platform = "Marketplace";
$orderId = isset($data['order_id']) ? $data['order_id'] : (isset($data['order_sn']) ? $data['order_sn'] : 'Unknown');

$messageText = "🔔 *PESANAN BARU ($platform)*

";
$messageText .= "Order ID: $orderId
";
$messageText .= "Detail: " . json_encode($data) . "

";
$messageText .= "Silakan cek dashboard ShopAuto anda.";

// 4. Forward to WhatsApp API
$waPayload = [
    "token" => $WA_TOKEN,
    "to" => $DESTINATION_NUMBER,
    "message" => $messageText
];

$ch = curl_init($WA_API_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($waPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 5. Respond back to Marketplace
http_response_code($httpCode);
echo $response;
