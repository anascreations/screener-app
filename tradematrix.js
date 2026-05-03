const TM_USER = '__TM_USER__';
const TM_PASS = '__TM_PASS__';

const TM_SESSION_KEY  = 'tm_session';
const TM_SESSION_HOURS = 12; // auto-logout after 12 hours of inactivity

function tmHashStr(s) {
// Simple obfuscation — not cryptographic, sufficient for personal use
let h = 0;
for (let i = 0; i < s.length; i++) {
h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
}
return h.toString(36);
}

function tmSaveSession(username) {
const stay = document.getElementById('tm-stay')?.checked;
const payload = {
user: username,
hash: tmHashStr(username + TM_PASS),
ts: Date.now(),
stay: stay
};
if (stay) {
localStorage.setItem(TM_SESSION_KEY, JSON.stringify(payload));
} else {
sessionStorage.setItem(TM_SESSION_KEY, JSON.stringify(payload));
}
}

function tmLoadSession() {
const raw = localStorage.getItem(TM_SESSION_KEY)
|| sessionStorage.getItem(TM_SESSION_KEY);
if (!raw) return null;
try {
const p = JSON.parse(raw);
// Validate hash
if (p.hash !== tmHashStr(p.user + TM_PASS)) return null;
// Check timeout (only for non-stay sessions handled by sessionStorage anyway)
const ageHours = (Date.now() - p.ts) / 3600000;
if (p.stay && ageHours > TM_SESSION_HOURS * 2) return null; // 24h max even with stay
return p;
} catch(e) { return null; }
}

function tmClearSession() {
localStorage.removeItem(TM_SESSION_KEY);
sessionStorage.removeItem(TM_SESSION_KEY);
}

function tmClearAllResults() {
// Call every reset function to wipe all inputs and results
try { resetMA(); }      catch(e) {}
try { resetEMA(); }     catch(e) {}
try { resetGold(); }    catch(e) {}
try { resetBursa(); }   catch(e) {}
try { resetSwing(); }   catch(e) {}
try { resetIPO(); }     catch(e) {}
try { resetListing(); } catch(e) {}
try { resetSR(); }      catch(e) {}
try { resetMTF(); }     catch(e) {}
try { smReset(); }      catch(e) {}
// Switch back to first tab
try { switchTab('ma'); } catch(e) {}
try { resetEnhance(); } catch(e) {}
}

function tmShowApp(username) {
const overlay = document.getElementById('tm-login-overlay');
if (overlay) {
overlay.classList.add('tm-login-exit');
setTimeout(() => { overlay.style.display = 'none'; }, 400);
}
// Clear all data on every login (fresh session)
setTimeout(() => { tmClearAllResults(); }, 420);
const pill = document.getElementById('tm-user-pill');
const name = document.getElementById('tm-user-name');
if (pill) pill.style.display = 'flex';
if (name) name.textContent = username;
}

function tmLogout() {
tmClearAllResults();
tmClearSession();
const un  = document.getElementById('tm-un');
const pw  = document.getElementById('tm-pw');
const err = document.getElementById('tm-login-err');
const info= document.getElementById('tm-session-info');
if (un)   un.value = '';
if (pw)   pw.value = '';
if (err)  err.style.display = 'none';
if (info) info.textContent = `Last logout: ${new Date().toLocaleString('en-MY')}`;
const pill = document.getElementById('tm-user-pill');
if (pill) pill.style.display = 'none';
const overlay = document.getElementById('tm-login-overlay');
if (overlay) {
overlay.classList.remove('tm-login-exit');
overlay.style.display = 'flex';
setTimeout(() => { if (un) un.focus(); }, 100);
}
}

function tmDoLogin() {
const un  = document.getElementById('tm-un')?.value?.trim();
const pw  = document.getElementById('tm-pw')?.value;
const err = document.getElementById('tm-login-err');
const btn = document.querySelector('.tm-login-btn');

if (!un || !pw) {
if (err) { err.textContent = '⚠️ Please enter both username and password'; err.style.display = ''; }
return;
}

// Animate button
if (btn) { btn.textContent = 'Verifying…'; btn.disabled = true; }

setTimeout(() => {
if (un === TM_USER && pw === TM_PASS) {
tmSaveSession(un);
tmShowApp(un);
// Update last-login info in overlay for next time
const info = document.getElementById('tm-session-info');
if (info) info.textContent = '';
} else {
if (err) {
err.textContent = '⚠️ Incorrect username or password';
err.style.display = '';
}
const box = document.querySelector('.tm-login-box');
if (box) {
box.classList.add('tm-login-shake');
setTimeout(() => box.classList.remove('tm-login-shake'), 500);
}
// Clear password field
const pwEl = document.getElementById('tm-pw');
if (pwEl) { pwEl.value = ''; pwEl.focus(); }
}
if (btn) { btn.textContent = 'Login'; btn.disabled = false; }
}, 350); // small delay feels more "real"
}

function tmTogglePW(btn) {
const pw = document.getElementById('tm-pw');
if (!pw) return;
if (pw.type === 'password') { pw.type = 'text'; btn.textContent = '🙈'; }
else { pw.type = 'password'; btn.textContent = '👁'; }
}

// ── Boot: check for existing session ──────────────────
(function tmBoot() {
const session = tmLoadSession();
if (session) {
// Valid session — skip login
tmShowApp(session.user);
// Refresh session timestamp
session.ts = Date.now();
const store = session.stay ? localStorage : sessionStorage;
store.setItem(TM_SESSION_KEY, JSON.stringify(session));
} else {
// Show login — focus username after short delay
const overlay = document.getElementById('tm-login-overlay');
if (overlay) overlay.style.display = 'flex';
setTimeout(() => {
const un = document.getElementById('tm-un');
if (un) un.focus();
}, 200);
}
})();

function tmToggleTheme() {
	const isNowDark = document.documentElement.getAttribute('data-theme') !== 'light';
	const newTheme  = isNowDark ? 'light' : 'dark';
	document.documentElement.setAttribute('data-theme', newTheme);
	const btn = $('tm-theme-btn');
	if (btn) btn.textContent = isNowDark ? '☀️' : '🌙';
	localStorage.setItem('tm_theme', newTheme);
	// Redraw canvases that use hardcoded colours
	setTimeout(() => {
		try { updateTTCards(); } catch(e) {}
		try { if (_srChartInstance) { _srChartInstance.destroy(); _srChartInstance = null; } } catch(e) {}
		try { if ($('sr-chart-wrap') && $('sr-chart-wrap').style.display !== 'none') srCalc(); } catch(e) {}
		try { smDrawFGArc(parseFloat($('sm-fg')?.value) || null); } catch(e) {}
		// Destroy and re-trigger dial+pie charts so colors update for new theme
		try {
			Object.values(_cjsDialMap).forEach(c => c.destroy());
			Object.keys(_cjsDialMap).forEach(k => delete _cjsDialMap[k]);
			Object.values(_cjsPieMap).forEach(c => c.destroy());
			Object.keys(_cjsPieMap).forEach(k => delete _cjsPieMap[k]);
			// Re-run active panel calc to repopulate charts
			const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
			if (activeTab === 'ma')     { try { maCalc(); }     catch(e){} }
			if (activeTab === 'ema')    { try { emaCalc(); }    catch(e){} }
			if (activeTab === 'gold')   { try { goldCalc(); }   catch(e){} }
			if (activeTab === 'bursa')  { try { bursaCalc(); }  catch(e){} }
			if (activeTab === 'swing')  { try { swingCalc(); }  catch(e){} }
		} catch(e) {}
	}, 50);
}

// Restore saved theme on load — runs before DOMContentLoaded
(function tmRestoreTheme() {
	const saved = localStorage.getItem('tm_theme');
	if (saved === 'light') {
		document.documentElement.setAttribute('data-theme', 'light');
		// Set button icon once DOM is ready
		document.addEventListener('DOMContentLoaded', () => {
			const btn = document.getElementById('tm-theme-btn');
			if (btn) btn.textContent = '☀️';
		});
	}
})();

const $ = id => document.getElementById(id);
const num = id => { const v = parseFloat($(id)?.value); return isNaN(v) ? null : v; };

// ── CSS Variable → Hex resolver for Chart.js ─────────────────────────────────
// Chart.js cannot interpret CSS variable strings — map to hardcoded hex
const _CSS_COLOR_MAP = {
  'var(--accent)':  '#00c8f0',
  'var(--accent2)': '#0088bb',
  'var(--green)':   '#00e87a',
  'var(--green2)':  '#00aa55',
  'var(--yellow)':  '#f5c842',
  'var(--red)':     '#f03a4a',
  'var(--orange)':  '#ff7043',
  'var(--gold)':    '#FFD700',
  'var(--gold2)':   '#e6b800',
  'var(--dim)':     '#4e6d88',
  'var(--text)':    '#d0e2f0',
  'var(--border)':  '#1a2b3c',
};
function rc(color) {
  // rc = resolveColor — converts CSS var strings to hex for Chart.js
  return _CSS_COLOR_MAP[color] || color;
}

// ── Theme-aware canvas color palette ─────────────────
// All canvas drawing functions use these instead of hardcoded hex
function themeColors() {
	const light = document.documentElement.getAttribute('data-theme') === 'light';
	return {
		bg:        light ? '#f0f4f8'   : '#060a0f',
		chartBg:   light ? '#ffffff'   : '#0b1018',
		chartBg2:  light ? '#f8fafc'   : '#0d1520',
		grid:      light ? '#d8e6f2'   : '#1a2b3c',
		gridTick:  light ? '#dde8f2'   : '#0f1e2e',
		axisLabel: light ? '#5a7a94'   : '#7a9bb5',
		dimLabel:  light ? '#8aaabe'   : '#4e6d88',
		dimLabel2: light ? '#9ab5c8'   : '#2a4057',
		borderBox: light ? '#d1dce8'   : '#1a2b3c',
		candleBg:  light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)',
		textMain:  light ? '#0d1e2d'   : '#d0e2f0',
		priceBg:   light ? '#060a0f'   : '#060a0f',   // price tag always dark
		nowLine:   '#00c8f0',
		accent:    '#00c8f0',
	};
}

const sel = id => $(id)?.value || '';
const pct = (v, base) => (base && base !== 0) ? ((v - base) / base * 100) : null;
const fmt = (v, d = 4) => v == null ? '—' : Number(v).toFixed(d);
const fmt2 = (v, d = 2) => v == null ? '—' : Number(v).toFixed(d) + '%';
const fmtPrice = (v, d) => {
if (v == null) return '—';
d = d ?? (v > 100 ? 2 : v > 1 ? 4 : 6);
return Number(v).toFixed(d);
};
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
function switchTab(t) {
document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
$('panel-' + t).classList.add('active');
document.querySelectorAll('.tab-btn').forEach(b => {
if (b.getAttribute('data-tab') === t) b.classList.add('active');
});
if (t === 'gold') updateGoldSessionBanner();
}
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
/* ═══════════════════════════════════════════════════════
   TIMEFRAME CONFIG & SESSION HELPERS
═══════════════════════════════════════════════════════ */
const TF_CONFIG = {
'1m':  { label:'1 Minute',  f1Ideal:0.8, f1Ok:2.0, f1Warn:4,  adxMin:18, hold:'5–30 min',      sessionNote:'Prime window only · 9:30–10:30 PM MYT', atrMult:1.2 },
'5m':  { label:'5 Minute',  f1Ideal:1.5, f1Ok:3.0, f1Warn:6,  adxMin:20, hold:'30 min – 2H',   sessionNote:'Open & Power Hour · 9:30–11 PM & 2:30–4 AM MYT', atrMult:1.3 },
'15m': { label:'15 Minute', f1Ideal:2.0, f1Ok:4.0, f1Warn:7,  adxMin:20, hold:'1 – 4 Hours',   sessionNote:'London & NY sessions', atrMult:1.4 },
'1H':  { label:'1 Hour',    f1Ideal:2.5, f1Ok:5.0, f1Warn:8,  adxMin:22, hold:'4 – 12 Hours',  sessionNote:'Good across all sessions', atrMult:1.5 },
'4H':  { label:'4 Hour',    f1Ideal:3.0, f1Ok:6.5, f1Warn:9,  adxMin:25, hold:'1 – 3 Days',    sessionNote:'Session-independent', atrMult:1.5 },
'D':   { label:'Daily',     f1Ideal:3.5, f1Ok:7.0, f1Warn:10, adxMin:25, hold:'Days – 2 Weeks',sessionNote:'Session-independent', atrMult:1.5 },
'W':   { label:'Weekly',    f1Ideal:5.0, f1Ok:9.0, f1Warn:12, adxMin:28, hold:'Weeks – Months', sessionNote:'Session-independent', atrMult:1.8 },
};

const activeTF = { ma: 'D', ema: 'D', gold: 'D', bursa: 'D', swing: 'D' };

function setTF(tab, tf) {
activeTF[tab] = tf;
const pills = document.querySelectorAll(`#${tab}-tf-pills .tf-pill`);
pills.forEach(p => p.classList.toggle('active', p.dataset.tf === tf));
const ctx = $(`${tab}-tf-ctx`);
if (ctx) {
const c = TF_CONFIG[tf];
if (tab === 'swing') {
ctx.textContent = `${c.label}  ·  Hold: ${c.hold}  ·  Reversal confirms on close  ·  ADX ≥${c.adxMin}`;
} else {
ctx.textContent = `${c.label}  ·  Hold: ${c.hold}  ·  F1 Ideal ≤${c.f1Ideal}%  ·  ADX ≥${c.adxMin}`;
}
}
if (tab === 'ma') maCalc();
else if (tab === 'ema') emaCalc();
else if (tab === 'gold') goldCalc();
else if (tab === 'bursa') bursaCalc();
else if (tab === 'swing') swingCalc();
}

function getTFConfig(tab) {
return TF_CONFIG[activeTF[tab] || 'D'];
}

function getMYTHour() {
const now = new Date();
const mytTotalMin = (now.getUTCHours() * 60 + now.getUTCMinutes() + 480) % 1440;
return mytTotalMin / 60;
}

function getMYTString() {
const now = new Date();
const mytMs = now.getTime() + 8 * 3600000;
const myt = new Date(mytMs);
return String(myt.getUTCHours()).padStart(2,'0') + ':' +
       String(myt.getUTCMinutes()).padStart(2,'0') + ':' +
       String(myt.getUTCSeconds()).padStart(2,'0') + ' MYT';
}

/* ── DST Detection ─────────────────────────────────────
   US Daylight Saving: 2nd Sun Mar → 1st Sun Nov
   DST = EDT (UTC-4) → NY open = 9:30 PM MYT
   Standard = EST (UTC-5) → NY open = 10:30 PM MYT
──────────────────────────────────────────────────── */
function isUSDST() {
try {
const fmt = new Intl.DateTimeFormat('en-US', {
timeZone: 'America/New_York',
timeZoneName: 'short'
});
const tz = fmt.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
return tz === 'EDT';
} catch(e) {
// Fallback: rough month-based check (DST Mar–Nov)
const m = new Date().getMonth() + 1;
return m >= 3 && m <= 11;
}
}

function getUSOpenHourMYT() {
// DST (EDT, ~Mar–Nov): 9:30 AM ET = 21:30 MYT
// Standard (EST, ~Nov–Mar): 9:30 AM ET = 22:30 MYT
return isUSDST() ? 21.5 : 22.5;
}

function getUSCloseHourMYT() {
// DST: 4:00 PM ET = 4:00 AM MYT (+1 day)
// Standard: 4:00 PM ET = 5:00 AM MYT (+1 day)
return isUSDST() ? 4.0 : 5.0;
}

function getUSWindowMYT() {
const h    = getMYTHour();
const open = getUSOpenHourMYT();   // 21.5 or 22.5
const close= getUSCloseHourMYT();  // 4.0  or 5.0
const openFmt  = isUSDST() ? '9:30 PM' : '10:30 PM';
const closeFmt = isUSDST() ? '4:00 AM' : '5:00 AM';
const exitFmt  = isUSDST() ? '3:50 AM' : '4:50 AM';
const lullEnd  = isUSDST() ? 1.5  : 2.5;
const powerStart = isUSDST() ? 2.5 : 3.5;

const dstNote  = isUSDST() ? '' : ' (EST — market opens 1hr later)';

// Prime: open → open+1.5h
if (h >= open && h < open + 1.5)
return { label:'🎯 Prime Window', cls:'sess-prime', tf:'5m · 15m',
note:`Market opened${dstNote} · Best momentum · Full size OK` };
// Lull: open+2h → lullEnd (crosses midnight)
const lullStart = open + 2.0;
const inLull = (lullStart < 24)
? (h >= lullStart || h < lullEnd)
: (h >= lullStart - 24 && h < lullEnd);
if (inLull)
return { label:'💤 Lull Period', cls:'sess-lull', tf:'1H or avoid',
note:'Low volume · False breakouts common · Reduce size 50%' };
// Pre-Power
if (h >= lullEnd && h < powerStart)
return { label:'🔄 Pre-Power', cls:'sess-good', tf:'15m · 1H',
note:'Volume recovering · Wait for momentum confirmation' };
// Power Hour: powerStart → close
if (h >= powerStart && h < close)
return { label:'⚡ Power Hour', cls:'sess-power', tf:'5m · 15m',
note:`Volume surge · Final push · Hard exit at ${exitFmt}` };
// Pre-market: 5:30h before open
if (h >= open - 4 && h < open)
return { label:'🔔 Pre-Market', cls:'sess-pre', tf:'1H · 4H',
note:'Limited liquidity · Watch pre-market highs/lows' };
return { label:'🔴 US Market Closed', cls:'sess-closed', tf:'4H · Daily',
note:`Market closed · Opens ${openFmt} MYT${dstNote}` };
}

// Update the window time labels in HTML dynamically
function updateUSWindowLabels() {
const open  = isUSDST() ? '9:30 PM' : '10:30 PM';
const open1 = isUSDST() ? '11:00 PM': '12:00 AM';
const lull1 = isUSDST() ? '11:30 PM': '12:30 AM';
const lull2 = isUSDST() ? '1:30 AM' : '2:30 AM';
const pow1  = isUSDST() ? '2:30 AM' : '3:30 AM';
const pow2  = isUSDST() ? '4:00 AM' : '5:00 AM';
const exit  = isUSDST() ? '3:50 AM' : '4:50 AM';
const cls1  = isUSDST() ? '4:00 AM – 9:30 PM' : '5:00 AM – 10:30 PM';
const dst   = isUSDST() ? '' : ' <span class="tt-dst-badge">EST</span>';

// Update all panels with US windows (MA, EMA, MTF)
document.querySelectorAll('.tt-us-prime-time').forEach(el =>
el.innerHTML = `${open} – ${open1}${dst}`);
document.querySelectorAll('.tt-us-lull-time').forEach(el =>
el.innerHTML = `${lull1} – ${lull2}`);
document.querySelectorAll('.tt-us-power-time').forEach(el =>
el.innerHTML = `${pow1} – ${pow2}`);
document.querySelectorAll('.tt-us-power-note').forEach(el =>
el.textContent = `Volume returns · Trend continuation · Exit by ${exit}`);
document.querySelectorAll('.tt-us-closed-time').forEach(el =>
el.textContent = cls1);
}

function getGoldWindowMYT() {
const h = getMYTHour();
if (h >= 16 && h < 21.5)  return { label:'🟢 London Open',    cls:'sess-good',   tf:'15m · 1H',    note:'European session — good gold flow' };
if (h >= 21.5 && h < 24)  return { label:'🥇 London/NY Prime', cls:'sess-prime',  tf:'5m · 15m · 1H', note:'Peak gold liquidity — best entries' };
if (h >= 0 && h < 1.0)    return { label:'🥇 London/NY Prime', cls:'sess-prime',  tf:'5m · 15m · 1H', note:'Final London/NY overlap — exits near 1 AM' };
if (h >= 1.0 && h < 4.0)  return { label:'🔴 NY Close Lull',   cls:'sess-lull',   tf:'1H · 4H',     note:'Volume fading — avoid new entries' };
if (h >= 4.0 && h < 16.0) return { label:'💤 Asian Session',   cls:'sess-lull',   tf:'4H · Daily',  note:'Tight range · Low volume · Plan mode' };
return { label:'🔴 Closed', cls:'sess-closed', tf:'Daily', note:'Market closed' };
}

function getBursaWindowMYT() {
const h = getMYTHour();
if (h >= 9.0 && h < 12.5)  return { label:'🟢 Morning Session',   cls:'sess-good',   tf:'5m · 15m · 1H', note:'Opening drive · Best ETF liquidity' };
if (h >= 12.5 && h < 14.5) return { label:'🍽️ Lunch Break',       cls:'sess-lull',   tf:'Halted',         note:'Market halted · Review plans' };
if (h >= 14.5 && h < 17.0) return { label:'🔵 Afternoon Session',  cls:'sess-good',   tf:'15m · 1H',      note:'Closing push · Exit by 4:50 PM' };
if (h >= 8.0 && h < 9.0)   return { label:'🔔 Pre-Market',         cls:'sess-pre',    tf:'Daily review',   note:'Prepare watchlist & S/R levels' };
return { label:'🔴 Bursa Closed', cls:'sess-closed', tf:'Daily · Weekly', note:'After hours — analyse charts' };
}

function updateTTCards() {
const wUS   = getUSWindowMYT();
const wGold = getGoldWindowMYT();
const wBursa= getBursaWindowMYT();
const mytStr = getMYTString();

// Update dynamic DST time labels in HTML
updateUSWindowLabels();

// US-based cards (MA, EMA, MTF)
['ma', 'ema', 'mtf'].forEach(id => {
const badge = $(`tt-sess-${id}`);
const rec   = $(`tt-rec-tf-${id}`);
const clk   = $(`tt-myt-${id}`);
if (badge) { badge.textContent = wUS.label; badge.className = `tt-session-badge ${wUS.cls}`; }
if (rec)   rec.innerHTML = `Recommended: <strong>${wUS.tf}</strong> &nbsp;·&nbsp; ${wUS.note}`;
if (clk)   clk.textContent = mytStr;
drawTTTimeline(`tt-tl-${id}`, 'us');
});

// Gold card
const gBadge = $('tt-sess-gold'), gRec = $('tt-rec-tf-gold'), gClk = $('tt-myt-gold');
if (gBadge) { gBadge.textContent = wGold.label; gBadge.className = `tt-session-badge ${wGold.cls}`; }
if (gRec)   gRec.innerHTML = `Recommended: <strong>${wGold.tf}</strong> &nbsp;·&nbsp; ${wGold.note}`;
if (gClk)   gClk.textContent = mytStr;
drawTTTimeline('tt-tl-gold', 'gold');

// Bursa card
const bBadge = $('tt-sess-bursa'), bRec = $('tt-rec-tf-bursa'), bClk = $('tt-myt-bursa');
if (bBadge) { bBadge.textContent = wBursa.label; bBadge.className = `tt-session-badge ${wBursa.cls}`; }
if (bRec)   bRec.innerHTML = `Recommended: <strong>${wBursa.tf}</strong> &nbsp;·&nbsp; ${wBursa.note}`;
if (bClk)   bClk.textContent = mytStr;
drawTTTimeline('tt-tl-bursa', 'bursa');
}

function drawTTTimeline(canvasId, mode) {
const canvas = $(canvasId);
if (!canvas || !canvas.parentElement) return;
const dpr = window.devicePixelRatio || 1;
const cssW = Math.max(200, canvas.parentElement.clientWidth - 8);
const cssH = 46;
canvas.style.width = cssW + 'px';
canvas.style.height = cssH + 'px';
canvas.width = cssW * dpr;
canvas.height = cssH * dpr;
const ctx2 = canvas.getContext('2d');
ctx2.scale(dpr, dpr);
const W = cssW, H = cssH;
const bY = 14, bH = 18;
const tX = t => (t / 24) * W;
const tc = themeColors();

ctx2.fillStyle = tc.bg;
ctx2.fillRect(0, 0, W, H);
ctx2.fillStyle = tc.grid;
ctx2.beginPath();
if (ctx2.roundRect) ctx2.roundRect(0, bY, W, bH, 3); else ctx2.rect(0, bY, W, bH);
ctx2.fill();

let bands = [], markers = [], keyLabels = [];

if (mode === 'bursa') {
bands = [
{ from: 9.0,  to: 12.5, color: 'rgba(0,232,122,0.40)' },
{ from: 12.5, to: 14.5, color: 'rgba(80,80,100,0.28)' },
{ from: 14.5, to: 17.0, color: 'rgba(0,136,187,0.38)' },
];
markers = [9.0, 12.5, 14.5, 17.0];
keyLabels = [
{ t: 9.0,  text: '9AM', color: '#00e87a' },
{ t: 14.5, text: '2:30PM', color: '#0088bb' },
{ t: 17.0, text: '5PM', color: '#4e6d88' },
];
} else if (mode === 'gold') {
bands = [
{ from: 16.0, to: 21.5, color: 'rgba(0,200,240,0.22)' },
{ from: 21.5, to: 24,   color: 'rgba(255,215,0,0.42)' },
{ from: 0,    to: 1.0,  color: 'rgba(255,215,0,0.42)' },
{ from: 1.0,  to: 4.0,  color: 'rgba(80,80,100,0.25)' },
];
markers = [16.0, 21.5, 1.0, 4.0];
keyLabels = [
{ t: 16.0, text: '4PM', color: '#00c8f0' },
{ t: 21.5, text: '9:30PM', color: '#FFD700' },
{ t: 1.0,  text: '1AM',  color: '#4e6d88' },
];
} else {
// US — DST-aware
const op  = getUSOpenHourMYT();   // 21.5 (DST) or 22.5 (EST)
const cl  = getUSCloseHourMYT();  // 4.0  (DST) or 5.0  (EST)
const ps  = (op + 3.0) % 24;     // power-hour start crosses midnight
const lullS = (op + 2.0) % 24;   // lull start
const lullE = ps;                 // lull end = power start
bands = [
{ from: 8,    to: 17,  color: 'rgba(255,160,50,0.18)'  },
{ from: 16,   to: 24,  color: 'rgba(0,180,100,0.14)'   },
{ from: 0,    to: cl,  color: 'rgba(0,180,100,0.10)'   },
{ from: op,   to: Math.min(op + 1.5, 24), color: 'rgba(0,200,240,0.42)' },
{ from: lullS,to: 24,  color: 'rgba(80,80,100,0.26)'   },
{ from: 0,    to: lullE, color: 'rgba(80,80,100,0.26)' },
{ from: ps,   to: cl,  color: 'rgba(245,200,66,0.42)'  },
];
markers = [op, cl];
const pwTxt  = isUSDST() ? '2:30AM'  : '3:30AM';
const clTxt  = isUSDST() ? '4AM'     : '5AM';
const opTxt  = isUSDST() ? '9:30PM'  : '10:30PM';
keyLabels = [
{ t: op, text: opTxt, color: '#00c8f0' },
{ t: ps, text: pwTxt, color: '#f5c842' },
{ t: cl, text: clTxt, color: '#4e6d88' },
];
}

bands.forEach(b => {
ctx2.fillStyle = b.color;
ctx2.fillRect(tX(b.from), bY, tX(b.to) - tX(b.from), bH);
});

ctx2.strokeStyle = tc.gridTick; ctx2.lineWidth = 1;
[0,2,4,6,8,10,12,14,16,18,20,22,24].forEach(h => {
ctx2.beginPath(); ctx2.moveTo(tX(h), bY); ctx2.lineTo(tX(h), bY+bH); ctx2.stroke();
});

markers.forEach(t => {
ctx2.strokeStyle = 'rgba(0,200,240,0.5)'; ctx2.lineWidth = 1.5;
ctx2.beginPath(); ctx2.moveTo(tX(t), bY); ctx2.lineTo(tX(t), bY+bH); ctx2.stroke();
});

ctx2.font = `8px 'IBM Plex Mono', monospace`;
ctx2.textAlign = 'center';
const timeLbls = ['12AM','','4AM','','8AM','','12PM','','4PM','','8PM','','12AM'];
timeLbls.forEach((lbl, i) => {
if (lbl) { ctx2.fillStyle = tc.axisLabel; ctx2.fillText(lbl, tX(i*2), bY+bH+10); }
});

keyLabels.forEach(kl => {
ctx2.fillStyle = kl.color;
ctx2.font = `bold 8px 'IBM Plex Mono', monospace`;
ctx2.fillText(kl.text, tX(kl.t), bY - 3);
});

const nowX = tX(getMYTHour());
ctx2.save();
ctx2.shadowBlur = 8; ctx2.shadowColor = '#00c8f0';
ctx2.strokeStyle = '#00c8f0'; ctx2.lineWidth = 2;
ctx2.beginPath(); ctx2.moveTo(nowX, bY-1); ctx2.lineTo(nowX, bY+bH+1); ctx2.stroke();
ctx2.shadowBlur = 0;
ctx2.fillStyle = '#00c8f0';
ctx2.beginPath(); ctx2.moveTo(nowX-4,bY-1); ctx2.lineTo(nowX+4,bY-1); ctx2.lineTo(nowX,bY+4); ctx2.closePath(); ctx2.fill();
ctx2.restore();
}

setInterval(updateTTCards, 1000);
updateTTCards();

function scoreADX(adx, prevAdx) {
if (adx == null) return null;
// Detect declining trend even when still in strong range
const declining = (prevAdx != null && adx < prevAdx && adx < 32);
if (adx > 50) return { zone: 'Momentum Surge', pass: true, c: 'var(--accent)', e: '⚡', strength: 'Very Strong', declining: false };
if (adx > 35) return { zone: 'Very Strong', pass: true, c: 'var(--green)', e: '✅', strength: 'Very Strong', declining };
if (adx > 25) {
  if (declining) return { zone: 'Strong→Fading', pass: 'warn', c: 'var(--yellow)', e: '⚠️', strength: 'Fading', declining: true };
  return { zone: 'Strong Trend', pass: true, c: 'var(--green)', e: '✅', strength: 'Strong', declining: false };
}
if (adx > 20) return { zone: 'Developing', pass: 'warn', c: 'var(--yellow)', e: '⚠️', strength: 'Developing', declining };
if (adx > 15) return { zone: 'Weak Trend', pass: 'warn', c: 'var(--orange)', e: '🟠', strength: 'Weak', declining };
return { zone: 'No Trend/Range', pass: false, c: 'var(--red)', e: '🔴', strength: 'Ranging', declining: false };
}

function scoreDMI(pdi, mdi, adx, adxr) {
if (pdi == null || mdi == null) return null;
const diff    = pdi - mdi;
const absDiff = Math.abs(diff);
const crossZone = absDiff <= 3;
const rising    = (adxr != null && adx != null) ? adx > adxr : null;

// Bear: MDI leads
if (mdi > pdi) {
	if (adx != null && adx > 25) {
		return { zone: 'Strong Bear', pass: false, c: 'var(--red)', e: '🔴',
			label: `PDI ${pdi.toFixed(1)} < MDI ${mdi.toFixed(1)}, ADX ${adx?.toFixed(1)} — strong downtrend, skip longs`,
			direction: 'bear', crossZone };
	}
	if (crossZone) {
		return { zone: 'Near Cross ⚡', pass: 'warn', c: 'var(--yellow)', e: '⚡',
			label: `PDI/MDI diff only ${absDiff.toFixed(1)} pts — crossover imminent, watch closely`,
			direction: 'bear', crossZone };
	}
	return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴',
		label: `PDI ${pdi.toFixed(1)} < MDI ${mdi.toFixed(1)} — bears in control`,
		direction: 'bear', crossZone };
}

