function switchEnhTab(id) {
    document.querySelectorAll('.enh-tab-btn').forEach(t =>
        t.classList.toggle('active', t.dataset.et === id));
    document.querySelectorAll('.enh-sub-panel').forEach(p =>
        p.classList.toggle('active', p.id === 'enh-pnl-' + id));
}

function resetEnhance() {
    const ids = [
        'enh-st-h','enh-st-l','enh-st-c','enh-st-atr','enh-st-mult',
        'enh-fc-price','enh-fc-ma5','enh-fc-ma20','enh-fc-ma50','enh-fc-ma200',
        'enh-fc-k','enh-fc-d','enh-fc-j','enh-fc-rsi',
        'enh-fc-dif','enh-fc-dea','enh-fc-hist',
        'enh-fc-adx','enh-fc-pdi','enh-fc-mdi','enh-fc-adxr',
        'enh-fc-atr','enh-fc-vol','enh-fc-st',
        'enh-en-price','enh-en-ma20','enh-en-ma5','enh-en-atr',
        'enh-en-k','enh-en-d','enh-en-j',
        'enh-en-adx','enh-en-pdi','enh-en-mdi','enh-en-hist','enh-en-vol',
    ];
    ids.forEach(id => { const el = $(id); if (el) el.value = ''; });
    ['enh-st-result','enh-fc-result','enh-en-result'].forEach(id => {
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
        'ema-price' : 'enh-fc-price', 'ema-e8'   : 'enh-fc-ma5',
        'ema-e21'   : 'enh-fc-ma20',  'ema-e55'  : 'enh-fc-ma50',
        'ema-e200'  : 'enh-fc-ma200',
        'ema-k'     : 'enh-fc-k',     'ema-d'    : 'enh-fc-d',
        'ema-j'     : 'enh-fc-j',     'ema-rsi'  : 'enh-fc-rsi',
        'ema-dif'   : 'enh-fc-dif',   'ema-dea'  : 'enh-fc-dea',
        'ema-adx'   : 'enh-fc-adx',   'ema-pdi'  : 'enh-fc-pdi',
        'ema-mdi'   : 'enh-fc-mdi',   'ema-adxr' : 'enh-fc-adxr',
        'ema-atr'   : 'enh-fc-atr',   'ema-vol'  : 'enh-fc-vol',
        'ema-st'    : 'enh-fc-st',
    };
    let filled = 0;
    Object.entries(map).forEach(([src, dst]) => {
        const s = $(src), d = $(dst);
        if (s && d && s.value.trim()) { d.value = s.value; filled++; }
    });
    if (filled > 0) { switchTab('enhance'); switchEnhTab('fc'); }
    else alert('Run EMA Calc first so there are values to transfer.');
}

/* Inject "Send to Forecast" buttons into MA and EMA result areas on load */
document.addEventListener('DOMContentLoaded', () => {
    const injectBtn = (resultId, fn, label) => {
        const el = $(resultId);
        if (!el) return;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin-top:.5rem;';
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.style.cssText = 'font-size:13px;padding:.35rem 1rem;';
        btn.textContent = label;
        btn.onclick = fn;
        wrap.appendChild(btn);
        el.appendChild(wrap);
    };
    injectBtn('ma-result',  fillForecastFromMA,  '→ Send to Smart Tools Forecast');
    injectBtn('ema-result', fillForecastFromEMA, '→ Send to Smart Tools Forecast');
});


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

    /* ── Render output ──────────────────────── */
    $('enh-fc-result').style.display = '';
    $('enh-fc-result').innerHTML = `
      <div class="decision-strip ${dirCls}" style="gap:.6rem;">
        <div class="d-badge ${dirCls}" style="font-size:19px;">${dir}</div>
        <div class="risk-pill ${dirCls==='proceed'?'risk-low':dirCls==='skip'?'risk-high':'risk-medium'}">${momentum}</div>
        <div style="flex:1;font-size:13px;">${timing}</div>
        <div style="font-family:var(--head);font-size:18px;font-weight:700;color:${dirColor};">${conf}%</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:.6rem;">
        <div class="card">
          <div class="card-hdr"><span class="ci">🐂</span> Bull Score</div>
          <div class="card-body">
            <div style="font-size:26px;font-weight:700;color:var(--green);">${bullPct.toFixed(0)}%</div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:.4rem;overflow:hidden;">
              <div style="height:4px;width:${bullPct}%;background:var(--green);border-radius:2px;"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">🐻</span> Bear Score</div>
          <div class="card-body">
            <div style="font-size:26px;font-weight:700;color:var(--red);">${bearPct.toFixed(0)}%</div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:.4rem;overflow:hidden;">
              <div style="height:4px;width:${bearPct}%;background:var(--red);border-radius:2px;"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><span class="ci">⚡</span> Net Momentum</div>
          <div class="card-body">
            <div style="font-size:26px;font-weight:700;color:${dirColor};">${net>0?'+':''}${net.toFixed(0)}</div>
            <div style="font-size:11px;color:var(--dim);">bull pts − bear pts</div>
          </div>
        </div>
        ${atr ? `
        <div class="card">
          <div class="card-hdr"><span class="ci">🎯</span> Projected Zones</div>
          <div class="card-body" style="font-size:12px;line-height:1.7;">
            <div>🛑 SL &nbsp;<span style="color:var(--red);font-weight:600;">${fmt(slPrice,dp)}</span></div>
            <div>✅ TP1 <span style="color:var(--green);font-weight:600;">${fmt(tp1Price,dp)}</span>&nbsp;R:R 1:${rr1}</div>
            <div>🎯 TP2 <span style="color:var(--green);font-weight:600;">${fmt(tp2Price,dp)}</span>&nbsp;R:R 1:${rr2}</div>
            <div>🚀 TP3 <span style="color:var(--green);font-weight:600;">${fmt(tp3Price,dp)}</span>&nbsp;R:R 1:${rr3}</div>
          </div>
        </div>` : ''}
      </div>

      <div class="card">
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

      <div class="card">
        <div class="card-hdr"><span class="ci">📈</span> Momentum Forecast</div>
        <div class="card-body">
          <div class="check-row" style="flex-direction:column;align-items:flex-start;gap:.2rem;padding:.5rem 0;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);">Short term (1–3 candles)</div>
            <div style="font-size:13px;color:var(--text);">${narr.short}</div>
          </div>
          <div class="check-row" style="flex-direction:column;align-items:flex-start;gap:.2rem;padding:.5rem 0;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);">Medium term (5–15 candles)</div>
            <div style="font-size:13px;color:var(--text);">${narr.medium}</div>
          </div>
          <div class="check-row" style="flex-direction:column;align-items:flex-start;gap:.2rem;padding:.5rem 0;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);">Long term (macro bias)</div>
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
