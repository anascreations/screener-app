/* ═══════════════════════════════════════════════════════════
   TRADEMATRIX — MOOMOO MALAYSIA FIX
   tradematrix-moomoo.js  v1.0
   Modules:
     • Chart Setup Guide (static HTML, no JS needed)
     • Value Deriver — ATR, MA, RSI, Volume Ratio calculators
     • Dual OCR — merge two Tesseract reads (info page + chart)
     • Source Map (static HTML, no JS needed)
═══════════════════════════════════════════════════════════ */

'use strict';

// ── Helpers (safe re-use, won't conflict with existing $b) ──────
const _mm$ = id => document.getElementById(id);

// ── Sub-tab switcher ────────────────────────────────────────────
function mmSwitch(panel, btn) {
  document.querySelectorAll('.mm-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.mm-tab').forEach(b => b.classList.remove('active'));
  const p = _mm$('mm-' + panel);
  if (p) p.classList.add('active');
  if (btn) btn.classList.add('active');
  // Lazy-init ATR rows on first open
  if (panel === 'derive') mmInitATRRows();
}

// ── Tab integration ─────────────────────────────────────────────
const _origSwitchTabMM = window.switchTab;
window.switchTab = function(tab) {
  if (tab === 'moomoo') {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const p = _mm$('panel-moomoo');
    const btn = document.querySelector('[data-tab="moomoo"]');
    if (p) p.classList.add('active');
    if (btn) btn.classList.add('active');
  } else {
    _origSwitchTabMM(tab);
  }
};

/* ══════════════════════════════════════════════════════════
   VALUE DERIVER — ATR CALCULATOR
══════════════════════════════════════════════════════════ */

let _mmATRRows = [];

function mmInitATRRows() {
  if (_mmATRRows.length > 0) return; // already initialised
  // Add 5 empty rows by default
  for (let i = 0; i < 5; i++) mmAddATRRow();
}

function mmAddATRRow() {
  _mmATRRows.push({ id: Date.now() + Math.random() });
  mmRenderATRRows();
}

function mmRenderATRRows() {
  const wrap = _mm$('mm-atr-rows'); if (!wrap) return;
  wrap.innerHTML = `
    <div class="mm-ohlc-hdr">
      <span>#</span><span>High</span><span>Low</span><span>Close (this bar)</span><span></span>
    </div>
    ${_mmATRRows.map((r, i) => `
      <div class="mm-ohlc-row" id="mm-ohlc-${r.id}">
        <span class="mm-ohlc-num">${i + 1}</span>
        <input type="number" step="0.0001" placeholder="High" id="mm-h-${r.id}"/>
        <input type="number" step="0.0001" placeholder="Low"  id="mm-l-${r.id}"/>
        <input type="number" step="0.0001" placeholder="Close" id="mm-c-${r.id}"/>
        <button onclick="mmRemoveATRRow('${r.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:.2rem .4rem">✕</button>
      </div>`).join('')}`;
}

function mmRemoveATRRow(id) {
  _mmATRRows = _mmATRRows.filter(r => String(r.id) !== String(id));
  mmRenderATRRows();
}

function mmResetATR() {
  _mmATRRows = [];
  for (let i = 0; i < 5; i++) mmAddATRRow();
  const res = _mm$('mm-atr-result'); if (res) res.style.display = 'none';
}

