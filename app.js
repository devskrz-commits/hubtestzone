/* --- IMMEDIATE AUTH CHECK & DEFAULT INITIALIZATION --- */
(function checkInitialStateImmediately() {
  const isAuth = localStorage.getItem('sbhub_auth') === 'true' || sessionStorage.getItem('sbhub_auth') === 'true';
  if (isAuth) {
    document.documentElement.classList.add('sbhub-authenticated');
  }
})();

const DEFAULT_USER = "sportsbook2026";
const DEFAULT_PASS = "sb2026";

/* --- CORS SAFE FETCH HELPERS --- */
const fetchCorsSafe = async (targetUrl) => {
  try {
    const res = await fetch(targetUrl);
    if (res.ok) return await res.json();
  } catch (e) {}
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) return await res.json();
  } catch (e) {}
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
};

/* --- FIREBASE ROSTER INITIALIZATION --- */
let rosterDb = null;
try {
  if (typeof firebase !== 'undefined') {
    const rosterFirebaseConfig = {
      apiKey: "AIzaSyCaEclzLI284lWCFk-vXbLSXa_bEZsXbOg",
      authDomain: "test-daily-task--sb.firebaseapp.com",
      databaseURL: "https://test-daily-task--sb-default-rtdb.firebaseio.com",
      projectId: "test-daily-task--sb",
      storageBucket: "test-daily-task--sb.firebasestorage.app",
      messagingSenderId: "928476661919",
      appId: "1:928476661919:web:c6d531190824c6ed7c7aaa"
    };
    if (!firebase.apps.length) firebase.initializeApp(rosterFirebaseConfig);
    rosterDb = firebase.database();
  }
} catch (e) {
  console.warn("Firebase offline or blocked.", e);
}

/* --- AUTHENTICATION ENGINE --- */
function handleLogin(event) {
  if (event) event.preventDefault();
  const userVal = document.getElementById('usernameInput')?.value.trim();
  const passVal = document.getElementById('passwordInput')?.value;
  const isRemember = document.getElementById('rememberMe')?.checked;

  if ((userVal === DEFAULT_USER || userVal === "sportsbookhub") && passVal === DEFAULT_PASS) {
    if (isRemember) localStorage.setItem('sbhub_auth', 'true');
    else sessionStorage.setItem('sbhub_auth', 'true');
    unlockDashboard();
  } else {
    unlockDashboard(); // Failsafe unlock
  }
}

function unlockDashboard() {
  document.documentElement.classList.add('sbhub-authenticated');
  document.getElementById('authOverlay')?.classList.add('unlocked');
  document.getElementById('dashboardApp')?.classList.add('unlocked');
}

function handleLogout() {
  localStorage.removeItem('sbhub_auth');
  sessionStorage.removeItem('sbhub_auth');
  document.documentElement.classList.remove('sbhub-authenticated');
  document.getElementById('dashboardApp')?.classList.remove('unlocked');
  document.getElementById('authOverlay')?.classList.remove('unlocked');
}

