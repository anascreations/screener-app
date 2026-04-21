/* ═══════════════════════════════════════════════════════════════════
   TRADEMATRIX — TRADING BUSINESS DASHBOARD
   tradematrix-business.js  v1.0
   Modules: Journal · Capital · P&L · Runway · Sizer · Gates · Income
   All data persists in localStorage under prefix "tmb_"
═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── Helpers ──────────────────────────────────────────────────────
const $b = id => document.getElementById(id);
const fmtRM  = (n, dec=0) => 'RM ' + (n >= 0 ? '' : '-') + Math.abs(n).toLocaleString('en-MY', {minimumFractionDigits: dec, maximumFractionDigits: dec});
const fmtPct = (n, dec=1) => (n >= 0 ? '+' : '') + n.toFixed(dec) + '%';
const clr    = n => n >= 0 ? 'var(--green)' : 'var(--red)';
const now    = () => new Date();
const yyyymm = (d=new Date()) => d.toISOString().slice(0,7);
const monthLabel = ym => { const [y,m] = ym.split('-'); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1] + ' ' + y; };
const todayISO   = () => new Date().toISOString().slice(0,10);

function dbGet(key, def=null) {
  try { const v = localStorage.getItem('tmb_' + key); return v ? JSON.parse(v) : def; } catch(e){ return def; }
}
function dbSet(key, val) {
  try { localStorage.setItem('tmb_' + key, JSON.stringify(val)); } catch(e){}
}

// ── Tab integration — extend existing switchTab ───────────────────
const _origSwitchTab = window.switchTab;
window.switchTab = function(tab) {
  const bizTabs = ['journal','capital','pnl','runway','sizer','gates','income'];
  // Deactivate all panels & tab buttons
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (bizTabs.includes(tab)) {
    const p = $b('panel-' + tab);
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (p) p.classList.add('active');
    if (btn) btn.classList.add('active');
    // Refresh the panel
    if (tab === 'journal')  { jRenderTable(); jRenderStats(); }
    if (tab === 'pnl')      { pnlRender(); }
    if (tab === 'gates')    { gatesRender(); }
    if (tab === 'income')   { incRender(); }
    if (tab === 'capital')  { capCalc(); }
    if (tab === 'runway')   { rwyCalc(); }
    if (tab === 'sizer')    { szCalc(); }
  } else {
    if (_origSwitchTab) _origSwitchTab(tab);
  }
};

// ══════════════════════════════════════════════════════════════════
//  MODULE 1: TRADE JOURNAL
// ══════════════════════════════════════════════════════════════════

function jLoadTrades() { return dbGet('trades', []); }
function jSaveTrades(t){ dbSet('trades', t); }

function jClearForm() {
  ['j-code','j-entry','j-exit','j-lots','j-edate','j-xdate','j-score',
   'j-rr-plan','j-sl','j-tp1','j-notes'].forEach(id => { const e = $b(id); if(e) e.value = ''; });
  $b('j-dir').value = 'LONG';
  $b('j-strat').value = 'MA';
  $b('j-tf').value = 'Daily';
  $b('j-emotion').value = 'Disciplined';
  const msg = $b('j-form-msg'); if(msg) msg.style.display = 'none';
}

function jAddTrade() {
  const code    = ($b('j-code')?.value || '').trim().toUpperCase();
  const entry   = parseFloat($b('j-entry')?.value);
  const exit    = parseFloat($b('j-exit')?.value);
  const lots    = parseFloat($b('j-lots')?.value);
  const edate   = $b('j-edate')?.value || todayISO();
  const xdate   = $b('j-xdate')?.value || todayISO();
  const msg     = $b('j-form-msg');

  if (!code || isNaN(entry) || isNaN(exit) || isNaN(lots)) {
    if(msg){ msg.style.display=''; msg.style.color='var(--red)'; msg.textContent='⚠️ Stock code, entry, exit and lots are required.'; }
    return;
  }

  const dir    = $b('j-dir')?.value || 'LONG';
  const pnlAmt = dir === 'LONG' ? (exit - entry) * lots : (entry - exit) * lots;
  const pnlPct = dir === 'LONG' ? ((exit - entry) / entry) * 100 : ((entry - exit) / entry) * 100;
  const sl     = parseFloat($b('j-sl')?.value) || null;
  const riskPerUnit = sl ? Math.abs(entry - sl) : null;
  const tp1    = parseFloat($b('j-tp1')?.value) || null;
  const rrActual = (riskPerUnit && tp1)
    ? (Math.abs((dir==='LONG'?exit-entry:entry-exit)) / riskPerUnit).toFixed(2)
    : null;

  const d1 = new Date(edate), d2 = new Date(xdate);
  const holdDays = Math.round((d2 - d1) / 86400000);

  const trade = {
    id: Date.now(),
    code, dir,
    strategy : $b('j-strat')?.value || 'MA',
    tf        : $b('j-tf')?.value || 'Daily',
    entry, exit, lots,
    edate, xdate, holdDays,
    pnlAmt: +pnlAmt.toFixed(2),
    pnlPct: +pnlPct.toFixed(2),
    sl: sl || null,
    tp1: tp1 || null,
    rrPlan  : parseFloat($b('j-rr-plan')?.value) || null,
    rrActual: rrActual ? parseFloat(rrActual) : null,
    score   : parseInt($b('j-score')?.value) || null,
    emotion : $b('j-emotion')?.value || 'Disciplined',
    notes   : ($b('j-notes')?.value || '').trim(),
    month   : yyyymm(new Date(edate)),
  };

  const trades = jLoadTrades();
  trades.push(trade);
  jSaveTrades(trades);

  if(msg){ msg.style.display=''; msg.style.color='var(--green)'; msg.textContent=`✅ Trade logged: ${code} ${dir} — ${pnlAmt >= 0 ? 'WIN' : 'LOSS'} ${fmtRM(pnlAmt,2)} (${pnlPct.toFixed(2)}%)`; }
  jClearForm();
  jRenderTable();
  jRenderStats();
  // Refresh P&L if open
  try { pnlRender(); } catch(e){}
  try { gatesRender(); } catch(e){}
}

function jDeleteTrade(id) {
  if (!confirm('Delete this trade?')) return;
  jSaveTrades(jLoadTrades().filter(t => t.id !== id));
  jRenderTable(); jRenderStats();
  try { pnlRender(); } catch(e){}
}

function jRenderTable() {
  const tbody = $b('j-tbody'); if (!tbody) return;
  let trades = jLoadTrades();
  const fs = $b('j-filter-strat')?.value || '';
  const fr = $b('j-filter-result')?.value || '';
  if (fs) trades = trades.filter(t => t.strategy === fs);
  if (fr === 'WIN')  trades = trades.filter(t => t.pnlAmt >= 0);
  if (fr === 'LOSS') trades = trades.filter(t => t.pnlAmt < 0);
  trades = [...trades].reverse();

  if (!trades.length) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;color:var(--dim);padding:2rem">No trades match filter.</td></tr>';
    return;
  }

  tbody.innerHTML = trades.map(t => {
    const win = t.pnlAmt >= 0;
    return `<tr>
      <td>${t.xdate || t.edate}</td>
      <td><strong style="color:var(--accent)">${t.code}</strong></td>
      <td><span class="risk-pill ${win?'risk-low':'risk-high'}" style="font-size:10px">${t.dir}</span></td>
      <td>${t.strategy}</td>
      <td style="color:var(--dim)">${t.tf}</td>
      <td>${t.entry.toFixed(3)}</td>
      <td>${t.exit.toFixed(3)}</td>
      <td>${t.lots.toLocaleString()}</td>
      <td style="color:${clr(t.pnlAmt)};font-weight:700">${fmtRM(t.pnlAmt,2)}</td>
      <td style="color:${clr(t.pnlPct)}">${fmtPct(t.pnlPct)}</td>
      <td>${t.rrActual ?? '—'}</td>
      <td>${t.score ?? '—'}</td>
      <td style="font-size:11px">${t.emotion}</td>
      <td style="font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.notes}">${t.notes || '—'}</td>
      <td><button onclick="jDeleteTrade(${t.id})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px" title="Delete">✕</button></td>
    </tr>`;
  }).join('');
}

function jCalcStats(trades) {
  if (!trades.length) return null;
  const wins  = trades.filter(t => t.pnlAmt >= 0);
  const loses = trades.filter(t => t.pnlAmt < 0);
  const wr    = wins.length / trades.length;
  const avgW  = wins.length  ? wins.reduce((s,t)=>s+t.pnlAmt,0)/wins.length   : 0;
  const avgL  = loses.length ? loses.reduce((s,t)=>s+t.pnlAmt,0)/loses.length : 0;
  const exp   = wr * avgW + (1-wr) * avgL;
  const grossW = wins.reduce((s,t)=>s+t.pnlAmt,0);
  const grossL = Math.abs(loses.reduce((s,t)=>s+t.pnlAmt,0));
  const pf     = grossL > 0 ? grossW / grossL : grossW > 0 ? 999 : 0;
  // Max loss streak
  let streak=0, maxStreak=0;
  trades.forEach(t => { if(t.pnlAmt<0){streak++;maxStreak=Math.max(maxStreak,streak);}else{streak=0;} });
  // Best strategy
  const stratMap = {};
  trades.forEach(t => {
    if (!stratMap[t.strategy]) stratMap[t.strategy] = {w:0,n:0};
    stratMap[t.strategy].n++;
    if (t.pnlAmt>=0) stratMap[t.strategy].w++;
  });
  let bestStrat = '—', bestWR = 0;
  Object.entries(stratMap).forEach(([s,v]) => { const wr2=v.w/v.n; if(v.n>=3&&wr2>bestWR){bestWR=wr2;bestStrat=s;} });
  // Worst emotion
  const emoMap = {};
  trades.forEach(t => {
    if (!emoMap[t.emotion]) emoMap[t.emotion] = {sum:0,n:0};
    emoMap[t.emotion].sum += t.pnlAmt;
    emoMap[t.emotion].n++;
  });
  let worstEmo = '—', worstAvg = 0;
  Object.entries(emoMap).forEach(([e,v]) => {
    const avg = v.sum/v.n;
    if (worstEmo==='—' || avg < worstAvg) { worstAvg=avg; worstEmo=e; }
  });
  return { wr, avgW, avgL, exp, pf, maxStreak, bestStrat, worstEmo,
           wins: wins.length, losses: loses.length, total: trades.length,
           totalPnl: trades.reduce((s,t)=>s+t.pnlAmt,0) };
}

function jRenderStats() {
  const trades = jLoadTrades();
  const st = jCalcStats(trades);

  // Hero stats
  const heroTotal = $b('j-total-trades'); if(heroTotal) heroTotal.textContent = trades.length;
  const heroWR    = $b('j-win-rate');
  const heroPnl   = $b('j-total-pnl');
  const heroExp   = $b('j-expectancy');

  if (!st) {
    if(heroWR)  heroWR.textContent='—';
    if(heroPnl) heroPnl.textContent='RM 0';
    if(heroExp) heroExp.textContent='—';
    const sr = $b('j-stats-row'); if(sr) sr.style.display='none';
    return;
  }

  if(heroWR) { heroWR.textContent = (st.wr*100).toFixed(1)+'%'; heroWR.style.color = st.wr>=0.55?'var(--green)':st.wr>=0.45?'var(--yellow)':'var(--red)'; }
  if(heroPnl){ heroPnl.textContent = fmtRM(st.totalPnl,0); heroPnl.style.color = clr(st.totalPnl); }
  if(heroExp){ heroExp.textContent = (st.exp>=0?'+':'')+st.exp.toFixed(2); heroExp.style.color = clr(st.exp); }

  const sr = $b('j-stats-row'); if(sr) sr.style.display='grid';
  const set = (id, val, color) => { const e=$b(id); if(e){e.textContent=val; if(color)e.style.color=color;} };
  set('j-wr',       (st.wr*100).toFixed(1)+'%', st.wr>=0.55?'var(--green)':st.wr>=0.45?'var(--yellow)':'var(--red)');
  set('j-wr-sub',   `${st.wins}W / ${st.losses}L / ${st.total} total`);
  set('j-avg-win',  fmtRM(st.avgW,2));
  set('j-avg-win-sub', 'per winning trade');
  set('j-avg-loss', fmtRM(st.avgL,2), 'var(--red)');
  set('j-exp',      (st.exp>=0?'+':'')+st.exp.toFixed(2), clr(st.exp));
  set('j-pf',       st.pf.toFixed(2), st.pf>=1.5?'var(--green)':st.pf>=1?'var(--yellow)':'var(--red)');
  set('j-streak',   st.maxStreak + ' losses');
  set('j-best-strat', st.bestStrat, 'var(--accent)');
  set('j-worst-emo',  st.worstEmo.replace(/[😎🧘😰😤⚠️❌]/gu,'').trim());
}

function jExportCSV() {
  const trades = jLoadTrades();
  if (!trades.length) { alert('No trades to export.'); return; }
  const headers = ['Date','Code','Dir','Strategy','TF','Entry','Exit','Lots','PnL(RM)','PnL(%)','RR_Actual','Score','Emotion','Notes'];
  const rows = trades.map(t => [t.xdate,t.code,t.dir,t.strategy,t.tf,t.entry,t.exit,t.lots,t.pnlAmt,t.pnlPct,t.rrActual||'',t.score||'',t.emotion,`"${t.notes||''}"`].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'tradematrix_journal_' + todayISO() + '.csv';
  a.click();
}

// ══════════════════════════════════════════════════════════════════
//  MODULE 2: CAPITAL MANAGER
// ══════════════════════════════════════════════════════════════════

function capCalc() {
  const tradeCapital = parseFloat($b('cap-trade')?.value) || 0;
  const riskPct      = parseFloat($b('cap-risk-pct')?.value) || 1;
  const monthPnl     = parseFloat($b('cap-month-pnl')?.value) || 0;
  const dd           = parseFloat($b('cap-dd')?.value) || 0;

  // Trading result
  const res = $b('cap-trade-result');
  if (res && tradeCapital > 0) {
    res.style.display = '';
    const maxLoss = tradeCapital * riskPct / 100;
    const ddPct   = tradeCapital > 0 ? (dd / tradeCapital) * 100 : 0;
    const ddStatus = ddPct < 5 ? ['green','✅ Normal drawdown'] : ddPct < 10 ? ['yellow','⚠️ Moderate — review setup quality'] : ['red','🔴 High drawdown — reduce size or pause'];
    res.innerHTML = `
      <div class="biz-stats-row" style="margin-bottom:.75rem">
        <div class="biz-kpi-card"><div class="biz-kpi-label">Max Loss / Trade</div><div class="biz-kpi-val red">${fmtRM(maxLoss,0)}</div></div>
        <div class="biz-kpi-card"><div class="biz-kpi-label">Month P&L</div><div class="biz-kpi-val" style="color:${clr(monthPnl)}">${fmtRM(monthPnl,0)}</div></div>
        <div class="biz-kpi-card"><div class="biz-kpi-label">Drawdown</div><div class="biz-kpi-val" style="color:var(--${ddStatus[0]})">${ddPct.toFixed(1)}%</div></div>
        <div class="biz-kpi-card"><div class="biz-kpi-label">Capital After DD</div><div class="biz-kpi-val">${fmtRM(tradeCapital - dd, 0)}</div></div>
      </div>
      <div class="advice-box ${ddStatus[0]}" style="font-size:13px">${ddStatus[1]}</div>`;
  }

  // Retirement capital
  const goldG   = parseFloat($b('cap-gold-g')?.value) || 0;
  const goldP   = parseFloat($b('cap-gold-p')?.value) || 0;
  const getfU   = parseFloat($b('cap-goldetf-u')?.value) || 0;
  const getfP   = parseFloat($b('cap-goldetf-p')?.value) || 0;
  const fsmU    = parseFloat($b('cap-fsm-u')?.value) || 0;
  const fsmP    = parseFloat($b('cap-fsm-p')?.value) || 0;
  const usdmyr  = parseFloat($b('cap-usdmyr')?.value) || 4.42;
  const cashUSD = parseFloat($b('cap-cash-usd')?.value) || 0;
  const epf     = parseFloat($b('cap-epf')?.value) || 0;
  const propVal = parseFloat($b('cap-property')?.value) || 0;
  const propLoan= parseFloat($b('cap-loan')?.value) || 0;
  const other   = parseFloat($b('cap-other')?.value) || 0;

  const goldRM   = goldG * goldP;
  const goldetfRM= getfU * getfP;
  const fsmRM    = fsmU * fsmP * usdmyr;
  const cashRM   = cashUSD * usdmyr;
  const propEqRM = propVal - propLoan;

  const totalRetire = goldRM + goldetfRM + fsmRM + cashRM + epf + propEqRM + other;
  const totalGold   = goldRM + goldetfRM + fsmRM;
  const totalAll    = totalRetire + tradeCapital;

  if (totalRetire > 0) {
    const retRes = $b('cap-retire-result');
    if (retRes) {
      retRes.style.display = '';
      retRes.innerHTML = `
        <div class="biz-stats-row">
          <div class="biz-kpi-card"><div class="biz-kpi-label">Physical Gold</div><div class="biz-kpi-val" style="color:var(--gold)">${fmtRM(goldRM,0)}</div></div>
          <div class="biz-kpi-card"><div class="biz-kpi-label">GOLDETF</div><div class="biz-kpi-val" style="color:var(--gold)">${fmtRM(goldetfRM,0)}</div></div>
          <div class="biz-kpi-card"><div class="biz-kpi-label">FSM (MYR)</div><div class="biz-kpi-val">${fmtRM(fsmRM,0)}</div></div>
          <div class="biz-kpi-card"><div class="biz-kpi-label">Cash</div><div class="biz-kpi-val accent">${fmtRM(cashRM,0)}</div></div>
          <div class="biz-kpi-card"><div class="biz-kpi-label">EPF</div><div class="biz-kpi-val green">${fmtRM(epf,0)}</div></div>
          <div class="biz-kpi-card"><div class="biz-kpi-label">Property Equity</div><div class="biz-kpi-val">${fmtRM(propEqRM,0)}</div></div>
        </div>`;
    }
  }

  // Concentration
  const concCard = $b('cap-concentration-card');
  if (totalAll > 0 && concCard) {
    concCard.style.display = '';
    const goldPct  = (totalGold / totalAll * 100);
    const cashPct  = ((cashRM + tradeCapital) / totalAll * 100);
    const divPct   = ((epf + propEqRM + other) / totalAll * 100);
    const goldWarn = goldPct > 70;
    const items = [
      { label:'Gold (all forms)', pct: goldPct, target:50, color: goldPct>70?'var(--red)':goldPct>60?'var(--yellow)':'var(--green)', warn: goldPct>70 },
      { label:'Cash + Trading',   pct: cashPct, target:25, color: cashPct<10?'var(--red)':cashPct<20?'var(--yellow)':'var(--green)', warn: cashPct<10 },
      { label:'EPF + Property + Other', pct: divPct, target:25, color: divPct<10?'var(--yellow)':'var(--green)', warn: false },
    ];
    $b('cap-concentration-body').innerHTML = `
      ${goldWarn ? '<div class="advice-box red" style="margin-bottom:.75rem;font-size:13px">🔴 Gold concentration above 70% — single-asset risk. Target: sell 25–30% of physical gold to rebalance toward 50% and increase cash buffer.</div>' : ''}
      <div class="biz-conc-bars">
        ${items.map(i => `
          <div class="biz-conc-row">
            <div class="biz-conc-label">${i.label}</div>
            <div class="biz-conc-bar-wrap">
              <div class="biz-conc-bar" style="width:${Math.min(i.pct,100)}%;background:${i.color}"></div>
            </div>
            <div class="biz-conc-pct" style="color:${i.color}">${i.pct.toFixed(1)}%</div>
            <div class="biz-conc-target" style="color:var(--dim)">Target: ${i.target}%</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:.75rem;font-size:12px;color:var(--dim)">
        💡 To rebalance: Sell ~${Math.round(goldG * (goldPct-50)/goldPct)}g of physical gold → reinvest into diversified equities + cash. Lock in gold's 40% YoY gain partially.
      </div>`;
  }

  // Net Worth Summary
  const nwCard = $b('cap-networth-card');
  if (totalAll > 0 && nwCard) {
    nwCard.style.display = '';
    $b('cap-networth-body').innerHTML = `
      <div class="biz-networth-grid">
        <div class="biz-nw-row"><span>Trading Capital</span><strong style="color:var(--accent)">${fmtRM(tradeCapital,0)}</strong></div>
        <div class="biz-nw-row"><span>Retirement Assets</span><strong style="color:var(--gold)">${fmtRM(totalRetire,0)}</strong></div>
        <div class="biz-nw-row" style="border-top:1px solid var(--border2);padding-top:.5rem;margin-top:.25rem"><span>TOTAL NET WORTH</span><strong style="font-size:1.3em;color:var(--green)">${fmtRM(totalAll,0)}</strong></div>
      </div>
      ${totalAll < 900000 ? '<div class="advice-box yellow" style="margin-top:.75rem;font-size:13px">⚠️ Net worth below RM 900K. Safe retirement target is RM 1.2M+ with RM 150K dedicated trading capital. Continue building before exit.</div>' :
        totalAll < 1200000 ? '<div class="advice-box yellow" style="margin-top:.75rem;font-size:13px">🟡 Getting closer. Target RM 1.2M before resignation. Currently at '+((totalAll/1200000)*100).toFixed(0)+'% of safe threshold.</div>' :
        '<div class="advice-box green" style="margin-top:.75rem;font-size:13px">✅ Net worth above RM 1.2M safe threshold. Capital base is sufficient for Stage 2 gate if other conditions are met.</div>'}`;
    dbSet('cap_total', totalAll);
    dbSet('cap_retire', totalRetire);
    dbSet('cap_trade', tradeCapital);
  }
}

// ══════════════════════════════════════════════════════════════════
//  MODULE 3: P&L DASHBOARD
// ══════════════════════════════════════════════════════════════════
let _pnlChart = null;

function pnlRender() {
  const trades = jLoadTrades();
  if (!trades.length) return;

  // Build month map
  const monthMap = {};
  trades.forEach(t => {
    const m = t.month || yyyymm(new Date(t.edate));
    if (!monthMap[m]) monthMap[m] = [];
    monthMap[m].push(t);
  });

  const months = Object.keys(monthMap).sort();
  const last12 = months.slice(-12);
  const last6  = months.slice(-6);

  // Hero stats
  const pnl6 = last6.reduce((s,m) => s + monthMap[m].reduce((ss,t)=>ss+t.pnlAmt,0), 0);
  const avgMo = last6.length ? pnl6 / last6.length : 0;
  const posMo = last6.filter(m => monthMap[m].reduce((s,t)=>s+t.pnlAmt,0) >= 0).length;

  const set = (id, val, color) => { const e=$b(id); if(e){e.textContent=val; if(color)e.style.color=color;} };
  set('pnl-6mo', fmtRM(pnl6,0), clr(pnl6));
  set('pnl-monthly-avg', fmtRM(avgMo,0), clr(avgMo));
  set('pnl-pos-months', posMo + '/' + last6.length, posMo >= 5 ? 'var(--green)' : posMo >= 4 ? 'var(--yellow)' : 'var(--red)');

  // Chart
  const canvas = $b('pnl-chart');
  if (canvas) {
    if (_pnlChart) { _pnlChart.destroy(); _pnlChart = null; }
    const labels = last12.map(m => monthLabel(m));
    const netData = last12.map(m => +monthMap[m].reduce((s,t)=>s+t.pnlAmt,0).toFixed(2));
    let cumulative = 0;
    const cumData = last12.map(m => {
      cumulative += monthMap[m].reduce((s,t)=>s+t.pnlAmt,0);
      return +cumulative.toFixed(2);
    });
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    _pnlChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Monthly Net P&L (RM)', data: netData, backgroundColor: netData.map(v => v>=0?'rgba(0,232,122,.7)':'rgba(240,58,74,.7)'), borderRadius: 4, order: 2 },
          { label: 'Cumulative P&L (RM)',  data: cumData, type:'line', borderColor:'#00c8f0', borderWidth:2, pointRadius:3, pointBackgroundColor:'#00c8f0', fill:false, tension:.3, order:1 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: isDark?'#d0e2f0':'#0d1e2d', font:{size:11} } } },
        scales: {
          x: { ticks: { color: isDark?'#4e6d88':'#5a7a94', font:{size:10} }, grid: { color: isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.06)' } },
          y: { ticks: { color: isDark?'#4e6d88':'#5a7a94', font:{size:10}, callback: v => 'RM ' + v.toLocaleString() }, grid: { color: isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.06)' } }
        }
      }
    });
  }

  // Monthly table
  const tbody = $b('pnl-monthly-tbody');
  if (tbody) {
    let cumPnl = 0;
    tbody.innerHTML = [...months].reverse().slice(0,18).reverse().map(m => {
      const ts = monthMap[m];
      const wins = ts.filter(t => t.pnlAmt >= 0);
      const losses = ts.filter(t => t.pnlAmt < 0);
      const netPnl = ts.reduce((s,t)=>s+t.pnlAmt,0);
      const grossW = wins.reduce((s,t)=>s+t.pnlAmt,0);
      const grossL = losses.reduce((s,t)=>s+t.pnlAmt,0);
      const winRate = ts.length ? (wins.length/ts.length*100).toFixed(0)+'%' : '—';
      cumPnl += netPnl;
      const stage1Pass = wins.length/Math.max(ts.length,1) >= 0.55 && netPnl > 0;
      return `<tr>
        <td><strong>${monthLabel(m)}</strong></td>
        <td>${ts.length}</td><td style="color:var(--green)">${wins.length}</td><td style="color:var(--red)">${losses.length}</td>
        <td style="color:${parseFloat(winRate)>=55?'var(--green)':parseFloat(winRate)>=45?'var(--yellow)':'var(--red)'}">${winRate}</td>
        <td style="color:var(--green)">${fmtRM(grossW,0)}</td>
        <td style="color:var(--red)">${fmtRM(grossL,0)}</td>
        <td style="color:${clr(netPnl)};font-weight:700">${fmtRM(netPnl,0)}</td>
        <td style="color:${clr(cumPnl)}">${fmtRM(cumPnl,0)}</td>
        <td>${stage1Pass ? '<span style="color:var(--green)">✅ PASS</span>' : '<span style="color:var(--red)">✗ FAIL</span>'}</td>
      </tr>`;
    }).join('');
  }

  // Strategy table
  const stratMap = {};
  trades.forEach(t => {
    if (!stratMap[t.strategy]) stratMap[t.strategy] = [];
    stratMap[t.strategy].push(t);
  });
  const stbody = $b('pnl-strat-tbody');
  if (stbody) {
    stbody.innerHTML = Object.entries(stratMap).map(([strat, ts]) => {
      const st = jCalcStats(ts);
      const rating = !st ? '—' : st.wr >= 0.6 && st.pf >= 1.5 ? '<span style="color:var(--green)">⭐ KEEP</span>' :
                     st.wr >= 0.5 ? '<span style="color:var(--yellow)">🔄 REVIEW</span>' :
                     '<span style="color:var(--red)">⛔ AVOID</span>';
      return `<tr>
        <td><strong>${strat}</strong></td>
        <td>${ts.length}</td>
        <td style="color:${st&&st.wr>=0.55?'var(--green)':'var(--red)'}">${st ? (st.wr*100).toFixed(0)+'%' : '—'}</td>
        <td style="color:var(--green)">${st ? fmtRM(st.avgW,2) : '—'}</td>
        <td style="color:var(--red)">${st ? fmtRM(st.avgL,2) : '—'}</td>
        <td style="color:${st?clr(st.totalPnl):'inherit'}">${st ? fmtRM(st.totalPnl,0) : '—'}</td>
        <td style="color:${st&&st.exp>0?'var(--green)':'var(--red)'}">${st ? st.exp.toFixed(2) : '—'}</td>
        <td>${rating}</td>
      </tr>`;
    }).join('');
  }

  // Stage 1 Evidence
  pnlStage1Evidence(last6, monthMap);
}

function pnlStage1Evidence(last6, monthMap) {
  const body = $b('pnl-stage1-body'); if (!body) return;
  if (last6.length < 3) {
    body.innerHTML = '<div style="color:var(--dim);font-size:13px">Log at least 3 months of trades. Currently: ' + last6.length + ' months of data.</div>';
    return;
  }

  const monthStats = last6.map(m => {
    const ts = monthMap[m];
    const wins = ts.filter(t=>t.pnlAmt>=0);
    const net = ts.reduce((s,t)=>s+t.pnlAmt,0);
    return { month:m, net, wr: ts.length?wins.length/ts.length:0, trades:ts.length };
  });

  const positiveMonths = monthStats.filter(s => s.net > 0).length;
  const avgMonthly     = monthStats.reduce((s,m)=>s+m.net,0) / monthStats.length;
  const avgWR          = monthStats.reduce((s,m)=>s+m.wr,0) / monthStats.length;
  const consistent     = positiveMonths >= Math.ceil(last6.length * 0.8);
  const minThreshold   = 1500; // RM 1500 avg monthly as Stage 1 minimum

  const checks = [
    { label: 'Positive months ≥ 5/6',    pass: positiveMonths >= 5, val: positiveMonths + '/' + last6.length + ' positive' },
    { label: 'Avg monthly P&L ≥ RM 1,500', pass: avgMonthly >= minThreshold, val: fmtRM(avgMonthly,0) + '/month' },
    { label: 'Sustained win rate ≥ 55%',  pass: avgWR >= 0.55, val: (avgWR*100).toFixed(1)+'% avg win rate' },
    { label: 'No catastrophic month (<-RM5K)', pass: !monthStats.some(s=>s.net<-5000), val: monthStats.some(s=>s.net<-5000)?'🔴 Bad month found':'✅ No blowout months' },
  ];
  const passed = checks.filter(c=>c.pass).length;
  const gateOpen = passed === checks.length;

  body.innerHTML = `
    <div class="biz-gate-grid" style="margin-bottom:.75rem">
      ${checks.map(c=>`
        <div class="biz-gate-item ${c.pass?'pass':'fail'}">
          <div class="biz-gate-icon">${c.pass?'✅':'❌'}</div>
          <div><div class="biz-gate-label">${c.label}</div><div class="biz-gate-val">${c.val}</div></div>
        </div>`).join('')}
    </div>
    <div class="decision-strip ${gateOpen?'proceed':passed>=3?'watch':'skip'}">
      <div class="d-badge ${gateOpen?'proceed':passed>=3?'watch':'skip'}">${gateOpen?'STAGE 1 PASSED':passed>=3?'NEARLY THERE':'NOT READY'}</div>
      <div>${gateOpen ? '🎉 6-month trading evidence is solid. Proceed to Stage 2 resignation gate conditions.' :
            passed>=3 ? `${4-passed} condition${4-passed>1?'s':''} remaining. Keep logging trades.` :
            'Insufficient evidence. Continue building track record. ' + (6-last6.length) + ' more months needed.'}</div>
    </div>`;
  dbSet('pnl_stage1_passed', gateOpen);
  dbSet('pnl_avg_monthly', avgMonthly);
  dbSet('pnl_months_data', last6.length);
}

// ══════════════════════════════════════════════════════════════════
//  MODULE 4: RETIREMENT RUNWAY
// ══════════════════════════════════════════════════════════════════

function rwyCalc() {
  const age       = parseInt($b('rwy-age')?.value) || 46;
  const retAge    = parseInt($b('rwy-ret-age')?.value) || 55;
  const lifeExp   = parseInt($b('rwy-life')?.value) || 80;
  const gold      = parseFloat($b('rwy-gold')?.value) || 0;
  const goldetf   = parseFloat($b('rwy-goldetf')?.value) || 0;
  const stocks    = parseFloat($b('rwy-stocks')?.value) || 0;
  const cash      = parseFloat($b('rwy-cash')?.value) || 0;
  const epf       = parseFloat($b('rwy-epf')?.value) || 0;
  const prop      = parseFloat($b('rwy-prop')?.value) || 0;
  const expMo     = parseFloat($b('rwy-exp')?.value) || 5000;
  const tradeInc  = parseFloat($b('rwy-trade-inc')?.value) || 0;
  const passive   = parseFloat($b('rwy-passive')?.value) || 0;
  const salary    = parseFloat($b('rwy-salary')?.value) || 0;
  const infl      = (parseFloat($b('rwy-infl')?.value) || 4) / 100;
  const growth    = (parseFloat($b('rwy-growth')?.value) || 5) / 100;
  const epfMo     = parseFloat($b('rwy-epf-mo')?.value) || 0;

  const totalAssets = gold + goldetf + stocks + cash + epf + prop;
  if (totalAssets <= 0) return;

  // Hero update
  const set = (id, val, color) => { const e=$b(id); if(e){e.textContent=val; if(color)e.style.color=color;} };
  set('rwy-total-rm', fmtRM(totalAssets, 0));

  // Safe nest egg: 25× annual expenses (4% rule) adjusted for Malaysia
  const annualExp = expMo * 12;
  const safeNegg = annualExp * 25;
  set('rwy-safe-amount', fmtRM(safeNegg, 0));

  // Year-by-year projection
  const rows = [];
  let assets = totalAssets;
  let depleteAge = null;
  const currentYear = new Date().getFullYear();

  for (let yr = age; yr <= lifeExp + 5; yr++) {
    const yearsAhead = yr - age;
    const annualExpInflated = annualExp * Math.pow(1 + infl, yearsAhead);
    const isEmployed    = salary > 0 && yr < retAge;
    const hasEPFMonthly = epfMo > 0 && yr >= 60;
    const annualIncome  = ((isEmployed ? salary : 0) + tradeInc + passive + (hasEPFMonthly ? epfMo : 0)) * 12;
    const netFlow       = annualIncome - annualExpInflated;
    const assetsGrowth  = assets * growth;
    assets = assets + assetsGrowth + netFlow;

    const status = assets <= 0 ? 'DEPLETED' : assets < annualExpInflated ? 'CRITICAL' :
                   assets < annualExpInflated * 3 ? 'LOW' : 'HEALTHY';
    if (assets <= 0 && !depleteAge) depleteAge = yr;

    rows.push({ age: yr, year: currentYear + yearsAhead, assets: Math.max(0, assets), annualIncome, annualExpInflated, netFlow, status });
    if (assets <= 0) break;
  }

  set('rwy-depletes-age', depleteAge ? 'Age ' + depleteAge : 'Age ' + (lifeExp + 5) + '+', depleteAge && depleteAge < lifeExp ? 'var(--red)' : 'var(--green)');

  // Summary card
  const sumCard = $b('rwy-summary-card'); if(sumCard) sumCard.style.display = '';
  const gapYears = depleteAge ? lifeExp - depleteAge : null;
  const pctOfSafe = (totalAssets / safeNegg * 100).toFixed(0);
  $b('rwy-summary-body').innerHTML = `
    <div class="biz-stats-row" style="margin-bottom:.75rem">
      <div class="biz-kpi-card"><div class="biz-kpi-label">Total Assets</div><div class="biz-kpi-val" style="color:var(--gold)">${fmtRM(totalAssets,0)}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Safe Nest Egg</div><div class="biz-kpi-val">${fmtRM(safeNegg,0)}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">% of Safe Target</div><div class="biz-kpi-val" style="color:${pctOfSafe>=100?'var(--green)':pctOfSafe>=75?'var(--yellow)':'var(--red)'}">${pctOfSafe}%</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Assets Deplete</div><div class="biz-kpi-val" style="color:${!depleteAge||depleteAge>lifeExp?'var(--green)':'var(--red)'}">${depleteAge?'Age '+depleteAge:'Survives to '+lifeExp}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Monthly Shortfall</div><div class="biz-kpi-val" style="color:${(tradeInc+passive)*12-annualExp>=0?'var(--green)':'var(--red)'}">${fmtRM((tradeInc+passive)-(expMo),0)}/mo</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Years Funded</div><div class="biz-kpi-val">${depleteAge?depleteAge-age:lifeExp-age}yr</div></div>
    </div>
    ${depleteAge && depleteAge < lifeExp ?
      `<div class="advice-box red" style="font-size:13px">🔴 Assets deplete at age ${depleteAge} — ${gapYears} years short of life expectancy ${lifeExp}. Action required: increase trading income to RM ${Math.ceil((annualExp-passive*12-epfMo*12)/12).toLocaleString()}/month, grow assets to ${fmtRM(safeNegg,0)}, or reduce expenses.</div>` :
      `<div class="advice-box green" style="font-size:13px">✅ Assets projected to last beyond age ${lifeExp}. Runway is ${depleteAge?depleteAge-age:lifeExp-age}+ years. Keep building EPF and diversifying.</div>`}`;

  // EPF bridge
  const epfCard = $b('rwy-epf-card'); if(epfCard) epfCard.style.display = '';
  $b('rwy-epf-body').innerHTML = `
    <div class="biz-networth-grid">
      <div class="biz-nw-row"><span>EPF Current Balance</span><strong>${fmtRM(epf,0)}</strong></div>
      <div class="biz-nw-row"><span>EPF Account 2 (age 50)</span><strong style="color:var(--accent)">Withdraw 30% → est. ${fmtRM(epf*0.3,0)}</strong></div>
      <div class="biz-nw-row"><span>EPF Account 1 (age 55)</span><strong style="color:var(--accent)">Full access → remaining balance</strong></div>
      <div class="biz-nw-row"><span>EPF Monthly Payout (age 60)</span><strong style="color:var(--green)">${fmtRM(epfMo,0)}/month entered</strong></div>
      <div class="biz-nw-row" style="color:var(--dim);font-size:12px"><span colspan="2">💡 Akaun Fleksibel allows withdrawals anytime. Keep EPF invested until 55 for maximum compounding.</span></div>
    </div>`;

  // Action plan
  const actCard = $b('rwy-action-card'); if(actCard) actCard.style.display = '';
  const needed = Math.max(0, safeNegg - totalAssets);
  const yearsTo55 = Math.max(1, 55 - age);
  const neededPerYear = needed / yearsTo55;
  $b('rwy-action-body').innerHTML = `
    <div class="biz-networth-grid">
      <div class="biz-nw-row"><span>Gap to Safe Nest Egg</span><strong style="color:${needed<=0?'var(--green)':'var(--red)'}">${needed<=0?'✅ Achieved':fmtRM(needed,0)}</strong></div>
      ${needed > 0 ? `
      <div class="biz-nw-row"><span>Needed per year (to age 55)</span><strong>${fmtRM(neededPerYear,0)}/yr</strong></div>
      <div class="biz-nw-row"><span>Needed from trading income</span><strong style="color:var(--accent)">${fmtRM(neededPerYear/12,0)}/month net</strong></div>` : ''}
      <div class="biz-nw-row"><span>🥇 Priority 1</span><span>Sell 25% physical gold (~225g) → lock in gains at all-time highs</span></div>
      <div class="biz-nw-row"><span>🥈 Priority 2</span><span>Build cash buffer to 12 months expenses = ${fmtRM(expMo*12,0)}</span></div>
      <div class="biz-nw-row"><span>🥉 Priority 3</span><span>Diversify into dividend REITs for passive income stream</span></div>
      <div class="biz-nw-row"><span>💡 Priority 4</span><span>Check EPF Account 2 withdrawal eligibility at age 50</span></div>
    </div>`;

  // Projection table
  const projCard = $b('rwy-proj-card'); if(projCard) projCard.style.display = '';
  const ptbody = $b('rwy-proj-tbody');
  if (ptbody) {
    ptbody.innerHTML = rows.map(r => {
      const sc = r.status==='HEALTHY'?'var(--green)':r.status==='LOW'?'var(--yellow)':r.status==='CRITICAL'?'var(--orange)':'var(--red)';
      const bold = r.age === retAge || r.age === 60 || r.age === lifeExp;
      return `<tr style="${bold?'border-top:2px solid var(--border2)':''}">
        <td><strong style="color:${sc}">${r.age}</strong></td>
        <td>${r.year}</td>
        <td style="color:${sc};${bold?'font-weight:700':''}">${r.assets<=0?'DEPLETED':fmtRM(r.assets,0)}</td>
        <td>${fmtRM(r.annualIncome/12,0)}/mo</td>
        <td>${fmtRM(r.annualExpInflated/12,0)}/mo</td>
        <td style="color:${clr(r.netFlow)}">${fmtRM(r.netFlow/12,0)}/mo</td>
        <td><span style="color:${sc};font-size:12px">${r.status}</span></td>
      </tr>`;
    }).join('');
  }

  dbSet('rwy_assets', totalAssets);
  dbSet('rwy_depletes', depleteAge);
}

// ══════════════════════════════════════════════════════════════════
//  MODULE 5: POSITION SIZER
// ══════════════════════════════════════════════════════════════════

function szCalc() {
  const acct    = parseFloat($b('sz-acct')?.value) || 0;
  const riskPct = parseFloat($b('sz-risk-pct')?.value) || 1;
  const maxPct  = parseFloat($b('sz-max-pct')?.value) || 20;
  const entry   = parseFloat($b('sz-entry')?.value);
  const sl      = parseFloat($b('sz-sl')?.value);
  const tp1     = parseFloat($b('sz-tp1')?.value);
  const tp2     = parseFloat($b('sz-tp2')?.value);
  const atr     = parseFloat($b('sz-atr')?.value);
  const atrMult = parseFloat($b('sz-atr-mult')?.value) || 1.5;

  const card = $b('sz-result-card'); if(card) card.style.display = '';
  const body = $b('sz-result-body'); if(!body) return;

  if (!acct || !entry || !sl) {
    body.innerHTML = '<div style="color:var(--dim);font-size:13px">Enter account size, entry and stop loss to calculate position size.</div>';
    return;
  }

  const maxRiskAmt   = acct * riskPct / 100;
  const maxCapAmt    = acct * maxPct  / 100;
  const riskPerUnit  = Math.abs(entry - sl);
  const units        = Math.floor(maxRiskAmt / riskPerUnit);
  const unitsRounded = Math.floor(units / 100) * 100; // round to nearest 100 lot
  const positionVal  = unitsRounded * entry;
  const positionPct  = acct > 0 ? (positionVal / acct * 100) : 0;
  const cappedUnits  = Math.min(unitsRounded, Math.floor(maxCapAmt / entry / 100) * 100);
  const finalUnits   = cappedUnits;
  const finalVal     = finalUnits * entry;
  const finalPct     = acct > 0 ? (finalVal / acct * 100) : 0;
  const slAmt        = finalUnits * riskPerUnit;

  const rr1 = tp1 ? (Math.abs(tp1-entry)/riskPerUnit).toFixed(2) : null;
  const rr2 = tp2 ? (Math.abs(tp2-entry)/riskPerUnit).toFixed(2) : null;
  const atrSL = atr ? (entry - atrMult * atr).toFixed(4) : null;

  const sizeOk = finalPct <= maxPct;
  const rrOk   = rr1 ? parseFloat(rr1) >= 2 : null;

  body.innerHTML = `
    <div class="biz-stats-row" style="margin-bottom:.75rem">
      <div class="biz-kpi-card"><div class="biz-kpi-label">Max Risk (RM)</div><div class="biz-kpi-val red">${fmtRM(maxRiskAmt,0)}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Units to Buy</div><div class="biz-kpi-val accent">${finalUnits.toLocaleString()}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Position Value</div><div class="biz-kpi-val">${fmtRM(finalVal,0)}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">% of Capital</div><div class="biz-kpi-val" style="color:${sizeOk?'var(--green)':'var(--red)'}">${finalPct.toFixed(1)}%</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Risk if SL Hit</div><div class="biz-kpi-val red">-${fmtRM(slAmt,0)}</div></div>
      ${rr1?`<div class="biz-kpi-card"><div class="biz-kpi-label">R:R to T1</div><div class="biz-kpi-val" style="color:${rrOk?'var(--green)':'var(--red)'}">${rr1}R</div></div>`:''}
      ${rr2?`<div class="biz-kpi-card"><div class="biz-kpi-label">R:R to T2</div><div class="biz-kpi-val green">${rr2}R</div></div>`:''}
    </div>
    <div class="biz-networth-grid" style="margin-bottom:.75rem">
      <div class="biz-nw-row"><span>Entry</span><strong>RM ${entry.toFixed(4)}</strong></div>
      <div class="biz-nw-row"><span>Stop Loss</span><strong style="color:var(--red)">RM ${sl.toFixed(4)} (−${(riskPerUnit/entry*100).toFixed(2)}%)</strong></div>
      ${atrSL?`<div class="biz-nw-row"><span>ATR-Based SL (${atrMult}×ATR)</span><strong style="color:var(--yellow)">RM ${atrSL}</strong></div>`:''}
      ${tp1?`<div class="biz-nw-row"><span>Target 1</span><strong style="color:var(--green)">RM ${tp1.toFixed(4)} (+${((tp1-entry)/entry*100).toFixed(2)}%)</strong></div>`:''}
      ${tp2?`<div class="biz-nw-row"><span>Target 2</span><strong style="color:var(--green)">RM ${tp2.toFixed(4)} (+${((tp2-entry)/entry*100).toFixed(2)}%)</strong></div>`:''}
    </div>
    <div class="advice-box ${sizeOk&&(!rrOk||rrOk)?'green':'red'}" style="font-size:13px">
      ${finalPct > maxPct ? `⚠️ Position exceeds ${maxPct}% capital limit. Capped from ${units.toLocaleString()} to ${finalUnits.toLocaleString()} units.` : ''}
      ${rrOk === false ? '⚠️ R:R below 2:1 — consider moving target or tightening stop.' : ''}
      ${sizeOk && (rrOk===null||rrOk) ? `✅ Position sized correctly. Risk: ${fmtRM(slAmt,0)} (${riskPct}% of account). ${rr1?'R:R '+rr1+':1 — acceptable.':''}` : ''}
    </div>`;

  // ATR Reference
  if (entry && atr) {
    const ref = $b('sz-atr-ref'); const emp = $b('sz-atr-ref-empty');
    if (ref) { ref.style.display=''; if(emp) emp.style.display='none'; }
    ref.innerHTML = `
      <div class="biz-networth-grid">
        ${[0.5,1,1.5,2,2.5,3].map(m => {
          const stopPrice = (entry - m * atr).toFixed(4);
          const stopPct   = ((m * atr / entry) * 100).toFixed(2);
          return `<div class="biz-nw-row">
            <span>${m}× ATR stop</span>
            <strong style="color:${m<=1?'var(--red)':m<=2?'var(--yellow)':'var(--green)'}">RM ${stopPrice} (−${stopPct}%)</strong>
          </div>`;
        }).join('')}
      </div>`;
  }
}

function szReset() {
  ['sz-acct','sz-risk-pct','sz-max-pct','sz-entry','sz-sl','sz-tp1','sz-tp2','sz-atr'].forEach(id => {
    const e = $b(id); if(e) e.value = id==='sz-risk-pct'?'1':id==='sz-max-pct'?'20':id==='sz-atr-mult'?'1.5':'';
  });
  const card = $b('sz-result-card'); if(card) card.style.display='none';
}

// ══════════════════════════════════════════════════════════════════
//  MODULE 6: STAGE GATES
// ══════════════════════════════════════════════════════════════════

function gatesRender() {
  const trades   = jLoadTrades();
  const st       = jCalcStats(trades);
  const capTotal = dbGet('cap_total', 0);
  const capTrade = dbGet('cap_trade', 0);
  const pnlPass  = dbGet('pnl_stage1_passed', false);
  const pnlMonths= dbGet('pnl_months_data', 0);
  const pnlAvgMo = dbGet('pnl_avg_monthly', 0);
  const rwyAssets= dbGet('rwy_assets', 0);
  const manualS1 = dbGet('gate_s1_manual', {});
  const manualS2 = dbGet('gate_s2_manual', {});
  const manualS3 = dbGet('gate_s3_manual', {});

  // STAGE 1 items
  const s1items = [
    { id:'j_trades',    label:'Minimum 20 trades logged',               auto:true, pass: trades.length >= 20,         val: trades.length + ' trades' },
    { id:'j_winrate',   label:'Win rate ≥ 55% sustained',               auto:true, pass: st&&st.wr>=0.55,             val: st?(st.wr*100).toFixed(1)+'%':'No data' },
    { id:'j_months',    label:'6 months of trade data',                  auto:true, pass: pnlMonths >= 6,              val: pnlMonths + '/6 months' },
    { id:'pnl_positive',label:'Average monthly P&L ≥ RM 1,500',         auto:true, pass: pnlAvgMo >= 1500,            val: fmtRM(pnlAvgMo,0) + '/month' },
    { id:'cap_trade',   label:'Trading capital ≥ RM 150,000 dedicated',  auto:true, pass: capTrade >= 150000,          val: fmtRM(capTrade,0) },
    { id:'pos_sizer',   label:'Position sizing used on every trade',      auto:false, pass: manualS1.pos_sizer===true,  val: manualS1.pos_sizer?'✅ Yes':'Manual confirm' },
    { id:'sl_discipline',label:'Stop loss hit rate < 30%',               auto:false, pass: manualS1.sl_discipline===true, val: manualS1.sl_discipline?'✅ Yes':'Manual confirm' },
  ];

  // STAGE 2 items
  const s2items = [
    { id:'s1_complete', label:'Stage 1 fully passed',                    auto:true, pass: pnlPass,                    val: pnlPass?'✅ Passed':'❌ Incomplete' },
    { id:'emergency',   label:'12-month emergency fund in cash',          auto:false, pass: manualS2.emergency===true,  val: manualS2.emergency?'✅ Set aside':'Manual confirm' },
    { id:'epf_checked', label:'EPF balance confirmed & bridge planned',   auto:false, pass: manualS2.epf_checked===true, val: manualS2.epf_checked?'✅ Done':'Manual confirm' },
    { id:'expenses',    label:'Monthly expenses fully mapped',            auto:false, pass: manualS2.expenses===true,   val: manualS2.expenses?'✅ Done':'Manual confirm' },
    { id:'gold_rebal',  label:'Gold rebalanced to ≤ 60% of portfolio',   auto:true, pass: capTotal>0&&((dbGet('cap_retire',0)-capTrade)/Math.max(capTotal,1))<0.7, val: 'Check Capital tab' },
    { id:'net_1m',      label:'Net worth ≥ RM 1,200,000',                auto:true, pass: capTotal >= 1200000,         val: fmtRM(capTotal,0) },
    { id:'no_debt',     label:'No high-interest debt (credit cards etc)', auto:false, pass: manualS2.no_debt===true,    val: manualS2.no_debt?'✅ Clear':'Manual confirm' },
  ];

  // STAGE 3 items
  const s3items = [
    { id:'s2_complete', label:'Stage 2 gate passed',                     auto:true,  pass: s2items.every(i=>i.pass),  val: s2items.every(i=>i.pass)?'✅ Passed':'❌ Incomplete' },
    { id:'3_streams',   label:'3+ active income streams',                auto:false, pass: manualS3['3_streams']===true, val: manualS3['3_streams']?'✅ Active':'Manual confirm' },
    { id:'40pct_rule',  label:'Each stream covers 40%+ of expenses',     auto:false, pass: manualS3['40pct_rule']===true, val: manualS3['40pct_rule']?'✅ Met':'Manual confirm' },
    { id:'tm_product',  label:'TradeMatrix product or signals launched',  auto:false, pass: manualS3.tm_product===true,  val: manualS3.tm_product?'✅ Live':'Manual confirm' },
    { id:'dividend',    label:'Dividend/REIT passive income ≥ RM 500/mo', auto:false, pass: manualS3.dividend===true,   val: manualS3.dividend?'✅ Yes':'Manual confirm' },
    { id:'rwy_healthy', label:'Runway projection shows HEALTHY to life expectancy', auto:true, pass: !dbGet('rwy_depletes',null)||dbGet('rwy_depletes',100)>75, val: 'Check Runway tab' },
  ];

  const s1pass = s1items.filter(i=>i.pass).length;
  const s2pass = s2items.filter(i=>i.pass).length;
  const s3pass = s3items.filter(i=>i.pass).length;
  const s1pct  = Math.round(s1pass / s1items.length * 100);
  const s2pct  = Math.round(s2pass / s2items.length * 100);
  const s3pct  = Math.round(s3pass / s3items.length * 100);

  const setEl = (id, val, color) => { const e=$b(id); if(e){e.textContent=val; if(color)e.style.color=color;} };
  setEl('gate-s1-pct', s1pct+'%', s1pct===100?'var(--green)':s1pct>=60?'var(--yellow)':'var(--red)');
  setEl('gate-s2-pct', s2pct+'%', s2pct===100?'var(--green)':s2pct>=60?'var(--yellow)':'var(--red)');
  setEl('gate-s3-pct', s3pct+'%', s3pct===100?'var(--green)':s3pct>=60?'var(--yellow)':'var(--red)');

  function renderGate(gridId, manualId, items, manualStore) {
    const grid = $b(gridId); if (!grid) return;
    grid.innerHTML = items.map(item => `
      <div class="biz-gate-item ${item.pass?'pass':'fail'}">
        <div class="biz-gate-icon">${item.pass?'✅':'❌'}</div>
        <div style="flex:1">
          <div class="biz-gate-label">${item.label}</div>
          <div class="biz-gate-val">${item.val}</div>
        </div>
        ${!item.auto && !item.pass ? `<button class="btn btn-secondary" style="font-size:10px;padding:.2rem .5rem;flex-shrink:0" onclick="gateManualCheck('${manualStore}','${item.id}',true)">✓ Mark Done</button>` : ''}
        ${!item.auto && item.pass  ? `<button class="btn btn-secondary" style="font-size:10px;padding:.2rem .5rem;flex-shrink:0;color:var(--dim)" onclick="gateManualCheck('${manualStore}','${item.id}',false)">Undo</button>` : ''}
      </div>`).join('');
  }

  renderGate('gate-s1-grid', 'gate-s1-manual', s1items, 'gate_s1_manual');
  renderGate('gate-s2-grid', 'gate-s2-manual', s2items, 'gate_s2_manual');
  renderGate('gate-s3-grid', 'gate-s3-manual', s3items, 'gate_s3_manual');

  // Badges
  const badgeText = (pct, allItems) => pct===100?'GATE OPEN':pct>=80?'NEARLY READY':pct>=50?'IN PROGRESS':'NOT STARTED';
  const badgeEl = $b('gate-s1-badge'); if(badgeEl) { badgeEl.textContent=badgeText(s1pct,s1items); badgeEl.style.background=s1pct===100?'rgba(0,232,122,.15)':s1pct>=60?'rgba(245,200,66,.15)':'rgba(240,58,74,.15)'; badgeEl.style.color=s1pct===100?'var(--green)':s1pct>=60?'var(--yellow)':'var(--red)'; }
  const badge2  = $b('gate-s2-badge'); if(badge2) { badge2.textContent=s1pct<100?'LOCKED — Stage 1 First':badgeText(s2pct,s2items); badge2.style.background=s2pct===100?'rgba(0,232,122,.15)':s2pct>=60?'rgba(245,200,66,.15)':'rgba(240,58,74,.15)'; badge2.style.color=s2pct===100?'var(--green)':s2pct>=60?'var(--yellow)':'var(--red)'; }
  const badge3  = $b('gate-s3-badge'); if(badge3) { badge3.textContent=s2pct<100?'LOCKED — Stage 2 First':badgeText(s3pct,s3items); badge3.style.color=s3pct===100?'var(--green)':s3pct>=60?'var(--yellow)':'var(--red)'; }

  // ETA card
  const etaBody = $b('gate-eta-body'); if (!etaBody) return;
  const totalItems = s1items.length + s2items.length;
  const doneItems  = s1pass + s2pass;
  const remaining  = totalItems - doneItems;
  const estMonths  = remaining <= 0 ? 0 : remaining <= 3 ? 3 : remaining <= 6 ? 6 : remaining <= 10 ? 12 : 18;
  const etaDate    = new Date(); etaDate.setMonth(etaDate.getMonth() + estMonths);
  etaBody.innerHTML = `
    <div class="biz-stats-row">
      <div class="biz-kpi-card"><div class="biz-kpi-label">Items Complete</div><div class="biz-kpi-val green">${doneItems}/${totalItems}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Items Remaining</div><div class="biz-kpi-val red">${remaining}</div></div>
      <div class="biz-kpi-card"><div class="biz-kpi-label">Est. Ready Date</div><div class="biz-kpi-val accent">${remaining<=0?'NOW READY':etaDate.toLocaleDateString('en-MY',{month:'short',year:'numeric'})}</div></div>
    </div>
    ${remaining<=0?'<div class="advice-box green" style="font-size:13px">🎉 All Stage 1 & 2 gates passed. You are objectively ready to resign. Time to act.</div>':
      `<div class="advice-box ${remaining<=4?'yellow':'red'}" style="font-size:13px">${remaining} conditions still unmet across Stage 1 and Stage 2. Focus on the ❌ items above. Estimated resignation readiness: <strong>${etaDate.toLocaleDateString('en-MY',{month:'long',year:'numeric'})}</strong>.</div>`}`;
}

function gateManualCheck(storeKey, itemId, value) {
  const store = dbGet(storeKey, {});
  store[itemId] = value;
  dbSet(storeKey, store);
  gatesRender();
}

// ══════════════════════════════════════════════════════════════════
//  MODULE 7: INCOME STREAMS
// ══════════════════════════════════════════════════════════════════
let _incChart = null;

function incLoadStreams() { return dbGet('inc_streams', []); }
function incSaveStreams(s){ dbSet('inc_streams', s); }
function incLoadLog()     { return dbGet('inc_log', {}); }
function incSaveLog(l)    { dbSet('inc_log', l); }

function incAddStream() {
  const name = prompt('Stream name (e.g. Active Trading, REIT Dividends, Consulting):');
  if (!name?.trim()) return;
  const type = prompt('Type: variable / passive / part-time / employment', 'variable');
  const streams = incLoadStreams();
  streams.push({ id: Date.now(), name: name.trim(), type: type?.trim() || 'variable', active: true });
  incSaveStreams(streams);
  incRender();
}

function incRender() {
  const streams = incLoadStreams();
  const log     = incLoadLog();
  const expMo   = parseFloat($b('inc-exp')?.value) || 5000;
  const mult    = parseFloat($b('inc-mult')?.value) || 1.3;
  const target  = expMo * mult;
  const tEl = $b('inc-target'); if(tEl) tEl.value = target.toFixed(0);

  // Populate month selector
  const sel = $b('inc-log-month');
  if (sel) {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(yyyymm(d));
    }
    sel.innerHTML = months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join('');
    sel.value = yyyymm();
  }

  // Render stream list
  const list = $b('inc-streams-list');
  if (list) {
    if (!streams.length) { list.innerHTML = '<div style="color:var(--dim);font-size:13px">No streams added yet. Click + Add Stream.</div>'; }
    else { list.innerHTML = streams.map(s => `
      <div class="biz-stream-row">
        <div class="biz-stream-info">
          <strong>${s.name}</strong>
          <span style="color:var(--dim);font-size:11px">${s.type}</span>
        </div>
        <button class="btn btn-secondary" style="font-size:10px;padding:.2rem .5rem" onclick="incDeleteStream(${s.id})">Remove</button>
      </div>`).join(''); }
  }

  incRenderLog();
  incCalc();
}

function incDeleteStream(id) {
  if (!confirm('Remove this income stream?')) return;
  incSaveStreams(incLoadStreams().filter(s => s.id !== id));
  incRender();
}

function incCalc() {
  const streams = incLoadStreams();
  const log     = incLoadLog();
  const curMo   = yyyymm();
  const expMo   = parseFloat($b('inc-exp')?.value) || 5000;

  // This month total
  const curLog = log[curMo] || {};
  const thisMo = streams.reduce((s,st) => s + (parseFloat(curLog[st.id]) || 0), 0);

  // 12-month average
  let totalAllMonths = 0, monthCount = 0;
  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = yyyymm(d);
    const mo = log[m] || {};
    const moTotal = streams.reduce((s,st) => s + (parseFloat(mo[st.id]) || 0), 0);
    if (moTotal > 0) { totalAllMonths += moTotal; monthCount++; }
  }
  const avg12 = monthCount > 0 ? totalAllMonths / monthCount : 0;

  const set = (id, val, color) => { const e=$b(id); if(e){e.textContent=val; if(color)e.style.color=color;} };
  set('inc-total-mo', fmtRM(thisMo,0), clr(thisMo-expMo));
  set('inc-avg-mo',   fmtRM(avg12,0));
  set('inc-streams-active', streams.filter(s=>s.active).length);

  // Chart
  const canvas = $b('inc-chart');
  if (canvas && streams.length) {
    if (_incChart) { _incChart.destroy(); _incChart = null; }
    const labels = streams.map(s => s.name.length > 15 ? s.name.slice(0,15)+'…' : s.name);
    const data   = streams.map(st => {
      let total = 0, months = 0;
      for (let i = 0; i < 12; i++) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const m = yyyymm(d);
        const v = parseFloat((log[m]||{})[st.id]) || 0;
        if (v > 0) { total += v; months++; }
      }
      return months > 0 ? +(total/months).toFixed(0) : 0;
    });
    const colors = ['#00c8f0','#00e87a','#f5c842','#ff7043','#a78bfa','#fb7185'];
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    _incChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: isDark?'#0f1620':'#ffffff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position:'right', labels: { color: isDark?'#d0e2f0':'#0d1e2d', font:{size:11} } },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + fmtRM(ctx.parsed,0) + '/month avg' } }
        }
      }
    });

    // Dependency warning
    const maxStream = Math.max(...data);
    const totalInc  = data.reduce((s,v)=>s+v,0);
    const maxPct    = totalInc > 0 ? maxStream / totalInc * 100 : 0;
    const warn = $b('inc-dependency-warn');
    if (warn && maxPct > 70 && totalInc > 0) {
      warn.style.display = '';
      warn.innerHTML = `<div class="advice-box red" style="font-size:13px">⚠️ One income stream represents ${maxPct.toFixed(0)}% of total income — dangerously concentrated. Target: no single stream above 50%. Add more passive/part-time streams.</div>`;
    } else if (warn) { warn.style.display = 'none'; }
  }
}

function incRenderLog() {
  const streams = incLoadStreams();
  const log     = incLoadLog();
  const body    = $b('inc-log-body'); if (!body) return;
  const selMo   = $b('inc-log-month')?.value || yyyymm();
  const expMo   = parseFloat($b('inc-exp')?.value) || 5000;

  if (!streams.length) { body.innerHTML = '<div style="color:var(--dim);font-size:13px">Add income streams first.</div>'; return; }

  const moLog = log[selMo] || {};
  const total = streams.reduce((s,st) => s + (parseFloat(moLog[st.id]) || 0), 0);

  body.innerHTML = `
    <div class="biz-inc-grid">
      ${streams.map(st => `
        <div class="biz-inc-row">
          <div class="biz-inc-label"><strong>${st.name}</strong><br><span style="font-size:11px;color:var(--dim)">${st.type}</span></div>
          <div class="biz-inc-input">
            <input type="number" placeholder="0" value="${moLog[st.id]||''}"
              style="width:130px"
              oninput="incLogAmount('${selMo}',${st.id},this.value)"/>
            <span style="font-size:11px;color:var(--dim);margin-left:.25rem">RM</span>
          </div>
        </div>`).join('')}
    </div>
    <div style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>Total for ${monthLabel(selMo)}</strong>
        <strong style="color:${clr(total-expMo)};font-size:1.1em">${fmtRM(total,0)}</strong>
      </div>
      ${total > 0 ? `<div style="font-size:12px;color:var(--dim);margin-top:.25rem">
        vs expenses: ${total >= expMo ? '<span style="color:var(--green)">✅ Surplus ' + fmtRM(total-expMo,0) : '<span style="color:var(--red)">❌ Deficit ' + fmtRM(total-expMo,0)}
      </span></div>` : ''}
    </div>`;
}

function incLogAmount(month, streamId, value) {
  const log = incLoadLog();
  if (!log[month]) log[month] = {};
  log[month][streamId] = parseFloat(value) || 0;
  incSaveLog(log);
  incCalc();
}

// ══════════════════════════════════════════════════════════════════
//  BOOT: Add tab colours + CSS for new modules
// ══════════════════════════════════════════════════════════════════

(function injectBizStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── New Tab Colours ──────────────────────────────── */
    .journal-tab.active  { color: #00e87a !important; border-bottom-color: #00e87a !important; }
    .capital-tab.active  { color: #FFD700 !important; border-bottom-color: #FFD700 !important; }
    .pnl-tab.active      { color: #00c8f0 !important; border-bottom-color: #00c8f0 !important; }
    .runway-tab.active   { color: #f5c842 !important; border-bottom-color: #f5c842 !important; }
    .sizer-tab.active    { color: #fb7185 !important; border-bottom-color: #fb7185 !important; }
    .gates-tab.active    { color: #a78bfa !important; border-bottom-color: #a78bfa !important; }
    .income-tab.active   { color: #ff7043 !important; border-bottom-color: #ff7043 !important; }
    [data-theme="light"] .journal-tab.active { color:#00aa55 !important; border-bottom-color:#00aa55 !important; }
    [data-theme="light"] .capital-tab.active { color:#b8860b !important; border-bottom-color:#b8860b !important; }

    /* ── Hero Banner ──────────────────────────────────── */
    .biz-hero { display:flex; align-items:flex-start; gap:1rem; padding:1rem 1.25rem;
      background:var(--card); border:1px solid var(--border); border-radius:12px;
      flex-wrap:wrap; animation:tm-fadeUp .25s ease; }
    .journal-hero { border-color:rgba(0,232,122,.2);  background:rgba(0,232,122,.03); }
    .capital-hero { border-color:rgba(255,215,0,.2);  background:rgba(255,215,0,.03); }
    .pnl-hero     { border-color:rgba(0,200,240,.2);  background:rgba(0,200,240,.03); }
    .runway-hero  { border-color:rgba(245,200,66,.2); background:rgba(245,200,66,.03); }
    .sizer-hero   { border-color:rgba(251,113,133,.2);background:rgba(251,113,133,.03); }
    .gates-hero   { border-color:rgba(167,139,250,.2);background:rgba(167,139,250,.03); }
    .income-hero  { border-color:rgba(255,112,67,.2); background:rgba(255,112,67,.03); }
    .biz-hero-icon { font-size:2.5rem; line-height:1; flex-shrink:0; }
    .biz-hero-title { font-family:var(--head); font-size:1.4rem; font-weight:800; color:var(--text); }
    .biz-hero-sub   { font-size:12px; color:var(--dim); margin-top:.2rem; }
    .biz-hero-stat  { display:flex; gap:.75rem; margin-left:auto; flex-wrap:wrap; align-items:center; }
    .biz-stat-box   { text-align:center; }
    .biz-stat-val   { font-family:var(--head); font-size:1.1rem; font-weight:800; }
    .biz-stat-lbl   { font-size:10px; color:var(--dim); letter-spacing:.08em; text-transform:uppercase; }

    /* ── KPI Cards row ────────────────────────────────── */
    .biz-stats-row  { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:.6rem; }
    .biz-kpi-card   { background:var(--card2); border:1px solid var(--border); border-radius:8px;
      padding:.65rem .75rem; display:flex; flex-direction:column; gap:.15rem; }
    .biz-kpi-label  { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:var(--dim); }
    .biz-kpi-val    { font-family:var(--head); font-size:1.05rem; font-weight:700; color:var(--text); }
    .biz-kpi-sub    { font-size:10px; color:var(--dim); }
    .biz-kpi-val.green  { color:var(--green); }
    .biz-kpi-val.red    { color:var(--red); }
    .biz-kpi-val.accent { color:var(--accent); }

    /* ── Two-column layout ────────────────────────────── */
    .biz-two-col { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    @media(max-width:700px) { .biz-two-col { grid-template-columns:1fr; } }

    /* ── Table ────────────────────────────────────────── */
    .biz-table { width:100%; border-collapse:collapse; font-size:13px; }
    .biz-table th { background:var(--card2); color:var(--dim); padding:.5rem .65rem;
      text-align:left; font-size:10px; letter-spacing:.1em; text-transform:uppercase;
      border-bottom:1px solid var(--border); white-space:nowrap; }
    .biz-table td { padding:.5rem .65rem; border-bottom:1px solid var(--border);
      white-space:nowrap; color:var(--text); }
    .biz-table tr:hover td { background:rgba(0,200,240,.03); }

    /* ── Net worth rows ───────────────────────────────── */
    .biz-networth-grid { display:flex; flex-direction:column; gap:.35rem; }
    .biz-nw-row { display:flex; justify-content:space-between; align-items:center;
      padding:.3rem 0; border-bottom:1px solid var(--border); font-size:13px; flex-wrap:wrap; gap:.25rem; }
    .biz-nw-row:last-child { border-bottom:none; }

    /* ── Gate items ───────────────────────────────────── */
    .biz-gate-grid { display:flex; flex-direction:column; gap:.5rem; margin-bottom:.75rem; }
    .biz-gate-item { display:flex; align-items:flex-start; gap:.65rem; padding:.6rem .75rem;
      border-radius:8px; border:1px solid var(--border); background:var(--card2); }
    .biz-gate-item.pass { border-color:rgba(0,232,122,.25); background:rgba(0,232,122,.04); }
    .biz-gate-item.fail { border-color:rgba(240,58,74,.2);  background:rgba(240,58,74,.03); }
    .biz-gate-icon { font-size:16px; flex-shrink:0; margin-top:.1rem; }
    .biz-gate-label { font-size:13px; font-weight:600; color:var(--text); }
    .biz-gate-val   { font-size:11px; color:var(--dim); margin-top:.15rem; }
    .biz-gate-override-note { font-size:11px; color:var(--dim); margin-bottom:.5rem; }
    .biz-gate-badge { margin-left:auto; font-size:10px; font-weight:700; letter-spacing:.12em;
      padding:.2rem .6rem; border-radius:4px; background:rgba(78,109,136,.2); color:var(--dim); }
    .biz-gate-badge.green  { background:rgba(0,232,122,.15); color:var(--green); }
    .biz-gate-badge.yellow { background:rgba(245,200,66,.15); color:var(--yellow); }

    /* ── Concentration bars ───────────────────────────── */
    .biz-conc-bars   { display:flex; flex-direction:column; gap:.6rem; }
    .biz-conc-row    { display:grid; grid-template-columns:160px 1fr 60px 80px; align-items:center; gap:.5rem; }
    .biz-conc-label  { font-size:12px; color:var(--text); }
    .biz-conc-bar-wrap { height:10px; background:var(--border); border-radius:99px; overflow:hidden; }
    .biz-conc-bar    { height:100%; border-radius:99px; transition:width .5s ease; }
    .biz-conc-pct    { font-size:13px; font-weight:700; text-align:right; }
    .biz-conc-target { font-size:11px; color:var(--dim); }
    @media(max-width:600px) { .biz-conc-row { grid-template-columns:1fr 1fr; } }

    /* ── Income stream rows ───────────────────────────── */
    .biz-stream-row { display:flex; align-items:center; justify-content:space-between;
      padding:.5rem .75rem; border:1px solid var(--border); border-radius:8px;
      background:var(--card2); margin-bottom:.4rem; }
    .biz-stream-info { display:flex; flex-direction:column; gap:.1rem; }
    .biz-inc-grid   { display:flex; flex-direction:column; gap:.6rem; }
    .biz-inc-row    { display:flex; align-items:center; justify-content:space-between;
      padding:.5rem 0; border-bottom:1px solid var(--border); flex-wrap:wrap; gap:.5rem; }
    .biz-inc-label  { flex:1; min-width:120px; }
    .biz-inc-input  { display:flex; align-items:center; gap:.25rem; }

    /* ── Product cards ────────────────────────────────── */
    .biz-product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:.75rem; }
    .biz-product-card { background:var(--card2); border:1px solid var(--border); border-radius:10px; padding:.85rem; }
    .biz-product-icon { font-size:1.8rem; margin-bottom:.4rem; }
    .biz-product-title{ font-size:13px; font-weight:700; color:var(--text); margin-bottom:.3rem; }
    .biz-product-desc { font-size:12px; color:var(--dim); margin-bottom:.4rem; line-height:1.5; }
    .biz-product-action { font-size:11px; color:var(--accent); border-top:1px solid var(--border); padding-top:.4rem; margin-top:.4rem; }

    /* ── Colour helpers ───────────────────────────────── */
    .green { color:var(--green) !important; }
    .red   { color:var(--red)   !important; }
    .accent{ color:var(--accent)!important; }

    /* ── Light theme overrides for new components ─────── */
    [data-theme="light"] .biz-hero      { background:#ffffff; }
    [data-theme="light"] .biz-kpi-card  { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .biz-gate-item { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .biz-gate-item.pass { border-color:rgba(0,170,85,.3);  background:rgba(0,170,85,.05); }
    [data-theme="light"] .biz-gate-item.fail { border-color:rgba(200,30,30,.2); background:rgba(200,30,30,.04); }
    [data-theme="light"] .biz-stream-row{ background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .biz-product-card { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .biz-table th  { background:#f5f7fb; color:#5a7a94; }
    [data-theme="light"] .biz-conc-bar-wrap { background:#d1dce8; }
    [data-theme="light"] .biz-nw-row    { border-color:#eaf0f7; }
  `;
  document.head.appendChild(style);
})();

// ── Initial load of hero stats ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  jRenderStats();
  // Set today's date as default in journal
  const ed = $b('j-edate'); if(ed) ed.value = todayISO();
  const xd = $b('j-xdate'); if(xd) xd.value = todayISO();
  // Populate income month selector
  incRender();
});
