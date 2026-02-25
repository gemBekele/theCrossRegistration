import TelegramBot from 'node-telegram-bot-api';
import { SessionModel } from '../models/session.model';
import { ApplicantModel } from '../models/applicant.model';
import { messages, getMessage } from './messages';
import { validatePhone } from '../utils/validators';
import { downloadFile, validateAudio } from '../utils/fileHandler';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Create bot with polling
export const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  },
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  } as any
});

// Add error handlers
bot.on('error', (error) => {
  console.error('❌ Bot error:', (error as Error).message);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Test handler - should receive ALL messages
bot.on('message', (msg) => {
  console.log('📨 DEBUG - Received message:', JSON.stringify(msg.text), 'from chat:', msg.chat.id);
});

console.log('🤖 Telegram bot initialized with token:', token.substring(0, 20) + '...');

// Helper to get language from session
const getLang = async (chatId: string): Promise<'en' | 'am'> => {
  const session = await SessionModel.findByTelegramId(chatId);
  return session?.language || 'en';
};

// Helper to send bilingual message
const sendMessage = async (chatId: number, text: string, options?: any) => {
  return bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    ...options
  });
};

// Start command
bot.onText(/\/start/, async (msg) => {
  console.log('📨 RECEIVED /start from chat:', msg.chat.id);
  const chatId = msg.chat.id.toString();
  
  try {
    // Clear any existing session
    await SessionModel.delete(chatId);
    console.log('✅ Session cleared for:', chatId);
    
    // Check if already registered (skip in development)
    const existing = await ApplicantModel.findByTelegramId(chatId);
    console.log('📋 Existing applicant check:', existing ? 'found' : 'not found');
    
    if (existing && process.env.NODE_ENV !== 'development') {
      const lang = await getLang(chatId);
      await sendMessage(msg.chat.id, getMessage('alreadyRegistered', lang));
      return;
    }
    
    // Create new session
    await SessionModel.createOrUpdate(chatId, 'language_selection', {}, 'en');
    console.log('✅ Session created for:', chatId);
    
    // Send language selection
    await sendMessage(msg.chat.id, messages.welcome.en + '\n\n' + messages.welcome.am, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }]
        ]
      }
    });
    console.log('✅ Welcome message sent to:', chatId);
  } catch (error) {
    console.error('❌ ERROR in /start handler:', error);
  }
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message?.chat.id.toString();
    const messageId = query.message?.message_id;
    
    if (!chatId || !query.data) return;
    
    const data = query.data;
  
  // Language selection
  if (data.startsWith('lang_')) {
    const lang = data.split('_')[1] as 'en' | 'am';
    await SessionModel.createOrUpdate(chatId, 'type_selection', {}, lang);
    
    await bot.editMessageText(getMessage('mainMenu', lang), {
      chat_id: parseInt(chatId),
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: messages.typeSinger[lang], callback_data: 'type_singer' }],
          [{ text: messages.typeMission[lang], callback_data: 'type_mission' }]
        ]
      }
    });
  }
  
  // Type selection
  if (data.startsWith('type_')) {
    const type = data.split('_')[1] as 'singer' | 'mission';
    const lang = await getLang(chatId);
    
    await SessionModel.updateData(chatId, { type });
    await SessionModel.updateStep(chatId, 'name');
    
    const questionKey = type === 'singer' ? 'singerName' : 'missionName';
    await bot.editMessageText(getMessage(questionKey, lang), {
      chat_id: parseInt(chatId),
      message_id: messageId
    });
  }
  
  // Address selection (subcity)
  if (data.startsWith('addr_')) {
    const subcity = data.replace('addr_', '');
    const lang = await getLang(chatId);
    
    await SessionModel.updateData(chatId, { address: subcity });
    
    const session = await SessionModel.findByTelegramId(chatId);
    const type = session?.data?.type;
    
    if (type === 'singer') {
      await SessionModel.updateStep(chatId, 'worship_ministry');
      await bot.editMessageText(getMessage('singerWorship', lang), {
        chat_id: parseInt(chatId),
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: messages.yes[lang], callback_data: 'worship_yes' }],
            [{ text: messages.no[lang], callback_data: 'worship_no' }]
          ]
        }
      });
    } else {
      await SessionModel.updateStep(chatId, 'profession');
      await bot.editMessageText(getMessage('missionProfession', lang), {
        chat_id: parseInt(chatId),
        message_id: messageId
      });
    }
  }
  
  // Worship ministry (yes/no)
  if (data.startsWith('worship_')) {
    const involved = data === 'worship_yes';
    const lang = await getLang(chatId);
    
    await SessionModel.updateData(chatId, { worship_ministry_involved: involved });
    await SessionModel.updateStep(chatId, 'photo');
    
    await bot.editMessageText(getMessage('singerPhoto', lang), {
      chat_id: parseInt(chatId),
      message_id: messageId
    });
  }
  
  // Mission interest (yes/no)
  if (data.startsWith('mission_interest_')) {
    const interested = data === 'mission_interest_yes';
    const lang = await getLang(chatId);
    
    await SessionModel.updateData(chatId, { mission_interest: interested });
    await SessionModel.updateStep(chatId, 'bio');
    
    await bot.editMessageText(getMessage('missionBio', lang), {
      chat_id: parseInt(chatId),
      message_id: messageId
    });
  }
  
  } catch (error) {
    console.error('Callback query error:', error);
  } finally {
    bot.answerCallbackQuery(query.id).catch(console.error);
  }
});

