const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN, {
    webHook: true
});

let users = {};

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
                       {
    text: "📢 Share Game",
    url: `https://t.me/share/url?url=https://t.me/ArrowEscape_bot?start=ref_${chatId}&text=🎮 Play Arrow Escape and challenge your brain!`
}
                    }
                ]
            ]
        }
    });
}

module.exports = async (req, res) => {

    try {
        if (req.method === 'POST') {

            const update = req.body;

            console.log("Incoming update:", update); // 🔥 debug log

            if (update.message) {
                const msg = update.message;
                const chatId = msg.chat.id;
                const text = msg.text || "";

                if (!users[chatId]) {
                    users[chatId] = { id: chatId };
                }

                if (text.startsWith('/start')) {
                    await sendPlayMessage(chatId);
                }
            }
        }

        res.status(200).send('OK');

    } catch (error) {
        console.log("ERROR:", error);
        res.status(200).send('ERROR');
    }
};
