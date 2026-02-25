const TelegramBot = require('node-telegram-bot-api');
const token = '8525803759:AAEi1ztDisR6Mz7LrTftyh-NFj-nrKu6Feo';

console.log('Testing polling...');

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  console.log('📨 RECEIVED /start from:', msg.chat.id);
  bot.sendMessage(msg.chat.id, '✅ Polling is working!');
});

bot.on('message', (msg) => {
  console.log('📨 Received message:', msg.text, 'from:', msg.chat.id);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

console.log('Bot initialized, waiting for messages...');

setTimeout(() => {
  console.log('Test complete');
  process.exit(0);
}, 30000);