// Handle text messages
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id.toString();
    const session = await SessionModel.findByTelegramId(chatId);
    
    if (!session || msg.text?.startsWith('/')) return;
    
    const lang = session.language;
    const step = session.current_step;
    const text = msg.text;
  
  // Handle name
  if (step === 'name') {
    await SessionModel.updateData(chatId, { name: text });
    await SessionModel.updateStep(chatId, 'church');
    
    const questionKey = session.data.type === 'singer' ? 'singerChurch' : 'missionChurch';
    await sendMessage(msg.chat.id, getMessage(questionKey, lang));
    return;
  }
  
  // Handle church
  if (step === 'church') {
    await SessionModel.updateData(chatId, { church: text });
    await SessionModel.updateStep(chatId, 'phone');
    
    const questionKey = session.data.type === 'singer' ? 'singerPhone' : 'missionPhone';
    await sendMessage(msg.chat.id, getMessage(questionKey, lang), {
      reply_markup: {
        keyboard: [[{ text: messages.shareContact[lang], request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    return;
  }
  
  // Handle phone (text input)
  if (step === 'phone' && text) {
    if (!validatePhone(text)) {
      await sendMessage(msg.chat.id, getMessage('invalidPhone', lang));
      return;
    }
    
    await SessionModel.updateData(chatId, { phone: text });
    await SessionModel.updateStep(chatId, 'address');
    
    const questionKey = session.data.type === 'singer' ? 'singerAddress' : 'missionAddress';
    
    // Create subcity buttons
    const subcityButtons = messages.subcities.map(subcity => ([{
      text: subcity,
      callback_data: `addr_${subcity}`
    }]));
    
    await sendMessage(msg.chat.id, getMessage(questionKey, lang), {
      reply_markup: {
        inline_keyboard: subcityButtons
      }
    });
    return;
  }
  
  // Handle profession
  if (step === 'profession') {
    await SessionModel.updateData(chatId, { profession: text });
    await SessionModel.updateStep(chatId, 'mission_interest');
    
    await sendMessage(msg.chat.id, getMessage('missionInterest', lang), {
      reply_markup: {
        inline_keyboard: [
          [{ text: messages.yes[lang], callback_data: 'mission_interest_yes' }],
          [{ text: messages.no[lang], callback_data: 'mission_interest_no' }]
        ]
      }
    });
    return;
  }
  
  // Handle bio
  if (step === 'bio') {
    await SessionModel.updateData(chatId, { bio: text });
    await SessionModel.updateStep(chatId, 'motivation');
    
    await sendMessage(msg.chat.id, getMessage('missionWhy', lang));
    return;
  }
  
  // Handle motivation
  if (step === 'motivation') {
    await SessionModel.updateData(chatId, { motivation: text });
    await SessionModel.updateStep(chatId, 'photo');
    
    await sendMessage(msg.chat.id, getMessage('missionPhoto', lang));
    return;
  }
  
  // Handle photo skip
  if (step === 'photo' && text?.toLowerCase() === 'skip') {
    await SessionModel.updateData(chatId, { photo_url: null });
    
    if (session.data.type === 'singer') {
      await SessionModel.updateStep(chatId, 'audio');
      await sendMessage(msg.chat.id, getMessage('singerAudio', lang));
    } else {
      await showReview(msg.chat.id, chatId, lang);
    }
    return;
  }
  } catch (error) {
    console.error('Message handler error:', error);
  }
});

// Handle contact sharing
bot.on('contact', async (msg) => {
  try {
    const chatId = msg.chat.id.toString();
    const session = await SessionModel.findByTelegramId(chatId);
    
    if (!session || session.current_step !== 'phone') return;
    
    const lang = session.language;
    const phone = msg.contact?.phone_number;
    
    if (!phone) {
      await sendMessage(msg.chat.id, getMessage('invalidPhone', lang));
      return;
    }
    
    await SessionModel.updateData(chatId, { phone });
    await SessionModel.updateStep(chatId, 'address');
    
    const questionKey = session.data.type === 'singer' ? 'singerAddress' : 'missionAddress';
    
    // Remove keyboard and show subcity buttons
    const subcityButtons = messages.subcities.map(subcity => ([{
      text: subcity,
      callback_data: `addr_${subcity}`
    }]));
    
    await sendMessage(msg.chat.id, getMessage(questionKey, lang), {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard: subcityButtons
      }
    });
  } catch (error) {
    console.error('Contact handler error:', error);
  }
});

// Handle photo
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id.toString();
  const session = await SessionModel.findByTelegramId(chatId);
  
  if (!session || session.current_step !== 'photo') return;
  
  const lang = session.language;
  
  try {
    const photo = msg.photo?.[msg.photo.length - 1]; // Get largest photo
    if (!photo) {
      await sendMessage(msg.chat.id, getMessage('invalidPhoto', lang));
      return;
    }
    
    const fileLink = await bot.getFileLink(photo.file_id);
    const filePath = await downloadFile(fileLink, 'photos', `${chatId}_${Date.now()}.jpg`);
    
    await SessionModel.updateData(chatId, { photo_url: filePath });
    
    if (session.data.type === 'singer') {
      await SessionModel.updateStep(chatId, 'audio');
      await sendMessage(msg.chat.id, getMessage('singerAudio', lang));
    } else {
      await showReview(msg.chat.id, chatId, lang);
    }
  } catch (error) {
    console.error('Error handling photo:', error);
    await sendMessage(msg.chat.id, getMessage('invalidPhoto', lang));
  }
});

