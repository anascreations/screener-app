function switchEnhTab(id) {
    document.querySelectorAll('.enh-tab-btn').forEach(t =>
        t.classList.toggle('active', t.dataset.et === id));
    document.querySelectorAll('.enh-sub-panel').forEach(p =>
        p.classList.toggle('active', p.id === 'enh-pnl-' + id));
}

function resetEnhance() {
    const ids = [
        'enh-st-h','enh-st-l','enh-st-c','enh-st-atr','enh-st-mult','enh-st-prev',
        'enh-fc-price','enh-fc-ma5','enh-fc-ma20','enh-fc-ma50','enh-fc-ma200',
        'enh-fc-k','enh-fc-d','enh-fc-j','enh-fc-rsi',
        'enh-fc-dif','enh-fc-dea','enh-fc-hist',
        'enh-fc-adx','enh-fc-pdi','enh-fc-mdi','enh-fc-adxr',
        'enh-fc-atr','enh-fc-vol','enh-fc-st','enh-fc-bbu','enh-fc-bbl','enh-fc-vwap',
        'enh-en-price','enh-en-ma20','enh-en-ma5','enh-en-atr',
        'enh-en-k','enh-en-d','enh-en-j',
        'enh-en-adx','enh-en-pdi','enh-en-mdi','enh-en-hist','enh-en-vol',
        'enh-cp-o1','enh-cp-h1','enh-cp-l1','enh-cp-c1',
        'enh-cp-o2','enh-cp-h2','enh-cp-l2','enh-cp-c2',
        'enh-cp-o3','enh-cp-h3','enh-cp-l3','enh-cp-c3',
        'enh-cp-atr','enh-cp-vol',
    ];
    ids.forEach(id => { const el = $(id); if (el) el.value = ''; });
    const selects = ['enh-st-prev-dir','enh-fc-ichi','enh-cp-trend','enh-cp-sr'];
    selects.forEach(id => { const el = $(id); if (el) el.value = el.options?.[0]?.value || ''; });
    ['enh-st-result','enh-fc-result','enh-en-result','enh-cp-result'].forEach(id => {
        const el = $(id); if (el) el.style.display = 'none';
    });
    switchEnhTab('st');
}


function fillForecastFromMA() {
    const map = {
        'ma-price' : 'enh-fc-price', 'ma-ma5'  : 'enh-fc-ma5',
        'ma-ma20'  : 'enh-fc-ma20',  'ma-ma50' : 'enh-fc-ma50',
        'ma-ma200' : 'enh-fc-ma200',
        'ma-k'     : 'enh-fc-k',     'ma-d'    : 'enh-fc-d',
        'ma-j'     : 'enh-fc-j',     'ma-rsi'  : 'enh-fc-rsi',
        'ma-dif'   : 'enh-fc-dif',   'ma-dea'  : 'enh-fc-dea',
        'ma-hist'  : 'enh-fc-hist',  'ma-adx'  : 'enh-fc-adx',
        'ma-pdi'   : 'enh-fc-pdi',   'ma-mdi'  : 'enh-fc-mdi',
        'ma-adxr'  : 'enh-fc-adxr',  'ma-atr'  : 'enh-fc-atr',
        'ma-vol'   : 'enh-fc-vol',   'ma-st'   : 'enh-fc-st',
    };
    let filled = 0;
    Object.entries(map).forEach(([src, dst]) => {
        const s = $(src), d = $(dst);
        if (s && d && s.value.trim()) { d.value = s.value; filled++; }
    });
    if (filled > 0) { switchTab('enhance'); switchEnhTab('fc'); }
    else alert('Run MA Calc first so there are values to transfer.');
}

function fillForecastFromEMA() {
    const map = {
        'ema-price'  : 'enh-fc-price', 'ema-ema8'  : 'enh-fc-ma5',
        'ema-ema21'  : 'enh-fc-ma20',  'ema-ema55' : 'enh-fc-ma50',
        'ema-ema200' : 'enh-fc-ma200',
        'ema-k'      : 'enh-fc-k',     'ema-d'     : 'enh-fc-d',
        'ema-j'      : 'enh-fc-j',     'ema-rsi'   : 'enh-fc-rsi',
        'ema-dif'    : 'enh-fc-dif',   'ema-dea'   : 'enh-fc-dea',
        'ema-hist'   : 'enh-fc-hist',  'ema-adx'   : 'enh-fc-adx',
        'ema-pdi'    : 'enh-fc-pdi',   'ema-mdi'   : 'enh-fc-mdi',
        'ema-adxr'   : 'enh-fc-adxr',  'ema-atr'   : 'enh-fc-atr',
        'ema-vol'    : 'enh-fc-vol',   'ema-st'    : 'enh-fc-st',
        'ema-vwap'   : 'enh-fc-vwap',
    };
    // Also copy Ichimoku select value
    const ichiSrc = document.getElementById('ema-ichi');
    const ichiDst = document.getElementById('enh-fc-ichi');
    if (ichiSrc && ichiDst && ichiSrc.value) ichiDst.value = ichiSrc.value;

    let filled = 0;
    Object.entries(map).forEach(([src, dst]) => {
        const s = $(src), d = $(dst);
        if (s && d && s.value.trim()) { d.value = s.value; filled++; }
    });
    if (filled > 0) { switchTab('enhance'); switchEnhTab('fc'); }
    else alert('Run EMA Calc first so there are values to transfer.');
}

/* Inject "Send to Forecast" and "Send to Entry Optimizer" buttons into MA and EMA result areas on load */
document.addEventListener('DOMContentLoaded', () => {
    const injectBtn = (resultId, fn, label, cls) => {
        const el = $(resultId);
        if (!el) return;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap;';
        const btn = document.createElement('button');
        btn.className = `btn ${cls || 'btn-secondary'}`;
        btn.style.cssText = 'font-size:12px;padding:.3rem .9rem;';
        btn.textContent = label;
        btn.onclick = fn;
        wrap.appendChild(btn);
        // check if a wrap already appended (from prior DOMContentLoaded call)
        const existing = el.querySelector('.enh-inject-wrap');
        if (existing) existing.appendChild(btn);
        else { wrap.classList.add('enh-inject-wrap'); el.appendChild(wrap); }
    };

    injectBtn('ma-result',  fillForecastFromMA,          '🔮 → Smart Tools Forecast', 'btn-secondary');
    injectBtn('ma-result',  fillEntryOptimizerFromMA,    '🎯 → Entry Optimizer',      'btn-secondary');
    injectBtn('ema-result', fillForecastFromEMA,         '🔮 → Smart Tools Forecast', 'btn-secondary');
    injectBtn('ema-result', fillEntryOptimizerFromEMA,   '🎯 → Entry Optimizer',      'btn-secondary');
    injectBtn('ema-result', fillCandlePatternFromEMA,    '🕯️ → Candle Scanner',       'btn-secondary');
});

function fillEntryOptimizerFromMA() {
    const map = {
        'ma-price' : 'enh-en-price', 'ma-ma20' : 'enh-en-ma20',
        'ma-ma5'   : 'enh-en-ma5',   'ma-atr'  : 'enh-en-atr',
        'ma-k'     : 'enh-en-k',     'ma-d'    : 'enh-en-d',
        'ma-j'     : 'enh-en-j',     'ma-adx'  : 'enh-en-adx',
        'ma-pdi'   : 'enh-en-pdi',   'ma-mdi'  : 'enh-en-mdi',
        'ma-vol'   : 'enh-en-vol',   'ma-hist' : 'enh-en-hist',
    };
    let filled = 0;
    Object.entries(map).forEach(([src, dst]) => {
        const s = $(src), d = $(dst);
        if (s && d && s.value.trim()) { d.value = s.value; filled++; }
    });
    if (filled > 0) { switchTab('enhance'); switchEnhTab('en'); }
    else alert('Run MA Calc first.');
}

function fillEntryOptimizerFromEMA() {
    const map = {
        'ema-price' : 'enh-en-price', 'ema-ema21' : 'enh-en-ma20',
        'ema-ema8'  : 'enh-en-ma5',   'ema-atr'   : 'enh-en-atr',
        'ema-k'     : 'enh-en-k',     'ema-d'     : 'enh-en-d',
        'ema-j'     : 'enh-en-j',     'ema-adx'   : 'enh-en-adx',
        'ema-pdi'   : 'enh-en-pdi',   'ema-mdi'   : 'enh-en-mdi',
        'ema-vol'   : 'enh-en-vol',   'ema-hist'  : 'enh-en-hist',
    };
    let filled = 0;
    Object.entries(map).forEach(([src, dst]) => {
        const s = $(src), d = $(dst);
        if (s && d && s.value.trim()) { d.value = s.value; filled++; }
    });
    if (filled > 0) { switchTab('enhance'); switchEnhTab('en'); }
    else alert('Run EMA Calc first.');
}

function fillCandlePatternFromEMA() {
    // Pre-fill ATR and vol for candle scanner context
    const atr = $('ema-atr'), vol = $('ema-vol');
    const catr = $('enh-cp-atr'), cvol = $('enh-cp-vol');
    if (atr && catr && atr.value) catr.value = atr.value;
    if (vol && cvol && vol.value) cvol.value = vol.value;
    let filled = (atr?.value ? 1 : 0) + (vol?.value ? 1 : 0);
    if (filled > 0) { switchTab('enhance'); switchEnhTab('cp'); }
    else { switchTab('enhance'); switchEnhTab('cp'); }
}


