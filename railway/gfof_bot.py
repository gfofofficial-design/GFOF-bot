#!/usr/bin/env python3
"""
$GFOF Federation Bot
Telegram community bot for t.me/GFOF_SOL
Handles common questions automatically so you don't have to.

SETUP:
1. Message @BotFather on Telegram
2. Create new bot: /newbot
3. Copy the API token
4. Replace BOT_TOKEN below with your token
5. Add the bot to your GFOF_SOL group as admin
6. Run: python3 gfof_bot.py

The bot will auto-reply to common questions 24/7.
"""

import logging
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# ── CONFIG ──────────────────────────────────────────────
import os
BOT_TOKEN = os.environ.get("BOT_TOKEN", "8720418080:AAHbo3R6GAH-_ucVDTYGilVI1YTeTGFvg2E")

CA = "2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon"
WEBSITE = "https://galacticfederation.co"
DEXSCREENER = "https://dexscreener.com/solana/3y4NNTfU3y1KzCChAJyQUv5RmX3zuZNxVbXer2vjASGE"
TELEGRAM = "https://t.me/GFOF_SOL"
TWITTER = "https://x.com/GFOF_Offcial"
STREAMFLOW_1 = "https://app.streamflow.finance/contract/solana/mainnet/2mChitupSi1zoFZ3qXeerYJdNrz5bxz3cGodcgVzRs1y"
STREAMFLOW_2 = "https://app.streamflow.finance/contract/solana/mainnet/DXkrssY5FMJ2oWHUkRQHDkiGYhiZ27jx8EBw5RE2GnYv"
STREAMFLOW_3 = "https://app.streamflow.finance/contract/solana/mainnet/7HKRtFyeFAmxuSzXrZ8rayDYGBwSJZMgrn8Xna6hqg7k"
# ────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)

# ── RESPONSES ───────────────────────────────────────────

RESPONSES = {
    # Contract address
    "ca": f"""⬡ $GFOF CONTRACT ADDRESS

`{CA}`

Copy and paste into Jupiter, Phantom or DexScreener to buy.

📊 Chart: {DEXSCREENER}
🌐 Website: {WEBSITE}

NFA | DYOR 🌌""",

    # How to buy
    "buy": f"""⬡ HOW TO BUY $GFOF

1️⃣ Download Phantom wallet (phantom.app)
2️⃣ Fund with SOL
3️⃣ Go to Jupiter (jup.ag) or DexScreener
4️⃣ Paste the CA:
`{CA}`
5️⃣ Swap SOL for $GFOF

📊 Chart: {DEXSCREENER}
🌐 More info: {WEBSITE}

NFA | DYOR 🌌""",

    # Price / chart
    "price": f"""⬡ $GFOF PRICE & CHART

📊 Live chart: {DEXSCREENER}

Current MC: ~$19K
Bond target: $73K → Raydium listing
Bond progress: ~26%

Still pre-bond. Still early. 🌌

NFA | DYOR""",

    # What is GFOF
    "what": f"""⬡ WHAT IS $GFOF?

$GFOF = Galactic Federation of Finance

A community-governed DeFi protocol on Solana built for regular people.

🔒 Dev tokens locked on-chain — 3 wallets, 10% of supply
🗳️ Realms DAO governance post-bond
💰 Stake2Earn — top holders earn SOL from LP fees
🏦 DeFi lending coming Phase 3 — borrow without selling
🚀 $73K bond triggers Raydium listing

🌐 {WEBSITE}
📊 {DEXSCREENER}

NFA | DYOR 🌌""",

    # Roadmap
    "roadmap": f"""⬡ $GFOF ROADMAP

PHASE 1 — NOW ✅
• Live on Solana (Meteora DBC)
• Dev tokens locked
• Buy bot active
• Building community

PHASE 2 — POST BOND 🎯
• Raydium listing
• Stake2Earn (earn SOL just for holding)
• Realms DAO governance
• Founding Member NFTs
• Security audit

PHASE 3 — DEFI LENDING 🏦
• Borrow against $GFOF without selling
• Community-governed rates
• No banks needed

PHASE 4 — FULL DAO 🌐
• Yield programs
• Multi-chain expansion
• Full governance

Bond target: $73K
Progress: ~26%

{WEBSITE} 🌌""",

    # Token locks
    "locked": f"""⬡ TOKEN LOCKS — VERIFIED ON-CHAIN

10% of total supply locked across 3 wallets:

🔒 Lock 1: {STREAMFLOW_1}
🔒 Lock 2: {STREAMFLOW_2}
🔒 Lock 3: {STREAMFLOW_3}

Click any link to verify on Streamflow.
Immutable. Transparent. Provable.

No rug. 🌌""",

    # Stake2Earn
    "stake": f"""⬡ STAKE2EARN — HOW IT WORKS

After the bond ($73K MC):

✅ Top $GFOF stakers (Top 100) earn SOL
✅ Rewards come from permanently locked LP trading fees
✅ SOL claimable immediately
✅ Memecoin portion auto-compounds
✅ No impermanent loss risk

The longer you hold and stake — the more SOL you earn.

Holding $GFOF literally pays you in SOL. 🌌

{WEBSITE}""",

    # Bond
    "bond": f"""⬡ WHAT IS THE BOND?

$GFOF launched on Meteora DBC (Dynamic Bonding Curve).

When market cap hits $73K:
🚀 Automatic migration to Raydium
📈 Listed on Moonshot front page
💰 Liquidity permanently locked
⚡ Stake2Earn activates
🗳️ DAO governance begins

Current MC: ~$19K
Bond progress: ~26%
Remaining: ~$54K

We're getting there. 🌌

{DEXSCREENER}""",

    # Giveaway
    "giveaway": f"""⬡ ACTIVE GIVEAWAY

5,000,000 $GFOF tokens up for grabs!

To enter:
✅ Follow @GFOF_Offcial on X
✅ Like & repost the giveaway tweet
✅ Tag someone who belongs in the federation

Winner picked Tuesday via Commenter.io — fully verifiable.

Find the tweet: {TWITTER} 🌌""",

    # Rug / scam concerns
    "rug": f"""⬡ IS $GFOF A RUG?

Here's the proof it's not:

🔒 3 token locks on-chain — verify yourself:
{STREAMFLOW_1}

✅ Verified account on X (@GFOF_Offcial)
✅ Live website: {WEBSITE}
✅ Active Telegram community
✅ Buy bot live in group
✅ Dev building in public

Everything is verifiable. Nothing is hidden.
DYOR — the data is all on-chain. 🌌""",

    # Links
    "links": f"""⬡ $GFOF OFFICIAL LINKS

🌐 Website: {WEBSITE}
📊 Chart: {DEXSCREENER}
🐦 Twitter: {TWITTER}
💬 Telegram: {TELEGRAM}
📋 CA: `{CA}`

Only trust these official links.
Beware of scammers. 🌌""",
}

