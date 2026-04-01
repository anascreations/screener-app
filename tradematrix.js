/* ═══════════════════════════════════════════════════════════════
   TradeMatrix Calculator — tradematrix.js
   ════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
const $ = id => document.getElementById(id);
const num = id => { const v = parseFloat($( id)?.value); return isNaN(v) ? null : v; };
const pct = (v, base) => base ? ((v - base) / base * 100) : null;
const fmt = (v, d = 4) => v == null ? '—' : v.toFixed(d);
const fmt2 = (v, d = 2) => v == null ? '—' : v.toFixed(d) + '%';

/* ── Tab switcher ── */
function switchTab(t) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  $('panel-' + t).classList.add('active');
  // Mark the clicked button active
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.getAttribute('data-tab') === t) b.classList.add('active');
  });
}

/* ══════════════════════════════════════
   PIE CHART RENDERER
══════════════════════════════════════ */

/**
 * Draws a donut pie chart into an SVG element and populates a legend div.
 * @param {string} svgId    - id of the <svg> element
 * @param {string} legendId - id of the legend container div
 * @param {Array}  segments - [{label, value, color}]
 */
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
    const angle    = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const large    = angle > Math.PI ? 1 : 0;

    const x1  = cx + r     * Math.cos(startAngle);
    const y1  = cy + r     * Math.sin(startAngle);
    const x2  = cx + r     * Math.cos(endAngle);
    const y2  = cy + r     * Math.sin(endAngle);
    const ix1 = cx + inner * Math.cos(startAngle);
    const iy1 = cy + inner * Math.sin(startAngle);
    const ix2 = cx + inner * Math.cos(endAngle);
    const iy2 = cy + inner * Math.sin(endAngle);

    const pctStr = ((seg.value / total) * 100).toFixed(1);

    paths += `<path
      d="M${ix1} ${iy1} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z"
      fill="${seg.color}" opacity="0.9" stroke="var(--card)" stroke-width="2">
      <title>${seg.label}: ${pctStr}%</title>
    </path>`;

    startAngle = endAngle;
  });

  // Centre label — largest segment
  const topSeg = [...segs].sort((a, b) => b.value - a.value)[0];
  const topPct  = ((topSeg.value / total) * 100).toFixed(0);

  paths += `<text x="${cx}" y="${cy - 4}" text-anchor="middle"
    font-family="'Syne',sans-serif" font-size="16" font-weight="800"
    fill="${topSeg.color}">${topPct}%</text>`;
  paths += `<text x="${cx}" y="${cy + 10}" text-anchor="middle"
    font-family="'IBM Plex Mono',monospace" font-size="8"
    fill="var(--muted)">${topSeg.label.toUpperCase().slice(0, 8)}</text>`;

  svg.innerHTML = paths;

  // Legend
  legend.innerHTML = segs.map(s => {
    const p = ((s.value / total) * 100).toFixed(1);
    return `<div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <span class="legend-label">${s.label}</span>
      <span class="legend-val" style="color:${s.color}">${s.value}</span>
      <span class="legend-pct">${p}%</span>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════
   DIAL / GAUGE
══════════════════════════════════════ */

/**
 * Updates the half-circle score gauge.
 * @param {string} arcId   - id of the <path> arc element
 * @param {string} scoreId - id of the <text> score element
 * @param {number} score   - 0–100
 */
function updateDial(arcId, scoreId, score) {
  const arc = $(arcId);
  const txt = $(scoreId);
  if (!arc || !txt) return;

  const total = 188; // half-circle circumference (π × 60)
  const dash  = (Math.min(100, Math.max(0, score)) / 100) * total;
  arc.setAttribute('stroke-dasharray', `${dash} ${total}`);
  txt.textContent = Math.round(score);

  const color = score >= 75 ? '#00e87a' : score >= 55 ? '#f5c842' : '#f03a4a';
  txt.setAttribute('fill', color);
}

/* ══════════════════════════════════════
   SIGNAL METER
══════════════════════════════════════ */

/**
 * Renders a row of coloured segment blocks.
 * @param {string} meterId   - id of the signal-meter div
 * @param {number} passCount - how many filters passed
 * @param {number} total     - total filter count
 */
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

/**
 * Animates a range bar and marker to a value.
 * @param {string} fillId   - id of the fill div
 * @param {string} markerId - id of the marker div
 * @param {string} labelId  - id of the centre label element
 * @param {number} val      - current value
 * @param {number} max      - value at 100%
 */
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
   TRADE PLAN BUILDER
══════════════════════════════════════ */

/**
 * Populates the ATR-based trade plan price block.
 * @param {string} containerId - id of .price-block div
 * @param {string} cardId      - id of the parent card (shown/hidden)
 * @param {number} price       - entry price
 * @param {number} atr         - ATR14 value
 */
function buildPricePlan(containerId, cardId, price, atr) {
  const card      = $(cardId);
  const container = $(containerId);
  if (!card || !container || !price || !atr) {
    if (card) card.style.display = 'none';
    return;
  }

  card.style.display = '';

  const sl  = price - atr * 1.5;
  const tp1 = price + atr * 1.5;
  const tp2 = price + atr * 3.0;
  const tp3 = price + atr * 5.0;
  const risk = price - sl;
  const rr1 = (tp1 - price) / risk;
  const rr2 = (tp2 - price) / risk;
  const rr3 = (tp3 - price) / risk;

  container.innerHTML = `
    <div class="prow entry">
      <span class="prow-label">Ideal Entry</span>
      <span class="prow-val accent">${fmt(price)}</span>
      <span class="prow-note">Current market price</span>
    </div>
    <div class="prow sl">
      <span class="prow-label">Stop Loss</span>
      <span class="prow-val red">${fmt(sl)}</span>
      <span class="prow-note">ATR × 1.5 — set immediately</span>
    </div>
    <div class="prow tp1">
      <span class="prow-label">TP1 — 40%</span>
      <span class="prow-val green">${fmt(tp1)}</span>
      <span class="prow-note">R:R 1:${rr1.toFixed(1)} — move SL to breakeven</span>
    </div>
    <div class="prow tp2">
      <span class="prow-label">TP2 — 40%</span>
      <span class="prow-val g2">${fmt(tp2)}</span>
      <span class="prow-note">R:R 1:${rr2.toFixed(1)}</span>
    </div>
    <div class="prow tp3">
      <span class="prow-label">TP3 — 20%</span>
      <span class="prow-val g3">${fmt(tp3)}</span>
      <span class="prow-note">R:R 1:${rr3.toFixed(1)} — trail or hold</span>
    </div>
  `;
}

/* ══════════════════════════════════════
   CHECKLIST ROW BUILDER
══════════════════════════════════════ */

/**
 * Returns HTML for a single checklist row.
 * @param {string}       label  - filter name
 * @param {boolean|null} pass   - true=pass, false=fail, null=neutral
 * @param {string}       result - value string shown on right
 */
function buildCheck(label, pass, result) {
  const icon = pass === true ? '✔' : pass === false ? '✘' : '○';
  const cls  = pass === true ? 'check-pass' : pass === false ? 'check-fail' : 'check-neutral';
  const vcls = pass === true ? 'pass' : pass === false ? 'fail' : 'warn';
  return `<div class="check-row">
    <span class="${cls}">${icon}</span>
    <span class="check-label">${label}</span>
    <span class="check-val ${vcls}">${result || ''}</span>
  </div>`;
}

/* ══════════════════════════════════════
   GRADE — MA20 vs MA50 / EMA21 vs EMA55
══════════════════════════════════════ */

/**
 * Returns a grade object based on percentage gap between two MAs.
 * @param {number} gap - percentage gap
 * @returns {{ g, e, cls, c }}
 */
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
   KDJ ZONE
══════════════════════════════════════ */

/**
 * Evaluates KDJ oscillator state.
 * @param {number|null} k
 * @param {number|null} d
 * @param {number|null} j
 * @returns {{ zone, e, pass, c } | null}
 */
function getKDJ(k, d, j) {
  if (k == null || d == null) return null;
  if (k < d)                  return { zone: 'Bearish',         e: '🔴', pass: false,   c: 'var(--red)' };
  if (j > 80)                 return { zone: 'Overbought',      e: '🟡', pass: 'warn',  c: 'var(--yellow)' };
  if (j != null && j < 20)   return { zone: 'Oversold Bounce', e: '💡', pass: true,    c: 'var(--accent)' };
  if (j != null && j > 50)   return { zone: 'Bullish Strong',  e: '✅', pass: true,    c: 'var(--green)' };
  return                             { zone: 'Bullish Building',e: '🟢', pass: true,    c: 'var(--accent)' };
}

/* ══════════════════════════════════════
   MACD ZONE
══════════════════════════════════════ */

/**
 * Evaluates MACD DIF vs DEA state.
 * @param {number|null} dif
 * @param {number|null} dea
 * @returns {{ zone, e, pass, c } | null}
 */
function getMACDZone(dif, dea) {
  if (dif == null || dea == null) return null;
  if (dif < dea) return { zone: 'Bearish',             e: '🔴', pass: false,  c: 'var(--red)' };

  const diff = Math.abs(dif - dea);
  const avg  = (Math.abs(dif) + Math.abs(dea)) / 2;
  if (avg > 0 && diff / avg < 0.05) return { zone: 'Near Cross — Watch', e: '⚠️', pass: 'warn', c: 'var(--yellow)' };
  if (dif > 0 && dea > 0)           return { zone: 'Strong Bull',        e: '🚀', pass: true,   c: 'var(--green)' };
  return                                    { zone: 'Bullish',            e: '✅', pass: true,   c: 'var(--accent)' };
}

/* ══════════════════════════════════════
   MA CALCULATOR
══════════════════════════════════════ */
function maCalc() {
  const price = num('ma-price');
  const ma5   = num('ma-ma5');
  const ma20  = num('ma-ma20');
  const ma50  = num('ma-ma50');

  // Hide results until required fields are filled
  if (!price || !ma5 || !ma20 || !ma50) {
    $('ma-result').style.display = 'none';
    return;
  }
  $('ma-result').style.display = '';

  const k   = num('ma-k');
  const d   = num('ma-d');
  const j   = num('ma-j');
  const dif = num('ma-dif');
  const dea = num('ma-dea');
  const vol = num('ma-vol');
  const atr = num('ma-atr');

  /* ── Distance calculations ── */
  const pAboveMA20   = pct(price, ma20);
  const pAboveMA5    = pct(price, ma5);
  const pAboveMA50   = pct(price, ma50);
  const ma5AboveMA20  = pct(ma5,  ma20);
  const ma20AboveMA50 = pct(ma20, ma50);

  /* ── Filter pass/fail ── */
  const f1_pass = price > ma5;
  const f2_pass = ma5   > ma20;
  const f3_pass = ma20  > ma50;
  const kdj     = getKDJ(k, d, j);
  const macd    = getMACDZone(dif, dea);
  const vol_pass = vol == null ? null
                 : vol >= 1.2  ? true
                 : vol >= 0.8  ? 'warn'
                 : false;

  /* ── Weighted score ── */
  let score = 0, total = 0;
  const add = (pass, w) => {
    total += w;
    if (pass === true)   score += w;
    else if (pass === 'warn') score += w * 0.5;
  };
  add(f1_pass,              20);
  add(f2_pass,              20);
  add(f3_pass,              15);
  add(kdj  ? kdj.pass  : null, 20);
  add(macd ? macd.pass : null, 15);
  add(vol_pass,             10);

  // Stretch penalty
  let penalty = 0;
  if (pAboveMA20 > 10) penalty = -15;
  else if (pAboveMA20 > 5) penalty = -8;
  const adjScore = Math.max(0, Math.min(100, (score / total) * 100 + penalty));

  /* ── Decision ── */
  const momentumOk = (!kdj  || kdj.pass  !== false)
                  && (!macd || macd.pass !== false);

  let decision, riskLevel, posSize;
  if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
    decision = 'SKIP';   riskLevel = 'High Risk';   posSize = '0%';
  } else if (adjScore >= 70) {
    decision = 'PROCEED'; riskLevel = 'Low Risk';    posSize = pAboveMA20 > 5 ? '50%' : '100%';
  } else if (adjScore >= 50) {
    decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
  } else {
    decision = 'WATCH';  riskLevel = 'Medium Risk'; posSize = '25%';
  }

  const grade = getGrade(ma20AboveMA50);

  /* ── Decision Strip ── */
  const strip = $('ma-decision-strip');
  strip.className = `decision-strip ${decision === 'PROCEED' ? 'proceed' : decision === 'SKIP' ? 'skip' : 'watch'}`;

  const badge = $('ma-d-badge');
  badge.className  = `d-badge ${decision === 'PROCEED' ? 'proceed' : decision === 'SKIP' ? 'skip' : 'watch'}`;
  badge.textContent = decision;

  const rp = $('ma-risk-pill');
  rp.className  = `risk-pill ${riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium'}`;
  rp.textContent = riskLevel;

  const gb = $('ma-grade-badge');
  gb.className  = `grade-badge ${grade.cls}`;
  gb.textContent = `${grade.e} ${grade.g}`;
  gb.style.display = '';

  $('ma-d-meta').innerHTML = `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      &nbsp; MA5: <span style="color:var(--text)">${fmt(ma5)}</span>
      MA20: <span style="color:var(--text)">${fmt(ma20)}</span>
      MA50: <span style="color:var(--text)">${fmt(ma50)}</span>
    </div>
    <div>Position Size: <span style="color:${riskLevel.includes('Low') ? 'var(--green)' : 'var(--yellow)'}">${posSize}</span></div>
  `;

  /* ── Advice ── */
  const adv = $('ma-advice');
  if (decision === 'PROCEED') {
    adv.textContent = pAboveMA20 > 5
      ? `⚠️ Price is ${pAboveMA20.toFixed(1)}% above MA20 — consider waiting for a pullback. Use ${posSize} position size.`
      : `✅ Full bull MA stack confirmed. Price is ${pAboveMA20.toFixed(1)}% above MA20 (ideal ≤2%). ${posSize} position. Set SL immediately after entry.`;
    adv.className = 'advice-box green';
  } else if (decision === 'WATCH') {
    adv.textContent = `⚠️ Partial setup. Wait for MA alignment to complete before entering. Monitor KDJ and MACD for confirmation.`;
    adv.className = 'advice-box yellow';
  } else {
    const missing = [
      !f1_pass          && 'Price < MA5',
      !f2_pass          && 'MA5 < MA20',
      !f3_pass          && 'MA20 < MA50',
      kdj?.pass  === false && 'KDJ Bearish',
      macd?.pass === false && 'MACD Bearish',
    ].filter(Boolean);
    adv.textContent = `🔴 Skip. Filters failed: ${missing.join(', ')}.`;
    adv.className = 'advice-box red';
  }

  /* ── Dial ── */
  updateDial('ma-dial-arc', 'ma-dial-score', adjScore);

  /* ── Pie ── */
  drawPie('ma-pie', 'ma-pie-legend', [
    { label: 'MA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0), color: 'var(--accent)' },
    { label: 'KDJ',  value: kdj  ? (kdj.pass  === true ? 1 : kdj.pass  === 'warn' ? 0.5 : 0) : 0, color: 'var(--green)' },
    { label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? 0.5 : 0) : 0, color: 'var(--yellow)' },
    { label: 'Volume', value: vol_pass === true ? 1 : vol_pass === 'warn' ? 0.5 : 0, color: 'var(--orange)' },
  ].filter(s => s.value > 0));

  /* ── Checklist ── */
  const passCount = [f1_pass, f2_pass, f3_pass, kdj?.pass === true, macd?.pass === true, vol_pass === true].filter(Boolean).length;

  $('ma-checklist').innerHTML = [
    buildCheck('F1 — Price > MA5',  f1_pass, fmt2(pAboveMA5)),
    buildCheck('F2 — MA5 > MA20',   f2_pass, fmt2(ma5AboveMA20)),
    buildCheck('F3 — MA20 > MA50',  f3_pass, fmt2(ma20AboveMA50)),
    kdj
      ? buildCheck(`F4 — KDJ ${kdj.zone}`,  kdj.pass  === true ? true : kdj.pass  === false ? false : null, `K:${k?.toFixed(1)} D:${d?.toFixed(1)} J:${j?.toFixed(1)}`)
      : buildCheck('F4 — KDJ',  null, 'Not provided'),
    macd
      ? buildCheck(`F5 — MACD ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif} DEA:${dea}`)
      : buildCheck('F5 — MACD', null, 'Not provided'),
    vol != null
      ? buildCheck('F6 — Volume Ratio', vol_pass === true ? true : vol_pass === false ? false : null, `${vol}× ${vol >= 1.2 ? '✓ Strong' : vol >= 0.8 ? 'Moderate' : 'Weak'}`)
      : buildCheck('F6 — Volume', null, 'Not provided'),
  ].join('');

  updateMeter('ma-signal-meter', passCount, 6);

  /* ── Alignment grid ── */
  $('ma-alignment-grid').innerHTML = [
    ['Price vs MA20', pAboveMA20,   pAboveMA20 >= 0 && pAboveMA20 <= 2 ? 'green' : pAboveMA20 > 10 ? 'red' : pAboveMA20 > 5 ? 'yellow' : 'accent'],
    ['Price vs MA5',  pAboveMA5,    pAboveMA5  >= 0 ? 'green' : 'red'],
    ['Price vs MA50', pAboveMA50,   pAboveMA50 >= 0 ? 'green' : 'red'],
    ['MA5 vs MA20',   ma5AboveMA20, ma5AboveMA20  > 0 ? 'green' : 'red'],
    ['MA20 vs MA50',  ma20AboveMA50, ma20AboveMA50 > 0 ? 'green' : 'red'],
  ].map(([l, v, c]) =>
    `<div class="stat-cell">
      <div class="stat-label">${l}</div>
      <div class="stat-value ${c}">${v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—'}</div>
    </div>`
  ).join('');

  updateRange('ma-range-fill', 'ma-range-marker', 'ma-range-label', Math.max(0, pAboveMA20 || 0), 12);

  /* ── Trade Plan ── */
  buildPricePlan('ma-price-block', 'ma-tradeplan-card', price, atr);
}

function resetMA() {
  ['ma-price', 'ma-ma5', 'ma-ma20', 'ma-ma50',
   'ma-k', 'ma-d', 'ma-j',
   'ma-dif', 'ma-dea', 'ma-hist',
   'ma-vol', 'ma-rsi', 'ma-atr',
  ].forEach(id => { const el = $(id); if (el) el.value = ''; });
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

  if (!price || !e8 || !e21 || !e55) {
    $('ema-result').style.display = 'none';
    return;
  }
  $('ema-result').style.display = '';

  const k      = num('ema-k');
  const d      = num('ema-d');
  const j      = num('ema-j');
  const dif    = num('ema-dif');
  const dea    = num('ema-dea');
  const vol    = num('ema-vol');
  const atr    = num('ema-atr');
  const bidask = num('ema-bidask');
  const beta   = num('ema-beta');
  const open   = num('ema-open');
  const prev   = num('ema-prev');
  const high   = num('ema-high');
  const low    = num('ema-low');
  const w52h   = num('ema-52h');
  const w52l   = num('ema-52l');

  /* ── Distance calculations ── */
  const pAboveE8    = pct(price, e8);
  const pAboveE21   = pct(price, e21);
  const pAboveE55   = pct(price, e55);
  const e8AboveE21  = pct(e8,  e21);
  const e21AboveE55 = pct(e21, e55);

  /* ── Filter pass/fail ── */
  const f1_pass  = price > e8;
  const f2_pass  = e8    > e21;
  const f3_pass  = e21   > e55;
  const fullStack = f1_pass && f2_pass && f3_pass;
  const kdj      = getKDJ(k, d, j);
  const macd     = getMACDZone(dif, dea);
  const vol_pass = vol == null ? null
                 : vol >= 1.2  ? true
                 : vol >= 0.8  ? 'warn'
                 : false;

  /* ── Weighted score ── */
  let score = 0, total = 0;
  const add = (pass, w) => {
    total += w;
    if (pass === true)        score += w;
    else if (pass === 'warn') score += w * 0.5;
  };
  add(f1_pass,              20);
  add(f2_pass,              20);
  add(f3_pass,              20);
  add(kdj  ? kdj.pass  : null, 15);
  add(macd ? macd.pass : null, 15);
  add(vol_pass,             10);

  const stretchPct = Math.abs(pAboveE8 || 0);
  let penalty = 0;
  if (stretchPct > 10) penalty = -15;
  else if (stretchPct > 5) penalty = -7;
  const adjScore = Math.min(100, Math.max(0, (score / total) * 100 + penalty));

  const grade = getGrade(e21AboveE55 || 0);

  /* ── Decision ── */
  const momentumOk = (!kdj  || kdj.pass  !== false)
                  && (!macd || macd.pass !== false);

  let decision, riskLevel, posSize;
  if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
    decision = 'SKIP';   riskLevel = 'High Risk';   posSize = '0%';
  } else if (adjScore >= 72) {
    decision = 'PROCEED'; riskLevel = 'Low Risk';    posSize = stretchPct > 5 ? '50%' : '100%';
  } else if (adjScore >= 52) {
    decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
  } else {
    decision = 'WATCH';  riskLevel = 'Medium Risk'; posSize = '25%';
  }

  /* ── Decision Strip ── */
  const strip = $('ema-decision-strip');
  strip.className = `decision-strip ${decision === 'PROCEED' ? 'proceed' : decision === 'SKIP' ? 'skip' : 'watch'}`;

  const badge = $('ema-d-badge');
  badge.className   = `d-badge ${decision === 'PROCEED' ? 'proceed' : decision === 'SKIP' ? 'skip' : 'watch'}`;
  badge.textContent = decision;

  const rp = $('ema-risk-pill');
  rp.className   = `risk-pill ${riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium'}`;
  rp.textContent = riskLevel;

  const gb = $('ema-grade-badge');
  gb.className   = `grade-badge ${grade.cls}`;
  gb.textContent = `${grade.e} ${grade.g}`;
  gb.style.display = '';

  $('ema-d-meta').innerHTML = `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      &nbsp; EMA8: <span style="color:var(--text)">${fmt(e8)}</span>
      EMA21: <span style="color:var(--text)">${fmt(e21)}</span>
      EMA55: <span style="color:var(--text)">${fmt(e55)}</span>
    </div>
    <div>Full Bull Stack: <span style="color:${fullStack ? 'var(--green)' : 'var(--red)'}">${fullStack ? '✅ Yes' : '✘ No'}</span>
      &nbsp; Size: <span style="color:${posSize === '100%' ? 'var(--green)' : 'var(--yellow)'}">${posSize}</span>
    </div>
  `;

  /* ── Advice ── */
  const adv = $('ema-advice');
  if (decision === 'PROCEED') {
    const stretch = pAboveE8 != null ? pAboveE8.toFixed(1) : '—';
    adv.textContent = stretchPct > 5
      ? `⚠️ EMA stack confirmed but price is ${stretch}% above EMA8 — overextended. Use ${posSize} size and wait for a partial pullback to EMA8.`
      : `✅ Full EMA bull stack. Price is ${stretch}% above EMA8 (ideal ≤2%). ${posSize} position. Stop Loss = Price − (ATR × 1.5).`;
    adv.className = 'advice-box green';
  } else if (decision === 'WATCH') {
    adv.textContent = `⚠️ Partial EMA setup. Wait for Price > EMA8 > EMA21 > EMA55 with KDJ and MACD confirmation before entering.`;
    adv.className = 'advice-box yellow';
  } else {
    const missing = [
      !f1_pass           && 'Price < EMA8',
      !f2_pass           && 'EMA8 < EMA21',
      !f3_pass           && 'EMA21 < EMA55',
      kdj?.pass  === false && 'KDJ Bearish',
      macd?.pass === false && 'MACD Bearish',
    ].filter(Boolean);
    adv.textContent = `🔴 Skip — broken EMA stack. Failed: ${missing.join(', ')}.`;
    adv.className = 'advice-box red';
  }

  /* ── Dial ── */
  updateDial('ema-dial-arc', 'ema-dial-score', adjScore);

  /* ── Pie ── */
  drawPie('ema-pie', 'ema-pie-legend', [
    { label: 'EMA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0), color: 'var(--accent)' },
    { label: 'KDJ',     value: kdj  ? (kdj.pass  === true ? 1 : kdj.pass  === 'warn' ? 0.5 : 0) : 0, color: 'var(--green)' },
    { label: 'MACD',    value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? 0.5 : 0) : 0, color: 'var(--yellow)' },
    { label: 'Volume',  value: vol_pass === true ? 1 : vol_pass === 'warn' ? 0.5 : 0, color: 'var(--orange)' },
    { label: 'Bid/Ask', value: bidask != null ? (bidask >= 60 ? 1 : bidask >= 40 ? 0.5 : 0) : 0, color: 'var(--red)' },
  ].filter(s => s.value > 0));

  /* ── Checklist ── */
  const passCount = [f1_pass, f2_pass, f3_pass, kdj?.pass === true, macd?.pass === true, vol_pass === true].filter(Boolean).length;

  $('ema-checklist').innerHTML = [
    buildCheck('F1 — Price > EMA8',  f1_pass, pAboveE8  != null ? (pAboveE8  >= 0 ? '+' : '') + pAboveE8.toFixed(2)  + '%' : '—'),
    buildCheck('F2 — EMA8 > EMA21', f2_pass, e8AboveE21 != null ? (e8AboveE21 >= 0 ? '+' : '') + e8AboveE21.toFixed(2) + '%' : '—'),
    buildCheck('F3 — EMA21 > EMA55', f3_pass, e21AboveE55 != null ? (e21AboveE55 >= 0 ? '+' : '') + e21AboveE55.toFixed(2) + '%' : '—'),
    kdj
      ? buildCheck(`F4 — KDJ ${kdj.zone}`,  kdj.pass  === true ? true : kdj.pass  === false ? false : null, `K${k?.toFixed(1)} D${d?.toFixed(1)} J${j?.toFixed(1)}`)
      : buildCheck('F4 — KDJ',  null, 'Not provided'),
    macd
      ? buildCheck(`F5 — MACD ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif} DEA:${dea}`)
      : buildCheck('F5 — MACD', null, 'Not provided'),
    vol != null
      ? buildCheck('F6 — Volume Ratio', vol_pass === true ? true : vol_pass === false ? false : null, `${vol}× ${vol >= 1.2 ? '✓ Strong' : vol >= 0.8 ? 'Moderate' : 'Weak'}`)
      : buildCheck('F6 — Volume', null, 'Not provided'),
  ].join('');

  updateMeter('ema-signal-meter', passCount, 6);

  /* ── Alignment grid ── */
  $('ema-alignment-grid').innerHTML = [
    ['% Above EMA8',   pAboveE8,    pAboveE8  >= 0 && pAboveE8 <= 2 ? 'green' : pAboveE8 > 10 ? 'red' : pAboveE8 > 5 ? 'yellow' : pAboveE8 >= 0 ? 'accent' : 'red'],
    ['% Above EMA21',  pAboveE21,   pAboveE21  >= 0 ? 'accent' : 'red'],
    ['% Above EMA55',  pAboveE55,   pAboveE55  >= 0 ? 'green'  : 'red'],
    ['EMA8 vs EMA21',  e8AboveE21,  e8AboveE21  > 0 ? 'green'  : 'red'],
    ['EMA21 vs EMA55', e21AboveE55, e21AboveE55 > 0 ? 'green'  : 'red'],
    ['Full Bull Stack', null, fullStack ? 'green' : 'red', fullStack ? '✅ Yes' : '✘ No'],
  ].map(([l, v, c, override]) => {
    const display = override || (v != null ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—');
    return `<div class="stat-cell">
      <div class="stat-label">${l}</div>
      <div class="stat-value ${c}">${display}</div>
    </div>`;
  }).join('');

  updateRange('ema-range-fill', 'ema-range-marker', 'ema-range-label', Math.max(0, e21AboveE55 || 0), 12);

  /* ── Price Context (optional fields) ── */
  const ctx    = $('ema-price-context');
  const hasCtx = (high != null && low != null) || prev != null || (w52h != null && w52l != null) || beta != null || bidask != null;
  ctx.style.display = hasCtx ? '' : 'none';

  if (hasCtx) {
    const cells = [];

    if (prev != null) {
      const chg = pct(price, prev);
      cells.push(`<div class="stat-cell">
        <div class="stat-label">vs Prev Close</div>
        <div class="stat-value ${chg >= 0 ? 'green' : 'red'}">${chg >= 0 ? '+' : ''}${chg?.toFixed(2)}%</div>
      </div>`);
    }
    if (open != null) {
      const gapPct = pct(price, open);
      cells.push(`<div class="stat-cell">
        <div class="stat-label">Gap from Open</div>
        <div class="stat-value ${gapPct >= 0 ? 'green' : 'red'}">${gapPct >= 0 ? '+' : ''}${gapPct?.toFixed(2)}%</div>
      </div>`);
    }
    if (w52h != null && w52l != null) {
      const fromH = pct(price, w52h);
      const fromL = pct(price, w52l);
      cells.push(`<div class="stat-cell">
        <div class="stat-label">From 52wk High</div>
        <div class="stat-value ${fromH >= -5 ? 'green' : fromH >= -20 ? 'accent' : 'red'}">${fromH?.toFixed(2)}%</div>
      </div>`);
      cells.push(`<div class="stat-cell">
        <div class="stat-label">From 52wk Low</div>
        <div class="stat-value accent">+${fromL?.toFixed(2)}%</div>
      </div>`);
    }
    if (beta != null) {
      const bc = beta > 1.5 ? 'red' : beta > 1.0 ? 'yellow' : 'green';
      cells.push(`<div class="stat-cell">
        <div class="stat-label">Beta</div>
        <div class="stat-value ${bc}">${beta.toFixed(3)}</div>
        <div class="stat-sub">${beta > 1.5 ? 'High vol' : beta > 1.0 ? 'Above mkt' : 'Normal'}</div>
      </div>`);
    }
    if (bidask != null) {
      const bc = bidask >= 60 ? 'green' : bidask >= 40 ? 'accent' : 'red';
      cells.push(`<div class="stat-cell">
        <div class="stat-label">Bid/Ask Ratio</div>
        <div class="stat-value ${bc}">${bidask.toFixed(1)}%</div>
        <div class="stat-sub">${bidask >= 60 ? 'Strong demand' : bidask >= 40 ? 'Balanced' : 'Sellers dominate'}</div>
      </div>`);
    }

    $('ema-ctx-grid').innerHTML = cells.join('');

    // Day range bar
    if (high != null && low != null && high > low) {
      const rng     = ((price - low) / (high - low)) * 100;
      const clamped = Math.min(100, Math.max(0, rng));
      const fill    = $('ema-day-fill');
      const marker  = $('ema-day-marker');
      const pctEl   = $('ema-day-pct');
      if (fill)   fill.style.width   = clamped + '%';
      if (marker) marker.style.left  = clamped + '%';
      if (pctEl)  pctEl.textContent  = rng.toFixed(1) + '% of range';
      $('ema-day-low').textContent  = 'Low '  + fmt(low,  4);
      $('ema-day-high').textContent = 'High ' + fmt(high, 4);
    }
  }

  /* ── Trade Plan ── */
  buildPricePlan('ema-price-block', 'ema-tradeplan-card', price, atr);
}

function resetEMA() {
  ['ema-price', 'ema-ema8', 'ema-ema21', 'ema-ema55',
   'ema-k', 'ema-d', 'ema-j',
   'ema-dif', 'ema-dea', 'ema-hist',
   'ema-vol', 'ema-rsi', 'ema-atr',
   'ema-open', 'ema-prev', 'ema-high', 'ema-low',
   'ema-52h', 'ema-52l', 'ema-bidask', 'ema-beta',
  ].forEach(id => { const el = $(id); if (el) el.value = ''; });
  $('ema-result').style.display = 'none';
}