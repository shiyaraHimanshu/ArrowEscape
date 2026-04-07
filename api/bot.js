const TelegramBot = require('node-telegram-bot-api');

// 🔑 Your bot token
const token = "8320931168:AAFkO8jalJu-zVGCBbj7W8P7ICLXPocnrmo";

// 🤖 Create bot
const bot = new TelegramBot(token, { polling: true });

// 🎮 Common function to send Play UI
function sendPlayMessage(chatId) {
    bot.sendMessage(chatId, `
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
                        switch_inline_query: "Play Arrow Escape 🎮"
                    }
                ]
            ]
        }
    });
}

// ✅ Handle normal /start
bot.onText(/\/start$/, (msg) => {
    sendPlayMessage(msg.chat.id);
});

// ✅ Handle deep link /start play (auto trigger)
bot.onText(/\/start (.+)/, (msg, match) => {

    const chatId = msg.chat.id;
    const param = match[1];

    if (param === "play") {
        sendPlayMessage(chatId);
    } else {
        sendPlayMessage(chatId);
    }
});