// Handle uncompressed image documents
bot.on('document', async (msg) => {
  const chatId = msg.chat.id.toString();
  const session = await SessionModel.findByTelegramId(chatId);
  
  if (!session || session.current_step !== 'photo') return;
  
  const lang = session.language;
  
  try {
    const document = msg.document;
    if (!document || !document.mime_type?.startsWith('image/')) {
      await sendMessage(msg.chat.id, getMessage('invalidPhoto', lang));
      return;
    }
    
    const fileLink = await bot.getFileLink(document.file_id);
    const filePath = await downloadFile(fileLink, 'photos', `${chatId}_${Date.now()}.jpg`);
    
    await SessionModel.updateData(chatId, { photo_url: filePath });
    
    if (session.data.type === 'singer') {
      await SessionModel.updateStep(chatId, 'audio');
      await sendMessage(msg.chat.id, getMessage('singerAudio', lang));
    } else {
      await showReview(msg.chat.id, chatId, lang);
    }
  } catch (error) {
    console.error('Error handling document photo:', error);
    await sendMessage(msg.chat.id, getMessage('invalidPhoto', lang));
  }
});

// Handle audio/voice
bot.on('audio', async (msg) => {
  const chatId = msg.chat.id.toString();
  const session = await SessionModel.findByTelegramId(chatId);
  
  if (!session || session.current_step !== 'audio') return;
  
  const lang = session.language;
  
  try {
    const audio = (msg as any).audio || (msg as any).voice;
    if (!audio) {
      await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
      return;
    }
    
    // Validate file size (5MB = 5,242,880 bytes)
    if (audio.file_size > 5 * 1024 * 1024) {
      await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
      return;
    }
    
    const fileLink = await bot.getFileLink(audio.file_id);
    const extension = audio.mime_type?.includes('ogg') ? 'ogg' : 'mp3';
    const filePath = await downloadFile(fileLink, 'audios', `${chatId}_${Date.now()}.${extension}`);
    
    // Validate duration (should be less than 60 seconds)
    if (audio.duration && audio.duration > 60) {
      await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
      return;
    }
    
    await SessionModel.updateData(chatId, { 
      audio_url: filePath,
      audio_duration: audio.duration 
    });
    
    await showReview(msg.chat.id, chatId, lang);
  } catch (error) {
    console.error('Error handling audio:', error);
    await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
  }
});

