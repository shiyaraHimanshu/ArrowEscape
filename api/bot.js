const TelegramBot = require('node-telegram-bot-api');

// Initialize the bot with your token
const bot = new TelegramBot(process.env.TOKEN);

// 🧠 In-memory user store (temporary)
let users = {};

/**
 * Sends the premium welcome/play UI to the user.
 */
async function sendPlayMessage(chatId) {
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
                            text: "🛟 SUPPORT",
                            url: "https://t.me/ArrowEscape_bot"
                        }
                    ]
                ]
            }
        }
    );
}

/**
 * 🎯 Handle Telegram webhook updates and Invoice creation requests.
 * This is designed for deployment as a Vercel Serverless Function (api/bot.js).
 */
module.exports = async (req, res) => {
    try {
        // --- 💎 REAL PAYMENT INTEGRATION (STARS) ---
        
        // Handle Invoice creation (GET request from Game Client)
        if (req && req.query && req.query.action === 'createInvoice') {
            const chatId = req.query.chatId;

            if (!chatId) {
                return res.status(400).json({ error: "Missing chatId" });
            }

            // Create a real Telegram Stars invoice link
            const invoiceLink = await bot.createInvoiceLink(
                "Agent Booster",                   // Title
                "Clears up to 10 arrows in-game",   // Description
                "booster_agent_v1",                 // Payload 
                "",                                // Provider token (Empty for Stars)
                "XTR",                             // Currency (Stars)
                [{ label: "Agent Booster", amount: 10 }] // Price: 10 Stars
            );

            return res.status(200).json({ invoiceLink: invoiceLink });
        }

        // Handle POST updates from Telegram Webhook
        if (req.method === 'POST') {
            const update = req.body;

            // 1. Handle Mandatory Pre-Checkout Query for Payments
            if (update.pre_checkout_query) {
                // Must answer within 10 seconds to authorize payment
                await bot.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
                return res.status(200).send('OK');
            }

            // 2. Handle Successful Payment Notification
            if (update.message && update.message.successful_payment) {
                const chatId = update.message.chat.id;
                await bot.sendMessage(chatId, "✅ Thank you! Your Agent Booster has been added to your account. Go back to the game and play!");
                return res.status(200).send('OK');
            }

            // 3. Handle Button Clicks (callback_query)
            if (update.callback_query) {
                const query = update.callback_query;
                const chatId = query.message.chat.id;

                if (query.data === "how_to_play") {
                    await bot.sendMessage(
                        chatId,
                        `
📘 How to Play

• Swipe arrows to move them
• Avoid blocking paths
• Clear all arrows to finish level

💡 Plan your moves carefully and solve each puzzle!
`
                    );
                }
            }

            // 4. Handle Text Messages (/start, referrals)
            if (update.message) {
                const msg = update.message;
                const chatId = msg.chat.id;
                const text = msg.text || "";

                // Register user
                if (!users[chatId]) {
                    users[chatId] = {
                        id: chatId,
                        invitedBy: null
                    };
                }

                // Handle /start command
                if (text.startsWith('/start')) {
                    const parts = text.split(' ');
                    const param = parts[1];

                    // Referral logic
                    if (param && param.startsWith('ref_')) {
                        const refId = param.split('_')[1];

                        if (refId && refId != chatId) {
                            users[chatId].invitedBy = refId;
                            try {
                                await bot.sendMessage(
                                    refId,
                                    `🎉 You invited a new player to Arrow Escape!`
                                );
                            } catch (err) {
                                console.log("Referral notify failed:", err.message);
                            }
                        }
                    }

                    await sendPlayMessage(chatId);
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error("Critical Backend Error:", error);
        // Always return 200 to Telegram so it doesn't retry infinitely on error
        res.status(200).send('OK');
    }
};
