const TelegramBot = require('node-telegram-bot-api');

const token = '8525803759:AAEi1ztDisR6Mz7LrTftyh-NFj-nrKu6Feo';

console.log('Testing bot connection...');
console.log('Token:', token.substring(0, 20) + '...');

const bot = new TelegramBot(token, { polling: true });

// Test getMe
bot.getMe().then((me) => {
  console.log('✅ Bot info:', me);
}).catch((err) => {
  console.error('❌ Error getting bot info:', err.message);
});

// Test sending a message
const testChatId = '550339244'; // The chat ID from the update
console.log('Attempting to send test message to:', testChatId);

bot.sendMessage(testChatId, '👋 Hello! Bot is working correctly!')
  .then((msg) => {
    console.log('✅ Test message sent successfully!');
    console.log('Message ID:', msg.message_id);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error sending message:', err.message);
    console.error('Error code:', err.code);
    console.error('Error description:', err.response?.body?.description);
    process.exit(1);
  });

// Handle /start
bot.onText(/\/start/, (msg) => {
  console.log('📨 Received /start from:', msg.chat.id);
  bot.sendMessage(msg.chat.id, '✅ Bot is receiving messages!');
});

// Keep running for 30 seconds to test polling
setTimeout(() => {
  console.log('⏱️ Test complete, shutting down...');
  process.exit(0);
}, 30000);