// Handle voice messages
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id.toString();
  const session = await SessionModel.findByTelegramId(chatId);
  
  if (!session || session.current_step !== 'audio') return;
  
  const lang = session.language;
  
  try {
    const audio = (msg as any).voice;
    if (!audio) {
      await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
      return;
    }
    
    // Validate file size (5MB = 5,242,880 bytes)
    if (audio.file_size > 5 * 1024 * 1024) {
      await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
      return;
    }
    
    const fileLink = await bot.getFileLink(audio.file_id);
    const extension = 'ogg';
    const filePath = await downloadFile(fileLink, 'audios', `${chatId}_${Date.now()}.${extension}`);
    
    // Validate duration (should be less than 60 seconds)
    if (audio.duration && audio.duration > 60) {
      await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
      return;
    }
    
    await SessionModel.updateData(chatId, { 
      audio_url: filePath,
      audio_duration: audio.duration 
    });
    
    await showReview(msg.chat.id, chatId, lang);
  } catch (error) {
    console.error('Error handling voice:', error);
    await sendMessage(msg.chat.id, getMessage('invalidAudio', lang));
  }
});

// Show review before submission
async function showReview(chatId: number, telegramId: string, lang: 'en' | 'am') {
  const session = await SessionModel.findByTelegramId(telegramId);
  if (!session) return;
  
  const data = session.data;
  let reviewText = getMessage('reviewTitle', lang);
  
  if (data.type === 'singer') {
    reviewText += `🎤 ${lang === 'en' ? 'Singer Registration' : 'ዘማሪ ምዝገባ'}\n\n`;
    reviewText += `👤 ${lang === 'en' ? 'Name' : 'ስም'}: ${data.name}\n`;
    reviewText += `⛪ ${lang === 'en' ? 'Church' : 'አብያተ ክርስቲያን'}: ${data.church}\n`;
    reviewText += `📱 ${lang === 'en' ? 'Phone' : 'ስልክ'}: ${data.phone}\n`;
    reviewText += `📍 ${lang === 'en' ? 'Address' : 'አድራሻ'}: ${data.address}\n`;
    reviewText += `🙏 ${lang === 'en' ? 'Worship Ministry' : 'መዝሙር አገልግሎት'}: ${data.worship_ministry_involved ? messages.yes[lang] : messages.no[lang]}\n`;
    reviewText += `📸 ${lang === 'en' ? 'Photo' : 'ፎቶ'}: ${data.photo_url ? '✅' : '❌'}\n`;
    reviewText += `🎵 ${lang === 'en' ? 'Audio' : 'ድምፅ'}: ✅\n`;
  } else {
    reviewText += `🌍 ${lang === 'en' ? 'Mission Registration' : 'የሚሲዮን ምዝገባ'}\n\n`;
    reviewText += `👤 ${lang === 'en' ? 'Name' : 'ስም'}: ${data.name}\n`;
    reviewText += `⛪ ${lang === 'en' ? 'Church' : 'አብያተ ክርስቲያን'}: ${data.church}\n`;
    reviewText += `📱 ${lang === 'en' ? 'Phone' : 'ስልክ'}: ${data.phone}\n`;
    reviewText += `📍 ${lang === 'en' ? 'Address' : 'አድራሻ'}: ${data.address}\n`;
    reviewText += `💼 ${lang === 'en' ? 'Profession' : 'ሙያ'}: ${data.profession}\n`;
    reviewText += `🌍 ${lang === 'en' ? 'Mission Interest' : 'የሚሲዮን ፍላጎት'}: ${data.mission_interest ? messages.yes[lang] : messages.no[lang]}\n`;
    reviewText += `📸 ${lang === 'en' ? 'Photo' : 'ፎቶ'}: ${data.photo_url ? '✅' : '❌'}\n`;
  }
  
  await sendMessage(chatId, reviewText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: messages.confirm[lang], callback_data: 'submit' }],
        [{ text: messages.cancel[lang], callback_data: 'cancel' }]
      ]
    }
  });
  
  // Update step to review
  await SessionModel.updateStep(telegramId, 'review');
}

