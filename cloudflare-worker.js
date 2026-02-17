/**
 * ShopAuto Cloudflare Worker - Webhook Middleman
 * 
 * Instructions:
 * 1. Create a new "Worker" in your Cloudflare Dashboard.
 * 2. Paste this code into the editor.
 * 3. Deploy and use the generated .workers.dev URL as your webhook URL.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Please use POST." }), { 
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      const data = await request.json();

      // --- CONFIGURATION ---
      const WA_API_URL = "http://103.150.101.58:2341/api/message";
      const WA_TOKEN = "4f46b29bf8e0e4443d9e631007324b29199443786d8b4befab3a2d529208583f";
      const DEFAULT_DESTINATION = "6281383838013";

      // --- MESSAGE FORMATTING ---
      // Detect platform and Order ID
      let platform = "Marketplace";
      let orderId = "Unknown";

      if (data.order_sn) {
        platform = "Shopee";
        orderId = data.order_sn;
      } else if (data.order_id) {
        platform = data.shop_id ? "Tokopedia" : "TikTok Shop";
        orderId = data.order_id;
      }

      const messageText = `🔔 *PESANAN BARU (${platform})*

` +
                          `🆔 *Order ID:* ${orderId}
` +
                          `🕒 *Waktu:* ${new Date().toLocaleString('id-ID')}

` +
                          `Silakan cek dashboard ShopAuto untuk detail pengiriman.`;

      // --- FORWARD TO WHATSAPP VPS ---
      const waResponse = await fetch(WA_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          token: WA_TOKEN,
          to: DEFAULT_DESTINATION,
          message: messageText
        })
      });

      const result = await waResponse.json();

      // Return response with CORS headers
      return new Response(JSON.stringify({
        status: "success",
        forwarded: true,
        wa_response: result
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ 
        status: "error", 
        message: err.message 
      }), { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
