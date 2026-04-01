/* ═══════════════════════════════════════════════════════════════
   TradeMatrix Pro — tradematrix.js  (Enhanced Professional Edition)
   Algorithms: MA/EMA Stack, ADX, Supertrend, Bollinger Bands,
               Ichimoku, VWAP, Fibonacci, Session Analysis,
               Kelly Criterion, Gold XAUUSD Module
   ═══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
const $   = id => document.getElementById(id);
const num = id => { const v = parseFloat($( id)?.value); return isNaN(v) ? null : v; };
const sel = id => $( id)?.value || '';
const pct = (v, base) => (base && base !== 0) ? ((v - base) / base * 100) : null;
const fmt  = (v, d = 4)  => v == null ? '—' : Number(v).toFixed(d);
const fmt2 = (v, d = 2)  => v == null ? '—' : Number(v).toFixed(d) + '%';
const fmtPrice = (v, d)  => {
  if (v == null) return '—';
  // Auto-determine decimal places from magnitude
  d = d ?? (v > 100 ? 2 : v > 1 ? 4 : 6);
  return Number(v).toFixed(d);
};

/* ══════════════════════════════════════
   CLOCK & SESSION TICKER
══════════════════════════════════════ */
function updateClock() {
  const now    = new Date();
  const h      = String(now.getUTCHours()).padStart(2,'0');
  const m      = String(now.getUTCMinutes()).padStart(2,'0');
  const s      = String(now.getUTCSeconds()).padStart(2,'0');
  const clock  = $('tm-clock');
  const badge  = $('tm-session-badge');
  const sess   = getSession();
  if (clock) clock.textContent = `${h}:${m}:${s} UTC`;
  if (badge) {
    badge.textContent  = sess.label;
    badge.className    = `tm-session ${sess.cls}`;
  }
}
setInterval(updateClock, 1000);
updateClock();

/* ══════════════════════════════════════
   TAB SWITCHER
══════════════════════════════════════ */
function switchTab(t) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p  => p.classList.remove('active'));
  $('panel-' + t).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.getAttribute('data-tab') === t) b.classList.add('active');
  });
  if (t === 'gold') updateGoldSessionBanner();
}

/* ══════════════════════════════════════
   SESSION ANALYSIS
   Forex/Gold optimal trading sessions (UTC)
══════════════════════════════════════ */
const SESSIONS = {
  sydney:    { start: 21, end: 6,  label: 'Sydney',         cls: 'slow',  score: 30 },
  tokyo:     { start: 0,  end: 9,  label: 'Tokyo',          cls: 'slow',  score: 40 },
  london:    { start: 8,  end: 17, label: 'London',         cls: 'good',  score: 72 },
  newyork:   { start: 13, end: 22, label: 'New York',       cls: 'good',  score: 75 },
  overlap_ln:{ start: 13, end: 17, label: 'London-NY Overlap', cls: 'prime', score: 100 },
};

function getSession() {
  const h = new Date().getUTCHours();
  if (h >= 13 && h < 17) return { label: '🎯 London-NY', cls: 'prime', score: 100, full: 'London-NY Overlap (Prime)', emoji: '🎯' };
  if (h >= 8  && h < 17) return { label: '🟢 London',   cls: 'good',  score: 72,  full: 'London Session', emoji: '✅' };
  if (h >= 13 && h < 22) return { label: '🟢 New York', cls: 'good',  score: 75,  full: 'New York Session', emoji: '✅' };
  if (h >= 0  && h < 9 ) return { label: '🟡 Tokyo',    cls: 'slow',  score: 40,  full: 'Tokyo Session (Low Vol)', emoji: '⚠️' };
  if (h >= 21 || h < 6 ) return { label: '🟡 Sydney',   cls: 'slow',  score: 30,  full: 'Sydney Session (Low Vol)', emoji: '⚠️' };
  return                          { label: '🔴 Off-Hours', cls: 'avoid', score: 20, full: 'Off-Hours', emoji: '🔴' };
}

function updateGoldSessionBanner() {
  const sess  = getSession();
  const el    = $('gold-session-status');
  const elT   = $('gold-session-time');
  const badge = $('tm-session-badge');
  const now   = new Date();
  const hStr  = String(now.getUTCHours()).padStart(2,'0') + ':' + String(now.getUTCMinutes()).padStart(2,'0') + ' UTC';
  if (el)  el.textContent  = sess.full;
  if (elT) elT.textContent = hStr;
  if (badge) {
    badge.textContent = sess.label;
    badge.className   = `tm-session ${sess.cls}`;
  }
}
setInterval(() => { if ($('panel-gold').classList.contains('active')) updateGoldSessionBanner(); }, 30000);

/* ══════════════════════════════════════
   INDICATOR SCORING FUNCTIONS
══════════════════════════════════════ */

/** ADX Trend Strength */
function scoreADX(adx) {
  if (adx == null) return null;
  if (adx > 50) return { zone: 'Momentum Surge', pass: true,   c: 'var(--accent)',  e: '⚡', strength: 'Very Strong' };
  if (adx > 28) return { zone: 'Strong Trend',   pass: true,   c: 'var(--green)',   e: '✅', strength: 'Strong' };
  if (adx > 20) return { zone: 'Developing',     pass: 'warn', c: 'var(--yellow)',  e: '⚠️', strength: 'Developing' };
  if (adx > 15) return { zone: 'Weak Trend',     pass: 'warn', c: 'var(--orange)',  e: '🟠', strength: 'Weak' };
  return              { zone: 'No Trend/Range',  pass: false,  c: 'var(--red)',     e: '🔴', strength: 'Ranging' };
}

