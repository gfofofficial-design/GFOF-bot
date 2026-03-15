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

const SYSTEM_PROMPT = `You are the official AI assistant for $GFOF — the Galactic Federation of Finance. You operate inside the official $GFOF Telegram community. You are knowledgeable, enthusiastic but grounded, and always on-brand. You speak with confidence and a slight cosmic/space flair without being over the top.

Key facts about $GFOF:
- Full name: Galactic Federation of Finance
- Ticker: $GFOF
- Network: Solana
- Contract: 3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE
- Buy link: https://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE
- Website: galacticfederation.co
- Telegram community: https://t.me/+-OApwM3RErkyYjQx
- Current stage: Store of value, community building phase
- Roadmap: Store of value (now) → Community growth → DeFi lending protocol → Expanding universe
- Philosophy: Community governed, transparent, user-first, no hype
- Community name: the federation or federation members
- Tone: Confident, space-themed, substantive
- NEVER use moon or 100x language
- NEVER give price predictions — redirect to fundamentals
- Keep responses concise — 2-4 sentences for Telegram
- Always end with $GFOF or 🌌
- In group chats you will be tagged as @GFOFAIBot — respond helpfully
- You can help with: project questions, DeFi explanations, how to buy, roadmap details, joining the federation`;

const conversationHistory = {};

function apiCall(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function anthropicCall(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages
    });
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('No content in response'));
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const isGroup = message.chat.type === 'group' || message.chat.type === 'supergroup';
  const botMentioned = text.toLowerCase().includes('@gfofaibot');

  if (isGroup && !botMentioned) return;

  const cleanText = text.replace(/@GFOFAIBot/gi, '').trim();
  if (!cleanText) {
    await apiCall('/sendMessage', {
      chat_id: chatId,
      text: 'Federation AI online. Tag me with a question and I will answer. 🌌 $GFOF',
      reply_to_message_id: message.message_id
    });
    return;
  }

  if (!conversationHistory[chatId]) conversationHistory[chatId] = [];
  conversationHistory[chatId].push({ role: 'user', content: cleanText });
  if (conversationHistory[chatId].length > 10) {
    conversationHistory[chatId] = conversationHistory[chatId].slice(-10);
  }

  await apiCall('/sendChatAction', { chat_id: chatId, action: 'typing' });

  try {
    const reply = await anthropicCall(conversationHistory[chatId]);
    conversationHistory[chatId].push({ role: 'assistant', content: reply });
    await apiCall('/sendMessage', {
      chat_id: chatId,
      text: reply,
      reply_to_message_id: isGroup ? message.message_id : undefined,
      parse_mode: 'Markdown'
    });
  } catch (e) {
    console.error('Anthropic error:', e.message);
    await apiCall('/sendMessage', {
      chat_id: chatId,
      text: 'Federation comms disruption detected. Please try again in a moment. 🌌',
      reply_to_message_id: isGroup ? message.message_id : undefined
    });
  }
}

