[build]
builder = "nixpacks"

[deploy]
startCommand = "node bot.js"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

# $GFOF Federation AI — Telegram Bot

## Setup Instructions

### Step 1 — Create the Bot on Telegram
1. Open Telegram and search @BotFather
2. Send: /newbot
3. Name: GFOF Federation AI
4. Username: GFOFAIBot (must end in "bot")
5. Copy the token BotFather gives you

### Step 2 — Deploy on Railway (Free)
1. Go to railway.app and sign up with GitHub
2. Click New Project → Deploy from GitHub repo
   OR click New Project → Empty Project → Add Service → GitHub Repo
3. Upload this folder as a GitHub repo first:
   - Go to github.com → New Repository → name it gfof-telegram-bot
   - Upload all files in this folder
4. In Railway, connect your GitHub repo
5. Go to Variables tab and add:
   - TELEGRAM_TOKEN = (your token from BotFather)
   - ANTHROPIC_API_KEY = (your key from console.anthropic.com)
6. Railway deploys automatically — copy your deployment URL

### Step 3 — Set the Webhook
Once deployed, open this URL in your browser (replace YOUR_TOKEN and YOUR_RAILWAY_URL):

https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://YOUR_RAILWAY_URL/webhook

You should see: {"ok":true,"result":true}

### Step 4 — Add Bot to Your Telegram Group
1. In your $GFOF Telegram group, click the group name
2. Add Members → search your bot username
3. Give it Admin rights (so it can read messages)
4. Done!

### Step 5 — Test It
In the group, type: @GFOFAIBot what is $GFOF?
The bot should respond within a few seconds.

## Bot Commands Available
/start — Welcome message
/about — About $GFOF
/buy — How to buy $GFOF
/roadmap — Project roadmap
/website — Official website
/whitepaper — Read the whitepaper
/help — Command menu

Members can also just tag the bot with any question:
@GFOFAIBot how do I join the federation?

## Environment Variables Required
- TELEGRAM_TOKEN — from BotFather
- ANTHROPIC_API_KEY — from console.anthropic.com
- PORT — set automatically by Railway

## Notes
- The bot responds in group chats only when tagged @GFOFAIBot
- In private chats it responds to every message
- Conversation history is kept per chat (last 10 messages)
- Never gives price predictions
- Always redirects to galacticfederation.com

const https = require('https');
const http = require('http');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || '';

const SYSTEM_PROMPT = 'You are the official AI assistant for $GFOF — the Galactic Federation of Finance. Key facts: Full name: Galactic Federation of Finance. Ticker: $GFOF. Network: Solana. Contract: 2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon. Buy: https://dexscreener.com/solana/2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon. Website: galacticfederation.co. Telegram: https://t.me/+-yivjWkSQZUzYWUx. Led by Admiral Zoran Voss. Stage: Store of value, community building. Roadmap: Store of value now, community growth, DeFi lending protocol, expanding universe. Philosophy: Community governed, transparent, user-first, no hype. Never use moon or 100x language. Never give price predictions. Keep responses to 2-4 sentences. Always end with $GFOF or the galaxy emoji. In groups only respond when tagged @GFOFAIBot.';

const history = {};

function tgCall(path, data) {
  return new Promise(function(resolve, reject) {
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + TELEGRAM_TOKEN + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, function(res) {
      let d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(d)); } catch(e) { resolve({}); }
      });
    });
    req.on('error', function(e) { console.error('TG error:', e.message); resolve({}); });
    req.write(body);
    req.end();
  });
}

