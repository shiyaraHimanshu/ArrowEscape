const TelegramBot = require('node-telegram-bot-api');

/**
 * 📡 Arrow Escape - Telegram Bot Backend (Vercel Serverless Version)
 * Fixes: CORS headers, Pre-flight handling, and Enhanced Error Logging
 */

// 🔐 Securely initialize the bot with your token
// Ensure TOKEN is set in your Vercel Environment Variables
const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: false });

// 🧠 In-memory user store (reset on function sleep - use DB like Redis for production)
let users = {};

/**
 * Sends the premium welcome/play UI to the user.
 */
async function sendPlayMessage(chatId) {
    try {
        await bot.sendMessage(
            chatId,
            `
🧠 Welcome to Arrow Escape!

Test your logic with smooth and addictive arrow puzzles.

🎯 How it works:
• Swipe arrows in the right direction
• Clear paths without blocking
• Complete levels to progress

✨ Why players love it:
• Relaxing gameplay
• Smart brain challenges
• Hundreds of levels
• Instant play in Telegram

👇 Tap below to start playing!
`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🚀 PLAY NOW",
                                web_app: {
                                    url: "https://arrow-escape-nine.vercel.app"
                                }
                            }
                        ],
                        [
                            {
                                text: "📘 HOW TO PLAY",
                                callback_data: "how_to_play"
                            },
                            {
                                text: "📣 SHARE GAME",
                                url: `https://t.me/share/url?url=https://t.me/ArrowEscape_bot?start=ref_${chatId}&text=🎮%20Play%20Arrow%20Escape!%20Can%20you%20clear%20all%20arrows%20without%20crashing%3F`
                            }
                        ],
                        [
                            {
                                text: "🆘 HELP & SUPPORT",
                                url: "https://t.me/shiyaraHimanshu"
                            },
                            {
                                text: "📢 JOIN CHANNEL",
                                url: "https://t.me/+5zCefb50DdphZWJl"
                            }
                        ]
                    ]
                }
            }
        );
    } catch (e) {
        console.error("sendPlayMessage Error:", e.message);
    }
}

/**
 * 🎯 Main Entry Point for Vercel Serverless Function
 */
module.exports = async (req, res) => {
    // --- 🛡️ APPLY CORS HEADERS (Crucial for WebGL browser fetch) ---
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle Browser Pre-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 1. Handle Invoice creation requests (GET) from Unity WebGL
        if (req.method === 'GET' && req.query.action === 'createInvoice') {
            const chatId = req.query.chatId;

            if (!chatId) {
                return res.status(400).json({ error: "Missing chatId" });
            }

            console.log(`[PAYMENT] Creating Stars invoice for: ${chatId}`);

            try {
                // Create a real Telegram Stars invoice link (XTR = Stars)
                const invoiceLink = await bot.createInvoiceLink(
                    "Agent Booster",                   // Title
                    "Clears up to 10 arrows in-game",   // Description
                    "booster_agent_v1",                 // Payload 
                    "",                                // Provider token (Empty for Stars)
                    "XTR",                             // Currency (Stars)
                    [{ label: "Agent Booster", amount: 10 }] // Price: 10 Stars
                );

                console.log(`[PAYMENT] Link created: ${invoiceLink}`);
                return res.status(200).json({ invoiceLink: invoiceLink });
            } catch (invoiceError) {
                console.error("[PAYMENT] createInvoiceLink failed:", invoiceError.message);
                return res.status(500).json({ error: "Bot failed to create invoice", details: invoiceError.message });
            }
        }

        // 2. Handle POST updates (Webhooks) from Telegram Servers
        if (req.method === 'POST') {
            const update = req.body;
            if (!update) return res.status(200).send('OK');

            // --- 💎 HANDLE PAYMENTS ---

            // A. Mandatory Pre-Checkout Query
            if (update.pre_checkout_query) {
                console.log(`[PAYMENT] Pre-checkout for: ${update.pre_checkout_query.id}`);
                await bot.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
                return res.status(200).send('OK');
            }

            // B. Successful Payment Confirmation
            if (update.message && update.message.successful_payment) {
                const chatId = update.message.chat.id;
                console.log(`[PAYMENT] Success by: ${chatId}`);
                await bot.sendMessage(
                    chatId, 
                    "✅ Thank you! Your Agent Booster has been added. Return to the game and play!"
                );
                return res.status(200).send('OK');
            }

            // --- ⚙️ HANDLE NORMAL BOT INTERACTIONS ---

            // C. Button Callbacks
            if (update.callback_query) {
                const query = update.callback_query;
                const chatId = query.message.chat.id;

                if (query.data === "how_to_play") {
                    await bot.sendMessage(
                        chatId,
                        `📘 How to Play\n\n• Swipe arrows to move them\n• Avoid blocking paths\n• Clear all arrows to finish level\n\n💡 Plan your moves carefully!`
                    );
                }
                return res.status(200).send('OK');
            }

            // D. Text Messages & Referrals
            if (update.message) {
                const msg = update.message;
                const chatId = msg.chat.id;
                const text = msg.text || "";

                if (text.startsWith('/start')) {
                    const parts = text.split(' ');
                    const param = parts[1];

                    // Referral tracking
                    if (param && param.startsWith('ref_')) {
                        const refId = param.split('_')[1];
                        if (refId && refId != chatId) {
                            try {
                                await bot.sendMessage(refId, `🎉 Someone joined via your link!`);
                            } catch (e) {}
                        }
                    }

                    await sendPlayMessage(chatId);
                    return res.status(200).send('OK');
                }

                // E. Handle /help command
                if (text.startsWith('/help')) {
                    await bot.sendMessage(
                        chatId,
                        "🆘 Need help? You can contact our support team here: https://t.me/shiyaraHimanshu"
                    );
                    return res.status(200).send('OK');
                }
            }
        }

        // Catch-all 200 for Telegram
        res.status(200).send('OK');
    } catch (error) {
        console.error("🔥 Bot Error:", error);
        // Always return 200 so Telegram doesn't retry infinitely
        res.status(200).send('OK');
    }
};