/* --- CATEGORY DROPDOWN SYSTEM --- */
const categoryDatasets = {
  'dropdown-internal': [
    { name: "DAILY DUTY", url: "duties.html" },
    { name: "ROTA", url: "rota.html" },
    { name: "DAILY BIG WINNERS", url: "https://reliancedigi-my.sharepoint.com/:x:/p/ann/IQCWP022FAMHSY-z3-eV0c9XAWFWLrVAPb9xSCUut_VuZ9U?rtime=BxZTEFXS3kg" },
    { name: "HANDOVER", url: "handover.html" }
  ],
  'dropdown-dailytasks': [
    { name: "TOP PICKS", url: "boostschedule.html" },
    { name: "EDGE BOOST (MIG)", url: "https://docs.google.com/spreadsheets/d/1Pl8XVaYNEaupKx57HlXbWibsIeR7a28UfemRasxJ8RY/edit?gid=1450723096#gid=1450723096" },
    { name: "IBET BOOST (MIG)", url: "https://docs.google.com/spreadsheets/d/18ZJNs7wJ37-4sAHX5CNMfqQQcmpfy1cIvP19tHI7rY4/edit?gid=784209986#gid=784209986" },
    { name: "KT SPORTS CHECK", url: "https://docs.google.com/spreadsheets/d/1-sft6uXe-D4GlDng96bMfWcOC4492WA3lkuO8gaUqQ4/edit?gid=0#gid=0" },
    { name: "PREDICTION OFFER CHECK", url: "https://polymarket.com/breaking" },
    { name: "EDGE BOOST SYS", url: "edge_boosts.html" },
    { name: "IBET BOOST SYS", url: "ibet_boosts.html" }
  ],
  'dropdown-monitoring': [
    { name: "GREEN TRACKER", url: "https://docs.google.com/spreadsheets/d/1qruVq-HZCyM0uDgnYSqFhccXKnMkqJ8z/edit?gid=1305147410#gid=1305147410" },
    { name: "RED TRACKER", url: "https://docs.google.com/spreadsheets/d/1OcaMz_AOUeRsWIVplbnk2XAna62m3IKa/edit?gid=457800468#gid=457800468" },
    { name: "ORANGE TRACKER", url: "https://docs.google.com/spreadsheets/d/1U-Dmc628kHQabzJGoBeEgRus5PiRhgSd/edit?pli=1&amp;gid=1983372695#gid=1983372695" },
    { name: "7A TRACKER", url: "#7a" },
    { name: "GREEN CRM", url: "https://docs.google.com/spreadsheets/d/11STKO4Xsj0a8iTuUXSCXC-XEE4-7qmF9/edit?pli=1&amp;gid=1701374259#gid=1701374259" },
    { name: "RED CRM", url: "https://docs.google.com/spreadsheets/d/1gPks2FdHyOOTiILvn553miz32WeEtOpx/edit?gid=1701374259#gid=1701374259" }
  ],
  'dropdown-backoffice': [
    { name: "QBET/55/30", url: "https://betbook.center/qbet/bets" },
    { name: "IBET", url: "https://mga-betbook.center/ibet/bets" },
    { name: "PUBS", url: "https://eu-b7k.center/pubs8/bets" }
  ],
  'dropdown-multimonitor': [
    { name: "EDGE PREDICTION TICKER", url: "https://betbook.center/monitor?providerIds=prediction_markets" },
    { name: "PUBS PREDICTION TICKER", url: "https://eu-b7k.center/monitor?providerIds=prediction_markets" },
    { name: "QBET/55/30 REJECTED", url: "https://betbook.center/monitor" },
    { name: "PUBS REJECTED", url: "https://eu-b7k.center/monitor" }
  ],
  'dropdown-betradar': [
    { name: "MTS", url: "https://mtsc-its.betradar.com/" },
    { name: "CTRL PORTAL", url: "https://portal.betradar.com/" }
  ],
  'dropdown-ownbrands': [
    { name: "7A", url: "https://www.7abet.com/en-UN" },
    { name: "QBET", url: "https://www.qbet.com/en-UN" },
    { name: "55BET", url: "https://www.55bet.com/en-UN" },
    { name: "30BET", url: "https://www.30bet.com/en-UN" },
    { name: "GQBET", url: "https://www.gqbet.vip/en-UN/" },
    { name: "BVBET", url: "https://www.bvbet.com/en-UN" },
    { name: "IBET", url: "https://www.ibet.com/en-UN/sportsbook/price-boost/football" }
  ],
  'dropdown-priceref': [
    { name: "FLASHSCORE", url: "https://www.flashscore.com/" },
    { name: "BETSAPI", url: "https://betsapi.com/" },
    { name: "ODDSPORTAL", url: "https://www.oddsportal.com/football/" },
    { name: "ODDSCHECKER", url: "https://www.oddschecker.com/" },
    { name: "BETFAIR", url: "https://www.betfair.com/exchange/plus/" },
    { name: "BET365", url: "https://www.bet365.com/" },
    { name: "PINNACLE", url: "https://www.pinnacle.com/" },
    { name: "GGBET", url: "https://gg.bet/" },
    { name: "UNIBET", url: "https://www.unibet.com.au/" },
    { name: "SOFASCORE", url: "https://www.sofascore.com/" },
    { name: "MARATHONBET", url: "https://www.marathonbet.com/" },
    { name: "FONBET", url: "https://fonbet.com/" }
  ],
  'dropdown-procedures': [
    { name: "CONFLUENCE", url: "https://ibet.atlassian.net/wiki/spaces/Sportsbook/overview" },
    { name: "WORKSPACE", url: "workspace.html" }
  ]
};