function aiCall(messages) {
  return new Promise(function(resolve, reject) {
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
    }, function(res) {
      let d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        try {
          const p = JSON.parse(d);
          if (p.content && p.content[0]) {
            resolve(p.content[0].text);
          } else {
            resolve('Federation comms offline. Try again. $GFOF');
          }
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
  '/about': '$GFOF — Galactic Federation of Finance\nCommunity-driven DeFi on Solana.\nStore of value today. Lending tomorrow.\n\nWebsite: galacticfederation.co\nBuy: https://dexscreener.com/solana/2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon',
  '/buy': 'Buy $GFOF on DexScreener:\nhttps://dexscreener.com/solana/2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon\n\nCA: 2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon\nNetwork: Solana\nNot financial advice. DYOR. $GFOF',
  '/price': 'Live $GFOF price:\nhttps://dexscreener.com/solana/2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon\nNot financial advice. $GFOF',
  '/roadmap': 'Galactic Roadmap:\nPhase 1 NOW: Token live. Community building.\nPhase 2: Governance. Alliance partnerships.\nPhase 3: DeFi lending protocol.\nPhase 4: Community decides.\n$GFOF',
  '/website': 'Official website: galacticfederation.co\nLive chart, whitepaper, AI assistant and more. $GFOF',
  '/links': 'Official $GFOF Links:\nWebsite: galacticfederation.co\nBuy: https://dexscreener.com/solana/2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon\nTelegram: https://t.me/+-yivjWkSQZUzYWUx\nX/Twitter: https://x.com/GFOF_Official\n$GFOF',
  '/help': 'Commands:\n/start /about /buy /price /roadmap /website /links /help\n\nOr tag me: @GFOFAIBot what is $GFOF?\n$GFOF'
};

function processMessage(msg) {
  return new Promise(function(resolve) {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

    if (text.startsWith('/')) {
      const cmd = text.split(' ')[0].toLowerCase().split('@')[0];
      const reply = COMMANDS[cmd] || COMMANDS['/help'];
      tgCall('/sendMessage', {
        chat_id: chatId,
        text: reply,
        disable_web_page_preview: true
      }).then(function() { resolve(); });
      return;
    }

    if (isGroup && text.toLowerCase().indexOf('@gfofaibot') === -1) {
      resolve();
      return;
    }

    const clean = text.replace(/@GFOFAIBot/gi, '').trim();
    if (!clean) {
      tgCall('/sendMessage', {
        chat_id: chatId,
        text: 'Federation AI online. Tag me with a question. $GFOF',
        reply_to_message_id: msg.message_id
      }).then(function() { resolve(); });
      return;
    }

    tgCall('/sendChatAction', { chat_id: chatId, action: 'typing' });

    if (!history[chatId]) { history[chatId] = []; }
    history[chatId].push({ role: 'user', content: clean });
    if (history[chatId].length > 8) {
      history[chatId] = history[chatId].slice(-8);
    }

    aiCall(history[chatId]).then(function(reply) {
      history[chatId].push({ role: 'assistant', content: reply });
      tgCall('/sendMessage', {
        chat_id: chatId,
        text: reply,
        reply_to_message_id: isGroup ? msg.message_id : undefined
      }).then(function() { resolve(); });
    }).catch(function(e) {
      console.error('AI error:', e.message);
      tgCall('/sendMessage', {
        chat_id: chatId,
        text: 'Federation comms disruption. Please try again. $GFOF',
        reply_to_message_id: isGroup ? msg.message_id : undefined
      }).then(function() { resolve(); });
    });
  });
}

function keepAlive() {
  if (!APP_URL) {
    console.log('No APP_URL set — keep-alive disabled');
    return;
  }
  setInterval(function() {
    try {
      const urlObj = new URL(APP_URL + '/ping');
      const req = https.request({
        hostname: urlObj.hostname,
        path: '/ping',
        method: 'GET'
      }, function(res) {
        console.log('Keep-alive ping:', res.statusCode, new Date().toISOString());
      });
      req.on('error', function(e) { console.log('Ping error:', e.message); });
      req.end();
    } catch(e) {
      console.log('Keep-alive error:', e.message);
    }
  }, 4 * 60 * 1000);
  console.log('Keep-alive started for', APP_URL);
}

const server = http.createServer(function(req, res) {
  if (req.url === '/ping' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      bot: 'GFOF Federation AI',
      ticker: '$GFOF',
      uptime: Math.floor(process.uptime()) + 's'
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', function() {
      res.writeHead(200);
      res.end('OK');
      try {
        const update = JSON.parse(body);
        if (update.message && update.message.text) {
          processMessage(update.message).catch(function(e) {
            console.error('Process error:', e.message);
          });
        }
      } catch(e) {
        console.error('Parse error:', e.message);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function() {
  console.log('GFOF Federation AI Bot running on port', PORT);
  keepAlive();
});

{
  "name": "gfof-federation-ai-bot",
  "version": "1.0.0",
  "description": "Official $GFOF Galactic Federation of Finance Telegram AI Bot",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