// Bull: PDI leads
const risingNote = rising === true ? ' · ADX rising ✅' : rising === false ? ' · ADX weakening ⚠️' : '';
if (adx != null && adx > 25) {
	if (crossZone) {
		return { zone: 'Bull Cross ⚡', pass: true, c: 'var(--accent)', e: '⚡',
			label: `Fresh bull cross! PDI ${pdi.toFixed(1)} > MDI ${mdi.toFixed(1)}, ADX ${adx?.toFixed(1)}${risingNote} — highest conviction`,
			direction: 'bull', crossZone, rising };
	}
	return { zone: 'Strong Bull', pass: true, c: 'var(--green)', e: '✅',
		label: `PDI ${pdi.toFixed(1)} > MDI ${mdi.toFixed(1)}, ADX ${adx?.toFixed(1)}${risingNote} — bulls confirmed`,
		direction: 'bull', crossZone, rising };
}
return { zone: 'Bull Weak ADX', pass: 'warn', c: 'var(--yellow)', e: '⚠️',
	label: `PDI ${pdi.toFixed(1)} > MDI ${mdi.toFixed(1)} — bullish direction but ADX <25, wait for trend to strengthen`,
	direction: 'bull', crossZone };
}


function scoreRSI(rsi, context = 'default') {
if (rsi == null) return null;
if (context === 'gold') {
if (rsi >= 50 && rsi <= 70) return { zone: 'Sweet Spot', pass: true, c: 'var(--green)', e: '🎯' };
if (rsi >= 45 && rsi < 50) return { zone: 'Building', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
if (rsi > 70 && rsi <= 75) return { zone: 'Momentum OB', pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
if (rsi > 75 && rsi <= 80) return { zone: 'Overbought', pass: 'warn', c: 'var(--orange)', e: '⚠️' };
if (rsi > 80) return { zone: 'Extreme OB', pass: false, c: 'var(--red)', e: '🔴' };
if (rsi < 40) return { zone: 'Weak/Below', pass: false, c: 'var(--red)', e: '🔴' };
return { zone: 'Neutral', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
}
// Default (equities/US stocks)
if (rsi >= 55 && rsi <= 70) return { zone: 'Bullish Zone', pass: true, c: 'var(--green)', e: '✅' };
if (rsi >= 50 && rsi < 55)  return { zone: 'Above 50', pass: true, c: 'var(--accent)', e: '🟢' };
if (rsi > 70 && rsi <= 78)  return { zone: 'Momentum Run', pass: 'warn', c: 'var(--yellow)', e: '⚡',
  note: 'High RSI can persist in strong trends — watch for bearish divergence' };
if (rsi > 78 && rsi <= 85)  return { zone: 'Overbought', pass: 'warn', c: 'var(--orange)', e: '⚠️' };
if (rsi > 85)               return { zone: 'Extreme OB', pass: false, c: 'var(--red)', e: '🔴' };
if (rsi >= 40 && rsi < 50)  return { zone: 'Below 50', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
if (rsi < 40)               return { zone: 'Weak', pass: false, c: 'var(--red)', e: '🔴' };
return { zone: 'Neutral', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
}
function scoreKDJ(k, d, j) {
if (k == null || d == null) return null;
// Fresh bullish crossover (K crossing above D) — strongest signal
const freshCross = k > d && (k - d) < 5 && k < 75;
if (j != null && j > 95) return { zone: 'Extreme OB — Exit Risk', pass: false, c: 'var(--red)', e: '🔴' };
if (j != null && j > 85) return { zone: 'Overbought', pass: 'warn', c: 'var(--yellow)', e: '🟡' };
if (j != null && j < 10) return { zone: 'Extreme Oversold Bounce', pass: true, c: 'var(--green)', e: '💎',
  note: 'J<10 = rare oversold extreme — high-probability bounce setup' };
if (j != null && j < 20) return { zone: 'Oversold Bounce', pass: true, c: 'var(--accent)', e: '💡' };
if (k < d) return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴' };
if (freshCross) return { zone: 'Fresh Bull Cross ⚡', pass: true, c: 'var(--green)', e: '⚡',
  note: 'Fresh K/D crossover — high-conviction momentum entry' };
if (j != null && j > 50) return { zone: 'Bullish Strong', pass: true, c: 'var(--green)', e: '✅' };
return { zone: 'Bullish Building', pass: true, c: 'var(--accent)', e: '🟢' };
}
function scoreMACDZone(dif, dea, hist) {
if (dif == null || dea == null) return null;
if (dif < dea) {
  // Bearish — but check if histogram is shrinking (possible reversal)
  if (hist != null && hist > -0.001) return { zone: 'Bearish (Hist Shrinking)', pass: false, c: 'var(--orange)', e: '⚠️',
    note: 'MACD bearish but histogram contracting — watch for reversal' };
  return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴' };
}
const diff = dif - dea;
const avg = (Math.abs(dif) + Math.abs(dea)) / 2;
const expanding = hist != null && hist > 0;
if (avg > 0 && diff / avg < 0.05) return { zone: 'Near Cross', pass: 'warn', c: 'var(--yellow)', e: '⚠️',
  note: 'MACD/Signal very close — crossover could happen soon' };
if (dif > 0 && dea > 0) {
  if (expanding) return { zone: 'Strong Bull 🚀', pass: true, c: 'var(--green)', e: '🚀',
    note: 'Both lines positive + histogram expanding = strongest MACD signal' };
  return { zone: 'Strong Bull', pass: true, c: 'var(--green)', e: '🚀' };
}
// DIF > DEA but in negative territory (early bullish cross)
return { zone: 'Bullish Cross', pass: true, c: 'var(--accent)', e: '✅',
  note: 'MACD crossed above signal — momentum turning bullish' };
}
function scoreSupertrend(price, st) {
if (price == null || st == null) return null;
if (price > st) return { zone: 'Bullish', pass: true, c: 'var(--green)', e: '🟢' };
return { zone: 'Bearish', pass: false, c: 'var(--red)', e: '🔴' };
}
function scoreIchimoku(position) {
if (!position) return null;
if (position === 'above') return { zone: 'Above Cloud', pass: true, c: 'var(--green)', e: '✅' };
if (position === 'inside') return { zone: 'Inside Cloud', pass: 'warn', c: 'var(--yellow)', e: '⚠️' };
return { zone: 'Below Cloud', pass: false, c: 'var(--red)', e: '🔴' };
}
function scoreVWAP(price, vwap) {
if (price == null || vwap == null) return null;
const pctAbove = pct(price, vwap);
if (pctAbove > 2) return { zone: `+${pctAbove.toFixed(2)}% above VWAP`, pass: true, c: 'var(--green)', e: '✅' };
if (pctAbove >= 0) return { zone: `+${pctAbove.toFixed(2)}% above VWAP`, pass: true, c: 'var(--accent)', e: '🟢' };
return { zone: `${pctAbove.toFixed(2)}% below VWAP`, pass: false, c: 'var(--red)', e: '🔴' };
}
function scoreVolume(vol) {
if (vol == null) return null;
if (vol >= 3.0) return { zone: 'Institutional Surge ⚡', pass: true, c: 'var(--green)', e: '⚡',
  note: '3×+ avg volume = smart money accumulation — very high conviction' };
if (vol >= 2.0) return { zone: 'Very Strong', pass: true, c: 'var(--green)', e: '⚡',
  note: '2×+ avg = strong institutional interest' };
if (vol >= 1.5) return { zone: 'Strong', pass: true, c: 'var(--green)', e: '✅' };
if (vol >= 1.2) return { zone: 'Above Average', pass: true, c: 'var(--accent)', e: '🟢' };
if (vol >= 0.9) return { zone: 'Average', pass: 'warn', c: 'var(--yellow)', e: '🟡',
  note: 'Average volume — wait for volume confirmation before entry' };
if (vol >= 0.6) return { zone: 'Below Average', pass: 'warn', c: 'var(--orange)', e: '🟠',
  note: 'Low volume — breakouts here are less reliable' };
return { zone: 'Very Low / Trap Risk', pass: false, c: 'var(--red)', e: '🔴',
  note: 'Low volume breakout = potential bull trap. Wait for volume.' };
}
function getGrade(gap) {
if (gap < 0) return { g: 'BEAR', e: '🔻', cls: 'grade-x', c: 'var(--red)' };
if (gap < 1) return { g: 'FLAT', e: '➡️', cls: 'grade-x', c: 'var(--dim)' };
if (gap < 3) return { g: 'S++', e: '🚀', cls: 'grade-spp', c: 'var(--green)' };
if (gap < 5) return { g: 'A', e: '✅', cls: 'grade-a', c: 'var(--accent)' };
if (gap < 8) return { g: 'B', e: '⚠️', cls: 'grade-b', c: 'var(--yellow)' };
if (gap < 10) return { g: 'C', e: '🟡', cls: 'grade-c', c: 'var(--orange)' };
return { g: 'X', e: '🛑', cls: 'grade-x', c: 'var(--red)' };
}
function calcFib(high, low) {
if (high == null || low == null || high <= low) return null;
const r = high - low;
return {
'ext_261': high + r * 1.618,
'ext_200': high + r * 1.000,
'ext_161': high + r * 0.618,
'ext_141': high + r * 0.414,
'ext_127': high + r * 0.272,
'0': high,
'23.6': high - r * 0.236,
'38.2': high - r * 0.382,
'50': high - r * 0.500,
'61.8': high - r * 0.618,
'78.6': high - r * 0.786,
'88.6': high - r * 0.886,
'100': low,
range: r,
high, low,
};
}
function fibConfluence(fib1, fib2, rangeTolerance) {
const levels1 = ['23.6', '38.2', '50', '61.8', '78.6'];
const levels2 = ['23.6', '38.2', '50', '61.8', '78.6'];
const zones = [];
for (const l1 of levels1) {
for (const l2 of levels2) {
if (!fib1[l1] || !fib2[l2]) continue;
const diff = Math.abs(fib1[l1] - fib2[l2]);
const pctDiff = (diff / rangeTolerance) * 100;
if (pctDiff <= 1.5) {
zones.push({
price: (fib1[l1] + fib2[l2]) / 2,
level1: l1, level2: l2,
strength: pctDiff < 0.5 ? 'STRONG' : 'MODERATE',
diffPct: pctDiff,
});
}
}
}
return zones.sort((a, b) => a.diffPct - b.diffPct);
}
function fibAccuracyScore(price, fib, emaStack) {
const KEY_LEVELS = [
{ key: '38.2', weight: 90, name: '38.2% Golden Retrace' },
{ key: '61.8', weight: 100, name: '61.8% Golden Ratio' },
{ key: '50', weight: 70, name: '50% Midpoint' },
{ key: '23.6', weight: 50, name: '23.6% Minor' },
{ key: '78.6', weight: 60, name: '78.6% Deep' },
{ key: '88.6', weight: 40, name: '88.6% Harmonic' },
];
let bestScore = 0, bestLevel = null;
for (const lv of KEY_LEVELS) {
const lvPrice = fib[lv.key];
if (!lvPrice) continue;
const distPct = Math.abs(price - lvPrice) / fib.range * 100;
const proximity = Math.max(0, 1 - distPct / 3);
const score = proximity * lv.weight;
if (score > bestScore) { bestScore = score; bestLevel = { ...lv, lvPrice, distPct }; }
}
let emaBonus = 0;
if (emaStack && bestLevel) {
for (const ema of emaStack) {
if (!ema) continue;
const emaDist = Math.abs(ema - bestLevel.lvPrice) / fib.range * 100;
if (emaDist < 1.0) { emaBonus = 15; break; }
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
function kellySize(winRate, avgWinR, avgLossR) {
if (!winRate || !avgWinR || !avgLossR || avgLossR === 0) return null;
const b = avgWinR / avgLossR;
const p = winRate / 100;
const q = 1 - p;
const kelly = (p * b - q) / b;
return {
full: Math.max(0, Math.min(100, kelly * 100)),
half: Math.max(0, Math.min(100, kelly * 50)),
};
}
function buildTradePlan(containerId, cardId, price, atr, accountSize, riskPct, context = 'default') {
const card = $(cardId);
const box = $(containerId);
if (!card || !box || !price || !atr) { if (card) card.style.display = 'none'; return; }
card.style.display = '';

// ── Dynamic multipliers by context ──────────────────────────────────
// Gold: wider SL due to higher volatility, bigger TP targets
// Bursa ETF: tighter SL, quicker TP1 for liquidity
// Default (US stocks): balanced
const slMult  = context === 'gold' ? 1.8 : context === 'bursa' ? 1.3 : 1.5;
const tp1Mult = context === 'gold' ? 1.5 : context === 'bursa' ? 1.2 : 1.5; // R:R 1:1 minimum
const tp2Mult = context === 'gold' ? 3.0 : context === 'bursa' ? 2.5 : 2.8; // R:R ~1:2
const tp3Mult = context === 'gold' ? 5.0 : context === 'bursa' ? 4.0 : 4.5; // R:R ~1:3+
const trailMult = context === 'gold' ? 1.2 : 1.0;

const sl  = price - atr * slMult;
const be  = price + atr * 0.25; // breakeven zone (slight buffer above entry)
const tp1 = price + atr * tp1Mult;
const tp2 = price + atr * tp2Mult;
const tp3 = price + atr * tp3Mult;
const risk = price - sl;
if (risk <= 0) { if (card) card.style.display = 'none'; return; }
const rr1 = (tp1 - price) / risk;
const rr2 = (tp2 - price) / risk;
const rr3 = (tp3 - price) / risk;
const dp = context === 'gold' ? 2 : 4;

// ── Risk quality assessment ──────────────────────────────────────────
const riskPctOfPrice = (risk / price) * 100;
const rrQuality = rr2 >= 2 ? '✅ Excellent' : rr2 >= 1.5 ? '🟢 Good' : rr2 >= 1 ? '🟡 Minimum' : '🔴 Poor';

const kellyId = containerId.replace('price-block', 'kelly-block');
const kellyEl = $(kellyId);
if (accountSize && riskPct) {
const riskAmt = accountSize * (riskPct / 100);
// Enforce max 2% risk rule
const effectiveRiskPct = Math.min(riskPct, 2);
const effectiveRiskAmt = accountSize * (effectiveRiskPct / 100);
const overRisk = riskPct > 2;
const shares = (effectiveRiskAmt / risk).toFixed(2);
const positionVal = (price * parseFloat(shares)).toFixed(2);
const positionPct = ((price * parseFloat(shares)) / accountSize * 100).toFixed(1);
const kelly = kellySize(58, rr2, 1.0); // 58% win rate assumption with this R:R
const kellySz = kelly ? (kelly.half).toFixed(1) : null;
const maxDrawdown3 = (effectiveRiskAmt * 3).toFixed(2); // 3 consecutive losses
if (kellyEl) {
kellyEl.style.display = '';
kellyEl.innerHTML = `
        <div class="kelly-block">
          <div class="kelly-title">⚖️ Risk Management Calculator</div>
          ${overRisk ? `<div class="kelly-row" style="color:var(--red);font-size:10px;margin-bottom:.2rem">⚠️ Risk ${riskPct}% exceeds 2% rule — capped at 2% for position sizing</div>` : ''}
          <div class="kelly-row"><span class="kelly-label">Account Size</span><span class="kelly-val">$${Number(accountSize).toLocaleString()}</span></div>
          <div class="kelly-row"><span class="kelly-label">Risk per Trade (${effectiveRiskPct}%)</span><span class="kelly-val" style="color:var(--red)">$${effectiveRiskAmt.toFixed(2)}</span></div>
          <div class="kelly-row"><span class="kelly-label">SL Distance (ATR×${slMult})</span><span class="kelly-val">$${risk.toFixed(dp)} · ${riskPctOfPrice.toFixed(2)}% of price</span></div>
          <div class="kelly-row"><span class="kelly-label">Suggested Units / Shares</span><span class="kelly-val" style="color:var(--green)">${shares}</span></div>
          <div class="kelly-row"><span class="kelly-label">Position Value</span><span class="kelly-val">$${Number(positionVal).toLocaleString()} (${positionPct}% of account)</span></div>
          <div class="kelly-row"><span class="kelly-label">R:R Quality</span><span class="kelly-val">${rrQuality} (TP2 = 1:${rr2.toFixed(1)})</span></div>
          ${kellySz ? `<div class="kelly-row"><span class="kelly-label">Half-Kelly Size</span><span class="kelly-val" style="color:var(--yellow)">${kellySz}% of account</span></div>` : ''}
          <div class="kelly-row"><span class="kelly-label">3-Loss Drawdown Scenario</span><span class="kelly-val" style="color:var(--orange)">-$${maxDrawdown3} (${(parseFloat(maxDrawdown3)/accountSize*100).toFixed(1)}%)</span></div>
          <div class="kelly-row" style="margin-top:.25rem;padding-top:.25rem;border-top:1px solid var(--border)">
            <span class="kelly-label" style="color:var(--dim);font-size:9.5px">💡 After 3 losses: reduce size by 50% until 2 wins. Never average down on a losing trade.</span>
          </div>
        </div>`;
}
} else {
if (kellyEl) kellyEl.style.display = 'none';
}
box.innerHTML = `
    <div class="prow entry">
      <span class="prow-label">📍 Ideal Entry</span>
      <span class="prow-val accent">${price.toFixed(dp)}</span>
      <span class="prow-note">Enter on confirmed close above — not on anticipation</span>
    </div>
    <div class="prow sl">
      <span class="prow-label">🛑 Stop Loss (ATR×${slMult})</span>
      <span class="prow-val red">${sl.toFixed(dp)}</span>
      <span class="prow-note">Hard stop — set immediately. SL distance: ${risk.toFixed(dp)} (${riskPctOfPrice.toFixed(2)}% of price)</span>
    </div>
    <div class="prow" style="background:rgba(0,200,240,0.03)">
      <span class="prow-label">🔒 Breakeven Zone</span>
      <span class="prow-val accent">${be.toFixed(dp)}</span>
      <span class="prow-note">Move SL here if price stalls before TP1 — protect capital first</span>
    </div>
    <div class="prow tp1">
      <span class="prow-label">✅ TP1 — Exit 35%</span>
      <span class="prow-val green">${tp1.toFixed(dp)}</span>
      <span class="prow-note">R:R 1:${rr1.toFixed(2)} — at TP1: move SL to entry (breakeven). Lock profit.</span>
    </div>
    <div class="prow tp2">
      <span class="prow-label">🎯 TP2 — Exit 45%</span>
      <span class="prow-val g2">${tp2.toFixed(dp)}</span>
      <span class="prow-note">R:R 1:${rr2.toFixed(2)} — at TP2: trail stop ATR×${trailMult} below swing high</span>
    </div>
    <div class="prow tp3">
      <span class="prow-label">🚀 TP3 — Exit 20%</span>
      <span class="prow-val g3">${tp3.toFixed(dp)}</span>
      <span class="prow-note">R:R 1:${rr3.toFixed(2)} — runner position, trail or hold for continuation</span>
    </div>
    <div class="prow info" style="margin-top:.2rem">
      <span class="prow-label">📐 Trailing Stop</span>
      <span class="prow-val gold">ATR × ${trailMult}</span>
      <span class="prow-note">After TP1: trail ${trailMult}×ATR below each new higher high. Never widen SL.</span>
    </div>`;
}
// ─── Chart.js Gauge + Donut — Signal Breakdown ─────────────────────────────
const _cjsDialMap = {};
const _cjsPieMap  = {};

function _cjsDialColor(score, goldMode) {
  if (goldMode) return score >= 75 ? '#FFD700' : score >= 55 ? '#f5c842' : '#f03a4a';
  return score >= 75 ? '#00e87a' : score >= 55 ? '#f5c842' : '#f03a4a';
}

function updateDial(arcId, scoreId, score, goldMode = false) {
  // arcId = e.g. 'ma-dial-arc', extract prefix 'ma'
  const pfx = arcId.replace('-dial-arc', '');
  const canvasId = pfx + '-dial-canvas';
  const canvas = $(canvasId);
  if (!canvas) return;

  const s = Math.min(100, Math.max(0, score));
  const fillColor = _cjsDialColor(s, goldMode);
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const trackColor = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.07)';

  if (_cjsDialMap[pfx]) {
    // Update existing chart
    const ch = _cjsDialMap[pfx];
    ch.data.datasets[0].data = [s, 100 - s];
    ch.data.datasets[0].backgroundColor = [fillColor, trackColor];
    ch.options.plugins.doughnutCenterText = { score: Math.round(s), color: fillColor, goldMode };
    ch.update('active');
    return;
  }

  // Create gauge chart (half-doughnut)
  const ctx = canvas.getContext('2d');
  _cjsDialMap[pfx] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [s, 100 - s],
        backgroundColor: [fillColor, trackColor],
        borderWidth: 0,
        borderRadius: [6, 0],
        hoverOffset: 4,
      }],
    },
    options: {
      rotation: -90,       // start from left
      circumference: 180,  // half circle
      cutout: '72%',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutCubic' },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: isLight ? 'rgba(10,20,40,0.94)' : 'rgba(6,12,22,0.96)',
          titleColor: fillColor,
          bodyColor: '#d0e2f0',
          borderColor: fillColor,
          borderWidth: 1,
          titleFont: { family: "'Syne', sans-serif", size: 13, weight: '700' },
          bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: () => `Score: ${Math.round(s)} / 100`,
            label: () => {
              if (s >= 75) return ' ✅ High conviction setup';
              if (s >= 55) return ' ⚠️ Partial setup — watch';
              return ' 🔴 Skip — filters not met';
            },
          },
        },
        doughnutCenterText: { score: Math.round(s), color: fillColor, goldMode },
      },
    },
    plugins: [{
      id: 'doughnutCenterText',
      afterDraw(chart) {
        const { ctx: c, chartArea: { top, left, width, height } } = chart;
        const opt = chart.options.plugins.doughnutCenterText || {};
        const sc = opt.score ?? 0;
        const col = opt.color ?? '#00c8f0';
        const cx = left + width / 2;
        const cy = top + height * 0.88; // bottom of semicircle
        c.save();
        // Big score number
        c.font = "bold 26px 'Syne', sans-serif";
        c.fillStyle = col;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(sc, cx, cy - 10);
        // Label
        c.font = "600 9px 'IBM Plex Mono', monospace";
        c.fillStyle = '#f5c842';
        c.letterSpacing = '0.1em';
        c.fillText('SCORE /100', cx, cy + 10);
        c.restore();
      },
    }],
  });
}

function drawPie(svgId, legendId, segments) {
  const canvas = $(svgId);
  const legend = $(legendId);
  if (!canvas || !legend) return;

  const validSegs = segments.filter(s => s.value > 0);
  const total = validSegs.reduce((a, s) => a + s.value, 0);
  if (total === 0) { if (legend) legend.innerHTML = ''; return; }

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const labels  = validSegs.map(s => s.label);
  const values  = validSegs.map(s => s.value);
  const colors  = validSegs.map(s => rc(s.color));   // ← resolve CSS vars → hex
  const pcts    = validSegs.map(s => ((s.value / total) * 100).toFixed(1));
  const topSeg  = [...validSegs].sort((a, b) => b.value - a.value)[0];
  const topPct  = ((topSeg.value / total) * 100).toFixed(0);

  if (_cjsPieMap[svgId]) {
    const ch = _cjsPieMap[svgId];
    ch.data.labels = labels;
    ch.data.datasets[0].data   = values;
    ch.data.datasets[0].backgroundColor = colors;
    ch.options.plugins.doughnutCenter = { label: topSeg.label, pct: topPct, color: topSeg.color };
    ch.update('active');
  } else {
    const ctx = canvas.getContext('2d');
    _cjsPieMap[svgId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(6,10,15,0.5)',
          borderWidth: 2,
          hoverOffset: 8,
          hoverBorderWidth: 0,
        }],
      },
      options: {
        cutout: '58%',
        responsive: false,
        animation: { duration: 600, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: isLight ? 'rgba(10,20,40,0.94)' : 'rgba(6,12,22,0.96)',
            borderWidth: 1,
            titleFont: { family: "'Syne', sans-serif", size: 13, weight: '700' },
            bodyFont:  { family: "'IBM Plex Mono', monospace", size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => {
                const pct = ((item.parsed / total) * 100).toFixed(1);
                return ` Weight: ${item.parsed} (${pct}%)`;
              },
              labelColor: (item) => ({
                borderColor: colors[item.dataIndex],
                backgroundColor: colors[item.dataIndex],
                borderWidth: 2,
                borderRadius: 3,
              }),
            },
          },
          doughnutCenter: { label: topSeg.label, pct: topPct, color: topSeg.color },
        },
      },
      plugins: [{
        id: 'doughnutCenter',
        afterDraw(chart) {
          const { ctx: c, chartArea: { top, left, width, height } } = chart;
          const opt = chart.options.plugins.doughnutCenter || {};
          const cx = left + width / 2, cy = top + height / 2;
          c.save();
          c.font = "bold 20px 'Syne', sans-serif";
          c.fillStyle = opt.color || '#00c8f0';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText((opt.pct || '0') + '%', cx, cy - 7);
          c.font = "600 8px 'IBM Plex Mono', monospace";
          c.fillStyle = 'var(--text)';
          const lbl = (opt.label || '').toUpperCase().slice(0, 9);
          c.fillText(lbl, cx, cy + 9);
          c.restore();
        },
      }],
    });
  }

  // Update legend
  legend.innerHTML = validSegs.map((s, i) =>
    `<div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      <span class="legend-label">${s.label}</span>
      <span class="legend-val" style="color:${colors[i]}">${s.value}</span>
      <span class="legend-pct">${pcts[i]}%</span>
    </div>`
  ).join('');
}

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
function updateRange(fillId, markerId, labelId, val, max) {
const pctNum = Math.min(100, Math.max(0, (val / max) * 100));
const fill = $(fillId);
const marker = $(markerId);
const label = $(labelId);
if (fill) fill.style.width = pctNum + '%';
if (marker) marker.style.left = pctNum + '%';
if (label) label.textContent = fmt2(val);
}
function buildCheck(label, pass, result) {
const icon = pass === true ? '✔' : pass === false ? '✘' : '○';
const cls = pass === true ? 'check-pass' : pass === false ? 'check-fail' : 'check-neutral';
const vcls = pass === true ? 'pass' : pass === false ? 'fail' : 'warn';
return `<div class="check-row"><span class="${cls}">${icon}</span><span class="check-label">${label}</span><span class="check-val ${vcls}">${result || ''}</span></div>`;
}
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
function scoreEngine() {
let score = 0, total = 0;
const add = (pass, w) => {
if (pass == null) return;
total += w;
if (pass === true) score += w;
else if (pass === 'warn') score += w * 0.5;
};
const result = () => total > 0 ? (score / total) * 100 : 0;
return { add, result, getTotal: () => total, getScore: () => score };
}
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
const hist = num('ma-hist');
const vol = num('ma-vol');
const atr = num('ma-atr');
const adxV = num('ma-adx');
const pdiV = num('ma-pdi');
const mdiV = num('ma-mdi');
const adxrV = num('ma-adxr');
const stV = num('ma-st');
const bbu = num('ma-bbu');
const bbl = num('ma-bbl');
const riskPct = num('ma-risk-pct');
const accountSz = num('ma-account');
const pAboveMA20 = pct(price, ma20);
const pAboveMA5 = pct(price, ma5);
const pAboveMA50 = pct(price, ma50);
const pAboveMA200 = ma200 ? pct(price, ma200) : null;
const ma5AboveMA20 = pct(ma5, ma20);
const ma20AboveMA50 = pct(ma20, ma50);
const ma50AbMA200 = ma200 ? pct(ma50, ma200) : null;
const f1_pass = price > ma5;
const f2_pass = ma5 > ma20;
const f3_pass = ma20 > ma50;
const f4_ma200 = ma200 ? price > ma200 : null;
const kdj = scoreKDJ(k, d, j);
const macd = scoreMACDZone(dif, dea, hist);
const volS = scoreVolume(vol);
const adxS = scoreADX(adxV);
const dmiS = scoreDMI(pdiV, mdiV, adxV, adxrV);
const stS = scoreSupertrend(price, stV);
const rsiS = scoreRSI(num('ma-rsi'));
const eng = scoreEngine();
// Core MA stack — most important
eng.add(f1_pass, 20);   // Price above MA5: immediate momentum
eng.add(f2_pass, 18);   // MA5 above MA20: short-term trend
eng.add(f3_pass, 14);   // MA20 above MA50: medium trend
eng.add(f4_ma200, 8);   // MA200: macro alignment
// Momentum oscillators
eng.add(kdj  ? kdj.pass  : null, 16); // KDJ: short-term momentum
eng.add(macd ? macd.pass : null, 14); // MACD: trend momentum
eng.add(rsiS ? rsiS.pass : null, 10); // RSI: overbought/oversold
// Trend strength
eng.add(adxS ? adxS.pass : null, 16); // ADX: trend intensity
eng.add(dmiS ? dmiS.pass : null, 12); // DMI: direction confirmation
// Supporting
eng.add(volS ? volS.pass : null, 10); // Volume: institutional confirmation
eng.add(stS  ? stS.pass  : null, 6);  // Supertrend: trend filter
const tfCfg = getTFConfig('ma');

// ── Confluence bonus: multiple strong signals ─────────────────────────
let bonus = 0;
const strongSignals = [
  kdj?.pass === true && kdj?.zone?.includes('Cross'),    // fresh KDJ cross
  macd?.pass === true && (macd?.zone?.includes('Strong') || macd?.zone?.includes('expanding')),
  adxS?.pass === true && adxS?.strength === 'Very Strong',
  dmiS?.pass === true && dmiS?.crossZone,                // fresh DMI cross
  volS?.pass === true && vol >= 2.0,                     // 2x+ volume surge
  f4_ma200 && ma50AbMA200 > 0,                           // full MA rainbow
].filter(Boolean).length;
if (strongSignals >= 4) bonus = 8;
else if (strongSignals >= 3) bonus = 4;
else if (strongSignals >= 2) bonus = 2;

// ── Session bonus: trading at prime time ──────────────────────────────
const sessNow = getUSWindowMYT();
const sessBonus = sessNow.cls === 'sess-prime' ? 5
  : sessNow.cls === 'sess-power' ? 3
  : sessNow.cls === 'sess-lull'  ? -8   // penalize for lull trading
  : 0;

// ── Over-extension penalty ────────────────────────────────────────────
let penalty = 0;
const maHard = tfCfg.f1Warn * 1.6, maMed = tfCfg.f1Warn * 1.2, maSoft = tfCfg.f1Warn;
if (pAboveMA20 > maHard) penalty = -30;
else if (pAboveMA20 > maMed) penalty = -20;
else if (pAboveMA20 > maSoft) penalty = -10;

const adjScore = Math.max(0, Math.min(100, eng.result() + penalty + bonus + sessBonus));

