/* ═══════════════════════════════════════════════════════════════
   TradeMatrix Pro — tradematrix.js  (Enhanced Professional Edition)
   Algorithms: MA/EMA Stack, ADX, Supertrend, Bollinger Bands,
			   Ichimoku, VWAP, Fibonacci, Session Analysis,
			   Kelly Criterion, Gold XAUUSD Module
   ═══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
const $ = id => document.getElementById(id);
const num = id => { const v = parseFloat($(id)?.value); return isNaN(v) ? null : v; };
const sel = id => $(id)?.value || '';
const pct = (v, base) => (base && base !== 0) ? ((v - base) / base * 100) : null;
const fmt = (v, d = 4) => v == null ? '—' : Number(v).toFixed(d);
const fmt2 = (v, d = 2) => v == null ? '—' : Number(v).toFixed(d) + '%';
const fmtPrice = (v, d) => {
	if (v == null) return '—';
	// Auto-determine decimal places from magnitude
	d = d ?? (v > 100 ? 2 : v > 1 ? 4 : 6);
	return Number(v).toFixed(d);
};

/* ══════════════════════════════════════
   CLOCK & SESSION TICKER
══════════════════════════════════════ */
function updateClock() {
	const now = new Date();
	const h = String(now.getUTCHours()).padStart(2, '0');
	const m = String(now.getUTCMinutes()).padStart(2, '0');
	const s = String(now.getUTCSeconds()).padStart(2, '0');
	const clock = $('tm-clock');
	const badge = $('tm-session-badge');
	const sess = getSession();
	if (clock) clock.textContent = `${h}:${m}:${s} UTC`;
	if (badge) {
		badge.textContent = sess.label;
		badge.className = `tm-session ${sess.cls}`;
	}
}
setInterval(updateClock, 1000);
updateClock();

/* ══════════════════════════════════════
   TAB SWITCHER
══════════════════════════════════════ */
function switchTab(t) {
	document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
	document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
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
	sydney: { start: 21, end: 6, label: 'Sydney', cls: 'slow', score: 30 },
	tokyo: { start: 0, end: 9, label: 'Tokyo', cls: 'slow', score: 40 },
	london: { start: 8, end: 17, label: 'London', cls: 'good', score: 72 },
	newyork: { start: 13, end: 22, label: 'New York', cls: 'good', score: 75 },
	overlap_ln: { start: 13, end: 17, label: 'London-NY Overlap', cls: 'prime', score: 100 },
};

function getSession() {
	const h = new Date().getUTCHours();
	if (h >= 13 && h < 17) return { label: '🎯 London-NY', cls: 'prime', score: 100, full: 'London-NY Overlap (Prime)', emoji: '🎯' };
	if (h >= 8 && h < 17) return { label: '🟢 London', cls: 'good', score: 72, full: 'London Session', emoji: '✅' };
	if (h >= 13 && h < 22) return { label: '🟢 New York', cls: 'good', score: 75, full: 'New York Session', emoji: '✅' };
	if (h >= 0 && h < 9) return { label: '🟡 Tokyo', cls: 'slow', score: 40, full: 'Tokyo Session (Low Vol)', emoji: '⚠️' };
	if (h >= 21 || h < 6) return { label: '🟡 Sydney', cls: 'slow', score: 30, full: 'Sydney Session (Low Vol)', emoji: '⚠️' };
	return { label: '🔴 Off-Hours', cls: 'avoid', score: 20, full: 'Off-Hours', emoji: '🔴' };
}

function updateGoldSessionBanner() {
	const sess = getSession();
	const el = $('gold-session-status');
	const elT = $('gold-session-time');
	const badge = $('tm-session-badge');
	const now = new Date();
	const hStr = String(now.getUTCHours()).padStart(2, '0') + ':' + String(now.getUTCMinutes()).padStart(2, '0') + ' UTC';
	if (el) el.textContent = sess.full;
	if (elT) elT.textContent = hStr;
	if (badge) {
		badge.textContent = sess.label;
		badge.className = `tm-session ${sess.cls}`;
	}
}
setInterval(() => { if ($('panel-gold').classList.contains('active')) updateGoldSessionBanner(); }, 30000);

/* ══════════════════════════════════════
   INDICATOR SCORING FUNCTIONS
══════════════════════════════════════ */

/** ADX Trend Strength */
function scoreADX(adx) {
	if (adx == null) return null;
	if (adx > 50) return { zone: 'Momentum Surge', pass: true, c: 'var(--accent)', e: '⚡', strength: 'Very Strong' };
	if (adx > 28) return { zone: 'Strong Trend', pass: true, c: 'var(--green)', e: '✅', strength: 'Strong' };
	if (adx > 20) return { zone: 'Developing', pass: 'warn', c: 'var(--yellow)', e: '⚠️', strength: 'Developing' };
	if (adx > 15) return { zone: 'Weak Trend', pass: 'warn', c: 'var(--orange)', e: '🟠', strength: 'Weak' };
	return { zone: 'No Trend/Range', pass: false, c: 'var(--red)', e: '🔴', strength: 'Ranging' };
}

