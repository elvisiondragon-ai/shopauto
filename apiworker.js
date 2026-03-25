/**
 * APIWORKER.js (CODENAME NIMA - REVERT TO WATZAPP API)
 * Function: Reads corpnima@gmail.com, sends Shopee alerts to WhatsApp via WatzApp VPS,
 *           AND triggers MacroDroid automation on phone.
 */

function apiworker() {
  // 1. CONFIGURATION (WATZAPP API - REVERTED)
  // MANDATORY: after:2026/03/12 to prevent spamming old emails
  const GMAIL_QUERY = 'is:unread after:2026/03/12 (Pesanan OR Pembayaran OR "kirimkan pesanan" OR "rincian pesanan" OR "Shopee")';
  
  const WA_API_URL = "https://watzapp.web.id/api/message";
  const WA_TOKEN = "4f46b29bf8e0e4443d9e631007324b29199443786d8b4befab3a2d529208583f";
  
  const RECIPIENTS = ["62895325633487", "6285664733499"];

  // MacroDroid Webhook Configuration
  const MACRODROID_BASE_URL = "https://trigger.macrodroid.com/ede439d7-afd6-457b-9d00-952b9315d006";

  // 2. SEARCH FOR EMAILS
  const threads = GmailApp.search(GMAIL_QUERY);

  if (threads.length === 0) {
    Logger.log("No new Shopee email found (since 2026/03/12).");
    return;
  }

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      if (message.isUnread()) {
        const subject = message.getSubject();
        const from = message.getFrom();
        const body = message.getPlainBody().substring(0, 1000); // Limit length

        // --- FIRE MACRODROID WEBHOOK ---
        const triggerName = "pesanan baru";
        try {
          const macroUrl = MACRODROID_BASE_URL + "/" + encodeURIComponent(triggerName);
          const macroOptions = {
            "method": "get",
            "muteHttpExceptions": true
          };
          const macroResponse = UrlFetchApp.fetch(macroUrl, macroOptions);
          Logger.log("✅ MacroDroid triggered [" + triggerName + "]: " + macroResponse.getContentText());
        } catch (e) {
          Logger.log("⚠️ MacroDroid trigger failed [" + triggerName + "]: " + e.toString());
        }

        const finalMessage = `🚀 *ROCKET NOTIFIKASI* 🚀\n\n` +
          `🧡 *SHOPEE INBOX DETECTED* 🧡\n\n` +
          `👤 *From:* ${from}\n` +
          `📧 *Subject:* ${subject}\n\n` +
          `*Isi Pesan:*\n${body}...`;

        // 3. SEND TO EACH RECIPIENT (WATZAPP API)
        for (const to of RECIPIENTS) {
          const payload = {
            token: WA_TOKEN,
            to: to,
            message: finalMessage
          };

          const options = {
            "method": "post",
            "contentType": "application/json",
            "payload": JSON.stringify(payload),
            "muteHttpExceptions": true
          };

          try {
            const response = UrlFetchApp.fetch(WA_API_URL, options);
            Logger.log("Sent via WatzApp to " + to + ": " + response.getContentText());
          } catch (e) {
            Logger.log("Error sending via WatzApp to " + to + ": " + e.toString());
          }
        }

        // 4. MARK AS READ (CRITICAL: prevents sending again)
        message.markRead();
      }
    }
  }
}