/** RSI Zone Assessment */
function scoreRSI(rsi, context = 'default') {
  if (rsi == null) return null;
  if (context === 'gold') {
    if (rsi >= 50 && rsi <= 70) return { zone: 'Sweet Spot',      pass: true,   c: 'var(--green)',  e: '🎯' };
    if (rsi >= 45 && rsi <  50) return { zone: 'Building',        pass: 'warn', c: 'var(--yellow)', e: '🟡' };
    if (rsi >  70 && rsi <= 80) return { zone: 'Overbought',      pass: 'warn', c: 'var(--orange)', e: '⚠️' };
    if (rsi >  80)               return { zone: 'Extreme OB',      pass: false,  c: 'var(--red)',    e: '🔴' };
    if (rsi <  40)               return { zone: 'Weak/Below',      pass: false,  c: 'var(--red)',    e: '🔴' };
    return                              { zone: 'Neutral',         pass: 'warn', c: 'var(--yellow)', e: '🟡' };
  }
  if (rsi >= 50 && rsi <= 72) return { zone: 'Bullish Zone',     pass: true,   c: 'var(--green)',  e: '✅' };
  if (rsi >  72 && rsi <= 82) return { zone: 'Overbought',       pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
  if (rsi >  82)               return { zone: 'Extreme OB',       pass: false,  c: 'var(--red)',    e: '🔴' };
  if (rsi <  40)               return { zone: 'Weak',             pass: false,  c: 'var(--red)',    e: '🔴' };
  return                              { zone: 'Neutral',          pass: 'warn', c: 'var(--yellow)', e: '🟡' };
}

/** KDJ Oscillator */
function scoreKDJ(k, d, j) {
  if (k == null || d == null) return null;
  if (k < d)                  return { zone: 'Bearish',         pass: false,  c: 'var(--red)',    e: '🔴' };
  if (j != null && j > 90)   return { zone: 'Extreme OB',      pass: false,  c: 'var(--red)',    e: '🔴' };
  if (j != null && j > 80)   return { zone: 'Overbought',      pass: 'warn', c: 'var(--yellow)', e: '🟡' };
  if (j != null && j < 20)   return { zone: 'Oversold Bounce', pass: true,   c: 'var(--accent)', e: '💡' };
  if (j != null && j > 50)   return { zone: 'Bullish Strong',  pass: true,   c: 'var(--green)',  e: '✅' };
  return                             { zone: 'Bullish Building',pass: true,   c: 'var(--accent)', e: '🟢' };
}

/** MACD Zone */
function scoreMACDZone(dif, dea) {
  if (dif == null || dea == null) return null;
  if (dif < dea) return { zone: 'Bearish',             pass: false,  c: 'var(--red)',    e: '🔴' };
  const diff = Math.abs(dif - dea);
  const avg  = (Math.abs(dif) + Math.abs(dea)) / 2;
  if (avg > 0 && diff / avg < 0.05) return { zone: 'Near Cross',  pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
  if (dif > 0 && dea > 0)           return { zone: 'Strong Bull', pass: true,   c: 'var(--green)',  e: '🚀' };
  return                                    { zone: 'Bullish',     pass: true,   c: 'var(--accent)', e: '✅' };
}

/** Supertrend (price vs supertrend value) */
function scoreSupertrend(price, st) {
  if (price == null || st == null) return null;
  if (price > st) return { zone: 'Bullish', pass: true,  c: 'var(--green)', e: '🟢' };
  return                 { zone: 'Bearish', pass: false, c: 'var(--red)',   e: '🔴' };
}

/** Ichimoku Cloud */
function scoreIchimoku(position) {
  if (!position) return null;
  if (position === 'above')  return { zone: 'Above Cloud', pass: true,   c: 'var(--green)',  e: '✅' };
  if (position === 'inside') return { zone: 'Inside Cloud',pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
  return                            { zone: 'Below Cloud', pass: false,  c: 'var(--red)',    e: '🔴' };
}

/** VWAP */
function scoreVWAP(price, vwap) {
  if (price == null || vwap == null) return null;
  const pctAbove = pct(price, vwap);
  if (pctAbove > 2)  return { zone: `+${pctAbove.toFixed(2)}% above VWAP`, pass: true,   c: 'var(--green)',  e: '✅' };
  if (pctAbove >= 0) return { zone: `+${pctAbove.toFixed(2)}% above VWAP`, pass: true,   c: 'var(--accent)', e: '🟢' };
  return                    { zone: `${pctAbove.toFixed(2)}% below VWAP`,  pass: false,  c: 'var(--red)',    e: '🔴' };
}

/** Volume */
function scoreVolume(vol) {
  if (vol == null) return null;
  if (vol >= 1.5) return { zone: 'Very Strong', pass: true,   c: 'var(--green)',  e: '⚡' };
  if (vol >= 1.2) return { zone: 'Strong',      pass: true,   c: 'var(--green)',  e: '✅' };
  if (vol >= 0.8) return { zone: 'Moderate',    pass: 'warn', c: 'var(--yellow)', e: '🟡' };
  return                 { zone: 'Weak',         pass: false,  c: 'var(--red)',    e: '🔴' };
}

/** MA/EMA Trend Grade */
function getGrade(gap) {
  if (gap < 0)   return { g: 'BEAR', e: '🔻', cls: 'grade-x',   c: 'var(--red)' };
  if (gap < 1)   return { g: 'FLAT', e: '➡️',  cls: 'grade-x',   c: 'var(--dim)' };
  if (gap < 3)   return { g: 'S++',  e: '🚀',  cls: 'grade-spp', c: 'var(--green)' };
  if (gap < 5)   return { g: 'A',    e: '✅',  cls: 'grade-a',   c: 'var(--accent)' };
  if (gap < 8)   return { g: 'B',    e: '⚠️',  cls: 'grade-b',   c: 'var(--yellow)' };
  if (gap < 10)  return { g: 'C',    e: '🟡',  cls: 'grade-c',   c: 'var(--orange)' };
  return               { g: 'X',    e: '🛑',  cls: 'grade-x',   c: 'var(--red)' };
}

/* ══════════════════════════════════════
   FIBONACCI CALCULATOR
══════════════════════════════════════ */
function calcFib(high, low) {
  if (high == null || low == null || high <= low) return null;
  const r = high - low;
  return {
    ext2:   high + r * 1.000,
    ext1:   high + r * 0.618,
    '0':    high,
    '23.6': high - r * 0.236,
    '38.2': high - r * 0.382,
    '50':   high - r * 0.500,
    '61.8': high - r * 0.618,
    '78.6': high - r * 0.786,
    '100':  low,
    range:  r,
  };
}

function nearestFibLevel(price, fib) {
  const levels = ['0','23.6','38.2','50','61.8','78.6','100'];
  let closest = null, minDist = Infinity;
  for (const lv of levels) {
    const d = Math.abs(price - fib[lv]);
    if (d < minDist) { minDist = d; closest = lv; }
  }
  const pctFromLevel = ((price - fib[closest]) / fib.range) * 100;
  return { level: closest, price: fib[closest], distPct: pctFromLevel };
}

/* ══════════════════════════════════════
   KELLY CRITERION POSITION SIZING
   f* = (p×b − q) / b  →  use half-Kelly for safety
══════════════════════════════════════ */
function kellySize(winRate, avgWinR, avgLossR) {
  if (!winRate || !avgWinR || !avgLossR || avgLossR === 0) return null;
  const b = avgWinR / avgLossR;
  const p = winRate / 100;
  const q = 1 - p;
  const kelly = (p * b - q) / b;
  return {
    full: Math.max(0, Math.min(100, kelly * 100)),
    half: Math.max(0, Math.min(100, kelly * 50)),  // safer
  };
}

/* ══════════════════════════════════════
   TRADE PLAN BUILDER (ATR-based)
══════════════════════════════════════ */
function buildTradePlan(containerId, cardId, price, atr, accountSize, riskPct, context = 'default') {
  const card = $(cardId);
  const box  = $(containerId);
  if (!card || !box || !price || !atr) { if (card) card.style.display = 'none'; return; }
  card.style.display = '';

  // Gold uses slightly wider ATR multipliers due to higher volatility
  const slMult  = context === 'gold' ? 1.8 : 1.5;
  const tp1Mult = context === 'gold' ? 1.5 : 1.5;
  const tp2Mult = context === 'gold' ? 3.0 : 3.0;
  const tp3Mult = context === 'gold' ? 5.0 : 5.0;

  const sl   = price - atr * slMult;
  const tp1  = price + atr * tp1Mult;
  const tp2  = price + atr * tp2Mult;
  const tp3  = price + atr * tp3Mult;
  const risk = price - sl;
  const rr1  = (tp1 - price) / risk;
  const rr2  = (tp2 - price) / risk;
  const rr3  = (tp3 - price) / risk;

  const dp = context === 'gold' ? 2 : 4;

  let kellyHtml = '';
  const kellyId = containerId.replace('price-block','kelly-block');
  const kellyEl = $(kellyId);

  if (accountSize && riskPct) {
    const riskAmt     = accountSize * (riskPct / 100);
    const shares      = (riskAmt / risk).toFixed(2);
    const positionVal = (price * parseFloat(shares)).toFixed(2);
    // Estimated Kelly-inspired sizing (using typical 55% win-rate, 1.8 avg RR)
    const kelly  = kellySize(55, 1.8, 1.0);
    const kellySz = kelly ? (kelly.half).toFixed(1) : null;

    if (kellyEl) {
      kellyEl.style.display = '';
      kellyEl.innerHTML = `
        <div class="kelly-block">
          <div class="kelly-title">⚖️ Risk Management Calculator</div>
          <div class="kelly-row"><span class="kelly-label">Account Size</span><span class="kelly-val">$${Number(accountSize).toLocaleString()}</span></div>
          <div class="kelly-row"><span class="kelly-label">Risk per Trade (${riskPct}%)</span><span class="kelly-val red" style="color:var(--red)">$${riskAmt.toFixed(2)}</span></div>
          <div class="kelly-row"><span class="kelly-label">Risk per Unit (SL distance)</span><span class="kelly-val">$${risk.toFixed(dp)}</span></div>
          <div class="kelly-row"><span class="kelly-label">Suggested Units / Shares</span><span class="kelly-val green">${shares}</span></div>
          <div class="kelly-row"><span class="kelly-label">Position Value</span><span class="kelly-val">$${Number(positionVal).toLocaleString()}</span></div>
          ${kellySz ? `<div class="kelly-row"><span class="kelly-label">Half-Kelly Position Size</span><span class="kelly-val yellow">${kellySz}% of account</span></div>` : ''}
          <div class="kelly-row" style="margin-top:.25rem;padding-top:.25rem;border-top:1px solid var(--border)">
            <span class="kelly-label" style="color:var(--muted);font-size:9.5px">💡 Rule: Never risk >2% per trade. Reduce size if in drawdown.</span>
          </div>
        </div>`;
    }
  } else {
    if (kellyEl) kellyEl.style.display = 'none';
  }

  box.innerHTML = `
    <div class="prow entry">
      <span class="prow-label">Ideal Entry</span>
      <span class="prow-val accent">${price.toFixed(dp)}</span>
      <span class="prow-note">Current market price — enter on confirmation candle</span>
    </div>
    <div class="prow sl">
      <span class="prow-label">Stop Loss (ATR×${slMult})</span>
      <span class="prow-val red">${sl.toFixed(dp)}</span>
      <span class="prow-note">Set immediately — non-negotiable. Risk: $${risk.toFixed(dp)}</span>
    </div>
    <div class="prow tp1">
      <span class="prow-label">TP1 — 40% Position</span>
      <span class="prow-val green">${tp1.toFixed(dp)}</span>
      <span class="prow-note">R:R 1:${rr1.toFixed(1)} — move SL to breakeven at TP1</span>
    </div>
    <div class="prow tp2">
      <span class="prow-label">TP2 — 40% Position</span>
      <span class="prow-val g2">${tp2.toFixed(dp)}</span>
      <span class="prow-note">R:R 1:${rr2.toFixed(1)} — trail stop by ATR×1.0</span>
    </div>
    <div class="prow tp3">
      <span class="prow-label">TP3 — 20% Position</span>
      <span class="prow-val g3">${tp3.toFixed(dp)}</span>
      <span class="prow-note">R:R 1:${rr3.toFixed(1)} — trail stop or hold for trend</span>
    </div>
    <div class="prow info" style="margin-top:.2rem">
      <span class="prow-label">Trailing Stop</span>
      <span class="prow-val gold">ATR × 1.0</span>
      <span class="prow-note">After TP1 hit: trail using 1× ATR below each higher high</span>
    </div>`;
}

/* ══════════════════════════════════════
   PIE CHART RENDERER
══════════════════════════════════════ */
function drawPie(svgId, legendId, segments) {
  const svg    = $(svgId);
  const legend = $(legendId);
  if (!svg || !legend) return;

  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  if (total === 0) { svg.innerHTML = ''; legend.innerHTML = ''; return; }

  const cx = 80, cy = 80, r = 68, inner = 42;
  let paths = '';
  let startAngle = -Math.PI / 2;
  const segs = segments.filter(s => s.value > 0);

  segs.forEach(seg => {
    const angle    = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const large    = angle > Math.PI ? 1 : 0;

    const x1  = cx + r     * Math.cos(startAngle), y1  = cy + r     * Math.sin(startAngle);
    const x2  = cx + r     * Math.cos(endAngle),   y2  = cy + r     * Math.sin(endAngle);
    const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle);
    const ix2 = cx + inner * Math.cos(endAngle),   iy2 = cy + inner * Math.sin(endAngle);

    paths += `<path d="M${ix1} ${iy1} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z" fill="${seg.color}" opacity="0.9" stroke="var(--card)" stroke-width="2"><title>${seg.label}: ${((seg.value/total)*100).toFixed(1)}%</title></path>`;
    startAngle = endAngle;
  });

  const topSeg = [...segs].sort((a,b) => b.value - a.value)[0];
  const topPct = ((topSeg.value / total) * 100).toFixed(0);
  paths += `<text x="${cx}" y="${cy-4}" text-anchor="middle" font-family="'Syne',sans-serif" font-size="16" font-weight="800" fill="${topSeg.color}">${topPct}%</text>`;
  paths += `<text x="${cx}" y="${cy+10}" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="8" fill="var(--muted)">${topSeg.label.toUpperCase().slice(0,8)}</text>`;
  svg.innerHTML = paths;

  legend.innerHTML = segs.map(s => {
    const p = ((s.value/total)*100).toFixed(1);
    return `<div class="legend-item"><div class="legend-dot" style="background:${s.color}"></div><span class="legend-label">${s.label}</span><span class="legend-val" style="color:${s.color}">${s.value}</span><span class="legend-pct">${p}%</span></div>`;
  }).join('');
}

/* ══════════════════════════════════════
   DIAL / GAUGE
══════════════════════════════════════ */
function updateDial(arcId, scoreId, score, goldMode = false) {
  const arc = $(arcId);
  const txt = $(scoreId);
  if (!arc || !txt) return;
  const total = 188;
  const dash  = (Math.min(100, Math.max(0, score)) / 100) * total;
  arc.setAttribute('stroke-dasharray', `${dash} ${total}`);
  txt.textContent = Math.round(score);
  const color = goldMode
    ? (score >= 75 ? '#FFD700' : score >= 55 ? '#f5c842' : '#f03a4a')
    : (score >= 75 ? '#00e87a' : score >= 55 ? '#f5c842' : '#f03a4a');
  txt.setAttribute('fill', color);
}

/* ══════════════════════════════════════
   SIGNAL METER
══════════════════════════════════════ */
function updateMeter(meterId, passCount, total) {
  const el = $(meterId);
  if (!el) return;
  const color = passCount >= total * .8 ? 'var(--green)'
              : passCount >= total * .5 ? 'var(--yellow)'
              : 'var(--red)';
  el.innerHTML = Array.from({ length: total }, (_,i) =>
    `<div class="signal-seg" style="background:${i < passCount ? color : 'var(--border)'}"></div>`
  ).join('');
}

/* ══════════════════════════════════════
   RANGE BAR
══════════════════════════════════════ */
function updateRange(fillId, markerId, labelId, val, max) {
  const pctNum = Math.min(100, Math.max(0, (val / max) * 100));
  const fill   = $(fillId);
  const marker = $(markerId);
  const label  = $(labelId);
  if (fill)   fill.style.width  = pctNum + '%';
  if (marker) marker.style.left = pctNum + '%';
  if (label)  label.textContent = fmt2(val);
}

/* ══════════════════════════════════════
   CHECKLIST ROW BUILDER
══════════════════════════════════════ */
function buildCheck(label, pass, result) {
  const icon = pass === true ? '✔' : pass === false ? '✘' : '○';
  const cls  = pass === true ? 'check-pass' : pass === false ? 'check-fail' : 'check-neutral';
  const vcls = pass === true ? 'pass' : pass === false ? 'fail' : 'warn';
  return `<div class="check-row"><span class="${cls}">${icon}</span><span class="check-label">${label}</span><span class="check-val ${vcls}">${result || ''}</span></div>`;
}

/* ══════════════════════════════════════
   DECISION STRIP UPDATER
══════════════════════════════════════ */
function setDecisionStrip(pfx, decision, riskLevel, grade, metaHtml, sessionChip = null) {
  const dClass = decision === 'PROCEED' ? 'proceed' : decision === 'SKIP' ? 'skip' : 'watch';
  $(`${pfx}-decision-strip`).className = `decision-strip ${dClass}`;
  const badge = $(`${pfx}-d-badge`);
  badge.className   = `d-badge ${dClass}`;
  badge.textContent = decision;

  const rp = $(`${pfx}-risk-pill`);
  rp.className   = `risk-pill ${riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium'}`;
  rp.textContent = riskLevel;

  const gb = $(`${pfx}-grade-badge`);
  if (grade) {
    gb.className   = `grade-badge ${grade.cls}`;
    gb.textContent = `${grade.e} ${grade.g}`;
    gb.style.display = '';
  } else {
    gb.style.display = 'none';
  }

  $(`${pfx}-d-meta`).innerHTML = metaHtml;

  const sc = $(`${pfx}-session-chip`);
  if (sc) {
    if (sessionChip) { sc.textContent = sessionChip; sc.style.display = ''; }
    else sc.style.display = 'none';
  }
}

/* ══════════════════════════════════════
   WEIGHTED SCORE ENGINE
   Adds pass/warn/fail weights cleanly
══════════════════════════════════════ */
function scoreEngine() {
  let score = 0, total = 0;
  const add = (pass, w) => {
    if (pass == null) return; // optional — not counted
    total += w;
    if (pass === true)   score += w;
    else if (pass === 'warn') score += w * 0.5;
    // false = 0 contribution
  };
  const result = () => total > 0 ? (score / total) * 100 : 0;
  return { add, result, getTotal: () => total, getScore: () => score };
}

/* ══════════════════════════════════════
   MA CALCULATOR
══════════════════════════════════════ */
function maCalc() {
  const price = num('ma-price');
  const ma5   = num('ma-ma5');
  const ma20  = num('ma-ma20');
  const ma50  = num('ma-ma50');

  if (!price || !ma5 || !ma20 || !ma50) { $('ma-result').style.display = 'none'; return; }
  $('ma-result').style.display = '';

  const ma200 = num('ma-ma200');
  const k     = num('ma-k');
  const d     = num('ma-d');
  const j     = num('ma-j');
  const dif   = num('ma-dif');
  const dea   = num('ma-dea');
  const vol   = num('ma-vol');
  const atr   = num('ma-atr');
  const adxV  = num('ma-adx');
  const stV   = num('ma-st');
  const bbu   = num('ma-bbu');
  const bbl   = num('ma-bbl');
  const riskPct   = num('ma-risk-pct');
  const accountSz = num('ma-account');

  /* Distances */
  const pAboveMA20    = pct(price, ma20);
  const pAboveMA5     = pct(price, ma5);
  const pAboveMA50    = pct(price, ma50);
  const pAboveMA200   = ma200 ? pct(price, ma200) : null;
  const ma5AboveMA20  = pct(ma5,  ma20);
  const ma20AboveMA50 = pct(ma20, ma50);
  const ma50AbMA200   = ma200 ? pct(ma50, ma200) : null;

  /* Filter evaluations */
  const f1_pass = price > ma5;
  const f2_pass = ma5   > ma20;
  const f3_pass = ma20  > ma50;
  const f4_ma200 = ma200 ? price > ma200 : null; // Macro trend filter
  const kdj      = scoreKDJ(k, d, j);
  const macd     = scoreMACDZone(dif, dea);
  const volS     = scoreVolume(vol);
  const adxS     = scoreADX(adxV);
  const stS      = scoreSupertrend(price, stV);

  /* Weighted Score Engine */
  const eng = scoreEngine();
  eng.add(f1_pass,             18);
  eng.add(f2_pass,             16);
  eng.add(f3_pass,             14);
  eng.add(f4_ma200,             8);
  eng.add(kdj  ? kdj.pass  : null, 16);
  eng.add(macd ? macd.pass : null, 14);
  eng.add(volS ? volS.pass : null,  8);
  eng.add(adxS ? adxS.pass : null, 10);
  eng.add(stS  ? stS.pass  : null,  6);

  /* Stretch Penalty — price overextended above MA20 */
  let penalty = 0;
  if      (pAboveMA20 > 12) penalty = -20;
  else if (pAboveMA20 > 8)  penalty = -12;
  else if (pAboveMA20 > 5)  penalty = -6;
  const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));

  /* Decision Logic */
  const momentumOk = (!kdj  || kdj.pass  !== false)
                  && (!macd || macd.pass !== false)
                  && (!adxS || adxS.pass !== false);

  let decision, riskLevel, posSize;
  if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
    decision = 'SKIP';    riskLevel = 'High Risk';   posSize = '0%';
  } else if (adjScore >= 75) {
    decision = 'PROCEED'; riskLevel = 'Low Risk';    posSize = pAboveMA20 > 5 ? '50%' : '100%';
  } else if (adjScore >= 55) {
    decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
  } else {
    decision = 'WATCH';   riskLevel = 'Medium Risk'; posSize = '25%';
  }

  const grade = getGrade(ma20AboveMA50);

  /* Decision Strip */
  setDecisionStrip('ma', decision, riskLevel, grade, `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      &nbsp; MA5: <span style="color:var(--text)">${fmt(ma5)}</span>
      MA20: <span style="color:var(--text)">${fmt(ma20)}</span>
      MA50: <span style="color:var(--text)">${fmt(ma50)}</span>
    </div>
    <div>Position: <span style="color:${posSize==='100%'?'var(--green)':'var(--yellow)'}">${posSize}</span>
      &nbsp; Score: <span style="color:var(--accent)">${adjScore.toFixed(0)}/100</span>
      ${adxV ? `&nbsp; ADX: <span style="color:${adxS.c}">${adxV.toFixed(1)} ${adxS.strength}</span>` : ''}
    </div>`
  );

  /* Advice */
  const adv = $('ma-advice');
  if (decision === 'PROCEED') {
    const lines = [
      pAboveMA20 > 5
        ? `⚠️ Price ${pAboveMA20.toFixed(1)}% above MA20 — stretched. Consider waiting for pullback toward MA5 (${fmt(ma5)}).`
        : `✅ Full bull MA stack confirmed. Price is ${pAboveMA20.toFixed(1)}% above MA20 (ideal ≤2%).`,
      `📐 Entry: ${fmt(price)} | SL: ${atr ? fmt(price - atr*1.5) : 'set 1×ATR below entry'}`,
      ma200 && price > ma200 ? `🌐 Macro bullish: Price above MA200 (${fmt(ma200)}) — trend aligned across all timeframes.` : '',
      adxS && adxS.pass === true ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend strength. High-conviction setup.` : '',
      `📦 Position size: ${posSize}. Set SL immediately after entry.`,
    ].filter(Boolean).join('\n');
    adv.textContent = lines;
    adv.className   = 'advice-box green';
  } else if (decision === 'WATCH') {
    adv.textContent = `⚠️ Partial setup (Score: ${adjScore.toFixed(0)}/100). Conditions not ideal — wait for full MA alignment + momentum confirmation before entering. Monitor for KDJ crossover and MACD histogram expansion.`;
    adv.className = 'advice-box yellow';
  } else {
    const missing = [
      !f1_pass           && `Price < MA5`,
      !f2_pass           && `MA5 < MA20`,
      !f3_pass           && `MA20 < MA50`,
      kdj?.pass  === false && `KDJ Bearish`,
      macd?.pass === false && `MACD Bearish`,
      adxS?.pass === false && `ADX Weak (${adxV?.toFixed(1)})`,
    ].filter(Boolean);
    adv.textContent = `🔴 Skip — ${missing.length} critical filter${missing.length>1?'s':''} failed: ${missing.join(', ')}. Do not force entry against the filter stack.`;
    adv.className   = 'advice-box red';
  }

  /* Dial */
  updateDial('ma-dial-arc', 'ma-dial-score', adjScore);

  /* Pie */
  drawPie('ma-pie', 'ma-pie-legend', [
    { label: 'MA Stack', value: (f1_pass?1:0)+(f2_pass?1:0)+(f3_pass?1:0)+(f4_ma200?1:0),                 color: 'var(--accent)' },
    { label: 'KDJ',      value: kdj  ? (kdj.pass===true?1:kdj.pass==='warn'?.5:0) : 0,                    color: 'var(--green)' },
    { label: 'MACD',     value: macd ? (macd.pass===true?1:macd.pass==='warn'?.5:0) : 0,                  color: 'var(--yellow)' },
    { label: 'Volume',   value: volS ? (volS.pass===true?1:volS.pass==='warn'?.5:0) : 0,                  color: 'var(--orange)' },
    { label: 'ADX',      value: adxS ? (adxS.pass===true?1:adxS.pass==='warn'?.5:0) : 0,                 color: 'var(--accent2)' },
    { label: 'Supertrend',value: stS ? (stS.pass===true?1:0) : 0,                                        color: 'var(--green2)' },
  ].filter(s => s.value > 0));

  /* Checklist */
  const passArr = [f1_pass, f2_pass, f3_pass,
    kdj?.pass===true, macd?.pass===true,
    volS?.pass===true, adxS?.pass===true
  ].filter(Boolean);

  $('ma-checklist').innerHTML = [
    buildCheck('F1 — Price > MA5',       f1_pass,  fmt2(pAboveMA5)),
    buildCheck('F2 — MA5 > MA20',        f2_pass,  fmt2(ma5AboveMA20)),
    buildCheck('F3 — MA20 > MA50',       f3_pass,  fmt2(ma20AboveMA50)),
    ma200 != null
      ? buildCheck('F4 — Price > MA200 (Macro)', f4_ma200, `${fmt2(pAboveMA200)} ${f4_ma200?'✅':'🔴'}`)
      : buildCheck('F4 — MA200 (Macro)',  null, 'Not provided'),
    kdj
      ? buildCheck(`F5 — KDJ ${kdj.zone}`, kdj.pass===true?true:kdj.pass===false?false:null, `K:${k?.toFixed(1)} D:${d?.toFixed(1)} J:${j?.toFixed(1)}`)
      : buildCheck('F5 — KDJ',  null, 'Not provided'),
    macd
      ? buildCheck(`F6 — MACD ${macd.zone}`, macd.pass===true?true:macd.pass===false?false:null, `DIF:${dif} DEA:${dea}`)
      : buildCheck('F6 — MACD', null, 'Not provided'),
    volS
      ? buildCheck(`F7 — Volume ${volS.zone}`, volS.pass===true?true:volS.pass===false?false:null, `${vol}× ${volS.zone}`)
      : buildCheck('F7 — Volume', null, 'Not provided'),
    adxS
      ? buildCheck(`ADX ${adxS.zone}`, adxS.pass===true?true:adxS.pass===false?false:null, `ADX: ${adxV?.toFixed(1)}`)
      : buildCheck('ADX Trend Strength', null, 'Not provided'),
    stS
      ? buildCheck(`Supertrend ${stS.zone}`, stS.pass, `Price:${fmt(price)} ST:${fmt(stV)}`)
      : buildCheck('Supertrend', null, 'Not provided'),
  ].join('');

  updateMeter('ma-signal-meter', passArr.length, 7);

  /* Alignment Grid */
  const alignRows = [
    ['Price vs MA20', pAboveMA20,   pAboveMA20>=0&&pAboveMA20<=2?'green':pAboveMA20>10?'red':pAboveMA20>5?'yellow':'accent'],
    ['Price vs MA5',  pAboveMA5,    pAboveMA5 >=0?'green':'red'],
    ['Price vs MA50', pAboveMA50,   pAboveMA50>=0?'green':'red'],
    ['MA5 vs MA20',   ma5AboveMA20, ma5AboveMA20>0?'green':'red'],
    ['MA20 vs MA50',  ma20AboveMA50,ma20AboveMA50>0?'green':'red'],
  ];
  if (ma200) {
    alignRows.push(['Price vs MA200', pAboveMA200, pAboveMA200>=0?'green':'red']);
    alignRows.push(['MA50 vs MA200',  ma50AbMA200, ma50AbMA200>=0?'green':'red']);
  }

  $('ma-alignment-grid').innerHTML = alignRows.map(([l,v,c]) =>
    `<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${v!=null?(v>=0?'+':'')+v.toFixed(2)+'%':'—'}</div></div>`
  ).join('');

  updateRange('ma-range-fill','ma-range-marker','ma-range-label', Math.max(0, pAboveMA20||0), 12);

  /* Bollinger Band Section */
  const bbSection = $('ma-bb-section');
  if (bbu != null && bbl != null && bbl < bbu) {
    bbSection.style.display = '';
    const bbRange = bbu - bbl;
    const bbPos   = bbRange > 0 ? ((price - bbl) / bbRange) * 100 : 50;
    const bbFill  = $('ma-bb-fill');
    const bbMark  = $('ma-bb-marker');
    const bbLbl   = $('ma-bb-label');
    if (bbFill)  bbFill.style.width  = Math.min(100, Math.max(0, bbPos)) + '%';
    if (bbMark)  bbMark.style.left   = Math.min(100, Math.max(0, bbPos)) + '%';
    if (bbLbl)   bbLbl.textContent   = `${bbPos.toFixed(1)}% of BB width`;
  } else {
    bbSection.style.display = 'none';
  }

  /* Trade Plan */
  buildTradePlan('ma-price-block','ma-tradeplan-card', price, atr, accountSz, riskPct);
}

function resetMA() {
  ['ma-price','ma-ma5','ma-ma20','ma-ma50','ma-ma200',
   'ma-k','ma-d','ma-j','ma-dif','ma-dea','ma-hist',
   'ma-vol','ma-rsi','ma-atr','ma-adx','ma-st','ma-bbu','ma-bbl',
   'ma-risk-pct','ma-account',
  ].forEach(id => { const el=$(id); if(el) el.value=''; });
  $('ma-result').style.display = 'none';
}

/* ══════════════════════════════════════
   EMA CALCULATOR
══════════════════════════════════════ */
function emaCalc() {
  const price = num('ema-price');
  const e8    = num('ema-ema8');
  const e21   = num('ema-ema21');
  const e55   = num('ema-ema55');

  if (!price || !e8 || !e21 || !e55) { $('ema-result').style.display = 'none'; return; }
  $('ema-result').style.display = '';

  const e200   = num('ema-ema200');
  const k      = num('ema-k');
  const d      = num('ema-d');
  const j      = num('ema-j');
  const dif    = num('ema-dif');
  const dea    = num('ema-dea');
  const vol    = num('ema-vol');
  const atr    = num('ema-atr');
  const adxV   = num('ema-adx');
  const stV    = num('ema-st');
  const vwapV  = num('ema-vwap');
  const ichiP  = sel('ema-ichi');
  const bidask = num('ema-bidask');
  const beta   = num('ema-beta');
  const open   = num('ema-open');
  const prev   = num('ema-prev');
  const high   = num('ema-high');
  const low    = num('ema-low');
  const w52h   = num('ema-52h');
  const w52l   = num('ema-52l');
  const riskPct   = num('ema-risk-pct');
  const accountSz = num('ema-account');

  /* Distances */
  const pAboveE8    = pct(price, e8);
  const pAboveE21   = pct(price, e21);
  const pAboveE55   = pct(price, e55);
  const pAboveE200  = e200 ? pct(price, e200) : null;
  const e8AboveE21  = pct(e8,  e21);
  const e21AboveE55 = pct(e21, e55);
  const e55AbE200   = e200 ? pct(e55, e200) : null;

  /* Filters */
  const f1_pass   = price > e8;
  const f2_pass   = e8    > e21;
  const f3_pass   = e21   > e55;
  const f4_e200   = e200  ? price > e200 : null;
  const fullStack  = f1_pass && f2_pass && f3_pass;
  const kdj       = scoreKDJ(k, d, j);
  const macd      = scoreMACDZone(dif, dea);
  const volS      = scoreVolume(vol);
  const adxS      = scoreADX(adxV);
  const stS       = scoreSupertrend(price, stV);
  const ichiS     = ichiP ? scoreIchimoku(ichiP) : null;
  const vwapS     = scoreVWAP(price, vwapV);

  /* Acceleration bonus: EMA8 slope proxy via (price - e8) / e8 trend */
  const acceleration = (pAboveE8 != null && e8AboveE21 != null)
    ? (e8AboveE21 > 0 && pAboveE8 >= 0 && pAboveE8 < 5) // trending but not stretched
    : null;

  /* Score Engine */
  const eng = scoreEngine();
  eng.add(f1_pass,               18);
  eng.add(f2_pass,               18);
  eng.add(f3_pass,               16);
  eng.add(f4_e200,                6);
  eng.add(kdj  ? kdj.pass  : null, 14);
  eng.add(macd ? macd.pass : null, 12);
  eng.add(volS ? volS.pass : null,  8);
  eng.add(adxS ? adxS.pass : null, 10);
  eng.add(ichiS? ichiS.pass: null,  6);
  eng.add(vwapS? vwapS.pass: null,  4);
  eng.add(stS  ? stS.pass  : null,  4);

  const stretchPct = Math.abs(pAboveE8 || 0);
  let penalty = 0;
  if      (stretchPct > 12) penalty = -20;
  else if (stretchPct > 8)  penalty = -12;
  else if (stretchPct > 5)  penalty = -6;
  const adjScore = Math.min(100, Math.max(0, eng.result() + penalty));

  const grade = getGrade(e21AboveE55 || 0);

  /* Decision */
  const momentumOk = (!kdj  || kdj.pass  !== false)
                  && (!macd || macd.pass !== false)
                  && (!adxS || adxS.pass !== false);

  let decision, riskLevel, posSize;
  if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
    decision = 'SKIP';    riskLevel = 'High Risk';   posSize = '0%';
  } else if (adjScore >= 75) {
    decision = 'PROCEED'; riskLevel = 'Low Risk';    posSize = stretchPct > 5 ? '50%' : '100%';
  } else if (adjScore >= 55) {
    decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
  } else {
    decision = 'WATCH';   riskLevel = 'Medium Risk'; posSize = '25%';
  }

  /* Decision Strip */
  setDecisionStrip('ema', decision, riskLevel, grade, `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      EMA8: <span style="color:var(--text)">${fmt(e8)}</span>
      EMA21: <span style="color:var(--text)">${fmt(e21)}</span>
      EMA55: <span style="color:var(--text)">${fmt(e55)}</span>
    </div>
    <div>Bull Stack: <span style="color:${fullStack?'var(--green)':'var(--red)'}">${fullStack?'✅ Yes':'✘ No'}</span>
      &nbsp; Size: <span style="color:${posSize==='100%'?'var(--green)':'var(--yellow)'}">${posSize}</span>
      ${adxV ? `&nbsp; ADX: <span style="color:${adxS.c}">${adxV.toFixed(1)}</span>` : ''}
    </div>`
  );

  /* Advice */
  const adv = $('ema-advice');
  if (decision === 'PROCEED') {
    const lines = [
      stretchPct > 5
        ? `⚠️ EMA stack confirmed but price is ${pAboveE8?.toFixed(1)}% above EMA8 — wait for a pullback to EMA8 (${fmt(e8)}).`
        : `✅ Full EMA bull stack. Price ${pAboveE8?.toFixed(1)}% above EMA8 (ideal ≤2%).`,
      e200 && price > e200 ? `🌐 Macro confirmed: Price above EMA200 — institutional trend alignment.` : '',
      adxS?.pass===true ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend. High-probability entry.` : '',
      ichiS?.pass===true ? `☁️ Price above Ichimoku cloud — trend confirmed.` : '',
      vwapV && price > vwapV ? `📊 Price above VWAP — intraday bulls in control.` : '',
      `📦 Use ${posSize} position. Stop Loss = Price − (ATR × 1.5). Trail after TP1.`,
    ].filter(Boolean).join('\n');
    adv.textContent = lines;
    adv.className   = 'advice-box green';
  } else if (decision === 'WATCH') {
    adv.textContent = `⚠️ Partial EMA setup (Score: ${adjScore.toFixed(0)}/100). Wait for Price > EMA8 > EMA21 > EMA55 with all momentum indicators aligned.`;
    adv.className   = 'advice-box yellow';
  } else {
    const missing = [
      !f1_pass           && 'Price < EMA8',
      !f2_pass           && 'EMA8 < EMA21',
      !f3_pass           && 'EMA21 < EMA55',
      kdj?.pass===false  && 'KDJ Bearish',
      macd?.pass===false && 'MACD Bearish',
      adxS?.pass===false && `ADX Weak (${adxV?.toFixed(1)})`,
    ].filter(Boolean);
    adv.textContent = `🔴 Skip — broken EMA stack. Failed: ${missing.join(', ')}.`;
    adv.className   = 'advice-box red';
  }

  /* Dial & Pie */
  updateDial('ema-dial-arc','ema-dial-score', adjScore);
  drawPie('ema-pie','ema-pie-legend', [
    { label: 'EMA Stack',   value: (f1_pass?1:0)+(f2_pass?1:0)+(f3_pass?1:0)+(f4_e200?1:0),       color: 'var(--accent)' },
    { label: 'KDJ',         value: kdj  ?(kdj.pass===true?1:kdj.pass==='warn'?.5:0):0,             color: 'var(--green)' },
    { label: 'MACD',        value: macd ?(macd.pass===true?1:macd.pass==='warn'?.5:0):0,           color: 'var(--yellow)' },
    { label: 'Volume',      value: volS ?(volS.pass===true?1:volS.pass==='warn'?.5:0):0,           color: 'var(--orange)' },
    { label: 'ADX',         value: adxS ?(adxS.pass===true?1:adxS.pass==='warn'?.5:0):0,          color: 'var(--accent2)' },
    { label: 'Ichimoku',    value: ichiS?(ichiS.pass===true?1:ichiS.pass==='warn'?.5:0):0,        color: 'var(--red)' },
    { label: 'VWAP',        value: vwapS?(vwapS.pass===true?1:0):0,                               color: 'var(--green2)' },
  ].filter(s => s.value > 0));

  /* Checklist */
  const passArr = [f1_pass, f2_pass, f3_pass,
    kdj?.pass===true, macd?.pass===true,
    volS?.pass===true, adxS?.pass===true,
  ].filter(Boolean);

  $('ema-checklist').innerHTML = [
    buildCheck('F1 — Price > EMA8',     f1_pass,  fmt2(pAboveE8)),
    buildCheck('F2 — EMA8 > EMA21',    f2_pass,  fmt2(e8AboveE21)),
    buildCheck('F3 — EMA21 > EMA55',   f3_pass,  fmt2(e21AboveE55)),
    e200!=null
      ? buildCheck('F4 — Price > EMA200', f4_e200, `${fmt2(pAboveE200)} ${f4_e200?'✅':'🔴'}`)
      : buildCheck('F4 — EMA200 (Macro)', null, 'Not provided'),
    kdj
      ? buildCheck(`F5 — KDJ ${kdj.zone}`, kdj.pass===true?true:kdj.pass===false?false:null, `K${k?.toFixed(1)} D${d?.toFixed(1)} J${j?.toFixed(1)}`)
      : buildCheck('F5 — KDJ',  null, 'Not provided'),
    macd
      ? buildCheck(`F6 — MACD ${macd.zone}`, macd.pass===true?true:macd.pass===false?false:null, `DIF:${dif} DEA:${dea}`)
      : buildCheck('F6 — MACD', null, 'Not provided'),
    volS
      ? buildCheck(`F7 — Volume ${volS.zone}`, volS.pass===true?true:volS.pass===false?false:null, `${vol}× ${volS.zone}`)
      : buildCheck('F7 — Volume', null, 'Not provided'),
    adxS
      ? buildCheck(`ADX — ${adxS.zone}`, adxS.pass===true?true:adxS.pass===false?false:null, `ADX: ${adxV?.toFixed(1)}`)
      : buildCheck('ADX Trend Strength', null, 'Not provided'),
    ichiS
      ? buildCheck(`Ichimoku — ${ichiS.zone}`, ichiS.pass===true?true:ichiS.pass===false?false:null, ichiS.zone)
      : buildCheck('Ichimoku Cloud', null, 'Not provided'),
    vwapS
      ? buildCheck(`VWAP — ${vwapS.zone}`, vwapS.pass===true?true:vwapS.pass===false?false:null, `VWAP:${fmt(vwapV)}`)
      : buildCheck('VWAP', null, 'Not provided'),
  ].join('');

  updateMeter('ema-signal-meter', passArr.length, 7);

  /* Alignment Grid */
  const alignRows = [
    ['% Above EMA8',  pAboveE8,    pAboveE8>=0&&pAboveE8<=2?'green':pAboveE8>10?'red':pAboveE8>5?'yellow':pAboveE8>=0?'accent':'red'],
    ['% Above EMA21', pAboveE21,   pAboveE21>=0?'accent':'red'],
    ['% Above EMA55', pAboveE55,   pAboveE55>=0?'green':'red'],
    ['EMA8 vs EMA21', e8AboveE21,  e8AboveE21>0?'green':'red'],
    ['EMA21 vs EMA55',e21AboveE55, e21AboveE55>0?'green':'red'],
    ['Full Bull Stack', null, fullStack?'green':'red', fullStack?'✅ Yes':'✘ No'],
  ];
  if (e200) alignRows.push(['% Above EMA200', pAboveE200, pAboveE200>=0?'green':'red']);

  $('ema-alignment-grid').innerHTML = alignRows.map(([l,v,c,ov]) => {
    const display = ov || (v!=null?(v>=0?'+':'')+v.toFixed(2)+'%':'—');
    return `<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${display}</div></div>`;
  }).join('');

  updateRange('ema-range-fill','ema-range-marker','ema-range-label', Math.max(0, e21AboveE55||0), 12);

  /* Price Context */
  const ctx    = $('ema-price-context');
  const hasCtx = (high!=null&&low!=null)||prev!=null||(w52h!=null&&w52l!=null)||beta!=null||bidask!=null;
  ctx.style.display = hasCtx ? '' : 'none';

  if (hasCtx) {
    const cells = [];
    if (prev!=null) {
      const chg = pct(price,prev);
      cells.push(`<div class="stat-cell"><div class="stat-label">vs Prev Close</div><div class="stat-value ${chg>=0?'green':'red'}">${chg>=0?'+':''}${chg?.toFixed(2)}%</div></div>`);
    }
    if (open!=null) {
      const gapPct = pct(price,open);
      cells.push(`<div class="stat-cell"><div class="stat-label">Gap from Open</div><div class="stat-value ${gapPct>=0?'green':'red'}">${gapPct>=0?'+':''}${gapPct?.toFixed(2)}%</div></div>`);
    }
    if (w52h!=null&&w52l!=null) {
      const fromH = pct(price,w52h), fromL = pct(price,w52l);
      cells.push(`<div class="stat-cell"><div class="stat-label">From 52wk High</div><div class="stat-value ${fromH>=-5?'green':fromH>=-20?'accent':'red'}">${fromH?.toFixed(2)}%</div></div>`);
      cells.push(`<div class="stat-cell"><div class="stat-label">From 52wk Low</div><div class="stat-value accent">+${fromL?.toFixed(2)}%</div></div>`);
    }
    if (beta!=null) {
      const bc = beta>1.5?'red':beta>1.0?'yellow':'green';
      cells.push(`<div class="stat-cell"><div class="stat-label">Beta</div><div class="stat-value ${bc}">${beta.toFixed(3)}</div><div class="stat-sub">${beta>1.5?'High vol':beta>1.0?'Above mkt':'Normal'}</div></div>`);
    }
    if (bidask!=null) {
      const bc = bidask>=60?'green':bidask>=40?'accent':'red';
      cells.push(`<div class="stat-cell"><div class="stat-label">Bid/Ask Ratio</div><div class="stat-value ${bc}">${bidask.toFixed(1)}%</div><div class="stat-sub">${bidask>=60?'Strong demand':bidask>=40?'Balanced':'Sellers dominate'}</div></div>`);
    }
    $('ema-ctx-grid').innerHTML = cells.join('');

    if (high!=null&&low!=null&&high>low) {
      const rng     = ((price-low)/(high-low))*100;
      const clamped = Math.min(100,Math.max(0,rng));
      const fill    = $('ema-day-fill');
      const marker  = $('ema-day-marker');
      const pctEl   = $('ema-day-pct');
      if (fill)   fill.style.width  = clamped+'%';
      if (marker) marker.style.left = clamped+'%';
      if (pctEl)  pctEl.textContent = rng.toFixed(1)+'% of range';
      $('ema-day-low').textContent  = 'Low '  + fmt(low,4);
      $('ema-day-high').textContent = 'High ' + fmt(high,4);
    }
  }

  /* Trade Plan */
  buildTradePlan('ema-price-block','ema-tradeplan-card', price, atr, accountSz, riskPct);
}