function calcSTAuto() {
    const H    = num('enh-st-h'),   L   = num('enh-st-l');
    const C    = num('enh-st-c'),   ATR = num('enh-st-atr');
    const mult = num('enh-st-mult') || 3;

    if (!H || !L || !C || !ATR) {
        alert('Please enter High, Low, Close and ATR.');
        return;
    }
    if (H < L) { alert('High must be ≥ Low.'); return; }
    if (ATR <= 0) { alert('ATR must be > 0.'); return; }

    const hl2     = (H + L) / 2;
    const ub      = hl2 + mult * ATR;   // Bearish Supertrend line
    const lb      = hl2 - mult * ATR;   // Bullish Supertrend line
    const bullish = C >= hl2;
    const stVal   = bullish ? lb : ub;
    const distPct = ((C - stVal) / C * 100);
    const dp      = C > 100 ? 2 : C > 1 ? 4 : 6;

    /* ── Stat fields ─────────────────────────── */
    $('enh-st-hl2').textContent = fmt(hl2, dp);
    $('enh-st-ub').textContent  = fmt(ub,  dp);
    $('enh-st-lb').textContent  = fmt(lb,  dp);
    const valEl = $('enh-st-val');
    valEl.textContent  = fmt(stVal, dp);
    valEl.style.color  = bullish ? 'var(--green)' : 'var(--red)';

    $('enh-st-dir').innerHTML = bullish
        ? `<span style="color:var(--green);font-size:22px;font-weight:700;font-family:var(--head);">▲ BULLISH</span>`
        : `<span style="color:var(--red);font-size:22px;font-weight:700;font-family:var(--head);">▼ BEARISH</span>`;

    $('enh-st-dist').textContent =
        `Price is ${Math.abs(distPct).toFixed(2)}% ${bullish ? 'above' : 'below'} Supertrend — ` +
        (bullish ? 'dynamic support holding' : 'price under dynamic resistance');

    /* ── Price-level visual bar ──────────────── */
    const pad  = ATR * 0.7;
    const pMin = Math.min(lb, L) - pad;
    const pMax = Math.max(ub, H) + pad;
    const pRng = pMax - pMin || 1;
    const tx   = v => ((v - pMin) / pRng * 100).toFixed(1);
    $('enh-st-viz').innerHTML = `
      <div style="position:relative;height:48px;background:var(--card2);border-radius:6px;
                  overflow:hidden;border:1px solid var(--border);margin:.4rem 0;">
        <!-- candle body range -->
        <div style="position:absolute;left:${Math.min(tx(L),tx(H))}%;
                    width:${Math.abs(tx(H)-tx(L))}%;height:40%;top:30%;
                    background:rgba(0,200,240,.1);border-radius:2px;"></div>
        <!-- Lower Band -->
        <div style="position:absolute;left:${tx(lb)}%;width:2px;height:100%;background:var(--green);opacity:.85;"></div>
        <!-- Upper Band -->
        <div style="position:absolute;left:${tx(ub)}%;width:2px;height:100%;background:var(--red);opacity:.85;"></div>
        <!-- Active ST marker -->
        <div style="position:absolute;left:${tx(stVal)}%;width:3px;height:100%;
                    background:${bullish?'var(--green)':'var(--red)'};"></div>
        <!-- Close marker -->
        <div style="position:absolute;left:${tx(C)}%;width:2px;height:100%;background:var(--accent);"></div>
        <!-- Labels -->
        <span style="position:absolute;left:${tx(lb)}%;transform:translateX(-50%);
                     bottom:2px;font-size:8.5px;color:var(--green);white-space:nowrap;font-family:var(--mono);">
          LB ${fmt(lb,dp)}</span>
        <span style="position:absolute;left:${tx(ub)}%;transform:translateX(-50%);
                     bottom:2px;font-size:8.5px;color:var(--red);white-space:nowrap;font-family:var(--mono);">
          UB ${fmt(ub,dp)}</span>
        <span style="position:absolute;left:${tx(C)}%;transform:translateX(-50%);
                     top:3px;font-size:8.5px;color:var(--accent);white-space:nowrap;font-family:var(--mono);">
          C ${fmt(C,dp)}</span>
      </div>`;

    /* ── Advice box ─────────────────────────── */
    $('enh-st-explain').className = `advice-box ${bullish ? 'green' : 'red'}`;
    $('enh-st-explain').textContent = bullish
        ? `✅ Bullish — Close (${fmt(C,dp)}) is above midpoint HL2 (${fmt(hl2,dp)}). ` +
          `Active Supertrend = Lower Band ${fmt(lb,dp)} (dynamic support). ` +
          `→ Enter this value in the Supertrend field of your MA or EMA tab.`
        : `🔴 Bearish — Close (${fmt(C,dp)}) is below midpoint HL2 (${fmt(hl2,dp)}). ` +
          `Active Supertrend = Upper Band ${fmt(ub,dp)} (dynamic resistance). ` +
          `Price is below Supertrend — avoid new long entries until price reclaims this level.`;

    /* ── Flip Detection ─────────────────────── */
    const prevSTVal = num('enh-st-prev');
    const prevDir   = document.getElementById('enh-st-prev-dir')?.value || '';
    const flipEl    = $('enh-st-flip') || (() => {
        const d = document.createElement('div');
        d.id = 'enh-st-flip';
        $('enh-st-explain').insertAdjacentElement('afterend', d);
        return d;
    })();

    if (prevSTVal && prevDir) {
        const wasBull  = prevDir === 'bull';
        const isFlip   = (wasBull && !bullish) || (!wasBull && bullish);
        const flipType = !wasBull && bullish ? 'BULLISH FLIP 🟢' : wasBull && !bullish ? 'BEARISH FLIP 🔴' : null;

        if (isFlip) {
            const flipColor  = bullish ? 'var(--green)' : 'var(--red)';
            const tradeAction = bullish
                ? `Price crossed ABOVE Supertrend this bar — this is a bullish entry signal. The active ST value is now the Lower Band (${fmt(lb,dp)}). ` +
                  `Trade action: Enter long on the NEXT candle open confirmation. Stop Loss = ${fmt(lb,dp)} (below the new ST support). ` +
                  `This is the highest-reliability ST signal — a confirmed direction change with price above the new support line.`
                : `Price crossed BELOW Supertrend this bar — this is a bearish signal. The active ST value is now the Upper Band (${fmt(ub,dp)}). ` +
                  `Trade action: Exit all long positions immediately. If short-selling: enter short on the NEXT candle open confirmation with Stop Loss at ${fmt(ub,dp)}.`;
            flipEl.innerHTML = `
                <div style="padding:.6rem .85rem;border-radius:8px;border-left:4px solid ${flipColor};
                             background:rgba(0,0,0,.12);margin-top:.5rem;">
                  <div style="font-family:var(--head);font-size:16px;font-weight:700;color:${flipColor};margin-bottom:.25rem;">
                    🔔 SIGNAL: ${flipType}
                  </div>
                  <div style="font-size:12px;color:var(--text);line-height:1.65;">${tradeAction}</div>
                  <div style="font-size:11px;color:var(--dim);margin-top:.35rem;">
                    Previous bar: <strong style="color:${wasBull?'var(--green)':'var(--red)'}">${wasBull?'▲ Bullish':'▼ Bearish'}</strong> ST = ${fmt(prevSTVal,dp)}
                    &nbsp;→&nbsp; Current bar: <strong style="color:${bullish?'var(--green)':'var(--red)'}">${bullish?'▲ Bullish':'▼ Bearish'}</strong> ST = ${fmt(stVal,dp)}
                  </div>
                </div>`;
        } else {
            const dirLabel = bullish ? '▲ Bullish' : '▼ Bearish';
            flipEl.innerHTML = `
                <div style="padding:.4rem .7rem;border-radius:6px;background:rgba(0,0,0,.08);margin-top:.4rem;font-size:12px;color:var(--dim);">
                  No flip — direction <strong style="color:${bullish?'var(--green)':'var(--red)'}">${dirLabel}</strong> continued from previous bar.
                  Previous ST: ${fmt(prevSTVal,dp)} → Current ST: ${fmt(stVal,dp)}.
                  Trend continuation — no new entry signal generated.
                </div>`;
        }
    } else {
        if (flipEl) flipEl.innerHTML = '';
    }

    /* ── Multi-multiplier reference table ────── */
    const tableRows = [1.5, 2, 2.5, 3, 3.5, 4].map(m => {
        const u  = hl2 + m * ATR;
        const l  = hl2 - m * ATR;
        const sv = bullish ? l : u;
        const cur = m === mult;
        return `<div class="check-row" style="${cur?'background:rgba(0,200,240,.05);border-radius:4px;':''
                  }padding:.3rem .4rem;">
          <span class="${cur ? 'check-pass' : 'check-neutral'}" style="min-width:30px;">×${m}</span>
          <span class="check-label" style="flex:1;">
            Bull&nbsp;<span style="color:var(--green)">${fmt(l,dp)}</span>
            &nbsp;&nbsp;Bear&nbsp;<span style="color:var(--red)">${fmt(u,dp)}</span>
          </span>
          <span class="check-val ${cur?'pass':''}">${cur ? '← active: ' : ''}${fmt(sv,dp)}</span>
        </div>`;
    }).join('');
    $('enh-st-table').innerHTML = tableRows;

    $('enh-st-result').style.display = '';
}