async function handleCommand(message) {
  const chatId = message.chat.id;
  const command = message.text.split(' ')[0].toLowerCase().split('@')[0];

  const responses = {
    '/start': `Welcome to the Galactic Federation of Finance AI! 🌌\n\nI can answer any questions about $GFOF — our mission, tokenomics, roadmap, how to buy, and more.\n\nJust ask me anything. The council is listening. $GFOF`,
    '/about': `$GFOF — Galactic Federation of Finance 🌌\n\nA community-driven DeFi protocol on Solana.\nStore of value today. Lending tomorrow.\n\n🌐 galacticfederation.co\n📈 Buy: dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\n\nThe mission continues. $GFOF 🚀`,
    '/buy': `Ready to join the federation? 🌌\n\n📈 Buy $GFOF on DexScreener:\nhttps://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\n\nNetwork: Solana\nContract: 3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\n\nAlways do your own research. $GFOF 🚀`,
    '/roadmap': `$GFOF Galactic Roadmap 🌌\n\n🟡 Phase 1 (NOW): Token live. Community building. Store of value.\n⬜ Phase 2: Federation expansion. Governance. Alliances.\n⬜ Phase 3: DeFi lending protocol. User-first design.\n⬜ Phase 4: Expanding universe. Community decides.\n\nThe mission continues. $GFOF 🚀`,
    '/website': `🌐 Visit the official $GFOF website:\ngalacticfederation.co\n\nLive chart, whitepaper, mission, roadmap, and the Federation AI. $GFOF 🌌`,
    '/whitepaper': `📋 Read the official $GFOF Whitepaper:\ngalacticfederation.co\n\nCovers: mission, tokenomics, roadmap, governance, lending protocol vision.\n\nThe foundation is solid. $GFOF 🌌`,
    '/price': `📈 Check live $GFOF price and chart:\nhttps://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\n\nAlways do your own research. Not financial advice. $GFOF 🌌`,
    '/links': `🌌 Official $GFOF Links\n\n🌐 Website: galacticfederation.co\n📈 Buy $GFOF: dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE\n✈️ Telegram: t.me/+-OApwM3RErkyYjQx\n🐦 X/Twitter: Search $GFOF\n📋 Whitepaper: galacticfederation.co\n\n$GFOF 🚀`,
    '/help': `Federation AI Commands 🌌\n\n/start — Welcome message\n/about — About $GFOF\n/buy — How to buy $GFOF\n/price — Live price link\n/roadmap — Project roadmap\n/website — Official website\n/whitepaper — Read the whitepaper\n/links — All official links\n/help — This menu\n\nOr tag me with any question:\n@GFOFAIBot what is $GFOF?\n\n$GFOF 🚀`
  };

  const response = responses[command] || responses['/help'];
  await apiCall('/sendMessage', {
    chat_id: chatId,
    text: response,
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
}

// =============================================
// KEEP-ALIVE SYSTEM
// Pings the server every 4 minutes to prevent
// Railway from sleeping the instance
// =============================================
function startKeepAlive() {
  if (!APP_URL) {
    console.log('APP_URL not set — keep-alive disabled. Set APP_URL in Railway variables.');
    return;
  }

  const pingInterval = 4 * 60 * 1000; // 4 minutes

  function ping() {
    const url = new URL(APP_URL);
    const options = {
      hostname: url.hostname,
      path: '/ping',
      method: 'GET',
      headers: { 'User-Agent': 'GFOF-KeepAlive/1.0' }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      console.log(`Keep-alive ping: ${res.statusCode} at ${new Date().toISOString()}`);
    });
    req.on('error', (e) => console.log('Keep-alive ping failed:', e.message));
    req.end();
  }

  // Initial ping after 30 seconds
  setTimeout(ping, 30000);

  // Then every 4 minutes
  setInterval(ping, pingInterval);

  console.log(`Keep-alive active — pinging ${APP_URL}/ping every 4 minutes`);
}

// Also use UptimeRobot for extra reliability
// Sign up free at uptimerobot.com and monitor your APP_URL/ping
// It pings every 5 minutes and alerts you if bot goes down

// =============================================
// WEBHOOK SERVER
// =============================================
const server = http.createServer(async (req, res) => {

  // Keep-alive ping endpoint
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      bot: 'GFOF Federation AI',
      ticker: '$GFOF',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Health check
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'GFOF Federation AI Bot Online',
      ticker: '$GFOF',
      website: 'galacticfederation.co',
      uptime: Math.floor(process.uptime()) + 's'
    }));
    return;
  }

  // Telegram webhook
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        if (update.message) {
          const msg = update.message;
          if (msg.text && msg.text.startsWith('/')) {
            await handleCommand(msg);
          } else {
            await handleMessage(msg);
          }
        }
      } catch (e) {
        console.error('Update processing error:', e.message);
      }
      res.writeHead(200);
      res.end('OK');
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`GFOF Federation AI Bot running on port ${PORT}`);
  console.log(`Website: galacticfederation.co`);
  console.log('Telegram bot is online and waiting for messages...');
  startKeepAlive();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});