function resetEMA() {
  ['ema-price','ema-ema8','ema-ema21','ema-ema55','ema-ema200',
   'ema-k','ema-d','ema-j','ema-dif','ema-dea','ema-hist',
   'ema-vol','ema-rsi','ema-atr','ema-adx','ema-st','ema-vwap',
   'ema-open','ema-prev','ema-high','ema-low','ema-52h','ema-52l',
   'ema-bidask','ema-beta','ema-risk-pct','ema-account',
  ].forEach(id => { const el=$(id); if(el) el.value=''; });
  const ichiEl = $('ema-ichi');
  if (ichiEl) ichiEl.value = '';
  $('ema-result').style.display = 'none';
}

/* ══════════════════════════════════════
   GOLD / XAUUSD CALCULATOR
   7-Filter Professional System:
   F1: Price vs EMA21 Proximity
   F2: EMA21 > EMA55 (Short Trend)
   F3: EMA55 > EMA200 (Macro Trend)
   F4: KDJ Oscillator
   F5: RSI14 Sweet Spot (50-70)
   F6: ADX14 Trend Strength (>28)
   F7: MACD Bullish
   Optional: DXY Correlation, Fibonacci, Session
══════════════════════════════════════ */
function goldCalc() {
  const price = num('gold-price');
  const e21   = num('gold-e21');
  const e55   = num('gold-e55');
  const e200  = num('gold-e200');

  if (!price || !e21 || !e55 || !e200) {
    $('gold-result').style.display = 'none';
    return;
  }
  $('gold-result').style.display = '';

  const rsi       = num('gold-rsi');
  const adxV      = num('gold-adx');
  const k         = num('gold-k');
  const d         = num('gold-d');
  const j         = num('gold-j');
  const dif       = num('gold-dif');
  const dea       = num('gold-dea');
  const vol       = num('gold-vol');
  const atr       = num('gold-atr');
  const dxyV      = num('gold-dxy');
  const dxyDir    = sel('gold-dxy-dir');
  const fibH      = num('gold-fibh');
  const fibL      = num('gold-fibl');
  const fibDir    = sel('gold-fib-dir');
  const riskPct   = num('gold-risk-pct');
  const accountSz = num('gold-account');

  /* Distances */
  const pAboveE21   = pct(price, e21);
  const pAboveE55   = pct(price, e55);
  const pAboveE200  = pct(price, e200);
  const e21AboveE55 = pct(e21, e55);
  const e55AboveE200= pct(e55, e200);

  /* Filter Evaluations */
  const f1_proximity = price > e21;  // price above EMA21
  const f1_stretch   = Math.abs(pAboveE21 || 0);
  const f2_pass      = e21 > e55;
  const f3_pass      = e55 > e200;
  const macroPass    = price > e200; // Absolute macro requirement

  const kdj  = scoreKDJ(k, d, j);
  const rsiS = scoreRSI(rsi, 'gold');
  const adxS = scoreADX(adxV);
  const macd = scoreMACDZone(dif, dea);
  const volS = scoreVolume(vol);

  /* DXY Correlation */
  let dxyPass = null, dxyLabel = '—';
  if (dxyDir) {
    if (dxyDir === 'falling') { dxyPass = true;   dxyLabel = '📉 Falling (Bullish Gold)'; }
    if (dxyDir === 'flat')    { dxyPass = 'warn';  dxyLabel = '➡️ Flat (Neutral)'; }
    if (dxyDir === 'rising')  { dxyPass = false;   dxyLabel = '📈 Rising (Bearish Gold)'; }
  }

  /* Session Quality */
  const sess = getSession();
  const sessPass = sess.score >= 70 ? true : sess.score >= 40 ? 'warn' : false;

  /* Score Engine — Gold Weighted */
  const eng = scoreEngine();
  eng.add(f1_proximity,          15);  // F1: Price > EMA21
  eng.add(f2_pass,               15);  // F2: EMA21 > EMA55
  eng.add(f3_pass,               15);  // F3: EMA55 > EMA200 (macro)
  eng.add(kdj  ? kdj.pass  : null, 12);
  eng.add(rsiS ? rsiS.pass : null, 12);
  eng.add(adxS ? adxS.pass : null, 12);
  eng.add(macd ? macd.pass : null, 10);
  eng.add(volS ? volS.pass : null,  6);
  eng.add(dxyPass,                  5);
  eng.add(sessPass,                 3);  // Small weight — timing bonus

  /* Gold Stretch Penalty — gold is more volatile, use tighter threshold */
  let penalty = 0;
  if      (f1_stretch > 6)  penalty = -18;
  else if (f1_stretch > 4)  penalty = -10;
  else if (f1_stretch > 2)  penalty = -4;

  /* Extra penalty for macro misalignment */
  if (!macroPass) penalty -= 10;

  const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));

  /* Grade based on EMA21 vs EMA55 gap */
  const grade = getGrade(e21AboveE55 || 0);

  /* Decision Logic — Gold requires stricter criteria */
  const macroTrendOk = f3_pass && macroPass;
  const momentumOk   = (!kdj  || kdj.pass  !== false)
                    && (!macd || macd.pass !== false)
                    && (!adxS || adxS.pass !== false)
                    && (!rsiS || rsiS.pass !== false);
  const dxyOk        = dxyPass !== false;

  let decision, riskLevel, posSize;
  if (!macroTrendOk || !f1_proximity || !f2_pass || !momentumOk || !dxyOk) {
    decision = 'SKIP';    riskLevel = 'High Risk';   posSize = '0%';
  } else if (adjScore >= 78) {
    decision = 'PROCEED'; riskLevel = 'Low Risk';
    posSize = (f1_stretch > 3 || sess.score < 60) ? '50%' : '100%';
  } else if (adjScore >= 58) {
    decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
  } else {
    decision = 'WATCH';   riskLevel = 'Medium Risk'; posSize = '25%';
  }

  /* Update Session Banner */
  updateGoldSessionBanner();

  /* Decision Strip */
  const chipText = `${sess.emoji} ${sess.full}`;
  setDecisionStrip('gold', decision, riskLevel, grade, `
    <div>XAUUSD: <span style="color:var(--gold);font-weight:700">$${price.toFixed(2)}</span>
      &nbsp; EMA21: <span style="color:var(--text)">${e21.toFixed(2)}</span>
      EMA55: <span style="color:var(--text)">${e55.toFixed(2)}</span>
      EMA200: <span style="color:var(--text)">${e200.toFixed(2)}</span>
    </div>
    <div>Macro: <span style="color:${macroPass?'var(--green)':'var(--red)'}">${macroPass?'✅ Above EMA200':'✘ Below EMA200'}</span>
      &nbsp; Size: <span style="color:${posSize==='100%'?'var(--green)':'var(--yellow)'}">${posSize}</span>
      &nbsp; Score: <span style="color:var(--gold)">${adjScore.toFixed(0)}/100</span>
    </div>`, chipText
  );

  /* Advice */
  const adv = $('gold-advice');
  if (decision === 'PROCEED') {
    const lines = [
      f1_stretch > 3
        ? `⚠️ Gold price is ${f1_stretch.toFixed(1)}% above EMA21 — consider waiting for a pullback to EMA21 ($${e21.toFixed(2)}) before entering.`
        : `✅ Gold momentum confirmed. Price ${pAboveE21?.toFixed(1)}% above EMA21 — within acceptable range.`,
      `📐 Full EMA Stack: EMA21>EMA55>EMA200 ${f2_pass&&f3_pass?'✅ Aligned':'🔴 Misaligned'}`,
      rsiS?.pass===true  ? `📊 RSI ${rsi?.toFixed(1)} — in the gold momentum sweet spot (50-70).` : '',
      adxS?.pass===true  ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend. High-probability gold setup.` : '',
      dxyDir==='falling' ? `💵 DXY falling — dollar weakness supports gold bulls. Adds conviction.` : '',
      sess.score >= 70   ? `⏰ Trading during ${sess.full} — optimal liquidity for gold.` : `⚠️ ${sess.full} — lower liquidity. Consider wider spreads.`,
      `📦 Position: ${posSize}. Gold SL = Entry − (ATR × 1.8). Gold moves in wider ranges; don't use tight stops.`,
    ].filter(Boolean).join('\n');
    adv.textContent = lines;
    adv.className   = 'advice-box gold';
  } else if (decision === 'WATCH') {
    adv.textContent = `⚠️ Partial gold setup (Score: ${adjScore.toFixed(0)}/100). Wait for all 7 filters to align. Key requirements: EMA21>EMA55>EMA200, RSI 50-70, ADX>28, KDJ+MACD bullish. Patience is a trade.`;
    adv.className   = 'advice-box yellow';
  } else {
    const missing = [
      !macroPass         && `Price below EMA200 ($${e200.toFixed(2)}) — no long`,
      !f1_proximity      && `Price below EMA21 ($${e21.toFixed(2)})`,
      !f2_pass           && `EMA21 < EMA55 (short trend bearish)`,
      !f3_pass           && `EMA55 < EMA200 (macro trend bearish)`,
      kdj?.pass===false  && `KDJ Bearish`,
      macd?.pass===false && `MACD Bearish`,
      rsiS?.pass===false && `RSI ${rsi?.toFixed(1)} — outside momentum zone`,
      adxS?.pass===false && `ADX ${adxV?.toFixed(1)} — no trend`,
      dxyPass===false    && `DXY Rising — headwind for gold`,
    ].filter(Boolean);
    adv.textContent = `🔴 Skip gold trade. Critical failures: ${missing.join(' | ')}`;
    adv.className   = 'advice-box red';
  }

  /* Dial */
  updateDial('gold-dial-arc','gold-dial-score', adjScore, true);

  /* Pie */
  drawPie('gold-pie','gold-pie-legend', [
    { label: 'EMA Stack',  value: (f1_proximity?1:0)+(f2_pass?1:0)+(f3_pass?1:0),                    color: '#FFD700' },
    { label: 'KDJ',        value: kdj  ?(kdj.pass===true?1:kdj.pass==='warn'?.5:0):0,                color: 'var(--green)' },
    { label: 'RSI',        value: rsiS ?(rsiS.pass===true?1:rsiS.pass==='warn'?.5:0):0,              color: 'var(--accent)' },
    { label: 'ADX',        value: adxS ?(adxS.pass===true?1:adxS.pass==='warn'?.5:0):0,             color: '#e6b800' },
    { label: 'MACD',       value: macd ?(macd.pass===true?1:macd.pass==='warn'?.5:0):0,              color: 'var(--yellow)' },
    { label: 'DXY',        value: dxyPass===true?1:dxyPass==='warn'?.5:0,                            color: 'var(--orange)' },
    { label: 'Session',    value: sessPass===true?1:sessPass==='warn'?.5:0,                          color: 'var(--green2)' },
  ].filter(s => s.value > 0));

  /* Checklist */
  const passArr = [f1_proximity, f2_pass, f3_pass, macroPass,
    kdj?.pass===true, rsiS?.pass===true, adxS?.pass===true, macd?.pass===true,
  ].filter(Boolean);

  $('gold-checklist').innerHTML = [
    buildCheck('F1 — Price > EMA21 (Momentum)', f1_proximity, `${f1_stretch.toFixed(2)}% above | ${f1_stretch<=2?'🎯 Ideal':f1_stretch<=4?'✅ OK':'⚠️ Stretched'}`),
    buildCheck('F2 — EMA21 > EMA55 (Short Trend)', f2_pass, fmt2(e21AboveE55)),
    buildCheck('F3 — EMA55 > EMA200 (Macro Trend)', f3_pass, fmt2(e55AboveE200)),
    buildCheck('F4 — Price > EMA200 (Institutional)', macroPass, `$${e200.toFixed(2)} ${macroPass?'✅':'🔴 Critical fail'}`),
    kdj
      ? buildCheck(`F5 — KDJ ${kdj.zone}`, kdj.pass===true?true:kdj.pass===false?false:null, `K:${k?.toFixed(1)} D:${d?.toFixed(1)} J:${j?.toFixed(1)}`)
      : buildCheck('F5 — KDJ', null, 'Not provided'),
    rsiS
      ? buildCheck(`F6 — RSI ${rsiS.zone}`, rsiS.pass===true?true:rsiS.pass===false?false:null, `RSI: ${rsi?.toFixed(1)} (target 50-70)`)
      : buildCheck('F6 — RSI14 Momentum', null, 'Not provided'),
    adxS
      ? buildCheck(`F7 — ADX ${adxS.zone}`, adxS.pass===true?true:adxS.pass===false?false:null, `ADX: ${adxV?.toFixed(1)} (min 28)`)
      : buildCheck('F7 — ADX Trend Strength', null, 'Not provided'),
    macd
      ? buildCheck(`MACD — ${macd.zone}`, macd.pass===true?true:macd.pass===false?false:null, `DIF:${dif?.toFixed(2)} DEA:${dea?.toFixed(2)}`)
      : buildCheck('MACD Signal', null, 'Not provided'),
    dxyDir
      ? buildCheck(`DXY Correlation`, dxyPass===true?true:dxyPass===false?false:null, dxyLabel)
      : buildCheck('DXY Correlation', null, 'Not provided'),
    buildCheck(`Session — ${sess.full}`, sessPass===true?true:sessPass==='warn'?null:false, `${sess.emoji} Quality: ${sess.score}/100`),
  ].join('');

  updateMeter('gold-signal-meter', passArr.length, 7);

  /* EMA Alignment Grid */
  $('gold-alignment-grid').innerHTML = [
    ['Price vs EMA21',  pAboveE21,    pAboveE21>=0&&pAboveE21<=2?'green':pAboveE21>5?'red':pAboveE21>3?'yellow':'accent'],
    ['Price vs EMA55',  pAboveE55,    pAboveE55>=0?'accent':'red'],
    ['Price vs EMA200', pAboveE200,   pAboveE200>=0?'green':'red'],
    ['EMA21 vs EMA55',  e21AboveE55,  e21AboveE55>0?'green':'red'],
    ['EMA55 vs EMA200', e55AboveE200, e55AboveE200>0?'green':'red'],
    ['Macro Aligned',   null, macroPass&&f2_pass&&f3_pass?'green':'red', macroPass&&f2_pass&&f3_pass?'✅ Full Bull':'🔴 Misaligned'],
    rsi  != null ? ['RSI14', null, rsiS.c.includes('green')?'green':rsiS.c.includes('yellow')?'yellow':'red', `${rsi.toFixed(1)} ${rsiS.zone}`] : null,
    adxV != null ? ['ADX14', null, adxS.c.includes('green')?'green':adxS.c.includes('yellow')?'yellow':'red', `${adxV.toFixed(1)} ${adxS.strength}`] : null,
  ].filter(Boolean).map(([l,v,c,ov]) => {
    const display = ov || (v!=null?(v>=0?'+':'')+v.toFixed(2)+'%':'—');
    return `<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${display}</div></div>`;
  }).join('');

  updateRange('gold-range-fill','gold-range-marker','gold-range-label', Math.max(0, f1_stretch), 7);

  /* ── FIBONACCI SECTION ── */
  const fibCard = $('gold-fib-card');
  const fib     = calcFib(fibH, fibL);

  if (fib) {
    fibCard.style.display = '';
    const fibLevels = [
      { key: 'ext2',  label: '200% Extension',    tag: 'Target',  tagCls: 'accent' },
      { key: 'ext1',  label: '161.8% Extension',  tag: 'Target',  tagCls: 'accent' },
      { key: '0',     label: '0% — Swing High',   tag: 'High',    tagCls: 'green'  },
      { key: '23.6',  label: '23.6% Retrace',     tag: 'Minor',   tagCls: 'yellow' },
      { key: '38.2',  label: '38.2% — Golden',    tag: 'Key',     tagCls: 'gold'   },
      { key: '50',    label: '50% — Midpoint',    tag: 'Key',     tagCls: 'yellow' },
      { key: '61.8',  label: '61.8% — Golden',    tag: 'Strong',  tagCls: 'accent' },
      { key: '78.6',  label: '78.6% — Deep',      tag: 'Deep',    tagCls: 'orange' },
      { key: '100',   label: '100% — Swing Low',  tag: 'Low',     tagCls: 'red'    },
    ];

    const nearest = nearestFibLevel(price, fib);
    const pctPosInRange = ((price - fib['100']) / fib.range) * 100;

    const colors = { accent:'var(--accent)', green:'var(--green)', yellow:'var(--yellow)',
                     gold:'#FFD700', orange:'var(--orange)', red:'var(--red)' };

    $('gold-fib-grid').innerHTML = fibLevels.map(lv => {
      const lvPrice = fib[lv.key];
      const isCurrent = (nearest.level === lv.key && Math.abs(price - lvPrice) / fib.range < 0.05);
      const isAbove   = price > lvPrice;
      const c         = colors[lv.tagCls] || 'var(--dim)';
      const currentBadge = isCurrent ? ` <span style="background:rgba(255,215,0,.15);color:var(--gold);font-size:8px;padding:0 .3rem;border-radius:3px;border:1px solid rgba(255,215,0,.3)">← PRICE</span>` : '';
      return `<div class="fib-row${isCurrent?' current':''}">
        <span class="fib-pct" style="color:${c}">${lv.key.includes('ext')?'EXT':lv.key+'%'}</span>
        <span class="fib-price" style="color:${isAbove?'var(--dim)':'var(--text)'}">$${lvPrice.toFixed(2)}</span>
        <span class="fib-label">${lv.label}${currentBadge}</span>
        <span class="fib-tag" style="background:${c}15;color:${c};border:1px solid ${c}30">${lv.tag}</span>
      </div>`;
    }).join('');

    // Fibonacci position bar (100% = swing high, 0% = swing low)
    updateRange('gold-fib-fill','gold-fib-marker','gold-fib-pos-label', Math.max(0,Math.min(100, pctPosInRange)), 100);
    $('gold-fib-low-label').textContent  = `Low $${fibL.toFixed(2)}`;
    $('gold-fib-high-label').textContent = `High $${fibH.toFixed(2)}`;

    // Fibonacci advice
    const fibAdvEl = $('gold-fib-advice');
    const nearPct  = parseFloat(nearest.level);
    let fibAdvice  = '';
    if (fibDir === 'retrace') {
      if      (nearPct <= 38.2 && nearPct > 0) fibAdvice = `✅ Price near ${nearest.level}% retrace ($${fib[nearest.level].toFixed(2)}) — shallow pullback in bull trend. Good long entry zone. Strong level: 38.2% is the golden retrace.`;
      else if (nearPct <= 61.8)                fibAdvice = `🎯 Price at ${nearest.level}% retrace ($${fib[nearest.level].toFixed(2)}) — 61.8% is the deepest acceptable pullback in a bull trend. High RR entry if trend intact.`;
      else if (nearPct <= 78.6)                fibAdvice = `⚠️ Price at ${nearest.level}% retrace — deep pullback. Wait for reversal confirmation candle before entering.`;
      else                                      fibAdvice = `🔴 Price at ${nearest.level}% — very deep retrace. Trend may be reversing. Require strong confirmation before longing.`;
    } else {
      fibAdvice = `📐 Extension targets: 161.8% = $${fib['ext1'].toFixed(2)} | 200% = $${fib['ext2'].toFixed(2)}. Use as TP levels.`;
    }
    fibAdvEl.textContent = fibAdvice;
  } else {
    fibCard.style.display = 'none';
  }

  /* ── SESSION QUALITY SECTION ── */
  const sessCard   = $('gold-session-card');
  const sessGrid   = $('gold-session-grid');
  const sessFill   = $('gold-sess-fill');
  const sessMark   = $('gold-sess-marker');
  const sessLabel  = $('gold-sess-label');
  const sessChip   = $('gold-session-chip');

  sessCard.style.display = '';
  if (sessChip) { sessChip.textContent = `${sess.emoji} ${sess.full}`; sessChip.style.display = ''; }

  if (sessFill)  sessFill.style.width  = sess.score + '%';
  if (sessMark)  sessMark.style.left   = sess.score + '%';
  if (sessLabel) sessLabel.textContent = `${sess.score}/100 — ${sess.full}`;

  const sessData = [
    { name: 'London-NY Overlap', time: '13:00–17:00', note: 'Prime — max liquidity', active: sess.score === 100, quality: '#00e87a' },
    { name: 'NY Session',        time: '13:00–22:00', note: 'High volume gold moves',active: sess.score >= 70 && sess.score < 100, quality: 'var(--accent)' },
    { name: 'London Session',    time: '08:00–17:00', note: 'Strong gold momentum',  active: sess.score >= 65 && sess.score < 80, quality: 'var(--accent)' },
    { name: 'Tokyo Session',     time: '00:00–09:00', note: 'Low vol — avoid entry', active: sess.score === 40, quality: 'var(--yellow)' },
    { name: 'Off-Hours',         time: '22:00–08:00', note: 'Thin liquidity — skip', active: sess.score < 40, quality: 'var(--red)' },
  ];

  sessGrid.innerHTML = sessData.map(s =>
    `<div class="session-cell${s.active?' active-sess':''}">
      <div class="session-name">${s.name}</div>
      <div class="session-time">${s.time} UTC</div>
      <div class="session-quality" style="color:${s.active?s.quality:'var(--muted)'}">${s.active?'▶ NOW':'–'}</div>
      <div style="font-size:9px;color:var(--muted);margin-top:.1rem">${s.note}</div>
    </div>`
  ).join('');

  /* Trade Plan */
  buildTradePlan('gold-price-block','gold-tradeplan-card', price, atr, accountSz, riskPct, 'gold');
}

function resetGold() {
  ['gold-price','gold-e21','gold-e55','gold-e200',
   'gold-rsi','gold-adx','gold-k','gold-d','gold-j',
   'gold-dif','gold-dea','gold-hist',
   'gold-dxy','gold-vol','gold-atr',
   'gold-fibh','gold-fibl',
   'gold-risk-pct','gold-account','gold-lotsize',
  ].forEach(id => { const el=$(id); if(el) el.value=''; });
  const dxyDirEl  = $('gold-dxy-dir');
  const fibDirEl  = $('gold-fib-dir');
  if (dxyDirEl) dxyDirEl.value = '';
  if (fibDirEl) fibDirEl.value = 'retrace';
  $('gold-result').style.display = 'none';
}

function toggleTheme() {
  document.body.classList.toggle("light");

  // Save preference
  if (document.body.classList.contains("light")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
}
// Load theme on page load
window.onload = function () {
  const theme = localStorage.getItem("theme");
  if (theme === "light") {
    document.body.classList.add("light");
  }
};

/* Auto-trigger gold session banner on load */
updateGoldSessionBanner();