function mmCalcATR() {
  const res = _mm$('mm-atr-result'); if (!res) return;

  // Collect OHLC rows
  const candles = [];
  _mmATRRows.forEach(r => {
    const h = parseFloat(_mm$(`mm-h-${r.id}`)?.value);
    const l = parseFloat(_mm$(`mm-l-${r.id}`)?.value);
    const c = parseFloat(_mm$(`mm-c-${r.id}`)?.value);
    if (!isNaN(h) && !isNaN(l) && !isNaN(c)) candles.push({ h, l, c });
  });

  if (candles.length < 2) {
    res.style.display = '';
    res.innerHTML = '<div class="advice-box red" style="font-size:13px">⚠️ Need at least 2 candles with High, Low and Close to calculate ATR.</div>';
    return;
  }

  // True Range for each candle (using previous close)
  const trValues = [];
  for (let i = 1; i < candles.length; i++) {
    const { h, l } = candles[i];
    const prevC = candles[i - 1].c;
    const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    trValues.push(tr);
  }

  // ATR = simple average of TR values (Wilder's smoothing approximation)
  const atr = trValues.reduce((s, v) => s + v, 0) / trValues.length;
  // Also ATR1 (just last TR — what Moomoo ATR1 shows)
  const atr1 = trValues[trValues.length - 1];

  res.style.display = '';
  res.innerHTML = `
    <div class="biz-stats-row" style="margin-bottom:.75rem">
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">ATR1 (last bar TR)</div>
        <div class="biz-kpi-val accent">${atr1.toFixed(4)}</div>
        <div class="biz-kpi-sub">Use this for Moomoo ATR1</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">ATR Avg (${trValues.length} bars)</div>
        <div class="biz-kpi-val">${atr.toFixed(4)}</div>
        <div class="biz-kpi-sub">Simple average TR</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">1.5× ATR Stop Distance</div>
        <div class="biz-kpi-val red">${(atr1 * 1.5).toFixed(4)}</div>
        <div class="biz-kpi-sub">Typical stop buffer</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">2× ATR Stop Distance</div>
        <div class="biz-kpi-val red">${(atr1 * 2).toFixed(4)}</div>
        <div class="biz-kpi-sub">Conservative stop buffer</div>
      </div>
    </div>
    <div class="advice-box green" style="font-size:13px">
      ✅ Copy <strong>${atr1.toFixed(4)}</strong> (ATR1) into the ATR field in your MA/EMA/Swing tab.
      <br>The Sizer tab also accepts this value for stop-loss calculation.
    </div>
    <div style="margin-top:.6rem;font-size:12px;color:var(--dim)">
      Individual TR values: ${trValues.map((v,i) => `Bar${i+1}: ${v.toFixed(4)}`).join(' · ')}
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   VALUE DERIVER — MA / EMA CALCULATOR
══════════════════════════════════════════════════════════ */

function mmCalcMA() {
  const res      = _mm$('mm-ma-result'); if (!res) return;
  const period   = parseInt(_mm$('mm-ma-period')?.value) || 5;
  const rawInput = (_mm$('mm-ma-prices')?.value || '').trim();

  const prices = rawInput.split(/[\s,]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

  if (prices.length < period) {
    res.style.display = '';
    res.innerHTML = `<div class="advice-box red" style="font-size:13px">⚠️ Need at least ${period} prices for MA${period}. You entered ${prices.length}.</div>`;
    return;
  }

  // Simple MA = average of first (newest) N prices
  const slice = prices.slice(0, period);
  const ma    = slice.reduce((s, v) => s + v, 0) / period;

  // Also EMA for same period (for EMA tab)
  const k = 2 / (period + 1);
  let ema = prices[prices.length - 1]; // seed with oldest
  for (let i = prices.length - 2; i >= 0; i--) {
    ema = prices[i] * k + ema * (1 - k);
  }

  res.style.display = '';
  res.innerHTML = `
    <div class="biz-stats-row" style="margin-bottom:.75rem">
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">MA${period} (Simple)</div>
        <div class="biz-kpi-val accent">${ma.toFixed(4)}</div>
        <div class="biz-kpi-sub">Average of ${period} closes</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">EMA${period} (Exponential)</div>
        <div class="biz-kpi-val">${ema.toFixed(4)}</div>
        <div class="biz-kpi-sub">EMA — more weight on recent</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">Prices Used</div>
        <div class="biz-kpi-val">${prices.length}</div>
        <div class="biz-kpi-sub">Entered</div>
      </div>
    </div>
    <div class="advice-box green" style="font-size:13px">
      ✅ Copy <strong>MA${period}: ${ma.toFixed(4)}</strong> into the MA${period} field.
      If you need EMA${period}, use <strong>${ema.toFixed(4)}</strong> instead.
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   VALUE DERIVER — RSI CALCULATOR
══════════════════════════════════════════════════════════ */

function mmCalcRSI() {
  const res      = _mm$('mm-rsi-result'); if (!res) return;
  const period   = parseInt(_mm$('mm-rsi-period')?.value) || 14;
  const rawInput = (_mm$('mm-rsi-prices')?.value || '').trim();
  const prices   = rawInput.split(/[\s,]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

  if (prices.length < period + 1) {
    res.style.display = '';
    res.innerHTML = `<div class="advice-box red" style="font-size:13px">⚠️ Need at least ${period + 1} prices for RSI${period}. You entered ${prices.length}.</div>`;
    return;
  }

  // RSI — Wilder smoothing. Prices newest→oldest, reverse to oldest→newest for calculation
  const p = [...prices].reverse();
  const gains = [], losses = [];
  for (let i = 1; i < p.length; i++) {
    const diff = p[i] - p[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  // Initial averages (simple average for first period)
  let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;

  // Wilder smoothing for remaining values
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  const rs  = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

  const zone = rsi >= 70 ? ['red', 'Overbought — caution, avoid chasing'] :
               rsi >= 60 ? ['yellow', 'Bullish momentum — healthy range'] :
               rsi >= 50 ? ['green', 'Neutral-bullish — acceptable entry zone'] :
               rsi >= 40 ? ['yellow', 'Weakening — wait for recovery above 50'] :
               ['red', 'Oversold — potential reversal but confirm first'];

  res.style.display = '';
  res.innerHTML = `
    <div class="biz-stats-row" style="margin-bottom:.75rem">
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">RSI${period}</div>
        <div class="biz-kpi-val" style="color:var(--${zone[0]})">${rsi.toFixed(3)}</div>
        <div class="biz-kpi-sub">${zone[1]}</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">Avg Gain</div>
        <div class="biz-kpi-val green">${avgGain.toFixed(5)}</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">Avg Loss</div>
        <div class="biz-kpi-val red">${avgLoss.toFixed(5)}</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">RS Ratio</div>
        <div class="biz-kpi-val">${rs.toFixed(3)}</div>
      </div>
    </div>
    <div class="advice-box ${zone[0]}" style="font-size:13px">
      ✅ Copy <strong>RSI${period}: ${rsi.toFixed(3)}</strong> into the RSI field. ${zone[1]}.
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   VALUE DERIVER — VOLUME RATIO ESTIMATOR
══════════════════════════════════════════════════════════ */

function mmCalcVolRatio() {
  const res      = _mm$('mm-vol-result'); if (!res) return;
  const todayVol = parseFloat(_mm$('mm-vol-today')?.value);
  const manualAvg= parseFloat(_mm$('mm-vol-avg')?.value);
  const histRaw  = (_mm$('mm-vol-hist')?.value || '').trim();

  if (isNaN(todayVol) || todayVol <= 0) {
    res.style.display = '';
    res.innerHTML = '<div class="advice-box red" style="font-size:13px">⚠️ Enter today\'s volume.</div>';
    return;
  }

  let avgVol = manualAvg;
  if (isNaN(avgVol) || avgVol <= 0) {
    // Calculate from history
    const hist = histRaw.split(/[\s,]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v) && v > 0);
    if (hist.length < 3) {
      res.style.display = '';
      res.innerHTML = '<div class="advice-box red" style="font-size:13px">⚠️ Enter either Avg Daily Volume OR at least 3 historical volume values.</div>';
      return;
    }
    avgVol = hist.reduce((s, v) => s + v, 0) / hist.length;
  }

  const volRatio = todayVol / avgVol;
  const zone = volRatio >= 2.0 ? ['green',  '🚀 Very high volume — strong conviction, institutional activity likely'] :
               volRatio >= 1.5 ? ['green',  '✅ Above average — good participation, supports the move'] :
               volRatio >= 1.0 ? ['yellow', '🟡 Average volume — acceptable but watch for confirmation'] :
               volRatio >= 0.7 ? ['yellow', '⚠️ Below average — weak participation, be cautious'] :
               ['red',    '🔴 Very low volume — avoid entries, likely false signal'];

  // Format large numbers
  const fmt = n => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toFixed(0);

  res.style.display = '';
  res.innerHTML = `
    <div class="biz-stats-row" style="margin-bottom:.75rem">
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">Volume Ratio</div>
        <div class="biz-kpi-val" style="color:var(--${zone[0]})">${volRatio.toFixed(2)}</div>
        <div class="biz-kpi-sub">Today ÷ Average</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">Today's Volume</div>
        <div class="biz-kpi-val">${fmt(todayVol)}</div>
      </div>
      <div class="biz-kpi-card">
        <div class="biz-kpi-label">Average Volume</div>
        <div class="biz-kpi-val">${fmt(avgVol)}</div>
      </div>
    </div>
    <div class="advice-box ${zone[0]}" style="font-size:13px">
      ✅ Volume Ratio = <strong>${volRatio.toFixed(2)}</strong>. Copy into the Volume Ratio field. ${zone[1]}.
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   DUAL OCR — Two screenshots merged into one fill
══════════════════════════════════════════════════════════ */

const _mmFiles = { info: null, chart: null };

function mmDualSelected(type, input) {
  const file = input?.files?.[0]; if (!file) return;
  _mmFiles[type] = file;
  const reader = new FileReader();
  reader.onload = e => {
    const thumb = _mm$(`mm-thumb-${type}`);
    const prev  = _mm$(`mm-prev-${type}`);
    const drop  = _mm$(`mm-drop-${type}`);
    if (thumb) thumb.src = e.target.result;
    if (prev)  prev.style.display  = 'block';
    if (drop)  drop.style.display  = 'none';
  };
  reader.readAsDataURL(file);
}

function mmFileDrop(event, type) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0]; if (!file) return;
  _mmFiles[type] = file;
  const fi = _mm$(`mm-file-${type}`);
  // Trigger same flow as file input
  const dt = new DataTransfer(); dt.items.add(file);
  if (fi) fi.files = dt.files;
  mmDualSelected(type, { files: [file] });
}

function mmClearDual(type) {
  _mmFiles[type] = null;
  const thumb = _mm$(`mm-thumb-${type}`);
  const prev  = _mm$(`mm-prev-${type}`);
  const drop  = _mm$(`mm-drop-${type}`);
  const fi    = _mm$(`mm-file-${type}`);
  if (thumb) thumb.src = '';
  if (prev)  prev.style.display  = 'none';
  if (drop)  drop.style.display  = '';
  if (fi)    fi.value = '';
}

function mmSetDualStatus(html, type) {
  const el = _mm$('mm-dual-status');
  if (!el) return;
  el.style.display = html ? '' : 'none';
  el.className = `img-status ${type || ''}`;
  el.innerHTML = html;
}

async function mmDualExtract() {
  const tab = _mm$('mm-dual-target')?.value || 'ma';

  if (!_mmFiles.info && !_mmFiles.chart) {
    mmSetDualStatus('⚠️ Upload at least one screenshot (stock info or chart).', 'warn');
    return;
  }

  mmSetDualStatus('<span class="img-spin"></span> Initialising OCR engine…', 'loading');

  // Reuse the existing Tesseract init from tradematrix.js
  const ok = await tmInitTesseract();
  if (!ok) {
    mmSetDualStatus('❌ OCR engine failed to load. Check internet connection.', 'error');
    return;
  }

  let mergedValues = {};

  // ── Extract info page ────────────────────────────────────
  if (_mmFiles.info) {
    mmSetDualStatus('<span class="img-spin"></span> Reading stock info page…', 'loading');
    try {
      const dataUrl = await _mmFileToDataURL(_mmFiles.info);
      const result  = await _tessWorker.recognize(dataUrl);
      const text    = result?.data?.text || '';
      if (text.trim()) {
        const infoVals = tmParseIndicators(text);
        // Info page is strongest source for: PRICE, HIGH, LOW, OPEN, PREV, VOL_RATIO, HIGH52, LOW52, BETA
        Object.assign(mergedValues, infoVals);
      }
    } catch(e) { console.warn('Info page OCR error:', e); }
  }

  // ── Extract chart page ───────────────────────────────────
  if (_mmFiles.chart) {
    mmSetDualStatus('<span class="img-spin"></span> Reading chart indicators…', 'loading');
    try {
      const dataUrl = await _mmFileToDataURL(_mmFiles.chart);
      const result  = await _tessWorker.recognize(dataUrl);
      const text    = result?.data?.text || '';
      if (text.trim()) {
        const chartVals = tmParseIndicators(text);
        // Chart is strongest source for: MA, EMA, KDJ, MACD, RSI, ATR, DMI, BB
        // Merge: chart values override info values for indicator-specific fields,
        // but keep info-sourced PRICE / VOL_RATIO if chart didn't get them
        const chartPriority = ['MA5','MA20','MA50','MA200','EMA8','EMA21','EMA55','EMA200',
                               'K','D','J','DIF','DEA','HIST','RSI','ATR','PDI','MDI','ADX','ADXR','BB_UPPER','BB_LOWER'];
        chartPriority.forEach(k => {
          if (chartVals[k] != null) mergedValues[k] = chartVals[k];
        });
        // Only use chart PRICE if info page didn't find it
        if (mergedValues.PRICE == null && chartVals.PRICE != null) mergedValues.PRICE = chartVals.PRICE;
        // Volume Ratio: prefer info page (it lives there), but take chart if info missed it
        if (mergedValues.VOL_RATIO == null && chartVals.VOL_RATIO != null) mergedValues.VOL_RATIO = chartVals.VOL_RATIO;
      }
    } catch(e) { console.warn('Chart OCR error:', e); }
  }

  // ── Populate fields ──────────────────────────────────────
  const filled = tmPopulateFromValues(tab, mergedValues);

  // ── Trigger calc ─────────────────────────────────────────
  const calcFn = { ma:'maCalc', ema:'emaCalc', gold:'goldCalc', bu:'bursaCalc', sw:'swingCalc' }[tab];
  if (calcFn && window[calcFn]) window[calcFn]();

  // ── Switch to target tab ─────────────────────────────────
  if (filled > 0 && window.switchTab) {
    setTimeout(() => window.switchTab(tab), 300);
  }

  // ── Report ───────────────────────────────────────────────
  const sources = [_mmFiles.info && 'info page', _mmFiles.chart && 'chart'].filter(Boolean).join(' + ');
  const gotKeys = Object.keys(mergedValues);
  const missing = ['PRICE','MA5','MA20','MA50','MA200','K','D','J','DIF','DEA','HIST','RSI','ATR','ADX','VOL_RATIO']
    .filter(k => mergedValues[k] == null);

  if (filled === 0) {
    mmSetDualStatus('⚠️ No values detected from either screenshot. Ensure chart indicators are fully visible with their label rows showing.', 'warn');
  } else {
    const missNote = missing.length > 0
      ? ` &nbsp;|&nbsp; ⚠️ Still missing: <strong>${missing.join(', ')}</strong> — use Value Deriver tab.`
      : ' ✅ All key fields found!';
    mmSetDualStatus(
      `✅ Merged ${filled} value${filled>1?'s':''} from ${sources} into ${tab.toUpperCase()} tab.`
      + ` Found: ${gotKeys.join(', ')}.${missNote}`,
      'success'
    );
  }
}

function _mmFileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════ */
(function injectMoomooStyles() {
  const s = document.createElement('style');
  s.textContent = `
    /* Tab colour */
    .moomoo-tab.active { color:#f97316 !important; border-bottom-color:#f97316 !important; }
    [data-theme="light"] .moomoo-tab.active { color:#c2410c !important; border-bottom-color:#c2410c !important; }

    /* Hero */
    .moomoo-hero { border-color:rgba(249,115,22,.2) !important; background:rgba(249,115,22,.03) !important; }

    /* Sub-tab bar */
    .mm-tabs {
      display:flex; gap:0; background:var(--card); border:1px solid var(--border);
      border-radius:10px; overflow:hidden; flex-wrap:wrap;
    }
    .mm-tab {
      flex:1; padding:.6rem 1rem; background:transparent; border:none;
      color:var(--dim); font-family:var(--mono); font-size:13px; font-weight:600;
      letter-spacing:.08em; cursor:pointer; transition:all .2s; white-space:nowrap;
      border-right:1px solid var(--border); text-transform:uppercase;
    }
    .mm-tab:last-child { border-right:none; }
    .mm-tab:hover { color:var(--text); background:rgba(249,115,22,.05); }
    .mm-tab.active { color:#f97316; background:rgba(249,115,22,.08); border-bottom:2px solid #f97316; }
    [data-theme="light"] .mm-tab { color:#5a7a94; }
    [data-theme="light"] .mm-tab.active { color:#c2410c; background:rgba(249,115,22,.06); border-bottom-color:#c2410c; }

    /* Sub panels */
    .mm-panel { display:none; flex-direction:column; gap:1rem; animation:tm-fadeUp .2s ease; }
    .mm-panel.active { display:flex; }

    /* Root-cause grid */
    .mm-cause-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:.6rem; }
    .mm-cause { display:flex; align-items:flex-start; gap:.6rem; padding:.65rem .75rem;
      background:var(--card2); border:1px solid var(--border); border-radius:8px; font-size:13px; }
    .mm-cause-icon { font-size:1.2rem; flex-shrink:0; margin-top:.05rem; }
    .mm-cause-desc { font-size:11px; color:var(--dim); margin-top:.15rem; }
    .mm-cause-icon.red    { filter:none; }
    .mm-cause-icon.yellow { filter:none; }

    /* Step list */
    .mm-step-list { display:flex; flex-direction:column; gap:.6rem; margin-bottom:.85rem; }
    .mm-step { display:flex; gap:.75rem; align-items:flex-start;
      padding:.75rem; background:var(--card2); border:1px solid var(--border); border-radius:8px; }
    .mm-step-special { border-color:rgba(255,215,0,.3); background:rgba(255,215,0,.04); }
    .mm-step-num { min-width:28px; height:28px; border-radius:50%;
      background:rgba(0,200,240,.15); color:var(--accent); font-weight:700;
      font-size:13px; display:flex; align-items:center; justify-content:center;
      flex-shrink:0; border:1px solid rgba(0,200,240,.25); }
    .mm-step-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:.2rem; }
    .mm-step-desc  { font-size:12px; color:var(--dim); margin-bottom:.3rem; line-height:1.5; }
    .mm-step-path  { font-size:11px; font-family:var(--mono); background:rgba(0,200,240,.08);
      border:1px solid rgba(0,200,240,.15); padding:.2rem .5rem; border-radius:4px;
      color:var(--accent); margin-bottom:.2rem; line-height:1.6; }
    .mm-step-values { font-size:11px; color:var(--dim); }
    .mm-step-values code { background:rgba(255,255,255,.06); padding:.05rem .3rem;
      border-radius:3px; font-family:var(--mono); color:var(--text); }

    /* Tips box */
    .mm-tip-box { background:var(--card2); border:1px solid var(--border); border-radius:8px; padding:.85rem; }
    .mm-tip-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:.5rem; }
    .mm-tip-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:.35rem; }
    .mm-tip-item { font-size:12px; padding:.25rem .5rem; border-radius:4px; }
    .mm-tip-item.green { color:var(--green);  background:rgba(0,232,122,.06);  border:1px solid rgba(0,232,122,.15); }
    .mm-tip-item.red   { color:var(--red);    background:rgba(240,58,74,.06);  border:1px solid rgba(240,58,74,.15); }
    .mm-tip-item.yellow{ color:var(--yellow); background:rgba(245,200,66,.06); border:1px solid rgba(245,200,66,.15); }

    /* OHLC rows for ATR */
    .mm-ohlc-hdr {
      display:grid; grid-template-columns:30px 1fr 1fr 1fr 30px;
      gap:.4rem; font-size:10px; color:var(--dim); text-transform:uppercase;
      letter-spacing:.1em; margin-bottom:.25rem; padding:0 .2rem;
    }
    .mm-ohlc-row {
      display:grid; grid-template-columns:30px 1fr 1fr 1fr 30px;
      gap:.4rem; align-items:center; margin-bottom:.3rem;
    }
    .mm-ohlc-num { color:var(--dim); font-size:12px; text-align:center; }

    /* Dual OCR */
    .mm-dual-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    @media(max-width:600px) { .mm-dual-row { grid-template-columns:1fr; } }
    .mm-dual-box { background:var(--card2); border:1px solid var(--border); border-radius:10px; padding:.85rem; }
    .mm-dual-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:.25rem; }
    .mm-dual-desc  { font-size:11px; color:var(--dim); margin-bottom:.65rem; line-height:1.5; }
    .mm-dual-drop  { border:2px dashed var(--border2); border-radius:8px; padding:1.5rem .75rem;
      text-align:center; cursor:pointer; font-size:13px; color:var(--dim); transition:all .2s; }
    .mm-dual-drop:hover { border-color:var(--accent); color:var(--accent); background:rgba(0,200,240,.04); }
    .mm-drop-icon { font-size:2rem; margin-bottom:.4rem; }
    .mm-dual-preview { margin-top:.5rem; }

    /* Light theme */
    [data-theme="light"] .mm-step     { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .mm-cause    { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .mm-tip-box  { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .mm-dual-box { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .mm-step-path{ background:rgba(0,136,187,.07); border-color:rgba(0,136,187,.2); }
    [data-theme="light"] .mm-step-values code { background:rgba(0,0,0,.06); }
  `;
  document.head.appendChild(s);
})();

/* Boot: init ATR rows when DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  mmInitATRRows();
});
