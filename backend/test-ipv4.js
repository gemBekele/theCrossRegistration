const TelegramBot = require('node-telegram-bot-api');

const token = '8525803759:AAEi1ztDisR6Mz7LrTftyh-NFj-nrKu6Feo';

console.log('Testing bot with IPv4 only...');

const bot = new TelegramBot(token, { 
  polling: true,
  request: {
    agentOptions: {
      family: 4
    }
  }
});

bot.getMe()
  .then((me) => {
    console.log('✅ Bot connected:', me.username);
    bot.sendMessage('550339244', 'Test message via IPv4!')
      .then(() => console.log('✅ Message sent!'))
      .catch(err => console.log('❌ Send error:', err.message))
      .finally(() => setTimeout(() => process.exit(0), 2000));
  })
  .catch((err) => {
    console.log('❌ Connection error:', err.message);
    process.exit(1);
  });
