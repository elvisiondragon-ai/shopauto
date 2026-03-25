<?php
/**
 * ShopAuto Webhook Handler (PHP Replacement for Supabase)
 * This script receives order notifications from Marketplaces (Shopee, TikTok, Tokopedia)
 * and forwards them to the WhatsApp API.
 */

header('Content-Type: application/json');

// 1. Configuration - Update these with your real values
$WAWP_INSTANCE_ID = "5E5FA7591BBB";
$WAWP_ACCESS_TOKEN = "EKOSp9NBSuNVVU";
$WAWP_API_URL = "https://wawp.net/wp-json/awp/v1/send";
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
$targetChatId = strpos($DESTINATION_NUMBER, '@') !== false ? $DESTINATION_NUMBER : $DESTINATION_NUMBER . "@c.us";
$finalUrl = $WAWP_API_URL . "?instance_id=" . $WAWP_INSTANCE_ID . "&access_token=" . $WAWP_ACCESS_TOKEN . "&chatId=" . $targetChatId . "&message=" . urlencode($messageText);

$ch = curl_init($finalUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 5. Respond back to Marketplace
http_response_code($httpCode);
echo $response;
