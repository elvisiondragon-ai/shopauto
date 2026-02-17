/**
 * SHOPAUTO SMART CLOUDFLARE WORKER MIDDLEMAN (v7 - Group Fetch Support)
 * 1. Uses correct domain (watzapp.web.id)
 * 2. Filters out "Self" messages and Status Updates
 * 3. Supports action: "fetch_groups" via POST (Proxy GET request)
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return new Response("Use POST", { status: 405, headers: corsHeaders });

    try {
      const data = await request.json();
      
      // --- CONFIGURATION ---
      const VPS_BASE_URL = "https://watzapp.web.id";
      const VPS_API_MESSAGE = `${VPS_BASE_URL}/api/message`;
      const VPS_API_GROUPS = `${VPS_BASE_URL}/api/group/fetch`; // New Endpoint
      
      const VPS_TOKEN = "4f46b29bf8e0e4443d9e631007324b29199443786d8b4befab3a2d529208583f";
      const DEFAULT_DESTINATION = "6281383838013";

      // --- NEW FEATURE: PROXY GROUP FETCH (CORS BYPASS) ---
      if (data.action === "fetch_groups") {
          const token = data.token || VPS_TOKEN; // Use provided token or default
          const targetUrl = `${VPS_API_GROUPS}?token=${token}`;
          
          const groupResponse = await fetch(targetUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
          });
          
          const resultText = await groupResponse.text();
          let jsonResult;
          try { jsonResult = JSON.parse(resultText); } catch(e) { jsonResult = { raw: resultText }; }
          
          return new Response(JSON.stringify(jsonResult), {
              status: groupResponse.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
      }

      // --- FILTERING LOGIC (Prevent Loop) ---
      
      // 1. Ignore Status Updates / Acks (e.g. "message sent", "read", "delivered")
      if (data.status || data.ack || (data.messages && data.type === "append")) {
          return new Response(JSON.stringify({ status: "ignored", reason: "status_update" }), { 
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
      }

      // 2. Ignore messages sent by ME (fromMe: true)
      const isFromMe = (d) => {
        if (d?.key?.fromMe === true) return true;
        if (d?.message?.key?.fromMe === true) return true;
        if (d?.data?.key?.fromMe === true) return true;
        return false;
      };

      if (isFromMe(data)) {
          return new Response(JSON.stringify({ status: "ignored", reason: "from_me" }), { 
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
      }

      // --- DETECT INCOMING DATA TYPE ---

      let messageText = "";
      let targetTo = DEFAULT_DESTINATION;
      let shouldSend = false;

      // CASE A: Manual "System" send from Frontend (Localhost)
      if (data.is_system_send) {
          targetTo = data.to || DEFAULT_DESTINATION;
          messageText = data.message;
          shouldSend = true;
      }
      // CASE B: Incoming WhatsApp Message (Real user chat)
      else if (data.key && !data.key.fromMe && (data.message || data.body)) {
         targetTo = DEFAULT_DESTINATION;
         const sender = data.pushName || data.notifyName || data.key.remoteJid.split('@')[0];
         const text = data.body || 
                      data.message?.conversation || 
                      data.message?.extendedTextMessage?.text || 
                      data.message?.imageMessage?.caption || 
                      "(Media/Other)";
         
         messageText = `💬 *PESAN WHATSAPP MASUK*\n\n` +
                       `👤 *Dari:* ${sender}\n` +
                       `📝 *Pesan:* ${text}\n\n` +
                       `_Penerusan via Cloudflare_`;
         shouldSend = true;
      } 
      // CASE C: Marketplace Order (Shopee/Tokopedia/TikTok)
      else if (data.order_sn || data.order_id) {
          targetTo = DEFAULT_DESTINATION;
          let platform = data.order_sn ? "Shopee" : (data.shop_id ? "Tokopedia" : "TikTok Shop");
          let orderId = data.order_sn || data.order_id;

          messageText = `🔔 *PESANAN BARU (${platform})*\n\n` +
                        `🆔 *Order ID:* ${orderId}\n` +
                        `🕒 *Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
                        `Silakan cek dashboard ShopAuto.`;
          shouldSend = true;
      }
      
      // --- DECISION ---
      if (!shouldSend) {
          return new Response(JSON.stringify({ status: "ignored", reason: "unknown_pattern" }), { 
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
      }

      // --- FORWARD TO VPS ---
      const waResponse = await fetch(VPS_API_MESSAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: VPS_TOKEN,
          to: targetTo,
          message: messageText
        })
      });

      const result = await waResponse.text();
      let jsonResult;
      try { jsonResult = JSON.parse(result); } catch(e) { jsonResult = { raw: result }; }

      return new Response(JSON.stringify({
        status: "success",
        forwarded: true,
        wa_api_response: jsonResult
      }), {
        status: waResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ 
        status: "error", 
        message: err.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};
