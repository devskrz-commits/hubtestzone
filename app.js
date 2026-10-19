const DEFAULT_USER = "sportsbook2026";
const DEFAULT_PASS = "sb2026";
const isMobileDevice = () => window.innerWidth <= 850;
let rosterDb = null;

try {
  if (typeof firebase !== 'undefined') {
    const rosterFirebaseConfig = {
      apiKey: "AIzaSyCaEclzLI284lWCFk-vXbLSXa_bEZsXbOg",
      authDomain: "test-daily-task--sb.firebaseapp.com",
      databaseURL: "https://test-daily-task--sb-default-rtdb.firebaseio.com",
      projectId: "test-daily-task--sb"
    };
    if (!firebase.apps.length) firebase.initializeApp(rosterFirebaseConfig);
    rosterDb = firebase.database();
  }
} catch (e) { console.warn("Firebase offline.", e); }

let selectedGameDayOffset = 0;
let currentTraderFilter = 'ALL';
let primaryTimezone = 'Asia/Singapore';

function toggleMobileSidebar(forceState) {
  const sidebar = document.getElementById('mainSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  const isActive = forceState !== undefined ? forceState : !sidebar.classList.contains('mobile-open');
  if (isActive) { sidebar.classList.add('mobile-open'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; } 
  else { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); document.body.style.overflow = ''; }
}

const brandTabData = {
  ibet: [
    { name: "IBET ADMIN", url: "https://mga-betbook.center/ibet/bets" },
    { name: "IBET BETSSON", url: "https://b2b.betssonbusiness.com/" },
    { name: "BET CONSTRUCT", url: "https://backoffice.betconstruct.com/" }
  ],
  edge: [
    { name: "KT SBX", url: "https://p2ibet.sbx.bet/bets" },
    { name: "KT PROJECTS", url: "https://kickertech.atlassian.net/jira/projects" },
    { name: "EDGE ADMIN", url: "https://admin.edgegaming.io/admin/qbet/homepage" }
  ],
  pubs: [
    { name: "GO GAMING", url: "https://gg-backoffice-eu.gogaming.cc/en-US/member/list" }
  ]
};

function switchBrandTab(tabName) {
  document.querySelectorAll('.tab-pill').forEach(p => p.classList.remove('active'));
  const activePill = document.getElementById(`tab-${tabName}`);
  if (activePill) activePill.classList.add('active');
  const container = document.getElementById('brandLinksContainer');
  if (!container) return;
  container.innerHTML = '';
  const items = brandTabData[tabName] || [];
  items.forEach(item => {
    const a = document.createElement('a');
    a.className = 'action-row searchable-link'; a.href = item.url; a.target = '_blank';
    a.innerHTML = `<span>${item.name}</span><i class='bx bx-right-arrow-alt'></i>`;
    container.appendChild(a);
  });
}

function generateScriptedMarket(homeName, awayName, index) {
  const templates = [
    `${homeName} to Win + Over 2.5 Goals`,
    `${homeName} vs ${awayName} - Both Teams to Score`,
    `${homeName} to Win + Have 2+ Goals`,
    `${awayName} to Win or Draw + Over 1.5 Goals`,
    `${homeName} vs ${awayName} - Both Teams to Score + Over 2.5 Goals`,
    `${homeName} to Win First Half & Over 1.5 Goals`
  ];
  return templates[index % templates.length];
}

const PRIORITY_LEAGUES = [
  { rank: 1, key: "uefa.champions", name: "UEFA Champions League", code: "uefa.champions" },
  { rank: 2, key: "eng.1",          name: "Premier League",         code: "eng.1" },
  { rank: 3, key: "esp.1",          name: "La Liga",                code: "esp.1" },
  { rank: 4, key: "ita.1",          name: "Serie A",                code: "ita.1" },
  { rank: 5, key: "fra.1",          name: "Ligue 1",                code: "fra.1" },
  { rank: 6, key: "ger.1",          name: "Bundesliga",             code: "ger.1" },
  { rank: 7, key: "por.1",          name: "Primeira Liga",          code: "por.1" },
  { rank: 8, key: "ned.1",          name: "Eredivisie",             code: "ned.1" }
];
const SECONDARY_LEAGUES = [
  { name: "UEFA Nations League", code: "uefa.nations" },
  { name: "Major League Soccer", code: "usa.1" }
];

let cachedTopPicks = [];
let cachedLiveGames = [];
let currentFilterKey = 'eng.1';

function getLeagueDisplayName(key) {
  const lg = PRIORITY_LEAGUES.find(l => l.key === key);
  return lg ? lg.name : key.toUpperCase();
}

function loadCachedTopPicks() {
  try {
    const stored = localStorage.getItem('sbhub_toppicks_cache');
    if (stored) { cachedTopPicks = JSON.parse(stored); renderFilteredTopPicks(); updateNotifications(); }
  } catch (e) {}
}

async function fetchTopPicksAndBoosts() {
  try {
    const now = new Date();
    const seenMatchKeys = new Set();
    const targetDates = [getFormattedDateQuery(0), getFormattedDateQuery(1), getFormattedDateQuery(2), getFormattedDateQuery(3)];
    const fetchPromises = [];
    
    for (const league of PRIORITY_LEAGUES) {
      for (const dateStr of targetDates) {
        fetchPromises.push(
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dateStr}&limit=100`)
            .then(res => res.ok ? res.json() : null).then(data => ({ league, data })).catch(() => null)
        );
      }
    }

    const results = await Promise.all(fetchPromises);
    let apiPicks = [];

    for (const resItem of results) {
      if (!resItem || !resItem.data || !resItem.data.events) continue;
      const { league, data } = resItem;
      for (const evt of data.events) {
        const gameState = evt.status?.type?.state;
        const evtDate = new Date(evt.date);
        if (gameState !== 'pre' || evtDate <= now) continue;
        const comp = evt.competitions?.[0];
        if (!comp) continue;

        const homeTeam = comp.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = comp.competitors?.find(c => c.homeAway === 'away');
        if (homeTeam && awayTeam) {
          const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
          const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";
          const matchKey = evt.id || `${homeName}-${awayName}-${evt.date}`;
          if (seenMatchKeys.has(matchKey)) continue;
          seenMatchKeys.add(matchKey);

          const homeLogo = homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
          const awayLogo = awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href || "https://a.espncdn.com/i/teamlogos/soccer/500/default.png";
          const kickOffStr = new Intl.DateTimeFormat('en-GB', { timeZone: primaryTimezone, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(evtDate).toUpperCase();
          const scriptedMarket = generateScriptedMarket(homeName, awayName, apiPicks.length);

          apiPicks.push({
            leagueKey: league.key, leagueRank: league.rank, kickOffTimestamp: evtDate.getTime(),
            homeName, awayName, homeLogo, awayLogo, leagueName: data.leagues?.[0]?.name || league.name,
            market: scriptedMarket, badge: (apiPicks.length % 2 === 0) ? "TOP PICK" : "HOT", kickOff: kickOffStr
          });
        }
      }
    }

    apiPicks.sort((a, b) => { if (a.leagueRank !== b.leagueRank) return a.leagueRank - b.leagueRank; return a.kickOffTimestamp - b.kickOffTimestamp; });
    if (apiPicks.length > 0) { cachedTopPicks = apiPicks; localStorage.setItem('sbhub_toppicks_cache', JSON.stringify(apiPicks)); }
    renderFilteredTopPicks();
    updateNotifications();
  } catch (e) { console.error("Fetch Top Picks Error:", e); renderFilteredTopPicks(); }
}

function filterTopPicks(leagueKey, btnElement) {
  currentFilterKey = leagueKey;
  document.querySelectorAll('.boost-filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  else {
    const defaultBtn = document.getElementById(`btn-boost-${leagueKey}`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }
  renderFilteredTopPicks();
}

function renderFilteredTopPicks() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;
  const now = new Date();
  let displayPicks = cachedTopPicks.filter(pick => pick.kickOffTimestamp > now.getTime() && pick.leagueKey === currentFilterKey).slice(0, 12);

  if (displayPicks.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:25px; width:100%; font-size:12px; font-weight:800; color:rgba(255,255,255,0.65);">No upcoming scheduled matches available.</div>`;
    return;
  }

  let cardsHtml = "";
  displayPicks.forEach(pick => {
    const isTopPick = pick.badge === "TOP PICK";
    cardsHtml += `
      <div class="boost-card ${isTopPick ? 'highlight-border' : ''}">
        <div class="flags-row"><img src="${pick.homeLogo}" class="team-flag-img"><img src="${pick.awayLogo}" class="team-flag-img"></div>
        <div class="boost-match-info">
          <div class="boost-match-title">${pick.homeName} <span class="vs-light" style="margin:0 4px; font-weight:500; opacity:0.5;">vs</span> ${pick.awayName}</div>
          <div class="boost-league-sub">${pick.leagueName}</div>
          <div class="boost-market-desc">${pick.market}</div>
        </div>
        <div class="boost-card-bottom">
          <span class="boost-badge ${isTopPick ? 'top-pick' : 'hot'}">${pick.badge}</span>
          <div class="boost-kickoff-pill"><i class='bx bx-time-five'></i> ${pick.kickOff}</div>
        </div>
      </div>`;
  });
  container.innerHTML = cardsHtml;
}

/* REMINDERS SYSTEM */
function openCreateTaskModal() { document.getElementById('createTaskModal').classList.add('show'); }
function closeCreateTaskModal() { document.getElementById('createTaskModal').classList.remove('show'); }
function loadReminders() {
  const container = document.getElementById('remindersContainer');
  if(!container) return;
  const list = JSON.parse(localStorage.getItem('sbhub_reminders') || '[]');
  if(list.length === 0){ 
    container.innerHTML = '<span style="font-size:11px; color:rgba(255,255,255,0.7); padding:4px; text-align:center; display:block; font-weight:700;">No active tasks or reminders.</span>'; 
    return; 
  }
  container.innerHTML = list.map((r, i) => `
    <div class="reminder-item" style="border-left-color:${r.color};">
      <span>${r.title}</span>
      <i class="bx bx-trash" onclick="deleteReminder(${i})" title="Delete Reminder"></i>
    </div>
  `).join('');
}
function addReminder(e) {
  e.preventDefault();
  const title = document.getElementById('reminderTitleInput').value.trim();
  const color = document.getElementById('reminderColorInput').value;
  if(!title) return;
  const list = JSON.parse(localStorage.getItem('sbhub_reminders') || '[]');
  list.push({title, color});
  localStorage.setItem('sbhub_reminders', JSON.stringify(list));
  document.getElementById('reminderTitleInput').value = '';
  closeCreateTaskModal();
  loadReminders();
}
function deleteReminder(i) {
  const list = JSON.parse(localStorage.getItem('sbhub_reminders') || '[]');
  list.splice(i, 1);
  localStorage.setItem('sbhub_reminders', JSON.stringify(list));
  loadReminders();
}

/* SEARCH SYSTEM */
function handleGlobalSearch(query) {
  const dropdown = document.getElementById('searchResultsDropdown');
  if(!dropdown) return;
  if(!query || query.length < 2) { dropdown.classList.remove('show'); return; }
  const lowerQ = query.toLowerCase();
  const links = Array.from(document.querySelectorAll('.searchable-link'));
  const matches = links.filter(l => l.textContent.toLowerCase().includes(lowerQ));
  
  if(matches.length === 0) {
    dropdown.innerHTML = '<div style="padding:10px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.7); text-align:center;">No results</div>';
  } else {
    dropdown.innerHTML = matches.map(m => `<a href="${m.href}" target="_blank" class="search-result-item"><i class="bx bx-link"></i> ${m.textContent}</a>`).join('');
  }
  dropdown.classList.add('show');
}
document.addEventListener('click', e => {
  if(!e.target.closest('.utility-search-container')) {
    const dd = document.getElementById('searchResultsDropdown');
    if(dd) dd.classList.remove('show');
  }
});

/* NOTIFICATIONS SYSTEM */
function updateNotifications() {
  const menu = document.getElementById('notificationList');
  const badge = document.getElementById('notificationBadge');
  if(!menu || !badge) return;
  
  const now = new Date().getTime();
  const twoHours = 2 * 60 * 60 * 1000;
  
  let allUpcoming = [...cachedTopPicks, ...cachedLiveGames];
  const seen = new Set();
  const unique = [];
  allUpcoming.forEach(g => {
    const key = `${g.homeName}-${g.awayName}`;
    if(!seen.has(key)) { seen.add(key); unique.push(g); }
  });

  const soonGames = unique.filter(g => {
    const ts = g.kickOffTimestamp || new Date(g.kickOffTime || 0).getTime();
    return ts > now && ts < (now + twoHours);
  });

  if(soonGames.length === 0) {
    menu.innerHTML = '<div style="padding:15px; font-size:11px; font-weight:700; opacity:0.7; text-align:center;">No upcoming matches within 2 hrs.</div>';
    badge.textContent = '0';
    badge.style.display = 'none';
  } else {
    badge.textContent = soonGames.length;
    badge.style.display = 'block';
    menu.innerHTML = soonGames.map(g => {
      const timeStr = new Intl.DateTimeFormat('en-GB', { timeZone: primaryTimezone, hour:'2-digit', minute:'2-digit' }).format(new Date(g.kickOffTimestamp || g.kickOffTime));
      return `<div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); font-size:11px; font-weight:700; color:#fff;">
        <strong style="color:#38bdf8; margin-right:6px;">${timeStr}</strong> ${g.homeName} vs ${g.awayName}
      </div>`;
    }).join('');
  }
}

/* TIMEZONE & PROFILE */
function updatePrimaryTimezone(tz) {
  primaryTimezone = tz;
  const lbl = document.getElementById('lbl-clock-primary');
  if(lbl) lbl.textContent = tz.split('/')[1].replace('_',' ').toUpperCase();
  updateWorldClocks();
  fetchTopPicksAndBoosts(); 
  fetchLiveGames();
}

function updateWorldClocks() {
  const now = new Date();
  const pEl = document.getElementById('clock-primary');
  if (pEl) pEl.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: primaryTimezone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  
  const cetEl = document.getElementById('clock-cet');
  if (cetEl) cetEl.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);

  const gmt2El = document.getElementById('clock-gmt2');
  if (gmt2El) gmt2El.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
}
setInterval(updateWorldClocks, 1000);

/* API LOGIC (ESPN NO MOCKS) */
function getGMT8DateObj(offsetDays = 0) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: primaryTimezone }));
  now.setDate(now.getDate() + offsetDays);
  return now;
}

