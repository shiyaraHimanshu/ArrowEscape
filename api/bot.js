const TelegramBot = require('node-telegram-bot-api');

// ✅ Create bot (Webhook mode for Vercel)
const bot = new TelegramBot(process.env.TOKEN, {
    webHook: true
});

// 🧠 Temporary user store (resets on deploy)
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
                        url: `https://t.me/share/url?url=https://t.me/ArrowEscape_bot?start=ref_${chatId}&text=🎮 Play Arrow Escape and challenge your brain!`
                    }
                ]
            ]
        }
    });
}

// 🚀 Vercel Serverless Function
module.exports = async (req, res) => {

    // ✅ Allow GET (so browser shows OK)
    if (req.method === 'GET') {
        return res.status(200).send("OK");
    }

    try {
        if (req.method === 'POST') {

            // ✅ Safe body parsing
            const update = typeof req.body === "string"
                ? JSON.parse(req.body)
                : req.body;

            console.log("Incoming update:", update);

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

                // 🎯 Handle /start
                if (text.startsWith('/start')) {

                    const parts = text.split(' ');
                    const param = parts[1];

                    // 🎁 Referral logic
                    if (param && param.startsWith('ref_')) {
                        const refId = param.split('_')[1];

                        if (refId && refId != chatId) {
                            users[chatId].invitedBy = refId;

                            try {
                                await bot.sendMessage(refId, `🎉 You invited a new player!`);
                            } catch (e) {
                                console.log("Invalid refId");
                            }
                        }
                    }

                    // 🎮 Send UI
                    await sendPlayMessage(chatId);
                }
            }
        }

        res.status(200).send("OK");

    } catch (error) {
        console.log("ERROR:", error);
        res.status(200).send("ERROR");
    }
};
