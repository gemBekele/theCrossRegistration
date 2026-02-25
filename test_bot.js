const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN || '8525803759:AAEi1ztDisR6Mz7LrTftyh-NFj-nrKu6Feo';
const bot = new TelegramBot(token, { polling: true });
bot.on('message', (msg) => {
  console.log('Received message:', msg.text);
  bot.sendMessage(msg.chat.id, 'Echo: ' + msg.text);
});
bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});
console.log('Bot started polling...');