// Handle submit and cancel callbacks
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message?.chat.id.toString();
    const messageId = query.message?.message_id;
    
    if (!chatId || !query.data) return;
    
    if (query.data === 'submit') {
      const session = await SessionModel.findByTelegramId(chatId);
      if (!session || session.current_step !== 'review') return;
      
      const lang = session.language;
      const data = session.data;
      
      try {
        if (data.type === 'singer') {
          await ApplicantModel.createSinger({
            telegram_id: chatId,
            telegram_username: query.from.username,
            name: data.name,
            phone: data.phone,
            church: data.church,
            address: data.address,
            photo_url: data.photo_url,
            worship_ministry_involved: data.worship_ministry_involved,
            audio_url: data.audio_url,
            audio_duration: data.audio_duration
          });
        } else {
          await ApplicantModel.createMission({
            telegram_id: chatId,
            telegram_username: query.from.username,
            name: data.name,
            phone: data.phone,
            church: data.church,
            address: data.address,
            photo_url: data.photo_url,
            profession: data.profession,
            mission_interest: data.mission_interest,
            bio: data.bio,
            motivation: data.motivation
          });
        }
        
        // Clear session
        await SessionModel.delete(chatId);
        
        await bot.editMessageText(getMessage('submissionSuccess', lang), {
          chat_id: parseInt(chatId),
          message_id: messageId
        });
      } catch (error) {
        console.error('Error submitting application:', error);
        await bot.editMessageText(getMessage('submissionError', lang), {
          chat_id: parseInt(chatId),
          message_id: messageId
        });
      }
    }
    
    if (query.data === 'cancel') {
      const session = await SessionModel.findByTelegramId(chatId);
      const lang = session?.language || 'en';
      
      await SessionModel.delete(chatId);
      await bot.editMessageText(lang === 'en' ? 'Registration cancelled.' : 'ምዝገባ ተሰርዟል።', {
        chat_id: parseInt(chatId),
        message_id: messageId
      });
    }
  } catch (error) {
    console.error('Submit/Cancel callback error:', error);
  } finally {
    bot.answerCallbackQuery(query.id).catch(console.error);
  }
});

console.log('🤖 Telegram bot initialized');