/* ═══════════════════════════════════════════════════════════════════
   TRADEMATRIX — POSITION SIZER
   tradematrix-sizer.js  v2.0
   Module: Sizer only (Journal · Capital · P&L · Runway · Gates · Income removed)
   Helpers and CSS injection included.
═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── Helpers ──────────────────────────────────────────────────────
const $b    = id => document.getElementById(id);
const fmtRM = (n, dec=0) => 'RM ' + (n >= 0 ? '' : '-') + Math.abs(n).toLocaleString('en-MY', {minimumFractionDigits: dec, maximumFractionDigits: dec});
const fmtPct = (n, dec=1) => (n >= 0 ? '+' : '') + n.toFixed(dec) + '%';
const clr   = n => n >= 0 ? 'var(--green)' : 'var(--red)';

// ── Tab integration — extend existing switchTab ───────────────────
const _origSwitchTab = window.switchTab;
window.switchTab = function(tab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (tab === 'sizer') {
    const p = $b('panel-sizer');
    const btn = document.querySelector('[data-tab="sizer"]');
    if (p)   p.classList.add('active');
    if (btn) btn.classList.add('active');
    szCalc();
  } else {
    if (_origSwitchTab) _origSwitchTab(tab);
  }
};

// ══════════════════════════════════════════════════════════════════
//  MODULE: POSITION SIZER
// ══════════════════════════════════════════════════════════════════

function szCalc() {
  const acct    = parseFloat($b('sz-acct')?.value)     || 0;
  const riskPct = parseFloat($b('sz-risk-pct')?.value) || 1;
  const maxPct  = parseFloat($b('sz-max-pct')?.value)  || 20;
  const entry   = parseFloat($b('sz-entry')?.value);
  const sl      = parseFloat($b('sz-sl')?.value);
  const tp1     = parseFloat($b('sz-tp1')?.value);
  const tp2     = parseFloat($b('sz-tp2')?.value);
  const atr     = parseFloat($b('sz-atr')?.value);
  const atrMult = parseFloat($b('sz-atr-mult')?.value) || 1.5;

  const card = $b('sz-result-card'); if (card) card.style.display = '';
  const body = $b('sz-result-body'); if (!body) return;

  if (!acct || !entry || !sl) {
    body.innerHTML = '<div style="color:var(--dim);font-size:13px">Enter account size, entry and stop loss to calculate position size.</div>';
    return;
  }

  const maxRiskAmt   = acct * riskPct / 100;
  const maxCapAmt    = acct * maxPct  / 100;
  const riskPerUnit  = Math.abs(entry - sl);
  const units        = Math.floor(maxRiskAmt / riskPerUnit);
  const unitsRounded = Math.floor(units / 100) * 100;
  const cappedUnits  = Math.min(unitsRounded, Math.floor(maxCapAmt / entry / 100) * 100);
  const finalUnits   = cappedUnits;
  const finalVal     = finalUnits * entry;
  const finalPct     = acct > 0 ? (finalVal / acct * 100) : 0;
  const slAmt        = finalUnits * riskPerUnit;

  const rr1  = tp1 ? (Math.abs(tp1 - entry) / riskPerUnit).toFixed(2) : null;
  const rr2  = tp2 ? (Math.abs(tp2 - entry) / riskPerUnit).toFixed(2) : null;
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
      ${rr1 ? `<div class="biz-kpi-card"><div class="biz-kpi-label">R:R to T1</div><div class="biz-kpi-val" style="color:${rrOk?'var(--green)':'var(--red)'}">${rr1}R</div></div>` : ''}
      ${rr2 ? `<div class="biz-kpi-card"><div class="biz-kpi-label">R:R to T2</div><div class="biz-kpi-val green">${rr2}R</div></div>` : ''}
    </div>
    <div class="biz-networth-grid" style="margin-bottom:.75rem">
      <div class="biz-nw-row"><span>Entry</span><strong>RM ${entry.toFixed(4)}</strong></div>
      <div class="biz-nw-row"><span>Stop Loss</span><strong style="color:var(--red)">RM ${sl.toFixed(4)} (−${(riskPerUnit/entry*100).toFixed(2)}%)</strong></div>
      ${atrSL ? `<div class="biz-nw-row"><span>ATR-Based SL (${atrMult}×ATR)</span><strong style="color:var(--yellow)">RM ${atrSL}</strong></div>` : ''}
      ${tp1   ? `<div class="biz-nw-row"><span>Target 1</span><strong style="color:var(--green)">RM ${tp1.toFixed(4)} (+${((tp1-entry)/entry*100).toFixed(2)}%)</strong></div>` : ''}
      ${tp2   ? `<div class="biz-nw-row"><span>Target 2</span><strong style="color:var(--green)">RM ${tp2.toFixed(4)} (+${((tp2-entry)/entry*100).toFixed(2)}%)</strong></div>` : ''}
    </div>
    <div class="advice-box ${sizeOk && (!rrOk || rrOk) ? 'green' : 'red'}" style="font-size:13px">
      ${finalPct > maxPct ? `⚠️ Position exceeds ${maxPct}% capital limit. Capped from ${units.toLocaleString()} to ${finalUnits.toLocaleString()} units.` : ''}
      ${rrOk === false ? '⚠️ R:R below 2:1 — consider moving target or tightening stop.' : ''}
      ${sizeOk && (rrOk === null || rrOk) ? `✅ Position sized correctly. Risk: ${fmtRM(slAmt,0)} (${riskPct}% of account). ${rr1 ? 'R:R ' + rr1 + ':1 — acceptable.' : ''}` : ''}
    </div>`;

  // ATR Reference table
  if (entry && atr) {
    const ref = $b('sz-atr-ref');
    const emp = $b('sz-atr-ref-empty');
    if (ref) { ref.style.display = ''; if (emp) emp.style.display = 'none'; }
    if (ref) ref.innerHTML = `
      <div class="biz-networth-grid">
        ${[0.5, 1, 1.5, 2, 2.5, 3].map(m => {
          const stopPrice = (entry - m * atr).toFixed(4);
          const stopPct   = ((m * atr / entry) * 100).toFixed(2);
          return `<div class="biz-nw-row">
            <span>${m}× ATR stop</span>
            <strong style="color:${m <= 1 ? 'var(--red)' : m <= 2 ? 'var(--yellow)' : 'var(--green)'}">RM ${stopPrice} (−${stopPct}%)</strong>
          </div>`;
        }).join('')}
      </div>`;
  }
}

function szReset() {
  ['sz-acct','sz-entry','sz-sl','sz-tp1','sz-tp2','sz-atr'].forEach(id => {
    const e = $b(id); if (e) e.value = '';
  });
  const rp = $b('sz-risk-pct'); if (rp) rp.value = '1';
  const mp = $b('sz-max-pct');  if (mp) mp.value = '20';
  const am = $b('sz-atr-mult'); if (am) am.value = '1.5';
  const card = $b('sz-result-card'); if (card) card.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════
//  CSS — Inject styles for Sizer components
// ══════════════════════════════════════════════════════════════════

(function injectSizerStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Sizer Tab Colour ─────────────────────────────── */
    .sizer-tab.active { color: #fb7185 !important; border-bottom-color: #fb7185 !important; }
    [data-theme="light"] .sizer-tab.active { color: #e11d48 !important; border-bottom-color: #e11d48 !important; }

    /* ── Hero Banner ──────────────────────────────────── */
    .biz-hero        { display:flex; align-items:flex-start; gap:1rem; padding:1rem 1.25rem;
                       background:var(--card); border:1px solid var(--border); border-radius:12px;
                       flex-wrap:wrap; animation:tm-fadeUp .25s ease; }
    .sizer-hero      { border-color:rgba(251,113,133,.2); background:rgba(251,113,133,.03); }
    .biz-hero-icon   { font-size:2.5rem; line-height:1; flex-shrink:0; }
    .biz-hero-title  { font-family:var(--head); font-size:1.4rem; font-weight:800; color:var(--text); }
    .biz-hero-sub    { font-size:12px; color:var(--dim); margin-top:.2rem; }

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

    /* ── Net worth / detail rows ──────────────────────── */
    .biz-networth-grid { display:flex; flex-direction:column; gap:.35rem; }
    .biz-nw-row { display:flex; justify-content:space-between; align-items:center;
                  padding:.3rem 0; border-bottom:1px solid var(--border);
                  font-size:13px; flex-wrap:wrap; gap:.25rem; }
    .biz-nw-row:last-child { border-bottom:none; }

    /* ── Colour helpers ───────────────────────────────── */
    .green  { color:var(--green)  !important; }
    .red    { color:var(--red)    !important; }
    .accent { color:var(--accent) !important; }

    /* ── Light theme overrides ────────────────────────── */
    [data-theme="light"] .biz-hero     { background:#ffffff; }
    [data-theme="light"] .biz-kpi-card { background:#f5f7fb; border-color:#d1dce8; }
    [data-theme="light"] .biz-nw-row   { border-color:#eaf0f7; }
  `;
  document.head.appendChild(style);
})();
