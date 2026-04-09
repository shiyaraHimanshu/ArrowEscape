const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN);

// 🧠 In-memory user store (temporary)
let users = {};

// 🎮 Premium welcome / play UI
async function sendPlayMessage(chatId) {
    await bot.sendMessage(
        chatId,
        `
🧠 Welcome to Arrow Escape!

Test your logic in a smooth and addictive arrow puzzle challenge.

🎯 How to play:
• Tap an arrow to launch it
• It moves forward until it exits the board
• If it hits another arrow, you lose a life
• Clear all arrows to complete the level

❤️ You have 3 lives per session
📈 Each level gets harder as you progress

✨ Why players love it:
• Simple and satisfying gameplay
• Smart brain challenges
• Smooth neon visuals
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
                            url: "https://t.me/ArrowEscape_Support"
                        }
                    ]
                ]
            }
        }
    );
}

// 🎯 Handle Telegram webhook updates
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const update = req.body;

            // 📘 Handle button clicks
            if (update.callback_query) {
                const query = update.callback_query;
                const chatId = query.message.chat.id;

                if (query.data === "how_to_play") {
                    await bot.sendMessage(
                        chatId,
                        `
📘 How to Play

• Tap an arrow to launch it
• It moves forward automatically
• Avoid hitting other arrows
• Clear all arrows to finish the level

❤️ You have 3 lives per session
💡 Plan carefully and clear the board!
`
                    );
                }
            }

            // 💬 Handle normal messages
            if (update.message) {
                const msg = update.message;
                const chatId = msg.chat.id;
                const text = msg.text || "";

                // 👤 Save user
                if (!users[chatId]) {
                    users[chatId] = {
                        id: chatId,
                        invitedBy: null
                    };
                }

                // 🚀 Handle /start
                if (text.startsWith('/start')) {
                    const parts = text.split(' ');
                    const param = parts[1];

                    // 🎁 Referral logic
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
        console.error("Bot Error:", error);
        res.status(200).send('OK');
    }
};
