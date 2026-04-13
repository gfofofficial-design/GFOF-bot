# $GFOF Federation Bot — Railway Deployment Guide

## What you need
- A GitHub account (free)
- A Railway account (free at railway.app)
- Your Telegram bot token from @BotFather

---

## STEP 1 — Create your bot token

1. Open Telegram and search for @BotFather
2. Send: /newbot
3. Name it: GFOF Federation Bot
4. Username: GFOFfederationbot (or similar)
5. Copy the API token it gives you — looks like:
   7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

---

## STEP 2 — Add your token to the bot file

Open gfof_bot.py and replace this line:
   BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

With your actual token:
   BOT_TOKEN = "7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

---

## STEP 3 — Push to GitHub

1. Go to github.com and create a new repository
   - Name it: gfof-bot
   - Set to Private
   - Click Create repository

2. Upload these 4 files to the repo:
   - gfof_bot.py
   - requirements.txt
   - Procfile
   - railway.json

---

## STEP 4 — Deploy on Railway

1. Go to railway.app
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your gfof-bot repository
6. Railway will auto-detect Python and deploy

---

## STEP 5 — Add your bot token as environment variable

Instead of hardcoding the token, use Railway's env vars:

1. In Railway dashboard → your project → Variables
2. Add new variable:
   Name:  BOT_TOKEN
   Value: your actual token

3. Update line 1 in gfof_bot.py to:
   import os
   BOT_TOKEN = os.environ.get("BOT_TOKEN")

This keeps your token secure and out of GitHub.

---

## STEP 6 — Add bot to your Telegram group

1. Open t.me/GFOF_SOL
2. Click group name → Add Members
3. Search for your bot username
4. Add it
5. Make it an Admin (so it can read and reply to messages)
   - Go to Admins → Add Admin → select your bot
   - Give it: Post Messages, Delete Messages

---

## STEP 7 — Test it

In your Telegram group type:
- /start
- /ca
- /buy
- "what is gfof"
- "how do i buy"
- "is this a rug"

The bot should reply instantly to all of these.

---

## Bot handles these automatically

| Someone asks... | Bot replies with... |
|---|---|
| ca / contract address | CA + buy links |
| how to buy | Step by step guide |
| price / chart | DexScreener link |
| what is gfof | Full explanation |
| roadmap | All 4 phases |
| locked / rug / scam | 3 lock verification links |
| stake2earn | How staking works |
| bond / raydium | Bond explained |
| giveaway | Current giveaway details |
| links | All official links |

---

## Keeping it updated

When the bond progresses or numbers change:
1. Edit gfof_bot.py — update MC, bond % etc
2. Push to GitHub
3. Railway auto-redeploys in ~60 seconds

---

## Cost

Railway free tier: $5 credit/month included
Bot hosting cost: ~$0.50-1.00/month
Effectively FREE for a small bot like this.

---

## Support

If you get stuck on any step just ask me and
I'll walk you through it. 🌌
