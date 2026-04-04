const https = require('https');
const http = require('http');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
const PORT = process.env.PORT || 3002;
const APP_URL = process.env.APP_URL || '';
const CA = '2oQmHWoTZRmRLregHKjBSGJy3ueX3iRNzimy2iZCmoon';
const CHECK_INTERVAL = 20 * 1000;

var lastBuys5m = 0;
var lastBuys1h = 0;
var lastPrice = 0;
var startTime = Date.now();
var totalBuysPosted = 0;
var checkCount = 0;
var consecutiveErrors = 0;
var isStartup = true;

function sendTelegram(message, retries) {
  retries = retries || 0;
  if (!TELEGRAM_TOKEN || !GROUP_CHAT_ID) {
    console.log('[BOT] ' + message.replace(/<[^>]*>/g, '').substring(0, 120));
    return;
  }
  var body = JSON.stringify({ chat_id: GROUP_CHAT_ID, text: message, parse_mode: 'HTML', disable_web_page_preview: true });
  var req = https.request({
    hostname: 'api.telegram.org',
    path: '/bot' + TELEGRAM_TOKEN + '/sendMessage',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, function(res) {
    var d = '';
    res.on('data', function(c) { d += c; });
    res.on('end', function() {
      try {
        var r = JSON.parse(d);
        if (r.ok) { totalBuysPosted++; console.log('[SENT] ✅'); }
        else {
          console.log('[TG ERROR]', r.description);
          if (r.error_code === 429 && retries < 3) {
            setTimeout(function() { sendTelegram(message, retries + 1); }, ((r.parameters && r.parameters.retry_after) || 5) * 1000);
          }
        }
      } catch(e) {}
    });
  });
  req.on('error', function(e) { if (retries < 3) setTimeout(function() { sendTelegram(message, retries + 1); }, 5000); });
  req.setTimeout(15000, function() { req.destroy(); });
  req.write(body); req.end();
}

function fmtPrice(p) {
  if (!p) return '$0';
  if (p < 0.000001) return '$' + p.toFixed(10);
  if (p < 0.00001)  return '$' + p.toFixed(9);
  if (p < 0.0001)   return '$' + p.toFixed(8);
  if (p < 0.001)    return '$' + p.toFixed(7);
  if (p < 0.01)     return '$' + p.toFixed(6);
  return '$' + p.toFixed(4);
}

function fmtNum(n) {
  if (!n) return '$0';
  if (n >= 1000000) return '$' + (n/1000000).toFixed(2) + 'M';
  if (n >= 1000)    return '$' + (n/1000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

function getBuyEmoji(usd) {
  if (usd >= 5000) return '🐳🐳🐳🚀🌌🌌🌌🌌🌌';
  if (usd >= 1000) return '🐳🚀🌌🌌🌌';
  if (usd >= 500)  return '🐋🚀🌌🌌';
  if (usd >= 100)  return '🦈💰🌌';
  if (usd >= 50)   return '🐬📈🌌';
  if (usd >= 10)   return '🐟⚡';
  return '🌊';
}

function getBuyTitle(usd) {
  if (usd >= 5000) return '🚨🚨 MEGA WHALE ALERT 🚨🚨';
  if (usd >= 1000) return '🚨 WHALE BUY DETECTED 🚨';
  if (usd >= 500)  return '💥 BIG BUY ALERT';
  if (usd >= 100)  return '🔥 STRONG BUY';
  if (usd >= 50)   return '⚡ NEW FEDERATION MEMBER';
  if (usd >= 10)   return '✅ NEW BUY';
  return '🌊 BUY DETECTED';
}

function getBondBar(mc) {
  var target = 73000;
  var pct = Math.min(100, Math.round((mc / target) * 100));
  var filled = Math.round(pct / 10);
  var bar = '';
  for (var i = 0; i < 10; i++) bar += i < filled ? '▓' : '░';
  return bar + ' ' + pct + '%\nMC: <b>' + fmtNum(mc) + '</b>  |  Target: <b>$73K</b>  |  Need: <b>' + fmtNum(Math.max(0, target - mc)) + '</b>';
}

function fetchData(callback) {
  var req = https.request({
    hostname: 'api.dexscreener.com',
    path: '/latest/dex/tokens/' + CA,
    method: 'GET',
    headers: { 'User-Agent': 'GFOF-BuyBot/2.0' }
  }, function(res) {
    var d = '';
    res.on('data', function(c) { d += c; });
    res.on('end', function() {
      try {
        var json = JSON.parse(d);
        if (json.pairs && json.pairs.length > 0) { consecutiveErrors = 0; callback(null, json.pairs[0]); }
        else callback(new Error('No pair data'));
      } catch(e) { callback(new Error('Parse error')); }
    });
  });
  req.on('error', function(e) { callback(e); });
  req.setTimeout(12000, function() { req.destroy(); callback(new Error('Timeout')); });
  req.end();
}

function checkForBuys() {
  checkCount++;
  fetchData(function(err, pair) {
    if (err) {
      consecutiveErrors++;
      console.log('[CHECK ' + checkCount + '] Error: ' + err.message);
      if (consecutiveErrors === 10) sendTelegram('⚠️ <b>$GFOF Buy Bot</b> — Fetch issues. Still watching. 🌌');
      return;
    }
    var price   = parseFloat(pair.priceUsd || 0);
    var mc      = parseFloat(pair.fdv || pair.marketCap || 0);
    var liq     = parseFloat((pair.liquidity && pair.liquidity.usd) || 0);
    var vol5m   = parseFloat((pair.volume && pair.volume.m5) || 0);
    var c5m     = parseFloat((pair.priceChange && pair.priceChange.m5) || 0);
    var c1h     = parseFloat((pair.priceChange && pair.priceChange.h1) || 0);
    var buys5m  = parseInt((pair.txns && pair.txns.m5 && pair.txns.m5.buys) || 0);
    var sells5m = parseInt((pair.txns && pair.txns.m5 && pair.txns.m5.sells) || 0);
    var buys1h  = parseInt((pair.txns && pair.txns.h1 && pair.txns.h1.buys) || 0);
    var sells1h = parseInt((pair.txns && pair.txns.h1 && pair.txns.h1.sells) || 0);

    console.log('[CHECK ' + checkCount + '] Price:' + fmtPrice(price) + ' Buys5m:' + buys5m + ' Buys1h:' + buys1h + ' MC:' + fmtNum(mc));

    if (isStartup) {
      lastBuys5m = buys5m; lastBuys1h = buys1h; lastPrice = price;
      isStartup = false;
      console.log('[STARTUP] Baseline set. Watching for buys...');
      return;
    }

    var newBuys5m = Math.max(0, buys5m - lastBuys5m);
    var newBuys1h = Math.max(0, buys1h - lastBuys1h);
    var newBuys = newBuys5m > 0 ? newBuys5m : (newBuys1h > 0 ? 1 : 0);

    if (newBuys > 0 && vol5m > 0) {
      var singleBuyUsd = vol5m / Math.max(buys5m, 1);
      var emoji = getBuyEmoji(singleBuyUsd);
      var title = getBuyTitle(singleBuyUsd);
      var priceTrend = c5m > 0 ? '📈' : c5m < 0 ? '📉' : '➡️';

      var msg =
        emoji + '\n' +
        '<b>' + title + '</b>\n' +
        '━━━━━━━━━━━━━━━━━\n\n' +
        (newBuys > 1 ? '🔢 New Buys: <b>' + newBuys + '</b>\n' : '') +
        (singleBuyUsd > 0 ? '💵 Est. Buy: <b>' + fmtNum(singleBuyUsd) + '</b>\n' : '') +
        '💲 Price: <b>' + fmtPrice(price) + '</b> ' + priceTrend + '\n' +
        '📊 5m: <b>' + (c5m >= 0 ? '+' : '') + c5m.toFixed(2) + '%</b>' +
        '  |  1h: <b>' + (c1h >= 0 ? '+' : '') + c1h.toFixed(2) + '%</b>\n' +
        '💧 Liquidity: <b>' + fmtNum(liq) + '</b>\n' +
        '🔄 Buys/Sells (5m): <b>' + buys5m + ' / ' + sells5m + '</b>\n\n' +
        '🚀 <b>Bond Progress:</b>\n' +
        getBondBar(mc) + '\n\n' +
        '━━━━━━━━━━━━━━━━━\n' +
        '🌌 <b>Galactic Federation of Finance</b>\n' +
        '💎 <i>Store of value today. DeFi lending coming.</i>\n\n' +
        '📈 <a href="https://dexscreener.com/solana/' + CA + '">Buy $GFOF</a>  |  ' +
        '🌐 <a href="https://galacticfederation.co">Website</a>  |  ' +
        '📱 <a href="https://t.me/GFOF_SOL">Telegram</a>\n\n' +
        '<code>' + CA + '</code>\n\n' +
        '#GFOF #Solana #GalacticFederation $GFOF 🚀';

      sendTelegram(msg);
    }

    lastBuys5m = buys5m; lastBuys1h = buys1h; lastPrice = price;
  });
}

function keepAlive() {
  if (!APP_URL) { console.log('[KEEPALIVE] Set APP_URL env var to prevent Render sleep'); return; }
  setInterval(function() {
    try {
      var url = new URL(APP_URL + '/ping');
      var proto = url.protocol === 'https:' ? https : http;
      var req = proto.request({ hostname: url.hostname, path: '/ping', method: 'GET' },
        function(res) { console.log('[PING] ' + res.statusCode); });
      req.on('error', function() {});
      req.setTimeout(8000, function() { req.destroy(); });
      req.end();
    } catch(e) {}
  }, 4 * 60 * 1000);
}

var server = http.createServer(function(req, res) {
  if (req.url === '/ping' || req.url === '/') {
    var up = Math.floor((Date.now() - startTime) / 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online', bot: '$GFOF Buy Bot v2',
      uptime: Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm',
      checks: checkCount, buys_posted: totalBuysPosted,
      last_price: lastPrice ? fmtPrice(lastPrice) : 'pending',
      errors: consecutiveErrors, ca: CA
    }));
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, function() {
  console.log('\n🌌 $GFOF Buy Bot v2 — Online port ' + PORT);
  console.log('📡 CA: ' + CA);
  console.log('📬 Group ID: ' + (GROUP_CHAT_ID || '❌ NOT SET'));
  console.log('🔑 Token: ' + (TELEGRAM_TOKEN ? '✅ SET' : '❌ NOT SET'));
  console.log('🌐 App URL: ' + (APP_URL || '❌ NOT SET — add this to prevent sleep'));
  console.log('');

  setTimeout(function() {
    sendTelegram(
      '🤖 <b>$GFOF Buy Bot v2 Online!</b> 🌌\n\n' +
      '✅ Checking every 20 seconds\n' +
      '✅ Bond progress on every buy\n' +
      '✅ Whale alerts active\n' +
      '✅ Keep-alive — no more sleeping\n\n' +
      'The federation is watching. 🚀\n\n' +
      '<a href="https://dexscreener.com/solana/' + CA + '">Buy $GFOF</a> | ' +
      '<a href="https://galacticfederation.co">Website</a>'
    );
  }, 2000);

  setTimeout(checkForBuys, 4000);
  setInterval(checkForBuys, CHECK_INTERVAL);
  keepAlive();
});
