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