# Keywords that trigger each response
KEYWORDS = {
    "ca": ["ca", "contract", "address", "contract address", "token address"],
    "buy": ["how to buy", "how do i buy", "where to buy", "how buy", "buy gfof", "purchase"],
    "price": ["price", "chart", "mc", "market cap", "dexscreener", "how much", "worth"],
    "what": ["what is gfof", "what is $gfof", "what's gfof", "explain", "tell me about", "new here", "just joined"],
    "roadmap": ["roadmap", "road map", "plans", "future", "what's coming", "phases", "phase"],
    "locked": ["locked", "locks", "streamflow", "rug pull", "team tokens", "dev tokens"],
    "stake": ["stake2earn", "staking", "stake to earn", "earn sol", "rewards", "yield"],
    "bond": ["bond", "bonding", "raydium", "migration", "73k", "$73k", "when raydium"],
    "giveaway": ["giveaway", "give away", "contest", "prize", "win"],
    "rug": ["rug", "scam", "legit", "safe", "trust", "fake"],
    "links": ["links", "website", "official", "telegram link", "twitter link"],
}


def find_response(text: str):
    """Find matching response for message text."""
    text_lower = text.lower()
    for key, keywords in KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                return RESPONSES[key]
    return None


# ── COMMAND HANDLERS ────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"⬡ WELCOME TO THE GALACTIC FEDERATION\n\n"
        f"I'm the Federation Bot. Ask me anything about $GFOF.\n\n"
        f"Try: 'what is gfof', 'how to buy', 'price', 'roadmap', 'locked', 'links'\n\n"
        f"🌐 {WEBSITE} 🌌"
    )

async def ca_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["ca"], parse_mode="Markdown")

async def buy_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["buy"])

async def price_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["price"])

async def roadmap_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["roadmap"])

async def links_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["links"], parse_mode="Markdown")

async def bond_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["bond"])

async def stake_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(RESPONSES["stake"])

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "⬡ FEDERATION BOT COMMANDS\n\n"
        "/ca — Contract address\n"
        "/buy — How to buy $GFOF\n"
        "/price — Price & chart\n"
        "/roadmap — Full roadmap\n"
        "/bond — What is the bond?\n"
        "/stake — Stake2Earn explained\n"
        "/links — All official links\n"
        "/start — Welcome message\n\n"
        "Or just ask naturally — I understand plain English! 🌌"
    )

# ── MESSAGE HANDLER ──────────────────────────────────────

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Auto-reply to common questions in group chat."""
    if not update.message or not update.message.text:
        return

    text = update.message.text
    response = find_response(text)

    if response:
        await update.message.reply_text(response, parse_mode="Markdown")


# ── MAIN ────────────────────────────────────────────────

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("ca", ca_command))
    app.add_handler(CommandHandler("buy", buy_command))
    app.add_handler(CommandHandler("price", price_command))
    app.add_handler(CommandHandler("roadmap", roadmap_command))
    app.add_handler(CommandHandler("links", links_command))
    app.add_handler(CommandHandler("bond", bond_command))
    app.add_handler(CommandHandler("stake", stake_command))

    # Auto-reply to natural language questions
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("⬡ Federation Bot is running... 🌌")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