/** RSI Zone Assessment */
function scoreRSI(rsi, context = 'default') {
	if (rsi == null) return null;
	if (context === 'gold') {
		if (rsi >= 50 && rsi <= 70) return { zone: 'Sweet Spot', pass: true, c: 'var(--green)', e: '🎯' };
		if (rsi >= 45 && rsi < 50) return { zone: 'Building', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
		if (rsi > 70 && rsi <= 80) return { zone: 'Overbought', pass: 'warn', c: 'var(--orange)', e: '⚠️' };
		if (rsi > 80) return { zone: 'Extreme OB', pass: false, c: 'var(--red)', e: '🔴' };
		if (rsi < 40) return { zone: 'Weak/Below', pass: false, c: 'var(--red)', e: '🔴' };
		return { zone: 'Neutral', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
	}
	if (rsi >= 50 && rsi <= 72) return { zone: 'Bullish Zone', pass: true, c: 'var(--green)', e: '✅' };
	if (rsi > 72 && rsi <= 82) return { zone: 'Overbought', pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
	if (rsi > 82) return { zone: 'Extreme OB', pass: false, c: 'var(--red)', e: '🔴' };
	if (rsi < 40) return { zone: 'Weak', pass: false, c: 'var(--red)', e: '🔴' };
	return { zone: 'Neutral', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
}

/** KDJ Oscillator */
function scoreKDJ(k, d, j) {
	if (k == null || d == null) return null;
	if (k < d) return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴' };
	if (j != null && j > 90) return { zone: 'Extreme OB', pass: false, c: 'var(--red)', e: '🔴' };
	if (j != null && j > 80) return { zone: 'Overbought', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
	if (j != null && j < 20) return { zone: 'Oversold Bounce', pass: true, c: 'var(--accent)', e: '💡' };
	if (j != null && j > 50) return { zone: 'Bullish Strong', pass: true, c: 'var(--green)', e: '✅' };
	return { zone: 'Bullish Building', pass: true, c: 'var(--accent)', e: '🟢' };
}

/** MACD Zone */
function scoreMACDZone(dif, dea) {
	if (dif == null || dea == null) return null;
	if (dif < dea) return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴' };
	const diff = Math.abs(dif - dea);
	const avg = (Math.abs(dif) + Math.abs(dea)) / 2;
	if (avg > 0 && diff / avg < 0.05) return { zone: 'Near Cross', pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
	if (dif > 0 && dea > 0) return { zone: 'Strong Bull', pass: true, c: 'var(--green)', e: '🚀' };
	return { zone: 'Bullish', pass: true, c: 'var(--accent)', e: '✅' };
}

/** Supertrend (price vs supertrend value) */
function scoreSupertrend(price, st) {
	if (price == null || st == null) return null;
	if (price > st) return { zone: 'Bullish', pass: true, c: 'var(--green)', e: '🟢' };
	return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴' };
}

/** Ichimoku Cloud */
function scoreIchimoku(position) {
	if (!position) return null;
	if (position === 'above') return { zone: 'Above Cloud', pass: true, c: 'var(--green)', e: '✅' };
	if (position === 'inside') return { zone: 'Inside Cloud', pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
	return { zone: 'Below Cloud', pass: false, c: 'var(--red)', e: '🔴' };
}

/** VWAP */
function scoreVWAP(price, vwap) {
	if (price == null || vwap == null) return null;
	const pctAbove = pct(price, vwap);
	if (pctAbove > 2) return { zone: `+${pctAbove.toFixed(2)}% above VWAP`, pass: true, c: 'var(--green)', e: '✅' };
	if (pctAbove >= 0) return { zone: `+${pctAbove.toFixed(2)}% above VWAP`, pass: true, c: 'var(--accent)', e: '🟢' };
	return { zone: `${pctAbove.toFixed(2)}% below VWAP`, pass: false, c: 'var(--red)', e: '🔴' };
}

/** Volume */
function scoreVolume(vol) {
	if (vol == null) return null;
	if (vol >= 1.5) return { zone: 'Very Strong', pass: true, c: 'var(--green)', e: '⚡' };
	if (vol >= 1.2) return { zone: 'Strong', pass: true, c: 'var(--green)', e: '✅' };
	if (vol >= 0.8) return { zone: 'Moderate', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
	return { zone: 'Weak', pass: false, c: 'var(--red)', e: '🔴' };
}

/** MA/EMA Trend Grade */
function getGrade(gap) {
	if (gap < 0) return { g: 'BEAR', e: '🔻', cls: 'grade-x', c: 'var(--red)' };
	if (gap < 1) return { g: 'FLAT', e: '➡️', cls: 'grade-x', c: 'var(--dim)' };
	if (gap < 3) return { g: 'S++', e: '🚀', cls: 'grade-spp', c: 'var(--green)' };
	if (gap < 5) return { g: 'A', e: '✅', cls: 'grade-a', c: 'var(--accent)' };
	if (gap < 8) return { g: 'B', e: '⚠️', cls: 'grade-b', c: 'var(--yellow)' };
	if (gap < 10) return { g: 'C', e: '🟡', cls: 'grade-c', c: 'var(--orange)' };
	return { g: 'X', e: '🛑', cls: 'grade-x', c: 'var(--red)' };
}

/* ══════════════════════════════════════
   FIBONACCI CALCULATOR
══════════════════════════════════════ */
/* Full professional Fibonacci suite — retracement + ALL extensions */
function calcFib(high, low) {
	if (high == null || low == null || high <= low) return null;
	const r = high - low;
	return {
		// Extensions (above swing high)
		'ext_261': high + r * 1.618,   // 261.8%
		'ext_200': high + r * 1.000,   // 200%
		'ext_161': high + r * 0.618,   // 161.8% — Golden extension
		'ext_141': high + r * 0.414,   // 141.4%
		'ext_127': high + r * 0.272,   // 127.2%
		// Retracements (within swing)
		'0':     high,
		'23.6':  high - r * 0.236,
		'38.2':  high - r * 0.382,     // Golden ratio retrace
		'50':    high - r * 0.500,
		'61.8':  high - r * 0.618,     // Golden ratio (1/phi)
		'78.6':  high - r * 0.786,     // sqrt(0.618)
		'88.6':  high - r * 0.886,     // Deep harmonic
		'100':   low,
		range: r,
		high, low,
	};
}

/* Check if two fibonacci levels are within confluence zone (≤0.75% apart) */
function fibConfluence(fib1, fib2, rangeTolerance) {
	const levels1 = ['23.6','38.2','50','61.8','78.6'];
	const levels2 = ['23.6','38.2','50','61.8','78.6'];
	const zones = [];
	for (const l1 of levels1) {
		for (const l2 of levels2) {
			if (!fib1[l1] || !fib2[l2]) continue;
			const diff = Math.abs(fib1[l1] - fib2[l2]);
			const pctDiff = (diff / rangeTolerance) * 100;
			if (pctDiff <= 1.5) { // within 1.5% of total range
				zones.push({
					price: (fib1[l1] + fib2[l2]) / 2,
					level1: l1, level2: l2,
					strength: pctDiff < 0.5 ? 'STRONG' : 'MODERATE',
					diffPct: pctDiff,
				});
			}
		}
	}
	return zones.sort((a,b) => a.diffPct - b.diffPct);
}

/* Fibonacci accuracy score: how close is current price to a key level?
   Returns 0-100 accuracy where 100 = price exactly on golden ratio level */
function fibAccuracyScore(price, fib, emaStack) {
	const KEY_LEVELS = [
		{ key:'38.2', weight:90, name:'38.2% Golden Retrace' },
		{ key:'61.8', weight:100, name:'61.8% Golden Ratio' },
		{ key:'50',   weight:70,  name:'50% Midpoint' },
		{ key:'23.6', weight:50,  name:'23.6% Minor' },
		{ key:'78.6', weight:60,  name:'78.6% Deep' },
		{ key:'88.6', weight:40,  name:'88.6% Harmonic' },
	];
	let bestScore = 0, bestLevel = null;
	for (const lv of KEY_LEVELS) {
		const lvPrice = fib[lv.key];
		if (!lvPrice) continue;
		const distPct = Math.abs(price - lvPrice) / fib.range * 100;
		// Score: 100% at 0% distance, decays to 0 at 3% distance
		const proximity = Math.max(0, 1 - distPct / 3);
		const score = proximity * lv.weight;
		if (score > bestScore) { bestScore = score; bestLevel = { ...lv, lvPrice, distPct }; }
	}
	// EMA confluence bonus: if EMA is also near the fib level (+15%)
	let emaBonus = 0;
	if (emaStack && bestLevel) {
		for (const ema of emaStack) {
			if (!ema) continue;
			const emaDist = Math.abs(ema - bestLevel.lvPrice) / fib.range * 100;
			if (emaDist < 1.0) { emaBonus = 15; break; } // EMA within 1% of fib = confluence
		}
	}
	return { score: Math.min(100, bestScore + emaBonus), level: bestLevel };
}

function nearestFibLevel(price, fib) {
	const levels = ['0', '23.6', '38.2', '50', '61.8', '78.6', '100'];
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
	const box = $(containerId);
	if (!card || !box || !price || !atr) { if (card) card.style.display = 'none'; return; }
	card.style.display = '';

	// Gold uses slightly wider ATR multipliers due to higher volatility
	const slMult = context === 'gold' ? 1.8 : 1.5;
	const tp1Mult = context === 'gold' ? 1.5 : 1.5;
	const tp2Mult = context === 'gold' ? 3.0 : 3.0;
	const tp3Mult = context === 'gold' ? 5.0 : 5.0;

	const sl = price - atr * slMult;
	const tp1 = price + atr * tp1Mult;
	const tp2 = price + atr * tp2Mult;
	const tp3 = price + atr * tp3Mult;
	const risk = price - sl;
	const rr1 = (tp1 - price) / risk;
	const rr2 = (tp2 - price) / risk;
	const rr3 = (tp3 - price) / risk;

	const dp = context === 'gold' ? 2 : 4;

	let kellyHtml = '';
	const kellyId = containerId.replace('price-block', 'kelly-block');
	const kellyEl = $(kellyId);

	if (accountSize && riskPct) {
		const riskAmt = accountSize * (riskPct / 100);
		const shares = (riskAmt / risk).toFixed(2);
		const positionVal = (price * parseFloat(shares)).toFixed(2);
		// Estimated Kelly-inspired sizing (using typical 55% win-rate, 1.8 avg RR)
		const kelly = kellySize(55, 1.8, 1.0);
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
	const svg = $(svgId);
	const legend = $(legendId);
	if (!svg || !legend) return;

	const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
	if (total === 0) { svg.innerHTML = ''; legend.innerHTML = ''; return; }

	const cx = 80, cy = 80, r = 68, inner = 42;
	let paths = '';
	let startAngle = -Math.PI / 2;
	const segs = segments.filter(s => s.value > 0);

	segs.forEach(seg => {
		const angle = (seg.value / total) * 2 * Math.PI;
		const endAngle = startAngle + angle;
		const large = angle > Math.PI ? 1 : 0;

		const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
		const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
		const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle);
		const ix2 = cx + inner * Math.cos(endAngle), iy2 = cy + inner * Math.sin(endAngle);

		paths += `<path d="M${ix1} ${iy1} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z" fill="${seg.color}" opacity="0.9" stroke="var(--card)" stroke-width="2"><title>${seg.label}: ${((seg.value / total) * 100).toFixed(1)}%</title></path>`;
		startAngle = endAngle;
	});

	const topSeg = [...segs].sort((a, b) => b.value - a.value)[0];
	const topPct = ((topSeg.value / total) * 100).toFixed(0);
	paths += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="'Syne',sans-serif" font-size="16" font-weight="800" fill="${topSeg.color}">${topPct}%</text>`;
	paths += `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="8" fill="var(--muted)">${topSeg.label.toUpperCase().slice(0, 8)}</text>`;
	svg.innerHTML = paths;

	legend.innerHTML = segs.map(s => {
		const p = ((s.value / total) * 100).toFixed(1);
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
	const dash = (Math.min(100, Math.max(0, score)) / 100) * total;
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
	el.innerHTML = Array.from({ length: total }, (_, i) =>
		`<div class="signal-seg" style="background:${i < passCount ? color : 'var(--border)'}"></div>`
	).join('');
}

/* ══════════════════════════════════════
   RANGE BAR
══════════════════════════════════════ */
function updateRange(fillId, markerId, labelId, val, max) {
	const pctNum = Math.min(100, Math.max(0, (val / max) * 100));
	const fill = $(fillId);
	const marker = $(markerId);
	const label = $(labelId);
	if (fill) fill.style.width = pctNum + '%';
	if (marker) marker.style.left = pctNum + '%';
	if (label) label.textContent = fmt2(val);
}

/* ══════════════════════════════════════
   CHECKLIST ROW BUILDER
══════════════════════════════════════ */
function buildCheck(label, pass, result) {
	const icon = pass === true ? '✔' : pass === false ? '✘' : '○';
	const cls = pass === true ? 'check-pass' : pass === false ? 'check-fail' : 'check-neutral';
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
	badge.className = `d-badge ${dClass}`;
	badge.textContent = decision;

	const rp = $(`${pfx}-risk-pill`);
	rp.className = `risk-pill ${riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium'}`;
	rp.textContent = riskLevel;

	const gb = $(`${pfx}-grade-badge`);
	if (grade) {
		gb.className = `grade-badge ${grade.cls}`;
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
		if (pass === true) score += w;
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
	const ma5 = num('ma-ma5');
	const ma20 = num('ma-ma20');
	const ma50 = num('ma-ma50');

	if (!price || !ma5 || !ma20 || !ma50) { $('ma-result').style.display = 'none'; return; }
	$('ma-result').style.display = '';

	const ma200 = num('ma-ma200');
	const k = num('ma-k');
	const d = num('ma-d');
	const j = num('ma-j');
	const dif = num('ma-dif');
	const dea = num('ma-dea');
	const vol = num('ma-vol');
	const atr = num('ma-atr');
	const adxV = num('ma-adx');
	const stV = num('ma-st');
	const bbu = num('ma-bbu');
	const bbl = num('ma-bbl');
	const riskPct = num('ma-risk-pct');
	const accountSz = num('ma-account');

	/* Distances */
	const pAboveMA20 = pct(price, ma20);
	const pAboveMA5 = pct(price, ma5);
	const pAboveMA50 = pct(price, ma50);
	const pAboveMA200 = ma200 ? pct(price, ma200) : null;
	const ma5AboveMA20 = pct(ma5, ma20);
	const ma20AboveMA50 = pct(ma20, ma50);
	const ma50AbMA200 = ma200 ? pct(ma50, ma200) : null;

	/* Filter evaluations */
	const f1_pass = price > ma5;
	const f2_pass = ma5 > ma20;
	const f3_pass = ma20 > ma50;
	const f4_ma200 = ma200 ? price > ma200 : null; // Macro trend filter
	const kdj = scoreKDJ(k, d, j);
	const macd = scoreMACDZone(dif, dea);
	const volS = scoreVolume(vol);
	const adxS = scoreADX(adxV);
	const stS = scoreSupertrend(price, stV);

	/* Weighted Score Engine */
	const eng = scoreEngine();
	eng.add(f1_pass, 18);
	eng.add(f2_pass, 16);
	eng.add(f3_pass, 14);
	eng.add(f4_ma200, 8);
	eng.add(kdj ? kdj.pass : null, 16);
	eng.add(macd ? macd.pass : null, 14);
	eng.add(volS ? volS.pass : null, 8);
	eng.add(adxS ? adxS.pass : null, 10);
	eng.add(stS ? stS.pass : null, 6);

	/* Stretch Penalty — price overextended above MA20 */
	let penalty = 0;
	if (pAboveMA20 > 12) penalty = -20;
	else if (pAboveMA20 > 8) penalty = -12;
	else if (pAboveMA20 > 5) penalty = -6;
	const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));

	/* Decision Logic */
	const momentumOk = (!kdj || kdj.pass !== false)
		&& (!macd || macd.pass !== false)
		&& (!adxS || adxS.pass !== false);

	let decision, riskLevel, posSize;
	if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
		decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0%';
	} else if (adjScore >= 75) {
		decision = 'PROCEED'; riskLevel = 'Low Risk'; posSize = pAboveMA20 > 5 ? '50%' : '100%';
	} else if (adjScore >= 55) {
		decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
	} else {
		decision = 'WATCH'; riskLevel = 'Medium Risk'; posSize = '25%';
	}

	const grade = getGrade(ma20AboveMA50);

	/* Decision Strip */
	setDecisionStrip('ma', decision, riskLevel, grade, `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      &nbsp; MA5: <span style="color:var(--text)">${fmt(ma5)}</span>
      MA20: <span style="color:var(--text)">${fmt(ma20)}</span>
      MA50: <span style="color:var(--text)">${fmt(ma50)}</span>
    </div>
    <div>Position: <span style="color:${posSize === '100%' ? 'var(--green)' : 'var(--yellow)'}">${posSize}</span>
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
			`📐 Entry: ${fmt(price)} | SL: ${atr ? fmt(price - atr * 1.5) : 'set 1×ATR below entry'}`,
			ma200 && price > ma200 ? `🌐 Macro bullish: Price above MA200 (${fmt(ma200)}) — trend aligned across all timeframes.` : '',
			adxS && adxS.pass === true ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend strength. High-conviction setup.` : '',
			`📦 Position size: ${posSize}. Set SL immediately after entry.`,
		].filter(Boolean).join('\n');
		adv.textContent = lines;
		adv.className = 'advice-box green';
	} else if (decision === 'WATCH') {
		adv.textContent = `⚠️ Partial setup (Score: ${adjScore.toFixed(0)}/100). Conditions not ideal — wait for full MA alignment + momentum confirmation before entering. Monitor for KDJ crossover and MACD histogram expansion.`;
		adv.className = 'advice-box yellow';
	} else {
		const missing = [
			!f1_pass && `Price < MA5`,
			!f2_pass && `MA5 < MA20`,
			!f3_pass && `MA20 < MA50`,
			kdj?.pass === false && `KDJ Bearish`,
			macd?.pass === false && `MACD Bearish`,
			adxS?.pass === false && `ADX Weak (${adxV?.toFixed(1)})`,
		].filter(Boolean);
		adv.textContent = `🔴 Skip — ${missing.length} critical filter${missing.length > 1 ? 's' : ''} failed: ${missing.join(', ')}. Do not force entry against the filter stack.`;
		adv.className = 'advice-box red';
	}

	/* Dial */
	updateDial('ma-dial-arc', 'ma-dial-score', adjScore);

	/* Pie */
	drawPie('ma-pie', 'ma-pie-legend', [
		{ label: 'MA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0) + (f4_ma200 ? 1 : 0), color: 'var(--accent)' },
		{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--green)' },
		{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
		{ label: 'Volume', value: volS ? (volS.pass === true ? 1 : volS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--orange)' },
		{ label: 'ADX', value: adxS ? (adxS.pass === true ? 1 : adxS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent2)' },
		{ label: 'Supertrend', value: stS ? (stS.pass === true ? 1 : 0) : 0, color: 'var(--green2)' },
	].filter(s => s.value > 0));

	/* Checklist */
	const passArr = [f1_pass, f2_pass, f3_pass,
		kdj?.pass === true, macd?.pass === true,
		volS?.pass === true, adxS?.pass === true
	].filter(Boolean);

	$('ma-checklist').innerHTML = [
		buildCheck('F1 — Price > MA5', f1_pass, fmt2(pAboveMA5)),
		buildCheck('F2 — MA5 > MA20', f2_pass, fmt2(ma5AboveMA20)),
		buildCheck('F3 — MA20 > MA50', f3_pass, fmt2(ma20AboveMA50)),
		ma200 != null
			? buildCheck('F4 — Price > MA200 (Macro)', f4_ma200, `${fmt2(pAboveMA200)} ${f4_ma200 ? '✅' : '🔴'}`)
			: buildCheck('F4 — MA200 (Macro)', null, 'Not provided'),
		kdj
			? buildCheck(`F5 — KDJ ${kdj.zone}`, kdj.pass === true ? true : kdj.pass === false ? false : null, `K:${k?.toFixed(1)} D:${d?.toFixed(1)} J:${j?.toFixed(1)}`)
			: buildCheck('F5 — KDJ', null, 'Not provided'),
		macd
			? buildCheck(`F6 — MACD ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif} DEA:${dea}`)
			: buildCheck('F6 — MACD', null, 'Not provided'),
		volS
			? buildCheck(`F7 — Volume ${volS.zone}`, volS.pass === true ? true : volS.pass === false ? false : null, `${vol}× ${volS.zone}`)
			: buildCheck('F7 — Volume', null, 'Not provided'),
		adxS
			? buildCheck(`ADX ${adxS.zone}`, adxS.pass === true ? true : adxS.pass === false ? false : null, `ADX: ${adxV?.toFixed(1)}`)
			: buildCheck('ADX Trend Strength', null, 'Not provided'),
		stS
			? buildCheck(`Supertrend ${stS.zone}`, stS.pass, `Price:${fmt(price)} ST:${fmt(stV)}`)
			: buildCheck('Supertrend', null, 'Not provided'),
	].join('');

	updateMeter('ma-signal-meter', passArr.length, 7);

	/* Alignment Grid */
	const alignRows = [
		['Price vs MA20', pAboveMA20, pAboveMA20 >= 0 && pAboveMA20 <= 2 ? 'green' : pAboveMA20 > 10 ? 'red' : pAboveMA20 > 5 ? 'yellow' : 'accent'],
		['Price vs MA5', pAboveMA5, pAboveMA5 >= 0 ? 'green' : 'red'],
		['Price vs MA50', pAboveMA50, pAboveMA50 >= 0 ? 'green' : 'red'],
		['MA5 vs MA20', ma5AboveMA20, ma5AboveMA20 > 0 ? 'green' : 'red'],
		['MA20 vs MA50', ma20AboveMA50, ma20AboveMA50 > 0 ? 'green' : 'red'],
	];
	if (ma200) {
		alignRows.push(['Price vs MA200', pAboveMA200, pAboveMA200 >= 0 ? 'green' : 'red']);
		alignRows.push(['MA50 vs MA200', ma50AbMA200, ma50AbMA200 >= 0 ? 'green' : 'red']);
	}

	$('ma-alignment-grid').innerHTML = alignRows.map(([l, v, c]) =>
		`<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—'}</div></div>`
	).join('');

	updateRange('ma-range-fill', 'ma-range-marker', 'ma-range-label', Math.max(0, pAboveMA20 || 0), 12);

	/* Bollinger Band Section */
	const bbSection = $('ma-bb-section');
	if (bbu != null && bbl != null && bbl < bbu) {
		bbSection.style.display = '';
		const bbRange = bbu - bbl;
		const bbPos = bbRange > 0 ? ((price - bbl) / bbRange) * 100 : 50;
		const bbFill = $('ma-bb-fill');
		const bbMark = $('ma-bb-marker');
		const bbLbl = $('ma-bb-label');
		if (bbFill) bbFill.style.width = Math.min(100, Math.max(0, bbPos)) + '%';
		if (bbMark) bbMark.style.left = Math.min(100, Math.max(0, bbPos)) + '%';
		if (bbLbl) bbLbl.textContent = `${bbPos.toFixed(1)}% of BB width`;
	} else {
		bbSection.style.display = 'none';
	}

	/* Trade Plan */
	buildTradePlan('ma-price-block', 'ma-tradeplan-card', price, atr, accountSz, riskPct);
}

function resetMA() {
	['ma-price', 'ma-ma5', 'ma-ma20', 'ma-ma50', 'ma-ma200',
		'ma-k', 'ma-d', 'ma-j', 'ma-dif', 'ma-dea', 'ma-hist',
		'ma-vol', 'ma-rsi', 'ma-atr', 'ma-adx', 'ma-st', 'ma-bbu', 'ma-bbl',
		'ma-risk-pct', 'ma-account',
	].forEach(id => { const el = $(id); if (el) el.value = ''; });
	$('ma-result').style.display = 'none';
}

/* ══════════════════════════════════════
   EMA CALCULATOR
══════════════════════════════════════ */
function emaCalc() {
	const price = num('ema-price');
	const e8 = num('ema-ema8');
	const e21 = num('ema-ema21');
	const e55 = num('ema-ema55');

	if (!price || !e8 || !e21 || !e55) { $('ema-result').style.display = 'none'; return; }
	$('ema-result').style.display = '';

	const e200 = num('ema-ema200');
	const k = num('ema-k');
	const d = num('ema-d');
	const j = num('ema-j');
	const dif = num('ema-dif');
	const dea = num('ema-dea');
	const vol = num('ema-vol');
	const atr = num('ema-atr');
	const adxV = num('ema-adx');
	const stV = num('ema-st');
	const vwapV = num('ema-vwap');
	const ichiP = sel('ema-ichi');
	const bidask = num('ema-bidask');
	const beta = num('ema-beta');
	const open = num('ema-open');
	const prev = num('ema-prev');
	const high = num('ema-high');
	const low = num('ema-low');
	const w52h = num('ema-52h');
	const w52l = num('ema-52l');
	const riskPct = num('ema-risk-pct');
	const accountSz = num('ema-account');

	/* Distances */
	const pAboveE8 = pct(price, e8);
	const pAboveE21 = pct(price, e21);
	const pAboveE55 = pct(price, e55);
	const pAboveE200 = e200 ? pct(price, e200) : null;
	const e8AboveE21 = pct(e8, e21);
	const e21AboveE55 = pct(e21, e55);
	const e55AbE200 = e200 ? pct(e55, e200) : null;

	/* Filters */
	const f1_pass = price > e8;
	const f2_pass = e8 > e21;
	const f3_pass = e21 > e55;
	const f4_e200 = e200 ? price > e200 : null;
	const fullStack = f1_pass && f2_pass && f3_pass;
	const kdj = scoreKDJ(k, d, j);
	const macd = scoreMACDZone(dif, dea);
	const volS = scoreVolume(vol);
	const adxS = scoreADX(adxV);
	const stS = scoreSupertrend(price, stV);
	const ichiS = ichiP ? scoreIchimoku(ichiP) : null;
	const vwapS = scoreVWAP(price, vwapV);

	/* Acceleration bonus: EMA8 slope proxy via (price - e8) / e8 trend */
	const acceleration = (pAboveE8 != null && e8AboveE21 != null)
		? (e8AboveE21 > 0 && pAboveE8 >= 0 && pAboveE8 < 5) // trending but not stretched
		: null;

	/* Score Engine */
	const eng = scoreEngine();
	eng.add(f1_pass, 18);
	eng.add(f2_pass, 18);
	eng.add(f3_pass, 16);
	eng.add(f4_e200, 6);
	eng.add(kdj ? kdj.pass : null, 14);
	eng.add(macd ? macd.pass : null, 12);
	eng.add(volS ? volS.pass : null, 8);
	eng.add(adxS ? adxS.pass : null, 10);
	eng.add(ichiS ? ichiS.pass : null, 6);
	eng.add(vwapS ? vwapS.pass : null, 4);
	eng.add(stS ? stS.pass : null, 4);

	const stretchPct = Math.abs(pAboveE8 || 0);
	let penalty = 0;
	if (stretchPct > 12) penalty = -20;
	else if (stretchPct > 8) penalty = -12;
	else if (stretchPct > 5) penalty = -6;
	const adjScore = Math.min(100, Math.max(0, eng.result() + penalty));

	const grade = getGrade(e21AboveE55 || 0);

	/* Decision */
	const momentumOk = (!kdj || kdj.pass !== false)
		&& (!macd || macd.pass !== false)
		&& (!adxS || adxS.pass !== false);

	let decision, riskLevel, posSize;
	if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
		decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0%';
	} else if (adjScore >= 75) {
		decision = 'PROCEED'; riskLevel = 'Low Risk'; posSize = stretchPct > 5 ? '50%' : '100%';
	} else if (adjScore >= 55) {
		decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
	} else {
		decision = 'WATCH'; riskLevel = 'Medium Risk'; posSize = '25%';
	}

	/* Decision Strip */
	setDecisionStrip('ema', decision, riskLevel, grade, `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      EMA8: <span style="color:var(--text)">${fmt(e8)}</span>
      EMA21: <span style="color:var(--text)">${fmt(e21)}</span>
      EMA55: <span style="color:var(--text)">${fmt(e55)}</span>
    </div>
    <div>Bull Stack: <span style="color:${fullStack ? 'var(--green)' : 'var(--red)'}">${fullStack ? '✅ Yes' : '✘ No'}</span>
      &nbsp; Size: <span style="color:${posSize === '100%' ? 'var(--green)' : 'var(--yellow)'}">${posSize}</span>
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
			adxS?.pass === true ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend. High-probability entry.` : '',
			ichiS?.pass === true ? `☁️ Price above Ichimoku cloud — trend confirmed.` : '',
			vwapV && price > vwapV ? `📊 Price above VWAP — intraday bulls in control.` : '',
			`📦 Use ${posSize} position. Stop Loss = Price − (ATR × 1.5). Trail after TP1.`,
		].filter(Boolean).join('\n');
		adv.textContent = lines;
		adv.className = 'advice-box green';
	} else if (decision === 'WATCH') {
		adv.textContent = `⚠️ Partial EMA setup (Score: ${adjScore.toFixed(0)}/100). Wait for Price > EMA8 > EMA21 > EMA55 with all momentum indicators aligned.`;
		adv.className = 'advice-box yellow';
	} else {
		const missing = [
			!f1_pass && 'Price < EMA8',
			!f2_pass && 'EMA8 < EMA21',
			!f3_pass && 'EMA21 < EMA55',
			kdj?.pass === false && 'KDJ Bearish',
			macd?.pass === false && 'MACD Bearish',
			adxS?.pass === false && `ADX Weak (${adxV?.toFixed(1)})`,
		].filter(Boolean);
		adv.textContent = `🔴 Skip — broken EMA stack. Failed: ${missing.join(', ')}.`;
		adv.className = 'advice-box red';
	}

	/* Dial & Pie */
	updateDial('ema-dial-arc', 'ema-dial-score', adjScore);
	drawPie('ema-pie', 'ema-pie-legend', [
		{ label: 'EMA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0) + (f4_e200 ? 1 : 0), color: 'var(--accent)' },
		{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--green)' },
		{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
		{ label: 'Volume', value: volS ? (volS.pass === true ? 1 : volS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--orange)' },
		{ label: 'ADX', value: adxS ? (adxS.pass === true ? 1 : adxS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent2)' },
		{ label: 'Ichimoku', value: ichiS ? (ichiS.pass === true ? 1 : ichiS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--red)' },
		{ label: 'VWAP', value: vwapS ? (vwapS.pass === true ? 1 : 0) : 0, color: 'var(--green2)' },
	].filter(s => s.value > 0));

	/* Checklist */
	const passArr = [f1_pass, f2_pass, f3_pass,
		kdj?.pass === true, macd?.pass === true,
		volS?.pass === true, adxS?.pass === true,
	].filter(Boolean);

	$('ema-checklist').innerHTML = [
		buildCheck('F1 — Price > EMA8', f1_pass, fmt2(pAboveE8)),
		buildCheck('F2 — EMA8 > EMA21', f2_pass, fmt2(e8AboveE21)),
		buildCheck('F3 — EMA21 > EMA55', f3_pass, fmt2(e21AboveE55)),
		e200 != null
			? buildCheck('F4 — Price > EMA200', f4_e200, `${fmt2(pAboveE200)} ${f4_e200 ? '✅' : '🔴'}`)
			: buildCheck('F4 — EMA200 (Macro)', null, 'Not provided'),
		kdj
			? buildCheck(`F5 — KDJ ${kdj.zone}`, kdj.pass === true ? true : kdj.pass === false ? false : null, `K${k?.toFixed(1)} D${d?.toFixed(1)} J${j?.toFixed(1)}`)
			: buildCheck('F5 — KDJ', null, 'Not provided'),
		macd
			? buildCheck(`F6 — MACD ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif} DEA:${dea}`)
			: buildCheck('F6 — MACD', null, 'Not provided'),
		volS
			? buildCheck(`F7 — Volume ${volS.zone}`, volS.pass === true ? true : volS.pass === false ? false : null, `${vol}× ${volS.zone}`)
			: buildCheck('F7 — Volume', null, 'Not provided'),
		adxS
			? buildCheck(`ADX — ${adxS.zone}`, adxS.pass === true ? true : adxS.pass === false ? false : null, `ADX: ${adxV?.toFixed(1)}`)
			: buildCheck('ADX Trend Strength', null, 'Not provided'),
		ichiS
			? buildCheck(`Ichimoku — ${ichiS.zone}`, ichiS.pass === true ? true : ichiS.pass === false ? false : null, ichiS.zone)
			: buildCheck('Ichimoku Cloud', null, 'Not provided'),
		vwapS
			? buildCheck(`VWAP — ${vwapS.zone}`, vwapS.pass === true ? true : vwapS.pass === false ? false : null, `VWAP:${fmt(vwapV)}`)
			: buildCheck('VWAP', null, 'Not provided'),
	].join('');

	updateMeter('ema-signal-meter', passArr.length, 7);

	/* Alignment Grid */
	const alignRows = [
		['% Above EMA8', pAboveE8, pAboveE8 >= 0 && pAboveE8 <= 2 ? 'green' : pAboveE8 > 10 ? 'red' : pAboveE8 > 5 ? 'yellow' : pAboveE8 >= 0 ? 'accent' : 'red'],
		['% Above EMA21', pAboveE21, pAboveE21 >= 0 ? 'accent' : 'red'],
		['% Above EMA55', pAboveE55, pAboveE55 >= 0 ? 'green' : 'red'],
		['EMA8 vs EMA21', e8AboveE21, e8AboveE21 > 0 ? 'green' : 'red'],
		['EMA21 vs EMA55', e21AboveE55, e21AboveE55 > 0 ? 'green' : 'red'],
		['Full Bull Stack', null, fullStack ? 'green' : 'red', fullStack ? '✅ Yes' : '✘ No'],
	];
	if (e200) alignRows.push(['% Above EMA200', pAboveE200, pAboveE200 >= 0 ? 'green' : 'red']);

	$('ema-alignment-grid').innerHTML = alignRows.map(([l, v, c, ov]) => {
		const display = ov || (v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—');
		return `<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${display}</div></div>`;
	}).join('');

	updateRange('ema-range-fill', 'ema-range-marker', 'ema-range-label', Math.max(0, e21AboveE55 || 0), 12);

	/* Price Context */
	const ctx = $('ema-price-context');
	const hasCtx = (high != null && low != null) || prev != null || (w52h != null && w52l != null) || beta != null || bidask != null;
	ctx.style.display = hasCtx ? '' : 'none';

	if (hasCtx) {
		const cells = [];
		if (prev != null) {
			const chg = pct(price, prev);
			cells.push(`<div class="stat-cell"><div class="stat-label">vs Prev Close</div><div class="stat-value ${chg >= 0 ? 'green' : 'red'}">${chg >= 0 ? '+' : ''}${chg?.toFixed(2)}%</div></div>`);
		}
		if (open != null) {
			const gapPct = pct(price, open);
			cells.push(`<div class="stat-cell"><div class="stat-label">Gap from Open</div><div class="stat-value ${gapPct >= 0 ? 'green' : 'red'}">${gapPct >= 0 ? '+' : ''}${gapPct?.toFixed(2)}%</div></div>`);
		}
		if (w52h != null && w52l != null) {
			const fromH = pct(price, w52h), fromL = pct(price, w52l);
			cells.push(`<div class="stat-cell"><div class="stat-label">From 52wk High</div><div class="stat-value ${fromH >= -5 ? 'green' : fromH >= -20 ? 'accent' : 'red'}">${fromH?.toFixed(2)}%</div></div>`);
			cells.push(`<div class="stat-cell"><div class="stat-label">From 52wk Low</div><div class="stat-value accent">+${fromL?.toFixed(2)}%</div></div>`);
		}
		if (beta != null) {
			const bc = beta > 1.5 ? 'red' : beta > 1.0 ? 'yellow' : 'green';
			cells.push(`<div class="stat-cell"><div class="stat-label">Beta</div><div class="stat-value ${bc}">${beta.toFixed(3)}</div><div class="stat-sub">${beta > 1.5 ? 'High vol' : beta > 1.0 ? 'Above mkt' : 'Normal'}</div></div>`);
		}
		if (bidask != null) {
			const bc = bidask >= 60 ? 'green' : bidask >= 40 ? 'accent' : 'red';
			cells.push(`<div class="stat-cell"><div class="stat-label">Bid/Ask Ratio</div><div class="stat-value ${bc}">${bidask.toFixed(1)}%</div><div class="stat-sub">${bidask >= 60 ? 'Strong demand' : bidask >= 40 ? 'Balanced' : 'Sellers dominate'}</div></div>`);
		}
		$('ema-ctx-grid').innerHTML = cells.join('');

		if (high != null && low != null && high > low) {
			const rng = ((price - low) / (high - low)) * 100;
			const clamped = Math.min(100, Math.max(0, rng));
			const fill = $('ema-day-fill');
			const marker = $('ema-day-marker');
			const pctEl = $('ema-day-pct');
			if (fill) fill.style.width = clamped + '%';
			if (marker) marker.style.left = clamped + '%';
			if (pctEl) pctEl.textContent = rng.toFixed(1) + '% of range';
			$('ema-day-low').textContent = 'Low ' + fmt(low, 4);
			$('ema-day-high').textContent = 'High ' + fmt(high, 4);
		}
	}

	/* Trade Plan */
	buildTradePlan('ema-price-block', 'ema-tradeplan-card', price, atr, accountSz, riskPct);
}

function resetEMA() {
	['ema-price', 'ema-ema8', 'ema-ema21', 'ema-ema55', 'ema-ema200',
		'ema-k', 'ema-d', 'ema-j', 'ema-dif', 'ema-dea', 'ema-hist',
		'ema-vol', 'ema-rsi', 'ema-atr', 'ema-adx', 'ema-st', 'ema-vwap',
		'ema-open', 'ema-prev', 'ema-high', 'ema-low', 'ema-52h', 'ema-52l',
		'ema-bidask', 'ema-beta', 'ema-risk-pct', 'ema-account',
	].forEach(id => { const el = $(id); if (el) el.value = ''; });
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
	const e21 = num('gold-e21');
	const e55 = num('gold-e55');
	const e200 = num('gold-e200');

	if (!price || !e21 || !e55 || !e200) {
		$('gold-result').style.display = 'none';
		return;
	}
	$('gold-result').style.display = '';

	const rsi = num('gold-rsi');
	const adxV = num('gold-adx');
	const k = num('gold-k');
	const d = num('gold-d');
	const j = num('gold-j');
	const dif = num('gold-dif');
	const dea = num('gold-dea');
	const vol = num('gold-vol');
	const atr = num('gold-atr');
	const dxyV = num('gold-dxy');
	const dxyDir = sel('gold-dxy-dir');
	const fibH = num('gold-fibh');
	const fibL = num('gold-fibl');
	const fibDir = sel('gold-fib-dir');
	const riskPct = num('gold-risk-pct');
	const accountSz = num('gold-account');

	/* Distances */
	const pAboveE21 = pct(price, e21);
	const pAboveE55 = pct(price, e55);
	const pAboveE200 = pct(price, e200);
	const e21AboveE55 = pct(e21, e55);
	const e55AboveE200 = pct(e55, e200);

	/* Filter Evaluations */
	const f1_proximity = price > e21;  // price above EMA21
	const f1_stretch = Math.abs(pAboveE21 || 0);
	const f2_pass = e21 > e55;
	const f3_pass = e55 > e200;
	const macroPass = price > e200; // Absolute macro requirement

	const kdj = scoreKDJ(k, d, j);
	const rsiS = scoreRSI(rsi, 'gold');
	const adxS = scoreADX(adxV);
	const macd = scoreMACDZone(dif, dea);
	const volS = scoreVolume(vol);

	/* DXY Correlation */
	let dxyPass = null, dxyLabel = '—';
	if (dxyDir) {
		if (dxyDir === 'falling') { dxyPass = true; dxyLabel = '📉 Falling (Bullish Gold)'; }
		if (dxyDir === 'flat') { dxyPass = 'warn'; dxyLabel = '➡️ Flat (Neutral)'; }
		if (dxyDir === 'rising') { dxyPass = false; dxyLabel = '📈 Rising (Bearish Gold)'; }
	}

	/* Session Quality */
	const sess = getSession();
	const sessPass = sess.score >= 70 ? true : sess.score >= 40 ? 'warn' : false;

	/* Score Engine — Gold Weighted */
	const eng = scoreEngine();
	eng.add(f1_proximity, 15);  // F1: Price > EMA21
	eng.add(f2_pass, 15);  // F2: EMA21 > EMA55
	eng.add(f3_pass, 15);  // F3: EMA55 > EMA200 (macro)
	eng.add(kdj ? kdj.pass : null, 12);
	eng.add(rsiS ? rsiS.pass : null, 12);
	eng.add(adxS ? adxS.pass : null, 12);
	eng.add(macd ? macd.pass : null, 10);
	eng.add(volS ? volS.pass : null, 6);
	eng.add(dxyPass, 5);
	eng.add(sessPass, 3);  // Small weight — timing bonus

	/* Gold Stretch Penalty — gold is more volatile, use tighter threshold */
	let penalty = 0;
	if (f1_stretch > 6) penalty = -18;
	else if (f1_stretch > 4) penalty = -10;
	else if (f1_stretch > 2) penalty = -4;

	/* Extra penalty for macro misalignment */
	if (!macroPass) penalty -= 10;

	const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));

	/* Grade based on EMA21 vs EMA55 gap */
	const grade = getGrade(e21AboveE55 || 0);

	/* Decision Logic — Gold requires stricter criteria */
	const macroTrendOk = f3_pass && macroPass;
	const momentumOk = (!kdj || kdj.pass !== false)
		&& (!macd || macd.pass !== false)
		&& (!adxS || adxS.pass !== false)
		&& (!rsiS || rsiS.pass !== false);
	const dxyOk = dxyPass !== false;

	let decision, riskLevel, posSize;
	if (!macroTrendOk || !f1_proximity || !f2_pass || !momentumOk || !dxyOk) {
		decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0%';
	} else if (adjScore >= 78) {
		decision = 'PROCEED'; riskLevel = 'Low Risk';
		posSize = (f1_stretch > 3 || sess.score < 60) ? '50%' : '100%';
	} else if (adjScore >= 58) {
		decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
	} else {
		decision = 'WATCH'; riskLevel = 'Medium Risk'; posSize = '25%';
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
    <div>Macro: <span style="color:${macroPass ? 'var(--green)' : 'var(--red)'}">${macroPass ? '✅ Above EMA200' : '✘ Below EMA200'}</span>
      &nbsp; Size: <span style="color:${posSize === '100%' ? 'var(--green)' : 'var(--yellow)'}">${posSize}</span>
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
			`📐 Full EMA Stack: EMA21>EMA55>EMA200 ${f2_pass && f3_pass ? '✅ Aligned' : '🔴 Misaligned'}`,
			rsiS?.pass === true ? `📊 RSI ${rsi?.toFixed(1)} — in the gold momentum sweet spot (50-70).` : '',
			adxS?.pass === true ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend. High-probability gold setup.` : '',
			dxyDir === 'falling' ? `💵 DXY falling — dollar weakness supports gold bulls. Adds conviction.` : '',
			sess.score >= 70 ? `⏰ Trading during ${sess.full} — optimal liquidity for gold.` : `⚠️ ${sess.full} — lower liquidity. Consider wider spreads.`,
			`📦 Position: ${posSize}. Gold SL = Entry − (ATR × 1.8). Gold moves in wider ranges; don't use tight stops.`,
		].filter(Boolean).join('\n');
		adv.textContent = lines;
		adv.className = 'advice-box gold';
	} else if (decision === 'WATCH') {
		adv.textContent = `⚠️ Partial gold setup (Score: ${adjScore.toFixed(0)}/100). Wait for all 7 filters to align. Key requirements: EMA21>EMA55>EMA200, RSI 50-70, ADX>28, KDJ+MACD bullish. Patience is a trade.`;
		adv.className = 'advice-box yellow';
	} else {
		const missing = [
			!macroPass && `Price below EMA200 ($${e200.toFixed(2)}) — no long`,
			!f1_proximity && `Price below EMA21 ($${e21.toFixed(2)})`,
			!f2_pass && `EMA21 < EMA55 (short trend bearish)`,
			!f3_pass && `EMA55 < EMA200 (macro trend bearish)`,
			kdj?.pass === false && `KDJ Bearish`,
			macd?.pass === false && `MACD Bearish`,
			rsiS?.pass === false && `RSI ${rsi?.toFixed(1)} — outside momentum zone`,
			adxS?.pass === false && `ADX ${adxV?.toFixed(1)} — no trend`,
			dxyPass === false && `DXY Rising — headwind for gold`,
		].filter(Boolean);
		adv.textContent = `🔴 Skip gold trade. Critical failures: ${missing.join(' | ')}`;
		adv.className = 'advice-box red';
	}

	/* Dial */
	updateDial('gold-dial-arc', 'gold-dial-score', adjScore, true);

	/* Pie */
	drawPie('gold-pie', 'gold-pie-legend', [
		{ label: 'EMA Stack', value: (f1_proximity ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0), color: '#FFD700' },
		{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--green)' },
		{ label: 'RSI', value: rsiS ? (rsiS.pass === true ? 1 : rsiS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent)' },
		{ label: 'ADX', value: adxS ? (adxS.pass === true ? 1 : adxS.pass === 'warn' ? .5 : 0) : 0, color: '#e6b800' },
		{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
		{ label: 'DXY', value: dxyPass === true ? 1 : dxyPass === 'warn' ? .5 : 0, color: 'var(--orange)' },
		{ label: 'Session', value: sessPass === true ? 1 : sessPass === 'warn' ? .5 : 0, color: 'var(--green2)' },
	].filter(s => s.value > 0));

	/* Checklist */
	const passArr = [f1_proximity, f2_pass, f3_pass, macroPass,
		kdj?.pass === true, rsiS?.pass === true, adxS?.pass === true, macd?.pass === true,
	].filter(Boolean);

	$('gold-checklist').innerHTML = [
		buildCheck('F1 — Price > EMA21 (Momentum)', f1_proximity, `${f1_stretch.toFixed(2)}% above | ${f1_stretch <= 2 ? '🎯 Ideal' : f1_stretch <= 4 ? '✅ OK' : '⚠️ Stretched'}`),
		buildCheck('F2 — EMA21 > EMA55 (Short Trend)', f2_pass, fmt2(e21AboveE55)),
		buildCheck('F3 — EMA55 > EMA200 (Macro Trend)', f3_pass, fmt2(e55AboveE200)),
		buildCheck('F4 — Price > EMA200 (Institutional)', macroPass, `$${e200.toFixed(2)} ${macroPass ? '✅' : '🔴 Critical fail'}`),
		kdj
			? buildCheck(`F5 — KDJ ${kdj.zone}`, kdj.pass === true ? true : kdj.pass === false ? false : null, `K:${k?.toFixed(1)} D:${d?.toFixed(1)} J:${j?.toFixed(1)}`)
			: buildCheck('F5 — KDJ', null, 'Not provided'),
		rsiS
			? buildCheck(`F6 — RSI ${rsiS.zone}`, rsiS.pass === true ? true : rsiS.pass === false ? false : null, `RSI: ${rsi?.toFixed(1)} (target 50-70)`)
			: buildCheck('F6 — RSI14 Momentum', null, 'Not provided'),
		adxS
			? buildCheck(`F7 — ADX ${adxS.zone}`, adxS.pass === true ? true : adxS.pass === false ? false : null, `ADX: ${adxV?.toFixed(1)} (min 28)`)
			: buildCheck('F7 — ADX Trend Strength', null, 'Not provided'),
		macd
			? buildCheck(`MACD — ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif?.toFixed(2)} DEA:${dea?.toFixed(2)}`)
			: buildCheck('MACD Signal', null, 'Not provided'),
		dxyDir
			? buildCheck(`DXY Correlation`, dxyPass === true ? true : dxyPass === false ? false : null, dxyLabel)
			: buildCheck('DXY Correlation', null, 'Not provided'),
		buildCheck(`Session — ${sess.full}`, sessPass === true ? true : sessPass === 'warn' ? null : false, `${sess.emoji} Quality: ${sess.score}/100`),
	].join('');

	updateMeter('gold-signal-meter', passArr.length, 7);

	/* EMA Alignment Grid */
	$('gold-alignment-grid').innerHTML = [
		['Price vs EMA21', pAboveE21, pAboveE21 >= 0 && pAboveE21 <= 2 ? 'green' : pAboveE21 > 5 ? 'red' : pAboveE21 > 3 ? 'yellow' : 'accent'],
		['Price vs EMA55', pAboveE55, pAboveE55 >= 0 ? 'accent' : 'red'],
		['Price vs EMA200', pAboveE200, pAboveE200 >= 0 ? 'green' : 'red'],
		['EMA21 vs EMA55', e21AboveE55, e21AboveE55 > 0 ? 'green' : 'red'],
		['EMA55 vs EMA200', e55AboveE200, e55AboveE200 > 0 ? 'green' : 'red'],
		['Macro Aligned', null, macroPass && f2_pass && f3_pass ? 'green' : 'red', macroPass && f2_pass && f3_pass ? '✅ Full Bull' : '🔴 Misaligned'],
		rsi != null ? ['RSI14', null, rsiS.c.includes('green') ? 'green' : rsiS.c.includes('yellow') ? 'yellow' : 'red', `${rsi.toFixed(1)} ${rsiS.zone}`] : null,
		adxV != null ? ['ADX14', null, adxS.c.includes('green') ? 'green' : adxS.c.includes('yellow') ? 'yellow' : 'red', `${adxV.toFixed(1)} ${adxS.strength}`] : null,
	].filter(Boolean).map(([l, v, c, ov]) => {
		const display = ov || (v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—');
		return `<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${display}</div></div>`;
	}).join('');

	updateRange('gold-range-fill', 'gold-range-marker', 'gold-range-label', Math.max(0, f1_stretch), 7);

	/* ══ ENHANCED FIBONACCI — Confluence + Accuracy Score ══ */
	const fibCard   = $('gold-fib-card');
	const fibH2     = num('gold-fibh2');
	const fibL2     = num('gold-fibl2');
	const fib       = calcFib(fibH, fibL);
	const fib2      = calcFib(fibH2, fibL2);

	if (fib) {
		fibCard.style.display = '';
		const colors = { accent:'var(--accent)', green:'var(--green)', yellow:'var(--yellow)',
			gold:'#FFD700', orange:'var(--orange)', red:'var(--red)', dim:'var(--dim)' };

		// Accuracy score
		const emaStack  = [e21, e55, e200].filter(Boolean);
		const fibAcc    = fibAccuracyScore(price, fib, emaStack);
		const accStrip  = $('gold-fib-accuracy-strip');
		if (accStrip) {
			accStrip.style.display = '';
			const accColor = fibAcc.score >= 80 ? '#FFD700' : fibAcc.score >= 55 ? 'var(--accent)' : 'var(--dim)';
			const accLabel = fibAcc.score >= 80 ? '🎯 HIGH ACCURACY — Golden Ratio Confluence'
				: fibAcc.score >= 55 ? '✅ MODERATE — Near Key Fibonacci Level'
				: '⚠️ LOW — Price not near key level';
			accStrip.innerHTML = `<div class="fib-acc-bar">
				<div class="fib-acc-left">
					<span class="fib-acc-score" style="color:${accColor}">${Math.round(fibAcc.score)}%</span>
					<span class="fib-acc-label">${accLabel}</span>
				</div>
				${fibAcc.level ? `<span class="fib-acc-level" style="color:${accColor}">Nearest: ${fibAcc.level.name} @ $${fibAcc.level.lvPrice.toFixed(2)} (${fibAcc.level.distPct.toFixed(2)}% away)</span>` : ''}
			</div>`;
		}

		// Confluence zones (secondary fib)
		const confEl = $('gold-fib-confluence');
		if (fib2 && confEl) {
			const zones = fibConfluence(fib, fib2, Math.max(fib.range, fib2.range));
			if (zones.length > 0) {
				confEl.style.display = '';
				confEl.innerHTML = `<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;font-weight:700">φ Confluence Zones — Highest Accuracy</div>
					${zones.slice(0,4).map(z => `<div class="fib-confluence-row">
						<span class="fib-conf-badge" style="color:${z.strength==='STRONG'?'#FFD700':'var(--accent)'}">${z.strength}</span>
						<span class="fib-conf-price">$${z.price.toFixed(2)}</span>
						<span class="fib-conf-desc">${z.level1}% ∩ ${z.level2}% — ${z.diffPct.toFixed(2)}% apart</span>
						<span class="fib-conf-action">${parseFloat(z.level1)<=61.8?'🎯 Entry':'📐 TP'}</span>
					</div>`).join('')}`;
			} else confEl.style.display = 'none';
		} else if (confEl) confEl.style.display = 'none';

		// Full fibonacci grid
		const fibLevels = [
			{ key:'ext_261', label:'261.8% Extension', tag:'Far TP',    tagCls:'accent', isExt:true },
			{ key:'ext_200', label:'200% Extension',   tag:'TP3',       tagCls:'accent', isExt:true },
			{ key:'ext_161', label:'161.8% ★ Golden',  tag:'TP2',       tagCls:'gold',   isExt:true },
			{ key:'ext_141', label:'141.4% Extension', tag:'TP1b',      tagCls:'accent', isExt:true },
			{ key:'ext_127', label:'127.2% Extension', tag:'TP1',       tagCls:'accent', isExt:true },
			{ key:'0',       label:'0% Swing High',    tag:'Resistance',tagCls:'green'  },
			{ key:'23.6',    label:'23.6% Retrace',    tag:'Minor',     tagCls:'yellow' },
			{ key:'38.2',    label:'38.2% ★ Golden',   tag:'Key Entry', tagCls:'gold'   },
			{ key:'50',      label:'50% Midpoint',     tag:'Key',       tagCls:'yellow' },
			{ key:'61.8',    label:'61.8% ★ Golden',   tag:'Best Entry',tagCls:'gold'   },
			{ key:'78.6',    label:'78.6% Deep',       tag:'Deep Entry',tagCls:'orange' },
			{ key:'88.6',    label:'88.6% Harmonic',   tag:'Last',      tagCls:'red'    },
			{ key:'100',     label:'100% Swing Low',   tag:'Support',   tagCls:'red'    },
		];

		const nearest      = nearestFibLevel(price, fib);
		const pctPosInRange = ((price - fib['100']) / fib.range) * 100;

		$('gold-fib-grid').innerHTML = fibLevels.map(lv => {
			const lvPrice = fib[lv.key];
			if (!lvPrice) return '';
			const distPct  = Math.abs(price - lvPrice) / fib.range * 100;
			const isCurrent = nearest.level === lv.key && distPct < 3;
			const isAbove   = price > lvPrice;
			const c = colors[lv.tagCls] || 'var(--dim)';
			const isKey     = ['38.2','61.8','ext_161'].includes(lv.key);
			const nowBadge  = isCurrent ? ` <span style="background:rgba(255,215,0,.2);color:#FFD700;font-size:8px;padding:.1rem .35rem;border-radius:3px;border:1px solid rgba(255,215,0,.4);font-weight:700">◀ PRICE</span>` : '';
			const distNote  = distPct < 1.5 && !isCurrent ? ` <span style="color:var(--muted);font-size:9px">${distPct.toFixed(1)}% away</span>` : '';
			return `<div class="fib-row${isCurrent?' current':''}${isKey?' fib-key-level':''}${lv.isExt?' fib-ext-row':''}">
				<span class="fib-pct" style="color:${c}">${lv.isExt ? lv.label.split(' ')[0] : lv.key+'%'}</span>
				<span class="fib-price" style="color:${isAbove?'var(--dim)':'var(--text)'}">$${lvPrice.toFixed(2)}</span>
				<span class="fib-label">${lv.label}${nowBadge}${distNote}</span>
				<span class="fib-tag" style="background:${c}18;color:${c};border:1px solid ${c}35">${lv.tag}</span>
			</div>`;
		}).join('');

		// Secondary fib grid
		const grid2Wrap = $('gold-fib-grid2-wrap');
		if (fib2 && grid2Wrap) {
			grid2Wrap.style.display = '';
			$('gold-fib-grid2').innerHTML = ['ext_161','0','38.2','50','61.8','78.6','100'].map(k => {
				const lp = fib2[k]; if (!lp) return '';
				return `<div class="fib-row fib-sec"><span class="fib-pct" style="color:var(--dim)">${k.startsWith('ext')?'161.8%':k+'%'}</span><span class="fib-price" style="color:${price>lp?'var(--muted)':'var(--dim)'}">$${lp.toFixed(2)}</span><span class="fib-label" style="color:var(--muted)">Secondary</span></div>`;
			}).join('');
		} else if (grid2Wrap) grid2Wrap.style.display = 'none';

		// Position bar
		updateRange('gold-fib-fill','gold-fib-marker','gold-fib-pos-label', Math.max(0,Math.min(100,pctPosInRange)), 100);
		$('gold-fib-low-label').textContent  = `Low $${fibL.toFixed(2)}`;
		$('gold-fib-high-label').textContent = `High $${fibH.toFixed(2)}`;

		// Fibonacci-precision entry + TP
		const precEl = $('gold-fib-precision');
		if (precEl) {
			precEl.style.display = '';
			const retraceLevels = [
				{key:'23.6',p:3},{key:'38.2',p:5},{key:'50',p:4},{key:'61.8',p:5},{key:'78.6',p:3}
			];
			let bestEntry = null;
			for (const lv of retraceLevels) {
				const lvP = fib[lv.key];
				if (lvP && lvP <= price) {
					const dist = price - lvP;
					if (!bestEntry || dist < bestEntry.dist) bestEntry = {...lv, price:lvP, dist};
				}
			}
			const idealEntry = bestEntry ? bestEntry.price : price;
			const idealNote  = bestEntry ? `${bestEntry.key}% Fib ($${idealEntry.toFixed(2)})` : 'current price';
			precEl.innerHTML = `<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem;font-weight:700">📐 Fibonacci Precision Entry &amp; Take-Profit Levels</div>
				<div class="fib-precision-grid">
					<div class="fib-prec-row entry"><span class="fib-prec-label">Ideal Entry Zone</span><span class="fib-prec-price" style="color:var(--accent)">$${idealEntry.toFixed(2)}</span><span class="fib-prec-note">Pullback to ${idealNote}</span></div>
					<div class="fib-prec-row tp"><span class="fib-prec-label">TP1 — 127.2% Ext</span><span class="fib-prec-price" style="color:var(--green)">$${fib.ext_127.toFixed(2)}</span><span class="fib-prec-note">First target — take 40%</span></div>
					<div class="fib-prec-row tp"><span class="fib-prec-label">TP2 — 161.8% ★ Golden</span><span class="fib-prec-price" style="color:#FFD700">$${fib.ext_161.toFixed(2)}</span><span class="fib-prec-note">Golden extension — take 40%</span></div>
					<div class="fib-prec-row tp"><span class="fib-prec-label">TP3 — 200%</span><span class="fib-prec-price" style="color:#88ffcc">$${fib.ext_200.toFixed(2)}</span><span class="fib-prec-note">Hold 20% — trail stop</span></div>
					<div class="fib-prec-row tp"><span class="fib-prec-label">TP4 — 261.8%</span><span class="fib-prec-price" style="color:#aaffee">$${fib.ext_261.toFixed(2)}</span><span class="fib-prec-note">Ultimate — strong bull only</span></div>
				</div>`;
		}

		// Advice
		const fibAdvEl = $('gold-fib-advice');
		const nearPct  = parseFloat(nearest.level);
		const inExtZone = price > fib['0'];
		const accNote   = fibAcc.score >= 80
			? `🎯 ACCURACY ${Math.round(fibAcc.score)}% — ${fibAcc.level?.name} with ${emaStack.length ? 'EMA confluence' : 'no EMA yet'}.`
			: fibAcc.score >= 55
				? `✅ Accuracy ${Math.round(fibAcc.score)}% — near key level.`
				: `⚠️ Accuracy ${Math.round(fibAcc.score)}% — wait for pullback to 38.2% ($${fib['38.2'].toFixed(2)}) or 61.8% ($${fib['61.8'].toFixed(2)}).`;
		let fibAdvice;
		if (inExtZone) {
			fibAdvice = `📐 Price above swing high. Extensions: 127.2%=$${fib.ext_127.toFixed(2)} | 161.8%★=$${fib.ext_161.toFixed(2)} | 200%=$${fib.ext_200.toFixed(2)} | 261.8%=$${fib.ext_261.toFixed(2)}.`;
		} else if (nearPct > 0 && nearPct <= 38.2) {
			fibAdvice = `${accNote} Shallow 38.2% pullback — strong trend. Full position valid. TP targets set above.`;
		} else if (nearPct <= 61.8) {
			fibAdvice = `${accNote} ${nearPct===61.8?'GOLDEN RATIO':'Mid'} pullback at ${nearPct}% — best RR entry zone. Require RSI>50 + KDJ cross + volume spike.`;
		} else if (nearPct <= 78.6) {
			fibAdvice = `${accNote} Deep retrace. Require strong reversal candle + volume>1.5× before entry. Reduce size 50%.`;
		} else if (nearPct <= 88.6) {
			fibAdvice = `⚠️ Very deep 88.6% harmonic level — last valid support. High risk. Tight stop only.`;
		} else {
			fibAdvice = `🔴 At/below swing low. Do not enter long until new higher low forms and MAs rebuild.`;
		}
		if (fibDir==='extend') fibAdvice = `📐 Extensions: 127.2%=$${fib.ext_127.toFixed(2)} | 161.8%★=$${fib.ext_161.toFixed(2)} | 200%=$${fib.ext_200.toFixed(2)} | 261.8%=$${fib.ext_261.toFixed(2)}.`;
		fibAdvEl.textContent = fibAdvice;

	} else {
		fibCard.style.display = 'none';
	}

	/* ── SESSION QUALITY SECTION ── */
	const sessCard = $('gold-session-card');
	const sessGrid = $('gold-session-grid');
	const sessFill = $('gold-sess-fill');
	const sessMark = $('gold-sess-marker');
	const sessLabel = $('gold-sess-label');
	const sessChip = $('gold-session-chip');

	sessCard.style.display = '';
	if (sessChip) { sessChip.textContent = `${sess.emoji} ${sess.full}`; sessChip.style.display = ''; }

	if (sessFill) sessFill.style.width = sess.score + '%';
	if (sessMark) sessMark.style.left = sess.score + '%';
	if (sessLabel) sessLabel.textContent = `${sess.score}/100 — ${sess.full}`;

	const sessData = [
		{ name: 'London-NY Overlap', time: '13:00–17:00', note: 'Prime — max liquidity', active: sess.score === 100, quality: '#00e87a' },
		{ name: 'NY Session', time: '13:00–22:00', note: 'High volume gold moves', active: sess.score >= 70 && sess.score < 100, quality: 'var(--accent)' },
		{ name: 'London Session', time: '08:00–17:00', note: 'Strong gold momentum', active: sess.score >= 65 && sess.score < 80, quality: 'var(--accent)' },
		{ name: 'Tokyo Session', time: '00:00–09:00', note: 'Low vol — avoid entry', active: sess.score === 40, quality: 'var(--yellow)' },
		{ name: 'Off-Hours', time: '22:00–08:00', note: 'Thin liquidity — skip', active: sess.score < 40, quality: 'var(--red)' },
	];

	sessGrid.innerHTML = sessData.map(s =>
		`<div class="session-cell${s.active ? ' active-sess' : ''}">
      <div class="session-name">${s.name}</div>
      <div class="session-time">${s.time} UTC</div>
      <div class="session-quality" style="color:${s.active ? s.quality : 'var(--muted)'}">${s.active ? '▶ NOW' : '–'}</div>
      <div style="font-size:9px;color:var(--muted);margin-top:.1rem">${s.note}</div>
    </div>`
	).join('');

	/* Trade Plan */
	buildTradePlan('gold-price-block', 'gold-tradeplan-card', price, atr, accountSz, riskPct, 'gold');
}

function resetGold() {
	['gold-price', 'gold-e21', 'gold-e55', 'gold-e200',
		'gold-rsi', 'gold-adx', 'gold-k', 'gold-d', 'gold-j',
		'gold-dif', 'gold-dea', 'gold-hist',
		'gold-dxy', 'gold-vol', 'gold-atr',
		'gold-fibh', 'gold-fibl',
		'gold-risk-pct', 'gold-account', 'gold-lotsize',
	].forEach(id => { const el = $(id); if (el) el.value = ''; });
	const dxyDirEl = $('gold-dxy-dir');
	const fibDirEl = $('gold-fib-dir');
	if (dxyDirEl) dxyDirEl.value = '';
	if (fibDirEl) fibDirEl.value = 'retrace';
	$('gold-result').style.display = 'none';
}


/* Auto-trigger gold session banner on load */
updateGoldSessionBanner();

/* ══════════════════════════════════════
   GUIDE SUB-TAB SWITCHER
══════════════════════════════════════ */
function switchGuide(id) {
	document.querySelectorAll('.guide-tab-btn').forEach(b => b.classList.remove('active'));
	document.querySelectorAll('.guide-section').forEach(s => s.classList.remove('active'));
	const section = $(id);
	if (section) section.classList.add('active');
	document.querySelectorAll('.guide-tab-btn').forEach(b => {
		if (b.getAttribute('onclick') === `switchGuide('${id}')`) b.classList.add('active');
	});
}

/* ══════════════════════════════════════
   TOOLTIP DATA MAP
   Keyed by input/select element ID
══════════════════════════════════════ */
const TOOLTIPS = {

	/* ─── MA CALCULATOR ─── */
	'ma-price': {
		title: 'Market Price',
		body: 'The current live trading price of the asset. Use the last traded price shown on your broker platform or charting tool.',
		where: '📍 Platform: Quote screen, last price',
		ranges: [['0–2% above MA5', 'green', 'Ideal entry'], ['2–5% above MA5', 'yellow', 'Acceptable'], ['5%+ above MA5', 'red', 'Wait for pullback']]
	},
	'ma-ma5': {
		title: 'MA5 — 5-Period Moving Average',
		body: 'The average closing price over the last 5 trading days. Acts as the immediate short-term momentum line. Price must stay above this for upward momentum to be valid.',
		where: '📍 Charting: Add MA indicator → Period = 5 → Closing price'
	},
	'ma-ma20': {
		title: 'MA20 — 20-Period Moving Average',
		body: 'The monthly average (~20 trading days). This is the most important reference level. The distance between price and MA20 determines your entry quality and position size.',
		where: '📍 Charting: Add MA indicator → Period = 20',
		ranges: [['0–2% above', 'green', 'Ideal zone — full size'], ['2–5% above', 'accent', 'Acceptable — enter'], ['5–10% above', 'yellow', 'Stretched — 50% size'], ['>10% above', 'red', 'Overextended — skip']]
	},
	'ma-ma50': {
		title: 'MA50 — 50-Period Moving Average',
		body: 'The quarterly average. Institutional funds frequently buy/sell at the MA50. MA20 must be above MA50 to confirm an uptrend is in progress.',
		where: '📍 Charting: Add MA indicator → Period = 50'
	},
	'ma-ma200': {
		title: 'MA200 — 200-Period Moving Average (Optional)',
		body: 'The annual average. The single most important macro trend indicator used by all major funds. Price above MA200 = institutional bull market. Below MA200 = institutional bear market. This filter adds +8 weight to your score when aligned.',
		where: '📍 Charting: Add MA indicator → Period = 200'
	},
	'ma-adx': {
		title: 'ADX14 — Average Directional Index (Optional)',
		body: 'Measures trend STRENGTH (not direction). Without a strong ADX, MA crossover signals are unreliable. Must be >28 for a confirmed trending move.',
		where: '📍 Charting: Add ADX(14) or Average Directional Movement indicator',
		ranges: [['<20', 'red', 'Ranging — MAs unreliable'], ['20–28', 'yellow', 'Developing trend'], ['28–50', 'green', 'Strong — trade with full confidence'], ['>50', 'accent', 'Momentum surge — exceptional setup']]
	},
	'ma-st': {
		title: 'Supertrend Value (Optional)',
		body: 'The current value of the Supertrend indicator line. If current price is above this value = bullish (green line). If price is below = bearish (red line). A common setting is ATR(10)×3.',
		where: '📍 Charting: Add Supertrend indicator → note the line value at current candle'
	},
	'ma-bbu': {
		title: 'Bollinger Band Upper (Optional)',
		body: 'The upper band of the Bollinger Band indicator. Price touching/crossing the upper band with strong volume = powerful momentum continuation. Price outside upper band = extremely overbought, expect pullback.',
		where: '📍 Charting: Add Bollinger Bands (20,2) → note upper band value'
	},
	'ma-bbl': {
		title: 'Bollinger Band Lower (Optional)',
		body: 'The lower band of Bollinger Bands. Price bouncing from the lower band in an uptrend = excellent entry signal. Required alongside BB Upper to show the BB position bar.',
		where: '📍 Charting: Add Bollinger Bands (20,2) → note lower band value'
	},
	'ma-k': {
		title: 'KDJ — K Line (Fast Stochastic)',
		body: 'The fast stochastic line of the KDJ oscillator. K crossing above D = bullish signal. Range 0–100. Above 50 = net bullish momentum. Used to time precise entry within an otherwise valid setup.',
		where: '📍 Charting: Add KDJ(9,3,3) or Stochastic(9) → K value'
	},
	'ma-d': {
		title: 'KDJ — D Line (Slow Signal)',
		body: 'The slow signal line (3-period MA of K). K must be greater than D for a bullish reading. When K crosses above D from below, it signals a potential momentum reversal upward.',
		where: '📍 Charting: KDJ indicator → D value'
	},
	'ma-j': {
		title: 'KDJ — J Line (Momentum Extreme)',
		body: 'The most sensitive KDJ line: J = 3K − 2D. Can go beyond 0–100. J <20 = oversold bounce signal (buy opportunity). J 20–80 = normal zone. J >80 = overbought (reduce size). J >90 = extreme, skip or exit.',
		where: '📍 Charting: KDJ indicator → J value',
		ranges: [['J < 20', 'accent', 'Oversold bounce — best timing'], ['J 20–80', 'green', 'Normal zone — full entry'], ['J 80–90', 'yellow', 'Overbought — reduce 50%'], ['J > 90', 'red', 'Extreme — skip trade']]
	},
	'ma-dif': {
		title: 'MACD — DIF (MACD Line)',
		body: 'The MACD line = EMA(12) − EMA(26). Also called "fast line". DIF positive = short-term average above long-term = bullish. When DIF crosses above DEA from below = buy signal.',
		where: '📍 Charting: MACD(12,26,9) → MACD line value (blue line in most platforms)'
	},
	'ma-dea': {
		title: 'MACD — DEA (Signal Line)',
		body: 'The signal line = 9-period EMA of DIF. DIF must be above DEA for a bullish reading. The closer DIF is to DEA, the weaker the current momentum. DIF far above DEA = strong momentum.',
		where: '📍 Charting: MACD indicator → Signal line value (orange/red line)'
	},
	'ma-hist': {
		title: 'MACD — Histogram (Momentum Bars)',
		body: 'The histogram bars = DIF − DEA. Growing positive bars = momentum accelerating (bullish). Shrinking bars = momentum fading (warning). Histogram turns negative before DIF/DEA cross — early warning signal.',
		where: '📍 Charting: MACD indicator → the bar chart below the lines'
	},
	'ma-vol': {
		title: 'Volume Ratio (Relative Volume)',
		body: 'Today\'s volume divided by the 20-day average volume. This tells you if "smart money" is participating. Never buy breakouts on low volume — they fail. High volume = institutional conviction.',
		where: '📍 Calculate: Today\'s Volume ÷ 20-day Avg Volume. Or use Relative Volume indicator.',
		ranges: [['> 1.5×', 'green', 'Very strong — institutions buying'], ['1.2–1.5×', 'accent', 'Strong — good conviction'], ['0.8–1.2×', 'yellow', 'Moderate — caution'], ['< 0.8×', 'red', 'Weak — avoid breakout entry']]
	},
	'ma-rsi': {
		title: 'RSI14 — Relative Strength Index (Optional)',
		body: 'Momentum oscillator 0–100. For momentum trading: 50–72 = sweet spot. Above 80 = overbought extreme. Below 40 = momentum not confirmed. The 50 level is the key bull/bear divider.',
		where: '📍 Charting: Add RSI(14) → current value shown at bottom of indicator'
	},
	'ma-atr': {
		title: 'ATR14 — Average True Range',
		body: 'The average daily price range over 14 days. CRITICAL for stop loss calculation. Stop = Entry − (ATR × 1.5). Higher ATR = wider stops needed. Stocks: typically $0.02–$2.00. Enter this and the Trade Plan auto-calculates all price targets.',
		where: '📍 Charting: Add ATR(14) → the current value shown on the indicator'
	},
	'ma-risk-pct': {
		title: 'Risk per Trade %',
		body: 'The percentage of your total account you will risk on this single trade. Recommended: 0.5%–1.0% maximum. At 1% risk with a $10,000 account = max $100 loss. This drives the position sizing calculation.',
		where: '📍 Your choice: Beginner = 0.5% | Intermediate = 1.0% | Max = 1.5%'
	},
	'ma-account': {
		title: 'Account Size ($)',
		body: 'Your total trading capital available in your brokerage account. Used to calculate the exact number of units/shares you should buy to stay within your risk limit. Update monthly as account grows.',
		where: '📍 Your brokerage account balance in USD'
	},

	/* ─── EMA CALCULATOR ─── */
	'ema-price': {
		title: 'Market Price',
		body: 'Current live price of the asset. For EMA trading, the entry quality is measured by how close price is to EMA8. Ideal: within 0–2% of EMA8.',
		where: '📍 Platform: Last traded price / bid price'
	},
	'ema-ema8': {
		title: 'EMA8 — 8-Period Exponential MA',
		body: 'The fast EMA — the heartbeat of momentum trading. Professional traders treat a close below EMA8 as an exit signal. Ideal entry: price 0–2% above EMA8 after a pullback bounce. EMA8 gives more weight to recent prices vs MA.',
		where: '📍 Charting: EMA indicator → Period = 8 → Close',
		ranges: [['0–2% above EMA8', 'green', 'Ideal zone'], ['2–5% above', 'accent', 'Acceptable'], ['5–10% above', 'yellow', 'Stretched — wait'], ['> 10% above', 'red', 'Overextended — skip']]
	},
	'ema-ema21': {
		title: 'EMA21 — 21-Period Exponential MA',
		body: 'The intermediate trend EMA. EMA8 must be above EMA21 for bullish momentum. EMA21 is the pullback support level in a bull trend — a bounce from EMA21 on lower volume is a strong buy signal.',
		where: '📍 Charting: EMA indicator → Period = 21 → Close'
	},
	'ema-ema55': {
		title: 'EMA55 — 55-Period Exponential MA',
		body: 'The macro momentum EMA. EMA21 above EMA55 = trend maturity grade system. The gap between EMA21 and EMA55 determines grade: S++(1–3%) → A(3–5%) → B(5–8%) → C(8–10%) → X(>10%). Trade S++ and A grades only.',
		where: '📍 Charting: EMA indicator → Period = 55 → Close'
	},
	'ema-ema200': {
		title: 'EMA200 — Institutional Macro Filter (Optional)',
		body: 'The most important macro trend EMA. Price above EMA200 = institutional uptrend. This is a powerful confirmatory filter that adds conviction. Funds buy above EMA200, sell below it. Adds 6 points to score.',
		where: '📍 Charting: EMA indicator → Period = 200 → Close'
	},
	'ema-adx': {
		title: 'ADX14 — Trend Strength Filter (Optional)',
		body: 'Critical filter: EMA signals are unreliable in ranging markets (ADX <20). ADX >28 confirms the trend is real. ADX >50 signals a momentum surge — these produce the biggest moves.',
		where: '📍 Charting: ADX(14) or Average Directional Index indicator',
		ranges: [['< 20', 'red', 'Ranging — EMAs unreliable'], ['20–28', 'yellow', 'Developing'], ['28–50', 'green', 'Strong trend — trade'], ['> 50', 'accent', 'Momentum surge!']]
	},
	'ema-ichi': {
		title: 'Ichimoku Cloud Position (Optional)',
		body: 'Ichimoku Kinko Hyo cloud position adds powerful macro confirmation. "Price above cloud" = strongest bullish signal, all timeframes aligned. "Inside cloud" = wait for resolution. "Below cloud" = do not buy. The cloud (Kumo) acts as dynamic support/resistance.',
		where: '📍 Charting: Add Ichimoku Cloud indicator → observe price vs cloud'
	},
	'ema-st': {
		title: 'Supertrend Value (Optional)',
		body: 'Current value of the Supertrend indicator. Price above Supertrend = bullish (green line). Price below = bearish (red line). Commonly used with ATR(10)×3 settings. When price crosses above Supertrend + EMA8>21>55, it\'s a very strong combined signal.',
		where: '📍 Charting: Add Supertrend(10,3) → note the current line value'
	},
	'ema-vwap': {
		title: 'VWAP — Volume Weighted Average Price (Optional)',
		body: 'The institutional day-trading reference price. Price above VWAP = intraday bulls in control. Best EMA entries occur when price dips to VWAP from above in a bull trend and bounces. VWAP resets each trading day.',
		where: '📍 Charting: Add VWAP indicator → shows as horizontal line updating intraday'
	},
	'ema-open': {
		title: 'Opening Price (Optional)',
		body: 'The price at market open today. Used to calculate the gap from open — whether the stock gapped up or down. A gap-up with strong EMAs = bullish. A gap-down with strong EMAs = wait for recovery confirmation.',
		where: '📍 Platform: Today\'s opening price from your broker'
	},
	'ema-prev': {
		title: 'Previous Close (Optional)',
		body: 'Yesterday\'s closing price. Used to calculate daily change %. Helps assess overnight sentiment shift. Price up from prev close + EMA bull stack = continuation. Price down from prev close = wait for support.',
		where: '📍 Platform: Yesterday\'s official closing price'
	},
	'ema-high': {
		title: 'Day High (Optional)',
		body: 'Today\'s highest price. Used to position your entry within the day\'s range. Buying near day high in a strong trend is valid. A "Day Range Position" bar will show where current price sits within today\'s high/low range.',
		where: '📍 Platform: Today\'s high price shown in quote'
	},
	'ema-low': {
		title: 'Day Low (Optional)',
		body: 'Today\'s lowest price. Combined with Day High, shows the day range bar. Price near day low + EMA8 support = potential bounce. Price near day high = momentum continuation or consider waiting for pullback.',
		where: '📍 Platform: Today\'s low price shown in quote'
	},
	'ema-52h': {
		title: '52-Week High (Optional)',
		body: 'The highest price in the last 52 weeks. Price near 52-week high = potential breakout momentum. Within 5% of 52-week high + strong EMAs = high-conviction breakout setup. Funds track 52-week highs closely.',
		where: '📍 Platform: Stock statistics / fundamental data panel'
	},
	'ema-52l': {
		title: '52-Week Low (Optional)',
		body: 'The lowest price in the last 52 weeks. Shows how far price has recovered from its worst point. Large recovery + EMA alignment = strong momentum trend building. % above 52-week low shows bull run strength.',
		where: '📍 Platform: Stock statistics / fundamental data panel'
	},
	'ema-k': { title: 'KDJ — K Line', body: 'Fast stochastic line. K > D = bullish signal. K crossing above D from below = buy timing. Range 0–100, above 50 = net bullish momentum.', where: '📍 Charting: KDJ(9,3,3) indicator → K value' },
	'ema-d': { title: 'KDJ — D Line', body: 'Slow signal line (3-period MA of K). K must be above D for a bullish reading. K/D crossovers are the timing signal within a valid setup.', where: '📍 Charting: KDJ indicator → D value' },
	'ema-j': {
		title: 'KDJ — J Line (Momentum Extreme)',
		body: 'Most sensitive line: J = 3K − 2D. J < 20 = oversold bounce opportunity. J 20–80 = normal. J > 80 = overbought, reduce size. J > 90 = extreme overbought, skip.',
		where: '📍 Charting: KDJ indicator → J value',
		ranges: [['J < 20', 'accent', 'Best timing — oversold bounce'], ['J 20–75', 'green', 'Normal — enter'], ['J 75–90', 'yellow', 'Overbought — reduce size'], ['J > 90', 'red', 'Extreme — skip']]
	},
	'ema-dif': { title: 'MACD — DIF (MACD Line)', body: 'EMA(12) − EMA(26). DIF > DEA = bullish. DIF > 0 = both EMAs in bull territory. When DIF just crossed above DEA = fresh buy signal.', where: '📍 Charting: MACD(12,26,9) → MACD/DIF line value' },
	'ema-dea': { title: 'MACD — DEA (Signal Line)', body: '9-period EMA of DIF. DIF must be above DEA for bullish confirmation. Large positive gap = strong momentum. Narrowing gap = momentum fading.', where: '📍 Charting: MACD indicator → Signal line value' },
	'ema-hist': { title: 'MACD Histogram', body: 'DIF − DEA as bar chart. Growing bars = accelerating momentum. Shrinking = fading. First positive bar after negative = early bullish reversal signal.', where: '📍 Charting: MACD indicator → bar chart below the lines' },
	'ema-vol': {
		title: 'Volume Ratio (Relative Volume)',
		body: 'Today\'s volume ÷ 20-day average volume. High-conviction EMA breakouts require volume > 1.2×. Low volume EMA signals often fail.',
		where: '📍 Calculate: Today Vol ÷ 20-day Avg Vol, or use Relative Volume indicator',
		ranges: [['> 1.5×', 'green', 'Strong conviction'], ['1.2–1.5×', 'accent', 'Good'], ['0.8–1.2×', 'yellow', 'Moderate'], ['< 0.8×', 'red', 'Weak — wait']]
	},
	'ema-rsi': { title: 'RSI14 (Optional)', body: 'Momentum oscillator 0–100. Ideal for EMA trades: 50–72. Above 80 = overbought, consider reducing. Below 40 = momentum not yet confirmed.', where: '📍 Charting: RSI(14) indicator → current value' },
	'ema-atr': { title: 'ATR14 — Average True Range', body: 'Daily volatility measure. Stop Loss = Entry − (ATR × 1.5). Entering ATR14 activates the full Trade Plan with all price targets and risk calculator.', where: '📍 Charting: ATR(14) indicator → current value' },
	'ema-bidask': {
		title: 'Bid/Ask Ratio % (Optional)',
		body: 'Bid size as % of total (bid + ask). >60% = buyers dominating = bullish. <40% = sellers dominating = bearish. Shows real-time order book sentiment. Used in the signal breakdown pie chart.',
		where: '📍 Platform: Level 2 / order book — Bid/(Bid+Ask) × 100',
		ranges: [['>60%', 'green', 'Strong buyer demand'], ['40–60%', 'accent', 'Balanced'], ['<40%', 'red', 'Sellers dominate']]
	},
	'ema-beta': {
		title: 'Beta (Optional)',
		body: 'Measures volatility relative to the market (S&P500). Beta 1.0 = moves with market. Beta 1.5 = 50% more volatile. High beta stocks need wider stops (ATR already handles this) and smaller position sizes.',
		where: '📍 Platform: Stock fundamentals / statistics panel',
		ranges: [['< 1.0', 'green', 'Low volatility — normal sizing'], ['1.0–1.5', 'yellow', 'Above market — reduce size slightly'], ['> 1.5', 'red', 'High volatility — smaller position']]
	},
	'ema-risk-pct': { title: 'Risk per Trade %', body: 'Max % of account to risk per trade. Recommended 0.5–1.0%. Drives the position sizing calculation in the Trade Plan card.', where: '📍 Your risk preference: 0.5% (conservative) to 1.5% (aggressive max)' },
	'ema-account': { title: 'Account Size ($)', body: 'Total trading capital. Combined with Risk%, ATR, and entry price → calculates exact units to buy. Update this regularly as your account changes.', where: '📍 Your current brokerage account balance' },

	/* ─── GOLD CALCULATOR ─── */
	'gold-price': {
		title: 'XAUUSD Current Price',
		body: 'The current live gold price in USD per troy ounce. Use the mid-price or last traded price from your broker. Gold typically trades in $0.01–$0.10 increments.',
		where: '📍 Broker/MT4/MT5: XAUUSD quote | TradingView: XAUUSD symbol'
	},
	'gold-e21': {
		title: 'EMA21 — Gold Short-Term Trend',
		body: 'The primary trend EMA for gold. Price must be above EMA21 for a valid long. The % gap above EMA21 tells entry quality: 0–1% = ideal, 1–3% = acceptable, 3–5% = stretched, >5% = overextended (wait for pullback to EMA21).',
		where: '📍 Charting: EMA(21) on XAUUSD daily or 4H chart',
		ranges: [['0–1% above', 'green', 'Ideal — full position'], ['1–3% above', 'accent', 'Good'], ['3–5% above', 'yellow', 'Stretched — 50% size'], ['>5% above', 'red', 'Overextended — wait']]
	},
	'gold-e55': {
		title: 'EMA55 — Gold Intermediate Trend',
		body: 'EMA21 must be above EMA55 for trend maturity grade. This is the same maturity grading system as EMA trading: S++(1–3% gap) = freshest highest-conviction gold setup. Grade B or worse = reduce size.',
		where: '📍 Charting: EMA(55) on XAUUSD daily chart'
	},
	'gold-e200': {
		title: 'EMA200 — Gold Institutional Macro Trend',
		body: '⚠️ CRITICAL for gold. Do NOT buy gold below EMA200. This is the line major central banks and funds use to allocate gold. Price above EMA200 = institutional bull market. In 2024–25, gold remained firmly above EMA200 = structural bull. If price falls below EMA200, close all longs immediately.',
		where: '📍 Charting: EMA(200) on XAUUSD daily chart'
	},
	'gold-rsi': {
		title: 'RSI14 — Gold Momentum Sweet Spot',
		body: 'Gold has a specific RSI sweet spot: 50–70. Below 50 = bearish momentum, avoid longs. 50–70 = momentum confirmed without being overbought — highest probability zone. Above 70 = reduce size. Above 80 = extreme, exit or tighten stop. This filter is required for a gold signal.',
		where: '📍 Charting: RSI(14) on XAUUSD — use daily or 4H timeframe',
		ranges: [['50–70', 'green', 'Sweet spot — ideal for longs'], ['45–50', 'yellow', 'Borderline — wait for confirmation'], ['70–80', 'orange', 'Overbought — reduce size'], ['> 80', 'red', 'Extreme — exit or skip'], ['< 45', 'red', 'Avoid — no momentum']]
	},
	'gold-adx': {
		title: 'ADX14 — Gold Trend Strength',
		body: 'Gold is notorious for violent fake breakouts when ADX is low. Require ADX > 28 before entering any gold momentum trade. ADX > 45 = momentum surge (geopolitical/macro-driven) — these moves are fast and large but need immediate stop management.',
		where: '📍 Charting: ADX(14) on XAUUSD daily or 4H chart',
		ranges: [['< 20', 'red', 'Ranging — false signals'], ['20–28', 'yellow', 'Developing — small size only'], ['28–45', 'green', 'Strong trend — trade normally'], ['>45', 'accent', 'Momentum surge — enter but tighten stops quickly']]
	},
	'gold-k': { title: 'KDJ — K Line', body: 'Fast KDJ line. K > D = immediate bullish bias for gold. Use for precise entry timing within a valid macro setup.', where: '📍 Charting: KDJ(9,3,3) on XAUUSD' },
	'gold-d': { title: 'KDJ — D Line', body: 'KDJ signal line. K crossing above D = buy timing. D > K = bearish short-term — wait.', where: '📍 Charting: KDJ indicator → D value' },
	'gold-j': {
		title: 'KDJ — J Line',
		body: 'Gold-specific KDJ interpretation: J < 20 = oversold (excellent gold buying opportunity if trend intact). J > 80 = overbought, reduce gold position by 50%. Gold can sustain higher J values in strong bull runs.',
		where: '📍 Charting: KDJ indicator → J value',
		ranges: [['J < 20', 'accent', 'Oversold — best gold buy signal'], ['J 20–75', 'green', 'Optimal zone'], ['J > 75', 'yellow', 'Overbought — reduce'], ['J > 90', 'red', 'Extreme — exit']]
	},
	'gold-dif': { title: 'MACD DIF — Gold', body: 'MACD line for gold. Gold MACD values are much larger than stocks (e.g., 8.50 vs 0.013). DIF > DEA = bullish. DIF > 0 AND DEA > 0 = strong gold bull. Enter values as shown on your MACD indicator.', where: '📍 Charting: MACD(12,26,9) on XAUUSD → MACD/DIF line' },
	'gold-dea': { title: 'MACD DEA — Signal Line', body: 'MACD signal line for gold. DIF must be above DEA. A recent DIF/DEA cross-up = fresh buy signal for gold.', where: '📍 Charting: MACD indicator → Signal line value' },
	'gold-hist': { title: 'MACD Histogram — Gold', body: 'Gold MACD histogram. Growing positive bars = gold momentum accelerating. Typical values are larger than stocks. Shrinking bars = consider taking partial profit.', where: '📍 Charting: MACD indicator → bar chart' },
	'gold-dxy': {
		title: 'DXY — US Dollar Index Value (Optional)',
		body: 'The US Dollar Index measures USD strength against a basket of currencies. Gold has ~80% inverse correlation with DXY. DXY falling = gold bullish tailwind. Enter the current DXY value for reference context.',
		where: '📍 TradingView: DXY or USDX symbol | Fed reserve website'
	},
	'gold-dxy-dir': {
		title: 'DXY Direction — Most Important Gold Context',
		body: '⚡ The single most impactful context for gold trading. DXY falling = dollar weakening = gold gains purchasing power = bullish. DXY rising strongly = major headwind for gold. DXY flat = use technical signals only. Always check DXY before entering gold.',
		where: '📍 Assess DXY trend: is it in a clear downtrend (falling), sideways, or uptrend?',
		ranges: [['📉 DXY Falling', 'green', 'Bullish tailwind for gold'], ['➡️ DXY Flat', 'yellow', 'Neutral — use EMA/RSI/ADX'], ['📈 DXY Rising', 'red', 'Major headwind — avoid longs']]
	},
	'gold-vol': {
		title: 'Gold Volume Ratio',
		body: 'Relative volume for XAUUSD or the gold instrument you\'re trading. Gold breakouts on &gt;1.5× volume are highly significant. Low-volume gold moves often reverse quickly.',
		where: '📍 Calculate: Today\'s volume ÷ 20-day average. Or check Relative Volume indicator.',
		ranges: [['>1.5×', 'green', 'High conviction gold move'], ['1.2–1.5×', 'accent', 'Good'], ['0.8–1.2×', 'yellow', 'Moderate'], ['>0.8×', 'red', 'Weak — wait']]
	},
	'gold-fibh': {
		title: 'Fibonacci — Swing High',
		body: 'The highest price of the most recent clear price swing/rally. Use a swing high that is obvious on your chart — the last major peak before a pullback. On a daily chart, this might be the highest close in the last 20–60 days.',
		where: '📍 Charting: Identify the most recent significant swing high on daily XAUUSD chart'
	},
	'gold-fibl': {
		title: 'Fibonacci — Swing Low',
		body: 'The starting point of the recent price swing — the low before the rally to the swing high. Creates the Fibonacci retracement levels between these two points. The 38.2% and 61.8% levels between this low and the swing high are your key entry zones.',
		where: '📍 Charting: The significant low just before the rally to your swing high'
	},
	'gold-fib-dir': {
		title: 'Fibonacci Mode — Retrace vs Extension',
		body: 'Retrace: Calculates where price might pull back to within the swing (support levels for buying). Extension: Calculates how far price could extend beyond the swing high (profit target levels). Use Retrace mode when waiting for an entry. Use Extension mode to set your TP2 and TP3 price targets.',
		where: '📍 Select based on your trading context: entering on pullback vs. targeting extension'
	},
	'gold-atr': {
		title: 'ATR14 — Gold Daily Range',
		body: 'Gold\'s average daily range. Typically $15–$45 per troy oz depending on volatility. CRITICAL: Gold uses ATR × 1.8 for stops (vs 1.5× for stocks) because gold has wider intraday swings. Entering ATR activates full Trade Plan with gold-specific calculations.',
		where: '📍 Charting: ATR(14) on XAUUSD daily chart → current ATR value'
	},
	'gold-risk-pct': {
		title: 'Risk per Trade % — Gold',
		body: 'For gold, use 0.5%–1.0% maximum due to higher volatility. Gold can move $30–50 in a day against you. The risk calculator will show exact lot size / oz quantity based on this percentage and your ATR stop.',
		where: '📍 Recommended: 0.5% for beginners, 1.0% for experienced traders'
	},
	'gold-account': {
		title: 'Account Size ($) — Gold',
		body: 'Your total account capital for position sizing calculation. Gold trades in troy ounces. At $2,300/oz with 1% risk and $20 ATR stop: ($10,000 × 1%) ÷ ($20 × 1.8) = $100 ÷ $36 ≈ 2.7 oz max position. The calculator does this for you automatically.',
		where: '📍 Your trading account balance in USD'
	},
	'gold-lotsize': {
		title: 'Lot Size (troy oz) — Reference',
		body: 'For reference, enter your planned lot size in troy ounces to verify risk exposure. Standard gold lot = 100 oz. Mini lot = 10 oz. Micro lot = 1 oz. Gold CFD contracts vary by broker. Check your broker specifications.',
		where: '📍 Your broker contract specifications for XAUUSD'
	},
};

/* ══════════════════════════════════════
   TOOLTIP ENGINE
   Smart positioning, avoids viewport overflow
══════════════════════════════════════ */
(function initTooltips() {
	const tip = $('tm-tooltip');
	if (!tip) return;
	let pinned = false;
	const COLOR = { green: 'var(--green)', accent: 'var(--accent)', yellow: 'var(--yellow)', red: 'var(--red)', orange: 'var(--orange)' };

	function showTip(el, data) {
		if (!data) return;
		let html = `<div class="tip-title">${data.title}</div><div class="tip-body">${data.body}</div>`;
		if (data.where) html += `<div class="tip-where">📍 <em>${data.where.replace('📍 ', '')}</em></div>`;
		if (data.ranges && data.ranges.length) {
			html += '<div class="tip-range">';
			data.ranges.forEach(([v, c, lbl]) => {
				html += `<div class="tip-range-row"><span class="tip-range-val" style="color:${COLOR[c] || c}">${v}</span><span style="color:var(--dim)">${lbl}</span></div>`;
			});
			html += '</div>';
		}
		tip.innerHTML = html;
		tip.style.display = 'block';
		el.classList.add('tip-active');
		positionTip(el);
	}

	function hideTip(el, force) {
	    if (pinned && !force) return;
	    tip.style.display = 'none';
	    if (el) el.classList.remove('tip-active');
	    pinned = false;
	  }

	function positionTip(el) {
		const rect = el.getBoundingClientRect();
		const tw = 300;
		const th = tip.offsetHeight || 120;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const pad = 8;

		let left = rect.left;
		let top = rect.bottom + pad;

		// Flip left if overflows right
		if (left + tw > vw - pad) left = rect.right - tw;
		if (left < pad) left = pad;

		// Flip up if overflows bottom
		if (top + th > vh - pad) top = rect.top - th - pad;
		if (top < pad) top = pad;

		tip.style.left = left + 'px';
		tip.style.top = top + 'px';
		tip.style.width = Math.min(tw, vw - pad * 2) + 'px';
	}

	// Attach events to all tracked inputs/selects
	document.addEventListener('DOMContentLoaded', attachAll);
	// Also try immediately (in case DOM is already ready)
	if (document.readyState !== 'loading') attachAll();

	function attachAll() {
		Object.keys(TOOLTIPS).forEach(id => {
			const el = $(id);
			if (!el) return;
			const data = TOOLTIPS[id];

			// Hover
			el.addEventListener('mouseenter', () => showTip(el, data));
			el.addEventListener('mouseleave', () => hideTip(el));

			// Focus (keyboard / tap)
			el.addEventListener('focus', () => showTip(el, data));
			el.addEventListener('blur', () => hideTip(el));

			// Add ⓘ indicator to the label
			const fld = el.closest('.fld');
			if (fld) {
				const lbl = fld.querySelector('label');
				if (lbl && !lbl.querySelector('.tip-indicator')) {
					const indicator = document.createElement('span');
					indicator.className = 'tip-indicator';
					indicator.textContent = 'i';
					indicator.title = '';
					indicator.addEventListener('click', e => { e.stopPropagation(); pinned = !pinned; if (pinned) showTip(el, data); else hideTip(el, true); });
					lbl.appendChild(indicator);
				}
			}
		});
	}

	// Keep tooltip updated on scroll/resize
	document.addEventListener('click', e => { if (!tip.contains(e.target) && !e.target.classList.contains('tip-indicator')) hideTip(null, true); });
	window.addEventListener('scroll', () => { if (document.activeElement && TOOLTIPS[document.activeElement.id]) positionTip(document.activeElement); }, { passive: true });
	window.addEventListener('resize', () => { if (tip.style.display !== 'none') hideTip(null); });
})();

/* ══════════════════════════════════════
   BURSA SESSION ANALYSER
   MYT = UTC+8 (no DST in Malaysia)
══════════════════════════════════════ */
function getBursaSession() {
	const now = new Date();
	const myt = new Date(now.getTime() + 8 * 3600000); // UTC+8
	const h = myt.getUTCHours();
	const m = myt.getUTCMinutes();
	const hm = h * 60 + m;
	const dow = myt.getUTCDay(); // 0=Sun, 6=Sat

	const isWeekend = dow === 0 || dow === 6;
	if (isWeekend) return { label: '🔴 Closed (Weekend)', cls: 'avoid', score: 0, quality: 'Weekend — Closed', emoji: '🔴', open: false };

	// Pre-open: 08:30–09:00 = 510–540
	if (hm >= 510 && hm < 540) return { label: '🟡 Pre-Open', cls: 'slow', score: 30, quality: 'Pre-Open Auction 08:30–09:00', emoji: '🟡', open: false };
	// Morning: 09:00–12:30 = 540–750
	if (hm >= 540 && hm < 750) {
		const prime = hm < 600; // 09:00–10:00 = highest momentum
		return prime
			? { label: '🎯 Morning Prime', cls: 'prime', score: 100, quality: 'Prime Window 09:00–10:00 MYT', emoji: '🎯', open: true }
			: { label: '🟢 Morning', cls: 'good', score: 80, quality: 'Morning Session 09:00–12:30 MYT', emoji: '✅', open: true };
	}
	// Lunch break: 12:30–14:30 = 750–870
	if (hm >= 750 && hm < 870) return { label: '🟡 Lunch Break', cls: 'slow', score: 10, quality: 'Lunch Break 12:30–14:30 — No Trading', emoji: '🟡', open: false };
	// Afternoon: 14:30–17:00 = 870–1020
	if (hm >= 870 && hm < 1020) {
		const prime = hm >= 930 && hm < 990; // 15:30–16:30 = closing pressure
		return prime
			? { label: '🟢 Afternoon Prime', cls: 'good', score: 85, quality: 'Afternoon Prime 15:30–16:30 MYT', emoji: '✅', open: true }
			: { label: '🟢 Afternoon', cls: 'good', score: 72, quality: 'Afternoon Session 14:30–17:00 MYT', emoji: '✅', open: true };
	}
	// Closed
	return { label: '🔴 Closed', cls: 'avoid', score: 0, quality: 'Market Closed (after 17:00 MYT)', emoji: '🔴', open: false };
}

function updateBursaSessionBanner() {
	const sess = getBursaSession();
	const now = new Date();
	const myt = new Date(now.getTime() + 8 * 3600000);
	const hStr = String(myt.getUTCHours()).padStart(2, '0') + ':' + String(myt.getUTCMinutes()).padStart(2, '0') + ' MYT';
	const statusEl = $('bursa-sess-status');
	const timeEl = $('bursa-sess-time');
	if (statusEl) statusEl.textContent = sess.quality;
	if (statusEl) statusEl.style.color = sess.score >= 70 ? 'var(--green)' : sess.score >= 30 ? 'var(--yellow)' : 'var(--red)';
	if (timeEl) timeEl.textContent = hStr;
}
setInterval(() => { if ($('panel-bursa')?.classList.contains('active')) updateBursaSessionBanner(); }, 15000);

/* ══════════════════════════════════════
   BURSA GOLD ETF — 8-FILTER CALCULATOR
   F1: Price > MA5 > MA20 > MA50 (MA Stack)
   F2: MA200 macro alignment (optional)
   F3: NAV Premium ≤ 2% (ETF valuation)
   F4: Bid/Ask Ratio ≥ 0% (order flow)
   F5: Volume Ratio ≥ 1.0 (liquidity)
   F6: KDJ momentum
   F7: MACD confirmation
   F8: Bursa session quality
══════════════════════════════════════ */
function bursaCalc() {
	const price = num('bu-price');
	const ma5 = num('bu-ma5');
	const ma20 = num('bu-ma20');

	if (!price || !ma5 || !ma20) { $('bursa-result').style.display = 'none'; return; }
	$('bursa-result').style.display = '';

	updateBursaSessionBanner();

	// Optional fields
	const ma50 = num('bu-ma50');
	const ma200 = num('bu-ma200');
	const atr = num('bu-atr');
	const nav = num('bu-nav');
	const rsi = num('bu-rsi');
	const adxV = num('bu-adx');
	const k = num('bu-k');
	const d = num('bu-d');
	const j = num('bu-j');
	const dif = num('bu-dif');
	const dea = num('bu-dea');
	const open = num('bu-open');
	const prev = num('bu-prev');
	const high = num('bu-high');
	const low = num('bu-low');
	const volUnits = num('bu-vol-units');
	const volRatio = num('bu-volratio');
	const bidask = num('bu-bidask');
	const premium = num('bu-premium');
	const w52h = num('bu-52h');
	const w52l = num('bu-52l');
	const allh = num('bu-allh');
	const alll = num('bu-alll');
	const lotSize = num('bu-lotsize') || 100;
	const turnover = num('bu-turnover');
	const account = num('bu-account');
	const riskPct = num('bu-riskpct');
	const feePct = num('bu-fee') || 0.10;

	/* ── Distances ── */
	const pAboveMA5 = pct(price, ma5);
	const pAboveMA20 = pct(price, ma20);
	const pAboveMA50 = ma50 ? pct(price, ma50) : null;
	const pAboveMA200 = ma200 ? pct(price, ma200) : null;
	const ma5AboveMA20 = pct(ma5, ma20);
	const ma20AbMA50 = ma50 ? pct(ma20, ma50) : null;

	// Auto-calculate NAV premium if both price and nav available
	const calcPremium = nav ? ((price - nav) / nav * 100) : null;
	const usePremium = calcPremium ?? premium;

	/* ── Daily change ── */
	const dayChg = prev ? ((price - prev) / prev * 100) : null;
	const gapFromOpen = open ? ((price - open) / open * 100) : null;
	const from52h = w52h ? ((price - w52h) / w52h * 100) : null;
	const from52l = w52l ? ((price - w52l) / w52l * 100) : null;
	const fromAllH = allh ? ((price - allh) / allh * 100) : null;
	const fromAllL = alll ? ((price - alll) / alll * 100) : null;

	/* ── Session ── */
	const sess = getBursaSession();
	const sessPass = sess.score >= 70 ? true : sess.score >= 30 ? 'warn' : false;

	/* ── Filter evaluations ── */
	const f1_pass = price > ma5;
	const f2_pass = ma5 > ma20;
	const f3_pass = ma50 ? ma20 > ma50 : null; // optional if ma50 provided
	const f4_mac = ma200 ? price > ma200 : null;

	// NAV Premium filter: ≤2% = pass, 2–3% = warn, >3% = fail
	let navPass = null;
	if (usePremium != null) {
		if (usePremium <= 1.0) navPass = true;
		else if (usePremium <= 2.0) navPass = true;    // acceptable
		else if (usePremium <= 3.0) navPass = 'warn';
		else navPass = false;   // overpriced
	}

	// Bid/Ask: ≥0% = pass, -5 to 0 = warn, <-5 = fail
	let bidaskPass = null;
	if (bidask != null) {
		if (bidask >= 0) bidaskPass = true;
		else if (bidask >= -5) bidaskPass = 'warn';
		else bidaskPass = false;
	}

	// Volume ratio: ≥1.2 = pass, 0.8–1.2 = warn, <0.8 = fail
	const volS = scoreVolume(volRatio);
	const kdj = scoreKDJ(k, d, j);
	const macd = scoreMACDZone(dif, dea);
	const adxS = scoreADX(adxV);
	const rsiS = scoreRSI(rsi, 'gold'); // Gold ETF uses gold RSI thresholds

	/* ── Weighted Score ── */
	const eng = scoreEngine();
	eng.add(f1_pass, 16);  // Price > MA5
	eng.add(f2_pass, 14);  // MA5 > MA20
	eng.add(f3_pass, 10);  // MA20 > MA50
	eng.add(f4_mac, 6);  // Price > MA200
	eng.add(navPass, 18);  // NAV premium (ETF-specific)
	eng.add(bidaskPass, 10);  // Order flow
	eng.add(volS ? volS.pass : null, 8);   // Liquidity
	eng.add(kdj ? kdj.pass : null, 10);   // KDJ
	eng.add(macd ? macd.pass : null, 8);   // MACD
	eng.add(sessPass, 5);  // Session bonus
	eng.add(rsiS ? rsiS.pass : null, 5);   // RSI

	// Stretch penalty for ETF (same as MA strategy)
	let penalty = 0;
	const stretchAbs = Math.abs(pAboveMA20 || 0);
	if (stretchAbs > 10) penalty = -18;
	else if (stretchAbs > 6) penalty = -10;
	else if (stretchAbs > 3) penalty = -5;
	// Additional penalty for high NAV premium
	if (usePremium != null && usePremium > 3) penalty -= 10;
	// Penalty if market is closed
	if (!sess.open && sess.score < 30) penalty -= 8;

	const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));

	/* ── Grade ── */
	const grade = getGrade(ma20AbMA50 ?? 0);

	/* ── Decision ── */
	const maOk = f1_pass && f2_pass;
	const etfOk = navPass !== false;
	const orderOk = bidaskPass !== false;
	const momentumOk = (!kdj || kdj.pass !== false)
		&& (!macd || macd.pass !== false);
	const sessionOk = sess.open; // Must be during Bursa hours for new entry

	let decision, riskLevel, posSize;
	if (!maOk || !etfOk || !momentumOk) {
		decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0 lots';
	} else if (adjScore >= 75) {
		decision = 'PROCEED'; riskLevel = 'Low Risk';
		posSize = (stretchAbs > 4 || !sessionOk) ? '50 lots' : '100 lots';
	} else if (adjScore >= 55) {
		decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50 lots';
	} else {
		decision = 'WATCH'; riskLevel = 'Medium Risk'; posSize = '25 lots';
	}

	/* ── Session Chip ── */
	const chip = $('bursa-sess-chip');
	if (chip) { chip.textContent = `${sess.emoji} ${sess.label}`; chip.style.display = ''; }

	/* ── Decision Strip ── */
	setDecisionStrip('bursa', decision, riskLevel, grade, `
    <div>0828EA: <span style="color:var(--bursa);font-weight:700">MYR ${price.toFixed(3)}</span>
      ${dayChg != null ? `<span style="color:${dayChg >= 0 ? 'var(--green)' : 'var(--red)'};margin-left:.5rem">${dayChg >= 0 ? '+' : ''}${dayChg.toFixed(2)}%</span>` : ''}
      &nbsp; MA5: <span style="color:var(--text)">${fmt(ma5, 3)}</span>
      MA20: <span style="color:var(--text)">${fmt(ma20, 3)}</span>
    </div>
    <div>NAV: <span style="color:var(--text)">${nav ? 'MYR ' + nav.toFixed(3) : '—'}</span>
      &nbsp; Premium: <span style="color:${usePremium != null && usePremium > 3 ? 'var(--red)' : usePremium != null && usePremium > 2 ? 'var(--yellow)' : 'var(--green)'}">${usePremium != null ? usePremium.toFixed(2) + '%' : '—'}</span>
      &nbsp; Size: <span style="color:${posSize.startsWith('100') ? 'var(--green)' : 'var(--yellow)'}">${posSize}</span>
    </div>`
	);

	/* ── Advice ── */
	const adv = $('bursa-advice');
	if (decision === 'PROCEED') {
		const lines = [
			stretchAbs > 4
				? `⚠️ Price is ${stretchAbs.toFixed(1)}% above MA20 — stretched. Consider waiting for a pullback toward MA5 (MYR ${fmt(ma5, 3)}).`
				: `✅ MA stack confirmed. Price within acceptable range of MA20.`,
			usePremium != null
				? (usePremium > 2
					? `⚠️ Trading at ${usePremium.toFixed(2)}% premium to NAV — slightly overpriced. Use limit order near NAV (MYR ${nav?.toFixed(3)}).`
					: `✅ Premium ${usePremium.toFixed(2)}% — reasonable. ETF not significantly overpriced vs gold.`)
				: '',
			!sess.open
				? `⏰ ⚠️ Market currently closed (${sess.quality}). Set limit orders for next session open.`
				: `⏰ ${sess.quality} — good timing for entry.`,
			bidask != null && bidask < 0 ? `⚠️ Bid/Ask ratio ${bidask.toFixed(2)}% (net sellers). Use limit buy order to avoid chasing.` : '',
			volRatio != null && volRatio < 1.0 ? `⚠️ Low volume (${volRatio}×). Use limit orders only — market orders risk wide spread for Gold ETF.` : '',
			`📦 Size: ${posSize}. Always use limit orders on Bursa ETF — never market orders. Set SL at ATR×1.5 below entry.`,
		].filter(Boolean).join('\n');
		adv.textContent = lines;
		adv.className = 'advice-box green';
	} else if (decision === 'WATCH') {
		adv.textContent = `⚠️ Partial setup (Score: ${adjScore.toFixed(0)}/100). Wait for: ${[!f2_pass && 'MA5>MA20 alignment', navPass === 'warn' && 'NAV premium to fall below 2%', !sess.open && 'Bursa market hours (09:00–17:00 MYT)'].filter(Boolean).join(', ') || 'stronger momentum confirmation'}.`;
		adv.className = 'advice-box yellow';
	} else {
		const missing = [
			!f1_pass && 'Price < MA5',
			!f2_pass && 'MA5 < MA20',
			navPass === false && `NAV premium too high (${usePremium?.toFixed(2)}% > 3%)`,
			kdj?.pass === false && 'KDJ Bearish',
			macd?.pass === false && 'MACD Bearish',
		].filter(Boolean);
		adv.textContent = `🔴 Skip Bursa Gold ETF. Critical failures: ${missing.join(' | ')}`;
		adv.className = 'advice-box red';
	}

	/* ── Dial ── */
	const arc = $('bursa-dial-arc');
	const txt = $('bursa-dial-score');
	if (arc && txt) {
		const total = 188;
		const dash = (Math.min(100, Math.max(0, adjScore)) / 100) * total;
		arc.setAttribute('stroke-dasharray', `${dash} ${total}`);
		txt.textContent = Math.round(adjScore);
		const c = adjScore >= 75 ? '#00e87a' : adjScore >= 55 ? '#f5c842' : '#f03a4a';
		txt.setAttribute('fill', c);
	}

	/* ── Pie ── */
	drawPie('bursa-pie', 'bursa-pie-legend', [
		{ label: 'MA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0) + (f4_mac ? 1 : 0), color: 'var(--bursa)' },
		{ label: 'NAV', value: navPass === true ? 1 : navPass === 'warn' ? .5 : 0, color: '#FFD700' },
		{ label: 'Bid/Ask', value: bidaskPass === true ? 1 : bidaskPass === 'warn' ? .5 : 0, color: 'var(--green)' },
		{ label: 'Volume', value: volS ? (volS.pass === true ? 1 : volS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent)' },
		{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
		{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--orange)' },
		{ label: 'Session', value: sessPass === true ? 1 : sessPass === 'warn' ? .5 : 0, color: 'var(--green2)' },
	].filter(s => s.value > 0));

	/* ── Checklist ── */
	const passArr = [f1_pass, f2_pass, f3_pass, f4_mac,
		navPass === true, bidaskPass === true,
		volS?.pass === true, kdj?.pass === true, macd?.pass === true,
	].filter(Boolean);

	$('bursa-checklist').innerHTML = [
		buildCheck('F1 — Price > MA5 (Momentum)', f1_pass, pAboveMA5 != null ? (pAboveMA5 >= 0 ? '+' : '') + pAboveMA5.toFixed(2) + '%' : '—'),
		buildCheck('F2 — MA5 > MA20 (Short Trend)', f2_pass, ma5AboveMA20 != null ? (ma5AboveMA20 >= 0 ? '+' : '') + ma5AboveMA20.toFixed(2) + '%' : '—'),
		ma50
			? buildCheck('F3 — MA20 > MA50 (Med Trend)', f3_pass, ma20AbMA50 != null ? (ma20AbMA50 >= 0 ? '+' : '') + ma20AbMA50.toFixed(2) + '%' : '—')
			: buildCheck('F3 — MA50 (Med Trend)', null, 'Not provided'),
		ma200
			? buildCheck('F4 — Price > MA200 (Macro)', f4_mac, pAboveMA200 != null ? (pAboveMA200 >= 0 ? '+' : '') + pAboveMA200.toFixed(2) + '%' : '—')
			: buildCheck('F4 — MA200 (Macro)', null, 'Not provided'),
		navPass != null
			? buildCheck(`F5 — NAV Premium ${usePremium?.toFixed(2)}%`, navPass === true ? true : navPass === false ? false : null,
				`${usePremium?.toFixed(2)}% ${usePremium <= 1 ? '🎯 Ideal' : usePremium <= 2 ? '✅ OK' : usePremium <= 3 ? '⚠️ High' : '🔴 Skip'}`)
			: buildCheck('F5 — NAV Premium', null, 'Enter Price + NAV'),
		bidaskPass != null
			? buildCheck(`F6 — Bid/Ask Ratio ${bidask?.toFixed(2)}%`, bidaskPass === true ? true : bidaskPass === false ? false : null,
				`${bidask?.toFixed(2)}% ${bidask >= 0 ? '✅ Net buyers' : '⚠️ Sellers'}`)
			: buildCheck('F6 — Bid/Ask Ratio', null, 'Not provided'),
		volS
			? buildCheck(`F7 — Volume ${volS.zone}`, volS.pass === true ? true : volS.pass === false ? false : null, `${volRatio}× avg ${volRatio >= 1.2 ? '✅' : '⚠️'}`)
			: buildCheck('F7 — Volume Ratio', null, 'Not provided'),
		kdj
			? buildCheck(`KDJ — ${kdj.zone}`, kdj.pass === true ? true : kdj.pass === false ? false : null, `K${k?.toFixed(1)} D${d?.toFixed(1)} J${j?.toFixed(1)}`)
			: buildCheck('KDJ Oscillator', null, 'Not provided'),
		macd
			? buildCheck(`MACD — ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif?.toFixed(3)} DEA:${dea?.toFixed(3)}`)
			: buildCheck('MACD Signal', null, 'Not provided'),
		buildCheck(`Session — ${sess.label}`, sessPass === true ? true : sessPass === false ? false : null, `${sess.emoji} Score:${sess.score}/100`),
	].join('');

	updateMeter('bursa-signal-meter', passArr.length, 8);

	/* ── Ticker Strip ── */
	const tickCells = [];
	if (prev != null) tickCells.push(['Daily Chg', `${dayChg >= 0 ? '+' : ''}${dayChg?.toFixed(2)}%`, dayChg >= 0 ? 'var(--green)' : 'var(--red)', '']);
	if (open != null) tickCells.push(['vs Open', `${gapFromOpen >= 0 ? '+' : ''}${gapFromOpen?.toFixed(2)}%`, gapFromOpen >= 0 ? 'var(--green)' : 'var(--red)', '']);
	if (high != null) tickCells.push(['Day High', `MYR ${high.toFixed(3)}`, 'var(--green)', '']);
	if (low != null) tickCells.push(['Day Low', `MYR ${low.toFixed(3)}`, 'var(--red)', '']);
	if (w52h != null) tickCells.push(['52wk High', `MYR ${w52h.toFixed(3)}`, 'var(--dim)', from52h != null ? `${from52h.toFixed(1)}% away` : '']);
	if (w52l != null) tickCells.push(['52wk Low', `MYR ${w52l.toFixed(3)}`, 'var(--dim)', from52l != null ? `+${from52l.toFixed(1)}% up` : '']);
	if (volUnits != null) tickCells.push(['Volume', volUnits >= 1e6 ? `${(volUnits / 1e6).toFixed(2)}M` : `${(volUnits / 1000).toFixed(1)}K`, 'var(--accent)', 'units traded']);
	if (turnover != null) tickCells.push(['% Turnover', `${turnover.toFixed(2)}%`, 'var(--dim)', '']);

	$('bursa-ticker').innerHTML = tickCells.map(([l, v, c, s]) =>
		`<div class="bursa-tick-cell">
      <div class="bursa-tick-label">${l}</div>
      <div class="bursa-tick-val" style="color:${c}">${v}</div>
      ${s ? `<div class="bursa-tick-sub">${s}</div>` : ''}
    </div>`
	).join('');

	/* ── NAV Valuation Grid ── */
	const navCard = $('bursa-nav-card');
	navCard.style.display = nav ? '' : 'none';
	if (nav) {
		const navCells = [
			{ l: 'NAV', v: `MYR ${nav.toFixed(3)}`, c: 'accent', s: 'Net Asset Value' },
			{ l: 'Market Price', v: `MYR ${price.toFixed(3)}`, c: 'text', s: 'Current trading price' },
			{
				l: 'Premium', v: usePremium != null ? `${usePremium.toFixed(2)}%` : '—',
				c: usePremium <= 1 ? 'green' : usePremium <= 2 ? 'accent' : usePremium <= 3 ? 'yellow' : 'red',
				s: usePremium <= 1 ? 'At/below NAV — ideal' : usePremium <= 2 ? 'Acceptable' : usePremium <= 3 ? 'High — reduce size' : 'Overpriced — skip'
			},
			{
				l: 'Bid/Ask', v: bidask != null ? `${bidask.toFixed(2)}%` : '—',
				c: bidask >= 0 ? 'green' : bidask >= -5 ? 'yellow' : 'red',
				s: bidask >= 0 ? 'Net buyers' : 'Net sellers'
			},
			{
				l: 'Vol Ratio', v: volRatio != null ? `${volRatio}×` : '—',
				c: volRatio >= 1.5 ? 'green' : volRatio >= 1.0 ? 'accent' : 'yellow', s: 'vs 30-day avg'
			},
		];
		if (allh) navCells.push({ l: 'All-Time High', v: `MYR ${allh.toFixed(3)}`, c: fromAllH != null && fromAllH >= -5 ? 'green' : 'dim', s: fromAllH != null ? `${fromAllH.toFixed(1)}% from ATH` : '' });
		if (alll) navCells.push({ l: 'All-Time Low', v: `MYR ${alll.toFixed(3)}`, c: 'dim', s: fromAllL != null ? `+${fromAllL.toFixed(1)}% recovery` : '' });

		$('bursa-nav-grid').innerHTML = navCells.map(({ l, v, c, s }) =>
			`<div class="stat-cell">
        <div class="stat-label">${l}</div>
        <div class="stat-value ${c}">${v}</div>
        ${s ? `<div class="stat-sub">${s}</div>` : ''}
      </div>`
		).join('');

		// Premium bar: map from -3% to +5% → 0–100%
		const premPct = Math.min(100, Math.max(0, ((usePremium ?? 0) + 3) / 8 * 100));
		const premFill = $('bursa-prem-fill');
		const premMark = $('bursa-prem-marker');
		const premLabel = $('bursa-prem-label');
		if (premFill) premFill.style.width = premPct + '%';
		if (premMark) premMark.style.left = premPct + '%';
		if (premLabel) premLabel.textContent = usePremium != null ? `${usePremium.toFixed(2)}% Premium` : '—';

		// NAV advice
		const navAdvEl = $('bursa-nav-advice');
		if (navAdvEl) {
			if (usePremium <= 0) navAdvEl.textContent = `🎯 Trading BELOW NAV by ${Math.abs(usePremium).toFixed(2)}% — rare and excellent opportunity. Gold ETF at a discount to fair value.`;
			else if (usePremium <= 1.5) navAdvEl.textContent = `✅ Premium ${usePremium.toFixed(2)}% — within acceptable range. ETF fairly priced vs underlying gold.`;
			else if (usePremium <= 3.0) navAdvEl.textContent = `⚠️ Premium ${usePremium.toFixed(2)}% — paying above fair value. Consider using limit order closer to NAV (MYR ${nav.toFixed(3)}). Reduce position size by 50%.`;
			else navAdvEl.textContent = `🔴 Premium ${usePremium.toFixed(2)}% — significantly overpriced vs NAV. Wait for premium to compress below 2% before entering. ETF demand has pushed price far above underlying gold value.`;
		}
	}

	/* ── MA Alignment Grid ── */
	const alignRows = [
		['Price vs MA5', pAboveMA5, pAboveMA5 >= 0 && pAboveMA5 <= 2 ? 'green' : pAboveMA5 > 8 ? 'red' : pAboveMA5 > 4 ? 'yellow' : 'accent'],
		['Price vs MA20', pAboveMA20, pAboveMA20 >= 0 && pAboveMA20 <= 2 ? 'green' : pAboveMA20 > 8 ? 'red' : pAboveMA20 > 4 ? 'yellow' : 'accent'],
		['MA5 vs MA20', ma5AboveMA20, ma5AboveMA20 > 0 ? 'green' : 'red'],
	];
	if (ma50) alignRows.push(['Price vs MA50', pAboveMA50, pAboveMA50 >= 0 ? 'green' : 'red']);
	if (ma50) alignRows.push(['MA20 vs MA50', ma20AbMA50, ma20AbMA50 != null && ma20AbMA50 > 0 ? 'green' : 'red']);
	if (ma200) alignRows.push(['Price vs MA200', pAboveMA200, pAboveMA200 >= 0 ? 'green' : 'red']);
	if (prev) alignRows.push(['Daily Change', dayChg, dayChg >= 0 ? 'green' : 'red']);

	$('bursa-align-grid').innerHTML = alignRows.map(([l, v, c]) =>
		`<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—'}</div></div>`
	).join('');

	const maStretch = Math.abs(pAboveMA20 ?? 0);
	const maFill = $('bursa-ma-fill');
	const maMark = $('bursa-ma-marker');
	const maLabel = $('bursa-ma-label');
	const maPct = Math.min(100, Math.max(0, (maStretch / 12) * 100));
	if (maFill) maFill.style.width = maPct + '%';
	if (maMark) maMark.style.left = maPct + '%';
	if (maLabel) maLabel.textContent = `${maStretch.toFixed(2)}%`;

	// Day range bar
	const drSec = $('bursa-dayrange-section');
	if (high != null && low != null && high > low) {
		drSec.style.display = '';
		const drPct = ((price - low) / (high - low)) * 100;
		const fill = $('bursa-day-fill');
		const mark = $('bursa-day-marker');
		if (fill) fill.style.width = Math.min(100, Math.max(0, drPct)) + '%';
		if (mark) mark.style.left = Math.min(100, Math.max(0, drPct)) + '%';
		$('bursa-day-low').textContent = `Low MYR ${low.toFixed(3)}`;
		$('bursa-day-high').textContent = `High MYR ${high.toFixed(3)}`;
		$('bursa-day-pct').textContent = `${drPct.toFixed(1)}% of range`;
	} else {
		drSec.style.display = 'none';
	}

	/* ── Session Grid ── */
	const sessData = [
		{ name: 'Pre-Open Auction', time: '08:30–09:00', note: 'Set limit orders only', q: '30', active: sess.score === 30 },
		{ name: 'Morning Prime', time: '09:00–10:00', note: 'Highest momentum window', q: '100', active: sess.score === 100 },
		{ name: 'Morning Session', time: '10:00–12:30', note: 'Good volume continues', q: '80', active: sess.score === 80 },
		{ name: 'Lunch Break', time: '12:30–14:30', note: 'No trading — market paused', q: '0', active: sess.score === 10 },
		{ name: 'Afternoon Prime', time: '15:30–16:30', note: 'Closing pressure window', q: '85', active: sess.score === 85 },
		{ name: 'Afternoon', time: '14:30–17:00', note: 'Steady volume, watch close', q: '72', active: sess.score === 72 },
		{ name: 'Closed', time: '17:00–08:30', note: 'No trading', q: '0', active: sess.score === 0 },
	];

	$('bursa-session-grid').innerHTML = sessData.map(s =>
		`<div class="session-cell${s.active ? ' active-sess' : ''}">
      <div class="session-name">${s.name}</div>
      <div class="session-time">${s.time} MYT</div>
      <div class="session-quality" style="color:${s.active ? '#cc0001' : 'var(--muted)'}">${s.active ? '▶ NOW' : '–'}</div>
      <div style="font-size:9px;color:var(--muted);margin-top:.1rem">${s.note}</div>
    </div>`
	).join('');

	const sessFill = $('bursa-sess-fill');
	const sessMark = $('bursa-sess-marker');
	const sessLabel = $('bursa-sess-label');
	if (sessFill) sessFill.style.width = sess.score + '%';
	if (sessMark) sessMark.style.left = sess.score + '%';
	if (sessLabel) sessLabel.textContent = `${sess.score}/100 — ${sess.quality}`;

	/* ── Trade Plan (MYR) ── */
	const tpCard = $('bursa-tradeplan-card');
	const tpBox = $('bursa-price-block');
	const kellyEl = $('bursa-kelly-block');

	if (atr && tpCard && tpBox) {
		tpCard.style.display = '';
		const sl = price - atr * 1.5;
		const tp1 = price + atr * 1.5;
		const tp2 = price + atr * 3.0;
		const tp3 = price + atr * 5.0;
		const risk = price - sl;
		const rr1 = (tp1 - price) / risk;
		const rr2 = (tp2 - price) / risk;
		const rr3 = (tp3 - price) / risk;
		const dp = 3;

		tpBox.innerHTML = `
      <div class="prow entry">
        <span class="prow-label">Ideal Entry</span>
        <span class="prow-val accent">MYR ${price.toFixed(dp)}</span>
        <span class="prow-note">Use <strong>LIMIT ORDER</strong> — never market order for ETF</span>
      </div>
      <div class="prow sl">
        <span class="prow-label">Stop Loss (ATR×1.5)</span>
        <span class="prow-val red">MYR ${sl.toFixed(dp)}</span>
        <span class="prow-note">Risk per lot: MYR ${(risk * lotSize).toFixed(2)} (${lotSize} units/lot)</span>
      </div>
      <div class="prow tp1">
        <span class="prow-label">TP1 — 40% Position</span>
        <span class="prow-val green">MYR ${tp1.toFixed(dp)}</span>
        <span class="prow-note">R:R 1:${rr1.toFixed(1)} — move SL to breakeven</span>
      </div>
      <div class="prow tp2">
        <span class="prow-label">TP2 — 40% Position</span>
        <span class="prow-val g2">MYR ${tp2.toFixed(dp)}</span>
        <span class="prow-note">R:R 1:${rr2.toFixed(1)}</span>
      </div>
      <div class="prow tp3">
        <span class="prow-label">TP3 — 20% Position</span>
        <span class="prow-val g3">MYR ${tp3.toFixed(dp)}</span>
        <span class="prow-note">R:R 1:${rr3.toFixed(1)} — trail or hold</span>
      </div>`;

		// Kelly / position sizing in MYR
		if (account && riskPct && kellyEl) {
			kellyEl.style.display = '';
			const riskAmt = account * (riskPct / 100);
			const riskPerLot = risk * lotSize;
			const feeCost = price * lotSize * (feePct / 100);
			const maxLots = riskPerLot > 0 ? Math.floor((riskAmt - feeCost * 2) / riskPerLot) : 0;
			const posVal = maxLots * lotSize * price;

			kellyEl.innerHTML = `
        <div class="kelly-block">
          <div class="kelly-title">⚖️ Bursa ETF Position Sizing (MYR)</div>
          <div class="kelly-row"><span class="kelly-label">Account Size</span><span class="kelly-val">MYR ${account.toLocaleString()}</span></div>
          <div class="kelly-row"><span class="kelly-label">Risk per Trade (${riskPct}%)</span><span class="kelly-val" style="color:var(--red)">MYR ${riskAmt.toFixed(2)}</span></div>
          <div class="kelly-row"><span class="kelly-label">Risk per Lot (${lotSize} units × MYR ${risk.toFixed(3)})</span><span class="kelly-val">MYR ${riskPerLot.toFixed(2)}</span></div>
          <div class="kelly-row"><span class="kelly-label">Estimated Brokerage (in+out ${feePct}%)</span><span class="kelly-val">MYR ${(feeCost * 2).toFixed(2)}</span></div>
          <div class="kelly-row"><span class="kelly-label">Max Lots to Buy</span><span class="kelly-val green">${maxLots} lots (${(maxLots * lotSize).toLocaleString()} units)</span></div>
          <div class="kelly-row"><span class="kelly-label">Total Position Value</span><span class="kelly-val">MYR ${posVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
          <div class="kelly-row" style="margin-top:.25rem;padding-top:.25rem;border-top:1px solid var(--border)">
            <span class="kelly-label" style="color:var(--muted);font-size:9.5px">💡 Bursa tip: Minimum 1 lot = ${lotSize} units. Always use limit orders to control fill price and reduce spread cost.</span>
          </div>
        </div>`;
		} else if (kellyEl) {
			kellyEl.style.display = 'none';
		}
	} else if (tpCard) {
		tpCard.style.display = 'none';
	}
}

function resetBursa() {
	['bu-price', 'bu-open', 'bu-prev', 'bu-high', 'bu-low', 'bu-vol-units',
		'bu-52h', 'bu-52l', 'bu-allh', 'bu-alll',
		'bu-nav', 'bu-premium', 'bu-bidask', 'bu-volratio', 'bu-turnover', 'bu-lotsize',
		'bu-ma5', 'bu-ma20', 'bu-ma50', 'bu-ma200', 'bu-atr',
		'bu-rsi', 'bu-adx', 'bu-k', 'bu-d', 'bu-j',
		'bu-dif', 'bu-dea', 'bu-hist',
		'bu-account', 'bu-riskpct', 'bu-fee',
	].forEach(id => { const el = $(id); if (el) el.value = ''; });
	$('bursa-result').style.display = 'none';
}

/* ── Bursa Tooltips ── */
Object.assign(TOOLTIPS, {
	'bu-price': { title: 'Market Price (MYR)', body: 'Current live price of 0828EA/0829EA on Bursa Malaysia. Read directly from your trading app quote screen. The screenshot shows MYR 5.780.', where: '📍 Trading app: Quote screen → Last Price', ranges: [['< MA5', 'red', 'Below momentum line'], ['MA5 level', 'green', 'Best entry zone'], ['> MA20 + 5%', 'yellow', 'Stretched — wait']] },
	'bu-open': { title: 'Opening Price Today', body: 'The price at which the ETF opened this morning (09:00 MYT). Compare to current price — gap up = bullish morning momentum, gap down = weakness.', where: '📍 Trading app: Quote screen → Open' },
	'bu-prev': { title: 'Previous Close', body: 'Yesterday\'s official closing price. Used to calculate today\'s % change. If today\'s price is below prev close AND below MA5, momentum is negative — do not enter.', where: '📍 Trading app: Quote screen → Prev Close' },
	'bu-high': { title: 'Day High', body: 'Highest price traded today. Combined with Day Low, shows the intraday trading range. Buying near day high in a strong trend = momentum. Buying at day high in a weak trend = chasing.', where: '📍 Trading app: Quote screen → High' },
	'bu-low': { title: 'Day Low', body: 'Lowest price today. If Day Low is below MA5 but price has recovered — potential bounce. The Day Range bar shows where current price sits between high and low.', where: '📍 Trading app: Quote screen → Low' },
	'bu-vol-units': { title: 'Volume (Units Traded)', body: 'Total units of the Gold ETF traded today. Raw units — e.g., 104,200 from the screenshot. Used to gauge institutional activity. High volume on up days = institutional buying.', where: '📍 Trading app: Quote screen → Volume (e.g. 104.2K = enter 104200)' },
	'bu-52h': { title: '52-Week High', body: 'Highest price in the past year. ETF within 5% of 52-week high + strong MA stack = potential breakout. More than 20% below 52-week high = in a long-term correction.', where: '📍 Trading app: Stock details / statistics panel → 52wk High' },
	'bu-52l': { title: '52-Week Low', body: 'Lowest price in the past year. Large recovery from 52-week low + bullish MA stack = strong uptrend recovery. % above 52-week low shows the strength of the current bull run.', where: '📍 Trading app: Stock details / statistics panel → 52wk Low' },
	'bu-allh': { title: 'Historical All-Time High', body: 'The highest price 0828EA has ever traded. From the screenshot: MYR 6.700. Being within 10% of all-time high = near resistance. Breaking above ATH = very bullish (no overhead supply).', where: '📍 Trading app: Historical High field' },
	'bu-alll': { title: 'Historical All-Time Low', body: 'The lowest price ever. From the screenshot: MYR 2.700. The distance from all-time low shows total appreciation. Gold ETF\'s long-term trend is upward (gold tends to rise long-term).', where: '📍 Trading app: Historical Low field' },
	'bu-nav': { title: 'NAV — Net Asset Value', body: '⭐ CRITICAL for ETF trading. NAV is the true underlying value of the ETF per unit based on current gold price converted to MYR. The screenshot shows NAV = MYR 5.635. Always compare price to NAV before buying.', where: '📍 Trading app: Stats panel → NAV', ranges: [['Price < NAV', 'green', 'Discount — excellent'], ['Price = NAV ± 1%', 'accent', 'Fair value — good buy'], ['Price > NAV + 2%', 'yellow', 'Premium — use caution'], ['Price > NAV + 3%', 'red', 'Overpriced — skip']] },
	'bu-premium': { title: 'Premium / Discount to NAV %', body: 'How much you\'re paying above (premium) or below (discount) the true gold value. The calculator auto-computes this from Price and NAV. Screenshot shows 2.57% premium. Ideal: buy at 0–1% premium or a discount.', where: '📍 Trading app: Stats panel → Premium (or auto-calculated if you enter both Price and NAV)', ranges: [['Negative', 'green', 'Discount to NAV — rare opportunity'], ['0–1%', 'accent', 'Fair value'], ['1–2%', 'yellow', 'Slight premium'], ['> 3%', 'red', 'Overpriced vs gold']] },
	'bu-bidask': { title: 'Bid/Ask Ratio %', body: 'Net buying or selling pressure in the order book. Positive = more buyers queued than sellers. Negative = more sellers. Screenshot shows –6.65% = sellers dominating. Use limit orders when Bid/Ask is negative to avoid buying into sell pressure.', where: '📍 Trading app: Stats panel → Bid/Ask Ratio', ranges: [['> +5%', 'green', 'Strong buyers — momentum'], ['0 to +5%', 'accent', 'Net buyers'], ['–5% to 0', 'yellow', 'Slight sellers'], ['< –5%', 'red', 'Sellers dominant — use limit orders']] },
	'bu-volratio': { title: 'Volume Ratio', body: 'Today\'s volume compared to the 30-day average. Screenshot shows 5.06× = today\'s volume is 5× normal. Very high volume. For ETFs, this signals institutional accumulation. But on a DOWN day with high volume = distribution (selling).', where: '📍 Trading app: Stats panel → Volume Ratio', ranges: [['> 2.0×', 'green', 'Institutional activity'], ['1.2–2.0×', 'accent', 'Above average — good'], ['0.8–1.2×', 'yellow', 'Normal'], ['< 0.8×', 'red', 'Thin — risk wide spread']] },
	'bu-turnover': { title: '% Turnover', body: 'Percentage of total issued units traded today. Low % turnover (e.g. 0.00%) = very illiquid. A higher % turnover indicates active trading. For Gold ETF, even 0.5% turnover means the market is active enough.', where: '📍 Trading app: Stats panel → % Turnover' },
	'bu-lotsize': { title: 'Lot Size', body: 'Minimum trading unit on Bursa. 0828EA has Lot Size = 100 units. This means you must buy in multiples of 100 units. The trade plan uses this to calculate cost per lot: 100 units × MYR price = 1 lot value.', where: '📍 Trading app: Stats panel → Lot Size (typically 100 for ETFs)' },
	'bu-ma5': { title: 'MA5 — 5-Period MA (Fast Momentum)', body: '5-day moving average of 0828EA closing price from your charting app. Price must be above MA5 as the first momentum check. If price closes below MA5 on high volume = immediate exit signal.', where: '📍 Charting: Add MA(5) to 0828EA daily chart → read current line value' },
	'bu-ma20': { title: 'MA20 — 20-Period MA (Core Trend)', body: 'The most important MA for Bursa ETF. The stretch between price and MA20 determines position size: 0–2% = full, 2–5% = half, >5% = wait for pullback. MA20 > MA50 confirms medium-term bull trend.', where: '📍 Charting: Add MA(20) to 0828EA daily chart', ranges: [['0–2% above', 'green', 'Ideal entry zone'], ['2–5% above', 'accent', 'Acceptable'], ['5–8% above', 'yellow', 'Stretched — reduce size'], ['>8% above', 'red', 'Overextended — wait']] },
	'bu-ma50': { title: 'MA50 — 50-Period MA (Medium Trend)', body: '50-day average. MA20 must be above MA50 to confirm a healthy uptrend. MA50 also acts as key support in bull trends. A pullback to MA50 + bounce = strong entry signal for Gold ETF.', where: '📍 Charting: Add MA(50) to 0828EA daily chart' },
	'bu-ma200': { title: 'MA200 — 200-Period MA (Macro Trend)', body: 'The institutional trend line. Gold ETF above MA200 = fundamental bull market in gold (MYR terms). Never buy Gold ETF that is below MA200 — it means gold in MYR is in a bear market. This is an optional but powerful filter.', where: '📍 Charting: Add MA(200) to 0828EA daily chart' },
	'bu-atr': { title: 'ATR14 — Average True Range (MYR)', body: 'Average daily price range of 0828EA over 14 days. For Gold ETF, ATR is typically MYR 0.05–0.15 per unit. Stop Loss = Entry − (ATR × 1.5). The trade plan auto-calculates all targets once you enter ATR.', where: '📍 Charting: Add ATR(14) to 0828EA chart → read current value (e.g. 0.085 MYR)' },
	'bu-rsi': { title: 'RSI14 — Momentum Oscillator', body: 'Same as Gold XAUUSD: ideal RSI for Gold ETF is 50–70. Below 50 = momentum not confirmed. Above 75 = overbought, reduce size. The 50 line is critical — confirms bull vs bear momentum.', where: '📍 Charting: Add RSI(14) to 0828EA chart' },
	'bu-adx': { title: 'ADX14 — Trend Strength', body: 'ADX confirms whether the MA signals are in a real trend. ADX > 25 = confirmed directional move. Below 20 = ranging market — MA signals unreliable. For ETF, require ADX > 22 at minimum.', where: '📍 Charting: Add ADX(14) to 0828EA chart' },
	'bu-k': { title: 'KDJ — K Line', body: 'Fast KDJ stochastic. K > D = short-term bullish. For Gold ETF, use KDJ to time your limit order entry within an otherwise valid setup. K crossing above D from below = ideal timing.', where: '📍 Charting: Add KDJ(9,3,3) to 0828EA chart' },
	'bu-d': { title: 'KDJ — D Line', body: 'Slow KDJ signal line. K must be above D. Used as confirmation that the fast line is trending up. In Gold ETF, a KDJ crossover on a day when price is near MA20 = ideal entry.', where: '📍 Charting: KDJ indicator → D value' },
	'bu-j': { title: 'KDJ — J Line', body: 'Sensitivity line: J = 3K − 2D. J < 20 = oversold bounce potential in Gold ETF. J > 80 = reduce position by 50%. Gold ETF J-values move similarly to XAUUSD — apply same rules.', where: '📍 Charting: KDJ indicator → J value' },
	'bu-dif': { title: 'MACD DIF — Fast Line', body: 'MACD line for 0828EA. Gold ETF MACD values are small (e.g. 0.045). DIF > DEA = bullish confirmation. DIF just crossed above DEA = fresh buy signal.', where: '📍 Charting: MACD(12,26,9) on 0828EA → DIF/MACD line value' },
	'bu-dea': { title: 'MACD DEA — Signal Line', body: 'MACD signal line. DIF must be above DEA for bullish reading. DIF/DEA gap shows momentum strength. Narrowing gap = momentum fading, tighten stop.', where: '📍 Charting: MACD indicator → Signal/DEA line value' },
	'bu-hist': { title: 'MACD Histogram', body: 'DIF − DEA bar chart. Expanding positive bars = accelerating Gold ETF momentum. First positive bar = early buy signal. Shrinking bars = consider partial profit taking.', where: '📍 Charting: MACD indicator → bar histogram' },
	'bu-account': { title: 'Account Size (MYR)', body: 'Your total trading capital in Ringgit. Used to calculate maximum lot size within your risk limit. For Bursa, include brokerage fees in your calculation — the calculator accounts for this.', where: '📍 Your Bursa trading account balance in MYR' },
	'bu-riskpct': { title: 'Risk per Trade %', body: 'Maximum % of account to risk. For Bursa ETFs: 0.5–1% recommended. 1 lot = 100 units, so smaller account sizes should use minimum 0.5% risk. Formula: Risk Amount ÷ (ATR×1.5×100) = max lots.', where: '📍 Recommended: 0.5% (beginners) or 1.0% (experienced)' },
	'bu-fee': { title: 'Brokerage Fee %', body: 'Bursa brokerage commission. Typically 0.10%–0.42% + fees (stamp duty, clearing fee). Online brokers (mplus, CIMB Clicks): ~0.10%. Traditional: ~0.42%. Minimum charge may apply. Enter total % per transaction.', where: '📍 Check your broker\'s fee schedule. Common: 0.10% for online, 0.42% for traditional', ranges: [['0.08–0.12%', 'green', 'Low-cost online broker'], ['0.15–0.25%', 'yellow', 'Mid-tier'], ['0.42%+', 'red', 'Traditional — negotiate or switch']] },
});
/* ══════════════════════════════════════
   SWING REVERSAL SCANNER
   V-Bottom / Trend Reversal Detection
   7 Signals: Candle Pattern, Supertrend Flip,
   KDJ Oversold, RSI Bounce, MACD Divergence,
   Volume Spike, MA Rebuild Progress
══════════════════════════════════════ */

/* Candle pattern detection from OHLC */
function detectCandlePattern(o, h, l, c) {
	if (!o || !h || !l || !c) return null;
	const body     = Math.abs(c - o);
	const range    = h - l;
	const upperWick = h - Math.max(o, c);
	const lowerWick = Math.min(o, c) - l;
	const bodyRatio = body / range;
	const isGreen   = c > o;

	// Hammer: lower wick ≥ 2× body, small upper wick, ideally green
	if (lowerWick >= body * 2 && upperWick <= body * 0.5 && range > 0) {
		const strength = lowerWick / range;
		return { pattern:'Hammer', strength: Math.round(strength * 100),
			bullish:true, color:'var(--green)',
			note:`Lower wick ${(lowerWick/range*100).toFixed(0)}% of range — sellers rejected. ${isGreen?'Green body confirms buyers.':'Wait for next green candle.'}` };
	}
	// Engulfing: large body (>60% of range), green
	if (isGreen && bodyRatio >= 0.6) {
		return { pattern:'Bullish Engulfing', strength: Math.round(bodyRatio * 100),
			bullish:true, color:'var(--green)',
			note:`Body is ${(bodyRatio*100).toFixed(0)}% of range — strong buyer candle. High reversal conviction.` };
	}
	// Doji: very small body (< 10% of range)
	if (bodyRatio < 0.1 && range > 0) {
		return { pattern:'Doji / Indecision', strength: 50,
			bullish:null, color:'var(--yellow)',
			note:'Open ≈ Close — indecision. Needs confirmation from next candle direction.' };
	}
	// Dragonfly Doji: tiny body at top, long lower wick
	if (bodyRatio < 0.15 && lowerWick >= range * 0.6) {
		return { pattern:'Dragonfly Doji', strength: 75,
			bullish:true, color:'var(--accent)',
			note:'Long lower wick with tiny body at high — strong bullish reversal signal.' };
	}
	// Shooting star (bearish warning)
	if (upperWick >= body * 2 && lowerWick <= body * 0.3 && range > 0) {
		return { pattern:'Shooting Star ⚠️', strength: Math.round(upperWick/range*100),
			bullish:false, color:'var(--red)',
			note:'Upper wick rejection — bearish. Not a good long entry candle.' };
	}
	// Generic green/red candle
	return { pattern: isGreen ? 'Green Candle' : 'Red Candle', strength: Math.round(bodyRatio * 60),
		bullish: isGreen ? true : false, color: isGreen ? 'var(--accent)' : 'var(--red)',
		note: isGreen ? 'Bullish close — moderate reversal signal.' : 'Bearish — wait for next candle.' };
}

/* MA Rebuild Phase Assessment */
function maRebuildPhase(price, ma5, ma20, ma50, ma200) {
	const checks = [
		{ label:'Price > MA5',   pass: price && ma5   ? price > ma5   : null, weight:25 },
		{ label:'MA5 > MA20',    pass: ma5   && ma20  ? ma5   > ma20  : null, weight:25 },
		{ label:'MA20 > MA50',   pass: ma20  && ma50  ? ma20  > ma50  : null, weight:25 },
		{ label:'Price > MA200', pass: price && ma200 ? price > ma200 : null, weight:25 },
	];
	const passed  = checks.filter(c => c.pass === true).length;
	const total   = checks.filter(c => c.pass !== null).length;
	const score   = total > 0 ? (passed / total) * 100 : 0;
	let phase;
	if (passed === 0)      phase = { label:'Broken — Full Bear Stack',   color:'var(--red)',    n:0 };
	else if (passed === 1) phase = { label:'Phase 1 — Price crossed MA5', color:'var(--orange)', n:1 };
	else if (passed === 2) phase = { label:'Phase 2 — MA5 > MA20 Cross',  color:'var(--yellow)', n:2 };
	else if (passed === 3) phase = { label:'Phase 3 — MA20 > MA50',       color:'var(--accent)', n:3 };
	else                   phase = { label:'Phase 4 — Full Bull Stack ✅', color:'var(--green)',  n:4 };
	return { checks, passed, total, score, phase };
}

function swingCalc() {
	const o     = num('sw-open');
	const h     = num('sw-high');
	const l     = num('sw-low');
	const c     = num('sw-close');

	if (!o || !h || !l || !c) { $('swing-result').style.display = 'none'; return; }
	$('swing-result').style.display = '';

	const prevClose = num('sw-prev-close');
	const price     = num('sw-price') || c;
	const stPrev    = num('sw-st-prev');
	const stCurr    = num('sw-st-curr');
	const stDir     = document.getElementById('sw-st-dir')?.value || '';
	const maPrice   = num('sw-ma-price') || price;
	const ma5       = num('sw-ma5');
	const ma20      = num('sw-ma20');
	const ma50      = num('sw-ma50');
	const ma200     = num('sw-ma200');
	const res1      = num('sw-res1');
	const res2      = num('sw-res2');
	const res3      = num('sw-res3');
	const kVal      = num('sw-k');
	const dVal      = num('sw-d');
	const jVal      = num('sw-j');
	const rsi       = num('sw-rsi');
	const dif       = num('sw-dif');
	const dea       = num('sw-dea');
	const vol       = num('sw-vol');
	const adxV      = num('sw-adx');
	const atr       = num('sw-atr');
	const account   = num('sw-account');
	const riskPct   = num('sw-riskpct');

	/* ── S1: Candle Pattern ── */
	const candle    = detectCandlePattern(o, h, l, c);
	const s1_pass   = candle ? (candle.bullish === true ? true : candle.bullish === null ? 'warn' : false) : null;

	/* ── S2: Supertrend Flip ── */
	let s2_pass = null, stNote = 'Not provided';
	if (stDir === 'flipped_bull') { s2_pass = true;  stNote = '🟢 JUST FLIPPED BULLISH — strongest signal'; }
	else if (stDir === 'bullish') { s2_pass = true;  stNote = '✅ Dots below price — trend bullish'; }
	else if (stDir === 'bearish') { s2_pass = false; stNote = '🔴 Dots still above — not yet'; }
	else if (stDir === 'flipped_bear') { s2_pass = false; stNote = '⬇️ Flipped bearish — avoid long'; }
	// Verify via values if provided
	if (stPrev != null && stCurr != null && price != null) {
		const prevAbove = stPrev > price;
		const currBelow = stCurr < price;
		if (prevAbove && currBelow && !stDir.includes('bear')) { s2_pass = true; stNote = '🟢 Supertrend confirmed flip: prev above → now below price'; }
	}

	/* ── S3: KDJ Oversold ── */
	let s3_pass = null, kdjNote = 'Not provided';
	if (kVal != null && dVal != null) {
		const kdj = scoreKDJ(kVal, dVal, jVal);
		s3_pass = kdj.pass;
		const jNote = jVal != null ? ` (J=${jVal.toFixed(1)})` : '';
		kdjNote = `K${kVal.toFixed(1)} D${dVal.toFixed(1)}${jNote} — ${kdj.zone}`;
		// Extra: oversold bounce = J < 20 turning up
		if (jVal != null && jVal < 20 && kVal > dVal) { s3_pass = true; kdjNote += ' — OVERSOLD BOUNCE ★'; }
	}

	/* ── S4: RSI Oversold Bounce ── */
	let s4_pass = null, rsiNote = 'Not provided';
	if (rsi != null) {
		if      (rsi < 30)  { s4_pass = true;  rsiNote = `RSI ${rsi.toFixed(1)} — extreme oversold bounce zone`; }
		else if (rsi < 40)  { s4_pass = true;  rsiNote = `RSI ${rsi.toFixed(1)} — oversold, bounce likely`; }
		else if (rsi < 50)  { s4_pass = 'warn'; rsiNote = `RSI ${rsi.toFixed(1)} — building momentum`; }
		else if (rsi < 70)  { s4_pass = true;  rsiNote = `RSI ${rsi.toFixed(1)} — bullish momentum zone`; }
		else               { s4_pass = 'warn'; rsiNote = `RSI ${rsi.toFixed(1)} — overbought, caution`; }
	}

	/* ── S5: MACD Divergence / Crossover ── */
	let s5_pass = null, macdNote = 'Not provided';
	if (dif != null && dea != null) {
		const macd = scoreMACDZone(dif, dea);
		s5_pass   = macd.pass;
		macdNote  = `DIF:${dif} DEA:${dea} — ${macd.zone}`;
		// Bullish divergence: DIF turning up from below DEA (DIF > DEA by small margin)
		if (dif > dea && Math.abs(dif - dea) / Math.abs(dea || 1) < 0.2) {
			macdNote += ' — Fresh crossover (high accuracy)';
			s5_pass = true;
		}
	}

	/* ── S6: Volume Spike ── */
	let s6_pass = null, volNote = 'Not provided';
	if (vol != null) {
		const volS = scoreVolume(vol);
		s6_pass   = volS.pass;
		volNote   = `${vol}× avg — ${volS.zone}`;
		if (vol >= 2.0) volNote += ' — Capitulation/Exhaustion spike ★';
	}

	/* ── S7: MA Rebuild Progress ── */
	const rebuild = maRebuildPhase(maPrice, ma5, ma20, ma50, ma200);
	const s7_pass = rebuild.score >= 75 ? true : rebuild.score >= 50 ? 'warn' : rebuild.score > 0 ? 'warn' : false;

	/* ── Score Engine ── */
	const eng = scoreEngine();
	eng.add(s1_pass, 18); // Candle pattern
	eng.add(s2_pass, 22); // Supertrend flip (most important)
	eng.add(s3_pass, 16); // KDJ oversold
	eng.add(s4_pass, 12); // RSI bounce
	eng.add(s5_pass, 12); // MACD
	eng.add(s6_pass, 12); // Volume
	eng.add(s7_pass,  8); // MA rebuild
	const score = eng.result();

	/* ── Decision ── */
	const criticalPass = s2_pass !== false && s1_pass !== false;
	let decision, riskLevel;
	if (!criticalPass || score < 35) {
		decision = 'SKIP';   riskLevel = 'High Risk';
	} else if (score >= 72) {
		decision = 'PROCEED'; riskLevel = 'Low Risk';
	} else if (score >= 52) {
		decision = 'PROCEED'; riskLevel = 'Medium Risk';
	} else {
		decision = 'WATCH';   riskLevel = 'Medium Risk';
	}

	/* ── Phase label for grade badge ── */
	const phaseGrade = { n:0, g:'BEAR',  cls:'grade-x', e:'🔴' };
	if (rebuild.phase.n >= 3) { phaseGrade.g='BULL'; phaseGrade.cls='grade-spp'; phaseGrade.e='🚀'; }
	else if (rebuild.phase.n >= 2) { phaseGrade.g='EARLY'; phaseGrade.cls='grade-a'; phaseGrade.e='📈'; }
	else if (rebuild.phase.n >= 1) { phaseGrade.g='REVERSAL'; phaseGrade.cls='grade-b'; phaseGrade.e='🔄'; }

	/* ── Decision Strip ── */
	setDecisionStrip('swing', decision, riskLevel, phaseGrade, `
		<div>Candle: <span style="color:${candle?.color||'var(--dim)'}">${candle?.pattern||'—'}</span>
		  &nbsp; Supertrend: <span style="color:${s2_pass===true?'var(--green)':s2_pass===false?'var(--red)':'var(--dim)'}">${stDir||'—'}</span>
		</div>
		<div>MA Rebuild: <span style="color:${rebuild.phase.color}">${rebuild.phase.label}</span>
		  &nbsp; Score: <span style="color:var(--accent)">${score.toFixed(0)}/100</span>
		</div>`
	);

	/* ── Advice ── */
	const adv = $('swing-advice');
	if (decision === 'PROCEED') {
		const lines = [
			stDir === 'flipped_bull'
				? `🟢 SUPERTREND FLIP CONFIRMED — Highest-conviction reversal signal. Enter on this candle close or next open.`
				: `✅ Reversal conditions met (Score: ${score.toFixed(0)}/100).`,
			candle ? `🕯️ ${candle.pattern} detected — ${candle.note}` : '',
			jVal != null && jVal < 20 ? `📊 KDJ J=${jVal.toFixed(1)} — extreme oversold. Historical bounce rate >75% from this level.` : '',
			rsi != null && rsi < 35 ? `📉 RSI ${rsi.toFixed(1)} — extreme oversold. Mean reversion favors the bull.` : '',
			vol != null && vol >= 1.5 ? `⚡ Volume ${vol}× — ${vol>=2?'Capitulation spike (sellers exhausted)':'Above average conviction'}.` : '',
			res1 ? `📐 Next resistance levels: ${res1.toFixed(4)}${res2?' → '+res2.toFixed(4):''}${res3?' → '+res3.toFixed(4):''}` : '',
			`📦 Entry: ${c.toFixed(4)} | SL: ${atr ? (c - atr*1.5).toFixed(4) + ' (ATR×1.5)' : 'set 1×ATR below candle low'}. Scale in across MA rebuilds.`,
		].filter(Boolean).join('\n');
		adv.textContent = lines;
		adv.className = 'advice-box green';
	} else if (decision === 'WATCH') {
		const waiting = [
			s2_pass !== true && 'Supertrend flip confirmation',
			s1_pass !== true && 'Stronger reversal candle (hammer/engulfing)',
			s6_pass !== true && 'Volume spike ≥ 1.5×',
			rebuild.score < 50 && `MA rebuild to Phase 2+ (currently Phase ${rebuild.phase.n})`,
		].filter(Boolean);
		adv.textContent = `⚠️ Partial reversal setup (Score: ${score.toFixed(0)}/100). Waiting for: ${waiting.join(', ')}.`;
		adv.className = 'advice-box yellow';
	} else {
		const failed = [
			s2_pass === false && stNote,
			s1_pass === false && `${candle?.pattern} — bearish candle`,
			score < 35 && `Score too low (${score.toFixed(0)}/100)`,
		].filter(Boolean);
		adv.textContent = `🔴 Skip. No valid reversal signal. ${failed.join(' | ')}. Wait for Supertrend flip + hammer candle + volume spike to all appear together.`;
		adv.className = 'advice-box red';
	}

	/* ── Dial ── */
	updateDial('swing-dial-arc', 'swing-dial-score', score);

	/* ── Pie ── */
	drawPie('swing-pie','swing-pie-legend', [
		{ label:'Candle',      value: s1_pass===true?1:s1_pass==='warn'?.5:0,           color:'var(--yellow)' },
		{ label:'Supertrend',  value: s2_pass===true?2:s2_pass==='warn'?1:0,            color:'var(--green)' },
		{ label:'KDJ',         value: s3_pass===true?1:s3_pass==='warn'?.5:0,           color:'var(--accent)' },
		{ label:'RSI',         value: s4_pass===true?1:s4_pass==='warn'?.5:0,           color:'var(--accent2)' },
		{ label:'MACD',        value: s5_pass===true?1:s5_pass==='warn'?.5:0,           color:'var(--orange)' },
		{ label:'Volume',      value: s6_pass===true?1:s6_pass==='warn'?.5:0,           color:'var(--red)' },
		{ label:'MA Rebuild',  value: rebuild.score/100,                                color:'var(--green2)' },
	].filter(s => s.value > 0));

	/* ── Checklist ── */
	const passArr = [s1_pass,s2_pass,s3_pass,s4_pass,s5_pass,s6_pass,s7_pass].filter(v=>v===true);
	$('swing-checklist').innerHTML = [
		buildCheck(`S1 — Candle: ${candle?.pattern||'—'}`, s1_pass, `${candle?.strength||0}% strength`),
		buildCheck(`S2 — Supertrend: ${stDir||'—'}`, s2_pass, stNote.length>40?stNote.slice(0,40)+'…':stNote),
		buildCheck(`S3 — KDJ Oversold`, s3_pass, kdjNote),
		buildCheck(`S4 — RSI Bounce`, s4_pass, rsi ? `RSI: ${rsi.toFixed(1)}` : 'Not provided'),
		buildCheck(`S5 — MACD ${dif!=null&&dea!=null?(dif>dea?'Bullish':'Bearish'):''}`, s5_pass, macdNote),
		buildCheck(`S6 — Volume Spike`, s6_pass, volNote),
		buildCheck(`S7 — MA Rebuild Phase ${rebuild.phase.n}/4`, s7_pass, rebuild.phase.label),
	].join('');
	updateMeter('swing-signal-meter', passArr.length, 7);

	/* ── Candle Analysis Grid ── */
	const range    = h - l;
	const body     = Math.abs(c - o);
	const lowerWick = Math.min(o,c) - l;
	const upperWick = h - Math.max(o,c);
	const wickScore = range > 0 ? (lowerWick / range) * 100 : 0;
	$('swing-candle-grid').innerHTML = [
		{ l:'Pattern',      v: candle?.pattern || '—',    c: candle?.bullish===true?'green':candle?.bullish===false?'red':'yellow' },
		{ l:'Candle Range', v: range.toFixed(4),           c: 'accent' },
		{ l:'Body Size',    v: `${(body/range*100).toFixed(0)}%`, c: body/range > 0.5 ? 'green' : 'yellow' },
		{ l:'Lower Wick',   v: `${wickScore.toFixed(0)}%`, c: wickScore>50?'green':wickScore>30?'accent':'dim' },
		{ l:'Upper Wick',   v: `${(upperWick/range*100).toFixed(0)}%`, c: upperWick/range>0.3?'red':'green' },
		{ l:'Candle Close', v: c > o ? '▲ Bullish' : '▼ Bearish', c: c > o ? 'green' : 'red' },
		prevClose ? { l:'Body vs Prev',  v: `${((c-prevClose)/prevClose*100).toFixed(2)}%`, c: c>prevClose?'green':'red' } : null,
	].filter(Boolean).map(({l,v,c:col}) =>
		`<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${col}">${v}</div></div>`
	).join('');

	const fill  = $('swing-wick-fill'), mark = $('swing-wick-marker'), lbl = $('swing-wick-label');
	if (fill)  fill.style.width  = Math.min(100,wickScore) + '%';
	if (mark)  mark.style.left   = Math.min(100,wickScore) + '%';
	if (lbl)   lbl.textContent   = `${wickScore.toFixed(0)}% lower wick ratio`;

	/* ── MA Rebuild Grid ── */
	$('swing-rebuild-grid').innerHTML = rebuild.checks.map(ch =>
		`<div class="check-row">
			<span class="${ch.pass===true?'check-pass':ch.pass===false?'check-fail':'check-neutral'}">${ch.pass===true?'✔':ch.pass===false?'✘':'○'}</span>
			<span class="check-label">${ch.label}</span>
			<span class="check-val ${ch.pass===true?'pass':ch.pass===false?'fail':'warn'}">${ch.pass===true?'✅ Done':ch.pass===false?'⏳ Pending':'—'}</span>
		</div>`
	).join('');

	const pct = rebuild.score;
	const rf  = $('swing-rebuild-fill'), rm = $('swing-rebuild-marker'), rl = $('swing-rebuild-label');
	if (rf) rf.style.width = pct + '%';
	if (rm) rm.style.left  = pct + '%';
	if (rl) rl.textContent = `Phase ${rebuild.phase.n}/4 — ${rebuild.phase.label}`;

	/* ── Multi-Level Trade Plan ── */
	const tpCard = $('swing-tradeplan-card');
	if (tpCard) {
		tpCard.style.display = '';
		// Phase info
		const phEl = $('swing-phase-info');
		if (phEl) {
			phEl.innerHTML = `<div class="swing-phase-banner" style="border-color:${rebuild.phase.color}">
				<span style="color:${rebuild.phase.color};font-weight:700">${rebuild.phase.e} ${rebuild.phase.label}</span>
				<span style="color:var(--dim);font-size:10.5px;margin-left:.75rem">${rebuild.phase.n < 4 ? `Next: ${['Price>MA5','MA5>MA20','MA20>MA50','Full stack'][rebuild.phase.n]}` : 'All MAs aligned — ride the trend'}</span>
			</div>`;
		}

		const entryPrice = c; // Enter at close of reversal candle
		const atrVal = atr || (range * 2); // fallback: 2× candle range

		// Build multi-phase TP using resistance levels + ATR
		const tpLevels = [];
		if (res1)    tpLevels.push({ label:'Phase 1 TP — Resistance 1', price:res1, pct:'30%', note:'MA cluster / key level — partial exit, move SL to breakeven' });
		if (res2)    tpLevels.push({ label:'Phase 2 TP — Resistance 2', price:res2, pct:'40%', note:'Next resistance — add at each MA cross above (scale in)' });
		if (res3)    tpLevels.push({ label:'Phase 3 TP — Resistance 3', price:res3, pct:'30%', note:'Full trend target — trail stop ATR×1.0' });
		if (!res1) { // Fallback to ATR
			tpLevels.push({ label:'TP1 (ATR×1.5)', price:entryPrice+atrVal*1.5, pct:'40%', note:'Move SL to breakeven' });
			tpLevels.push({ label:'TP2 (ATR×3.0)', price:entryPrice+atrVal*3.0, pct:'40%', note:'Trail stop' });
			tpLevels.push({ label:'TP3 (ATR×5.0)', price:entryPrice+atrVal*5.0, pct:'20%', note:'Hold for trend' });
		}

		const sl = entryPrice - atrVal * 1.5;
		const dp = entryPrice > 10 ? 2 : 4;

		let tpHtml = `<div class="prow entry"><span class="prow-label">Entry (Candle Close)</span><span class="prow-val accent">${entryPrice.toFixed(dp)}</span><span class="prow-note">Limit order — enter on close confirmation</span></div>
			<div class="prow sl"><span class="prow-label">Stop Loss (ATR×1.5)</span><span class="prow-val red">${sl.toFixed(dp)}</span><span class="prow-note">Below candle low ${l.toFixed(dp)} — set immediately</span></div>`;
		tpLevels.forEach((tp,i) => {
			const rr = ((tp.price - entryPrice) / (entryPrice - sl)).toFixed(1);
			const cls = i===0?'tp1':i===1?'tp2':'tp3';
			tpHtml += `<div class="prow ${cls}"><span class="prow-label">${tp.label} (${tp.pct})</span><span class="prow-val ${i===0?'green':i===1?'g2':'g3'}">${tp.price.toFixed(dp)}</span><span class="prow-note">R:R 1:${rr} — ${tp.note}</span></div>`;
		});
		$('swing-price-block').innerHTML = tpHtml;

		// Scaling guide
		const scEl = $('swing-scaling-guide');
		if (scEl) {
			scEl.innerHTML = `<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:.4rem;font-weight:700">📐 Position Scaling Strategy</div>
				<div class="wf-step"><span class="wf-n">1</span><span>Initial entry: <strong>33% of planned position</strong> at ${entryPrice.toFixed(dp)} — reversal just confirmed, not full conviction yet</span></div>
				${ma5 ? `<div class="wf-step"><span class="wf-n">2</span><span>Add <strong>33% more</strong> when Price > MA5 (${ma5.toFixed(dp)}) is confirmed — MA5 crossed = momentum valid</span></div>` : ''}
				${ma20 ? `<div class="wf-step"><span class="wf-n">3</span><span>Add <strong>final 34%</strong> when MA5 > MA20 (${ma20.toFixed(dp)}) confirmed — full bull signal</span></div>` : ''}
				<div class="wf-step"><span class="wf-n">4</span><span>At TP1: take 30% profit, move SL to breakeven — trade now "free"</span></div>
				<div class="wf-step"><span class="wf-n">5</span><span>At TP2: take 40% more, trail remaining 30% using ATR×1.0 below each new high</span></div>`;
		}

		// Kelly sizing
		const kellyEl = $('swing-kelly-block');
		if (account && riskPct && kellyEl) {
			kellyEl.style.display = '';
			const riskAmt  = account * (riskPct/100);
			const riskUnit = Math.abs(entryPrice - sl);
			const units    = riskUnit > 0 ? Math.floor(riskAmt / riskUnit) : 0;
			const posVal   = units * entryPrice;
			kellyEl.innerHTML = `<div class="kelly-block">
				<div class="kelly-title">⚖️ Reversal Trade Sizing</div>
				<div class="kelly-row"><span class="kelly-label">Account</span><span class="kelly-val">$${account.toLocaleString()}</span></div>
				<div class="kelly-row"><span class="kelly-label">Risk (${riskPct}%)</span><span class="kelly-val" style="color:var(--red)">$${riskAmt.toFixed(2)}</span></div>
				<div class="kelly-row"><span class="kelly-label">Initial Entry (33%)</span><span class="kelly-val green">${Math.floor(units*0.33)} units @ ${entryPrice.toFixed(dp)}</span></div>
				<div class="kelly-row"><span class="kelly-label">Full Position</span><span class="kelly-val">${units} units = $${posVal.toFixed(2)}</span></div>
				<div class="kelly-row" style="border-top:1px solid var(--border);padding-top:.3rem;margin-top:.2rem">
					<span class="kelly-label" style="color:var(--muted);font-size:9.5px">💡 Scale in 33% → 33% → 34% as each MA phase confirms. Never risk full position at reversal entry.</span>
				</div>
			</div>`;
		} else if (kellyEl) kellyEl.style.display = 'none';
	}
}

function resetSwing() {
	['sw-open','sw-high','sw-low','sw-close','sw-prev-close','sw-price',
	 'sw-st-prev','sw-st-curr','sw-ma-price','sw-ma5','sw-ma20','sw-ma50','sw-ma200',
	 'sw-res1','sw-res2','sw-res3','sw-k','sw-d','sw-j','sw-rsi',
	 'sw-dif','sw-dea','sw-vol','sw-adx','sw-atr','sw-account','sw-riskpct',
	].forEach(id => { const el=$(id); if(el) el.value=''; });
	const stEl = document.getElementById('sw-st-dir');
	if (stEl) stEl.value = '';
	$('swing-result').style.display = 'none';
}

/* ══════════════════════════════════════════════════════════════
   QUERY PRICE PLANNER (QPP)
   Generates Recommended / Conservative / Aggressive /
   Scalp / Swing / Position trade profiles for any setup.
   Called after every calculator result is rendered.
══════════════════════════════════════════════════════════════ */

/* ── Profile Definitions ── */
const QPP_PROFILES = [
  {
    id:       'recommended',
    label:    '⭐ Recommended',
    color:    'var(--accent)',
    border:   'rgba(0,200,240,.35)',
    bg:       'rgba(0,200,240,.06)',
    badge:    'STANDARD',
    badgeCls: 'qpp-badge-accent',
    slMult:   1.5,
    tp1Mult:  1.5,
    tp2Mult:  3.0,
    tp3Mult:  5.0,
    sizeRule: (score, stretch) => score >= 75 && stretch <= 3 ? 1.0 : score >= 55 ? 0.5 : 0.25,
    posLabel: (score, stretch) => score >= 75 && stretch <= 3 ? '100%' : score >= 55 ? '50%' : '25%',
    note:     'Balanced R:R. ATR×1.5 SL. Scale out 40/40/20 at TP1/2/3. Move SL to breakeven at TP1.',
    riskPct:  1.0,
    winRate:  55,
  },
  {
    id:       'conservative',
    label:    '🛡️ Conservative',
    color:    'var(--green)',
    border:   'rgba(0,232,122,.35)',
    bg:       'rgba(0,232,122,.05)',
    badge:    'LOW RISK',
    badgeCls: 'qpp-badge-green',
    slMult:   1.2,
    tp1Mult:  1.0,
    tp2Mult:  2.0,
    tp3Mult:  3.0,
    sizeRule: (score) => score >= 75 ? 0.5 : 0.25,
    posLabel: (score) => score >= 75 ? '50%' : '25%',
    note:     'Tight SL (ATR×1.2). Quick TP1 at 1×ATR. Prioritises capital protection. Best for uncertain markets.',
    riskPct:  0.5,
    winRate:  60,
  },
  {
    id:       'aggressive',
    label:    '🔥 Aggressive',
    color:    'var(--red)',
    border:   'rgba(240,58,74,.35)',
    bg:       'rgba(240,58,74,.05)',
    badge:    'HIGH RISK',
    badgeCls: 'qpp-badge-red',
    slMult:   2.0,
    tp1Mult:  2.0,
    tp2Mult:  4.0,
    tp3Mult:  8.0,
    sizeRule: (score) => score >= 72 ? 1.0 : 0.5,
    posLabel: (score) => score >= 72 ? '100%' : '50%',
    note:     'Wide SL (ATR×2.0) to survive volatility. Large TP3 target. Only when score ≥ 72 & strong trend.',
    riskPct:  1.5,
    winRate:  45,
  },
  {
    id:       'scalp',
    label:    '⚡ Scalp',
    color:    'var(--yellow)',
    border:   'rgba(245,200,66,.35)',
    bg:       'rgba(245,200,66,.05)',
    badge:    'SHORT TERM',
    badgeCls: 'qpp-badge-yellow',
    slMult:   0.8,
    tp1Mult:  0.6,
    tp2Mult:  1.0,
    tp3Mult:  1.5,
    sizeRule: () => 1.0,
    posLabel: () => '100%',
    note:     'Tight SL (ATR×0.8). Quick exits at TP1/TP2. Best during London/NY overlap. Do not hold overnight.',
    riskPct:  0.5,
    winRate:  58,
  },
  {
    id:       'swing',
    label:    '🔄 Swing',
    color:    'var(--swing2)',
    border:   'rgba(168,85,247,.35)',
    bg:       'rgba(168,85,247,.05)',
    badge:    'MULTI-DAY',
    badgeCls: 'qpp-badge-swing',
    slMult:   2.5,
    tp1Mult:  3.0,
    tp2Mult:  6.0,
    tp3Mult:  10.0,
    sizeRule: (score) => score >= 70 ? 0.5 : 0.25,
    posLabel: (score) => score >= 70 ? '50%' : '25%',
    note:     'Wide SL (ATR×2.5) for multi-day holds. TP3 at 10×ATR. Hold through minor pullbacks. Trail after TP1.',
    riskPct:  1.0,
    winRate:  48,
  },
  {
    id:       'position',
    label:    '🏦 Position',
    color:    '#FFD700',
    border:   'rgba(255,215,0,.3)',
    bg:       'rgba(255,215,0,.04)',
    badge:    'LONG TERM',
    badgeCls: 'qpp-badge-gold',
    slMult:   3.0,
    tp1Mult:  5.0,
    tp2Mult:  10.0,
    tp3Mult:  20.0,
    sizeRule: (score) => score >= 75 ? 0.33 : 0.15,
    posLabel: (score) => score >= 75 ? '33%' : '15%',
    note:     'Maximum SL (ATR×3.0). Weeks to months hold. TP3 = 20×ATR. Only in confirmed macro bull trend.',
    riskPct:  0.5,
    winRate:  52,
  },
];

/* ── Expected Value Calculator ── */
function calcEV(winRate, avgWinR, riskAmt) {
  const w = winRate / 100;
  const ev = (w * avgWinR - (1 - w) * 1) * riskAmt;
  return ev;
}

/* ── Build Expectancy Bar ── */
function expectancyBar(ev, maxEv) {
  const pct = Math.min(100, Math.max(0, ((ev + maxEv) / (maxEv * 2)) * 100));
  const color = ev > 0 ? 'var(--green)' : 'var(--red)';
  return `<div class="qpp-ev-bar-wrap">
    <div class="qpp-ev-track">
      <div class="qpp-ev-fill" style="width:${pct}%;background:${color}"></div>
      <div class="qpp-ev-marker" style="left:50%"></div>
    </div>
    <div class="qpp-ev-labels">
      <span style="color:var(--red)">–EV</span>
      <span style="color:${color};font-weight:700">${ev >= 0 ? '+' : ''}$${ev.toFixed(2)}</span>
      <span style="color:var(--green)">+EV</span>
    </div>
  </div>`;
}

/* ── Main QPP Renderer ── */
function renderQPP(pfx, price, atr, score, accountSize, stretch, context) {
  const container = $(`${pfx}-qpp`);
  if (!container || !price || !atr) { if (container) container.style.display = 'none'; return; }
  container.style.display = '';

  const dp       = context === 'gold' ? 2 : context === 'bursa' ? 3 : 4;
  const currency = context === 'bursa' ? 'MYR ' : '$';
  const riskAmt  = accountSize ? accountSize * 0.01 : 100; // default $100 risk
  const maxEv    = riskAmt * 3;

  // Build profile cards
  const cards = QPP_PROFILES.map(p => {
    const sl   = price - atr * p.slMult;
    const tp1  = price + atr * p.tp1Mult;
    const tp2  = price + atr * p.tp2Mult;
    const tp3  = price + atr * p.tp3Mult;
    const risk = price - sl;
    const rr1  = risk > 0 ? ((tp1 - price) / risk) : 0;
    const rr2  = risk > 0 ? ((tp2 - price) / risk) : 0;
    const rr3  = risk > 0 ? ((tp3 - price) / risk) : 0;
    const size = p.posLabel(score, stretch || 0);

    // Expected value using composite RR (weighted avg of 3 TPs: 40/40/20)
    const avgWinR = rr1 * 0.4 + rr2 * 0.4 + rr3 * 0.2;
    const acctRisk = accountSize ? accountSize * (p.riskPct / 100) : riskAmt;
    const ev = calcEV(p.winRate, avgWinR, acctRisk);

    // Units/shares
    const units = accountSize && risk > 0 ? Math.floor((accountSize * p.riskPct / 100) / risk) : null;

    // Viability: is this profile suitable for current score?
    const viable = p.id === 'scalp'    ? true
                 : p.id === 'position' ? score >= 70
                 : p.id === 'aggressive' ? score >= 72
                 : p.id === 'swing'    ? score >= 60
                 : score >= 50;

    return { p, sl, tp1, tp2, tp3, risk, rr1, rr2, rr3, size, ev, avgWinR, acctRisk, units, viable };
  });

  // Find best profile for current conditions
  const viable = cards.filter(c => c.viable);
  const best   = viable.sort((a,b) => b.ev - a.ev)[0];

  container.innerHTML = `
    <div class="qpp-wrap">
      <div class="qpp-header">
        <div class="qpp-title">
          <span class="qpp-title-icon">📋</span>
          <span>Query Price Planner</span>
          <span class="qpp-subtitle">Choose a trading style below — all levels auto-calculated</span>
        </div>
        ${best ? `<div class="qpp-best-tag">⭐ Best for current setup: <strong style="color:${best.p.color}">${best.p.label}</strong></div>` : ''}
      </div>

      <div class="qpp-tabs" id="${pfx}-qpp-tabs">
        ${QPP_PROFILES.map(p =>
          `<button class="qpp-tab-btn${p.id === 'recommended' ? ' active' : ''}${!cards.find(c=>c.p.id===p.id)?.viable ? ' qpp-dim' : ''}"
            style="--qpp-c:${p.color}" onclick="qppSwitch('${pfx}','${p.id}')">
            ${p.label}
            ${p.id === best?.p.id ? '<span class="qpp-best-dot"></span>' : ''}
          </button>`
        ).join('')}
      </div>

      ${QPP_PROFILES.map(p => {
        const c = cards.find(x => x.p.id === p.id);
        const evColor = c.ev >= 0 ? 'var(--green)' : 'var(--red)';
        return `
        <div class="qpp-panel${p.id === 'recommended' ? ' active' : ''}" id="${pfx}-qpp-${p.id}">
          <div class="qpp-note" style="border-color:${p.border};background:${p.bg}">
            <span class="qpp-badge ${p.badgeCls}">${p.badge}</span>
            <span style="font-size:10.5px;color:var(--dim)">${p.note}</span>
            ${!c.viable ? `<span class="qpp-not-viable">⚠️ Score ${score.toFixed(0)}/100 — below threshold for this style</span>` : ''}
          </div>

          <div class="qpp-levels">
            <div class="qpp-row qpp-entry">
              <span class="qpp-row-icon">▶</span>
              <span class="qpp-row-label">Entry</span>
              <span class="qpp-row-price" style="color:var(--accent)">${currency}${price.toFixed(dp)}</span>
              <span class="qpp-row-note">Market price — enter on close confirmation</span>
            </div>
            <div class="qpp-row qpp-sl">
              <span class="qpp-row-icon">🛑</span>
              <span class="qpp-row-label">Stop Loss <span style="color:var(--muted);font-size:9px">ATR×${p.slMult}</span></span>
              <span class="qpp-row-price" style="color:var(--red)">${currency}${c.sl.toFixed(dp)}</span>
              <span class="qpp-row-note">Risk: ${currency}${c.risk.toFixed(dp)} per unit${c.units ? ` · ${c.units} units max` : ''}</span>
            </div>
            <div class="qpp-row qpp-tp1">
              <span class="qpp-row-icon">🎯</span>
              <span class="qpp-row-label">TP1 <span style="color:var(--muted);font-size:9px">40% off</span></span>
              <span class="qpp-row-price" style="color:var(--green)">${currency}${c.tp1.toFixed(dp)}</span>
              <span class="qpp-row-note">R:R 1:${c.rr1.toFixed(2)} · Move SL → breakeven</span>
            </div>
            <div class="qpp-row qpp-tp2">
              <span class="qpp-row-icon">🎯</span>
              <span class="qpp-row-label">TP2 <span style="color:var(--muted);font-size:9px">40% off</span></span>
              <span class="qpp-row-price" style="color:#55ffaa">${currency}${c.tp2.toFixed(dp)}</span>
              <span class="qpp-row-note">R:R 1:${c.rr2.toFixed(2)} · Trail ATR×1.0</span>
            </div>
            <div class="qpp-row qpp-tp3">
              <span class="qpp-row-icon">🚀</span>
              <span class="qpp-row-label">TP3 <span style="color:var(--muted);font-size:9px">20% off</span></span>
              <span class="qpp-row-price" style="color:#88ffcc">${currency}${c.tp3.toFixed(dp)}</span>
              <span class="qpp-row-note">R:R 1:${c.rr3.toFixed(2)} · Trail or hold</span>
            </div>
          </div>

          <div class="qpp-stats">
            <div class="qpp-stat">
              <div class="qpp-stat-label">Position Size</div>
              <div class="qpp-stat-val" style="color:${p.color}">${c.size}</div>
            </div>
            <div class="qpp-stat">
              <div class="qpp-stat-label">Avg R:R</div>
              <div class="qpp-stat-val" style="color:var(--accent)">${c.avgWinR.toFixed(2)}:1</div>
            </div>
            <div class="qpp-stat">
              <div class="qpp-stat-label">Win Rate Est.</div>
              <div class="qpp-stat-val" style="color:var(--yellow)">${p.winRate}%</div>
            </div>
            <div class="qpp-stat">
              <div class="qpp-stat-label">Risk Amount</div>
              <div class="qpp-stat-val" style="color:var(--red)">${currency}${c.acctRisk.toFixed(2)}</div>
            </div>
            <div class="qpp-stat">
              <div class="qpp-stat-label">Expected Value</div>
              <div class="qpp-stat-val" style="color:${evColor}">${c.ev >= 0 ? '+' : ''}${currency}${c.ev.toFixed(2)}</div>
            </div>
            ${c.units ? `<div class="qpp-stat">
              <div class="qpp-stat-label">Max Units</div>
              <div class="qpp-stat-val" style="color:var(--green)">${c.units}</div>
            </div>` : ''}
          </div>

          <div class="qpp-ev-section">
            <div class="qpp-ev-title">Expected Value per Trade</div>
            ${expectancyBar(c.ev, maxEv)}
          </div>

          <div class="qpp-compare">
            <div class="qpp-compare-title">📊 Profile Comparison</div>
            <div class="qpp-compare-grid">
              ${cards.map(cc => `
                <div class="qpp-compare-row${cc.p.id === p.id ? ' qpp-compare-active' : ''}">
                  <span class="qpp-compare-name" style="color:${cc.p.color}">${cc.p.label}</span>
                  <span class="qpp-compare-sl" style="color:var(--red)">SL ${currency}${cc.sl.toFixed(dp)}</span>
                  <span class="qpp-compare-tp" style="color:var(--green)">TP1 ${currency}${cc.tp1.toFixed(dp)}</span>
                  <span class="qpp-compare-rr" style="color:var(--accent)">RR ${cc.avgWinR.toFixed(1)}:1</span>
                  <span class="qpp-compare-ev" style="color:${cc.ev>=0?'var(--green)':'var(--red)'}">${cc.ev>=0?'+':''}${currency}${cc.ev.toFixed(0)}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ── Tab Switcher for QPP ── */
function qppSwitch(pfx, profileId) {
  const wrap = $(`${pfx}-qpp`);
  if (!wrap) return;
  wrap.querySelectorAll('.qpp-tab-btn').forEach(b => b.classList.remove('active'));
  wrap.querySelectorAll('.qpp-panel').forEach(p => p.classList.remove('active'));
  const btn = wrap.querySelector(`.qpp-tab-btn[onclick*="${profileId}"]`);
  const panel = $(`${pfx}-qpp-${profileId}`);
  if (btn)   btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

/* ── Hook QPP into all calculators ──
   Call renderQPP after every calc completes */
const _origMACalc    = typeof maCalc    === 'function' ? maCalc    : null;
const _origEMACalc   = typeof emaCalc   === 'function' ? emaCalc   : null;
const _origGoldCalc  = typeof goldCalc  === 'function' ? goldCalc  : null;
const _origBursaCalc = typeof bursaCalc === 'function' ? bursaCalc : null;
const _origSwingCalc = typeof swingCalc === 'function' ? swingCalc : null;

/* Patch each calc to call QPP after */
function patchCalc(fn, pfx, getPriceAtrScore, context) {
  return function() {
    fn.apply(this, arguments);
    // Small defer so DOM is updated first
    requestAnimationFrame(() => {
      const res = getPriceAtrScore();
      if (res) renderQPP(pfx, res.price, res.atr, res.score, res.account, res.stretch, context);
    });
  };
}

if (_origMACalc) {
  maCalc = patchCalc(_origMACalc, 'ma', () => {
    const price = num('ma-price'), atr = num('ma-atr'), ma20 = num('ma-ma20');
    const account = num('ma-account');
    if (!price || !atr) return null;
    const dialEl = $('ma-dial-score');
    const score = dialEl ? parseFloat(dialEl.textContent) || 0 : 0;
    const stretch = ma20 ? Math.abs((price - ma20) / ma20 * 100) : 0;
    return { price, atr, score, account, stretch };
  }, 'default');
}

if (_origEMACalc) {
  emaCalc = patchCalc(_origEMACalc, 'ema', () => {
    const price = num('ema-price'), atr = num('ema-atr'), e8 = num('ema-ema8');
    const account = num('ema-account');
    if (!price || !atr) return null;
    const dialEl = $('ema-dial-score');
    const score = dialEl ? parseFloat(dialEl.textContent) || 0 : 0;
    const stretch = e8 ? Math.abs((price - e8) / e8 * 100) : 0;
    return { price, atr, score, account, stretch };
  }, 'default');
}

if (_origGoldCalc) {
  goldCalc = patchCalc(_origGoldCalc, 'gold', () => {
    const price = num('gold-price'), atr = num('gold-atr'), e21 = num('gold-e21');
    const account = num('gold-account');
    if (!price || !atr) return null;
    const dialEl = $('gold-dial-score');
    const score = dialEl ? parseFloat(dialEl.textContent) || 0 : 0;
    const stretch = e21 ? Math.abs((price - e21) / e21 * 100) : 0;
    return { price, atr, score, account, stretch };
  }, 'gold');
}

if (_origBursaCalc) {
  bursaCalc = patchCalc(_origBursaCalc, 'bursa', () => {
    const price = num('bu-price'), atr = num('bu-atr'), ma20 = num('bu-ma20');
    const account = num('bu-account');
    if (!price || !atr) return null;
    const dialEl = $('bursa-dial-score');
    const score = dialEl ? parseFloat(dialEl.textContent) || 0 : 0;
    const stretch = ma20 ? Math.abs((price - ma20) / ma20 * 100) : 0;
    return { price, atr, score, account, stretch };
  }, 'bursa');
}

if (_origSwingCalc) {
  swingCalc = patchCalc(_origSwingCalc, 'swing', () => {
    const price = num('sw-close'), atr = num('sw-atr');
    const account = num('sw-account');
    if (!price || !atr) return null;
    const dialEl = $('swing-dial-score');
    const score = dialEl ? parseFloat(dialEl.textContent) || 0 : 0;
    return { price, atr, score, account, stretch: 0 };
  }, 'default');
}