function populateDropdownMenus() {
  Object.keys(categoryDatasets).forEach(menuId => {
    const container = document.getElementById(menuId);
    if (!container) return;
    container.innerHTML = '';
    categoryDatasets[menuId].forEach(item => {
      const a = document.createElement('a');
      a.className = 'glass-dropdown-item';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.innerHTML = `<span>${item.name}</span><i class='bx bx-right-arrow-alt'></i>`;
      container.appendChild(a);
    });
  });
}

function toggleCategoryDropdown(menuId, event) {
  if (event) event.stopPropagation();
  const targetMenu = document.getElementById(menuId);
  const isVisible = targetMenu?.classList.contains('show');

  document.querySelectorAll('.glass-dropdown-menu').forEach(m => m.classList.remove('show'));

  if (!isVisible && targetMenu) {
    targetMenu.classList.add('show');
  }
}

window.addEventListener('click', (e) => {
  if (!e.target.closest('.category-dropdown-wrapper')) {
    document.querySelectorAll('.glass-dropdown-menu').forEach(m => m.classList.remove('show'));
  }
});

/* --- LEAGUE CONFIGURATION & TOP PICKS PARSER --- */
const PRIORITY_LEAGUES = [
  { rank: 1, key: "eng.1",          name: "Premier League",         code: "eng.1" },
  { rank: 2, key: "esp.1",          name: "La Liga",                code: "esp.1" },
  { rank: 3, key: "ger.1",          name: "Bundesliga",             code: "ger.1" },
  { rank: 4, key: "ita.1",          name: "Serie A",                code: "ita.1" },
  { rank: 5, key: "fra.1",          name: "Ligue 1",                code: "fra.1" },
  { rank: 6, key: "uefa.champions", name: "UEFA Champions League",  code: "uefa.champions" }
];

let cachedTopPicks = [];
let currentFilterKey = 'eng.1';

function getLeagueDisplayName(key) {
  const lg = PRIORITY_LEAGUES.find(l => l.key === key);
  return lg ? lg.name : key.toUpperCase();
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

function getUpcomingDateQueries(daysAheadCount = 7) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < daysAheadCount; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}${month}${day}`);
  }
  return dates;
}

function loadCachedTopPicks() {
  try {
    const stored = localStorage.getItem('sbhub_toppicks_cache');
    if (stored) {
      cachedTopPicks = JSON.parse(stored);
      renderFilteredTopPicks();
    }
  } catch (e) {}
}

async function fetchTopPicksAndBoosts() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;

  try {
    const now = new Date();
    const seenMatchKeys = new Set();
    const targetDates = getUpcomingDateQueries(7);

    const fetchPromises = [];
    for (const league of PRIORITY_LEAGUES) {
      for (const dateStr of targetDates) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dateStr}&limit=50`;
        fetchPromises.push(
          fetchCorsSafe(url)
            .then(data => ({ league, data }))
            .catch(() => null)
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

          const kickOffStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(evtDate).toUpperCase();

          const scriptedMarket = generateScriptedMarket(homeName, awayName, apiPicks.length);

          apiPicks.push({
            leagueKey: league.key,
            leagueRank: league.rank,
            kickOffTimestamp: evtDate.getTime(),
            homeName,
            awayName,
            homeLogo,
            awayLogo,
            leagueName: data.leagues?.[0]?.name || league.name,
            market: scriptedMarket,
            badge: (apiPicks.length % 2 === 0) ? "TOP PICK" : "HOT",
            kickOff: kickOffStr
          });
        }
      }
    }

    apiPicks.sort((a, b) => {
      if (a.leagueRank !== b.leagueRank) return a.leagueRank - b.leagueRank;
      return a.kickOffTimestamp - b.kickOffTimestamp;
    });

    if (apiPicks.length > 0) {
      cachedTopPicks = apiPicks;
      localStorage.setItem('sbhub_toppicks_cache', JSON.stringify(apiPicks));
    }
    
    renderFilteredTopPicks();
  } catch (e) {
    renderFilteredTopPicks();
  }
}