const momentumOk = (!kdj || kdj.pass !== false)
&& (!macd || macd.pass !== false)
&& (!adxS || adxS.pass !== false)
&& (!dmiS || dmiS.pass !== false)
&& (!kdj || !(j != null && j > 90));

// ── Decision thresholds (tighter = more conservative = better) ───────
let decision, riskLevel, posSize;
const kdjBearish = kdj?.pass === false;
const macdBearish = macd?.pass === false;
const criticalFail = !f1_pass || !f2_pass || !f3_pass;
const momentumFail = kdjBearish || macdBearish;

if (criticalFail || (momentumFail && !momentumOk)) {
decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0%';
} else if (adjScore >= 78) {
decision = 'PROCEED'; riskLevel = 'Low Risk';
posSize = pAboveMA20 > 7 ? '50%' : strongSignals >= 3 ? '100%' : '75%';
} else if (adjScore >= 68) {
decision = 'PROCEED'; riskLevel = 'Medium Risk';
posSize = pAboveMA20 > 5 ? '25%' : '50%';
} else if (adjScore >= 55) {
decision = 'WATCH'; riskLevel = 'Medium Risk'; posSize = '25%';
} else {
decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0%';
}
const grade = getGrade(ma20AboveMA50);
if (grade.g === 'X' && posSize === '100%') posSize = '50%';
if (grade.g === 'X' && decision === 'PROCEED' && adjScore < 80) decision = 'WATCH';
// Lull period: force WATCH even on good scores — no full size during low volume
if (sessNow.cls === 'sess-lull' && decision === 'PROCEED' && posSize === '100%') posSize = '50%';

