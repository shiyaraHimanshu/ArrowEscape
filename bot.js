const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN);

// 🧠 In-memory user store (temporary)
let users = {};

// 🎮 Send Play UI
async function sendPlayMessage(chatId) {
    await bot.sendMessage(chatId, `
🎮 Arrow Escape

🧠 Challenge your brain with tricky puzzles!

👇 Tap below to play!
`, {
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
                        text: "📢 Share Game",
                        url: `https://t.me/ArrowEscape_bot?start=ref_${chatId}`
                    }
                ]
            ]
        }
    });
}

// 🎯 Handle incoming updates
module.exports = async (req, res) => {

    if (req.method === 'POST') {
        const update = req.body;

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

            // 🚀 Handle /start with params
            if (text.startsWith('/start')) {

                const parts = text.split(' ');
                const param = parts[1];

                // 🎯 Referral logic
                if (param && param.startsWith('ref_')) {
                    const refId = param.split('_')[1];

                    if (refId && refId != chatId) {
                        users[chatId].invitedBy = refId;

                        // 🎁 Reward message (basic)
                        await bot.sendMessage(refId, `🎉 You invited a new player!`);
                    }
                }

                await sendPlayMessage(chatId);
            }
        }
    }

    res.status(200).send('OK');
};