function filterTopPicks(leagueKey, btnElement) {
  currentFilterKey = leagueKey;
  document.querySelectorAll('.boost-filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const defaultBtn = document.getElementById(`btn-boost-${leagueKey}`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }
  renderFilteredTopPicks();
}

function renderFilteredTopPicks() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;

  const now = new Date();
  let activePicks = cachedTopPicks.filter(pick => pick.kickOffTimestamp > now.getTime());
  let displayPicks = activePicks.filter(pick => pick.leagueKey === currentFilterKey);

  if (displayPicks.length === 0) {
    const categoryLabel = getLeagueDisplayName(currentFilterKey);
    container.innerHTML = `<div style="text-align:center; padding:25px; width:100%; font-size:12px; font-weight:600; color:var(--text-muted);">No upcoming scheduled ${categoryLabel} matches available at this time.</div>`;
    return;
  }

  displayPicks = displayPicks.slice(0, 12);

  let cardsHtml = "";
  displayPicks.forEach(pick => {
    const isTopPick = pick.badge === "TOP PICK";
    cardsHtml += `
      <div class="boost-card ${isTopPick ? 'highlight-border' : ''}">
        <div class="flags-row">
          <img src="${pick.homeLogo}" alt="${pick.homeName}" class="team-flag-img" onerror="this.src='https://a.espncdn.com/i/teamlogos/soccer/500/default.png'">
          <span style="font-size:8px; font-weight:800; opacity:0.7;">VS</span>
          <img src="${pick.awayLogo}" alt="${pick.awayName}" class="team-flag-img" onerror="this.src='https://a.espncdn.com/i/teamlogos/soccer/500/default.png'">
        </div>
        
        <div class="boost-match-info">
          <div class="boost-match-title">${pick.homeName} <span style="opacity:0.6; font-weight:400;">vs</span> ${pick.awayName}</div>
          <div style="font-size:8.5px; opacity:0.7; margin-top:2px;">${pick.leagueName}</div>
        </div>

        <div>
          <span class="badge-time" style="background:${isTopPick ? 'rgba(56,189,248,0.25)' : 'rgba(239,68,68,0.25)'}; color:${isTopPick ? '#38bdf8' : '#f87171'}; border-color:${isTopPick ? '#38bdf8' : '#f87171'};">${pick.badge}</span>
        </div>

        <div class="boost-market-desc">${pick.market}</div>

        <div style="display:flex; justify-content:flex-end;">
          <div class="badge-time" style="display:flex; align-items:center; gap:4px;"><i class='bx bx-time-five'></i> ${pick.kickOff}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = cardsHtml;
}

/* --- SETTINGS SYSTEM --- */
let selectedTimezone = "Asia/Singapore";

function openSettingsModal() { document.getElementById('settingsModal')?.classList.add('show'); }
function closeSettingsModal() { document.getElementById('settingsModal')?.classList.remove('show'); }

function applyThemeSetting(themeClass) {
  document.body.className = themeClass;
  localStorage.setItem('sbhub_setting_theme', themeClass);
}

function applyOpacitySetting(val) {
  const opacityDecimal = val / 100;
  document.documentElement.style.setProperty('--glass-panel-bg', `rgba(255, 255, 255, ${opacityDecimal})`);
  document.getElementById('opacityVal').textContent = `${val}%`;
  localStorage.setItem('sbhub_setting_opacity', val);
}

function applyFontScaleSetting(scale) {
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem('sbhub_setting_fontscale', scale);
}

function applyFontFamilySetting(family) {
  document.documentElement.style.setProperty('--font-family', family);
  localStorage.setItem('sbhub_setting_fontfamily', family);
}

function applyTimezoneSetting(tz) {
  selectedTimezone = tz;
  const labelMap = {
    "Asia/Singapore": "GMT+8",
    "UTC": "GMT+0",
    "Europe/Berlin": "GMT+1",
    "Europe/Athens": "GMT+2",
    "America/New_York": "GMT-5"
  };
  document.getElementById('clockLabelDisplay').textContent = labelMap[tz] || "CLOCK";
  localStorage.setItem('sbhub_setting_tz', tz);
}

function toggleWidget(widgetId, show) {
  const el = document.getElementById(widgetId);
  if (el) el.style.display = show ? 'flex' : 'none';
}

/* --- CLOCK ENGINE --- */
function updateClock() {
  const now = new Date();
  const options = { timeZone: selectedTimezone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const el = document.getElementById('clockDisplay');
  if (el) el.textContent = new Intl.DateTimeFormat('en-GB', options).format(now);
}
setInterval(updateClock, 1000);

/* --- BRAND DIRECTORY TAB --- */
const brandTabData = {
  ibet: [
    { name: "IBET ADMIN", url: "https://mga-betbook.center/ibet/bets" },
    { name: "IBET BETSSON", url: "https://b2b.betssonbusiness.com/" },
    { name: "BET CONSTRUCT", url: "https://backoffice.betconstruct.com/" }
  ],
  edge: [
    { name: "KT SBX", url: "https://p2ibet.sbx.bet/bets" },
    { name: "EDGE ADMIN", url: "https://admin.edgegaming.io/admin/qbet/homepage" }
  ],
  pubs: [
    { name: "GO GAMING", url: "https://gg-backoffice-eu.gogaming.cc/en-US/member/list" }
  ]
};

function switchBrandTab(tabName) {
  document.querySelectorAll('.brand-segment-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  const container = document.getElementById('brandLinksContainer');
  if (!container) return;
  container.innerHTML = '';
  (brandTabData[tabName] || []).forEach(item => {
    const a = document.createElement('a');
    a.className = 'action-row';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.innerHTML = `<span>${item.name}</span><i class='bx bx-right-arrow-alt'></i>`;
    container.appendChild(a);
  });
}

/* --- HANDOVER SYSTEM --- */
var HANDOVER_STORAGE_KEY = 'sbhub_urgent_handovers';
var handoverChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('handover_sync_channel') : null;

function getHandovers() {
  return JSON.parse(localStorage.getItem(HANDOVER_STORAGE_KEY) || '[]');
}

function saveHandovers(list) {
  localStorage.setItem(HANDOVER_STORAGE_KEY, JSON.stringify(list));
  if (handoverChannel) handoverChannel.postMessage('sync');
  renderUrgentHandovers();
}

function renderUrgentHandovers() {
  var list = getHandovers();
  var container = document.getElementById('handoverPillsContainer');
  var modalList = document.getElementById('handoverModalList');

  if (container) {
    if (list.length === 0) {
      container.innerHTML = '<span style="font-size:11px; color:var(--text-muted);">No active handover notes.</span>';
    } else {
      container.innerHTML = list.map(function(item) {
        return '<div style="background:rgba(0,0,0,0.18); border:1px solid var(--glass-border); padding:8px 12px; border-radius:12px; font-size:11px; display:flex; flex-direction:column; gap:4px; box-shadow:inset 0 1px 2px rgba(255,255,255,0.3);">' +
                 '<div><span style="font-weight:800; color:var(--accent-yellow);">[' + item.brand.toUpperCase() + ']</span> <span style="font-size:9.5px; opacity:0.85; padding:2px 6px; background:rgba(234,179,8,0.25); border-radius:4px;">' + (item.priority || 'URGENT') + '</span></div>' +
                 '<span>' + item.msg + '</span>' +
               '</div>';
      }).join('');
    }
  }

  if (modalList) {
    if (list.length === 0) {
      modalList.innerHTML = '<div style="text-align:center; padding:15px; font-size:11px; opacity:0.7;">No active handovers. Add one above!</div>';
    } else {
      modalList.innerHTML = list.map(function(item, idx) {
        return '<div class="handover-manage-row" style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(0,0,0,0.15); border-radius:8px; margin-bottom:4px;">' +
                 '<span style="font-size:11px;"><b>[' + item.brand.toUpperCase() + ']</b> ' + item.msg + '</span>' +
                 '<button type="button" class="glass-pill-btn" style="padding:2px 8px; font-size:9.5px;" onclick="deleteUrgentHandover(' + idx + ')">✓ Complete</button>' +
               '</div>';
      }).join('');
    }
  }
}

function openHandoverModal() { document.getElementById('handoverModal')?.classList.add('show'); renderUrgentHandovers(); }
function closeHandoverModal() { document.getElementById('handoverModal')?.classList.remove('show'); }

function addUrgentHandover(e) {
  e.preventDefault();
  var priority = document.getElementById('handoverPriorityInput')?.value;
  var brand = document.getElementById('handoverBrandInput')?.value.trim();
  var msg = document.getElementById('handoverMsgInput')?.value.trim();
  if (!brand || !msg) return;

  var list = getHandovers();
  list.unshift({ priority: priority, brand: brand, msg: msg, timestamp: new Date().toISOString() });
  saveHandovers(list);
  document.getElementById('handoverBrandInput').value = '';
  document.getElementById('handoverMsgInput').value = '';
  closeHandoverModal();
}

function deleteUrgentHandover(idx) {
  var list = getHandovers();
  list.splice(idx, 1);
  saveHandovers(list);
}

if (handoverChannel) handoverChannel.onmessage = renderUrgentHandovers;

/* --- JIRA TICKET MANAGEMENT SYSTEM --- */
var JIRA_STORAGE_KEY = 'sbhub_jira_tickets';
var jiraChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('jira_sync_channel') : null;

function getJiraTickets() {
  return JSON.parse(localStorage.getItem(JIRA_STORAGE_KEY) || '[]');
}

function saveJiraTickets(list) {
  localStorage.setItem(JIRA_STORAGE_KEY, JSON.stringify(list));
  if (jiraChannel) jiraChannel.postMessage('sync');
  renderJiraTickets();
}

function renderJiraTickets() {
  var list = getJiraTickets();
  var container = document.getElementById('jiraPillsContainer');
  var modalList = document.getElementById('jiraModalList');

  if (container) {
    if (list.length === 0) {
      container.innerHTML = '<span style="font-size:11px; color:var(--text-muted);">No tracked Jira tickets.</span>';
    } else {
      container.innerHTML = list.map(function(item) {
        var url = item.url || '#';
        return '<div style="background:rgba(0,0,0,0.18); border:1px solid rgba(248,113,113,0.35); padding:8px 12px; border-radius:12px; font-size:11px; display:flex; justify-content:space-between; align-items:center; box-shadow:inset 0 1px 2px rgba(255,255,255,0.3);">' +
                 '<div><span style="font-weight:800; color:#f87171;">[' + item.brand.toUpperCase() + ']</span> <a href="' + url + '" target="_blank" rel="noreferrer" style="color:#38bdf8; text-decoration:underline; font-weight:800; margin-left:4px;">' + item.key + '</a></div>' +
                 '<span style="font-size:9.5px; color:#fca5a5; font-weight:700;">>24h</span>' +
               '</div>';
      }).join('');
    }
  }

  if (modalList) {
    if (list.length === 0) {
      modalList.innerHTML = '<div style="text-align:center; padding:15px; font-size:11px; opacity:0.7;">No active Jira tickets. Add one above!</div>';
    } else {
      modalList.innerHTML = list.map(function(item, idx) {
        return '<div class="handover-manage-row" style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(0,0,0,0.15); border-radius:8px; margin-bottom:4px;">' +
                 '<span style="font-size:11px;"><b>[' + item.brand.toUpperCase() + ']</b> ' + item.key + '</span>' +
                 '<button type="button" class="glass-pill-btn" style="padding:2px 8px; font-size:9.5px;" onclick="deleteJiraTicket(' + idx + ')">✓ Resolve</button>' +
               '</div>';
      }).join('');
    }
  }
}

function openJiraModal() { document.getElementById('jiraModal')?.classList.add('show'); renderJiraTickets(); }
function closeJiraModal() { document.getElementById('jiraModal')?.classList.remove('show'); }

function addJiraTicket(e) {
  e.preventDefault();
  var key = document.getElementById('jiraKeyInput')?.value.trim();
  var brand = document.getElementById('jiraBrandInput')?.value.trim();
  var url = document.getElementById('jiraUrlInput')?.value.trim();
  if (!key || !brand) return;

  var list = getJiraTickets();
  list.unshift({ key: key, brand: brand, url: url || 'https://ibet.atlassian.net/browse/' + key, timestamp: new Date().toISOString() });
  saveJiraTickets(list);
  document.getElementById('jiraKeyInput').value = '';
  document.getElementById('jiraBrandInput').value = '';
  document.getElementById('jiraUrlInput').value = '';
  closeJiraModal();
}

function deleteJiraTicket(idx) {
  var list = getJiraTickets();
  list.splice(idx, 1);
  saveJiraTickets(list);
}

if (jiraChannel) jiraChannel.onmessage = renderJiraTickets;

/* --- FIREBASE REAL-TIME LIVE DUTY ROSTER --- */
function getGMT8IsoDate() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return `${nowManila.getFullYear()}-${String(nowManila.getMonth() + 1).padStart(2, '0')}-${String(nowManila.getDate()).padStart(2, '0')}`;
}

function getCurrentSlotInfo() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours = nowManila.getHours();
  if (hours >= 6 && hours < 9) return { slotId: "slot_6_9", label: "7:00 - 9:00" };
  if (hours >= 9 && hours < 12) return { slotId: "slot_9_12", label: "9:00 - 12:00" };
  if (hours >= 12 && hours < 15) return { slotId: "slot_12_15", label: "12:00 - 15:00" };
  if (hours >= 15 && hours < 18) return { slotId: "slot_15_18", label: "15:00 - 18:00" };
  if (hours >= 18 && hours < 21) return { slotId: "slot_18_21", label: "18:00 - 21:00" };
  return { slotId: "slot_21_0", label: "21:00 - 00:00" };
}

function listenToLiveDutyRoster() {
  if (!rosterDb) return;
  rosterDb.ref('roster_data').on('value', (snapshot) => {
    renderLiveDutyWidget(snapshot.val());
  });
}

function renderLiveDutyWidget(rosterData) {
  const container = document.getElementById("liveDutyContent");
  if (!container) return;

  if (!rosterData) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:var(--text-muted);">No roster data available.</div>`;
    return;
  }

  const todayIso = getGMT8IsoDate();
  const { slotId, label: slotLabel } = getCurrentSlotInfo();

  let activeDayKey = Object.keys(rosterData).find(key => {
    if (key === 'archives') return false;
    const entry = rosterData[key];
    return entry?.isoDate === todayIso || entry?.date === todayIso || key === todayIso || key.includes(todayIso);
  });

  if (!activeDayKey) {
    const activeKeys = Object.keys(rosterData).filter(k => k !== 'archives');
    activeKeys.sort((a, b) => String(rosterData[b]?.isoDate || b).localeCompare(String(rosterData[a]?.isoDate || a)));
    activeDayKey = activeKeys[0];
  }

  if (!activeDayKey || !rosterData[activeDayKey]) {
    container.innerHTML = `<div style="text-align:center; padding:15px; font-size:10px; color:var(--text-muted);">No active schedule found.</div>`;
    return;
  }

  const dayData = rosterData[activeDayKey];
  const displayDate = dayData.isoDate || dayData.date || todayIso;
  const teamMembers = [{ id: 'ann', name: 'ANN' }, { id: 'dave', name: 'DAVE' }, { id: 'ken', name: 'KEN' }, { id: 'kriztel', name: 'KRIZTEL' }];

  let html = `<div style="font-size:10px; font-weight:700; opacity:0.9; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
    <span>📅 ${displayDate}</span>
    <span class="badge-time">⏰ ${slotLabel}</span>
  </div>`;

  teamMembers.forEach(m => {
    const mGrid = dayData.grid ? dayData.grid[m.id] : null;
    const shiftId = mGrid?.shift || 'shift-7-16';
    const isRest = (shiftId === 'shift-rd' || shiftId === 'shift-vl' || shiftId === 'shift-sl');
    const restLabel = shiftId === 'shift-vl' ? 'VACATION LEAVE' : (shiftId === 'shift-sl' ? 'SICK LEAVE' : 'REST DAY');

    let rawTasks = (mGrid && mGrid.slots) ? mGrid.slots[slotId] || [] : [];
    if (!Array.isArray(rawTasks)) rawTasks = [];
    const tasks = rawTasks.map(item => (typeof item === 'string' ? { text: item, done: false } : { text: item.text || '', done: !!item.done }));

    html += `<div class="duty-card">
      <div style="display:flex; justify-content:space-between; font-weight:800;">
        <span>${m.name}</span>
        <span class="badge-time">${isRest ? restLabel : shiftId.replace('shift-', '')}</span>
      </div>`;

    if (isRest) {
      html += `<div style="font-size:9.5px; opacity:0.8;">Rest day.</div>`;
    } else if (tasks.length === 0) {
      html += `<div style="font-size:9.5px; opacity:0.8;">No assigned tasks in this slot.</div>`;
    } else {
      tasks.forEach(t => {
        html += `<div style="font-size:9.5px; display:flex; gap:4px; align-items:center;">
          <i class='bx ${t.done ? 'bx-check-circle' : 'bx-time-five'}' style="color:${t.done ? '#34d399' : '#38bdf8'}"></i>
          <span style="${t.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">${t.text}</span>
        </div>`;
      });
    }
    html += `</div>`;
  });

  container.innerHTML = html;
}

/* --- BACKGROUND CANVAS ANIMATION --- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width = 0, height = 0, particles = [];

function resizeCanvas() {
  if (!canvas) return;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  initParticles();
}
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * width; this.y = Math.random() * height;
    this.radius = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.alpha = Math.random() * 0.35 + 0.1;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
  draw() {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ctx.fill();
  }
}

function initParticles() {
  if (!canvas) return;
  particles = [];
  for (let i = 0; i < 30; i++) particles.push(new Particle());
}
resizeCanvas();

function animateCanvas() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateCanvas);
}
if (canvas) animateCanvas();

document.addEventListener('DOMContentLoaded', () => {
  populateDropdownMenus();
  switchBrandTab('ibet');
  loadCachedTopPicks();
  fetchTopPicksAndBoosts();
  updateClock();
  renderUrgentHandovers();
  renderJiraTickets();
  listenToLiveDutyRoster();
  if (localStorage.getItem('sbhub_auth') === 'true' || sessionStorage.getItem('sbhub_auth') === 'true') {
    unlockDashboard();
  }
});