setDecisionStrip('ma', decision, riskLevel, grade, `
    <div>Price: <span style="color:var(--text)">${fmt(price)}</span>
      &nbsp; MA5: <span style="color:var(--text)">${fmt(ma5)}</span>
      MA20: <span style="color:var(--text)">${fmt(ma20)}</span>
      MA50: <span style="color:var(--text)">${fmt(ma50)}</span>
    </div>
    <div>Position: <span style="color:${posSize === '100%' || posSize === '75%' ? 'var(--green)' : posSize === '50%' ? 'var(--yellow)' : 'var(--dim)'}">${posSize}</span>
      &nbsp; Score: <span style="color:var(--accent)">${adjScore.toFixed(0)}/100</span>
      ${bonus > 0 ? `<span style="color:var(--green);font-size:9px"> +${bonus}pts confluence</span>` : ''}
      ${sessBonus !== 0 ? `<span style="color:${sessBonus > 0 ? 'var(--green)' : 'var(--orange)'};font-size:9px"> ${sessBonus > 0 ? '+' : ''}${sessBonus}pts session</span>` : ''}
      ${adxV ? `&nbsp; ADX: <span style="color:${adxS.c}">${adxV.toFixed(1)} ${adxS.strength}</span>` : ''}
    </div>`
);
const adv = $('ma-advice');
if (decision === 'PROCEED') {
const lines = [
pAboveMA20 > tfCfg.f1Ok
? `⚠️ Price ${pAboveMA20.toFixed(1)}% above MA20 — stretched for ${tfCfg.label} (ideal ≤${tfCfg.f1Ideal}%). Consider waiting for pullback toward MA5 (${fmt(ma5)}).`
: `✅ Full bull MA stack confirmed. Price is ${pAboveMA20.toFixed(1)}% above MA20 (ideal ≤${tfCfg.f1Ideal}% on ${tfCfg.label}).`,
`⏱️ Timeframe: ${tfCfg.label} — Expected hold: ${tfCfg.hold}. ${tfCfg.sessionNote}.`,
`📐 Entry: ${fmt(price)} | SL: ${atr ? fmt(price - atr * tfCfg.atrMult) : 'set ' + tfCfg.atrMult + '×ATR below entry'} | Target R:R ≥ 1:2`,
ma200 && price > ma200 ? `🌐 Macro bullish: Price above MA200 (${fmt(ma200)}) — trend aligned across all timeframes.` : '',
adxS && adxS.pass === true ? `💪 ADX ${adxV?.toFixed(1)} ${adxS.strength} — ${adxS.declining ? '⚠️ ADX declining, watch momentum' : 'trend strength confirmed'}.` : '',
dmiS && dmiS.pass === true ? `📊 DMI: ${dmiS.label}` : (dmiS && dmiS.pass === false ? `⚠️ DMI Warning: ${dmiS.label}` : ''),
strongSignals >= 3 ? `🔥 High-confluence setup: ${strongSignals} strong signals aligned — higher conviction entry.` : '',
`📦 Position size: ${posSize}. SL set immediately after entry. Never move SL wider.`,
sessNow.cls === 'sess-prime' ? `🎯 Currently in Prime Window — optimal entry timing.` : '',
].filter(Boolean).join('\n');
adv.textContent = lines;
adv.className = 'advice-box green';
} else if (decision === 'WATCH') {
const watchReason = pAboveMA20 > tfCfg.f1Warn ? `Price ${pAboveMA20.toFixed(1)}% extended above MA20` : `Score ${adjScore.toFixed(0)}/100 below threshold`;
adv.textContent = `⚠️ Partial setup (Score: ${adjScore.toFixed(0)}/100). ${watchReason}. Wait for full MA alignment + momentum confirmation. Ideal entry: pullback to MA5/MA20 with KDJ crossover and expanding volume.`;
adv.className = 'advice-box yellow';
} else {
const missing = [
!f1_pass && `Price < MA5`,
!f2_pass && `MA5 < MA20`,
!f3_pass && `MA20 < MA50`,
kdj?.pass === false && `KDJ Bearish (K${k?.toFixed(0)}/D${d?.toFixed(0)})`,
macd?.pass === false && `MACD Bearish`,
adxS?.pass === false && `ADX Weak (${adxV?.toFixed(1)})`,
].filter(Boolean);
adv.textContent = `🔴 Skip — ${missing.length} critical filter${missing.length > 1 ? 's' : ''} failed: ${missing.join(', ')}. Do not force entry against the filter stack. Wait for all conditions to align.`;
adv.className = 'advice-box red';
}
updateDial('ma-dial-arc', 'ma-dial-score', adjScore);
drawPie('ma-pie', 'ma-pie-legend', [
{ label: 'MA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0) + (f4_ma200 ? 1 : 0), color: 'var(--accent)' },
{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--green)' },
{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
{ label: 'Volume', value: volS ? (volS.pass === true ? 1 : volS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--orange)' },
{ label: 'ADX', value: adxS ? (adxS.pass === true ? 1 : adxS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent2)' },
{ label: 'Supertrend', value: stS ? (stS.pass === true ? 1 : 0) : 0, color: 'var(--green2)' },
{ label: 'RSI', value: rsiS ? (rsiS.pass === true ? 1 : rsiS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--red)' },
].filter(s => s.value > 0));
const passArr = [f1_pass, f2_pass, f3_pass,
kdj?.pass === true, macd?.pass === true,
volS?.pass === true, adxS?.pass === true,
rsiS?.pass === true,
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
? buildCheck(`F6 — MACD ${macd.zone}`, macd.pass === true ? true : macd.pass === false ? false : null, `DIF:${dif} DEA:${dea}${hist != null ? ` H:${hist}` : ''}`)
: buildCheck('F6 — MACD', null, 'Not provided'),
volS
? buildCheck(`F7 — Volume ${volS.zone}`, volS.pass === true ? true : volS.pass === false ? false : null, `${vol}× ${volS.zone}`)
: buildCheck('F7 — Volume', null, 'Not provided'),
adxS
? buildCheck(`ADX ${adxS.zone}${adxS.declining ? ' ↓' : ''}`, adxS.pass === true ? true : adxS.pass === false ? false : null, `ADX: ${adxV?.toFixed(1)}`)
: buildCheck('ADX Trend Strength', null, 'Not provided'),
dmiS
? buildCheck(`DMI ${dmiS.zone}`, dmiS.pass === true ? true : dmiS.pass === false ? false : null, dmiS.label)
: buildCheck('DMI (PDI/MDI)', null, 'Optional — enter PDI, MDI, ADXR'),
stS
? buildCheck(`Supertrend ${stS.zone}`, stS.pass, `Price:${fmt(price)} ST:${fmt(stV)}`)
: buildCheck('Supertrend', null, 'Not provided'),
rsiS
? buildCheck(`RSI ${rsiS.zone}`, rsiS.pass === true ? true : rsiS.pass === false ? false : null, `RSI: ${num('ma-rsi')?.toFixed(1)}`)
: buildCheck('RSI14', null, 'Not provided'),
].join('');
updateMeter('ma-signal-meter', passArr.length, 8);
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
buildTradePlan('ma-price-block', 'ma-tradeplan-card', price, atr, accountSz, riskPct);
}
function resetMA() {
['ma-price', 'ma-ma5', 'ma-ma20', 'ma-ma50', 'ma-ma200',
'ma-k', 'ma-d', 'ma-j', 'ma-dif', 'ma-dea', 'ma-hist',
'ma-vol', 'ma-rsi', 'ma-atr', 'ma-adx', 'ma-pdi', 'ma-mdi', 'ma-adxr', 'ma-st', 'ma-bbu', 'ma-bbl',
'ma-risk-pct', 'ma-account',
].forEach(id => { const el = $(id); if (el) el.value = ''; });
$('ma-result').style.display = 'none';
}
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
const pdiV = num('ema-pdi');
const mdiV = num('ema-mdi');
const adxrV = num('ema-adxr');
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
const pAboveE8 = pct(price, e8);
const pAboveE21 = pct(price, e21);
const pAboveE55 = pct(price, e55);
const pAboveE200 = e200 ? pct(price, e200) : null;
const e8AboveE21 = pct(e8, e21);
const e21AboveE55 = pct(e21, e55);
const e55AbE200 = e200 ? pct(e55, e200) : null;
const f1_pass = price > e8;
const f2_pass = e8 > e21;
const f3_pass = e21 > e55;
const f4_e200 = e200 ? price > e200 : null;
const fullStack = f1_pass && f2_pass && f3_pass;
const kdj = scoreKDJ(k, d, j);
const macd = scoreMACDZone(dif, dea);
const volS = scoreVolume(vol);
const adxS = scoreADX(adxV);
const dmiS = scoreDMI(pdiV, mdiV, adxV, adxrV);
const stS = scoreSupertrend(price, stV);
const ichiS = ichiP ? scoreIchimoku(ichiP) : null;
const vwapS = scoreVWAP(price, vwapV);
const rsiS = scoreRSI(num('ema-rsi'));
const eng = scoreEngine();
eng.add(f1_pass, 18);
eng.add(f2_pass, 18);
eng.add(f3_pass, 16);
eng.add(f4_e200, 6);
eng.add(kdj ? kdj.pass : null, 14);
eng.add(macd ? macd.pass : null, 12);
eng.add(volS ? volS.pass : null, 8);
eng.add(adxS ? adxS.pass : null, 16);
eng.add(dmiS ? dmiS.pass : null, 12);
eng.add(ichiS ? ichiS.pass : null, 6);
eng.add(vwapS ? vwapS.pass : null, 4);
eng.add(stS ? stS.pass : null, 4);
eng.add(rsiS ? rsiS.pass : null, 10);
const stretchPct = Math.abs(pAboveE8 || 0);
const tfCfg = getTFConfig('ema');
let penalty = 0;
const eHard = tfCfg.f1Warn * 1.6, eMed = tfCfg.f1Warn * 1.2, eSoft = tfCfg.f1Warn;
if (stretchPct > eHard) penalty = -30;
else if (stretchPct > eMed) penalty = -20;
else if (stretchPct > eSoft) penalty = -10;
const adjScore = Math.min(100, Math.max(0, eng.result() + penalty));
const grade = getGrade(e21AboveE55 || 0);
const momentumOk = (!kdj || kdj.pass !== false)
&& (!macd || macd.pass !== false)
&& (!adxS || adxS.pass !== false)
&& (!dmiS || dmiS.pass !== false)
&& (!kdj || !(j != null && j > 85));
let decision, riskLevel, posSize;
if (!f1_pass || !f2_pass || !f3_pass || !momentumOk) {
decision = 'SKIP'; riskLevel = 'High Risk'; posSize = '0%';
} else if (adjScore >= 75) {
decision = 'PROCEED'; riskLevel = 'Low Risk'; posSize = stretchPct > 5 ? '50%' : '100%';
} else if (adjScore >= 65) {
decision = 'PROCEED'; riskLevel = 'Medium Risk'; posSize = '50%';
} else {
decision = 'WATCH'; riskLevel = 'Medium Risk'; posSize = '25%';
}
if (grade.g === 'X' && posSize === '100%') posSize = '50%';
if (grade.g === 'X' && decision === 'PROCEED' && adjScore < 80) decision = 'WATCH';
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
const adv = $('ema-advice');
if (decision === 'PROCEED') {
const lines = [
stretchPct > tfCfg.f1Ok
? `⚠️ EMA stack confirmed but price is ${pAboveE8?.toFixed(1)}% above EMA8 — stretched for ${tfCfg.label} (ideal ≤${tfCfg.f1Ideal}%). Wait for pullback to EMA8 (${fmt(e8)}).`
: `✅ Full EMA bull stack. Price ${pAboveE8?.toFixed(1)}% above EMA8 (ideal ≤${tfCfg.f1Ideal}% on ${tfCfg.label}).`,
`⏱️ Timeframe: ${tfCfg.label} — Expected hold: ${tfCfg.hold}. ${tfCfg.sessionNote}.`,
e200 && price > e200 ? `🌐 Macro confirmed: Price above EMA200 — institutional trend alignment.` : '',
adxS?.pass === true ? `💪 ADX ${adxV?.toFixed(1)} — ${adxS.strength} trend. High-probability entry.` : '',
dmiS && dmiS.pass === true ? `📊 DMI: ${dmiS.label}` : (dmiS && dmiS.pass === false ? `⚠️ DMI Warning: ${dmiS.label}` : ''),
ichiS?.pass === true ? `☁️ Price above Ichimoku cloud — trend confirmed.` : '',
vwapV && price > vwapV ? `📊 Price above VWAP — intraday bulls in control.` : '',
`📦 Use ${posSize} position. Stop Loss = Price − (ATR × ${tfCfg.atrMult}). Trail after TP1.`,
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
updateDial('ema-dial-arc', 'ema-dial-score', adjScore);
drawPie('ema-pie', 'ema-pie-legend', [
{ label: 'EMA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0) + (f4_e200 ? 1 : 0), color: 'var(--accent)' },
{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--green)' },
{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
{ label: 'Volume', value: volS ? (volS.pass === true ? 1 : volS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--orange)' },
{ label: 'ADX', value: adxS ? (adxS.pass === true ? 1 : adxS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent2)' },
{ label: 'Ichimoku', value: ichiS ? (ichiS.pass === true ? 1 : ichiS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--red)' },
{ label: 'VWAP', value: vwapS ? (vwapS.pass === true ? 1 : 0) : 0, color: 'var(--green2)' },
{ label: 'RSI', value: rsiS ? (rsiS.pass === true ? 1 : rsiS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent)' },
].filter(s => s.value > 0));
const passArr = [f1_pass, f2_pass, f3_pass,
kdj?.pass === true, macd?.pass === true,
volS?.pass === true, adxS?.pass === true,
rsiS?.pass === true,
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
dmiS
? buildCheck(`DMI ${dmiS.zone}`, dmiS.pass === true ? true : dmiS.pass === false ? false : null, dmiS.label)
: buildCheck('DMI (PDI/MDI)', null, 'Optional — enter PDI, MDI, ADXR'),
ichiS
? buildCheck(`Ichimoku — ${ichiS.zone}`, ichiS.pass === true ? true : ichiS.pass === false ? false : null, ichiS.zone)
: buildCheck('Ichimoku Cloud', null, 'Not provided'),
vwapS
? buildCheck(`VWAP — ${vwapS.zone}`, vwapS.pass === true ? true : vwapS.pass === false ? false : null, `VWAP:${fmt(vwapV)}`)
: buildCheck('VWAP', null, 'Not provided'),
rsiS
? buildCheck(`RSI ${rsiS.zone}`, rsiS.pass === true ? true : rsiS.pass === false ? false : null, `RSI: ${num('ema-rsi')?.toFixed(1)}`)
: buildCheck('RSI14', null, 'Not provided'),
].join('');
updateMeter('ema-signal-meter', passArr.length, 8);
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
buildTradePlan('ema-price-block', 'ema-tradeplan-card', price, atr, accountSz, riskPct);
}
function resetEMA() {
['ema-price', 'ema-ema8', 'ema-ema21', 'ema-ema55', 'ema-ema200',
'ema-k', 'ema-d', 'ema-j', 'ema-dif', 'ema-dea', 'ema-hist',
'ema-vol', 'ema-rsi', 'ema-atr', 'ema-adx', 'ema-pdi', 'ema-mdi', 'ema-adxr', 'ema-st', 'ema-vwap',
'ema-open', 'ema-prev', 'ema-high', 'ema-low', 'ema-52h', 'ema-52l',
'ema-bidask', 'ema-beta', 'ema-risk-pct', 'ema-account',
].forEach(id => { const el = $(id); if (el) el.value = ''; });
const ichiEl = $('ema-ichi');
if (ichiEl) ichiEl.value = '';
$('ema-result').style.display = 'none';
}
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
const pdiV = num('gold-pdi');
const mdiV = num('gold-mdi');
const adxrV = num('gold-adxr');
const k = num('gold-k');
const d = num('gold-d');
const j = num('gold-j');
const dif = num('gold-dif');
const dea = num('gold-dea');
const vol = num('gold-vol');
const atr = num('gold-atr');
const dxyDir = sel('gold-dxy-dir');
const fibH = num('gold-fibh');
const fibL = num('gold-fibl');
const fibDir = sel('gold-fib-dir');
const riskPct = num('gold-risk-pct');
const accountSz = num('gold-account');
const pAboveE21 = pct(price, e21);
const pAboveE55 = pct(price, e55);
const pAboveE200 = pct(price, e200);
const e21AboveE55 = pct(e21, e55);
const e55AboveE200 = pct(e55, e200);
const f1_proximity = price > e21;
const f1_stretch = Math.abs(pAboveE21 || 0);
const f2_pass = e21 > e55;
const f3_pass = e55 > e200;
const macroPass = price > e200;
const kdj = scoreKDJ(k, d, j);
const rsiS = scoreRSI(rsi, 'gold');
const adxS = scoreADX(adxV);
const dmiS = scoreDMI(pdiV, mdiV, adxV, adxrV);
const macd = scoreMACDZone(dif, dea);
const volS = scoreVolume(vol);
let dxyPass = null, dxyLabel = '—';
if (dxyDir) {
if (dxyDir === 'falling') { dxyPass = true; dxyLabel = '📉 Falling (Bullish Gold)'; }
if (dxyDir === 'flat') { dxyPass = 'warn'; dxyLabel = '➡️ Flat (Neutral)'; }
if (dxyDir === 'rising') { dxyPass = false; dxyLabel = '📈 Rising (Bearish Gold)'; }
}
const sess = getSession();
const sessPass = sess.score >= 70 ? true : sess.score >= 40 ? 'warn' : false;
const eng = scoreEngine();
eng.add(f1_proximity, 15);
eng.add(f2_pass, 15);
eng.add(f3_pass, 15);
eng.add(kdj ? kdj.pass : null, 12);
eng.add(rsiS ? rsiS.pass : null, 12);
eng.add(adxS ? adxS.pass : null, 12);
eng.add(macd ? macd.pass : null, 10);
eng.add(volS ? volS.pass : null, 6);
eng.add(dxyPass, 5);
eng.add(sessPass, 3);
let penalty = 0;
if (f1_stretch > 6) penalty = -18;
else if (f1_stretch > 4) penalty = -10;
else if (f1_stretch > 2) penalty = -4;
if (!macroPass) penalty -= 10;
const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));
const grade = getGrade(e21AboveE55 || 0);
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
updateGoldSessionBanner();
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
updateDial('gold-dial-arc', 'gold-dial-score', adjScore, true);
drawPie('gold-pie', 'gold-pie-legend', [
{ label: 'EMA Stack', value: (f1_proximity ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0), color: '#FFD700' },
{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--green)' },
{ label: 'RSI', value: rsiS ? (rsiS.pass === true ? 1 : rsiS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent)' },
{ label: 'ADX', value: adxS ? (adxS.pass === true ? 1 : adxS.pass === 'warn' ? .5 : 0) : 0, color: '#e6b800' },
{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
{ label: 'DXY', value: dxyPass === true ? 1 : dxyPass === 'warn' ? .5 : 0, color: 'var(--orange)' },
{ label: 'Session', value: sessPass === true ? 1 : sessPass === 'warn' ? .5 : 0, color: 'var(--green2)' },
].filter(s => s.value > 0));
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
const fibCard = $('gold-fib-card');
const fibH2 = num('gold-fibh2');
const fibL2 = num('gold-fibl2');
const fib = calcFib(fibH, fibL);
const fib2 = calcFib(fibH2, fibL2);
if (fib) {
fibCard.style.display = '';
const colors = {
accent: 'var(--accent)', green: 'var(--green)', yellow: 'var(--yellow)',
gold: '#FFD700', orange: 'var(--orange)', red: 'var(--red)', dim: 'var(--dim)'
};
const emaStack = [e21, e55, e200].filter(Boolean);
const fibAcc = fibAccuracyScore(price, fib, emaStack);
const accStrip = $('gold-fib-accuracy-strip');
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
const confEl = $('gold-fib-confluence');
if (fib2 && confEl) {
const zones = fibConfluence(fib, fib2, Math.max(fib.range, fib2.range));
if (zones.length > 0) {
confEl.style.display = '';
confEl.innerHTML = `<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;font-weight:700">φ Confluence Zones — Highest Accuracy</div>
${zones.slice(0, 4).map(z => `<div class="fib-confluence-row">
<span class="fib-conf-badge" style="color:${z.strength === 'STRONG' ? '#FFD700' : 'var(--accent)'}">${z.strength}</span>
<span class="fib-conf-price">$${z.price.toFixed(2)}</span>
<span class="fib-conf-desc">${z.level1}% ∩ ${z.level2}% — ${z.diffPct.toFixed(2)}% apart</span>
<span class="fib-conf-action">${parseFloat(z.level1) <= 61.8 ? '🎯 Entry' : '📐 TP'}</span>
</div>`).join('')}`;
} else confEl.style.display = 'none';
} else if (confEl) confEl.style.display = 'none';
const fibLevels = [
{ key: 'ext_261', label: '261.8% Extension', tag: 'Far TP', tagCls: 'accent', isExt: true },
{ key: 'ext_200', label: '200% Extension', tag: 'TP3', tagCls: 'accent', isExt: true },
{ key: 'ext_161', label: '161.8% ★ Golden', tag: 'TP2', tagCls: 'gold', isExt: true },
{ key: 'ext_141', label: '141.4% Extension', tag: 'TP1b', tagCls: 'accent', isExt: true },
{ key: 'ext_127', label: '127.2% Extension', tag: 'TP1', tagCls: 'accent', isExt: true },
{ key: '0', label: '0% Swing High', tag: 'Resistance', tagCls: 'green' },
{ key: '23.6', label: '23.6% Retrace', tag: 'Minor', tagCls: 'yellow' },
{ key: '38.2', label: '38.2% ★ Golden', tag: 'Key Entry', tagCls: 'gold' },
{ key: '50', label: '50% Midpoint', tag: 'Key', tagCls: 'yellow' },
{ key: '61.8', label: '61.8% ★ Golden', tag: 'Best Entry', tagCls: 'gold' },
{ key: '78.6', label: '78.6% Deep', tag: 'Deep Entry', tagCls: 'orange' },
{ key: '88.6', label: '88.6% Harmonic', tag: 'Last', tagCls: 'red' },
{ key: '100', label: '100% Swing Low', tag: 'Support', tagCls: 'red' },
];
const nearest = nearestFibLevel(price, fib);
const pctPosInRange = ((price - fib['100']) / fib.range) * 100;
$('gold-fib-grid').innerHTML = fibLevels.map(lv => {
const lvPrice = fib[lv.key];
if (!lvPrice) return '';
const distPct = Math.abs(price - lvPrice) / fib.range * 100;
const isCurrent = nearest.level === lv.key && distPct < 3;
const isAbove = price > lvPrice;
const c = colors[lv.tagCls] || 'var(--dim)';
const isKey = ['38.2', '61.8', 'ext_161'].includes(lv.key);
const nowBadge = isCurrent ? ` <span style="background:rgba(255,215,0,.2);color:#FFD700;font-size:8px;padding:.1rem .35rem;border-radius:3px;border:1px solid rgba(255,215,0,.4);font-weight:700">◀ PRICE</span>` : '';
const distNote = distPct < 1.5 && !isCurrent ? ` <span style="color:var(--muted);font-size:9px">${distPct.toFixed(1)}% away</span>` : '';
return `<div class="fib-row${isCurrent ? ' current' : ''}${isKey ? ' fib-key-level' : ''}${lv.isExt ? ' fib-ext-row' : ''}">
<span class="fib-pct" style="color:${c}">${lv.isExt ? lv.label.split(' ')[0] : lv.key + '%'}</span>
<span class="fib-price" style="color:${isAbove ? 'var(--dim)' : 'var(--text)'}">$${lvPrice.toFixed(2)}</span>
<span class="fib-label">${lv.label}${nowBadge}${distNote}</span>
<span class="fib-tag" style="background:${c}18;color:${c};border:1px solid ${c}35">${lv.tag}</span>
</div>`;
}).join('');
const grid2Wrap = $('gold-fib-grid2-wrap');
if (fib2 && grid2Wrap) {
grid2Wrap.style.display = '';
$('gold-fib-grid2').innerHTML = ['ext_161', '0', '38.2', '50', '61.8', '78.6', '100'].map(k => {
const lp = fib2[k]; if (!lp) return '';
return `<div class="fib-row fib-sec"><span class="fib-pct" style="color:var(--dim)">${k.startsWith('ext') ? '161.8%' : k + '%'}</span><span class="fib-price" style="color:${price > lp ? 'var(--muted)' : 'var(--dim)'}">$${lp.toFixed(2)}</span><span class="fib-label" style="color:var(--muted)">Secondary</span></div>`;
}).join('');
} else if (grid2Wrap) grid2Wrap.style.display = 'none';
updateRange('gold-fib-fill', 'gold-fib-marker', 'gold-fib-pos-label', Math.max(0, Math.min(100, pctPosInRange)), 100);
$('gold-fib-low-label').textContent = `Low $${fibL.toFixed(2)}`;
$('gold-fib-high-label').textContent = `High $${fibH.toFixed(2)}`;
const precEl = $('gold-fib-precision');
if (precEl) {
precEl.style.display = '';
const retraceLevels = [
{ key: '23.6', p: 3 }, { key: '38.2', p: 5 }, { key: '50', p: 4 }, { key: '61.8', p: 5 }, { key: '78.6', p: 3 }
];
let bestEntry = null;
for (const lv of retraceLevels) {
const lvP = fib[lv.key];
if (lvP && lvP <= price) {
const dist = price - lvP;
if (!bestEntry || dist < bestEntry.dist) bestEntry = { ...lv, price: lvP, dist };
}
}
const idealEntry = bestEntry ? bestEntry.price : price;
const idealNote = bestEntry ? `${bestEntry.key}% Fib ($${idealEntry.toFixed(2)})` : 'current price';
precEl.innerHTML = `<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem;font-weight:700">📐 Fibonacci Precision Entry &amp; Take-Profit Levels</div>
<div class="fib-precision-grid">
<div class="fib-prec-row entry"><span class="fib-prec-label">Ideal Entry Zone</span><span class="fib-prec-price" style="color:var(--accent)">$${idealEntry.toFixed(2)}</span><span class="fib-prec-note">Pullback to ${idealNote}</span></div>
<div class="fib-prec-row tp"><span class="fib-prec-label">TP1 — 127.2% Ext</span><span class="fib-prec-price" style="color:var(--green)">$${fib.ext_127.toFixed(2)}</span><span class="fib-prec-note">First target — take 40%</span></div>
<div class="fib-prec-row tp"><span class="fib-prec-label">TP2 — 161.8% ★ Golden</span><span class="fib-prec-price" style="color:#FFD700">$${fib.ext_161.toFixed(2)}</span><span class="fib-prec-note">Golden extension — take 40%</span></div>
<div class="fib-prec-row tp"><span class="fib-prec-label">TP3 — 200%</span><span class="fib-prec-price" style="color:#88ffcc">$${fib.ext_200.toFixed(2)}</span><span class="fib-prec-note">Hold 20% — trail stop</span></div>
<div class="fib-prec-row tp"><span class="fib-prec-label">TP4 — 261.8%</span><span class="fib-prec-price" style="color:#aaffee">$${fib.ext_261.toFixed(2)}</span><span class="fib-prec-note">Ultimate — strong bull only</span></div>
</div>`;
}
const fibAdvEl = $('gold-fib-advice');
const nearPct = parseFloat(nearest.level);
const inExtZone = price > fib['0'];
const accNote = fibAcc.score >= 80
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
fibAdvice = `${accNote} ${nearPct === 61.8 ? 'GOLDEN RATIO' : 'Mid'} pullback at ${nearPct}% — best RR entry zone. Require RSI>50 + KDJ cross + volume spike.`;
} else if (nearPct <= 78.6) {
fibAdvice = `${accNote} Deep retrace. Require strong reversal candle + volume>1.5× before entry. Reduce size 50%.`;
} else if (nearPct <= 88.6) {
fibAdvice = `⚠️ Very deep 88.6% harmonic level — last valid support. High risk. Tight stop only.`;
} else {
fibAdvice = `🔴 At/below swing low. Do not enter long until new higher low forms and MAs rebuild.`;
}
if (fibDir === 'extend') fibAdvice = `📐 Extensions: 127.2%=$${fib.ext_127.toFixed(2)} | 161.8%★=$${fib.ext_161.toFixed(2)} | 200%=$${fib.ext_200.toFixed(2)} | 261.8%=$${fib.ext_261.toFixed(2)}.`;
fibAdvEl.textContent = fibAdvice;
} else {
fibCard.style.display = 'none';
}
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
updateGoldSessionBanner();
function switchGuide(id) {
document.querySelectorAll('.guide-tab-btn').forEach(b => b.classList.remove('active'));
document.querySelectorAll('.guide-section').forEach(s => s.classList.remove('active'));
const section = $(id);
if (section) section.classList.add('active');
document.querySelectorAll('.guide-tab-btn').forEach(b => {
if (b.getAttribute('onclick') === `switchGuide('${id}')`) b.classList.add('active');
});
if (id === 'g-schedule') gdsPopulateTimes();
}

function gdsPopulateTimes() {
const dst = isUSDST();
const open   = dst ? '9:30 PM'  : '10:30 PM';
const open5  = dst ? '9:35 PM'  : '10:35 PM';
const pt1s   = dst ? '9:35–9:50 PM'   : '10:35–10:50 PM';
const pt1e   = dst ? '10:00–10:30 PM' : '11:00–11:30 PM';
const pt1l   = dst ? '10:30–11:00 PM' : '11:30 PM–12:00 AM';
const primeE = dst ? '11:00 PM' : '12:00 AM';
const lullS  = dst ? '11:00 PM' : '12:00 AM';
const lullE  = dst ? '2:30 AM'  : '3:30 AM';
const powS   = dst ? '2:30 AM'  : '3:30 AM';
const powE   = dst ? '3:50 AM'  : '4:50 AM';
const closeT = dst ? '4:00 AM'  : '5:00 AM';
const tz     = dst ? 'EDT (Mar–Nov)' : 'EST (Nov–Mar)';
const tzCls  = dst ? 'gds-badge-edt' : 'gds-badge-est';

// Banner
const banner = $('gds-dst-banner');
if (banner) banner.className = `gds-dst-banner ${dst ? 'gds-banner-edt' : 'gds-banner-est'}`;
const ttl = $('gds-dst-title');
if (ttl) ttl.textContent = dst
	? '🌞 US Daylight Saving (EDT) — Market opens 9:30 PM MYT'
	: '❄️ US Standard Time (EST) — Market opens 10:30 PM MYT';
const tnote = $('gds-dst-note');
if (tnote) tnote.textContent = dst
	? 'Current period: March–November. All times below are MYT (UTC+8).'
	: 'Current period: November–March. All times 1 hour later than EDT. All times below are MYT (UTC+8).';
const tbadge = $('gds-dst-badge');
if (tbadge) { tbadge.textContent = tz; tbadge.className = `gds-dst-badge ${tzCls}`; }

// Inline badge at market open block
const inl = $('gds-open-inline');
if (inl) inl.innerHTML = `<span class="${tzCls}" style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;margin-left:.4rem">${tz}</span>`;

// Update all time labels
const setAll = (cls, text) =>
	document.querySelectorAll(`.${cls}`).forEach(el => { el.textContent = text; });

setAll('gds-open-time',       open);
setAll('gds-open-time-label', open);
setAll('gds-prime-end',       primeE);
setAll('gds-exit-time',       powE);
setAll('gds-close-time',      closeT);

// Prime sub-table times
const subTimes = document.querySelectorAll('.gds-sub-time');
if (subTimes[0]) subTimes[0].textContent = pt1s;
if (subTimes[1]) subTimes[1].textContent = pt1e;
if (subTimes[2]) subTimes[2].textContent = pt1l;

// Range labels
const primeRng = document.querySelector('.gds-prime-range');
if (primeRng) primeRng.innerHTML = `${open5}<br/>–<br/>${primeE}`;
const lullRng = document.querySelector('.gds-lull-range');
if (lullRng) lullRng.innerHTML = `${lullS}<br/>–<br/>${lullE}`;
const powRng = document.querySelector('.gds-power-range');
if (powRng) powRng.innerHTML = `${powS}<br/>–<br/>${powE}`;
}


const TOOLTIPS = {
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
'ma-pdi': {
title: 'PDI — Positive Directional Indicator (+DI)',
body: 'Part of the DMI system. PDI measures upward price pressure. PDI > MDI = bulls in control. PDI just crossing above MDI with ADX > 25 = highest conviction buy signal. This confirms your MA bullish stack is genuine momentum, not a whipsaw.',
where: '📍 Moomoo: Add DMI(14,6) indicator → read PDI value (orange line)',
ranges: [['PDI > MDI, ADX > 25', 'green', '✅ Strong uptrend — full entry'], ['PDI > MDI, ADX < 25', 'yellow', '⚠️ Bullish but weak trend — reduce size'], ['PDI ≈ MDI (diff < 3pts)', 'accent', '⚡ Crossover zone — watch for direction'], ['PDI < MDI', 'red', '🔴 Bears in control — skip long']]
},
'ma-mdi': {
title: 'MDI — Negative Directional Indicator (−DI)',
body: 'Part of the DMI system. MDI measures downward price pressure. When MDI > PDI and ADX > 25, avoid all long entries regardless of MA stack. A high MDI warns that institutions are selling.',
where: '📍 Moomoo: Add DMI(14,6) indicator → read MDI value (pink line)',
},
'ma-adxr': {
title: 'ADXR — Average Directional Index Rating',
body: 'ADXR is a smoothed version of ADX (average of ADX and ADX 14 periods ago). When ADX > ADXR = trend is strengthening — best entry timing. When ADX < ADXR = trend is fading — tighten stops. Optional but improves conviction significantly.',
where: '📍 Moomoo: Add DMI(14,6) indicator → read ADXR value (blue line)',
ranges: [['ADX > ADXR', 'green', 'Trend strengthening — enter/hold'], ['ADX < ADXR', 'yellow', 'Trend weakening — tighten stop or reduce']]
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
'ema-pdi': { title: 'PDI (+DI)', body: 'Same as MA tab PDI. PDI > MDI = bullish direction. Read from DMI(14,6) on Moomoo chart.', where: 'Moomoo → Chart → DMI → PDI' },
'ema-mdi': { title: 'MDI (−DI)', body: 'MDI > PDI = bearish direction. If MDI > PDI and ADX > 25, skip long entry entirely.', where: 'Moomoo → Chart → DMI → MDI' },
'ema-adxr': { title: 'ADXR', body: 'Smoothed ADX. ADX rising above ADXR = trend strengthening.', where: 'Moomoo → Chart → DMI → ADXR' },
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
if (left + tw > vw - pad) left = rect.right - tw;
if (left < pad) left = pad;
if (top + th > vh - pad) top = rect.top - th - pad;
if (top < pad) top = pad;
tip.style.left = left + 'px';
tip.style.top = top + 'px';
tip.style.width = Math.min(tw, vw - pad * 2) + 'px';
}
document.addEventListener('DOMContentLoaded', attachAll);
if (document.readyState !== 'loading') attachAll();
function attachAll() {
Object.keys(TOOLTIPS).forEach(id => {
const el = $(id);
if (!el) return;
const data = TOOLTIPS[id];
el.addEventListener('mouseenter', () => showTip(el, data));
el.addEventListener('mouseleave', () => hideTip(el));
el.addEventListener('focus', () => showTip(el, data));
el.addEventListener('blur', () => hideTip(el));
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
document.addEventListener('click', e => { if (!tip.contains(e.target) && !e.target.classList.contains('tip-indicator')) hideTip(null, true); });
window.addEventListener('scroll', () => { if (document.activeElement && TOOLTIPS[document.activeElement.id]) positionTip(document.activeElement); }, { passive: true });
window.addEventListener('resize', () => { if (tip.style.display !== 'none') hideTip(null); });
})();
function getBursaSession() {
const now = new Date();
const myt = new Date(now.getTime() + 8 * 3600000);
const h = myt.getUTCHours();
const m = myt.getUTCMinutes();
const hm = h * 60 + m;
const dow = myt.getUTCDay();
const isWeekend = dow === 0 || dow === 6;
if (isWeekend) return { label: '🔴 Closed (Weekend)', cls: 'avoid', score: 0, quality: 'Weekend — Closed', emoji: '🔴', open: false };
if (hm >= 510 && hm < 540) return { label: '🟡 Pre-Open', cls: 'slow', score: 30, quality: 'Pre-Open Auction 08:30–09:00', emoji: '🟡', open: false };
if (hm >= 540 && hm < 750) {
const prime = hm < 600;
return prime
? { label: '🎯 Morning Prime', cls: 'prime', score: 100, quality: 'Prime Window 09:00–10:00 MYT', emoji: '🎯', open: true }
: { label: '🟢 Morning', cls: 'good', score: 80, quality: 'Morning Session 09:00–12:30 MYT', emoji: '✅', open: true };
}
if (hm >= 750 && hm < 870) return { label: '🟡 Lunch Break', cls: 'slow', score: 10, quality: 'Lunch Break 12:30–14:30 — No Trading', emoji: '🟡', open: false };
if (hm >= 870 && hm < 1020) {
const prime = hm >= 930 && hm < 990;
return prime
? { label: '🟢 Afternoon Prime', cls: 'good', score: 85, quality: 'Afternoon Prime 15:30–16:30 MYT', emoji: '✅', open: true }
: { label: '🟢 Afternoon', cls: 'good', score: 72, quality: 'Afternoon Session 14:30–17:00 MYT', emoji: '✅', open: true };
}
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
function bursaCalc() {
const price = num('bu-price');
const ma5 = num('bu-ma5');
const ma20 = num('bu-ma20');
if (!price || !ma5 || !ma20) { $('bursa-result').style.display = 'none'; return; }
$('bursa-result').style.display = '';
updateBursaSessionBanner();
const ma50 = num('bu-ma50');
const ma200 = num('bu-ma200');
const atr = num('bu-atr');
const nav = num('bu-nav');
const rsi = num('bu-rsi');
const adxV = num('bu-adx');
const pdiV = num('bu-pdi');
const mdiV = num('bu-mdi');
const adxrV = num('bu-adxr');
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
const pAboveMA5 = pct(price, ma5);
const pAboveMA20 = pct(price, ma20);
const pAboveMA50 = ma50 ? pct(price, ma50) : null;
const pAboveMA200 = ma200 ? pct(price, ma200) : null;
const ma5AboveMA20 = pct(ma5, ma20);
const ma20AbMA50 = ma50 ? pct(ma20, ma50) : null;
const calcPremium = nav ? ((price - nav) / nav * 100) : null;
const usePremium = calcPremium ?? premium;
const dayChg = prev ? ((price - prev) / prev * 100) : null;
const gapFromOpen = open ? ((price - open) / open * 100) : null;
const from52h = w52h ? ((price - w52h) / w52h * 100) : null;
const from52l = w52l ? ((price - w52l) / w52l * 100) : null;
const fromAllH = allh ? ((price - allh) / allh * 100) : null;
const fromAllL = alll ? ((price - alll) / alll * 100) : null;
const sess = getBursaSession();
const sessPass = sess.score >= 70 ? true : sess.score >= 30 ? 'warn' : false;
const f1_pass = price > ma5;
const f2_pass = ma5 > ma20;
const f3_pass = ma50 ? ma20 > ma50 : null;
const f4_mac = ma200 ? price > ma200 : null;
let navPass = null;
if (usePremium != null) {
if (usePremium <= 1.0) navPass = true;
else if (usePremium <= 2.0) navPass = true;
else if (usePremium <= 3.0) navPass = 'warn';
else navPass = false;
}
let bidaskPass = null;
if (bidask != null) {
if (bidask >= 0) bidaskPass = true;
else if (bidask >= -5) bidaskPass = 'warn';
else bidaskPass = false;
}
const volS = scoreVolume(volRatio);
const kdj = scoreKDJ(k, d, j);
const macd = scoreMACDZone(dif, dea);
const adxS = scoreADX(adxV);
const rsiS = scoreRSI(rsi, 'gold');
const eng = scoreEngine();
eng.add(f1_pass, 16);
eng.add(f2_pass, 14);
eng.add(f3_pass, 10);
eng.add(f4_mac, 6);
eng.add(navPass, 18);
eng.add(bidaskPass, 10);
eng.add(volS ? volS.pass : null, 8);
eng.add(kdj ? kdj.pass : null, 10);
eng.add(macd ? macd.pass : null, 8);
eng.add(sessPass, 5);
eng.add(rsiS ? rsiS.pass : null, 5);
let penalty = 0;
const stretchAbs = Math.abs(pAboveMA20 || 0);
if (stretchAbs > 10) penalty = -18;
else if (stretchAbs > 6) penalty = -10;
else if (stretchAbs > 3) penalty = -5;
if (usePremium != null && usePremium > 3) penalty -= 10;
if (!sess.open && sess.score < 30) penalty -= 8;
const adjScore = Math.max(0, Math.min(100, eng.result() + penalty));
const grade = getGrade(ma20AbMA50 ?? 0);
const maOk = f1_pass && f2_pass;
const etfOk = navPass !== false;
const orderOk = bidaskPass !== false;
const momentumOk = (!kdj || kdj.pass !== false)
&& (!macd || macd.pass !== false);
const sessionOk = sess.open;
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
const chip = $('bursa-sess-chip');
if (chip) { chip.textContent = `${sess.emoji} ${sess.label}`; chip.style.display = ''; }
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
drawPie('bursa-pie', 'bursa-pie-legend', [
{ label: 'MA Stack', value: (f1_pass ? 1 : 0) + (f2_pass ? 1 : 0) + (f3_pass ? 1 : 0) + (f4_mac ? 1 : 0), color: 'var(--bursa)' },
{ label: 'NAV', value: navPass === true ? 1 : navPass === 'warn' ? .5 : 0, color: '#FFD700' },
{ label: 'Bid/Ask', value: bidaskPass === true ? 1 : bidaskPass === 'warn' ? .5 : 0, color: 'var(--green)' },
{ label: 'Volume', value: volS ? (volS.pass === true ? 1 : volS.pass === 'warn' ? .5 : 0) : 0, color: 'var(--accent)' },
{ label: 'KDJ', value: kdj ? (kdj.pass === true ? 1 : kdj.pass === 'warn' ? .5 : 0) : 0, color: 'var(--yellow)' },
{ label: 'MACD', value: macd ? (macd.pass === true ? 1 : macd.pass === 'warn' ? .5 : 0) : 0, color: 'var(--orange)' },
{ label: 'Session', value: sessPass === true ? 1 : sessPass === 'warn' ? .5 : 0, color: 'var(--green2)' },
].filter(s => s.value > 0));
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
const premPct = Math.min(100, Math.max(0, ((usePremium ?? 0) + 3) / 8 * 100));
const premFill = $('bursa-prem-fill');
const premMark = $('bursa-prem-marker');
const premLabel = $('bursa-prem-label');
if (premFill) premFill.style.width = premPct + '%';
if (premMark) premMark.style.left = premPct + '%';
if (premLabel) premLabel.textContent = usePremium != null ? `${usePremium.toFixed(2)}% Premium` : '—';
const navAdvEl = $('bursa-nav-advice');
if (navAdvEl) {
if (usePremium <= 0) navAdvEl.textContent = `🎯 Trading BELOW NAV by ${Math.abs(usePremium).toFixed(2)}% — rare and excellent opportunity. Gold ETF at a discount to fair value.`;
else if (usePremium <= 1.5) navAdvEl.textContent = `✅ Premium ${usePremium.toFixed(2)}% — within acceptable range. ETF fairly priced vs underlying gold.`;
else if (usePremium <= 3.0) navAdvEl.textContent = `⚠️ Premium ${usePremium.toFixed(2)}% — paying above fair value. Consider using limit order closer to NAV (MYR ${nav.toFixed(3)}). Reduce position size by 50%.`;
else navAdvEl.textContent = `🔴 Premium ${usePremium.toFixed(2)}% — significantly overpriced vs NAV. Wait for premium to compress below 2% before entering. ETF demand has pushed price far above underlying gold value.`;
}
}
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
function detectCandlePattern(o, h, l, c) {
if (!o || !h || !l || !c) return null;
const body = Math.abs(c - o);
const range = h - l;
const upperWick = h - Math.max(o, c);
const lowerWick = Math.min(o, c) - l;
const bodyRatio = body / range;
const isGreen = c > o;
if (lowerWick >= body * 2 && upperWick <= body * 0.5 && range > 0) {
const strength = lowerWick / range;
return {
pattern: 'Hammer', strength: Math.round(strength * 100),
bullish: true, color: 'var(--green)',
note: `Lower wick ${(lowerWick / range * 100).toFixed(0)}% of range — sellers rejected. ${isGreen ? 'Green body confirms buyers.' : 'Wait for next green candle.'}`
};
}
if (isGreen && bodyRatio >= 0.6) {
return {
pattern: 'Bullish Engulfing', strength: Math.round(bodyRatio * 100),
bullish: true, color: 'var(--green)',
note: `Body is ${(bodyRatio * 100).toFixed(0)}% of range — strong buyer candle. High reversal conviction.`
};
}
if (bodyRatio < 0.1 && range > 0) {
return {
pattern: 'Doji / Indecision', strength: 50,
bullish: null, color: 'var(--yellow)',
note: 'Open ≈ Close — indecision. Needs confirmation from next candle direction.'
};
}
if (bodyRatio < 0.15 && lowerWick >= range * 0.6) {
return {
pattern: 'Dragonfly Doji', strength: 75,
bullish: true, color: 'var(--accent)',
note: 'Long lower wick with tiny body at high — strong bullish reversal signal.'
};
}
if (upperWick >= body * 2 && lowerWick <= body * 0.3 && range > 0) {
return {
pattern: 'Shooting Star ⚠️', strength: Math.round(upperWick / range * 100),
bullish: false, color: 'var(--red)',
note: 'Upper wick rejection — bearish. Not a good long entry candle.'
};
}
return {
pattern: isGreen ? 'Green Candle' : 'Red Candle', strength: Math.round(bodyRatio * 60),
bullish: isGreen ? true : false, color: isGreen ? 'var(--accent)' : 'var(--red)',
note: isGreen ? 'Bullish close — moderate reversal signal.' : 'Bearish — wait for next candle.'
};
}
function maRebuildPhase(price, ma5, ma20, ma50, ma200) {
const checks = [
{ label: 'Price > MA5', pass: price && ma5 ? price > ma5 : null, weight: 25 },
{ label: 'MA5 > MA20', pass: ma5 && ma20 ? ma5 > ma20 : null, weight: 25 },
{ label: 'MA20 > MA50', pass: ma20 && ma50 ? ma20 > ma50 : null, weight: 25 },
{ label: 'Price > MA200', pass: price && ma200 ? price > ma200 : null, weight: 25 },
];
const passed = checks.filter(c => c.pass === true).length;
const total = checks.filter(c => c.pass !== null).length;
const score = total > 0 ? (passed / total) * 100 : 0;
let phase;
if (passed === 0) phase = { label: 'Broken — Full Bear Stack', color: 'var(--red)', n: 0 };
else if (passed === 1) phase = { label: 'Phase 1 — Price crossed MA5', color: 'var(--orange)', n: 1 };
else if (passed === 2) phase = { label: 'Phase 2 — MA5 > MA20 Cross', color: 'var(--yellow)', n: 2 };
else if (passed === 3) phase = { label: 'Phase 3 — MA20 > MA50', color: 'var(--accent)', n: 3 };
else phase = { label: 'Phase 4 — Full Bull Stack ✅', color: 'var(--green)', n: 4 };
return { checks, passed, total, score, phase };
}
function swingCalc() {
const o = num('sw-open');
const h = num('sw-high');
const l = num('sw-low');
const c = num('sw-close');
if (!o || !h || !l || !c) { $('swing-result').style.display = 'none'; return; }
$('swing-result').style.display = '';
const prevClose = num('sw-prev-close');
const price = num('sw-price') || c;
const stPrev = num('sw-st-prev');
const stCurr = num('sw-st-curr');
const stDir = document.getElementById('sw-st-dir')?.value || '';
const maPrice = num('sw-ma-price') || price;
const ma5 = num('sw-ma5');
const ma20 = num('sw-ma20');
const ma50 = num('sw-ma50');
const ma200 = num('sw-ma200');
const res1 = num('sw-res1');
const res2 = num('sw-res2');
const res3 = num('sw-res3');
const kVal = num('sw-k');
const dVal = num('sw-d');
const jVal = num('sw-j');
const rsi = num('sw-rsi');
const dif = num('sw-dif');
const dea = num('sw-dea');
const vol = num('sw-vol');
const adxV = num('sw-adx');
const pdiV = num('sw-pdi');
const mdiV = num('sw-mdi');
const adxrV = num('sw-adxr');
const atr = num('sw-atr');
const account = num('sw-account');
const riskPct = num('sw-riskpct');
const candle = detectCandlePattern(o, h, l, c);
const s1_pass = candle ? (candle.bullish === true ? true : candle.bullish === null ? 'warn' : false) : null;
let s2_pass = null, stNote = 'Not provided';
if (stDir === 'flipped_bull') { s2_pass = true; stNote = '🟢 JUST FLIPPED BULLISH — strongest signal'; }
else if (stDir === 'bullish') { s2_pass = true; stNote = '✅ Dots below price — trend bullish'; }
else if (stDir === 'bearish') { s2_pass = false; stNote = '🔴 Dots still above — not yet'; }
else if (stDir === 'flipped_bear') { s2_pass = false; stNote = '⬇️ Flipped bearish — avoid long'; }
if (stPrev != null && stCurr != null && price != null) {
const prevAbove = stPrev > price;
const currBelow = stCurr < price;
if (prevAbove && currBelow && !stDir.includes('bear')) { s2_pass = true; stNote = '🟢 Supertrend confirmed flip: prev above → now below price'; }
}
let s3_pass = null, kdjNote = 'Not provided';
if (kVal != null && dVal != null) {
const kdj = scoreKDJ(kVal, dVal, jVal);
s3_pass = kdj.pass;
const jNote = jVal != null ? ` (J=${jVal.toFixed(1)})` : '';
kdjNote = `K${kVal.toFixed(1)} D${dVal.toFixed(1)}${jNote} — ${kdj.zone}`;
// Extra: oversold bounce = J < 20 turning up
if (jVal != null && jVal < 20 && kVal > dVal) { s3_pass = true; kdjNote += ' — OVERSOLD BOUNCE ★'; }
}
let s4_pass = null, rsiNote = 'Not provided';
if (rsi != null) {
if (rsi < 30) { s4_pass = true; rsiNote = `RSI ${rsi.toFixed(1)} — extreme oversold bounce zone`; }
else if (rsi < 40) { s4_pass = true; rsiNote = `RSI ${rsi.toFixed(1)} — oversold, bounce likely`; }
else if (rsi < 50) { s4_pass = 'warn'; rsiNote = `RSI ${rsi.toFixed(1)} — building momentum`; }
else if (rsi < 70) { s4_pass = true; rsiNote = `RSI ${rsi.toFixed(1)} — bullish momentum zone`; }
else { s4_pass = 'warn'; rsiNote = `RSI ${rsi.toFixed(1)} — overbought, caution`; }
}
let s5_pass = null, macdNote = 'Not provided';
if (dif != null && dea != null) {
const macd = scoreMACDZone(dif, dea);
s5_pass = macd.pass;
macdNote = `DIF:${dif} DEA:${dea} — ${macd.zone}`;
if (dif > dea && Math.abs(dif - dea) / Math.abs(dea || 1) < 0.2) {
macdNote += ' — Fresh crossover (high accuracy)';
s5_pass = true;
}
}
let s6_pass = null, volNote = 'Not provided';
if (vol != null) {
const volS = scoreVolume(vol);
s6_pass = volS.pass;
volNote = `${vol}× avg — ${volS.zone}`;
if (vol >= 2.0) volNote += ' — Capitulation/Exhaustion spike ★';
}
const rebuild = maRebuildPhase(maPrice, ma5, ma20, ma50, ma200);
const s7_pass = rebuild.score >= 75 ? true : rebuild.score >= 50 ? 'warn' : rebuild.score > 0 ? 'warn' : false;
const eng = scoreEngine();
eng.add(s1_pass, 18);
eng.add(s2_pass, 22);
eng.add(s3_pass, 16);
eng.add(s4_pass, 12);
eng.add(s5_pass, 12);
eng.add(s6_pass, 12);
eng.add(s7_pass, 8);
const score = eng.result();
const criticalPass = s2_pass !== false && s1_pass !== false;
let decision, riskLevel;
if (!criticalPass || score < 35) {
decision = 'SKIP'; riskLevel = 'High Risk';
} else if (score >= 72) {
decision = 'PROCEED'; riskLevel = 'Low Risk';
} else if (score >= 52) {
decision = 'PROCEED'; riskLevel = 'Medium Risk';
} else {
decision = 'WATCH'; riskLevel = 'Medium Risk';
}
const phaseGrade = { n: 0, g: 'BEAR', cls: 'grade-x', e: '🔴' };
if (rebuild.phase.n >= 3) { phaseGrade.g = 'BULL'; phaseGrade.cls = 'grade-spp'; phaseGrade.e = '🚀'; }
else if (rebuild.phase.n >= 2) { phaseGrade.g = 'EARLY'; phaseGrade.cls = 'grade-a'; phaseGrade.e = '📈'; }
else if (rebuild.phase.n >= 1) { phaseGrade.g = 'REVERSAL'; phaseGrade.cls = 'grade-b'; phaseGrade.e = '🔄'; }
setDecisionStrip('swing', decision, riskLevel, phaseGrade, `
<div>Candle: <span style="color:${candle?.color || 'var(--dim)'}">${candle?.pattern || '—'}</span>
  &nbsp; Supertrend: <span style="color:${s2_pass === true ? 'var(--green)' : s2_pass === false ? 'var(--red)' : 'var(--dim)'}">${stDir || '—'}</span>
</div>
<div>MA Rebuild: <span style="color:${rebuild.phase.color}">${rebuild.phase.label}</span>
  &nbsp; Score: <span style="color:var(--accent)">${score.toFixed(0)}/100</span>
</div>`
);
const adv = $('swing-advice');
if (decision === 'PROCEED') {
const lines = [
stDir === 'flipped_bull'
? `🟢 SUPERTREND FLIP CONFIRMED — Highest-conviction reversal signal. Enter on this candle close or next open.`
: `✅ Reversal conditions met (Score: ${score.toFixed(0)}/100).`,
candle ? `🕯️ ${candle.pattern} detected — ${candle.note}` : '',
jVal != null && jVal < 20 ? `📊 KDJ J=${jVal.toFixed(1)} — extreme oversold. Historical bounce rate >75% from this level.` : '',
rsi != null && rsi < 35 ? `📉 RSI ${rsi.toFixed(1)} — extreme oversold. Mean reversion favors the bull.` : '',
vol != null && vol >= 1.5 ? `⚡ Volume ${vol}× — ${vol >= 2 ? 'Capitulation spike (sellers exhausted)' : 'Above average conviction'}.` : '',
res1 ? `📐 Next resistance levels: ${res1.toFixed(4)}${res2 ? ' → ' + res2.toFixed(4) : ''}${res3 ? ' → ' + res3.toFixed(4) : ''}` : '',
`📦 Entry: ${c.toFixed(4)} | SL: ${atr ? (c - atr * 1.5).toFixed(4) + ' (ATR×1.5)' : 'set 1×ATR below candle low'}. Scale in across MA rebuilds.`,
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
updateDial('swing-dial-arc', 'swing-dial-score', score);
drawPie('swing-pie', 'swing-pie-legend', [
{ label: 'Candle', value: s1_pass === true ? 1 : s1_pass === 'warn' ? .5 : 0, color: 'var(--yellow)' },
{ label: 'Supertrend', value: s2_pass === true ? 2 : s2_pass === 'warn' ? 1 : 0, color: 'var(--green)' },
{ label: 'KDJ', value: s3_pass === true ? 1 : s3_pass === 'warn' ? .5 : 0, color: 'var(--accent)' },
{ label: 'RSI', value: s4_pass === true ? 1 : s4_pass === 'warn' ? .5 : 0, color: 'var(--accent2)' },
{ label: 'MACD', value: s5_pass === true ? 1 : s5_pass === 'warn' ? .5 : 0, color: 'var(--orange)' },
{ label: 'Volume', value: s6_pass === true ? 1 : s6_pass === 'warn' ? .5 : 0, color: 'var(--red)' },
{ label: 'MA Rebuild', value: rebuild.score / 100, color: 'var(--green2)' },
].filter(s => s.value > 0));
const passArr = [s1_pass, s2_pass, s3_pass, s4_pass, s5_pass, s6_pass, s7_pass].filter(v => v === true);
$('swing-checklist').innerHTML = [
buildCheck(`S1 — Candle: ${candle?.pattern || '—'}`, s1_pass, `${candle?.strength || 0}% strength`),
buildCheck(`S2 — Supertrend: ${stDir || '—'}`, s2_pass, stNote.length > 40 ? stNote.slice(0, 40) + '…' : stNote),
buildCheck(`S3 — KDJ Oversold`, s3_pass, kdjNote),
buildCheck(`S4 — RSI Bounce`, s4_pass, rsi ? `RSI: ${rsi.toFixed(1)}` : 'Not provided'),
buildCheck(`S5 — MACD ${dif != null && dea != null ? (dif > dea ? 'Bullish' : 'Bearish') : ''}`, s5_pass, macdNote),
buildCheck(`S6 — Volume Spike`, s6_pass, volNote),
buildCheck(`S7 — MA Rebuild Phase ${rebuild.phase.n}/4`, s7_pass, rebuild.phase.label),
].join('');
updateMeter('swing-signal-meter', passArr.length, 7);
const range = h - l;
const body = Math.abs(c - o);
const lowerWick = Math.min(o, c) - l;
const upperWick = h - Math.max(o, c);
const wickScore = range > 0 ? (lowerWick / range) * 100 : 0;
$('swing-candle-grid').innerHTML = [
{ l: 'Pattern', v: candle?.pattern || '—', c: candle?.bullish === true ? 'green' : candle?.bullish === false ? 'red' : 'yellow' },
{ l: 'Candle Range', v: range.toFixed(4), c: 'accent' },
{ l: 'Body Size', v: `${(body / range * 100).toFixed(0)}%`, c: body / range > 0.5 ? 'green' : 'yellow' },
{ l: 'Lower Wick', v: `${wickScore.toFixed(0)}%`, c: wickScore > 50 ? 'green' : wickScore > 30 ? 'accent' : 'dim' },
{ l: 'Upper Wick', v: `${(upperWick / range * 100).toFixed(0)}%`, c: upperWick / range > 0.3 ? 'red' : 'green' },
{ l: 'Candle Close', v: c > o ? '▲ Bullish' : '▼ Bearish', c: c > o ? 'green' : 'red' },
prevClose ? { l: 'Body vs Prev', v: `${((c - prevClose) / prevClose * 100).toFixed(2)}%`, c: c > prevClose ? 'green' : 'red' } : null,
].filter(Boolean).map(({ l, v, c: col }) =>
`<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${col}">${v}</div></div>`
).join('');
const fill = $('swing-wick-fill'), mark = $('swing-wick-marker'), lbl = $('swing-wick-label');
if (fill) fill.style.width = Math.min(100, wickScore) + '%';
if (mark) mark.style.left = Math.min(100, wickScore) + '%';
if (lbl) lbl.textContent = `${wickScore.toFixed(0)}% lower wick ratio`;
$('swing-rebuild-grid').innerHTML = rebuild.checks.map(ch =>
`<div class="check-row">
<span class="${ch.pass === true ? 'check-pass' : ch.pass === false ? 'check-fail' : 'check-neutral'}">${ch.pass === true ? '✔' : ch.pass === false ? '✘' : '○'}</span>
<span class="check-label">${ch.label}</span>
<span class="check-val ${ch.pass === true ? 'pass' : ch.pass === false ? 'fail' : 'warn'}">${ch.pass === true ? '✅ Done' : ch.pass === false ? '⏳ Pending' : '—'}</span>
</div>`
).join('');
const pct = rebuild.score;
const rf = $('swing-rebuild-fill'), rm = $('swing-rebuild-marker'), rl = $('swing-rebuild-label');
if (rf) rf.style.width = pct + '%';
if (rm) rm.style.left = pct + '%';
if (rl) rl.textContent = `Phase ${rebuild.phase.n}/4 — ${rebuild.phase.label}`;
const tpCard = $('swing-tradeplan-card');
if (tpCard) {
tpCard.style.display = '';
const phEl = $('swing-phase-info');
if (phEl) {
phEl.innerHTML = `<div class="swing-phase-banner" style="border-color:${rebuild.phase.color}">
<span style="color:${rebuild.phase.color};font-weight:700">${rebuild.phase.e} ${rebuild.phase.label}</span>
<span style="color:var(--dim);font-size:10.5px;margin-left:.75rem">${rebuild.phase.n < 4 ? `Next: ${['Price>MA5', 'MA5>MA20', 'MA20>MA50', 'Full stack'][rebuild.phase.n]}` : 'All MAs aligned — ride the trend'}</span>
</div>`;
}
const entryPrice = c;
const atrVal = atr || (range * 2);
const tpLevels = [];
if (res1) tpLevels.push({ label: 'Phase 1 TP — Resistance 1', price: res1, pct: '30%', note: 'MA cluster / key level — partial exit, move SL to breakeven' });
if (res2) tpLevels.push({ label: 'Phase 2 TP — Resistance 2', price: res2, pct: '40%', note: 'Next resistance — add at each MA cross above (scale in)' });
if (res3) tpLevels.push({ label: 'Phase 3 TP — Resistance 3', price: res3, pct: '30%', note: 'Full trend target — trail stop ATR×1.0' });
if (!res1) {
tpLevels.push({ label: 'TP1 (ATR×1.5)', price: entryPrice + atrVal * 1.5, pct: '40%', note: 'Move SL to breakeven' });
tpLevels.push({ label: 'TP2 (ATR×3.0)', price: entryPrice + atrVal * 3.0, pct: '40%', note: 'Trail stop' });
tpLevels.push({ label: 'TP3 (ATR×5.0)', price: entryPrice + atrVal * 5.0, pct: '20%', note: 'Hold for trend' });
}
const sl = entryPrice - atrVal * 1.5;
const dp = entryPrice > 10 ? 2 : 4;
let tpHtml = `<div class="prow entry"><span class="prow-label">Entry (Candle Close)</span><span class="prow-val accent">${entryPrice.toFixed(dp)}</span><span class="prow-note">Limit order — enter on close confirmation</span></div>
<div class="prow sl"><span class="prow-label">Stop Loss (ATR×1.5)</span><span class="prow-val red">${sl.toFixed(dp)}</span><span class="prow-note">Below candle low ${l.toFixed(dp)} — set immediately</span></div>`;
tpLevels.forEach((tp, i) => {
const rr = ((tp.price - entryPrice) / (entryPrice - sl)).toFixed(1);
const cls = i === 0 ? 'tp1' : i === 1 ? 'tp2' : 'tp3';
tpHtml += `<div class="prow ${cls}"><span class="prow-label">${tp.label} (${tp.pct})</span><span class="prow-val ${i === 0 ? 'green' : i === 1 ? 'g2' : 'g3'}">${tp.price.toFixed(dp)}</span><span class="prow-note">R:R 1:${rr} — ${tp.note}</span></div>`;
});
$('swing-price-block').innerHTML = tpHtml;
const scEl = $('swing-scaling-guide');
if (scEl) {
scEl.innerHTML = `<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:.4rem;font-weight:700">📐 Position Scaling Strategy</div>
<div class="wf-step"><span class="wf-n">1</span><span>Initial entry: <strong>33% of planned position</strong> at ${entryPrice.toFixed(dp)} — reversal just confirmed, not full conviction yet</span></div>
${ma5 ? `<div class="wf-step"><span class="wf-n">2</span><span>Add <strong>33% more</strong> when Price > MA5 (${ma5.toFixed(dp)}) is confirmed — MA5 crossed = momentum valid</span></div>` : ''}
${ma20 ? `<div class="wf-step"><span class="wf-n">3</span><span>Add <strong>final 34%</strong> when MA5 > MA20 (${ma20.toFixed(dp)}) confirmed — full bull signal</span></div>` : ''}
<div class="wf-step"><span class="wf-n">4</span><span>At TP1: take 30% profit, move SL to breakeven — trade now "free"</span></div>
<div class="wf-step"><span class="wf-n">5</span><span>At TP2: take 40% more, trail remaining 30% using ATR×1.0 below each new high</span></div>`;
}
const kellyEl = $('swing-kelly-block');
if (account && riskPct && kellyEl) {
kellyEl.style.display = '';
const riskAmt = account * (riskPct / 100);
const riskUnit = Math.abs(entryPrice - sl);
const units = riskUnit > 0 ? Math.floor(riskAmt / riskUnit) : 0;
const posVal = units * entryPrice;
kellyEl.innerHTML = `<div class="kelly-block">
<div class="kelly-title">⚖️ Reversal Trade Sizing</div>
<div class="kelly-row"><span class="kelly-label">Account</span><span class="kelly-val">$${account.toLocaleString()}</span></div>
<div class="kelly-row"><span class="kelly-label">Risk (${riskPct}%)</span><span class="kelly-val" style="color:var(--red)">$${riskAmt.toFixed(2)}</span></div>
<div class="kelly-row"><span class="kelly-label">Initial Entry (33%)</span><span class="kelly-val green">${Math.floor(units * 0.33)} units @ ${entryPrice.toFixed(dp)}</span></div>
<div class="kelly-row"><span class="kelly-label">Full Position</span><span class="kelly-val">${units} units = $${posVal.toFixed(2)}</span></div>
<div class="kelly-row" style="border-top:1px solid var(--border);padding-top:.3rem;margin-top:.2rem">
<span class="kelly-label" style="color:var(--muted);font-size:9.5px">💡 Scale in 33% → 33% → 34% as each MA phase confirms. Never risk full position at reversal entry.</span>
</div>
</div>`;
} else if (kellyEl) kellyEl.style.display = 'none';
}
}
function resetSwing() {
['sw-open', 'sw-high', 'sw-low', 'sw-close', 'sw-prev-close', 'sw-price',
'sw-st-prev', 'sw-st-curr', 'sw-ma-price', 'sw-ma5', 'sw-ma20', 'sw-ma50', 'sw-ma200',
'sw-res1', 'sw-res2', 'sw-res3', 'sw-k', 'sw-d', 'sw-j', 'sw-rsi',
'sw-dif', 'sw-dea', 'sw-vol', 'sw-adx', 'sw-atr', 'sw-account', 'sw-riskpct',
].forEach(id => { const el = $(id); if (el) el.value = ''; });
const stEl = document.getElementById('sw-st-dir');
if (stEl) stEl.value = '';
$('swing-result').style.display = 'none';
}
const QPP_PROFILES = [
{
id: 'recommended',
label: '⭐ Recommended',
color: 'var(--accent)',
border: 'rgba(0,200,240,.35)',
bg: 'rgba(0,200,240,.06)',
badge: 'STANDARD',
badgeCls: 'qpp-badge-accent',
slMult: 1.5,
tp1Mult: 1.5,
tp2Mult: 3.0,
tp3Mult: 5.0,
sizeRule: (score, stretch) => score >= 75 && stretch <= 3 ? 1.0 : score >= 55 ? 0.5 : 0.25,
posLabel: (score, stretch) => score >= 75 && stretch <= 3 ? '100%' : score >= 55 ? '50%' : '25%',
note: 'Balanced R:R. ATR×1.5 SL. Scale out 40/40/20 at TP1/2/3. Move SL to breakeven at TP1.',
riskPct: 1.0,
winRate: 55,
},
{
id: 'conservative',
label: '🛡️ Conservative',
color: 'var(--green)',
border: 'rgba(0,232,122,.35)',
bg: 'rgba(0,232,122,.05)',
badge: 'LOW RISK',
badgeCls: 'qpp-badge-green',
slMult: 1.2,
tp1Mult: 1.0,
tp2Mult: 2.0,
tp3Mult: 3.0,
sizeRule: (score) => score >= 75 ? 0.5 : 0.25,
posLabel: (score) => score >= 75 ? '50%' : '25%',
note: 'Tight SL (ATR×1.2). Quick TP1 at 1×ATR. Prioritises capital protection. Best for uncertain markets.',
riskPct: 0.5,
winRate: 60,
},
{
id: 'aggressive',
label: '🔥 Aggressive',
color: 'var(--red)',
border: 'rgba(240,58,74,.35)',
bg: 'rgba(240,58,74,.05)',
badge: 'HIGH RISK',
badgeCls: 'qpp-badge-red',
slMult: 2.0,
tp1Mult: 2.0,
tp2Mult: 4.0,
tp3Mult: 8.0,
sizeRule: (score) => score >= 72 ? 1.0 : 0.5,
posLabel: (score) => score >= 72 ? '100%' : '50%',
note: 'Wide SL (ATR×2.0) to survive volatility. Large TP3 target. Only when score ≥ 72 & strong trend.',
riskPct: 1.5,
winRate: 45,
},
{
id: 'scalp',
label: '⚡ Scalp',
color: 'var(--yellow)',
border: 'rgba(245,200,66,.35)',
bg: 'rgba(245,200,66,.05)',
badge: 'SHORT TERM',
badgeCls: 'qpp-badge-yellow',
slMult: 0.8,
tp1Mult: 0.6,
tp2Mult: 1.0,
tp3Mult: 1.5,
sizeRule: () => 1.0,
posLabel: () => '100%',
note: 'Tight SL (ATR×0.8). Quick exits at TP1/TP2. Best during London/NY overlap. Do not hold overnight.',
riskPct: 0.5,
winRate: 58,
},
{
id: 'swing',
label: '🔄 Swing',
color: 'var(--swing2)',
border: 'rgba(168,85,247,.35)',
bg: 'rgba(168,85,247,.05)',
badge: 'MULTI-DAY',
badgeCls: 'qpp-badge-swing',
slMult: 2.5,
tp1Mult: 3.0,
tp2Mult: 6.0,
tp3Mult: 10.0,
sizeRule: (score) => score >= 70 ? 0.5 : 0.25,
posLabel: (score) => score >= 70 ? '50%' : '25%',
note: 'Wide SL (ATR×2.5) for multi-day holds. TP3 at 10×ATR. Hold through minor pullbacks. Trail after TP1.',
riskPct: 1.0,
winRate: 48,
},
{
id: 'position',
label: '🏦 Position',
color: '#FFD700',
border: 'rgba(255,215,0,.3)',
bg: 'rgba(255,215,0,.04)',
badge: 'LONG TERM',
badgeCls: 'qpp-badge-gold',
slMult: 3.0,
tp1Mult: 5.0,
tp2Mult: 10.0,
tp3Mult: 20.0,
sizeRule: (score) => score >= 75 ? 0.33 : 0.15,
posLabel: (score) => score >= 75 ? '33%' : '15%',
note: 'Maximum SL (ATR×3.0). Weeks to months hold. TP3 = 20×ATR. Only in confirmed macro bull trend.',
riskPct: 0.5,
winRate: 52,
},
];
function calcEV(winRate, avgWinR, riskAmt) {
const w = winRate / 100;
const ev = (w * avgWinR - (1 - w) * 1) * riskAmt;
return ev;
}
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
function renderQPP(pfx, price, atr, score, accountSize, stretch, context) {
const container = $(`${pfx}-qpp`);
if (!container || !price || !atr) { if (container) container.style.display = 'none'; return; }
container.style.display = '';
const dp = context === 'gold' ? 2 : context === 'bursa' ? 3 : 4;
const currency = context === 'bursa' ? 'MYR ' : '$';
const riskAmt = accountSize ? accountSize * 0.01 : 100;
const maxEv = riskAmt * 3;
const cards = QPP_PROFILES.map(p => {
const sl = price - atr * p.slMult;
const tp1 = price + atr * p.tp1Mult;
const tp2 = price + atr * p.tp2Mult;
const tp3 = price + atr * p.tp3Mult;
const risk = price - sl;
const rr1 = risk > 0 ? ((tp1 - price) / risk) : 0;
const rr2 = risk > 0 ? ((tp2 - price) / risk) : 0;
const rr3 = risk > 0 ? ((tp3 - price) / risk) : 0;
const size = p.posLabel(score, stretch || 0);
const avgWinR = rr1 * 0.4 + rr2 * 0.4 + rr3 * 0.2;
const acctRisk = accountSize ? accountSize * (p.riskPct / 100) : riskAmt;
const ev = calcEV(p.winRate, avgWinR, acctRisk);
const units = accountSize && risk > 0 ? Math.floor((accountSize * p.riskPct / 100) / risk) : null;
const viable = p.id === 'scalp' ? true
: p.id === 'position' ? score >= 70
: p.id === 'aggressive' ? score >= 72
: p.id === 'swing' ? score >= 60
: score >= 50;
return { p, sl, tp1, tp2, tp3, risk, rr1, rr2, rr3, size, ev, avgWinR, acctRisk, units, viable };
});
const viable = cards.filter(c => c.viable);
const best = viable.sort((a, b) => b.ev - a.ev)[0];
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
`<button class="qpp-tab-btn${p.id === 'recommended' ? ' active' : ''}${!cards.find(c => c.p.id === p.id)?.viable ? ' qpp-dim' : ''}"
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
            <span style="font-size:12.5px;color:var(--text)">${p.note}</span>
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
<div class="qpp-split-fill">
            <div class="qpp-split-hdr">
              <span>✂️ SPLIT FILL — ALWAYS AVAILABLE</span>
            </div>
            <div class="qpp-split-part">
              <div class="qpp-split-label">PART 1 — ENTER NOW</div>
              <div class="qpp-split-price" style="color:var(--accent)">${currency}${price.toFixed(dp)}</div>
              <div class="qpp-split-sub">50% of planned position</div>
            </div>
            <div class="qpp-split-part">
              <div class="qpp-split-label">PART 2 — QUEUE AT MA5</div>
              <div class="qpp-split-price" style="color:var(--green)">${currency}${(price * 0.972).toFixed(dp)}</div>
              <div class="qpp-split-sub">50% of planned position</div>
            </div>
            <div class="qpp-split-avg">
              <span class="qpp-split-avg-label">AVG ENTRY</span>
              <span class="qpp-split-avg-val" style="color:var(--accent)">${currency}${(price * 0.986).toFixed(dp)}</span>
            </div>
            <div class="qpp-split-note">You never fully miss the move. Worst case: 50% in at a higher price. Best case: full position at a better average.</div>
            <div class="qpp-split-cancel">Cancel if price runs more than 3% above current price without touching MA5</div>
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
                  <span class="qpp-compare-ev" style="color:${cc.ev >= 0 ? 'var(--green)' : 'var(--red)'}">${cc.ev >= 0 ? '+' : ''}${currency}${cc.ev.toFixed(0)}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>`;
}).join('')}
    </div>`;
}
function qppSwitch(pfx, profileId) {
const wrap = $(`${pfx}-qpp`);
if (!wrap) return;
wrap.querySelectorAll('.qpp-tab-btn').forEach(b => b.classList.remove('active'));
wrap.querySelectorAll('.qpp-panel').forEach(p => p.classList.remove('active'));
const btn = wrap.querySelector(`.qpp-tab-btn[onclick*="${profileId}"]`);
const panel = $(`${pfx}-qpp-${profileId}`);
if (btn) btn.classList.add('active');
if (panel) panel.classList.add('active');
}
const _origMACalc = typeof maCalc === 'function' ? maCalc : null;
const _origEMACalc = typeof emaCalc === 'function' ? emaCalc : null;
const _origGoldCalc = typeof goldCalc === 'function' ? goldCalc : null;
const _origBursaCalc = typeof bursaCalc === 'function' ? bursaCalc : null;
const _origSwingCalc = typeof swingCalc === 'function' ? swingCalc : null;
function patchCalc(fn, pfx, getPriceAtrScore, context) {
return function() {
fn.apply(this, arguments);
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
function ipoSwitch(id) {
document.querySelectorAll('#panel-ipo .guide-section').forEach(s => s.classList.remove('active'));
document.querySelectorAll('#panel-ipo .guide-tab-btn').forEach(b => b.classList.remove('active'));
const sec = $(id); if (sec) sec.classList.add('active');
document.querySelectorAll('#panel-ipo .guide-tab-btn').forEach(b => {
if (b.getAttribute('onclick') === `ipoSwitch('${id}')`) b.classList.add('active');
});
}
function ipoCalc() {
const price = num('ipo-price');
const eps = num('ipo-eps');
const indPE = num('ipo-ind-pe');
if (!price || !eps || !indPE) { $('ipo-pre-result').style.display = 'none'; return; }
$('ipo-pre-result').style.display = '';
const nta = num('ipo-nta');
const mktcap = num('ipo-mktcap');
const revGrowth = num('ipo-rev-growth');
const npm = num('ipo-npm');
const de = num('ipo-de');
const roe = num('ipo-roe');
const floatPct = num('ipo-float');
const corner = num('ipo-corner');
const oversub = num('ipo-oversub');
const div = num('ipo-div');
const proceeds = document.getElementById('ipo-proceeds') ? document.getElementById('ipo-proceeds').value : '';
const lockup = document.getElementById('ipo-lockup') ? document.getElementById('ipo-lockup').value : '';
const ipoPE = eps > 0 ? price / eps : null;
const peDisco = ipoPE ? ((indPE - ipoPE) / indPE) * 100 : null;
const ntaPrem = nta ? ((price - nta) / nta) * 100 : null;
const eng = scoreEngine();
// PE vs Industry (25 pts)
let pePass = null;
if (peDisco != null) { pePass = peDisco >= 20 ? true : peDisco >= 0 ? true : peDisco >= -15 ? 'warn' : false; }
eng.add(pePass, 25);
// NTA Premium (15 pts)
let ntaPass = null;
if (ntaPrem != null) { ntaPass = ntaPrem <= 20 ? true : ntaPrem <= 50 ? 'warn' : false; }
eng.add(ntaPass, 15);
// Revenue Growth (15 pts)
let revPass = null;
if (revGrowth != null) { revPass = revGrowth >= 20 ? true : revGrowth >= 5 ? 'warn' : false; }
eng.add(revPass, 15);
// Net Profit Margin (10 pts)
let npmPass = null;
if (npm != null) { npmPass = npm >= 15 ? true : npm >= 5 ? 'warn' : false; }
eng.add(npmPass, 10);
// Debt-to-Equity (10 pts)
let dePass = null;
if (de != null) { dePass = de <= 0.3 ? true : de <= 0.7 ? true : de <= 1.5 ? 'warn' : false; }
eng.add(dePass, 10);
// ROE (8 pts)
let roePass = null;
if (roe != null) { roePass = roe >= 15 ? true : roe >= 8 ? 'warn' : false; }
eng.add(roePass, 8);
// Free Float (10 pts)
let floatPass = null;
if (floatPct != null) { floatPass = floatPct >= 25 && floatPct <= 40 ? true : floatPct >= 15 ? 'warn' : false; }
eng.add(floatPass, 10);
// Cornerstone (10 pts)
let cornerPass = null;
if (corner != null) { cornerPass = corner >= 20 ? true : corner >= 10 ? 'warn' : false; }
eng.add(cornerPass, 10);
// Market Cap (5 pts)
let mcPass = null;
if (mktcap != null) { mcPass = mktcap >= 300 && mktcap <= 2000 ? true : mktcap >= 100 ? 'warn' : false; }
eng.add(mcPass, 5);
// Use of Proceeds modifier
let proceedsNote = '', proceedsMod = 0;
if (proceeds === 'expansion' || proceeds === 'rd') {
  proceedsMod = 8; proceedsNote = '\u2705 Proceeds for growth/expansion — bullish signal.';
} else if (proceeds === 'working') {
  proceedsMod = 2; proceedsNote = '\uD83D\uDFE1 Working capital — neutral.';
} else if (proceeds === 'debt') {
  proceedsMod = -5; proceedsNote = '\u26A0\uFE0F Proceeds for debt repayment — no growth investment.';
} else if (proceeds === 'founders') {
  proceedsMod = -15; proceedsNote = '\uD83D\uDD34 Founders selling out — major red flag. Insiders are exiting.';
}
// Lock-up modifier
let lockupNote = '', lockupMod = 0;
if (lockup === '24') {
  lockupMod = 5; lockupNote = '\u2705 24-month lock-up — strong price support commitment.';
} else if (lockup === '12') {
  lockupMod = 3; lockupNote = '\u2705 12-month lock-up — adequate founder commitment.';
} else if (lockup === '6') {
  lockupMod = 0; lockupNote = '\uD83D\uDFE1 6-month lock-up — minimum acceptable. Watch for selling after 6M.';
} else if (lockup === 'none') {
  lockupMod = -10; lockupNote = '\uD83D\uDD34 No lock-up stated — founders can dump on listing day.';
}
const rawScore = eng.result();
const score = Math.min(100, Math.max(0, rawScore + proceedsMod + lockupMod));
const oversubBonus = oversub ? (oversub >= 100 ? '\uD83D\uDD25 EXTREME demand' : oversub >= 50 ? '\uD83D\uDE80 Very high demand' : oversub >= 20 ? '\uD83D\uDCC8 High demand' : '\uD83D\uDFE1 Moderate demand') : '';
let decision, riskLevel;
if (score >= 75) { decision = 'SUBSCRIBE'; riskLevel = 'Low Risk'; }
else if (score >= 55) { decision = 'NEUTRAL'; riskLevel = 'Medium Risk'; }
else { decision = 'AVOID'; riskLevel = 'High Risk'; }
const dClass = decision === 'SUBSCRIBE' ? 'proceed' : decision === 'AVOID' ? 'skip' : 'watch';
$('ipo-decision-strip').className = 'decision-strip ' + dClass;
const badge = $('ipo-d-badge');
badge.className = 'd-badge ' + dClass; badge.textContent = decision;
const rp = $('ipo-risk-pill');
rp.className = 'risk-pill ' + (riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium');
rp.textContent = riskLevel;
$('ipo-d-meta').innerHTML =
  '<div>IPO PE: <span style="color:' + (pePass === true ? 'var(--green)' : 'var(--red)') + '">' +
  (ipoPE ? ipoPE.toFixed(1) + '\u00D7' : '\u2014') + '</span>' +
  ' &nbsp; Industry PE: <span style="color:var(--text)">' + indPE + '\u00D7</span>' +
  (peDisco != null ? ' &nbsp; <span style="color:' + (peDisco >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (peDisco >= 0 ? 'Discount ' : 'Premium ') + Math.abs(peDisco).toFixed(1) + '%</span>' : '') +
  '</div><div>Score: <span style="color:#f5a623">' + score.toFixed(0) + '/100</span>' +
  (oversub ? ' &nbsp; Oversubscribed: <span style="color:var(--green)">' + oversub + '\u00D7</span> ' + oversubBonus : '') +
  (proceedsMod !== 0 ? ' &nbsp; Proceeds: <span style="color:' + (proceedsMod > 0 ? 'var(--green)' : 'var(--red)') + '">' + (proceedsMod > 0 ? '+' : '') + proceedsMod + 'pts</span>' : '') +
  (lockupMod !== 0 ? ' &nbsp; Lock-up: <span style="color:' + (lockupMod > 0 ? 'var(--green)' : 'var(--red)') + '">' + (lockupMod > 0 ? '+' : '') + lockupMod + 'pts</span>' : '') +
  '</div>';
const adv = $('ipo-advice');
const warnings = [proceedsNote, lockupNote].filter(Boolean);
if (decision === 'SUBSCRIBE') {
  adv.textContent = '\u2705 Strong IPO \u2014 Score ' + score.toFixed(0) + '/100. ' +
    (peDisco != null && peDisco >= 0 ? 'Trading at ' + peDisco.toFixed(1) + '% discount to industry PE (' + indPE + '\u00D7). ' : '') +
    (nta && ntaPrem != null && ntaPrem <= 20 ? 'Price only ' + ntaPrem.toFixed(1) + '% above NTA \u2014 low premium. ' : '') +
    (roe != null && roe >= 15 ? 'ROE ' + roe + '% \u2014 strong returns on equity. ' : '') +
    (oversub ? oversub + '\u00D7 oversubscribed \u2014 ' + oversubBonus + '. ' : '') +
    (warnings.length ? warnings.join(' ') : 'Subscribe for listing day gains.');
  adv.className = 'advice-box green';
} else if (decision === 'NEUTRAL') {
  adv.textContent = '\u26A0\uFE0F Fairly priced \u2014 Score ' + score.toFixed(0) + '/100. PE ' + (ipoPE ? ipoPE.toFixed(1) : '?') + '\u00D7 vs industry ' + indPE + '\u00D7. Subscribe only with high sector conviction. Watch listing day open carefully.' + (warnings.length ? ' Note: ' + warnings.join(' ') : '');
  adv.className = 'advice-box yellow';
} else {
  const failed = [
    pePass === false && ('Overvalued PE ' + (ipoPE ? ipoPE.toFixed(1) : '?') + '\u00D7 vs industry ' + indPE + '\u00D7'),
    ntaPass === false && ('High NTA premium ' + (ntaPrem != null ? ntaPrem.toFixed(1) : '?') + '%'),
    dePass === false && ('High D/E ratio ' + de),
    floatPass === false && ('Low free float ' + floatPct + '%'),
    roePass === false && ('Weak ROE ' + roe + '%'),
    proceeds === 'founders' && 'Founders selling out',
    lockup === 'none' && 'No lock-up period',
  ].filter(Boolean);
  adv.textContent = '\uD83D\uDD34 Avoid. ' + failed.join(' | ') + '. Wait for secondary market entry once price justifies fundamentals.';
  adv.className = 'advice-box red';
}
updateDial('ipo-dial-arc', 'ipo-dial-score', score);
$('ipo-checklist').innerHTML = [
  buildCheck('PE ' + (ipoPE ? ipoPE.toFixed(1) : '?') + '\u00D7 vs Industry ' + indPE + '\u00D7', pePass,
    peDisco != null ? (peDisco >= 0 ? 'Discount ' + peDisco.toFixed(1) + '% to peers \u2705' : 'Premium ' + Math.abs(peDisco).toFixed(1) + '% above peers') : '\u2014'),
  nta ? buildCheck('NTA Premium ' + (ntaPrem != null ? ntaPrem.toFixed(1) : '?') + '%', ntaPass, 'Price MYR' + price + ' vs NTA MYR' + nta) : buildCheck('NTA Coverage', null, 'Not provided \u2014 check prospectus'),
  revGrowth != null ? buildCheck('Revenue Growth ' + revGrowth + '% YoY', revPass, revGrowth >= 20 ? '\uD83D\uDE80 Strong growth' : revGrowth >= 5 ? 'Moderate growth' : '\u26A0\uFE0F Weak growth') : buildCheck('Revenue Growth', null, 'Not provided'),
  npm != null ? buildCheck('Net Profit Margin ' + npm + '%', npmPass, npm >= 15 ? 'Healthy \u2705' : npm >= 5 ? 'Moderate' : '\u26A0\uFE0F Thin margin') : buildCheck('Profit Margin', null, 'Not provided'),
  roe != null ? buildCheck('ROE ' + roe + '%', roePass, roe >= 15 ? 'Strong returns on equity \u2705' : roe >= 8 ? 'Acceptable' : '\u26A0\uFE0F Weak ROE') : buildCheck('ROE', null, 'Not provided'),
  de != null ? buildCheck('Debt-to-Equity ' + de, dePass, de <= 0.3 ? 'Low debt \u2705' : de <= 0.7 ? 'Moderate' : '\u26A0\uFE0F High leverage') : buildCheck('Debt-to-Equity', null, 'Not provided'),
  floatPct != null ? buildCheck('Free Float ' + floatPct + '%', floatPass, floatPct >= 25 && floatPct <= 40 ? 'Good liquidity \u2705' : floatPct < 15 ? '\uD83D\uDD34 Very thin \u2014 manipulation risk' : 'Low float \u2014 watch for volatility') : buildCheck('Free Float', null, 'Not provided'),
  corner != null ? buildCheck('Cornerstone ' + corner + '%', cornerPass, corner >= 20 ? 'Strong institutional backing \u2705' : '\u26A0\uFE0F Low institutional commitment') : buildCheck('Cornerstone Investors', null, 'Not provided'),
  mktcap != null ? buildCheck('Market Cap RM' + mktcap + 'M', mcPass, mktcap >= 2000 ? 'Large cap \u2014 stable' : mktcap >= 300 ? 'Mid cap \u2014 best upside \u2705' : mktcap >= 100 ? 'Small cap \u2014 volatile' : '\uD83D\uDD34 Micro cap \u2014 high risk') : buildCheck('Market Cap', null, 'Not provided'),
  proceeds ? buildCheck('Use of Proceeds: ' + proceeds, proceeds === 'expansion' || proceeds === 'rd' ? true : proceeds === 'founders' ? false : 'warn', proceedsNote) : buildCheck('Use of Proceeds', null, 'Not provided \u2014 check prospectus'),
  lockup ? buildCheck('Lock-up: ' + (lockup === 'none' ? 'None stated' : lockup + ' months'), lockup === '24' || lockup === '12' ? true : lockup === 'none' ? false : 'warn', lockupNote) : buildCheck('Lock-up Period', null, 'Not provided'),
  div != null ? buildCheck('Dividend Yield ' + div + '%', div >= 3 ? true : div >= 1 ? 'warn' : null, div >= 3 ? 'Good income support \u2705' : 'Low/no dividend \u2014 growth play') : buildCheck('Dividend Yield', null, 'Not provided'),
].join('');
$('ipo-val-grid').innerHTML = [
  { l: 'IPO PE', v: ipoPE ? ipoPE.toFixed(1) + '\u00D7' : '\u2014', c: pePass === true ? 'green' : pePass === false ? 'red' : 'yellow' },
  { l: 'Industry PE', v: indPE + '\u00D7', c: 'dim' },
  { l: 'PE Discount', v: peDisco != null ? (peDisco >= 0 ? '+' : '') + peDisco.toFixed(1) + '%' : '\u2014', c: peDisco != null && peDisco >= 0 ? 'green' : 'red' },
  { l: 'NTA Premium', v: ntaPrem != null ? ntaPrem.toFixed(1) + '%' : '\u2014', c: ntaPrem != null && ntaPrem <= 20 ? 'green' : 'yellow' },
  { l: 'Profit Margin', v: npm != null ? npm.toFixed(1) + '%' : '\u2014', c: npm != null && npm >= 15 ? 'green' : npm != null && npm >= 5 ? 'yellow' : 'red' },
  { l: 'ROE', v: roe != null ? roe.toFixed(1) + '%' : '\u2014', c: roe != null && roe >= 15 ? 'green' : roe != null && roe >= 8 ? 'yellow' : 'dim' },
  { l: 'D/E Ratio', v: de != null ? de.toFixed(2) : '\u2014', c: de != null && de <= 0.3 ? 'green' : de != null && de <= 0.7 ? 'accent' : 'red' },
  { l: 'Rev Growth', v: revGrowth != null ? revGrowth.toFixed(1) + '%' : '\u2014', c: revGrowth != null && revGrowth >= 20 ? 'green' : revGrowth != null && revGrowth >= 5 ? 'yellow' : 'red' },
  { l: 'Oversubscribed', v: oversub != null ? oversub + '\u00D7' : '\u2014', c: oversub != null && oversub >= 50 ? 'green' : oversub != null && oversub >= 20 ? 'accent' : 'dim' },
  { l: 'Free Float', v: floatPct != null ? floatPct + '%' : '\u2014', c: floatPct != null && floatPct >= 25 ? 'green' : floatPct != null && floatPct >= 15 ? 'yellow' : 'red' },
  { l: 'Cornerstone', v: corner != null ? corner + '%' : '\u2014', c: corner != null && corner >= 20 ? 'green' : corner != null && corner >= 10 ? 'yellow' : 'dim' },
  { l: 'IPO Score', v: score.toFixed(0) + '/100', c: score >= 75 ? 'green' : score >= 55 ? 'yellow' : 'red' },
].map(function(x) { return '<div class="stat-cell"><div class="stat-label">' + x.l + '</div><div class="stat-value ' + x.c + '">' + x.v + '</div></div>'; }).join('');
}

function listingCalc() {
const ipoP = num('ld-ipo-price');
const open = num('ld-open');
const price = num('ld-price');
if (!ipoP || !open || !price) { $('ipo-listing-result').style.display = 'none'; return; }
$('ipo-listing-result').style.display = '';
const high = num('ld-high') || price;
const low = num('ld-low') || price;
const vol = num('ld-vol');
const floatU = num('ld-float-units');
const bidask = num('ld-bidask');
const atr = num('ld-atr');
const rsi = num('ld-rsi');
const k = num('ld-k');
const d = num('ld-d');
const gapFromIPO = ((open - ipoP) / ipoP) * 100;
const currentVsIPO = ((price - ipoP) / ipoP) * 100;
const volRatio = (vol && floatU && floatU > 0) ? vol / floatU : null;
const range = high - low;
const body = Math.abs(price - open);
const upperWick = high - Math.max(open, price);
const wickRatio = range > 0 ? (upperWick / range) * 100 : 0;
const isPump = gapFromIPO > 50 || (volRatio && volRatio > 5);
const isDump = price < ipoP || (bidask != null && bidask < -10 && price < open);
const isRejected = wickRatio > 50;
const isBroken = price < ipoP;
const gapPass = gapFromIPO >= 5 && gapFromIPO <= 30 ? true : gapFromIPO > 30 ? 'warn' : false;
const volPass = volRatio != null ? (volRatio <= 3 ? true : volRatio <= 5 ? 'warn' : false) : null;
const bidPass = bidask != null ? (bidask >= 5 ? true : bidask >= 0 ? 'warn' : false) : null;
const wickPass = wickRatio < 30 ? true : wickRatio < 50 ? 'warn' : false;
const closePass = price >= open ? true : false;
const brokenPass = !isBroken ? true : false;
let decision, riskLevel, advice, advCls;
if (isBroken) {
decision = 'EXIT NOW'; riskLevel = 'High Risk';
advice = `💀 BROKEN IPO — Price ${price.toFixed(3)} is BELOW offer price ${ipoP.toFixed(3)}. Exit immediately. Do not average down. Broken IPOs often continue falling.`;
advCls = 'red';
} else if (isPump && isRejected) {
decision = 'PUMP ALERT'; riskLevel = 'High Risk';
advice = `🚨 PUMP & DUMP DETECTED — Gap ${gapFromIPO.toFixed(1)}% from IPO price${volRatio ? `, volume ${volRatio.toFixed(1)}× float` : ''}. Upper wick ${wickRatio.toFixed(0)}% = sellers rejecting high prices. Do NOT chase. Wait for price to stabilise below ${(ipoP * 1.15).toFixed(3)} before considering entry.`;
advCls = 'red';
} else if (isDump) {
decision = 'DUMP ALERT'; riskLevel = 'High Risk';
advice = `⬇️ DUMP SIGNAL — Price closing below open${bidask < -10 ? `, Bid/Ask ${bidask.toFixed(1)}% — sellers flooding` : ''}. Avoid buying. If holding, exit on any bounce to open price.`;
advCls = 'red';
} else if (gapPass === true && closePass && (bidPass === true || bidPass === 'warn')) {
decision = 'HEALTHY IPO'; riskLevel = 'Low Risk';
advice = `✅ Healthy listing — ${gapFromIPO.toFixed(1)}% gap from IPO price. Price closing ${price >= open ? 'above' : 'near'} open = buyers in control. ${bidask >= 5 ? 'Bid/Ask positive — demand intact. ' : ''}Can hold existing position or buy on pullback toward ${(ipoP * 1.05).toFixed(3)} (5% above IPO price).`;
advCls = 'green';
} else {
decision = 'WATCH'; riskLevel = 'Medium Risk';
advice = `⚠️ Mixed signals — ${gapFromIPO.toFixed(1)}% gap from IPO price. ${isRejected ? `Upper wick ${wickRatio.toFixed(0)}% suggests sellers at highs. ` : ''}${bidask < 0 ? 'Bid/Ask negative — caution. ' : ''}Wait for cleaner candle before adding.`;
advCls = 'yellow';
}
const dClass = ['HEALTHY IPO'].includes(decision) ? 'proceed' : ['EXIT NOW', 'PUMP ALERT', 'DUMP ALERT'].includes(decision) ? 'skip' : 'watch';
$('ld-decision-strip').className = `decision-strip ${dClass}`;
const badge = $('ld-d-badge'); badge.className = `d-badge ${dClass}`; badge.textContent = decision;
const rp = $('ld-risk-pill');
rp.className = `risk-pill ${riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium'}`;
rp.textContent = riskLevel;
$('ld-d-meta').innerHTML = `
    <div>Gap from IPO: <span style="color:${gapFromIPO >= 0 ? 'var(--green)' : 'var(--red)'}">
      ${gapFromIPO >= 0 ? '+' : ''}${gapFromIPO.toFixed(2)}%</span>
      &nbsp; Current vs IPO: <span style="color:${currentVsIPO >= 0 ? 'var(--green)' : 'var(--red)'}">
      ${currentVsIPO >= 0 ? '+' : ''}${currentVsIPO.toFixed(2)}%</span>
    </div>
    <div>${isPump ? '🚨 PUMP DETECTED' : isDump ? '⬇️ DUMP SIGNAL' : isBroken ? '💀 BROKEN' : '✅ Normal'}
      &nbsp; Upper Wick: <span style="color:${wickRatio > 50 ? 'var(--red)' : wickRatio > 30 ? 'var(--yellow)' : 'var(--green)'}">
      ${wickRatio.toFixed(0)}%</span>
    </div>`;
$('ld-advice').textContent = advice;
$('ld-advice').className = `advice-box ${advCls}`;
$('ld-stats-grid').innerHTML = [
{ l: 'Gap from IPO', v: (gapFromIPO >= 0 ? '+' : '') + gapFromIPO.toFixed(2) + '%', c: gapFromIPO >= 5 && gapFromIPO <= 30 ? 'green' : gapFromIPO > 30 ? 'yellow' : 'red' },
{ l: 'Open Price', v: 'MYR ' + open.toFixed(3), c: 'accent' },
{ l: 'Current Price', v: 'MYR ' + price.toFixed(3), c: price >= open ? 'green' : 'red' },
{ l: 'Upper Wick', v: wickRatio.toFixed(0) + '%', c: wickRatio < 30 ? 'green' : wickRatio < 50 ? 'yellow' : 'red' },
{ l: 'Vol vs Float', v: volRatio ? volRatio.toFixed(2) + '×' : '—', c: volRatio && volRatio <= 3 ? 'green' : volRatio && volRatio <= 5 ? 'yellow' : 'red' },
{ l: 'Bid/Ask', v: bidask != null ? (bidask >= 0 ? '+' : '') + bidask.toFixed(1) + '%' : '—', c: bidask >= 5 ? 'green' : bidask >= 0 ? 'accent' : 'red' },
{ l: 'IPO Status', v: isBroken ? '💀 BROKEN' : isPump ? '🚨 PUMP' : '✅ Intact', c: isBroken || isPump ? 'red' : 'green' },
{ l: 'Close vs Open', v: price >= open ? '▲ Bullish' : '▼ Bearish', c: price >= open ? 'green' : 'red' },
].map(({ l, v, c }) => `<div class="stat-cell"><div class="stat-label">${l}</div><div class="stat-value ${c}">${v}</div></div>`).join('');
const fillPct = high > ipoP ? Math.min(100, Math.max(0, (price - ipoP) / (high - ipoP) * 100)) : 50;
const pFill = $('ld-price-fill'); if (pFill) pFill.style.width = fillPct + '%';
const pMark = $('ld-price-marker'); if (pMark) pMark.style.left = fillPct + '%';
const pPos = $('ld-range-pos'); if (pPos) pPos.textContent = fillPct.toFixed(0) + '% of range';
const pLow = $('ld-range-low'); if (pLow) pLow.textContent = 'IPO MYR' + ipoP.toFixed(3);
const pHigh = $('ld-range-high'); if (pHigh) pHigh.textContent = 'High MYR' + high.toFixed(3);
$('ld-checklist').innerHTML = [
buildCheck(`Gap from IPO: ${gapFromIPO.toFixed(1)}%`, gapPass, gapFromIPO > 50 ? '🚨 Extreme pump' : gapFromIPO > 30 ? 'High — caution' : 'Healthy range'),
buildCheck(`Price vs Open: ${price >= open ? 'Above' : 'Below'}`, closePass, price >= open ? 'Buyers holding ✅' : 'Sellers winning ⚠️'),
buildCheck(`Upper Wick Rejection: ${wickRatio.toFixed(0)}%`, wickPass, wickRatio > 50 ? '🚨 Sellers at top' : wickRatio > 30 ? 'Some rejection' : 'Clean close'),
volRatio != null ? buildCheck(`Volume: ${volRatio.toFixed(1)}× float`, volPass, volRatio > 5 ? '🚨 Extreme — pump risk' : volRatio > 3 ? 'High volume' : 'Normal') : buildCheck('Volume vs Float', null, 'Enter volume + float'),
bidask != null ? buildCheck(`Bid/Ask: ${(bidask >= 0 ? '+' : '') + bidask.toFixed(1)}%`, bidPass, bidask < -10 ? '🚨 Sellers dumping' : bidask < 0 ? 'Net sellers' : 'Net buyers') : buildCheck('Bid/Ask Ratio', null, 'Not provided'),
buildCheck(`IPO Price Intact: ${isBroken ? 'BROKEN' : 'Yes'}`, brokenPass, isBroken ? `💀 Below offer price MYR${ipoP}` : `✅ Above MYR${ipoP}`),
].join('');
const tpCard = $('ld-tradeplan-card');
if (atr && tpCard && !isBroken && !isPump) {
tpCard.style.display = '';
const sl = price - atr * 1.5;
const tp1 = price + atr * 1.5;
const tp2 = price + atr * 3.0;
$('ld-price-block').innerHTML = `
      <div class="prow entry"><span class="prow-label">Entry</span><span class="prow-val accent">MYR ${price.toFixed(3)}</span><span class="prow-note">Limit order — current price</span></div>
      <div class="prow sl"><span class="prow-label">Stop Loss (ATR×1.5)</span><span class="prow-val red">MYR ${sl.toFixed(3)}</span><span class="prow-note">Hard stop — exit if broken</span></div>
      <div class="prow tp1"><span class="prow-label">TP1 — Take 50%</span><span class="prow-val green">MYR ${tp1.toFixed(3)}</span><span class="prow-note">Listing day exit — don't be greedy</span></div>
      <div class="prow tp2"><span class="prow-label">TP2 — Trail 50%</span><span class="prow-val g2">MYR ${tp2.toFixed(3)}</span><span class="prow-note">Only if strong close + no dump signals</span></div>`;
} else if (tpCard) { tpCard.style.display = 'none'; }
}
function resetIPO() {
['ipo-price', 'ipo-eps', 'ipo-ind-pe', 'ipo-nta', 'ipo-mktcap',
'ipo-rev-growth', 'ipo-npm', 'ipo-de', 'ipo-roe', 'ipo-div',
'ipo-float', 'ipo-corner', 'ipo-oversub',
'ipo-ball-lots', 'ipo-ball-total'].forEach(id => { const el = $(id); if (el) el.value = ''; });
['ipo-shariah', 'ipo-sector', 'ipo-proceeds', 'ipo-lockup'].forEach(id => {
const el = $(id); if (el) el.value = el.options ? el.options[0].value : '';
});
$('ipo-pre-result').style.display = 'none';
const br = $('ipo-ballo-result'); if (br) br.style.display = 'none';
}
function resetListing() {
['ld-ipo-price', 'ld-open', 'ld-high', 'ld-low', 'ld-price',
'ld-vol', 'ld-float-units', 'ld-bidask', 'ld-atr', 'ld-rsi', 'ld-k', 'ld-d'].forEach(id => { const el = $(id); if (el) el.value = ''; });
$('ipo-listing-result').style.display = 'none';
}

function ipoBalloCalc() {
const lots = num('ipo-ball-lots');
const total = num('ipo-ball-total');
const oversub = num('ipo-oversub');
const res = $('ipo-ballo-result');
if (!res) return;
if (!lots || !total) { res.style.display = 'none'; return; }
res.style.display = 'flex';
// Estimate applications from oversubscription or assume competitive
const estApps = oversub ? Math.floor(total * oversub) : total * 10;
const winProb = Math.min(99.9, (total / Math.max(estApps, total)) * 100);
const winProbDisplay = winProb < 1 ? winProb.toFixed(2) : winProb.toFixed(1);
const col = winProb >= 20 ? 'var(--green)' : winProb >= 5 ? 'var(--yellow)' : 'var(--red)';
const appsEl = $('ipo-ballo-apps');
const pctEl  = $('ipo-ballo-pct');
const shrEl  = $('ipo-ballo-shares');
const noteEl = $('ipo-ballo-note');
if (appsEl) appsEl.textContent = estApps.toLocaleString() + (oversub ? ' (from ' + oversub + '\u00D7 oversubscription)' : ' (estimated 10\u00D7 oversubscribed)');
if (pctEl)  { pctEl.textContent = winProbDisplay + '%'; pctEl.style.color = col; }
if (shrEl)  shrEl.textContent = (lots * 100).toLocaleString() + ' shares (if balloted)';
if (noteEl) {
const tip = winProb >= 20 ? 'Good odds. Applying is worthwhile — better than average chance of receiving shares.'
  : winProb >= 5  ? 'Moderate odds. Common for popular IPOs. Worth applying but do not count on it.'
  : winProb >= 1  ? 'Low odds — highly competitive. Consider applying for multiple accounts (one per eligible CDS account holder in your household).'
  : 'Very low odds — extremely oversubscribed. Do not apply expecting shares. The listing day secondary market may be a better entry.';
noteEl.textContent = '\uD83D\uDCA1 ' + tip;
}
}

/* ═══════════════════════════════════════════════════════
   S/R ZONE ANALYZER
═══════════════════════════════════════════════════════ */
function srCalc() {
const price = num('sr-price');
const chartWrap = $('sr-chart-wrap');
const analysisWrap = $('sr-analysis-wrap');
const barWrap = $('sr-bar-wrap');
if (!price) {
if (chartWrap) chartWrap.style.display = 'none';
if (analysisWrap) analysisWrap.style.display = 'none';
if (barWrap) barWrap.style.display = 'none';
return;
}

// Collect manual levels
const levels = [];
for (let i = 1; i <= 8; i++) {
const lv = num(`sr-lv${i}`);
const lb = $(`sr-lb${i}`)?.value?.trim() || `Level ${i}`;
if (lv != null) levels.push({ price: lv, label: lb, source: 'manual' });
}

// Add pivot levels if present
const pivotLevels = srGetPivotLevels();
pivotLevels.forEach(pl => levels.push(pl));

// Add Volume Profile levels if present
const vpLevels = srGetVPLevels();
vpLevels.forEach(vl => levels.push(vl));

if (levels.length === 0) {
if (chartWrap) chartWrap.style.display = 'none';
if (analysisWrap) analysisWrap.style.display = 'none';
if (barWrap) barWrap.style.display = 'none';
return;
}

// Sort ascending
levels.sort((a, b) => a.price - b.price);

// Classify and compute distances
levels.forEach(lv => {
lv.distPct = ((lv.price - price) / price) * 100;
if (lv.price < price * 0.9995) lv.type = 'support';
else if (lv.price > price * 1.0005) lv.type = 'resistance';
else lv.type = 'current';
});

// Confluence detection — count how many other levels are within 1.5%
levels.forEach((lv, i) => {
lv.confluence = 1;
for (let j = 0; j < levels.length; j++) {
if (i !== j) {
const diff = Math.abs(levels[j].price - lv.price) / lv.price * 100;
if (diff <= 1.5) lv.confluence++;
}
}
});

// Show panels
if (chartWrap) chartWrap.style.display = '';
if (analysisWrap) analysisWrap.style.display = '';
if (barWrap) barWrap.style.display = '';

// Draw
setTimeout(() => {
drawSRCanvas(price, levels);
renderSRAnalysis(price, levels);
renderSRBarChart(price, levels);
}, 0);
}

function srGetPivotLevels() {
const ph = num('sr-ph'), pl = num('sr-pl'), pc = num('sr-pc');
if (!ph || !pl || !pc) return [];
const P = (ph + pl + pc) / 3;
const R1 = 2 * P - pl;
const S1 = 2 * P - ph;
const R2 = P + (ph - pl);
const S2 = P - (ph - pl);
const R3 = ph + 2 * (P - pl);
const S3 = pl - 2 * (ph - P);
return [
{ price: P, label: 'Pivot', source: 'pivot' },
{ price: R1, label: 'R1', source: 'pivot' },
{ price: R2, label: 'R2', source: 'pivot' },
{ price: R3, label: 'R3', source: 'pivot' },
{ price: S1, label: 'S1', source: 'pivot' },
{ price: S2, label: 'S2', source: 'pivot' },
{ price: S3, label: 'S3', source: 'pivot' },
];
}

function srPivotCalc() {
const ph = num('sr-ph'), pl = num('sr-pl'), pc = num('sr-pc');
const el = $('sr-pivot-results');
if (!ph || !pl || !pc) { if (el) el.style.display = 'none'; return; }
const P = (ph + pl + pc) / 3;
const R1 = 2 * P - pl, S1 = 2 * P - ph;
const R2 = P + (ph - pl), S2 = P - (ph - pl);
const R3 = ph + 2 * (P - pl), S3 = pl - 2 * (ph - P);
const row = (label, val, cls) =>
`<div class="sr-pivot-row"><span class="sr-pivot-label ${cls}">${label}</span><span class="sr-pivot-val">${fmtPrice(val)}</span></div>`;
el.innerHTML =
row('R3', R3, 'red') + row('R2', R2, 'red') + row('R1', R1, 'red') +
row('Pivot', P, 'accent') +
row('S1', S1, 'green') + row('S2', S2, 'green') + row('S3', S3, 'green');
el.style.display = '';
srCalc();
}

// ─── Chart.js S/R Zone Chart ───────────────────────────────────────────────
let _srChartInstance = null;

function drawSRCanvas(price, levels) {
  const canvas = $('sr-canvas');
  if (!canvas) return;

  // Ensure the canvas container has a real height before Chart.js tries to size itself
  const wrap = $('sr-chartjs-wrap');
  if (wrap && wrap.clientHeight < 100) wrap.style.height = '420px';

  // Destroy previous chart instance cleanly
  if (_srChartInstance) {
    _srChartInstance.destroy();
    _srChartInstance = null;
  }

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const tc = themeColors();

  // ── Colors ──────────────────────────────────────────────────────────────────
  const col = {
    bg:       isLight ? '#ffffff' : '#0b1018',
    gridLine: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)',
    axisText: isLight ? '#3a5a72' : '#7a9bb5',
    tooltip:  isLight ? '#0f1825' : '#0f1825',
    current:  '#00c8f0',
    sup:      '#00e87a',
    supWeak:  '#00aa55',
    res:      '#f03a4a',
    resWeak:  '#bb2233',
    major:    '#f5c842',
  };

  // ── Build price range ────────────────────────────────────────────────────────
  const allPrices = [...levels.map(l => l.price), price];
  const minP  = Math.min(...allPrices);
  const maxP  = Math.max(...allPrices);
  const range = maxP - minP || price * 0.08;
  const pad   = range * 0.35;
  const yMin  = minP - pad;
  const yMax  = maxP + pad;

  // ── Build annotation objects ─────────────────────────────────────────────────
  const annotations = {};

  // Pre-compute colors & metadata per level
  const lvMeta = levels.map(lv => {
    const isSup   = lv.type === 'support';
    const isCur   = lv.type === 'current';
    const isMajor = lv.confluence >= 3;
    const isStrong= lv.confluence >= 2;
    let lineColor, bandColor, lw;
    if (isCur)        { lineColor = col.current; bandColor = 'rgba(0,200,240,0.10)'; lw = 2.5; }
    else if (isMajor) { lineColor = col.major;   bandColor = 'rgba(245,200,66,0.14)'; lw = 2.5; }
    else if (isStrong){ lineColor = isSup ? col.sup : col.res;
                        bandColor = isSup ? 'rgba(0,232,122,0.10)' : 'rgba(240,58,74,0.10)'; lw = 2; }
    else              { lineColor = isSup ? col.supWeak : col.resWeak;
                        bandColor = isSup ? 'rgba(0,170,85,0.06)' : 'rgba(180,30,50,0.06)'; lw = 1.2; }
    return { ...lv, isSup, isCur, isMajor, isStrong, lineColor, bandColor, lw };
  });

  // ── Collision-avoidance: compute yAdjust for each label ──────────────────────
  // We need pixel positions to determine overlap. We approximate using price ratio.
  // Chart height ≈ 340px (canvas height), price range = yMax - yMin
  const chartPxH  = 340;
  const labelH    = 36;   // approximate height of a 2-line label box (px)
  const pricePerPx = (yMax - yMin) / chartPxH;

  // Convert price → approximate pixel Y from top
  const priceToApproxPx = p => chartPxH * (1 - (p - yMin) / (yMax - yMin));

  // Build list of { idx, price, approxPx, yAdjust } sorted by price ascending
  const labelSlots = lvMeta.map((lv, i) => ({
    i, price: lv.price,
    px: priceToApproxPx(lv.price),
    yAdjust: 0,
  }));

  // Sort by approximate Y descending (top of chart first = highest price)
  labelSlots.sort((a, b) => a.px - b.px);

  // Two-pass push-apart: repeatedly nudge overlapping labels apart
  const MIN_GAP = labelH + 4;
  for (let pass = 0; pass < 20; pass++) {
    let moved = false;
    for (let k = 1; k < labelSlots.length; k++) {
      const prev = labelSlots[k - 1];
      const curr = labelSlots[k];
      const gap = (curr.px + curr.yAdjust) - (prev.px + prev.yAdjust);
      if (gap < MIN_GAP) {
        const push = (MIN_GAP - gap) / 2;
        prev.yAdjust -= push;
        curr.yAdjust += push;
        moved = true;
      }
    }
    if (!moved) break;
  }

  // Map index → computed yAdjust (in pixels; negative = up, positive = down)
  const adjustMap = {};
  labelSlots.forEach(s => { adjustMap[s.i] = s.yAdjust; });

  // ── Draw bands, lines, labels ────────────────────────────────────────────────
  lvMeta.forEach((lv, i) => {
    const { isSup, isMajor, isStrong, lineColor, bandColor, lw } = lv;
    const bandHalfPct = (isMajor ? 0.006 : isStrong ? 0.004 : 0.002) * lv.price;
    const distStr  = (lv.distPct >= 0 ? '+' : '') + lv.distPct.toFixed(2) + '%';
    const confBadge= isStrong ? ` · ${lv.confluence}× CONF` : '';
    const typeTag  = lv.isCur ? 'CURRENT' : isSup ? 'SUPPORT' : 'RESISTANCE';
    const yAdj     = adjustMap[i] || 0;

    // Band box
    annotations[`band_${i}`] = {
      type: 'box',
      yMin: lv.price - bandHalfPct,
      yMax: lv.price + bandHalfPct,
      xMin: 0, xMax: 1,
      backgroundColor: bandColor,
      borderWidth: 0,
    };

    // Full horizontal price line
    annotations[`line_${i}`] = {
      type: 'line',
      yMin: lv.price, yMax: lv.price,
      borderColor: lineColor,
      borderWidth: lw,
      borderDash: lv.source === 'pivot' && !isStrong ? [6, 4] : [],
      label: {
        display: true,
        content: [`${lv.label}  ${fmtPrice(lv.price)}`, `${typeTag}  ${distStr}${confBadge}`],
        position: 'end',
        xAdjust: -6,
        yAdjust: -6,          // ← collision-resolved offset
        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(6,10,15,0.92)',
        color: lineColor,
        font: [
          { family: "'IBM Plex Mono', monospace", size: 11, weight: '700' },
          { family: "'IBM Plex Mono', monospace", size: 9,  weight: '400' },
        ],
        padding: { x: 6, y: 3 },
        borderRadius: 4,
        borderColor: lineColor,
        borderWidth: 1,
      },
      enter({ element }) { element.options.borderWidth = lw + 1.5; },
      leave({ element }) { element.options.borderWidth = lw; },
    };
  });

  // Current price annotation (left side — no collision needed)
  annotations['current_price_line'] = {
    type: 'line',
    yMin: price, yMax: price,
    borderColor: col.current,
    borderWidth: 3,
    label: {
      display: true,
      content: [`▶ ${fmtPrice(price)}`, 'CURRENT PRICE'],
      position: 'start',
      xAdjust: 8,
      yAdjust: 0,
      backgroundColor: col.current,
      color: '#060a0f',
      font: [
        { family: "'IBM Plex Mono', monospace", size: 12, weight: '800' },
        { family: "'IBM Plex Mono', monospace", size: 9,  weight: '500' },
      ],
      padding: { x: 7, y: 4 },
      borderRadius: 4,
    },
  };

  // ── Chart.js config ──────────────────────────────────────────────────────────
  const ctx2d = canvas.getContext('2d');

  _srChartInstance = new Chart(ctx2d, {
    type: 'scatter',
    data: {
      datasets: [{
        data: levels.map(lv => ({ x: 0.5, y: lv.price })),
        pointRadius: 0,
        pointHoverRadius: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400, easing: 'easeOutCubic' },
      layout: { padding: { right: 20, top: 10, bottom: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: isLight ? 'rgba(10,20,40,0.94)' : 'rgba(6,12,22,0.96)',
          titleColor: col.current,
          bodyColor: '#d0e2f0',
          borderColor: 'rgba(0,200,240,0.3)',
          borderWidth: 1,
          titleFont: { family: "'Syne', sans-serif", size: 13, weight: '700' },
          bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => {
              const lv = levels[items[0].dataIndex];
              return lv ? `${lv.label}  ${fmtPrice(lv.price)}` : '';
            },
            body: (items) => {
              const lv = levels[items[0].dataIndex];
              if (!lv) return '';
              const typeTag = lv.type === 'support' ? '🟢 Support' : lv.type === 'resistance' ? '🔴 Resistance' : '⚡ Current';
              return [
                `${typeTag}`,
                `Distance: ${lv.distPct >= 0 ? '+' : ''}${lv.distPct.toFixed(2)}%`,
                `Confluence: ${lv.confluence}× ${lv.confluence >= 3 ? '⭐ Major' : lv.confluence >= 2 ? '✅ Strong' : ''}`,
                lv.source === 'pivot' ? 'Source: Pivot Point' : 'Source: Manual Level',
              ];
            },
          },
        },
        annotation: { annotations },
        // Crosshair-style hover line
        crosshair: false,
      },
      scales: {
        x: {
          type: 'linear', min: 0, max: 1,
          display: false,
          grid: { display: false },
        },
        y: {
          type: 'linear', min: yMin, max: yMax,
          position: 'left',
          grid: {
            display: true,
            color: col.gridLine,
            drawTicks: false,
            lineWidth: 1,
          },
          border: { display: false, dash: [4, 3] },
          ticks: {
            color: col.axisText,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            maxTicksLimit: 10,
            padding: 8,
            callback: (v) => fmtPrice(v),
          },
        },
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
        axis: 'y',
      },
      onHover: (event, elements, chart) => {
        chart.canvas.style.cursor = elements.length ? 'crosshair' : 'default';
      },
    },
    plugins: [{
      // Subtle horizontal hover crosshair
      id: 'srHoverLine',
      afterDraw(chart) {
        const { ctx: c, chartArea: area, scales: { y } } = chart;
        const meta = chart.getDatasetMeta(0);
        if (!meta._parsed) return;
        // Draw a faint horizontal guide when hovering
        if (chart._hoverY != null) {
          c.save();
          c.strokeStyle = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
          c.lineWidth = 1;
          c.setLineDash([4, 4]);
          c.beginPath();
          c.moveTo(area.left, chart._hoverY);
          c.lineTo(area.right, chart._hoverY);
          c.stroke();
          // Price tag on axis
          const pVal = y.getValueForPixel(chart._hoverY);
          c.fillStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)';
          c.fillRect(0, chart._hoverY - 8, area.left - 2, 16);
          c.fillStyle = col.axisText;
          c.font = "9px 'IBM Plex Mono', monospace";
          c.textAlign = 'right';
          c.fillText(fmtPrice(pVal), area.left - 5, chart._hoverY + 3);
          c.restore();
        }
      },
      beforeEvent(chart, args) {
        const e = args.event;
        if (e.type === 'mousemove') {
          chart._hoverY = e.y;
          chart.draw();
        } else if (e.type === 'mouseout') {
          chart._hoverY = null;
          chart.draw();
        }
      },
    }],
  });
}

function renderSRAnalysis(price, levels) {
const supports = levels.filter(l => l.type === 'support').sort((a, b) => b.price - a.price);
const resistances = levels.filter(l => l.type === 'resistance').sort((a, b) => a.price - b.price);
const strongZones = levels.filter(l => l.confluence >= 2).sort((a, b) => a.price - b.price);
const majorZones = levels.filter(l => l.confluence >= 3);
const ns = supports[0], nr = resistances[0];
const rr = ns && nr ? Math.abs(nr.distPct) / Math.abs(ns.distPct) : null;
const reversalZones = strongZones.filter(l => Math.abs(l.distPct) <= 5);

// Decision: are we near a major reversal zone?
const isBullishReversal = reversalZones.some(z => z.type === 'support');
const isBearishReversal = reversalZones.some(z => z.type === 'resistance');

let adviceHtml = '';
if (majorZones.some(z => z.type === 'support' && Math.abs(z.distPct) <= 4)) {
const z = majorZones.find(zz => zz.type === 'support' && Math.abs(zz.distPct) <= 4);
adviceHtml = `<div class="advice-box green">🔄 <strong>Bullish Reversal Zone:</strong> Major confluence support at ${fmtPrice(z.price)} (${z.distPct.toFixed(2)}%) — ${z.confluence} levels converging. Strong bounce area. Look for bullish confirmation candles (hammer, bullish engulfing) before entering.</div>`;
} else if (majorZones.some(z => z.type === 'resistance' && Math.abs(z.distPct) <= 4)) {
const z = majorZones.find(zz => zz.type === 'resistance' && Math.abs(zz.distPct) <= 4);
adviceHtml = `<div class="advice-box red">🔄 <strong>Bearish Reversal Zone:</strong> Major confluence resistance at ${fmtPrice(z.price)} (+${z.distPct.toFixed(2)}%) — ${z.confluence} levels converging. High rejection risk. Consider reducing or taking profits near this zone.</div>`;
} else if (isBullishReversal) {
adviceHtml = `<div class="advice-box yellow">🟡 <strong>Potential Support Cluster:</strong> Multiple levels near current price below — watch for bounce confirmation signals.</div>`;
} else if (isBearishReversal) {
adviceHtml = `<div class="advice-box yellow">🟡 <strong>Potential Resistance Cluster:</strong> Multiple levels near current price above — price may face selling pressure soon.</div>`;
}

const statCard = (icon, label, val, cls, sub) => `
<div class="sr-stat-card">
<div class="sr-stat-icon">${icon}</div>
<div class="sr-stat-label">${label}</div>
<div class="sr-stat-value ${cls}">${val}</div>
<div class="sr-stat-sub">${sub}</div>
</div>`;

let html = '<div class="card"><div class="card-hdr"><span class="ci sr-ci">◎</span> Zone Analysis</div><div class="card-body">';
html += '<div class="sr-stat-grid">';
html += statCard('🟢', 'Nearest Support', ns ? fmtPrice(ns.price) : '—', 'green', ns ? `${ns.label} · ${ns.distPct.toFixed(2)}%` : 'None below');
html += statCard('🔴', 'Nearest Resistance', nr ? fmtPrice(nr.price) : '—', 'red', nr ? `${nr.label} · +${nr.distPct.toFixed(2)}%` : 'None above');
const rrCls = rr == null ? 'dim' : rr >= 2 ? 'green' : rr >= 1.2 ? 'yellow' : 'red';
const rrLabel = rr == null ? 'N/A' : rr >= 2 ? 'Excellent' : rr >= 1.2 ? 'Acceptable' : 'Poor — skip';
html += statCard('⚖️', 'R:R Ratio', rr ? '1 : ' + rr.toFixed(2) : '—', rrCls, rrLabel);
html += statCard('⚡', 'Confluence Zones', strongZones.length.toString(), strongZones.length > 0 ? 'yellow' : 'dim', majorZones.length > 0 ? `${majorZones.length} major zone(s)` : 'No major zones');
html += '</div>';

if (adviceHtml) html += adviceHtml;

// Strong zones table
if (strongZones.length > 0) {
html += '<div class="sr-zones-table"><div class="sec-label" style="margin:.7rem 0 .4rem">⚡ Confluence Zone Breakdown</div>';
html += '<div class="sr-zones-hdr"><span>Type</span><span>Price</span><span>Label</span><span>Dist %</span><span>Strength</span></div>';
strongZones.forEach(z => {
const typeStr = z.type === 'support' ? 'SUPPORT' : z.type === 'resistance' ? 'RESIST' : 'AT PRICE';
const typeCls = z.type === 'support' ? 'green' : z.type === 'resistance' ? 'red' : 'accent';
const strengthStr = z.confluence >= 3 ? '◈ MAJOR' : '⚡ Strong';
const strengthCls = z.confluence >= 3 ? 'yellow' : 'accent';
html += `<div class="sr-zones-row">
<span class="sr-type-badge ${typeCls}">${typeStr}</span>
<span style="color:var(--text)">${fmtPrice(z.price)}</span>
<span style="color:var(--dim)">${z.label}</span>
<span style="color:${z.distPct < 0 ? 'var(--green)' : 'var(--red)'}">${(z.distPct >= 0 ? '+' : '') + z.distPct.toFixed(2)}%</span>
<span class="${strengthCls}">${strengthStr} (${z.confluence}×)</span>
</div>`;
});
html += '</div>';
}

html += '</div></div>';
const el = $('sr-analysis-content');
if (el) el.innerHTML = html;
}

function renderSRBarChart(price, levels) {
const el = $('sr-bar-chart');
if (!el || levels.length === 0) return;

// Sort by distance
const sorted = [...levels].sort((a, b) => a.distPct - b.distPct);
const maxAbs = Math.max(...sorted.map(l => Math.abs(l.distPct)), 0.01);

let html = '<div class="sr-barchart">';
sorted.forEach(lv => {
const pct = lv.distPct;
const barPct = Math.min(Math.abs(pct) / maxAbs * 100, 100);
const isSup = lv.type === 'support', isRes = lv.type === 'resistance';
const color = lv.confluence >= 3 ? 'var(--yellow)' : isSup ? 'var(--green)' : isRes ? 'var(--red)' : 'var(--accent)';
const dir = pct < 0 ? 'left' : 'right';
const pctLabel = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';

html += `<div class="sr-bar-row">
<div class="sr-bar-label">${lv.label}</div>
<div class="sr-bar-track">
<div class="sr-bar-center-line"></div>
<div class="sr-bar-fill-${dir}" style="width:${barPct / 2}%;background:${color};opacity:${lv.confluence >= 2 ? 1 : 0.55}"></div>
</div>
<div class="sr-bar-price">${fmtPrice(lv.price)}</div>
<div class="sr-bar-pct" style="color:${color}">${pctLabel}</div>
</div>`;
});
html += '</div>';
el.innerHTML = html;
}

function importMAtoSR() {
const fields = [
{ id: 'ma-ma5', label: 'MA5' }, { id: 'ma-ma20', label: 'MA20' },
{ id: 'ma-ma50', label: 'MA50' }, { id: 'ma-ma200', label: 'MA200' },
{ id: 'ma-bbu', label: 'BB Upper' }, { id: 'ma-bbl', label: 'BB Lower' },
{ id: 'ma-st', label: 'Supertrend' },
];
const p = num('ma-price');
if (p) { const el = $('sr-price'); if (el) el.value = p; }
let idx = 1;
fields.forEach(f => {
const v = num(f.id);
if (v != null && idx <= 8) {
const lv = $(`sr-lv${idx}`); const lb = $(`sr-lb${idx}`);
if (lv) lv.value = v; if (lb) lb.value = f.label;
idx++;
}
});
srCalc();
}

function importEMAtoSR() {
const fields = [
{ id: 'ema-ema8', label: 'EMA8' }, { id: 'ema-ema21', label: 'EMA21' },
{ id: 'ema-ema55', label: 'EMA55' }, { id: 'ema-ema200', label: 'EMA200' },
];
const p = num('ema-price');
if (p) { const el = $('sr-price'); if (el) el.value = p; }
let idx = 1;
fields.forEach(f => {
const v = num(f.id);
if (v != null && idx <= 8) {
const lv = $(`sr-lv${idx}`); const lb = $(`sr-lb${idx}`);
if (lv) lv.value = v; if (lb) lb.value = f.label;
idx++;
}
});
srCalc();
}

function resetSR() {
['sr-price', 'sr-ph', 'sr-pl', 'sr-pc'].forEach(id => { const el = $(id); if (el) el.value = ''; });
for (let i = 1; i <= 8; i++) {
const lv = $(`sr-lv${i}`); const lb = $(`sr-lb${i}`);
if (lv) lv.value = ''; if (lb) lb.value = '';
}
for (let i = 1; i <= 4; i++) {
const vp = $(`sr-vp${i}`); const vt = $(`sr-vp-t${i}`);
if (vp) vp.value = ''; if (vt) vt.value = '';
}
const pivot = $('sr-pivot-results'); if (pivot) pivot.style.display = 'none';
[$('sr-chart-wrap'), $('sr-analysis-wrap'), $('sr-bar-wrap')].forEach(el => { if (el) el.style.display = 'none'; });
}

/* ═══════════════════════════════════════════════════════
   MTF MOMENTUM HEATMAP ENGINE
═══════════════════════════════════════════════════════ */
const MTF_TFS = ['15m','1H','4H','D'];
const MTF_TF_LABELS = { '15m':'15 Min','1H':'1 Hour','4H':'4 Hour','D':'Daily' };
const MTF_TF_COLORS = { '15m':'#00c8f0','1H':'#00e87a','4H':'#f5c842','D':'#ff7043' };
const MTF_ROWS = ['rsi','adx','macd','ema','vwap','kdj'];
const MTF_ROW_LABELS = { rsi:'RSI14', adx:'ADX14', macd:'MACD', ema:'EMA Stack', vwap:'Vs VWAP', kdj:'KDJ' };

function scoreMTFCell(row, val) {
if (val == null || val === '') return null;
switch(row) {
case 'rsi': {
const v = parseFloat(val);
if (isNaN(v)) return null;
if (v >= 50 && v <= 70) return { s:2, label:'Bullish', color:'#00e87a' };
if (v > 70 && v <= 80)  return { s:1, label:'OB',      color:'#f5c842' };
if (v > 80)             return { s:0, label:'Ext OB',   color:'#f03a4a' };
if (v >= 40 && v < 50)  return { s:1, label:'Neutral',  color:'#f5c842' };
return { s:0, label:'Weak', color:'#f03a4a' };
}
case 'adx': {
const v = parseFloat(val);
if (isNaN(v)) return null;
if (v > 50)  return { s:2, label:'Surge',  color:'#00c8f0' };
if (v > 28)  return { s:2, label:'Strong', color:'#00e87a' };
if (v > 20)  return { s:1, label:'Dev',    color:'#f5c842' };
if (v > 15)  return { s:1, label:'Weak',   color:'#ff7043' };
return { s:0, label:'Range', color:'#f03a4a' };
}
case 'macd':
if (val === 'cross_bull') return { s:2, label:'Cross ↑', color:'#00c8f0' };
if (val === 'bull')       return { s:2, label:'Bull ▲',  color:'#00e87a' };
if (val === 'cross_bear') return { s:0, label:'Cross ↓', color:'#ff7043' };
if (val === 'bear')       return { s:0, label:'Bear ▼',  color:'#f03a4a' };
return null;
case 'ema':
if (val === 'bull')    return { s:2, label:'Full Bull', color:'#00e87a' };
if (val === 'partial') return { s:1, label:'Partial',   color:'#f5c842' };
if (val === 'bear')    return { s:0, label:'Bear',      color:'#f03a4a' };
return null;
case 'vwap':
if (val === 'above') return { s:2, label:'Above ✅', color:'#00e87a' };
if (val === 'below') return { s:0, label:'Below 🔴', color:'#f03a4a' };
return null;
case 'kdj':
if (val === 'bull') return { s:2, label:'K>D Bull', color:'#00e87a' };
if (val === 'os')   return { s:2, label:'Oversold', color:'#00c8f0' };
if (val === 'ob')   return { s:1, label:'Overbought', color:'#f5c842' };
if (val === 'bear') return { s:0, label:'K<D Bear', color:'#f03a4a' };
return null;
}
return null;
}

function mtfCalc() {
// Build data matrix
const matrix = {};
let anyData = false;
MTF_TFS.forEach(tf => {
matrix[tf] = {};
MTF_ROWS.forEach(row => {
const el = $(`mtf-${row}-${tf}`);
const val = el ? (el.tagName === 'SELECT' ? el.value : el.value.trim()) : '';
matrix[tf][row] = val || null;
if (val) anyData = true;
});
});

const result = $('mtf-result');
if (!anyData) { if(result) result.style.display = 'none'; return; }
if(result) result.style.display = '';

// Score each TF
const tfScores = {};
MTF_TFS.forEach(tf => {
let total = 0, max = 0, count = 0;
MTF_ROWS.forEach(row => {
const val = matrix[tf][row];
if (val == null) return;
const sc = scoreMTFCell(row, val);
if (!sc) return;
total += sc.s;
max += 2;
count++;
});
tfScores[tf] = { pct: max > 0 ? (total / max) * 100 : 0, count };
});

// Compute overall alignment
const filledTFs = MTF_TFS.filter(tf => tfScores[tf].count > 0);
const avgScore = filledTFs.length > 0
? filledTFs.reduce((a,tf) => a + tfScores[tf].pct, 0) / filledTFs.length
: 0;

// Check alignment (all filled TFs bullish/bearish)
const bullishTFs  = filledTFs.filter(tf => tfScores[tf].pct >= 60).length;
const bearishTFs  = filledTFs.filter(tf => tfScores[tf].pct <= 35).length;
const conflictTFs = filledTFs.length - bullishTFs - bearishTFs;
const fullyAligned = bullishTFs === filledTFs.length && filledTFs.length >= 2;
const fullyBearish = bearishTFs === filledTFs.length && filledTFs.length >= 2;

let decision, riskLevel;
if (fullyAligned && avgScore >= 75)      { decision = 'FULL ALIGNMENT ✅'; riskLevel = 'Low Risk'; }
else if (fullyAligned && avgScore >= 60) { decision = 'PROCEED';           riskLevel = 'Low Risk'; }
else if (fullyBearish)                   { decision = 'SKIP — BEARISH';    riskLevel = 'High Risk'; }
else if (conflictTFs > 0 && bearishTFs > 0) { decision = 'CONFLICT ⚠️';   riskLevel = 'High Risk'; }
else if (avgScore >= 55)                 { decision = 'WATCH';             riskLevel = 'Medium Risk'; }
else                                     { decision = 'SKIP';              riskLevel = 'High Risk'; }

const dClass = decision.includes('ALIGNMENT') || decision === 'PROCEED' ? 'proceed'
: decision.includes('SKIP') || decision.includes('BEAR') ? 'skip' : 'watch';
const strip = $('mtf-decision-strip');
if (strip) strip.className = `decision-strip ${dClass}`;
const badge = $('mtf-d-badge');
if (badge) { badge.className = `d-badge ${dClass}`; badge.textContent = decision; }
const rp = $('mtf-risk-pill');
if (rp) {
rp.className = `risk-pill ${riskLevel.includes('Low') ? 'risk-low' : riskLevel.includes('High') ? 'risk-high' : 'risk-medium'}`;
rp.textContent = riskLevel;
}
const meta = $('mtf-d-meta');
if (meta) meta.innerHTML = `
<div>Avg Score: <span style="color:var(--accent)">${avgScore.toFixed(0)}/100</span>
&nbsp; Bullish TFs: <span style="color:var(--green)">${bullishTFs}</span>
&nbsp; Bearish TFs: <span style="color:var(--red)">${bearishTFs}</span>
&nbsp; Conflicts: <span style="color:var(--yellow)">${conflictTFs}</span></div>`;

const adv = $('mtf-advice');
if (adv) {
if (fullyAligned) {
adv.textContent = `✅ All ${filledTFs.length} timeframes aligned bullish — this is a high-conviction setup. Momentum is stacked. Enter on pullback to nearest EMA with tight ATR-based stop. Use your primary trade TF to time entry.`;
adv.className = 'advice-box green';
} else if (fullyBearish) {
adv.textContent = `🔴 All timeframes bearish — do not buy. Wait for at least Daily timeframe to turn bullish before considering long entries. Bearish alignment is a strong signal to stay flat.`;
adv.className = 'advice-box red';
} else if (conflictTFs > 0) {
const conflictList = filledTFs.filter(tf => tfScores[tf].pct > 35 && tfScores[tf].pct < 60).map(tf => MTF_TF_LABELS[tf]).join(', ');
adv.textContent = `⚠️ Timeframe conflict detected (${conflictList} undecided). Do NOT enter until higher timeframes align. Conflicting MTF is the #1 cause of false breakout trades. Wait for 4H + Daily to confirm bullish before using 15m entries.`;
adv.className = 'advice-box yellow';
} else {
adv.textContent = `⚠️ Partial alignment. Score ${avgScore.toFixed(0)}/100. Reduce position size to 50% or wait for remaining timeframes to confirm.`;
adv.className = 'advice-box yellow';
}
}

drawMTFHeatmap(matrix, tfScores);
renderMTFScoreCards(tfScores);
renderMTFConfluence(matrix, tfScores, filledTFs, bullishTFs, bearishTFs);
}

function drawMTFHeatmap(matrix, tfScores) {
const canvas = $('mtf-heatmap-canvas');
if (!canvas) return;
const parent = canvas.parentElement;
const dpr = window.devicePixelRatio || 1;
const cssW = Math.min(parent.clientWidth - 8, 860);
const CELL_H = 36, TOP_H = 36, LEFT_W = 88, BOTTOM_H = 44;
const COLS = MTF_TFS.length, ROWS = MTF_ROWS.length;
const cellW = (cssW - LEFT_W) / COLS;
const cssH = TOP_H + ROWS * CELL_H + BOTTOM_H;
canvas.style.width = cssW + 'px';
canvas.style.height = cssH + 'px';
canvas.width = cssW * dpr;
canvas.height = cssH * dpr;
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

const tc = themeColors();
ctx.fillStyle = tc.bg;
ctx.fillRect(0, 0, cssW, cssH);

// Column headers
MTF_TFS.forEach((tf, ci) => {
const x = LEFT_W + ci * cellW;
ctx.fillStyle = MTF_TF_COLORS[tf] + '22';
ctx.fillRect(x, 0, cellW - 1, TOP_H);
ctx.fillStyle = MTF_TF_COLORS[tf];
ctx.font = `bold 13px 'Syne', sans-serif`;
ctx.textAlign = 'center';
ctx.fillText(tf, x + cellW/2, 16);
ctx.fillStyle = tc.dimLabel;
ctx.font = `9px 'IBM Plex Mono', monospace`;
ctx.fillText(MTF_TF_LABELS[tf], x + cellW/2, 28);
});

// Row labels + cells
MTF_ROWS.forEach((row, ri) => {
const y = TOP_H + ri * CELL_H;
// Row bg — alternating
ctx.fillStyle = ri % 2 === 0 ? tc.chartBg : tc.chartBg2;
ctx.fillRect(0, y, cssW, CELL_H);
// Row label
ctx.fillStyle = tc.dimLabel;
ctx.font = `10px 'IBM Plex Mono', monospace`;
ctx.textAlign = 'right';
ctx.fillText(MTF_ROW_LABELS[row], LEFT_W - 6, y + CELL_H/2 + 4);

MTF_TFS.forEach((tf, ci) => {
const x = LEFT_W + ci * cellW;
const val = matrix[tf][row];
const sc = val ? scoreMTFCell(row, val) : null;
if (sc) {
// Cell fill
const alpha = sc.s === 2 ? 0.28 : sc.s === 1 ? 0.14 : 0.20;
ctx.fillStyle = sc.color + Math.round(alpha * 255).toString(16).padStart(2,'0');
ctx.fillRect(x + 1, y + 2, cellW - 3, CELL_H - 4);
// Strength bar at bottom
ctx.fillStyle = sc.color;
ctx.fillRect(x + 2, y + CELL_H - 5, (cellW - 6) * (sc.s / 2), 3);
// Label
ctx.fillStyle = sc.color;
ctx.font = `bold 10px 'IBM Plex Mono', monospace`;
ctx.textAlign = 'center';
ctx.fillText(sc.label, x + cellW/2, y + CELL_H/2 + 4);
} else {
ctx.fillStyle = tc.candleBg;
ctx.fillRect(x+1, y+2, cellW-3, CELL_H-4);
ctx.fillStyle = tc.dimLabel2;
ctx.font = `10px 'IBM Plex Mono', monospace`;
ctx.textAlign = 'center';
ctx.fillText('—', x + cellW/2, y + CELL_H/2 + 4);
}
// Grid border
ctx.strokeStyle = tc.grid;
ctx.lineWidth = 1;
ctx.strokeRect(x, y, cellW, CELL_H);
});
});

// Bottom score bar for each TF
const scoreY = TOP_H + ROWS * CELL_H;
MTF_TFS.forEach((tf, ci) => {
const x = LEFT_W + ci * cellW;
const sc = tfScores[tf];
if (!sc || sc.count === 0) return;
const pct = sc.pct;
const barColor = pct >= 65 ? '#00e87a' : pct >= 45 ? '#f5c842' : '#f03a4a';
ctx.fillStyle = tc.chartBg2;
ctx.fillRect(x, scoreY, cellW, BOTTOM_H);
ctx.fillStyle = barColor;
ctx.font = `bold 14px 'Syne', sans-serif`;
ctx.textAlign = 'center';
ctx.fillText(`${pct.toFixed(0)}%`, x + cellW/2, scoreY + 18);
const barW = (cellW - 16) * (pct / 100);
ctx.fillStyle = tc.grid;
ctx.fillRect(x+8, scoreY+22, cellW-16, 6);
ctx.fillStyle = barColor;
ctx.shadowBlur = pct >= 65 ? 6 : 0; ctx.shadowColor = barColor;
ctx.fillRect(x+8, scoreY+22, barW, 6);
ctx.shadowBlur = 0;
ctx.fillStyle = tc.dimLabel;
ctx.font = `9px 'IBM Plex Mono', monospace`;
ctx.fillText(pct >= 65 ? 'BULLISH' : pct >= 45 ? 'NEUTRAL' : 'BEARISH', x + cellW/2, scoreY + 38);
});

// Left corner
ctx.fillStyle = tc.chartBg2;
ctx.fillRect(0, scoreY, LEFT_W, BOTTOM_H);
ctx.fillStyle = tc.dimLabel;
ctx.font = `9px 'IBM Plex Mono', monospace`;
ctx.textAlign = 'right';
ctx.fillText('TF Score', LEFT_W - 6, scoreY + 18);
}

function renderMTFScoreCards(tfScores) {
const el = $('mtf-score-row');
if (!el) return;
el.innerHTML = MTF_TFS.map(tf => {
const sc = tfScores[tf];
if (!sc || sc.count === 0) return '';
const pct = sc.pct;
const col = pct >= 65 ? 'var(--green)' : pct >= 45 ? 'var(--yellow)' : 'var(--red)';
const status = pct >= 65 ? 'BULLISH' : pct >= 45 ? 'NEUTRAL' : 'BEARISH';
return `<div class="mtf-score-card" style="border-color:${MTF_TF_COLORS[tf]}33">
<div class="mtf-sc-tf" style="color:${MTF_TF_COLORS[tf]}">${tf}</div>
<div class="mtf-sc-score" style="color:${col}">${pct.toFixed(0)}</div>
<div class="mtf-sc-label">/100</div>
<div class="mtf-sc-status" style="color:${col}">${status}</div>
</div>`;
}).join('');
}

function renderMTFConfluence(matrix, tfScores, filledTFs, bullishTFs, bearishTFs) {
const el = $('mtf-confluence-body');
if (!el) return;

// Find rows that are consistently bullish/bearish across all filled TFs
const rowSummary = MTF_ROWS.map(row => {
let bullCount = 0, bearCount = 0, neutralCount = 0, total = 0;
filledTFs.forEach(tf => {
const val = matrix[tf][row];
if (!val) return;
const sc = scoreMTFCell(row, val);
if (!sc) return;
total++;
if (sc.s === 2) bullCount++;
else if (sc.s === 0) bearCount++;
else neutralCount++;
});
return { row, bullCount, bearCount, neutralCount, total };
}).filter(r => r.total > 0);

const strongBull = rowSummary.filter(r => r.bullCount === r.total && r.total >= 2);
const strongBear = rowSummary.filter(r => r.bearCount === r.total && r.total >= 2);
const conflicts  = rowSummary.filter(r => r.bullCount > 0 && r.bearCount > 0);

let html = '<div class="mtf-conf-grid">';

html += `<div class="mtf-conf-block mtf-conf-bull">
<div class="mtf-conf-hdr">✅ All-TF Bullish Signals (${strongBull.length})</div>
${strongBull.length > 0
? strongBull.map(r => `<div class="mtf-conf-item">${MTF_ROW_LABELS[r.row]} — bullish on all ${r.total} timeframes</div>`).join('')
: '<div class="mtf-conf-item mtf-conf-dim">None confirmed yet</div>'}
</div>`;

html += `<div class="mtf-conf-block mtf-conf-bear">
<div class="mtf-conf-hdr">🔴 All-TF Bearish Signals (${strongBear.length})</div>
${strongBear.length > 0
? strongBear.map(r => `<div class="mtf-conf-item">${MTF_ROW_LABELS[r.row]} — bearish on all ${r.total} timeframes</div>`).join('')
: '<div class="mtf-conf-item mtf-conf-dim">None detected</div>'}
</div>`;

html += `<div class="mtf-conf-block mtf-conf-warn">
<div class="mtf-conf-hdr">⚠️ Conflict Rows (${conflicts.length})</div>
${conflicts.length > 0
? conflicts.map(r => `<div class="mtf-conf-item">${MTF_ROW_LABELS[r.row]} — ${r.bullCount} bull / ${r.bearCount} bear / ${r.neutralCount} neutral across TFs</div>`).join('')
: '<div class="mtf-conf-item mtf-conf-dim">No conflicts — good alignment</div>'}
</div>`;

// Best TF to trade
const bestTF = filledTFs.length > 0
? filledTFs.reduce((best, tf) => tfScores[tf].pct > tfScores[best].pct ? tf : best, filledTFs[0])
: null;

html += `<div class="mtf-conf-block mtf-conf-tip">
<div class="mtf-conf-hdr">💡 Trading Recommendation</div>
<div class="mtf-conf-item">${bullishTFs >= 3
? `Use <strong>${MTF_TF_LABELS['15m'] || '15m'}</strong> chart for entry timing — higher TFs all aligned bullish.`
: bullishTFs >= 2
? `Use <strong>${bestTF ? MTF_TF_LABELS[bestTF] : '1H'}</strong> chart — wait for 15m to confirm before entering.`
: `Wait — insufficient TF alignment. Do not force entry. Monitor for Daily + 4H to turn bullish first.`}
</div>
<div class="mtf-conf-item" style="margin-top:.3rem">MTF Rule: <strong>Higher TF = bias · Lower TF = entry timing</strong>. Never trade against the Daily trend.</div>
</div>`;

html += '</div>';
el.innerHTML = html;
}

function resetMTF() {
MTF_TFS.forEach(tf => {
MTF_ROWS.forEach(row => {
const el = $(`mtf-${row}-${tf}`);
if (el) el.value = '';
});
});
const result = $('mtf-result');
if (result) result.style.display = 'none';
}

function importBursaToMA() {
const map = [
['bu-price',  'ma-price'],
['bu-ma5',    'ma-ma5'],
['bu-ma20',   'ma-ma20'],
['bu-ma50',   'ma-ma50'],
['bu-ma200',  'ma-ma200'],
['bu-adx',    'ma-adx'],
['bu-atr',    'ma-atr'],
['bu-rsi',    'ma-rsi'],
['bu-k',      'ma-k'],
['bu-d',      'ma-d'],
['bu-j',      'ma-j'],
['bu-dif',    'ma-dif'],
['bu-dea',    'ma-dea'],
['bu-volratio','ma-vol'],
];
let copied = 0;
map.forEach(([from, to]) => {
const src = $(from), dst = $(to);
if (src && dst && src.value) { dst.value = src.value; copied++; }
});
if (copied === 0) {
alert('No Bursa data found. Please fill in the ETF tab first, then click Import.');
return;
}
switchTab('ma');
maCalc();
// Brief flash on MA tab to confirm
const card = document.querySelector('#panel-ma .card');
if (card) {
card.style.transition = 'box-shadow .4s';
card.style.boxShadow = '0 0 24px rgba(0,232,122,0.5)';
setTimeout(() => { card.style.boxShadow = ''; }, 900);
}
}

/* ═══════════════════════════════════════════════════════
   SMART MONEY DASHBOARD — DDNK METHOD
═══════════════════════════════════════════════════════ */

// ── Power Hour Countdown ────────────────────────────
function smGetNextWindow() {
const h     = getMYTHour();
const open  = getUSOpenHourMYT();
const close = getUSCloseHourMYT();
const prime_end   = open + 1.5;
const lull_end    = (open + 3.0) % 24;
const power_start = lull_end;

// Windows in order [start, end, label, color]
const wins = [
{ start: open,        end: prime_end,   name:'🎯 Prime Window',   cls:'sess-prime',  color:'#00c8f0' },
{ start: lull_end,    end: close,       name:'⚡ Power Hour',     cls:'sess-power',  color:'#f5c842' },
{ start: open - 4.0,  end: open,        name:'🔔 Pre-Market',     cls:'sess-pre',    color:'#ff7043' },
];

// Find current window or next one
function inWindow(s, e) {
if (s < e) return h >= s && h < e;
return h >= s || h < e; // crosses midnight
}
function hoursUntil(target) {
let diff = target - h;
if (diff < 0) diff += 24;
return diff;
}

for (const w of wins) {
if (inWindow(w.start, w.end)) {
const remaining = hoursUntil(w.end < w.start ? w.end + 24 : w.end);
return { ...w, mode:'active', hoursLeft: remaining, hoursUntil: 0 };
}
}
// Find soonest upcoming
let nearest = null, nearestH = 99;
for (const w of wins) {
const u = hoursUntil(w.start);
if (u < nearestH) { nearestH = u; nearest = w; }
}
return nearest ? { ...nearest, mode:'waiting', hoursLeft: 0, hoursUntil: nearestH } : null;
}

function smUpdateCountdown() {
const w = smGetNextWindow();
if (!w) return;
const el     = $('sm-countdown');
const elName = $('sm-countdown-name');
const elBar  = $('sm-countdown-bar');
if (!el) return;

const hoursRef = w.mode === 'active' ? w.hoursLeft : w.hoursUntil;
const totalH   = w.mode === 'active' ? (w.end < w.start ? w.end + 24 - w.start : w.end - w.start) : 24;
const pct      = w.mode === 'active' ? Math.max(0, (1 - hoursRef / totalH) * 100) : Math.max(0, (1 - hoursRef / totalH) * 100);

const h  = Math.floor(hoursRef);
const m  = Math.floor((hoursRef - h) * 60);
const s  = Math.floor(((hoursRef - h) * 60 - m) * 60);
const ts = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

el.textContent = ts;
el.style.color = w.color;
if (elName) {
elName.textContent = w.mode === 'active'
? `${w.name} — Time Remaining`
: `Until ${w.name}`;
elName.style.color = w.color;
}
if (elBar) {
elBar.style.width = (w.mode === 'active' ? pct : (1 - hoursRef/24)*100) + '%';
elBar.style.background = w.color;
}
}
setInterval(smUpdateCountdown, 1000);
smUpdateCountdown();

// ── Fear & Greed Arc ───────────────────────────────
function smDrawFGArc(val) {
const canvas = $('sm-fg-canvas');
if (!canvas) return;
const dpr = window.devicePixelRatio || 1;
canvas.width  = 110 * dpr;
canvas.height = 65 * dpr;
canvas.style.width  = '110px';
canvas.style.height = '65px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
const cx = 55, cy = 58, r = 44;

// Background arc
ctx.beginPath();
ctx.arc(cx, cy, r, Math.PI, 0, false);
ctx.lineWidth = 10;
ctx.strokeStyle = '#1a2b3c';
ctx.stroke();

// Gradient segments
const segs = [
{ from:0,   to:20,  color:'#f03a4a' },
{ from:20,  to:40,  color:'#ff7043' },
{ from:40,  to:60,  color:'#f5c842' },
{ from:60,  to:80,  color:'#00e87a' },
{ from:80,  to:100, color:'#00c8f0' },
];
segs.forEach(seg => {
const startA = Math.PI + (seg.from / 100) * Math.PI;
const endA   = Math.PI + (seg.to   / 100) * Math.PI;
ctx.beginPath();
ctx.arc(cx, cy, r, startA, endA, false);
ctx.lineWidth = 10;
ctx.strokeStyle = seg.color;
ctx.stroke();
});

if (val != null && !isNaN(val)) {
// Needle
const angle = Math.PI + (val / 100) * Math.PI;
const nx = cx + (r - 12) * Math.cos(angle);
const ny = cy + (r - 12) * Math.sin(angle);
ctx.beginPath();
ctx.moveTo(cx, cy);
ctx.lineTo(nx, ny);
ctx.lineWidth = 2.5;
ctx.shadowBlur = 6;
ctx.shadowColor = '#fff';
ctx.strokeStyle = '#fff';
ctx.stroke();
ctx.shadowBlur = 0;
// Center dot
ctx.beginPath();
ctx.arc(cx, cy, 4, 0, Math.PI*2);
ctx.fillStyle = '#fff';
ctx.fill();
// Value
ctx.fillStyle = '#fff';
ctx.font = `bold 13px 'Syne', sans-serif`;
ctx.textAlign = 'center';
ctx.fillText(Math.round(val), cx, cy - 14);
}
}

// ── Main smCalc ────────────────────────────────────
function smCalc() {
// Fear & Greed
const fg  = parseFloat($('sm-fg')?.value);
const fgLabel = $('sm-fg-label');
if (!isNaN(fg)) {
smDrawFGArc(fg);
const zones = [
[0,25,'Extreme Fear 😱','red'],
[25,45,'Fear 😟','orange'],
[45,55,'Neutral 😐','yellow'],
[55,75,'Greed 😏','green'],
[75,100,'Extreme Greed 🤑','accent'],
];
const z = zones.find(([lo,hi]) => fg >= lo && fg <= hi);
if (z && fgLabel) {
fgLabel.textContent = z[2];
fgLabel.className = `sm-fg-label ${z[3]}`;
}
} else {
smDrawFGArc(null);
}

// Put/Call
const pcr = parseFloat($('sm-pcr')?.value);
const pcrLabel = $('sm-pcr-label');
if (!isNaN(pcr) && pcrLabel) {
if (pcr > 1.2)       { pcrLabel.textContent = `${pcr.toFixed(2)} — Extreme Fear → Contrarian BUY signal`; pcrLabel.className = 'sm-pcr-label green'; }
else if (pcr > 0.9)  { pcrLabel.textContent = `${pcr.toFixed(2)} — Bearish sentiment → Caution`; pcrLabel.className = 'sm-pcr-label yellow'; }
else if (pcr > 0.7)  { pcrLabel.textContent = `${pcr.toFixed(2)} — Neutral`; pcrLabel.className = 'sm-pcr-label accent'; }
else                 { pcrLabel.textContent = `${pcr.toFixed(2)} — Complacency → Market may be overbought`; pcrLabel.className = 'sm-pcr-label red'; }
}

// Pre-Market Gap
const prevC  = parseFloat($('sm-prev-close')?.value);
const pmH    = parseFloat($('sm-pm-high')?.value);
const pmL    = parseFloat($('sm-pm-low')?.value);
const pmLast = parseFloat($('sm-pm-last')?.value);
const avgVol = parseFloat($('sm-avg-vol')?.value);
const pmVol  = parseFloat($('sm-pm-vol')?.value);
const gapEl  = $('sm-gap-result');

if (!isNaN(prevC) && !isNaN(pmLast) && gapEl) {
const gapPct    = ((pmLast - prevC) / prevC) * 100;
const isGapUp   = gapPct > 0;
const isGapDown = gapPct < 0;
const absGap    = Math.abs(gapPct);
const volRatio  = (!isNaN(avgVol) && !isNaN(pmVol) && avgVol > 0) ? (pmVol / avgVol) * 100 : null;
const gapRange  = (!isNaN(pmH) && !isNaN(pmL)) ? ((pmLast - pmL) / (pmH - pmL) * 100) : null;

let gapClass, gapLabel, advice;
if (absGap > 3)      { gapClass='red';    gapLabel='Large Gap — extreme move'; }
else if (absGap > 1) { gapClass='yellow'; gapLabel='Moderate Gap — tradeable'; }
else                 { gapClass='green';  gapLabel='Small Gap — normal open'; }

if (isGapUp)   advice = absGap > 2 ? '⚠️ Large gap up — wait for first 5-min candle to confirm direction before entering' : '✅ Gap up — bullish bias, enter on pullback to pre-mkt low';
else if (isGapDown) advice = absGap > 2 ? '🔴 Large gap down — avoid long entries, watch for gap fill attempt' : '⚠️ Gap down — wait for stabilisation above yesterday\'s low';
else advice = '📊 Flat open — no gap bias, follow MA stack direction';

gapEl.style.display = '';
gapEl.innerHTML = `
<div class="sm-gap-row">
<div class="sm-gap-stat"><div class="sm-gs-label">Gap %</div><div class="sm-gs-val ${gapClass}">${(isGapUp?'+':'')}${gapPct.toFixed(2)}%</div><div class="sm-gs-sub">${gapLabel}</div></div>
<div class="sm-gap-stat"><div class="sm-gs-label">Direction</div><div class="sm-gs-val ${isGapUp?'green':isGapDown?'red':'accent'}">${isGapUp?'▲ Gap Up':isGapDown?'▼ Gap Down':'◆ Flat'}</div><div class="sm-gs-sub">${isGapUp?'Bullish bias':'Bearish bias'}</div></div>
${volRatio!=null?`<div class="sm-gap-stat"><div class="sm-gs-label">Pre-Mkt Vol</div><div class="sm-gs-val ${volRatio>30?'green':volRatio>15?'yellow':'dim'}">${volRatio.toFixed(1)}%</div><div class="sm-gs-sub">of daily avg</div></div>`:''}
${gapRange!=null?`<div class="sm-gap-stat"><div class="sm-gs-label">Price in PM Range</div><div class="sm-gs-val accent">${gapRange.toFixed(0)}%</div><div class="sm-gs-sub">${gapRange>70?'Near PM High':gapRange<30?'Near PM Low':'Mid-range'}</div></div>`:''}
</div>
<div class="sm-gap-advice">${advice}</div>`;
} else if (gapEl) gapEl.style.display = 'none';

// Institutional Bias Score
smScoreBias(fg, pcr);
}

function smScoreBias(fg, pcr) {
const checks = [
$('smc-above-vwap')?.checked,
$('smc-pm-vol')?.checked,
$('smc-gap-dir')?.checked,
$('smc-dark-pool')?.checked,
$('smc-news')?.checked,
$('smc-sector')?.checked,
];
const score = checks.filter(Boolean).length;
const total = checks.length;

// Add sentiment bonus
let sentBonus = 0, sentNote = '';
if (!isNaN(fg)) {
if (fg <= 25)      { sentBonus = 2; sentNote = '+ Extreme Fear = contrarian bullish (+2)'; }
else if (fg <= 45) { sentBonus = 1; sentNote = '+ Fear zone = mild contrarian (+1)'; }
else if (fg >= 75) { sentBonus = -1; sentNote = '− Extreme Greed = caution (−1)'; }
}
if (!isNaN(pcr)) {
if (pcr > 1.2) { sentBonus += 1; sentNote += ' · High P/C = contrarian bull (+1)'; }
else if (pcr < 0.6) { sentBonus -= 1; sentNote += ' · Low P/C = complacency (−1)'; }
}

const finalScore = Math.max(0, Math.min(8, score + sentBonus));
const el = $('sm-bias-result');
if (!el) return;
el.style.display = '';

const cls = finalScore >= 6 ? 'green' : finalScore >= 4 ? 'yellow' : 'red';
const verdict = finalScore >= 6 ? '✅ HIGH CONVICTION — Institutional conditions aligned. Safe to enter with full planned size.'
: finalScore >= 4 ? '⚠️ MODERATE — Some institutional signals missing. Reduce position size by 25–50%.'
: '🔴 LOW — Institutional conditions weak. Do not enter. Wait for more checkboxes to pass.';

el.innerHTML = `
<div class="sm-bias-score-row">
<div class="sm-bias-score ${cls}">${finalScore}<span style="font-size:14px;font-weight:400">/8</span></div>
<div class="sm-bias-detail">
<div style="font-size:12px;font-weight:700;color:var(--text)">Institutional Bias Score</div>
<div style="font-size:10px;color:var(--dim);margin-top:.2rem">${score}/${total} checklist · ${sentNote || 'No sentiment data'}</div>
</div>
</div>
<div class="advice-box ${cls === 'green' ? 'green' : cls === 'yellow' ? 'yellow' : 'red'}" style="margin-top:.5rem;font-size:12px">${verdict}</div>`;
}

function smReset() {
['sm-fg','sm-pcr','sm-prev-close','sm-pm-high','sm-pm-low','sm-pm-last','sm-avg-vol','sm-pm-vol'].forEach(id => {
const el = $(id); if (el) el.value = '';
});
['smc-above-vwap','smc-pm-vol','smc-gap-dir','smc-dark-pool','smc-news','smc-sector'].forEach(id => {
const el = $(id); if (el) el.checked = false;
});
const gapEl = $('sm-gap-result'); if (gapEl) gapEl.style.display = 'none';
const biasEl = $('sm-bias-result'); if (biasEl) biasEl.style.display = 'none';
const fgLabel = $('sm-fg-label'); if (fgLabel) { fgLabel.textContent = 'CNN Fear & Greed (0–100)'; fgLabel.className = 'sm-fg-label'; }
const pcrLabel = $('sm-pcr-label'); if (pcrLabel) { pcrLabel.textContent = 'CBOE Total P/C ratio'; pcrLabel.className = 'sm-pcr-label'; }
smDrawFGArc(null);
}

function smToggle() {
const body = $('sm-body');
const btn  = $('sm-collapse-btn');
if (!body || !btn) return;
const hidden = body.style.display === 'none';
body.style.display = hidden ? '' : 'none';
btn.textContent = hidden ? '▲ Hide' : '▼ Show';
}

// Initialise arc on load
setTimeout(() => smDrawFGArc(null), 300);

// ── Volume Profile levels in srCalc ───────────────
// Patch into srCalc by extending getVPLevels
function srGetVPLevels() {
const result = [];
for (let i = 1; i <= 4; i++) {
const type = $(`sr-vp-t${i}`)?.value;
const price = parseFloat($(`sr-vp${i}`)?.value);
if (type && !isNaN(price)) {
result.push({ price, label: type, source: 'vp' });
}
}
return result;
}

function toggleRefGrid(btn) {
const grid = btn.nextElementSibling;
const isOpen = grid.classList.contains('open');
grid.classList.toggle('open', !isOpen);
btn.classList.toggle('open', !isOpen);
}

// Redraw SR canvas on resize / orientation change (Android)
let _srResizeTimer;
window.addEventListener('resize', () => {
clearTimeout(_srResizeTimer);
_srResizeTimer = setTimeout(() => { if ($('sr-canvas')) srCalc(); }, 180);
});
window.addEventListener('orientationchange', () => {
setTimeout(() => { if ($('sr-canvas')) srCalc(); }, 300);
});
/* ═══════════════════════════════════════════════════════
   SCREENSHOT AUTO-FILL — OCR ENGINE (Tesseract.js)
   Extracts Moomoo indicator values from uploaded image
═══════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────
const _imgFiles = {};   // tab → File object
let   _tessWorker = null;
let   _tessReady  = false;
let   _tessLoading = false;

// ── Field mapping per tab ─────────────────────────────
// Maps extracted indicator keys → input element IDs
const IMG_FIELD_MAP = {
	ma: {
		PRICE:    'ma-price',
		MA5:      'ma-ma5',    MA20:   'ma-ma20',
		MA50:     'ma-ma50',   MA200:  'ma-ma200',
		BB_UPPER: 'ma-bbu',    BB_LOWER:'ma-bbl',
		RSI:      'ma-rsi',
		K:        'ma-k',      D: 'ma-d',      J: 'ma-j',
		DIF:      'ma-dif',    DEA:'ma-dea',   HIST:'ma-hist',
		VOL_RATIO:'ma-vol',    ATR:'ma-atr',
		ADX:      'ma-adx',    PDI:'ma-pdi',   MDI:'ma-mdi',  ADXR:'ma-adxr',
	},
	ema: {
		PRICE:    'ema-price',
		EMA8:     'ema-ema8',  EMA21:'ema-ema21',
		EMA55:    'ema-ema55', EMA200:'ema-ema200',
		BB_UPPER: null,        BB_LOWER: null,
		RSI:      'ema-rsi',
		K:        'ema-k',     D:'ema-d',      J:'ema-j',
		DIF:      'ema-dif',   DEA:'ema-dea',  HIST:'ema-hist',
		VOL_RATIO:'ema-vol',   ATR:'ema-atr',
		ADX:      'ema-adx',   PDI:'ema-pdi',  MDI:'ema-mdi', ADXR:'ema-adxr',
		OPEN:     'ema-open',  PREV:'ema-prev',
		HIGH:     'ema-high',  LOW:'ema-low',
		HIGH52:   'ema-52h',   LOW52:'ema-52l',
		BETA:     'ema-beta',
	},
	gold: {
		PRICE:    'gold-price',
		EMA21:    'gold-e21',  EMA55:'gold-e55',  EMA200:'gold-e200',
		RSI:      'gold-rsi',
		K:        'gold-k',    D:'gold-d',         J:'gold-j',
		DIF:      'gold-dif',  DEA:'gold-dea',     HIST:'gold-hist',
		VOL_RATIO:'gold-vol',  ATR:'gold-atr',
		ADX:      'gold-adx',  PDI:'gold-pdi',     MDI:'gold-mdi',  ADXR:'gold-adxr',
	},
	bu: {
		PRICE:    'bu-price',
		MA5:      'bu-ma5',    MA20:'bu-ma20',  MA50:'bu-ma50',  MA200:'bu-ma200',
		RSI:      'bu-rsi',
		K:        'bu-k',      D:'bu-d',         J:'bu-j',
		DIF:      'bu-dif',    DEA:'bu-dea',     HIST:'bu-hist',
		VOL_RATIO:'bu-volratio', ATR:'bu-atr',
		ADX:      'bu-adx',    PDI:'bu-pdi',     MDI:'bu-mdi',   ADXR:'bu-adxr',
		OPEN:     'bu-open',   HIGH:'bu-high',   LOW:'bu-low',
		PREV:     'bu-prev',
	},
	sw: {
		PRICE:    'sw-price',
		MA5:      'sw-ma5',    MA20:'sw-ma20',  MA50:'sw-ma50',  MA200:'sw-ma200',
		RSI:      'sw-rsi',
		K:        'sw-k',      D:'sw-d',         J:'sw-j',
		DIF:      'sw-dif',    DEA:'sw-dea',     HIST:'sw-hist',
		ATR:      'sw-atr',
		ADX:      'sw-adx',    PDI:'sw-pdi',     MDI:'sw-mdi',   ADXR:'sw-adxr',
		OPEN:     'sw-open',   HIGH:'sw-high',   LOW:'sw-low',   CLOSE:'sw-close',
	},
};

// ── UI Helpers ────────────────────────────────────────
function tmToggleUpload(tab) {
	const body  = $(`img-body-${tab}`);
	const arrow = $(`img-arrow-${tab}`);
	if (!body) return;
	const open = body.style.display !== 'none' && body.style.display !== '';
	body.style.display  = open ? 'none' : '';
	if (arrow) arrow.textContent = open ? '▼' : '▲';
}

function tmImgSelected(tab, input) {
	const file = input?.files?.[0];
	if (!file) return;
	_imgFiles[tab] = file;

	const reader = new FileReader();
	reader.onload = e => {
		const thumb = $(`img-thumb-${tab}`);
		const fname = $(`img-fname-${tab}`);
		const prev  = $(`img-preview-${tab}`);
		const drop  = $(`img-drop-${tab}`);
		if (thumb) thumb.src = e.target.result;
		if (fname) fname.textContent = file.name;
		if (prev)  prev.style.display  = 'flex';
		if (drop)  drop.style.display  = 'none';
	};
	reader.readAsDataURL(file);
	tmSetImgStatus(tab, '');
}

function tmClearImage(tab) {
	_imgFiles[tab] = null;
	const thumb = $(`img-thumb-${tab}`);
	const prev  = $(`img-preview-${tab}`);
	const drop  = $(`img-drop-${tab}`);
	const fileInput = $(`img-file-${tab}`);
	if (thumb) thumb.src = '';
	if (prev)  prev.style.display  = 'none';
	if (drop)  drop.style.display  = '';
	if (fileInput) fileInput.value = '';
	tmSetImgStatus(tab, '');
}

function tmSetImgStatus(tab, html, type) {
	const el = $(`img-status-${tab}`);
	if (!el) return;
	if (!html) { el.style.display = 'none'; el.innerHTML = ''; return; }
	el.style.display = '';
	el.className = `img-status ${type || ''}`;
	el.innerHTML = html;
}

// ── Tesseract Initialisation (lazy) ──────────────────
async function tmInitTesseract() {
	if (_tessReady) return true;
	if (_tessLoading) {
		// Wait for existing init
		for (let i = 0; i < 60; i++) {
			await new Promise(r => setTimeout(r, 500));
			if (_tessReady) return true;
		}
		return false;
	}
	_tessLoading = true;
	try {
		const T = window.Tesseract;
		if (!T) throw new Error('Tesseract.js not loaded');
		_tessWorker = await T.createWorker('eng', 1, {
			logger: () => {},     // suppress logs
		});
		await _tessWorker.setParameters({
			tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,-:()/%+ ',
		});
		_tessReady  = true;
		_tessLoading = false;
		return true;
	} catch (e) {
		_tessLoading = false;
		console.error('Tesseract init failed:', e);
		return false;
	}
}

// ── Main extraction function ──────────────────────────
async function tmExtractFromImage(tab) {
	const file = _imgFiles[tab];
	if (!file) { tmSetImgStatus(tab, '⚠️ No image selected', 'warn'); return; }

	tmSetImgStatus(tab, '<span class="img-spin"></span> Initialising OCR engine… (first use downloads ~10MB, one-time only)', 'loading');

	const ok = await tmInitTesseract();
	if (!ok) {
		tmSetImgStatus(tab, '❌ OCR engine failed to load. Check internet connection and try again.', 'error');
		return;
	}

	tmSetImgStatus(tab, '<span class="img-spin"></span> Scanning image… extracting indicator values…', 'loading');

	try {
		// Convert file to data URL for Tesseract
		const dataUrl = await new Promise((res, rej) => {
			const r = new FileReader();
			r.onload  = e => res(e.target.result);
			r.onerror = rej;
			r.readAsDataURL(file);
		});

		const result = await _tessWorker.recognize(dataUrl);
		const text   = result?.data?.text || '';

		if (!text.trim()) {
			tmSetImgStatus(tab, '⚠️ Could not read text from image. Ensure the screenshot is clear and not cropped.', 'warn');
			return;
		}

		// Parse extracted values
		const values  = tmParseIndicators(text);
		const filled  = tmPopulateFromValues(tab, values);

		// Trigger calc
		const calcFn = { ma:'maCalc', ema:'emaCalc', gold:'goldCalc', bu:'bursaCalc', sw:'swingCalc' }[tab];
		if (calcFn && window[calcFn]) window[calcFn]();

		const total = Object.keys(values).length;
		if (filled === 0) {
			tmSetImgStatus(tab, `⚠️ No indicator values detected. Make sure your screenshot shows the chart indicator lines (MA, KDJ, MACD, DMI, ATR, RSI) with their labels and values visible.`, 'warn');
		} else {
			tmSetImgStatus(tab, `✅ Extracted ${filled} value${filled>1?'s':''} — Price, ${Object.keys(values).filter(k=>k!=='PRICE').join(', ')}. Review fields below and correct any errors before calculating.`, 'success');
		}
	} catch (err) {
		console.error('OCR error:', err);
		tmSetImgStatus(tab, `❌ Extraction failed: ${err.message}. Try a higher-resolution screenshot.`, 'error');
	}
}

// ── Regex Parser — Moomoo indicator format ─────────────
function tmParseIndicators(text) {
	const v = {};

	// ── Step 1: Normalise raw OCR text ───────────────────────────
	// Collapse newlines, fix common Tesseract digit↔letter misreads,
	// and strip Moomoo's inline annotation strings that break patterns.
	let t = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

	// FIX (MA5): Tesseract often reads digit "5" as letter "S" → "MAS:"
	// Also handles spaces inserted mid-token: "MA 5", "MA 20", "MA 200"
	t = t.replace(/\bMAS\b/g,    'MA5')
	     .replace(/\bMA\s+5\b/g,   'MA5')
	     .replace(/\bMA\s+20\b/g,  'MA20')
	     .replace(/\bMA\s+50\b/g,  'MA50')
	     .replace(/\bMA\s+200\b/g, 'MA200')
	     .replace(/\bEMA\s+(\d+)\b/g, 'EMA$1');

	// FIX (Volume Ratio): Moomoo injects "THIS IS VOLUME RATIO" annotation
	// text between the "Volume Ratio" label and its actual number value.
	// Strip it so the value sits directly after the label.
	t = t.replace(/THIS\s+IS\s+VOLUME\s+RATIO/gi, '')
	     .replace(/THIS\s+IS\s+MA[^\d]*/gi, '')
	     .replace(/\s+/g, ' '); // re-collapse any new double-spaces

	const grab = (pattern) => {
		const m = t.match(pattern);
		if (!m) return null;
		const n = parseFloat(m[1].replace(/,/g,''));
		return isNaN(n) ? null : n;
	};

	// ── Step 2: Price extraction ─────────────────────────────────
	// FIX (Price): Old regex used /^\s*.../ anchor — required the price to
	// be the very first character of OCR output. Moomoo screenshots always
	// start with the stock code + name header (e.g. "0208 GREATEC Trading
	// Apr 20 09:47:09") so the price was NEVER at position 0 → always null.
	//
	// Primary: find "2.170 +0.020 +0.93%" anywhere in the text
	const priceM = t.match(/\b(\d[\d,]*\.\d{2,4})\s+[+\-][\d.,]+\s+[+\-][\d.]+%/);
	if (priceM) {
		const pn = parseFloat(priceM[1].replace(/,/g,''));
		if (!isNaN(pn) && pn > 0) v.PRICE = pn;
	}
	// Fallback A: price sitting just before "High X.XXX" in same sentence
	if (!v.PRICE) {
		const pm2 = t.match(/\b(\d[\d,]*\.\d{2,4})\b(?=.{0,80}High\s+[\d.]+)/i);
		if (pm2) {
			const pn = parseFloat(pm2[1].replace(/,/g,''));
			if (!isNaN(pn) && pn > 0) v.PRICE = pn;
		}
	}
	// Fallback B: average of day High / Low (last resort)
	if (!v.PRICE) {
		const hm = t.match(/High\s+([\d.,]+)/i);
		const lm = t.match(/Low\s+([\d.,]+)/i);
		if (hm && lm) {
			const h = parseFloat(hm[1].replace(/,/g,'')), l = parseFloat(lm[1].replace(/,/g,''));
			if (!isNaN(h) && !isNaN(l) && h > l) v.PRICE = +((h + l) / 2).toFixed(4);
		}
	}

	// MA values: "MA MA5:16.484 MA20:15.523 MA50:15.450 MA200:15.119"
	// (normalisation above already corrected MAS→MA5 misreads)
	const ma5   = grab(/\bMA5[:\s]([\d.]+)/i);
	const ma20  = grab(/\bMA20[:\s]([\d.]+)/i);
	const ma50  = grab(/\bMA50[:\s]([\d.]+)/i);
	const ma200 = grab(/\bMA200[:\s]([\d.]+)/i);
	if (ma5)   v.MA5   = ma5;
	if (ma20)  v.MA20  = ma20;
	if (ma50)  v.MA50  = ma50;
	if (ma200) v.MA200 = ma200;

	// EMA values: "EMA EMA8:20.685 EMA21:19.904 EMA55:20.041 EMA200:23.430"
	const ema8   = grab(/EMA8[:\s]([\d.]+)/i);
	const ema21  = grab(/EMA21[:\s]([\d.]+)/i);
	const ema55  = grab(/EMA55[:\s]([\d.]+)/i);
	const ema200 = grab(/EMA200[:\s]([\d.]+)/i);
	if (ema8)   v.EMA8   = ema8;
	if (ema21)  v.EMA21  = ema21;
	if (ema55)  v.EMA55  = ema55;
	if (ema200) v.EMA200 = ema200;

	// BOLL: "BOLL(20,2) MID:19.496 UPPER:21.559 LOWER:17.434"
	const bbu = grab(/UPPER[:\s]([\d.]+)/i);
	const bbl = grab(/LOWER[:\s]([\d.]+)/i);
	if (bbu) v.BB_UPPER = bbu;
	if (bbl) v.BB_LOWER = bbl;

	// RSI: "RSI RSI11:68.797" or "RSI14:68.797" or "RSI:68.797"
	const rsi = grab(/RSI\d*[:\s]([\d.]+)/i);
	if (rsi) v.RSI = rsi;

	// KDJ: "KDJ(9,3,3) K:82.634 D:78.050 J:91.801"
	// Must extract from KDJ context to avoid grabbing K/D elsewhere
	const kdjM = t.match(/KDJ[^]*?K[:\s]([\d.]+)[^]*?D[:\s]([\d.]+)[^]*?J[:\s]([\d.]+)/i);
	if (kdjM) {
		const kv = parseFloat(kdjM[1]), dv = parseFloat(kdjM[2]), jv = parseFloat(kdjM[3]);
		if (!isNaN(kv)) v.K = kv;
		if (!isNaN(dv)) v.D = dv;
		if (!isNaN(jv)) v.J = jv;
	} else {
		// Fallback individual grabs
		const kk = grab(/ K[:\s]([\d.]+)/i);
		const dd = grab(/ D[:\s]([\d.]+)/i);
		const jj = grab(/ J[:\s]([\d.]+)/i);
		if (kk && kk <= 150) v.K = kk;
		if (dd && dd <= 150) v.D = dd;
		if (jj && jj <= 200) v.J = jj;
	}

	// MACD: "MACD(12,26,9) DIF:0.549 DEA:0.260 MACD:0.577"
	const dif  = grab(/DIF[:\s](-?[\d.]+)/i);
	const dea  = grab(/DEA[:\s](-?[\d.]+)/i);
	const hist = grab(/MACD[:\s](-?[\d.]+)/i);
	if (dif  != null) v.DIF  = dif;
	if (dea  != null) v.DEA  = dea;
	if (hist != null) v.HIST = hist;

	// Volume Ratio: after stripping "THIS IS VOLUME RATIO" annotation above,
	// the text should now read "Volume Ratio 1.72" and match cleanly.
	// Safety-net: also allow up to 60 non-numeric chars gap in case any
	// other annotation text appears between the label and value.
	const volRatio = (() => {
		let m = t.match(/Volume\s+Ratio[:\s]*([\d.]+)/i);
		if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n > 0 && n < 100) return n; }
		// Safety net — allow noise between label and number
		m = t.match(/Volume\s+Ratio[^0-9]{0,60}([\d.]+)/i);
		if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n > 0 && n < 100) return n; }
		m = t.match(/Vol\s*Ratio[^0-9]{0,60}([\d.]+)/i);
		if (m) { const n = parseFloat(m[1]); if (!isNaN(n) && n > 0 && n < 100) return n; }
		return null;
	})();
	if (volRatio) v.VOL_RATIO = volRatio;

	// ATR: "ATR ATR1:0.753" or "ATR:0.753"
	const atr = grab(/ATR\d*[:\s]([\d.]+)/i);
	if (atr) v.ATR = atr;

	// DMI: "DMI(14,6) PDI:50.215 MDI:6.618 ADX:46.380 ADXR:27.963"
	const dmiM = t.match(/DMI[^]*?PDI[:\s]([\d.]+)[^]*?MDI[:\s]([\d.]+)[^]*?ADX[:\s]([\d.]+)[^]*?ADXR[:\s]([\d.]+)/i);
	if (dmiM) {
		const pdi  = parseFloat(dmiM[1]);
		const mdi  = parseFloat(dmiM[2]);
		const adx  = parseFloat(dmiM[3]);
		const adxr = parseFloat(dmiM[4]);
		if (!isNaN(pdi))  v.PDI  = pdi;
		if (!isNaN(mdi))  v.MDI  = mdi;
		if (!isNaN(adx))  v.ADX  = adx;
		if (!isNaN(adxr)) v.ADXR = adxr;
	} else {
		// Fallback individual
		const pdi  = grab(/PDI[:\s]([\d.]+)/i);
		const mdi  = grab(/MDI[:\s]([\d.]+)/i);
		const adx  = grab(/\bADX[:\s]([\d.]+)/i);
		const adxr = grab(/ADXR[:\s]([\d.]+)/i);
		if (pdi)  v.PDI  = pdi;
		if (mdi)  v.MDI  = mdi;
		if (adx)  v.ADX  = adx;
		if (adxr) v.ADXR = adxr;
	}

	// OHLC from stock info area
	const open   = grab(/Open[:\s]*([\d.,]+)/i);
	const high   = grab(/High[:\s]*([\d.,]+)/i);
	const low    = grab(/Low[:\s]*([\d.,]+)/i);
	const prevC  = grab(/Prev\s*Close[:\s]*([\d.,]+)/i);
	const beta   = grab(/Beta[:\s]*([\d.]+)/i);
	const h52    = grab(/52.?w?k?\s*High[:\s]*([\d.,]+)/i);
	const l52    = grab(/52.?w?k?\s*Low[:\s]*([\d.,]+)/i);
	if (open)  v.OPEN   = open;
	if (high)  v.HIGH   = high;
	if (low)   v.LOW    = low;
	if (prevC) v.PREV   = prevC;
	if (beta)  v.BETA   = beta;
	if (h52)   v.HIGH52 = h52;
	if (l52)   v.LOW52  = l52;

	// Candle close (from "Prev Close" context fallback used for sw-close)
	// For swing tab — use the last price or close shown
	if (!v.CLOSE && v.PRICE) v.CLOSE = v.PRICE;

	return v;
}

// ── Populate fields from parsed values ────────────────
function tmPopulateFromValues(tab, values) {
	const map = IMG_FIELD_MAP[tab];
	if (!map) return 0;
	let filled = 0;

	Object.entries(map).forEach(([key, fieldId]) => {
		if (!fieldId || values[key] == null) return;
		const el = $(fieldId);
		if (!el) return;
		// Only fill if currently empty OR value clearly different (allow override)
		const current = el.value ? parseFloat(el.value) : null;
		const newVal  = values[key];
		// Round to match step precision
		const step    = parseFloat(el.step) || 0.0001;
		const decimals= step < 0.001 ? 4 : step < 0.01 ? 3 : step < 0.1 ? 2 : 1;
		el.value = newVal.toFixed(decimals);
		// Flash green to show which fields were filled
		el.classList.remove('img-field-filled');
		void el.offsetWidth;
		el.classList.add('img-field-filled');
		setTimeout(() => el.classList.remove('img-field-filled'), 3000);
		filled++;
	});

	return filled;
}
