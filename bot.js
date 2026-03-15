const https = require('https');
const http = require('http');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || '';

const SYSTEM_PROMPT = 'You are the official AI assistant for $GFOF — the Galactic Federation of Finance. Key facts: Full name: Galactic Federation of Finance. Ticker: $GFOF. Network: Solana. Contract: 3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE. Buy: https://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE. Website: galacticfederation.co. Telegram: https://t.me/+-OApwM3RErkyYjQx. Stage: Store of value, community building. Roadmap: Store of value now, community growth, DeFi lending protocol, expanding universe. Philosophy: Community governed, transparent, user-first, no hype. Never use moon or 100x language. Never give price predictions. Keep responses to 2-4 sentences. Always end with $GFOF or the galaxy emoji. In groups only respond when tagged @GFOFAIBot.';

const history = {};

function tgCall(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + TELEGRAM_TOKEN + path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function aiCall(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: messages
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          resolve(p.content && p.content[0] ? p.content[0].text : 'Federation comms offline. Try again. $GFOF');
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const COMMANDS = {
  '/start': 'Welcome to the Galactic Federation of Finance AI! Ask me anything about $GFOF. The council is listening. $GFOF',
  '/about': '$GFOF — Galactic Federation of Finance\nCommunity-driven DeFi on Solana.\nStore of value today. Lending tomorrow.\n\nWebsite: galacticfederation.co\nBuy: https://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE',
  '/buy': 'Buy $GFOF on DexScreener:\nhttps://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\n\nNetwork: Solana\nAlways do your own research. $GFOF',
  '/price': 'Live $GFOF price:\nhttps://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\nNot financial advice. $GFOF',
  '/roadmap': 'Galactic Roadmap:\nPhase 1 NOW: Token live. Community building.\nPhase 2: Federation expansion. Governance.\nPhase 3: DeFi lending protocol.\nPhase 4: Expanding universe.\n$GFOF',
  '/website': 'Official website: galacticfederation.co\nLive chart, whitepaper, AI assistant and more. $GFOF',
  '/links': 'Official $GFOF Links:\nWebsite: galacticfederation.co\nBuy: https://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\nTelegram: https://t.me/+-OApwM3RErkyYjQx\n$GFOF',
  '/help': 'Commands:\n/start /about /buy /price /roadmap /website /links /help\n\nOr tag me: @GFOFAIBot what is $GFOF?\n$GFOF'
};

async function handleUpdate(update) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0].toLowerCase().split('@')[0];
    const reply = COMMANDS[cmd] || COMMANDS['/help'];
    await tgCall('/sendMessage', { chat_id: chatId, text: reply, disable_web_page_preview: true });
    return;
  }

  if (isGroup && !text.toLowerCase().includes('@gfofaibot')) return;
  const clean = text.replace(/@GFOFAIBot/gi, '').trim();
  if (!clean) return;

  if (!history[chatId]) history[chatId] = [];
  history[chatId].push({ role: 'user', content: clean });
  if (history[chatId].length > 8) history[chatId] = history[chatId].slice(-8);

  await tgCall('/sendChatAction', { chat_id: chatId, action: 'typing' });

  try {
    const reply = await aiCall(history[chatId]);
    history[chatId].push({ role: 'assistant', content: reply });
    await tgCall('/sendMessage', {
      chat_id: chatId,
      text: reply,
      reply_to_message_id: isGroup ? msg.message_id : undefined
    });
  } catch(e) {
    console.error('AI error:', e.message);
    await tgCall('/sendMessage', {
      chat_id: chatId,
      text: 'Federation comms disruption. Please try again. $GFOF',
      reply_to_message_id: isGroup ? msg.message_id : undefined
    });
  }
}

function keepAlive() {
  if (!APP_URL) return;
  setInterval(() => {
    const url = new URL(APP_URL + '/ping');
    const req = https.request({ hostname: url.hostname, path: '/ping', method: 'GET' }, res => {
      console.log('Keep-alive ping:', res.statusCode, new Date().toISOString());
    });
    req.on('error', e => console.log('Ping error:', e.message));
    req.end();
  }, 4 * 60 * 1000);
  console.log('Keep-alive started');
}

const server = http.createServer((req, res) => {
  if (req.url === '/ping' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', bot: 'GFOF Federation AI', ticker: '$GFOF' }));
    return;
  }
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      res.writeHead(200);
      res.end('OK');
      try { await handleUpdate(JSON.parse(body)); } catch(e) { console.error('Error:', e.message); }
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('GFOF Federation AI Bot running on port', PORT);
  keepAlive();
});