/* ════════════════════════════════════════════════════════════════
   MODULE 2 — RULE-BASED TREND FORECAST
   Scores every indicator group independently → Bull pts vs Bear pts
   → Net direction, confidence %, momentum state, 3-horizon narrative
════════════════════════════════════════════════════════════════ */
function calcForecastRules() {
    const price = num('enh-fc-price');
    const ma5   = num('enh-fc-ma5');
    const ma20  = num('enh-fc-ma20');
    const ma50  = num('enh-fc-ma50');
    if (!price || !ma5 || !ma20 || !ma50) {
        alert('Price, MA5/EMA8, MA20/EMA21 and MA50/EMA55 are required.');
        return;
    }
    const ma200 = num('enh-fc-ma200');
    const k     = num('enh-fc-k'),   d    = num('enh-fc-d'),    j    = num('enh-fc-j');
    const rsi   = num('enh-fc-rsi');
    const dif   = num('enh-fc-dif'), dea  = num('enh-fc-dea'),  hist = num('enh-fc-hist');
    const adx   = num('enh-fc-adx'), pdi  = num('enh-fc-pdi'),  mdi  = num('enh-fc-mdi');
    const adxr  = num('enh-fc-adxr');
    const atr   = num('enh-fc-atr'), vol  = num('enh-fc-vol'),  st   = num('enh-fc-st');
    const bbu   = num('enh-fc-bbu'), bbl  = num('enh-fc-bbl');
    const vwap  = num('enh-fc-vwap');
    const ichiSel = document.getElementById('enh-fc-ichi')?.value || '';
    const dp    = price > 100 ? 2 : price > 1 ? 4 : 6;

    /* ── Weighted score engine ──────────────── */
    let bullPts = 0, bearPts = 0, totalPts = 0;
    const sigs  = [];   // [{label, note, bull, bear}]

    const rec = (bp, brp, maxPts, label, bullNote, bearNote, neutralNote) => {
        totalPts += maxPts;
        bullPts  += bp;
        bearPts  += brp;
        const bull = bp > brp, bear = brp > bp;
        sigs.push({ label, note: bull ? bullNote : bear ? bearNote : neutralNote, bull, bear });
    };

    /* ─ MA Stack  (60 pts) ─────────────────── */
    const f1 = price > ma5,   f2 = ma5 > ma20,   f3 = ma20 > ma50;
    const f4 = ma200 != null ? price > ma200 : null;
    rec(f1?20:0, f1?0:20, 20, 'Price vs MA5/EMA8',
        `Price ${Math.abs(pct(price,ma5)||0).toFixed(2)}% above MA5 — short-term bull`,
        `Price ${Math.abs(pct(price,ma5)||0).toFixed(2)}% below MA5 — short-term bear`,
        'At MA5 — watch for breakout direction');
    rec(f2?20:0, f2?0:20, 20, 'MA5 vs MA20 (trend structure)',
        `MA5>${fmt(ma5,dp)} > MA20${fmt(ma20,dp)} — bull structure`,
        `MA5 below MA20 — bearish structure`,
        'MA5 flat with MA20');
    rec(f3?20:0, f3?0:20, 20, 'MA20 vs MA50 (medium trend)',
        `MA20>${fmt(ma20,dp)} > MA50${fmt(ma50,dp)} — medium bull`,
        'MA20 below MA50 — medium bearish',
        'MA20 flat with MA50');
    if (f4 !== null) {
        rec(f4?12:0, f4?0:12, 12, 'Price vs MA200 (macro)',
            `Above MA200 ${fmt(ma200,dp)} — macro trend bullish`,
            `Below MA200 ${fmt(ma200,dp)} — macro bearish`,
            '');
    }

    /* ─ KDJ  (30 pts) ──────────────────────── */
    if (k != null && d != null) {
        const os         = j != null && j < 15;
        const freshCross = k > d && (k-d) < 10 && (j == null || j < 82);
        const ob         = j != null && j > 88;
        if (os) {
            rec(28, 0, 30, `KDJ Oversold Bounce J=${j.toFixed(0)}`,
                `J<15 extreme oversold — high-probability bounce entry`, '', '');
        } else if (freshCross) {
            rec(28, 0, 30, `KDJ Fresh Bull Cross K${k.toFixed(0)}>D${d.toFixed(0)}`,
                `Fresh K/D cross + J${j?.toFixed(0)} — strongest momentum signal`, '', '');
        } else if (k > d && !ob) {
            rec(22, 0, 30, `KDJ Bullish K${k.toFixed(0)}/D${d.toFixed(0)}/J${j?.toFixed(0)}`,
                'K above D — momentum confirmed', '', '');
        } else if (ob) {
            rec(8, 22, 30, `KDJ Overbought J=${j.toFixed(0)}`,
                '', `J>${j.toFixed(0)} — late entry / exit risk`, '');
        } else {
            rec(0, 28, 30, `KDJ Bearish K${k.toFixed(0)}<D${d.toFixed(0)}`,
                '', 'K below D — bears controlling momentum', '');
        }
    }

    /* ─ MACD  (25 pts) ─────────────────────── */
    if (dif != null && dea != null) {
        const exp     = hist != null && hist > 0;
        const bothPos = dif > 0 && dea > 0;
        if (dif > dea && bothPos && exp) {
            rec(25, 0, 25, `MACD Strong Bull (DIF${dif>0?'+':''}${dif.toFixed(3)})`,
                'Both lines positive + histogram expanding — strongest MACD signal', '', '');
        } else if (dif > dea && bothPos) {
            rec(20, 0, 25, `MACD Bull Above Zero`,
                'DIF and DEA both positive — healthy trend', '', '');
        } else if (dif > dea) {
            rec(15, 0, 25, `MACD Bullish Cross (early)`,
                'DIF crossed above DEA in negative territory — momentum turning', '', '');
        } else if (hist != null && hist > -0.0001) {
            rec(6, 15, 25, 'MACD Bearish (histogram contracting)',
                '', 'MACD bearish but shrinking histogram — watch for reversal', '');
        } else {
            rec(0, 25, 25, `MACD Bearish DIF<DEA`,
                '', 'DIF below DEA — downward momentum dominant', '');
        }
    }

    /* ─ ADX + DMI  (22 pts) ─────────────────── */
    if (adx != null) {
        const bDMI   = pdi != null && mdi != null && pdi > mdi;
        const fresh  = bDMI && (pdi - mdi) < 4;
        const strong = adx >= 25;
        const weak   = adx < 20;
        if (adx > 50 && bDMI)   rec(22, 0, 22, `ADX Surge ${adx.toFixed(0)} + DMI Bull`,  `Momentum surge — highest trend conviction`, '', '');
        else if (strong && fresh) rec(22, 0, 22, `DMI Fresh Bull Cross ADX ${adx.toFixed(0)}`, `Fresh PDI/MDI cross + strong ADX — high conviction`, '', '');
        else if (strong && bDMI)  rec(18, 0, 22, `Strong Bull DMI ADX ${adx.toFixed(0)}`,     `PDI${pdi?.toFixed(0)}>MDI${mdi?.toFixed(0)} confirmed`, '', '');
        else if (strong && !bDMI) rec(0, 18, 22, `Strong Bear DMI ADX ${adx.toFixed(0)}`,     '', `MDI>PDI + ADX${adx.toFixed(0)} — strong downtrend`, '');
        else if (weak)            rec(5, 5,  22, `ADX ${adx.toFixed(0)} — ranging/weak`,       '', '', 'ADX < 20 — no established trend, choppy market');
        else                      rec(10, 5, 22, `ADX ${adx.toFixed(0)} — developing`,         'Trend building, not yet confirmed', '', '');
        // ADXR momentum confirmation bonus
        if (adxr != null && adx > adxr) {
            rec(3, 0, 3, `ADX > ADXR (${adx.toFixed(0)}>${adxr.toFixed(0)})`,
                'ADX rising above ADXR — trend accelerating', '', '');
        } else if (adxr != null) {
            rec(0, 3, 3, `ADX < ADXR (${adx.toFixed(0)}<${adxr.toFixed(0)})`,
                '', 'ADX declining — trend weakening', '');
        }
    }

    /* ─ RSI  (15 pts) ──────────────────────── */
    if (rsi != null) {
        if (rsi >= 50 && rsi <= 70)     rec(15, 0,  15, `RSI ${rsi.toFixed(0)} Bullish Zone`,  'RSI 50–70 sweet spot', '', '');
        else if (rsi >= 45 && rsi < 50) rec(10, 0,  15, `RSI ${rsi.toFixed(0)} Building`,      'Below 50 but building — watch for cross', '', '');
        else if (rsi > 70 && rsi <= 78) rec(8,  7,  15, `RSI ${rsi.toFixed(0)} Momentum Run`,  'High RSI can persist — watch divergence', '', '');
        else if (rsi > 78)              rec(3,  12, 15, `RSI ${rsi.toFixed(0)} Overbought`,    '', 'Extreme OB — reduce / exit risk', '');
        else if (rsi >= 30 && rsi < 45) rec(5,  10, 15, `RSI ${rsi.toFixed(0)} Below 50`,      '', 'RSI weak — wait for recovery above 50', '');
        else                            rec(12, 0,  15, `RSI ${rsi.toFixed(0)} Oversold`,       'RSI<30 oversold — potential bounce zone', '', '');
    }

    /* ─ Volume  (12 pts) ───────────────────── */
    if (vol != null) {
        if (vol >= 3.0)      rec(12, 0, 12, `Vol ${vol.toFixed(1)}× Institutional Surge`,  '3×+ volume = smart money accumulation', '', '');
        else if (vol >= 2.0) rec(10, 0, 12, `Vol ${vol.toFixed(1)}× Very Strong`,           '2×+ institutional interest', '', '');
        else if (vol >= 1.5) rec(8,  0, 12, `Vol ${vol.toFixed(1)}× Strong`,               'Above-average confirms move', '', '');
        else if (vol >= 1.2) rec(6,  0, 12, `Vol ${vol.toFixed(1)}× Above Average`,        'Moderate improvement', '', '');
        else if (vol >= 0.9) rec(4,  3, 12, `Vol ${vol.toFixed(1)}× Average`,              'OK but wait for surge', 'Low volume — less reliable', '');
        else                 rec(0,  8, 12, `Vol ${vol.toFixed(1)}× Low`,                   '', 'Low volume — breakout unreliable', '');
    }

    /* ─ Supertrend  (10 pts) ──────────────── */
    if (st != null) {
        const stBull = price > st;
        rec(stBull?10:0, stBull?0:10, 10, `Supertrend ${fmt(st,dp)}`,
            `Price ${fmt(price,dp)} above ST — dynamic support holding`,
            `Price below ST — dynamic resistance above`,
            '');
    }

    /* ─ Bollinger Bands  (8 pts) ──────────── */
    if (bbu != null && bbl != null && bbu > bbl) {
        const bbRange = bbu - bbl;
        const bbPos   = ((price - bbl) / bbRange) * 100;  // 0% = at lower, 100% = at upper
        const bbMid   = (bbu + bbl) / 2;
        if (bbPos >= 50 && bbPos <= 80) {
            rec(8, 0, 8, `BB Position ${bbPos.toFixed(0)}% — Upper Half`,
                `Price in BB upper half (${bbPos.toFixed(0)}%) — bullish momentum zone`, '', '');
        } else if (bbPos > 80) {
            rec(4, 4, 8, `BB Overextended ${bbPos.toFixed(0)}% — Near Upper Band`,
                '', '', `Price near BB upper (${bbPos.toFixed(0)}%) — overbought warning, pullback risk`);
        } else if (bbPos >= 20 && bbPos < 50) {
            rec(2, 6, 8, `BB Position ${bbPos.toFixed(0)}% — Lower Half`,
                '', `Price in lower half of BB (${bbPos.toFixed(0)}%) — bearish bias`, '');
        } else {
            rec(8, 0, 8, `BB Oversold ${bbPos.toFixed(0)}% — Near Lower Band`,
                `Price near BB lower band — high-probability mean reversion bounce`, '', '');
        }
    }

    /* ─ VWAP  (8 pts) ──────────────────────── */
    if (vwap != null) {
        const aboveVWAP = price > vwap;
        const vwapPct   = ((price - vwap) / vwap * 100);
        if (aboveVWAP && vwapPct <= 2) {
            rec(8, 0, 8, `VWAP ${fmt(vwap,dp)} — Price Just Above`,
                `Price ${vwapPct.toFixed(2)}% above VWAP — intraday bulls in control near fair value`, '', '');
        } else if (aboveVWAP) {
            rec(6, 0, 8, `VWAP ${fmt(vwap,dp)} — Price Above`,
                `Price ${vwapPct.toFixed(2)}% above VWAP — bullish intraday bias`, '', '');
        } else {
            rec(0, 8, 8, `VWAP ${fmt(vwap,dp)} — Price Below`,
                '', `Price ${Math.abs(vwapPct).toFixed(2)}% below VWAP — intraday sellers in control`, '');
        }
    }

    /* ─ Ichimoku  (8 pts) ──────────────────── */
    if (ichiSel) {
        if (ichiSel === 'above') {
            rec(8, 0, 8, 'Ichimoku — Price Above Cloud',
                'Price above cloud — strong institutional trend confirmation', '', '');
        } else if (ichiSel === 'inside') {
            rec(3, 3, 8, 'Ichimoku — Price Inside Cloud',
                '', '', 'Price inside cloud — conflicted trend, cloud acting as resistance/support');
        } else {
            rec(0, 8, 8, 'Ichimoku — Price Below Cloud',
                '', 'Price below cloud — bearish institutional bias, cloud is overhead resistance', '');
        }
    }

    /* ── Derived scores ──────────────────── */
    const bullPct = totalPts > 0 ? (bullPts / totalPts * 100) : 50;
    const bearPct = totalPts > 0 ? (bearPts / totalPts * 100) : 50;
    const net     = bullPct - bearPct;
    const conf    = Math.min(96, Math.round(Math.abs(net) * 0.85 + 30));

    let dir, dirCls, dirColor, momentum, timing;
    if      (net >=  42) { dir = 'BULLISH';      dirCls = 'proceed'; dirColor = 'var(--green)';  }
    else if (net >=  18) { dir = 'LEANING BULL'; dirCls = 'proceed'; dirColor = 'var(--accent)'; }
    else if (net <= -42) { dir = 'BEARISH';      dirCls = 'skip';    dirColor = 'var(--red)';    }
    else if (net <= -18) { dir = 'LEANING BEAR'; dirCls = 'skip';    dirColor = 'var(--orange)'; }
    else                 { dir = 'NEUTRAL';      dirCls = 'watch';   dirColor = 'var(--yellow)'; }

    const maFull   = f1 && f2 && f3;
    const kdjBull  = k != null && d != null && k > d;
    const macdBull = dif != null && dea != null && dif > dea;
    const volHigh  = vol != null && vol >= 1.5;
    const trendOk  = adx != null && adx >= 25;

    if (maFull && kdjBull && macdBull && trendOk)       momentum = 'ACCELERATING';
    else if (maFull && (kdjBull || macdBull) && trendOk) momentum = 'STEADY';
    else if (maFull && (kdjBull || macdBull))            momentum = 'STEADY';
    else if (!f1 && (kdjBull || macdBull))              momentum = 'RECOVERING';
    else if (maFull && !kdjBull && !macdBull)            momentum = 'FADING';
    else                                                 momentum = 'MIXED';

    const pAboveMA20 = pct(price, ma20) || 0;
    if      (dir.includes('BULL') && pAboveMA20 < 3 && kdjBull)  timing = '🎯 ENTER NOW — confluence at support zone';
    else if (dir.includes('BULL') && pAboveMA20 > 8)              timing = '⏳ WAIT FOR PULLBACK — price stretched above MA20';
    else if (dir.includes('BULL'))                                timing = '✅ PROCEED — valid setup, manage entry size by TF';
    else if (dir === 'NEUTRAL')                                   timing = '👀 WATCH — wait for clear directional break';
    else                                                          timing = '🔴 AVOID LONGS — bearish indicators dominant';

    /* ── ATR-based targets ─────────────────── */
    const slPrice  = atr ? +(price - atr * 1.5).toFixed(dp) : null;
    const tp1Price = atr ? +(price + atr * 1.5).toFixed(dp) : null;
    const tp2Price = atr ? +(price + atr * 2.8).toFixed(dp) : null;
    const tp3Price = atr ? +(price + atr * 4.5).toFixed(dp) : null;
    const riskUnit = slPrice ? price - slPrice : null;
    const rr1 = tp1Price && riskUnit ? ((tp1Price - price) / riskUnit).toFixed(2) : null;
    const rr2 = tp2Price && riskUnit ? ((tp2Price - price) / riskUnit).toFixed(2) : null;
    const rr3 = tp3Price && riskUnit ? ((tp3Price - price) / riskUnit).toFixed(2) : null;

    /* ── Forecast narrative ────────────────── */
    const missingMA = [!f1&&'Price<MA5', !f2&&'MA5<MA20', !f3&&'MA20<MA50'].filter(Boolean).join(', ');
    const narr = {
        short: dir.includes('BULL')
            ? (maFull ? `Full bull MA stack confirmed — ${f1?'momentum leading.':'all layers aligned.'}` :
               `Partial MA alignment (${missingMA} not yet met). `) +
              (kdjBull ? ` KDJ K>D momentum aligned.` : ` Watch KDJ for fresh cross.`) +
              (volHigh ? ` Volume ${vol?.toFixed(1)}× confirms institutional participation.` : '')
            : dir.includes('BEAR')
            ? (!f1 ? 'Price below MA5 — bears control short term. ' : '') +
              (!kdjBull ? 'KDJ K<D — momentum bearish. ' : '') +
              (!macdBull ? 'MACD below signal — downward pressure.' : '')
            : `Mixed signals. Bulls and bears balanced — smaller timeframe or sit out until one side takes clear control.`,

        medium: dir.includes('BULL')
            ? (f2 ? `MA5>MA20 structure gives medium-term bullish bias. ` :
               `Wait for MA5 to cross above MA20 for medium confirmation. `) +
              (macdBull ? `MACD above signal — trend has legs for 5–15 candles. ` :
               `MACD not yet confirmed — watch for bullish cross. `) +
              (trendOk ? `ADX ${adx?.toFixed(0)} confirms active trend — current move likely to extend.` :
               `ADX ${adx?.toFixed(0)||'?'} below 25 — trend building but not yet strong.`)
            : dir.includes('BEAR')
            ? `MA structure bearish. ` +
              (trendOk ? `ADX ${adx?.toFixed(0)} confirms downtrend — continuation likely. ` :
               `ADX weak — may be distribution rather than clean downtrend. `) +
              (macdBull ? `MACD still positive — watch for bearish cross as next confirmation.` :
               `MACD bearish — continuation lower is higher-probability.`)
            : `No medium bias. A break of MA20 with volume would confirm direction. ADX crossing 25 with DMI alignment is the key trigger to watch.`,

        long: ma200 != null
            ? (price > ma200
                ? `Price above MA200 (${fmt(ma200,dp)}) — macro trend bullish. Long-term bias: buy pullbacks above MA200.`
                : `Price below MA200 (${fmt(ma200,dp)}) — macro bearish. All rallies are suspect until MA200 is recaptured and held.`)
            : `MA200 not entered. Provide MA200 for macro context — it is the single most important trend filter for long-term direction.`,
    };

    /* ════════════════════════════════════════════
       DESCRIPTION MAPS — plain-English glossary
       ════════════════════════════════════════════ */

    /* Direction descriptions */
    const dirDesc = {
        'BULLISH': {
            icon: '🟢',
            title: 'Strong Uptrend — Most indicators agree price will rise',
            detail: 'The majority of your indicators (MA stack, momentum oscillators, volume and trend strength) all point upward. This is the highest-probability setup for a long (buy) trade. The market has strong agreement across multiple timeframes that buyers are in control.',
            action: 'Look for a clean entry near support (MA20 or MA5). Do not chase a spike — wait for a small dip or consolidation before entering.'
        },
        'LEANING BULL': {
            icon: '🟡',
            title: 'Tilted Bullish — More bull signals than bear, but not all aligned',
            detail: 'More indicators are bullish than bearish, but some are still neutral or mixed. The market has a bullish bias, but it is not a clean, high-conviction setup. There may be one or two indicators lagging or not yet confirming.',
            action: 'Enter with reduced position size (50–75%). Confirm with volume or a KDJ crossover before adding. Keep stop tight.'
        },
        'NEUTRAL': {
            icon: '⚪',
            title: 'Mixed Signals — Bulls and bears are balanced',
            detail: 'No clear winner between bulls and bears. The market is in a balanced or transitional state. This often happens before a breakout or breakdown. Trading in this zone carries higher risk of whipsaws (false moves in either direction).',
            action: 'Do not trade yet. Watch for a decisive break above MA5 (bullish) or below MA20 (bearish) with above-average volume to confirm direction first.'
        },
        'LEANING BEAR': {
            icon: '🟠',
            title: 'Tilted Bearish — More bear signals, downside risk elevated',
            detail: 'More indicators are pointing down than up. The bullish case is weakening. This does not guarantee a drop, but the statistical edge has shifted toward the bears. Caution is required for long entries.',
            action: 'Avoid new long (buy) trades. If already in a position, tighten your stop loss. Wait for indicators to turn bullish again before re-entering.'
        },
        'BEARISH': {
            icon: '🔴',
            title: 'Strong Downtrend — Most indicators signal price will fall',
            detail: 'The majority of indicators (MA stack, momentum, trend strength) are aligned downward. Buyers are losing control and sellers are dominant. Entering a long trade here goes against the market structure and has a low probability of success.',
            action: 'Avoid all long entries. If holding a position, consider exiting to protect capital. Wait for a full reversal with MA crossovers and volume confirmation before buying again.'
        }
    };

    /* Momentum state descriptions */
    const momDesc = {
        'ACCELERATING': {
            icon: '🚀',
            title: 'Momentum Accelerating',
            detail: 'All momentum filters (MA stack, KDJ, MACD and ADX) are aligned and strong. This is the most powerful momentum reading — price has both structure and speed behind it. Moves often extend further than expected in this state.',
            tip: 'This is the ideal state to ride a trade with a trailing stop rather than taking profit too early.'
        },
        'STEADY': {
            icon: '✅',
            title: 'Momentum Steady',
            detail: 'The trend is healthy and consistent. The MA stack is aligned and at least one momentum oscillator (KDJ or MACD) confirms the direction. The move is not overly aggressive — it is sustainable.',
            tip: 'Good environment for standard entries with normal position size. Manage targets normally.'
        },
        'RECOVERING': {
            icon: '🔄',
            title: 'Momentum Recovering',
            detail: 'Price has not yet reclaimed the short-term MA (MA5/EMA8), but momentum oscillators (KDJ or MACD) are turning bullish. This suggests the trend is trying to recover — but has not been confirmed by price structure yet.',
            tip: 'Wait for price to close back above MA5 before entering. A recovery without price confirmation can fail. Use smaller size if entering early.'
        },
        'FADING': {
            icon: '⚠️',
            title: 'Momentum Fading',
            detail: 'The MA stack still looks bullish, but the momentum oscillators (KDJ and MACD) are weakening or turning neutral. This is an early warning sign that the current move may be running out of energy.',
            tip: 'Do not add new positions. Consider taking partial profit on existing trades. A MACD or KDJ bearish cross would be a strong exit signal.'
        },
        'MIXED': {
            icon: '〰️',
            title: 'Momentum Mixed',
            detail: 'Different indicators are giving conflicting signals — some bullish, some bearish. This often occurs during transitions or range-bound markets where there is no clear dominant side.',
            tip: 'Reduce exposure. A smaller timeframe chart may give clearer signals. Wait for all key indicators to align before committing capital.'
        }
    };

    /* Timing message descriptions */
    const timingDescs = {
        'ENTER':    {
            headline: '🎯 What does "ENTER NOW" mean?',
            body: `Price has pulled back close to the MA20 support zone <strong>and</strong> KDJ momentum is turning bullish — this is the ideal combination. You are buying at a "discount" near support rather than chasing a high price. The risk/reward is most favourable at this point.`,
            steps: ['Enter near current price or at the next small dip', 'Set your Stop Loss below MA20 (use the SL value below)', 'Target TP1 first, then trail your stop for TP2/TP3']
        },
        'PULLBACK': {
            headline: '⏳ What does "WAIT FOR PULLBACK — price stretched above MA20" mean?',
            body: `The trend is bullish — good news. But price has moved <strong>too far above MA20</strong> (the 20-period moving average), which acts as a "gravitational anchor". When price gets too stretched, it tends to snap back to MA20 before continuing upward. If you buy now, you are buying at a poor risk/reward — your stop must be wider (bigger loss if wrong) but your reward is smaller (less room to run up).`,
            steps: [
                '<strong>Do not buy yet</strong> — entering here risks buying the top of a short-term spike',
                'Watch for price to pull back toward <strong>MA5 or MA20</strong> (a normal, healthy correction)',
                'Look for KDJ to reset from overbought (J below 80) during the pullback',
                'When price is near MA20 again AND KDJ turns bullish → that is your entry',
                'Ideal entry zone = within 0–3% above MA20'
            ]
        },
        'PROCEED':  {
            headline: '✅ What does "PROCEED" mean?',
            body: `The setup is valid — the direction is bullish and price is in a reasonable entry zone. Not the absolute best entry (that would be closer to MA20), but an acceptable one. You can enter with standard position sizing.`,
            steps: ['Enter at current price or on a small dip', 'Use the Stop Loss level shown below', 'Take partial profit at TP1, let the rest run to TP2 with trailing stop']
        },
        'WATCH':    {
            headline: '👀 What does "WATCH" mean?',
            body: `The market is in a neutral or transitional state — neither clearly bullish nor bearish. Trading here is like flipping a coin. The smart move is to <strong>do nothing</strong> and wait for the market to show its hand.`,
            steps: ['Do not trade yet', 'Watch for ADX to rise above 20–25 (trend emerging)', 'Watch for KDJ or MACD to give a clear directional cross', 'A break of MA20 with strong volume will confirm the next direction']
        },
        'AVOID':    {
            headline: '🔴 What does "AVOID LONGS" mean?',
            body: `Too many indicators are pointing downward. A long (buy) trade here has a low probability of success and goes against the market trend. Protecting your capital is more important than finding a trade.`,
            steps: ['Close or reduce any long positions you are holding', 'Do not open new buy trades', 'Wait for the trend to reverse: MA5 must cross back above MA20, and KDJ must turn bullish', 'Patience here saves money']
        }
    };

    /* Which timing key applies? */
    let timingKey = 'WATCH';
    if      (timing.includes('ENTER NOW'))    timingKey = 'ENTER';
    else if (timing.includes('PULLBACK'))     timingKey = 'PULLBACK';
    else if (timing.includes('PROCEED'))      timingKey = 'PROCEED';
    else if (timing.includes('AVOID'))        timingKey = 'AVOID';

    const td   = timingDescs[timingKey];
    const dd   = dirDesc[dir]   || dirDesc['NEUTRAL'];
    const md   = momDesc[momentum] || momDesc['MIXED'];
    const riskPillCls = dirCls==='proceed' ? 'risk-low' : dirCls==='skip' ? 'risk-high' : 'risk-medium';

    /* ── Render output ──────────────────────── */
    $('enh-fc-result').style.display = '';
    $('enh-fc-result').innerHTML = `

      <!-- ① TOP DECISION STRIP -->
      <div class="decision-strip ${dirCls}" style="gap:.6rem;">
        <div class="d-badge ${dirCls}" style="font-size:19px;">${dir}</div>
        <div class="risk-pill ${riskPillCls}">${momentum}</div>
        <div style="flex:1;font-size:13px;">${timing}</div>
        <div style="font-family:var(--head);font-size:18px;font-weight:700;color:${dirColor};">${conf}%</div>
      </div>

      <!-- ② DIRECTION EXPLANATION CARD -->
      <div class="card" style="border-left:3px solid ${dirColor};margin-top:.5rem;">
        <div class="card-hdr" style="color:${dirColor};">
          <span class="ci">${dd.icon}</span> ${dd.title}
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:.5rem;">
          <div style="font-size:13px;color:var(--text);line-height:1.6;">${dd.detail}</div>
          <div style="font-size:12px;background:rgba(0,0,0,.15);border-radius:6px;padding:.5rem .75rem;border-left:2px solid ${dirColor};color:var(--dim);">
            <span style="color:${dirColor};font-weight:600;">What to do → </span>${dd.action}
          </div>
        </div>
      </div>

      <!-- ③ MOMENTUM STATE EXPLANATION -->
      <div class="card" style="border-left:3px solid var(--accent);margin-top:.35rem;">
        <div class="card-hdr">
          <span class="ci">${md.icon}</span> Momentum State: <span style="color:var(--accent);font-weight:700;">${momentum}</span> — ${md.title}
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:.4rem;">
          <div style="font-size:13px;color:var(--text);line-height:1.6;">${md.detail}</div>
          <div style="font-size:12px;background:rgba(0,0,0,.15);border-radius:6px;padding:.4rem .7rem;border-left:2px solid var(--accent);color:var(--dim);">
            <span style="color:var(--accent);font-weight:600;">Tip → </span>${md.tip}
          </div>
        </div>
      </div>

      <!-- ④ TIMING / ACTION EXPLANATION -->
      <div class="card" style="border-left:3px solid var(--yellow);margin-top:.35rem;">
        <div class="card-hdr" style="color:var(--yellow);">
          <span class="ci">📖</span> ${td.headline}
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:.5rem;">
          <div style="font-size:13px;color:var(--text);line-height:1.65;">${td.body}</div>
          <div style="font-size:12px;color:var(--dim);">
            <div style="color:var(--yellow);font-weight:600;margin-bottom:.3rem;font-size:12px;">Step-by-step action:</div>
            ${td.steps.map((s,i) => `<div style="display:flex;gap:.5rem;padding:.2rem 0;border-bottom:1px solid var(--border);align-items:flex-start;">
              <span style="color:var(--yellow);font-weight:700;min-width:18px;">${i+1}.</span>
              <span>${s}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- ⑤ SCORE CARDS ROW -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:.6rem;margin-top:.35rem;">
        <div class="card">
          <div class="card-hdr"><span class="ci">🐂</span> Bull Score</div>
          <div class="card-body">
            <div style="font-size:26px;font-weight:700;color:var(--green);">${bullPct.toFixed(0)}%</div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:.4rem;overflow:hidden;">
              <div style="height:4px;width:${bullPct}%;background:var(--green);border-radius:2px;"></div></div>
            <div style="font-size:11px;color:var(--dim);margin-top:.3rem;">% of total points scored as bullish signals. Above 60% = bullish edge.</div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">🐻</span> Bear Score</div>
          <div class="card-body">
            <div style="font-size:26px;font-weight:700;color:var(--red);">${bearPct.toFixed(0)}%</div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:.4rem;overflow:hidden;">
              <div style="height:4px;width:${bearPct}%;background:var(--red);border-radius:2px;"></div></div>
            <div style="font-size:11px;color:var(--dim);margin-top:.3rem;">% of total points scored as bearish signals. Above 40% = caution required.</div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">⚡</span> Net Momentum</div>
          <div class="card-body">
            <div style="font-size:26px;font-weight:700;color:${dirColor};">${net>0?'+':''}${net.toFixed(0)}</div>
            <div style="font-size:11px;color:var(--dim);">bull pts − bear pts</div>
            <div style="font-size:11px;color:var(--dim);margin-top:.3rem;">≥+42 = BULLISH · +18 to +42 = Leaning Bull · ±18 = Neutral · ≤−18 = Leaning Bear · ≤−42 = BEARISH</div>
          </div>
        </div>
        ${atr ? `
        <div class="card">
          <div class="card-hdr"><span class="ci">🎯</span> Projected Zones</div>
          <div class="card-body" style="font-size:12px;line-height:1.9;">
            <div style="display:flex;align-items:center;gap:.4rem;">
              <span>🔴</span>
              <span style="color:var(--dim);min-width:30px;">SL</span>
              <span style="color:var(--red);font-weight:600;">${fmt(slPrice,dp)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:.4rem;">
              <span>✅</span>
              <span style="color:var(--dim);min-width:30px;">TP1</span>
              <span style="color:var(--green);font-weight:600;">${fmt(tp1Price,dp)}</span>
              <span style="color:var(--dim);">R:R 1:${rr1}</span>
            </div>
            <div style="display:flex;align-items:center;gap:.4rem;">
              <span>🎯</span>
              <span style="color:var(--dim);min-width:30px;">TP2</span>
              <span style="color:var(--green);font-weight:600;">${fmt(tp2Price,dp)}</span>
              <span style="color:var(--dim);">R:R 1:${rr2}</span>
            </div>
            <div style="display:flex;align-items:center;gap:.4rem;">
              <span>🚀</span>
              <span style="color:var(--dim);min-width:30px;">TP3</span>
              <span style="color:var(--green);font-weight:600;">${fmt(tp3Price,dp)}</span>
              <span style="color:var(--dim);">R:R 1:${rr3}</span>
            </div>
          </div>
        </div>` : ''}
      </div>

      <!-- ⑥ TARGET PRICE EXPLANATION (only when ATR provided) -->
      ${atr ? `
      <div class="card" style="border-left:3px solid var(--green);margin-top:.35rem;">
        <div class="card-hdr"><span class="ci">📐</span> What do SL, TP1, TP2, TP3 mean? — How to use your Projected Zones</div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:.6rem;font-size:13px;">
          <div style="line-height:1.6;color:var(--dim);">These levels are calculated from your <strong style="color:var(--text);">current price + ATR (Average True Range)</strong>. ATR measures how much price typically moves per candle — so the targets adapt to the actual volatility of the stock/pair you are trading.</div>
          <div style="display:grid;gap:.4rem;">
            <div style="padding:.5rem .7rem;background:rgba(220,38,38,.08);border-radius:6px;border-left:3px solid var(--red);">
              <div style="font-weight:700;color:var(--red);">🔴 SL (Stop Loss) = ${fmt(slPrice,dp)}</div>
              <div style="color:var(--dim);margin-top:.2rem;">This is your <strong style="color:var(--text);">maximum loss point</strong>. If price falls to this level, your trade is wrong — exit immediately to prevent larger losses. It is set 1.5× ATR below your entry price. <em>Never move your SL lower once set.</em></div>
            </div>
            <div style="padding:.5rem .7rem;background:rgba(34,197,94,.08);border-radius:6px;border-left:3px solid var(--green);">
              <div style="font-weight:700;color:var(--green);">✅ TP1 (First Target) = ${fmt(tp1Price,dp)} &nbsp;·&nbsp; R:R 1:${rr1}</div>
              <div style="color:var(--dim);margin-top:.2rem;">Your <strong style="color:var(--text);">first profit-taking level</strong> — 1.5× ATR above entry. When price reaches TP1, <strong style="color:var(--green);">sell 50% of your position</strong> and move your Stop Loss up to your entry price (break-even). This locks in profit and removes risk from the trade. R:R 1:${rr1} means for every $1 you risk, you earn $${rr1} at this target.</div>
            </div>
            <div style="padding:.5rem .7rem;background:rgba(34,197,94,.05);border-radius:6px;border-left:3px solid var(--accent);">
              <div style="font-weight:700;color:var(--accent);">🎯 TP2 (Second Target) = ${fmt(tp2Price,dp)} &nbsp;·&nbsp; R:R 1:${rr2}</div>
              <div style="color:var(--dim);margin-top:.2rem;">Your <strong style="color:var(--text);">main profit target</strong> — 2.8× ATR above entry. Sell another 30–40% of your remaining position here. Trail your stop loss below each swing low to protect gains on the way up.</div>
            </div>
            <div style="padding:.5rem .7rem;background:rgba(124,58,237,.08);border-radius:6px;border-left:3px solid var(--accent);">
              <div style="font-weight:700;color:var(--accent);">🚀 TP3 (Runner Target) = ${fmt(tp3Price,dp)} &nbsp;·&nbsp; R:R 1:${rr3}</div>
              <div style="color:var(--dim);margin-top:.2rem;">The <strong style="color:var(--text);">"moonshot" target</strong> — 4.5× ATR above entry. Only reach for this with the last 10–20% of your position (your "runner"). <em>Only hold the runner if momentum remains ACCELERATING or STEADY. Exit if momentum turns FADING.</em></div>
            </div>
          </div>
          <div style="font-size:11px;background:rgba(0,0,0,.15);border-radius:6px;padding:.5rem .7rem;color:var(--dim);">
            ⚠️ <strong style="color:var(--yellow);">Important:</strong> These targets assume you enter near the current price. If you wait for a pullback and enter lower, your actual SL and TPs will shift accordingly — re-run the forecast with your actual entry price to get updated levels.
          </div>
        </div>
      </div>` : `
      <div class="advice-box yellow" style="margin-top:.35rem;">
        ℹ️ <strong>Tip:</strong> Enter your ATR value in the inputs above to unlock the Projected Zones (SL, TP1, TP2, TP3) with full explanations of how to use each target level.
      </div>`}

      <!-- ⑦ SIGNAL BREAKDOWN -->
      <div class="card" style="margin-top:.35rem;">
        <div class="card-hdr"><span class="ci">🔍</span> Signal Breakdown&nbsp;
          <span style="color:var(--dim);font-size:12px;">(${sigs.length} indicator groups · ${totalPts} total pts)</span>
        </div>
        <div class="card-body">
          ${sigs.map(s => `
            <div class="check-row">
              <span class="${s.bull?'check-pass':s.bear?'check-fail':'check-neutral'}">${s.bull?'✔':s.bear?'✘':'○'}</span>
              <span class="check-label" style="flex:1;">${s.label}</span>
              <span class="check-val ${s.bull?'pass':s.bear?'fail':'warn'}"
                    style="font-size:11px;text-align:right;max-width:55%;">${s.note}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- ⑧ MOMENTUM FORECAST NARRATIVES -->
      <div class="card" style="margin-top:.35rem;">
        <div class="card-hdr"><span class="ci">📈</span> Momentum Forecast — What happens next?</div>
        <div class="card-body">
          <div class="check-row" style="flex-direction:column;align-items:flex-start;gap:.2rem;padding:.5rem 0;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);">🕐 Short term (1–3 candles) — Next few hours or bars</div>
            <div style="font-size:13px;color:var(--text);">${narr.short}</div>
          </div>
          <div class="check-row" style="flex-direction:column;align-items:flex-start;gap:.2rem;padding:.5rem 0;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);">📅 Medium term (5–15 candles) — Next few days</div>
            <div style="font-size:13px;color:var(--text);">${narr.medium}</div>
          </div>
          <div class="check-row" style="flex-direction:column;align-items:flex-start;gap:.2rem;padding:.5rem 0;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);">🌐 Long term (macro bias) — Overall market direction</div>
            <div style="font-size:13px;color:var(--text);">${narr.long}</div>
          </div>
        </div>
      </div>`;
}


function calcEntryZone() {
    const price = num('enh-en-price');
    const ma20  = num('enh-en-ma20');
    const atr   = num('enh-en-atr');
    if (!price || !ma20 || !atr) {
        alert('Price, MA20 (key support) and ATR are required.');
        return;
    }
    const ma5  = num('enh-en-ma5');
    const k    = num('enh-en-k'),    d   = num('enh-en-d'),   j   = num('enh-en-j');
    const adx  = num('enh-en-adx'),  pdi = num('enh-en-pdi'), mdi = num('enh-en-mdi');
    const hist = num('enh-en-hist'), vol = num('enh-en-vol');
    const dp   = price > 100 ? 2 : price > 1 ? 4 : 6;

    const conditions = [];
    let score = 0;

    /* ── C1: Support Proximity ─────────────── */
    const distMA20 = price - ma20;
    const c1p = distMA20 >= 0 && distMA20 < atr * 2.5;
    const c1pct = pct(price, ma20);
    conditions.push({
        n: 'Support Proximity',
        desc: `Price ${c1pct != null ? Math.abs(c1pct).toFixed(2) + '%' : 'N/A'} ` +
              `${distMA20 >= 0 ? 'above' : 'below'} MA20 (${fmt(ma20,dp)}). ` +
              `Ideal: 0 – ${(atr * 2.5).toFixed(dp)} above MA20.`,
        pass: c1p,
        note: distMA20 < 0 ? '⛔ Price below MA20 — key support broken. Not safe for long entry.'
            : distMA20 > atr * 4 ? '⚠️ Price too stretched. Wait for pullback to MA20/MA5.'
            : '✅ Price within protected entry zone near MA20 support.'
    });
    if (c1p) score += 20;

    /* ── C2: Momentum Confirmation ─────────── */
    let c2p = false, c2desc = '', c2note = '';
    if (k != null && d != null) {
        const os    = j != null && j < 15;
        const fresh = k > d && (k - d) < 10 && (j == null || j < 82);
        const ob    = j != null && j > 88;
        if (os) {
            c2p = true;
            c2desc = `KDJ J=${j.toFixed(0)} extreme oversold (J<15) — highest bounce probability.`;
            c2note = '✅ Oversold extreme — high-conviction momentum reversal zone.';
        } else if (fresh) {
            c2p = true;
            c2desc = `Fresh KDJ bull cross K${k.toFixed(0)}>D${d.toFixed(0)}, J${j?.toFixed(0)} — just turned bullish.`;
            c2note = '✅ Fresh cross at support = ideal entry signal.';
        } else if (k > d && !ob) {
            c2p = true;
            c2desc = `KDJ bullish K${k.toFixed(0)}>D${d.toFixed(0)}, J${j?.toFixed(0)} — momentum confirmed.`;
            c2note = '✅ Momentum aligned with direction.';
        } else if (ob) {
            c2p = false;
            c2desc = `KDJ overbought J=${j.toFixed(0)}>88 — late entry risk.`;
            c2note = '⚠️ Do not chase overbought KDJ. Wait for J to reset below 80.';
        } else {
            c2p = false;
            c2desc = `KDJ bearish K${k.toFixed(0)}<D${d.toFixed(0)} — momentum not confirmed.`;
            c2note = '⛔ Wait for KDJ K/D crossover before entry.';
        }
    } else if (hist != null) {
        c2p = hist > 0;
        c2desc = hist > 0 ? `MACD histogram +${hist.toFixed(4)} — momentum expanding.`
                           : `MACD histogram ${hist.toFixed(4)} — momentum declining.`;
        c2note = c2p ? '✅ MACD confirms bullish momentum.' : '⛔ Wait until MACD histogram turns positive.';
    } else {
        c2desc = 'KDJ and MACD histogram not provided — momentum unverified.';
        c2note = 'ℹ️ Enter KDJ (K/D/J) or MACD histogram for momentum confirmation.';
    }
    conditions.push({ n: 'Momentum Confirmation', desc: c2desc, pass: c2p, note: c2note });
    if (c2p) score += 20;

    /* ── C3: Trend Strength ─────────────────── */
    let c3p = false, c3desc = '', c3note = '';
    if (adx != null) {
        const dmiOk = pdi != null && mdi != null && pdi > mdi;
        c3p = adx >= 22 && (pdi == null || dmiOk);
        c3desc = `ADX ${adx.toFixed(0)}${pdi != null
            ? ` · PDI ${pdi.toFixed(0)} vs MDI ${mdi != null ? mdi.toFixed(0) : '?'}`
            : ' (PDI/MDI not provided)'}.`;
        c3note = adx < 20  ? '⛔ ADX<20 — ranging market. Momentum may not persist.'
               : adx < 22  ? '⚠️ ADX developing. Consider half-size until ADX ≥ 25.'
               : dmiOk     ? '✅ Strong directional trend confirmed.'
               : !dmiOk && pdi != null ? '⚠️ ADX strong but DMI bearish — directional conflict. Caution.'
               : '✅ ADX strong (PDI/MDI not verified — add for full confirmation).';
    } else {
        c3desc = 'ADX not provided.';
        c3note = 'ℹ️ Add ADX and PDI/MDI for trend strength confirmation.';
    }
    conditions.push({ n: 'Trend Strength (ADX/DMI)', desc: c3desc, pass: c3p, note: c3note });
    if (c3p) score += 20;

    /* ── C4: Volume ─────────────────────────── */
    let c4p = false, c4desc = '', c4note = '';
    if (vol != null) {
        c4p = vol >= 1.3;
        c4desc = `Volume ratio ${vol.toFixed(2)}×. ${vol >= 2 ? 'Institutional surge.' : vol >= 1.3 ? 'Above-average — good confirmation.' : vol >= 0.9 ? 'Average — borderline.' : 'Low — weak conviction.'}`;
        c4note = c4p ? '✅ Volume backing the move — institutional participation likely.'
                     : `⛔ Volume ${vol.toFixed(2)}× < 1.3× threshold. Higher false-breakout risk. Wait for volume confirmation.`;
    } else {
        c4desc = 'Volume ratio not provided.';
        c4note = 'ℹ️ Enter volume ratio for institutional confirmation.';
    }
    conditions.push({ n: 'Volume Confirmation', desc: c4desc, pass: c4p, note: c4note });
    if (c4p) score += 20;

    /* ── C5: Price Structure ────────────────── */
    let c5p = false, c5desc = '', c5note = '';
    if (ma5 != null) {
        c5p = ma5 > ma20 && price > ma5;
        c5desc = `MA5 (${fmt(ma5,dp)}) ${ma5 > ma20 ? '>' : '<'} MA20 (${fmt(ma20,dp)}) — Price (${fmt(price,dp)}) ${price > ma5 ? '>' : '<'} MA5.`;
        c5note = c5p         ? '✅ Clean bull structure: Price > MA5 > MA20.'
               : ma5 > ma20  ? '⚠️ MA aligned but price below MA5 — wait for price to reclaim MA5.'
               :               '⛔ MA5 below MA20 — broken structure. Higher risk entry.';
    } else {
        c5desc = 'MA5 not provided.';
        c5note = 'ℹ️ Add MA5 to verify price structure alignment.';
    }
    conditions.push({ n: 'Price Structure (MA5/MA20)', desc: c5desc, pass: c5p, note: c5note });
    if (c5p) score += 20;

    /* ── Entry zone maths ───────────────────── */
    const pZoneLow  = ma20;
    const pZoneHigh = +(ma20 + atr * 2).toFixed(dp);
    const idealEnt  = ma5 ? +Math.min(ma5, ma20 + atr * 0.8).toFixed(dp) : +(ma20 + atr * 0.5).toFixed(dp);
    const sl        = +(ma20 - atr * 1.3).toFixed(dp);
    const riskU     = idealEnt - sl;
    const tp1       = +(idealEnt + riskU * 1.5).toFixed(dp);
    const tp2       = +(idealEnt + riskU * 2.5).toFixed(dp);
    const tp3       = +(idealEnt + riskU * 4.0).toFixed(dp);
    const inZone    = price >= pZoneLow && price <= pZoneHigh;
    const riskPctOf = riskU > 0 ? (riskU / idealEnt * 100).toFixed(2) : '?';

    const sColor = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
    const sLabel = score >= 80 ? 'HIGH PROBABILITY ENTRY ZONE'
                 : score >= 60 ? 'MODERATE CONFLUENCE — REDUCE SIZE'
                 : score >= 40 ? 'LOW CONFLUENCE — EXTREME CAUTION'
                 :               'AVOID ENTRY — CONDITIONS NOT MET';
    const sCls   = score >= 80 ? 'proceed' : score >= 60 ? 'watch' : 'skip';

    $('enh-en-result').style.display = '';
    $('enh-en-result').innerHTML = `
      <div class="decision-strip ${sCls}">
        <div class="d-badge ${sCls}" style="font-size:26px;font-family:var(--head);">${score}%</div>
        <div>
          <div style="font-family:var(--head);font-size:17px;color:${sColor};">${sLabel}</div>
          <div style="font-size:12px;color:var(--dim);margin-top:.1rem;">
            ${score/20} of 5 conditions met — ${5 - score/20} missing</div>
        </div>
        <div style="margin-left:auto;font-size:13px;color:${inZone?'var(--green)':'var(--yellow)'};">
          ${inZone ? '✅ Price in entry zone' : '⚠️ Price outside optimal zone'}</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.6rem;">
        <div class="card">
          <div class="card-hdr"><span class="ci">🛡</span> Protected Zone</div>
          <div class="card-body">
            <div style="color:var(--accent);font-size:16px;font-weight:600;">${fmt(pZoneLow,dp)} – ${fmt(pZoneHigh,dp)}</div>
            <div style="font-size:11px;color:var(--dim);">MA20 to MA20 + 2×ATR</div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">📍</span> Ideal Entry</div>
          <div class="card-body">
            <div style="color:var(--accent);font-size:24px;font-weight:700;">${fmt(idealEnt,dp)}</div>
            <div style="font-size:11px;color:var(--dim);">MA5 / 0.8×ATR above MA20</div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">🛑</span> Stop Loss</div>
          <div class="card-body">
            <div style="color:var(--red);font-size:24px;font-weight:700;">${fmt(sl,dp)}</div>
            <div style="font-size:11px;color:var(--dim);">1.3×ATR below MA20 · ${riskPctOf}% risk</div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">🎯</span> Targets</div>
          <div class="card-body" style="font-size:12px;line-height:1.8;">
            <div>TP1 <span style="color:var(--green);font-weight:600;">${fmt(tp1,dp)}</span> &nbsp;R:R 1:1.5</div>
            <div>TP2 <span style="color:var(--green);font-weight:600;">${fmt(tp2,dp)}</span> &nbsp;R:R 1:2.5</div>
            <div>TP3 <span style="color:var(--green);font-weight:600;">${fmt(tp3,dp)}</span> &nbsp;R:R 1:4.0</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hdr"><span class="ci">✔</span> 5-Condition Confluence Checklist</div>
        <div class="card-body">
          ${conditions.map((c, i) => `
            <div style="padding:.55rem 0;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:.2rem;">
              <div style="display:flex;align-items:center;gap:.5rem;">
                <span class="${c.pass ? 'check-pass' : 'check-fail'}" style="font-size:15px;">${c.pass?'✔':'✘'}</span>
                <span style="font-size:13px;font-weight:600;color:var(--text);">C${i+1}: ${c.n}</span>
                <span style="margin-left:auto;font-size:14px;font-weight:700;color:${c.pass?'var(--green)':'var(--dim)'};">20%</span>
              </div>
              <div style="padding-left:1.5rem;font-size:12px;color:var(--dim);">${c.desc}</div>
              <div style="padding-left:1.5rem;font-size:12px;color:${c.pass?'var(--green)':'var(--yellow)'};">${c.note}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="advice-box ${score>=80?'green':score>=60?'yellow':'red'}">
        ${score >= 80
          ? `🎯 All critical conditions aligned — highest-probability, risk-defined entry. ` +
            `Enter near ${fmt(idealEnt,dp)}, stop hard at ${fmt(sl,dp)} (${riskPctOf}% of entry). ` +
            `TP1 ${fmt(tp1,dp)} R:R 1:1.5 — move SL to entry immediately after TP1 hit. ` +
            `TP2 ${fmt(tp2,dp)} R:R 1:2.5 — trail stop ATR below swing high. ` +
            `TP3 ${fmt(tp3,dp)} runner — hold with trailing stop only. Never widen SL.`
          : score >= 60
          ? `⚠️ Partial confluence (${score}%). Reduce size to 25–50% near ${fmt(idealEnt,dp)}. ` +
            `Set hard stop at ${fmt(sl,dp)}. Take profit at TP1 (${fmt(tp1,dp)}) if missing ` +
            `conditions don't confirm. Missing: ${conditions.filter(c=>!c.pass).map(c=>c.n).join(', ')}.`
          : `🔴 Insufficient confluence — ${5-score/20} condition(s) not met. ` +
            `Entering without alignment provides no statistical edge over random entry. ` +
            `Wait for: ${conditions.filter(c=>!c.pass).map(c=>c.n).join(', ')}. ` +
            `Forcing entry in low-confluence conditions is the leading cause of avoidable losses.`
        }
      </div>`;
}

/* ════════════════════════════════════════════════════════════════
   MODULE 4 — CANDLE PATTERN SCANNER
   Professional-grade pattern detection with trade action plans.
   Detects 18 key patterns across 1-bar, 2-bar, and 3-bar setups.
════════════════════════════════════════════════════════════════ */
function calcCandlePatterns() {
    const o1 = num('enh-cp-o1'), h1 = num('enh-cp-h1');
    const l1 = num('enh-cp-l1'), c1 = num('enh-cp-c1');
    if (!o1 || !h1 || !l1 || !c1) { alert('Current candle Open, High, Low and Close are required.'); return; }
    if (h1 < l1 || h1 < o1 || h1 < c1 || l1 > o1 || l1 > c1) { alert('Invalid OHLC: High must be highest and Low must be lowest value.'); return; }

    const o2 = num('enh-cp-o2'), h2 = num('enh-cp-h2');
    const l2 = num('enh-cp-l2'), c2 = num('enh-cp-c2');
    const o3 = num('enh-cp-o3'), h3 = num('enh-cp-h3');
    const l3 = num('enh-cp-l3'), c3 = num('enh-cp-c3');
    const atr     = num('enh-cp-atr');
    const vol     = num('enh-cp-vol');
    const trend   = document.getElementById('enh-cp-trend')?.value || 'up';
    const srZone  = document.getElementById('enh-cp-sr')?.value   || '';

    const dp  = c1 > 100 ? 2 : c1 > 1 ? 4 : 6;
    const has2 = o2 != null && h2 != null && l2 != null && c2 != null;
    const has3 = has2 && o3 != null && h3 != null && l3 != null && c3 != null;

    /* ── Candle geometry helpers ───────────────────────────────── */
    const body    = (o, c)    => Math.abs(c - o);
    const range   = (h, l)    => h - l;
    const bull    = (o, c)    => c > o;
    const bear    = (o, c)    => c < o;
    const doji    = (o, c, h, l) => body(o,c) <= range(h,l) * 0.1;
    const upShadow   = (o, c, h) => h - Math.max(o, c);
    const downShadow = (o, c, l) => Math.min(o, c) - l;
    const bodyMid = (o, c)    => (o + c) / 2;
    const bodyPct = (o, c, h, l) => range(h,l) > 0 ? (body(o,c) / range(h,l)) * 100 : 0;

    /* ── ATR-relative sizing (if available) ───────────────────── */
    const atrRef = atr || range(h1, l1);  // fallback to current candle range

    /* ── Pattern detection array ────────────────────────────────  */
    const patterns = [];

    const addPat = (name, direction, reliability, context, what, action, entry, sl, tip) => {
        patterns.push({ name, direction, reliability, context, what, action, entry, sl, tip });
    };

    /* ═══════════════ 1-BAR PATTERNS ════════════════ */

    /* Hammer / Pin Bar (Bullish) */
    const c1DownShadow = downShadow(o1, c1, l1);
    const c1UpShadow   = upShadow(o1, c1, h1);
    const c1Body       = body(o1, c1);
    const c1Range      = range(h1, l1);
    if (c1DownShadow >= c1Body * 2.5 && c1UpShadow <= c1Body * 0.5
        && c1Body > 0 && trend !== 'up' || (c1DownShadow >= c1Body * 2.5 && c1UpShadow <= c1Body * 0.5 && srZone === 'support')) {
        const qual = (c1DownShadow >= c1Body * 3 ? '★★★' : '★★☆');
        addPat('Hammer / Bullish Pin Bar', 'BULLISH', qual, 'Reversal at support',
            `Long lower shadow (${(c1DownShadow/atrRef*100).toFixed(0)}% of ATR) with small body near the top of the range. Price was pushed far down intrabar but buyers rejected the lows and closed strong. This rejection is the signal.`,
            'Wait for the NEXT candle to close bullish (above this candle\'s open) before entering. Do not enter on the hammer candle itself.',
            `${fmt(c1 + c1Body * 0.1, dp)} (above this candle close)`,
            `${fmt(l1 - atrRef * 0.3, dp)} (below the wick low)`,
            `Reliability increases dramatically when: (1) at a known support level, (2) volume is above average, (3) KDJ is oversold (J < 20). If all three apply, this is a high-conviction reversal.`);
    }

    /* Shooting Star / Bearish Pin Bar */
    if (c1UpShadow >= c1Body * 2.5 && c1DownShadow <= c1Body * 0.5 && c1Body > 0) {
        const qual = (c1UpShadow >= c1Body * 3 ? '★★★' : '★★☆');
        addPat('Shooting Star / Bearish Pin Bar', 'BEARISH', qual, 'Reversal at resistance',
            `Long upper shadow with small body near the bottom of the range. Bulls pushed price up sharply intrabar but sellers crushed it back down by close. The rejection of higher prices is bearish.`,
            'This signals that buyers are exhausted. Exit long positions. If short-selling: entry on the NEXT candle open with confirmation.',
            `${fmt(c1 - c1Body * 0.1, dp)} (below this candle close)`,
            `${fmt(h1 + atrRef * 0.2, dp)} (above the wick high)`,
            `Much more reliable at a known resistance level or after an extended uptrend. Confirm with KDJ overbought (J > 80) for highest probability.`);
    }

    /* Doji */
    if (doji(o1, c1, h1, l1) && c1Range > 0) {
        addPat('Doji — Indecision Candle', 'NEUTRAL', '★★☆', 'Transition / decision point',
            `Open and close are nearly identical — the candle has almost no body. This represents complete indecision between buyers and sellers. The market is at a tipping point.`,
            'Do not trade on the Doji itself. Watch the NEXT candle: if it closes bullish → buy. If it closes bearish → avoid or go short.',
            'Wait for next candle direction',
            'Set after next candle confirms',
            `A Doji is most meaningful after a strong trend. A Doji at the top of an uptrend is more bearish. At the bottom of a downtrend it is more bullish. Doji in ranging markets has low reliability.`);
    }

    /* Marubozu (Strong Trend Candle) */
    if (bodyPct(o1,c1,h1,l1) >= 80) {
        const bullMarubozu = bull(o1,c1);
        addPat(`${bullMarubozu ? 'Bullish' : 'Bearish'} Marubozu — Conviction Bar`, bullMarubozu ? 'BULLISH' : 'BEARISH', '★★★', 'Trend continuation',
            `The candle body fills ${bodyPct(o1,c1,h1,l1).toFixed(0)}% of the total range — almost no wicks. This means the winning side dominated the entire session from open to close with almost no opposition. This is the strongest single-candle signal.`,
            bullMarubozu
                ? 'Strong continuation signal. Can enter immediately on next candle open (momentum entry), or wait for a small pullback to the opening price of this candle for better R:R.'
                : 'Strong bearish continuation. Exit all longs immediately. This type of candle often continues lower the next session.',
            bullMarubozu ? `${fmt(c1, dp)} (current close)` : `${fmt(c1, dp)} (short entry)`,
            bullMarubozu ? `${fmt(l1 - atrRef * 0.5, dp)} (below this candle low)` : `${fmt(h1 + atrRef * 0.3, dp)} (above this candle high)`,
            `Volume confirmation: a Marubozu on 2×+ average volume is the strongest version. On low volume it may be a thin-market spike rather than genuine conviction.`);
    }

    /* Spinning Top */
    if (c1UpShadow > c1Body && c1DownShadow > c1Body && !doji(o1,c1,h1,l1)) {
        addPat('Spinning Top — Weakening Trend', 'NEUTRAL', '★☆☆', 'Momentum warning',
            `Both upper and lower shadows are longer than the body. Neither bulls nor bears could close convincingly, though both tried. This signals weakening momentum in the prevailing trend.`,
            'Reduce position size if you are in a trade. Wait for the next candle to confirm direction before acting.',
            'Wait for next candle direction',
            'Set after next candle confirms',
            `Most significant when appearing after a long trend. In an uptrend, a spinning top is an early warning that buyers are losing conviction. On its own it is weak — wait for confirmation.`);
    }

    /* ═══════════════ 2-BAR PATTERNS ════════════════ */
    if (has2) {
        const c2Body = body(o2, c2);
        const c2Range = range(h2, l2);

        /* Bullish Engulfing */
        if (bear(o2,c2) && bull(o1,c1)
            && o1 <= c2 && c1 >= o2
            && c1Body >= c2Body * 1.1) {
            const qual = c1Body >= c2Body * 1.5 ? '★★★' : '★★☆';
            addPat('Bullish Engulfing', 'BULLISH', qual, 'Reversal — downtrend to uptrend',
                `Today\'s green candle completely engulfs yesterday\'s red candle — buyers overwhelmed sellers and reversed the entire prior session\'s move. This is one of the most reliable two-candle reversal patterns.`,
                'Enter on the NEXT candle open (confirmation entry) or at the open of the session following the engulfing candle. A conservative entry waits for a small pullback to the midpoint of the engulfing candle.',
                `${fmt(Math.min(o1,c1) + body(o1,c1)*0.1, dp)} (above engulfing open)`,
                `${fmt(l1 - atrRef * 0.3, dp)} (below engulfing low)`,
                `Highest reliability: (1) after a clear downtrend, (2) at support zone, (3) volume on the engulfing candle is higher than the prior candle, (4) KDJ crosses bullish from oversold.`);
        }

        /* Bearish Engulfing */
        if (bull(o2,c2) && bear(o1,c1)
            && o1 >= c2 && c1 <= o2
            && c1Body >= c2Body * 1.1) {
            addPat('Bearish Engulfing', 'BEARISH', '★★★', 'Reversal — uptrend to downtrend',
                `Today\'s red candle completely engulfs yesterday\'s green candle — sellers overwhelmed buyers and erased the entire prior gain. Strong reversal signal when appearing after an uptrend.`,
                'Exit all long positions. If short-selling: enter on the NEXT candle open. Stop loss above the high of the engulfing candle.',
                `${fmt(c1 - atrRef * 0.1, dp)} (short entry below engulfing close)`,
                `${fmt(h1 + atrRef * 0.3, dp)} (above engulfing high)`,
                `Reliability multiplied when: at resistance, after extended uptrend, with RSI > 70 or KDJ > 85 on prior candle. Volume surge on the bearish engulfing dramatically improves odds.`);
        }

        /* Tweezer Bottom */
        if (Math.abs(l1 - l2) <= atrRef * 0.05 && bear(o2,c2) && bull(o1,c1)) {
            addPat('Tweezer Bottom', 'BULLISH', '★★☆', 'Reversal at support',
                `Two consecutive candles hit the exact same low — the market tested a price level twice and found strong buying support both times. Bears could not push any lower. This double rejection is a bullish signal.`,
                'Enter on the open of the THIRD candle (next bar). The double bottom low is your hard stop level.',
                `${fmt(c1 + atrRef * 0.1, dp)} (above current close)`,
                `${fmt(Math.min(l1,l2) - atrRef * 0.2, dp)} (below the double bottom)`,
                `More powerful when at a previous support level. Volume on the second (current) candle should be higher than the first to confirm buying conviction at that price.`);
        }

        /* Tweezer Top */
        if (Math.abs(h1 - h2) <= atrRef * 0.05 && bull(o2,c2) && bear(o1,c1)) {
            addPat('Tweezer Top', 'BEARISH', '★★☆', 'Reversal at resistance',
                `Two consecutive candles hit the same high — the market tested a price ceiling twice and was rejected both times. Buyers could not push any higher. This double rejection is a bearish signal.`,
                'Exit long positions. Short entry on the THIRD candle open. The double-top high is your stop level for shorts.',
                `${fmt(c1 - atrRef * 0.1, dp)} (below current close)`,
                `${fmt(Math.max(h1,h2) + atrRef * 0.2, dp)} (above the double top)`,
                `Most reliable at a previous resistance level or an all-time high. KDJ overbought (J > 80) on the second candle strengthens the signal significantly.`);
        }

        /* Inside Bar */
        if (h1 <= h2 && l1 >= l2) {
            addPat('Inside Bar — Consolidation / Coiling', 'NEUTRAL', '★★☆', 'Breakout pending',
                `Today\'s entire candle range is inside yesterday\'s range — the market compressed and coiled. This represents a pause after a move, where price is "gathering energy" before the next directional push.`,
                'Wait for price to break ABOVE the inside bar high (bullish breakout) or BELOW the inside bar low (bearish breakdown). The breakout direction should align with the prior trend.',
                trend === 'up' ? `${fmt(h1 + atrRef * 0.1, dp)} (breakout buy above inside bar high)` : `${fmt(l1 - atrRef * 0.1, dp)} (breakdown sell below inside bar low)`,
                trend === 'up' ? `${fmt(l1 - atrRef * 0.3, dp)}` : `${fmt(h1 + atrRef * 0.3, dp)}`,
                `The most powerful inside bars form after a strong momentum candle (Marubozu or large body candle). The smaller the inside bar relative to the mother bar, the more compressed the energy and the more explosive the expected breakout.`);
        }

        /* Harami */
        if (c2Body > 0 && c1Body <= c2Body * 0.5 && c1Body > 0) {
            const bullHarami = bear(o2,c2) && bull(o1,c1) && o1 >= c2 && c1 <= o2;
            const bearHarami = bull(o2,c2) && bear(o1,c1) && o1 <= c2 && c1 >= o2;
            if (bullHarami) {
                addPat('Bullish Harami — Hesitation at Low', 'BULLISH', '★★☆', 'Early reversal signal',
                    `A large bearish candle followed by a small bullish candle contained entirely within the prior body. The bears are losing control — they produced a large down candle but then could only produce a tiny body, suggesting exhaustion.`,
                    'This is an early warning, not a confirmed reversal. Wait for the THIRD candle to close bullish above the harami\'s high before entering. Entering too early on a harami is a common mistake.',
                    `${fmt(Math.max(o1,c1) + atrRef * 0.1, dp)} (above harami high — confirmed entry)`,
                    `${fmt(l2 - atrRef * 0.2, dp)} (below mother candle low)`,
                    `A harami needs confirmation. Without a strong third candle, the pattern fails about 40% of the time. Combine with oversold KDJ or RSI for best results.`);
            } else if (bearHarami) {
                addPat('Bearish Harami — Hesitation at High', 'BEARISH', '★★☆', 'Early reversal signal',
                    `A large bullish candle followed by a small bearish candle contained within the prior body. Buyers produced a big up candle but then only a tiny body — their momentum is fading.`,
                    'An early warning that the uptrend may be turning. Wait for a third candle to close bearish below the harami low before exiting or shorting. High false-positive rate if acting too early.',
                    `${fmt(Math.min(o1,c1) - atrRef * 0.1, dp)} (below harami low — confirmed exit)`,
                    `${fmt(h2 + atrRef * 0.2, dp)} (above mother candle high)`,
                    `Harami cross (doji inner candle) is the stronger version. Combine with overbought KDJ (J > 80) or RSI > 70 to filter out low-quality signals.`);
            }
        }
    }

    /* ═══════════════ 3-BAR PATTERNS ════════════════ */
    if (has3) {

        /* Morning Star */
        const c3Body = body(o3, c3);
        const c2Body3 = body(o2, c2);
        const c1Body3 = body(o1, c1);
        if (bear(o3,c3) && c3Body > atrRef * 0.4
            && c2Body3 <= c3Body * 0.35
            && bull(o1,c1) && c1Body3 > atrRef * 0.3
            && c1 > bodyMid(o3,c3)) {
            addPat('Morning Star', 'BULLISH', '★★★', 'Major reversal — 3-bar confirmation',
                `Three-candle reversal pattern: (1) a large bearish candle continues the downtrend, (2) a small-body candle (the "star") gaps or hesitates, suggesting seller exhaustion, (3) a strong bullish candle closes above the midpoint of the first candle. This three-stage confirmation is one of the most reliable reversal signals.`,
                'Enter on the NEXT (4th) candle open. The pattern is complete — the reversal is confirmed. Use normal position sizing if at support; full size if all three conditions below apply.',
                `${fmt(c1 + atrRef * 0.05, dp)} (above morning star close)`,
                `${fmt(l2 - atrRef * 0.3, dp)} (below the star\'s low)`,
                `Three reliability boosters: (1) gap between candles 1→2 and 2→3 (stronger), (2) volume increasing from candle 1 to candle 3, (3) at a major support zone or MA200. All three = maximum conviction buy.`);
        }

        /* Evening Star */
        if (bull(o3,c3) && c3Body > atrRef * 0.4
            && c2Body3 <= c3Body * 0.35
            && bear(o1,c1) && c1Body3 > atrRef * 0.3
            && c1 < bodyMid(o3,c3)) {
            addPat('Evening Star', 'BEARISH', '★★★', 'Major reversal — 3-bar confirmation',
                `Mirror of the Morning Star: (1) large bullish candle in uptrend, (2) small star showing buyer hesitation, (3) large bearish candle closing below the first candle\'s midpoint. Three-stage confirmation of trend reversal from bull to bear.`,
                'Exit all long positions immediately — the pattern is complete. For short sellers: enter on the next candle open with stop above the star\'s high.',
                `${fmt(c1 - atrRef * 0.05, dp)} (short below evening star close)`,
                `${fmt(h2 + atrRef * 0.3, dp)} (above the star\'s high)`,
                `Reliability boosters: volume increasing on the third (bearish) candle, the pattern appears at a resistance level, RSI or KDJ was overbought on the first candle. All three = avoid adding any new longs.`);
        }

        /* Three White Soldiers */
        if (bull(o1,c1) && bull(o2,c2) && bull(o3,c3)
            && c1 > c2 && c2 > c3
            && o1 > o3 && o2 > o3
            && bodyPct(o1,c1,h1,l1) >= 50
            && bodyPct(o2,c2,h2,l2) >= 50
            && bodyPct(o3,c3,h3,l3) >= 50) {
            addPat('Three White Soldiers', 'BULLISH', '★★★', 'Strong trend confirmation',
                `Three consecutive strong bullish candles, each closing higher than the previous, each opening within the prior candle\'s body. This is a powerful continuation pattern showing sustained buying pressure over three sessions.`,
                'Strong trend continuation signal. Can add to existing long positions. New entries should wait for a small pullback as the pattern itself represents 3 bars of buying — risk/reward is best on a pullback to the first soldier\'s close.',
                `${fmt(c3, dp)} (pullback entry near 1st soldier close)`,
                `${fmt(l3 - atrRef * 0.5, dp)} (below 1st soldier low)`,
                `Watch for this pattern after a consolidation or at a breakout from resistance. If all three candles are Marubozu-style (large bodies, tiny wicks), that is the maximum bullish version. Volume should be increasing across the three candles.`);
        }

        /* Three Black Crows */
        if (bear(o1,c1) && bear(o2,c2) && bear(o3,c3)
            && c1 < c2 && c2 < c3
            && bodyPct(o1,c1,h1,l1) >= 50
            && bodyPct(o2,c2,h2,l2) >= 50
            && bodyPct(o3,c3,h3,l3) >= 50) {
            addPat('Three Black Crows', 'BEARISH', '★★★', 'Strong downtrend confirmation',
                `Three consecutive large bearish candles, each closing lower than the previous. A mirror of Three White Soldiers — strong sustained selling pressure over three sessions with almost no buyer resistance.`,
                'Exit all long positions immediately. This is one of the strongest bearish continuation signals. Do not try to buy this pattern — the market is telling you sellers are fully in control.',
                `${fmt(c1, dp)} (short entry below 3rd crow close)`,
                `${fmt(h3 + atrRef * 0.3, dp)} (above 1st crow open)`,
                `Most damaging when it appears after an extended uptrend or at a resistance zone. If volume has been increasing across all three candles, a significant move lower is likely. Consider exiting the entire position, not just reducing.`);
        }
    }

    /* ══════════════════════════════════════════
       RENDER RESULTS
    ════════════════════════════════════════════ */
    const result = $('enh-cp-result');
    result.style.display = '';

    const relMap = { '★★★':'var(--green)', '★★☆':'var(--accent)', '★☆☆':'var(--dim)' };
    const dirMap = {
        'BULLISH': { col:'var(--green)', bg:'rgba(0,232,122,.06)', border:'rgba(0,232,122,.3)', icon:'🟢' },
        'BEARISH': { col:'var(--red)',   bg:'rgba(240,58,74,.06)', border:'rgba(240,58,74,.3)', icon:'🔴' },
        'NEUTRAL': { col:'var(--yellow)',bg:'rgba(245,200,66,.05)', border:'rgba(245,200,66,.25)', icon:'⚪' },
    };

    // Context modifiers to overall assessment
    const volBoost  = vol && vol >= 1.5;
    const atSupport = srZone === 'support';
    const atResist  = srZone === 'resistance';

    const bullPatterns = patterns.filter(p => p.direction === 'BULLISH');
    const bearPatterns = patterns.filter(p => p.direction === 'BEARISH');
    const neutPatterns = patterns.filter(p => p.direction === 'NEUTRAL');

    let overallDir = 'NEUTRAL', overallSummary = '';
    if (bullPatterns.length > bearPatterns.length) {
        overallDir = 'BULLISH';
        overallSummary = `${bullPatterns.length} bullish pattern${bullPatterns.length>1?'s':''} detected${bearPatterns.length>0?' ('+bearPatterns.length+' conflicting bearish — reduce confidence)':''}.` +
            (atSupport ? ' At support zone — increases pattern reliability.' : '') +
            (volBoost ? ' Volume above average — confirms buying interest.' : '');
    } else if (bearPatterns.length > bullPatterns.length) {
        overallDir = 'BEARISH';
        overallSummary = `${bearPatterns.length} bearish pattern${bearPatterns.length>1?'s':''} detected${bullPatterns.length>0?' ('+bullPatterns.length+' conflicting bullish — reduce confidence)':''}.` +
            (atResist ? ' At resistance zone — increases pattern reliability.' : '') +
            (volBoost ? ' Volume above average — confirms selling pressure.' : '');
    } else if (patterns.length === 0) {
        overallSummary = 'No classic candlestick patterns detected in this candle data. This is normal — not every bar forms a textbook pattern. Continue monitoring for pattern formation on the next candle.';
    } else {
        overallSummary = 'Mixed patterns detected — conflicting signals. Wait for additional confirmation before entering a trade.';
    }

    const dirStyle = dirMap[overallDir];

    result.innerHTML = `
      <div class="decision-strip ${overallDir==='BULLISH'?'proceed':overallDir==='BEARISH'?'skip':'watch'}"
           style="margin-bottom:.5rem;">
        <div class="d-badge ${overallDir==='BULLISH'?'proceed':overallDir==='BEARISH'?'skip':'watch'}" style="font-size:17px;">
          ${dirStyle.icon} ${overallDir}
        </div>
        <div style="flex:1;font-size:13px;color:var(--text);">${overallSummary}</div>
        <div style="font-size:12px;color:var(--dim);">${patterns.length} pattern${patterns.length!==1?'s':''} found</div>
      </div>

      ${patterns.length === 0 ? `
        <div class="advice-box yellow">
          <div style="font-weight:600;margin-bottom:.3rem;">No standard patterns detected</div>
          <div style="font-size:12px;">Common reasons: (1) candle is mid-session (pattern not yet complete), (2) this is a continuation bar without a pattern, (3) try adding the previous candle data to unlock 2-bar patterns.</div>
        </div>` : ''}

      ${patterns.map(p => {
        const ds = dirMap[p.direction] || dirMap['NEUTRAL'];
        const rc = relMap[p.reliability] || 'var(--dim)';
        return `
        <div class="card" style="border-left:3px solid ${ds.col};margin-bottom:.4rem;">
          <div class="card-hdr" style="color:${ds.col};">
            <span style="font-size:14px;">${ds.icon}</span>
            <strong>${p.name}</strong>
            <span style="margin-left:.5rem;font-size:11px;background:${ds.bg};border:1px solid ${ds.border};
                          padding:1px 7px;border-radius:4px;color:${ds.col};">${p.direction}</span>
            <span style="margin-left:auto;font-size:14px;color:${rc};" title="Reliability">${p.reliability}</span>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:.45rem;">
            <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${ds.col};font-weight:600;">${p.context}</div>
            <div style="font-size:12.5px;color:var(--text);line-height:1.6;">${p.what}</div>
            <div style="padding:.4rem .65rem;border-radius:6px;background:rgba(0,0,0,.12);border-left:2px solid ${ds.col};font-size:12px;color:var(--dim);">
              <strong style="color:${ds.col};">Trade Action: </strong>${p.action}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem;font-size:11.5px;">
              <div style="padding:.3rem .5rem;background:rgba(0,200,240,.06);border-radius:4px;">
                <span style="color:var(--dim);">Entry Zone: </span>
                <span style="color:var(--accent);font-weight:600;">${p.entry}</span>
              </div>
              <div style="padding:.3rem .5rem;background:rgba(240,58,74,.06);border-radius:4px;">
                <span style="color:var(--dim);">Stop Loss: </span>
                <span style="color:var(--red);font-weight:600;">${p.sl}</span>
              </div>
            </div>
            <div style="font-size:11px;color:var(--dim);padding:.3rem .5rem;background:rgba(0,0,0,.08);border-radius:4px;">
              <span style="color:var(--yellow);">💡 Pro tip: </span>${p.tip}
            </div>
          </div>
        </div>`; }).join('')}

      <div class="card" style="margin-top:.4rem;">
        <div class="card-hdr"><span class="ci">📚</span> Reliability Guide — How to Read the Star Rating</div>
        <div class="card-body" style="font-size:12px;color:var(--dim);display:flex;flex-direction:column;gap:.3rem;">
          <div><span style="color:var(--green);font-size:14px;">★★★</span> <strong style="color:var(--text);">High reliability</strong> — Statistically proven pattern with 60–70%+ win rate when in correct context. Tradeable with normal position size.</div>
          <div><span style="color:var(--accent);font-size:14px;">★★☆</span> <strong style="color:var(--text);">Moderate reliability</strong> — Meaningful pattern but requires one or more confirmations (KDJ, volume, support level) before full-size entry. Use 50% position.</div>
          <div><span style="color:var(--dim);font-size:14px;">★☆☆</span> <strong style="color:var(--text);">Weak / early signal</strong> — Requires strong external confirmation. Do not trade on pattern alone. Watch for follow-through on the next candle.</div>
          <div style="margin-top:.2rem;padding:.4rem .6rem;background:rgba(245,200,66,.05);border-radius:5px;border-left:2px solid var(--yellow);">
            <strong style="color:var(--yellow);">Context multipliers that increase reliability for ALL patterns:</strong>
            <br/>1. Pattern forms at a known S/R level &nbsp;·&nbsp; 2. Volume above average (≥1.5×) &nbsp;·&nbsp; 3. KDJ in oversold/overbought extreme &nbsp;·&nbsp; 4. RSI divergence present &nbsp;·&nbsp; 5. ADX > 25 (existing trend)
          </div>
        </div>
      </div>`;
}