function getFormattedDateQuery(daysAhead) {
  const d = getGMT8DateObj(daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

async function fetchLiveGames() {
  const container = document.getElementById("gamesContainer");
  if (!container) return;
  container.innerHTML = `<div style="text-align:center; padding:15px;"><i class='bx bx-loader-alt bx-spin' style="font-size:20px; color:#38bdf8;"></i></div>`;
  
  try {
    const targetDateQuery = getFormattedDateQuery(selectedGameDayOffset);
    const targetDateObj = getGMT8DateObj(selectedGameDayOffset);
    const dateLabelStr = targetDateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
    
    let dayTag = `DAY ${selectedGameDayOffset + 1}`;
    if (selectedGameDayOffset === 0) dayTag = `TODAY (${dateLabelStr})`;

    const labelEl = document.getElementById("matchDayDisplay");
    if (labelEl) labelEl.textContent = `${dayTag}`;

    let matches = await fetchLeagueList(PRIORITY_LEAGUES, targetDateQuery);

    if (matches.length < 10) {
      const secondaryMatches = await fetchLeagueList(SECONDARY_LEAGUES, targetDateQuery);
      const seenMatchKeys = new Set(matches.map(m => `${m.homeName}-${m.awayName}`));
      for (const sm of secondaryMatches) {
        const key = `${sm.homeName}-${sm.awayName}`;
        if (!seenMatchKeys.has(key)) { seenMatchKeys.add(key); matches.push(sm); }
      }
    }

    cachedLiveGames = matches; 

    if (matches.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.65);">No scheduled fixtures.</div>`;
      updateNotifications();
      return;
    }

    let gamesHtml = "";
    matches.slice(0, 10).forEach(item => { 
      gamesHtml += `
        <div class="top-game-card">
          <div style="font-size:16px; color:#38bdf8;"><i class="bx bx-football"></i></div>
          <div class="top-game-title">${item.homeName} <span class="vs-light" style="margin:0 4px; font-weight:600; opacity:0.5;">vs</span> ${item.awayName}</div>
          <div class="top-game-league">${item.leagueName}${item.kickOffTimeStr ? ' &bull; <span style="color:#38bdf8;">' + item.kickOffTimeStr + '</span>' : ''}</div>
        </div>
      `;
    });
    container.innerHTML = gamesHtml;
    updateNotifications();

  } catch (e) {
    container.innerHTML = `<div style="text-align:center; padding:10px; font-size:11px; color:#f87171;">Failed to fetch live fixture data.</div>`;
  }
}

async function fetchLeagueList(leagueList, dateQuery) {
  const fetchPromises = leagueList.map(l =>
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${l.code}/scoreboard?dates=${dateQuery}&limit=100`)
      .then(res => res.ok ? res.json() : null).then(data => data ? { code: l.code, defaultName: l.name, data } : null).catch(() => null)
  );

  const results = await Promise.all(fetchPromises);
  let matches = [];
  const seenMatchKeys = new Set();

  for (const item of results) {
    if (!item || !item.data || !item.data.events) continue;
    for (const evt of item.data.events) {
      if (matches.length >= 15) break;
      const comp = evt.competitions?.[0];
      if (!comp) continue;

      if(evt.status?.type?.state === 'post') continue;

      const homeTeam = comp.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = comp.competitors?.find(c => c.homeAway === 'away');

      if (homeTeam && awayTeam) {
        const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
        const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

        const matchKey = `${homeName}-${awayName}`;
        if (seenMatchKeys.has(matchKey)) continue;
        seenMatchKeys.add(matchKey);

        let kickOffTimeStr = "";
        let kickOffTimestamp = 0;
        if (evt.date || comp.date) {
          const dObj = new Date(evt.date || comp.date);
          kickOffTimestamp = dObj.getTime();
          kickOffTimeStr = new Intl.DateTimeFormat('en-GB', { timeZone: primaryTimezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(dObj);
        }

        matches.push({
          homeName, awayName,
          leagueName: item.data.leagues?.[0]?.name || item.defaultName,
          kickOffTimeStr, kickOffTimestamp
        });
      }
    }
  }
  return matches;
}

function navigateMatchDay(dir) {
  selectedGameDayOffset += dir;
  if (selectedGameDayOffset < 0) selectedGameDayOffset = 6;
  if (selectedGameDayOffset > 6) selectedGameDayOffset = 0;
  fetchLiveGames();
}

/* UI LOGIC & TOGGLES */
function toggleDropdown(menuId) {
  const menu = document.getElementById(menuId);
  const isShowing = menu.classList.contains('show');
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  if(!isShowing) menu.classList.add('show');
}
function toggleWidget(widgetId, show) {
  const el = document.getElementById(widgetId);
  if (el) el.style.display = show ? 'flex' : 'none';
}
function hideWidgetDirect(widgetId) { toggleWidget(widgetId, false); }
function togglePasswordVisibility() {
  const p = document.getElementById('passwordInput'), i = document.getElementById('togglePassIcon');
  if(p.type==='password'){ p.type='text'; i.className='bx bx-hide'; }else{ p.type='password'; i.className='bx bx-show'; }
}

function handleLogin(event) {
  event.preventDefault();
  const u = document.getElementById('usernameInput').value.trim();
  const p = document.getElementById('passwordInput').value;
  if ((u === DEFAULT_USER || u === "sportsbookhub") && p === DEFAULT_PASS) {
    document.getElementById('rememberMe').checked ? localStorage.setItem('sbhub_auth', 'true') : sessionStorage.setItem('sbhub_auth', 'true');
    document.documentElement.classList.add('is-authenticated');
  } else {
    document.getElementById('loginErrorMsg').textContent = "ACCESS DENIED: Invalid Security Key";
    document.getElementById('loginCard').classList.add('shake');
    setTimeout(() => document.getElementById('loginCard').classList.remove('shake'), 500);
  }
}
function handleLogout() {
  localStorage.removeItem('sbhub_auth'); sessionStorage.removeItem('sbhub_auth');
  document.documentElement.classList.remove('is-authenticated');
}

function setGradient(themeName) {
  localStorage.setItem('sbhub_theme', themeName);
  const body = document.getElementById('pageBody');
  if(!body) return;
  body.className = '';
  if (themeName === 'light-theme') {
    body.classList.add('light-theme');
    body.style.background = '#f1f5f9';
  } else if (themeName === 'plain-slate') {
    body.style.background = '#090d16';
  } else {
    body.style.background = '#090d16';
  }
}

function initDashboardApp() {
  const savedTheme = localStorage.getItem('sbhub_theme');
  setGradient(savedTheme || '3d-chrome-swirl');

  switchBrandTab('ibet');
  loadReminders();
  loadCachedTopPicks();
  updateWorldClocks();

  fetchTopPicksAndBoosts();
  setInterval(fetchTopPicksAndBoosts, 2 * 60 * 1000);
  
  if(typeof listenToLiveDutyRoster === 'function') listenToLiveDutyRoster();
  fetchLiveGames();
  
  if(typeof fetchManilaWeather === 'function') {
    fetchManilaWeather();
    setInterval(fetchManilaWeather, 15 * 60 * 1000);
  }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDashboardApp); } 
else { initDashboardApp(); }

window.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown-container') && !e.target.closest('.utility-btn')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  }
});

/* ROSTER SYNC */
function getGMT8IsoDate() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const year = nowManila.getFullYear();
  const month = String(nowManila.getMonth() + 1).padStart(2, '0');
  const day = String(nowManila.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function getCurrentSlotInfo() {
  const hours = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })).getHours();
  if (hours >= 6 && hours < 9) return { slotId: "slot_6_9", label: "7:00 - 9:00" };
  if (hours >= 9 && hours < 12) return { slotId: "slot_9_12", label: "9:00 - 12:00" };
  if (hours >= 12 && hours < 15) return { slotId: "slot_12_15", label: "12:00 - 15:00" };
  if (hours >= 15 && hours < 18) return { slotId: "slot_15_18", label: "15:00 - 18:00" };
  if (hours >= 18 && hours < 21) return { slotId: "slot_18_21", label: "18:00 - 21:00" };
  return { slotId: "slot_21_0", label: "21:00 - 00:00" };
}
function filterDuties() {
  currentTraderFilter = document.getElementById('traderFilterDropdown').value;
  if(rosterDb) rosterDb.ref('roster_data').once('value').then(s => renderLiveDutyWidget(s.val()));
}
function listenToLiveDutyRoster() {
  if (!rosterDb) return;
  rosterDb.ref('roster_data').on('value', (s) => renderLiveDutyWidget(s.val()));
}
function renderLiveDutyWidget(rosterData) {
  const container = document.getElementById("liveDutyContent");
  if (!container || !rosterData) return;
  const todayIso = getGMT8IsoDate();
  const { slotId, label: slotLabel } = getCurrentSlotInfo();
  let activeDayKey = Object.keys(rosterData).find(k => k !== 'archives' && (rosterData[k]?.isoDate === todayIso || rosterData[k]?.date === todayIso || k === todayIso || k.includes(todayIso)));
  if (!activeDayKey) activeDayKey = Object.keys(rosterData).filter(k=>k!=='archives').sort((a,b)=>String(rosterData[b]?.isoDate||b).localeCompare(String(rosterData[a]?.isoDate||a)))[0];
  const dayData = rosterData[activeDayKey];
  if(!dayData) return;
  
  let teamMembers = [{ id: 'ann', name: 'ANN' }, { id: 'dave', name: 'DAVE' }, { id: 'ken', name: 'KEN' }, { id: 'kriztel', name: 'KRIZTEL' }];
  if (currentTraderFilter !== 'ALL') teamMembers = teamMembers.filter(m => m.name === currentTraderFilter);
  
  let html = '';
  teamMembers.forEach(m => {
    const mGrid = dayData.grid ? dayData.grid[m.id] : null;
    const shiftId = mGrid?.shift || 'shift-7-16';
    const isRest = (shiftId === 'shift-rd' || shiftId === 'shift-vl' || shiftId === 'shift-sl');
    let rawTasks = (mGrid && mGrid.slots) ? mGrid.slots[slotId] || [] : [];
    
    html += `<div class="duty-card"><div class="duty-top"><span>${m.name}</span><span class="badge-time">${isRest ? 'REST' : shiftId.replace('shift-', '')}</span></div>`;
    if (isRest) html += `<div class="duty-desc">Rest day.</div>`;
    else if (rawTasks.length === 0) html += `<div class="duty-desc">No tasks.</div>`;
    else rawTasks.forEach(t => { html += `<div class="duty-desc"><i class='bx ${t.done ? 'bx-check-circle' : 'bx-time-five'}' style="color:${t.done ? '#34d399' : '#38bdf8'}"></i> <span style="${t.done ? 'text-decoration:line-through; opacity:0.5;' : ''}">${t.text||t}</span></div>`; });
    html += `</div>`;
  });
  container.innerHTML = html;
  
  let activeCount = 0;
  if (dayData && dayData.grid) {
     ['ann', 'dave', 'ken', 'kriztel'].forEach(id => {
        const sId = dayData.grid[id]?.shift || '';
        if (sId && !sId.includes('rd') && !sId.includes('vl') && !sId.includes('sl')) activeCount++;
     });
  }
  document.getElementById('activeTraderCount').textContent = activeCount + ' Working';
}

async function fetchManilaWeather() {
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current_weather=true&timezone=Asia%2FManila');
    const data = await response.json();
    document.getElementById('weatherTemp').textContent = `${Math.round(data.current_weather?.temperature ?? 32)}°C`;
    document.getElementById('weatherCond').textContent = parseWMOWeatherCode(data.current_weather?.weathercode ?? 3).label;
    document.getElementById('weatherIcon').className = `bx ${parseWMOWeatherCode(data.current_weather?.weathercode ?? 3).icon}`;
    document.getElementById('weatherIcon').style.color = parseWMOWeatherCode(data.current_weather?.weathercode ?? 3).color;
  } catch (err) {}
}
function parseWMOWeatherCode(code) {
  if (code === 0) return { label: 'CLEAR SKY', icon: 'bx-sun', color: '#f59e0b' };
  if (code <= 2) return { label: 'PARTLY CLOUDY', icon: 'bx-cloud-sun', color: '#f59e0b' };
  if (code === 3) return { label: 'OVERCAST', icon: 'bx-cloud', color: '#38bdf8' };
  if (code >= 51 && code <= 67) return { label: 'LIGHT RAIN', icon: 'bx-cloud-drizzle', color: '#60a5fa' };
  if (code >= 80 && code <= 82) return { label: 'HEAVY RAIN', icon: 'bx-cloud-showers-heavy', color: '#3b82f6' };
  if (code >= 95) return { label: 'THUNDERSTORM', icon: 'bx-cloud-lightning', color: '#eab308' };
  return { label: 'CLOUDY', icon: 'bx-cloud', color: '#38bdf8' };
}
