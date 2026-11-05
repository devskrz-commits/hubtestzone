/* --- GLOBAL STATE VARIABLES (HOISTED AT TOP TO PREVENT REFERENCE ERRORS) --- */
let selectedGameDayOffset = 0;
let rosterDb = null;
let activeTraderFilter = 'ALL';
let lastRosterSnapshotData = null;

const isMobileDevice = () => window.innerWidth <= 768;

function updateGlassOpacity(val) {
  const opacityVal = parseFloat(val);
  document.documentElement.style.setProperty('--glass-opacity-val', opacityVal);
  localStorage.setItem('sbhub_glass_opacity', opacityVal);
  const labelEl = document.getElementById('opacityValLabel');
  if (labelEl) labelEl.textContent = `${Math.round(opacityVal * 100)}%`;
}

function toggleMobileSidebar(forceState) {
  const sidebar = document.getElementById('mainSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;

  const isActive = forceState !== undefined ? forceState : !sidebar.classList.contains('mobile-open');

  if (isActive) {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* --- IMMEDIATE AUTH & DEFAULT THEME CHECK --- */
(function checkInitialStateImmediately() {
  const isAuth = localStorage.getItem('sbhub_auth') === 'true' || sessionStorage.getItem('sbhub_auth') === 'true';
  if (isAuth) {
    document.documentElement.classList.add('sbhub-authenticated');
  }
  const savedTheme = localStorage.getItem('sbhub_theme') || 'blue-orange-wave';
  const savedGlassOpacity = localStorage.getItem('sbhub_glass_opacity') || '0.45';
  document.documentElement.style.setProperty('--glass-opacity-val', savedGlassOpacity);
})();

const DEFAULT_USER = "sportsbook2026";
const DEFAULT_PASS = "sb2026";

/* --- SAFE LOGO FALLBACK SVG --- */
const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%231e293b' stroke='%2338bdf8' stroke-width='4'/%3E%3Cpath d='M30 50 L70 50 M50 30 L50 70' stroke='%2338bdf8' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E";

/* --- ABSTRACT WALLPAPERS --- */
const ABSTRACT_WALLPAPERS = {
  'blue-orange-wave': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'%3E%3Crect width='1920' height='1080' fill='%23070c1b'/%3E%3Cpath d='M0 0 L1920 0 L1920 1080 L0 1080 Z' fill='%230b152d'/%3E%3Cpath d='M-100 300 Q400 100 960 500 T2020 400 L2020 1180 L-100 1180 Z' fill='%230f214a'/%3E%3Cpath d='M-100 500 Q500 800 1100 400 T2020 700 L2020 1180 L-100 1180 Z' fill='url(%23orangeGrad1)'/%3E%3Cpath d='M-100 750 Q600 450 1200 850 T2020 600 L2020 1180 L-100 1180 Z' fill='url(%23orangeGrad2)' opacity='0.95'/%3E%3Cdefs%3E%3ClinearGradient id='orangeGrad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ff5500'/%3E%3Cstop offset='100%25' stop-color='%23ff8c00'/%3E%3C/linearGradient%3E%3ClinearGradient id='orangeGrad2' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23ff3b00'/%3E%3Cstop offset='50%25' stop-color='%23ff7700'/%3E%3Cstop offset='100%25' stop-color='%23ffa000'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E",
  'blue-orange-glow': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'%3E%3Crect width='1920' height='1080' fill='%23060a17'/%3E%3Ccircle cx='1600' cy='900' r='600' fill='url(%23glowOrange)' opacity='0.85'/%3E%3Ccircle cx='200' cy='200' r='500' fill='url(%23glowBlue)' opacity='0.6'/%3E%3Cpath d='M-100 800 Q800 300 2020 900 L2020 1180 L-100 1180 Z' fill='url(%23glowOrange2)' opacity='0.9'/%3E%3Cdefs%3E%3CradialGradient id='glowOrange' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23ff6600'/%3E%3Cstop offset='100%25' stop-color='%23060a17' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='glowBlue' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%231d4ed8'/%3E%3Cstop offset='100%25' stop-color='%23060a17' stop-opacity='0'/%3E%3C/radialGradient%3E%3ClinearGradient id='glowOrange2' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23ff4500'/%3E%3Cstop offset='100%25' stop-color='%23ff9900'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E",
  'blue-orange-halftone': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'%3E%3Crect width='1920' height='1080' fill='%23080e21'/%3E%3Cpath d='M-100 -100 L1200 -100 L2020 1180 L-100 1180 Z' fill='%230d193d'/%3E%3Cpath d='M700 -100 L2020 -100 L2020 1180 L1400 1180 Z' fill='url(%23htGrad)'/%3E%3Cdefs%3E%3ClinearGradient id='htGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ff5500'/%3E%3Cstop offset='100%25' stop-color='%23cc2200'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E",
  'blue-orange-angles': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'%3E%3Crect width='1920' height='1080' fill='%23050914'/%3E%3Cpolygon points='0,0 1200,0 800,1080 0,1080' fill='%230c1736'/%3E%3Cpolygon points='1150,0 1200,0 800,1080 750,1080' fill='%23ff4500'/%3E%3Cpolygon points='1220,0 1270,0 870,1080 820,1080' fill='%23ffaa00'/%3E%3Cpolygon points='1300,0 1920,0 1920,1080 900,1080' fill='%230a1228'/%3E%3C/svg%3E",
  'blue-orange-fluid-mesh': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'%3E%3Crect width='1920' height='1080' fill='%23081026'/%3E%3Cpath d='M-100 400 C300 200, 800 800, 1300 300 C1600 0, 1800 500, 2020 200 L2020 1180 L-100 1180 Z' fill='%2311224d'/%3E%3Cpath d='M-100 600 C400 900, 900 300, 1400 800 C1700 1000, 1900 600, 2020 700 L2020 1180 L-100 1180 Z' fill='url(%23meshGrad)'/%3E%3Cdefs%3E%3ClinearGradient id='meshGrad' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23ff4500'/%3E%3Cstop offset='50%25' stop-color='%23ff7700'/%3E%3Cstop offset='100%25' stop-color='%23ffae00'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E",
  'blue-orange-sunset': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'%3E%3Crect width='1920' height='1080' fill='%2309122a'/%3E%3Cpath d='M-100 200 Q600 600 1200 100 T2020 300 L2020 1180 L-100 1180 Z' fill='%23102456'/%3E%3Cpath d='M-100 450 Q500 150 1100 650 T2020 500 L2020 1180 L-100 1180 Z' fill='url(%23sunsetGrad)'/%3E%3Cdefs%3E%3ClinearGradient id='sunsetGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ff3b00'/%3E%3Cstop offset='100%25' stop-color='%23ff9900'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E"
};

/* --- FIREBASE INITIALIZATION --- */
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

/* --- DYNAMIC SIDEBAR LIVE SEARCH SYSTEM --- */
function handleSidebarSearch(query) {
  const cleanQuery = query.toLowerCase().trim();
  const navGroups = document.querySelectorAll('.sidebar .nav-group');
  const quickDockBtns = document.querySelectorAll('.sidebar-quick-dock .quick-launch-btn');

  if (!cleanQuery) {
    navGroups.forEach(group => {
      group.style.display = 'flex';
      const mainBtn = group.querySelector('.nav-main-btn');
      const subMenu = group.querySelector('.sub-menu');
      const toggleIcon = mainBtn ? mainBtn.querySelector('.toggle-icon') : null;

      if (subMenu) subMenu.classList.add('collapsed');
      if (toggleIcon) toggleIcon.style.transform = 'rotate(-90deg)';

      const subBtns = group.querySelectorAll('.nav-sub-btn');
      subBtns.forEach(btn => btn.style.display = 'flex');
    });

    quickDockBtns.forEach(btn => btn.style.display = 'flex');
    return;
  }

  quickDockBtns.forEach(btn => {
    const text = btn.textContent.toLowerCase();
    btn.style.display = text.includes(cleanQuery) ? 'flex' : 'none';
  });

  navGroups.forEach(group => {
    const mainBtn = group.querySelector('.nav-main-btn');
    const subMenu = group.querySelector('.sub-menu');
    const toggleIcon = mainBtn ? mainBtn.querySelector('.toggle-icon') : null;
    const mainText = mainBtn ? mainBtn.textContent.toLowerCase() : '';
    const subBtns = group.querySelectorAll('.nav-sub-btn');

    let matchCount = 0;
    const isMainMatch = mainText.includes(cleanQuery);

    subBtns.forEach(subBtn => {
      const subText = subBtn.textContent.toLowerCase();
      if (isMainMatch || subText.includes(cleanQuery)) {
        subBtn.style.display = 'flex';
        matchCount++;
      } else {
        subBtn.style.display = 'none';
      }
    });

    if (matchCount > 0 || isMainMatch) {
      group.style.display = 'flex';
      if (subMenu) subMenu.classList.remove('collapsed');
      if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    } else {
      group.style.display = 'none';
    }
  });
}

/* --- BRAND DIRECTORY TAB DATA --- */
const brandTabData = {
  ibet: [
    { name: "IBET ADMIN", url: "https://mga-betbook.center/ibet/bets", desc: "Ibet Customer Info/Docs/Transactions" },
    { name: "IBET DEV ADMIN", url: "https://admin.dev.apexplatform.io/login", desc: "Ibet Customer Info/SMS/Funds/Transactions" },
    { name: "IBET BETSSON", url: "https://b2b.betssonbusiness.com/", desc: "Ticket Escalation for Betsson" },
    { name: "BET CONSTRUCT", url: "https://backoffice.betconstruct.com/", desc: "Pubs, Ibet, 55bet(Player Limit Adjustment, Market Creation & Suspension)" }
  ],
  edge: [
    { name: "KT SBX", url: "https://p2ibet.sbx.bet/bets", desc: "KT Tickers, Boost/Banners, Players Info" },
    { name: "EDGE ADMIN", url: "https://admin.edgegaming.io/admin/qbet/homepage", desc: "Edge Customer Info/Docs/Transactions" },
    { name: "EDGE DEV ADMIN", url: "https://admin.dev.edgegaming.io/admin/qbet/homepage", desc: "Edge Customer Info/SMS/Funds/Transactions" },
    { name: "SERVICE DESK", url: "https://kickertech.atlassian.net/servicedesk/customer/user/login?destination=portals", desc: "KT projects Ticket Escalations" }
  ],
  pubs: [
    { name: "GO GAMING", url: "https://gg-backoffice-eu.gogaming.cc/en-US/member/list", desc: "Pubs Customer Info/Docs/Transactions" }
  ]
};

function switchBrandTab(tabName) {
  document.querySelectorAll('.tab-pill').forEach(pill => pill.classList.remove('active'));
  const activePill = document.getElementById(`tab-${tabName}`);
  if (activePill) activePill.classList.add('active');

  const brandDock = document.getElementById('widget-brand-dock');
  if (brandDock) {
    brandDock.classList.remove('tint-ibet', 'tint-edge', 'tint-pubs');
    if (tabName === 'ibet') brandDock.classList.add('tint-ibet');
    else if (tabName === 'edge') brandDock.classList.add('tint-edge');
    else if (tabName === 'pubs') brandDock.classList.add('tint-pubs');
  }

  const container = document.getElementById('brandLinksContainer');
  if (!container) return;
  container.innerHTML = '';

  const items = brandTabData[tabName] || [];
  items.forEach(item => {
    const a = document.createElement('a');
    a.className = 'action-row brand-action-row';
    a.href = item.url;
    a.title = item.desc;
    if (item.url !== '#') a.target = '_blank';
    
    a.innerHTML = `
      <div class="brand-item-left">
        <span class="brand-item-title">${item.name}</span>
        <span class="brand-item-desc">${item.desc}</span>
      </div>
      <i class='bx bx-right-arrow-alt'></i>
    `;
    container.appendChild(a);
  });
}

/* --- HIGH-RELIABILITY CORS FETCH SYSTEM --- */
const fetchCorsSafe = async (targetUrl) => {
  try {
    const res = await fetch(targetUrl);
    if (res.ok) return await res.json();
  } catch (e) {}

  const proxies = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
  ];

  for (const proxyFn of proxies) {
    try {
      const res = await fetch(proxyFn(targetUrl));
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  return null;
};

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

const TOP_TIER_LEAGUES = [
  { rank: 1, key: "eng.1",             name: "Premier League",         code: "eng.1" },
  { rank: 2, key: "esp.1",             name: "La Liga",                code: "esp.1" },
  { rank: 3, key: "ger.1",             name: "Bundesliga",             code: "ger.1" },
  { rank: 4, key: "ita.1",             name: "Serie A",                code: "ita.1" },
  { rank: 5, key: "fra.1",             name: "Ligue 1",                code: "fra.1" },
  { rank: 6, key: "uefa.champions",    name: "UEFA Champions League",  code: "uefa.champions" },
  { rank: 7, key: "uefa.europa",       name: "UEFA Europa League",     code: "uefa.europa" },
  { rank: 8, key: "uefa.europa.conf",  name: "UEFA Conference League", code: "uefa.europa.conf" }
];

const SECONDARY_LEAGUES = [
  { rank: 9,  key: "ned.1",            name: "Eredivisie",             code: "ned.1" },
  { rank: 10, key: "por.1",            name: "Primeira Liga",          code: "por.1" },
  { rank: 11, key: "usa.1",            name: "MLS",                    code: "usa.1" }
];

const PRIORITY_LEAGUES = [...TOP_TIER_LEAGUES, ...SECONDARY_LEAGUES];

let cachedTopPicks = [];
let currentFilterKey = 'eng.1';
let topPicksPageIndex = 0;

function getLeagueDisplayName(key) {
  if (key === 'uefa.champions' || key === 'uefa.europa' || key === 'uefa.europa.conf' || key === 'uefa') return "UEFA";
  const lg = PRIORITY_LEAGUES.find(l => l.key === key);
  return lg ? lg.name : key.toUpperCase();
}

function loadCachedTopPicks() {
  try {
    const stored = localStorage.getItem('sbhub_toppicks_cache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const now = Date.now();
        const validPicks = parsed.filter(item => (item.kickOffTimestamp || 0) > now);
        if (validPicks.length > 0) {
          cachedTopPicks = validPicks;
          renderFilteredTopPicks();
        }
      }
    }
  } catch (e) {}
}

/* ROBUST ESPN SCOREBOARD FETCHER FOR TOP PICKS (STAGGERED TO PREVENT 429) */
async function fetchLeagueScoreboard(league) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthStr = `${y}${m}`;

  const monthUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${currentMonthStr}&limit=100`;
  const roundUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?limit=50`;

  const fetchCalls = [fetchCorsSafe(monthUrl), fetchCorsSafe(roundUrl)];

  if (now.getDate() >= 15) {
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextY = nextDate.getFullYear();
    const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
    const nextMonthStr = `${nextY}${nextM}`;
    fetchCalls.push(fetchCorsSafe(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${nextMonthStr}&limit=100`));
  }

  const results = await Promise.allSettled(fetchCalls);
  const allEvents = [];
  const seenIds = new Set();
  let leagueMeta = null;

  results.forEach(res => {
    if (res.status === 'fulfilled' && res.value) {
      if (!leagueMeta && res.value.leagues) leagueMeta = res.value.leagues;
      if (Array.isArray(res.value.events)) {
        res.value.events.forEach(evt => {
          if (evt && evt.id && !seenIds.has(evt.id)) {
            seenIds.add(evt.id);
            allEvents.push(evt);
          }
        });
      }
    }
  });

  return { events: allEvents, leagues: leagueMeta };
}

async function fetchTopPicksAndBoosts() {
  const container = document.getElementById('topPicksContainer');
  if (!container) return;

  const now = Date.now();

  try {
    const leaguePromises = PRIORITY_LEAGUES.map(async (league) => {
      try {
        const data = await fetchLeagueScoreboard(league);
        if (!data || !data.events || !Array.isArray(data.events)) return [];

        const leagueEvents = [];
        for (const evt of data.events) {
          const comp = evt.competitions?.[0];
          if (!comp) continue;

          const statusState = evt.status?.type?.state || comp.status?.type?.state;
          const isCompleted = evt.status?.type?.completed || comp.status?.type?.completed;
          if (isCompleted === true || statusState === 'post' || statusState === 'in') continue;

          const evtDate = new Date(evt.date || comp.date);
          const kickOffTimestamp = evtDate.getTime();

          if (isNaN(kickOffTimestamp) || kickOffTimestamp <= now) continue;

          const homeTeam = comp.competitors?.find(c => c.homeAway === 'home') || comp.competitors?.[0];
          const awayTeam = comp.competitors?.find(c => c.homeAway === 'away') || comp.competitors?.[1];

          if (homeTeam && awayTeam) {
            const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
            const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

            const rawHomeLogo = homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href;
            const rawAwayLogo = awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href;

            const homeLogo = (rawHomeLogo && !rawHomeLogo.includes('default.png')) ? rawHomeLogo : FALLBACK_LOGO;
            const awayLogo = (rawAwayLogo && !rawAwayLogo.includes('default.png')) ? rawAwayLogo : FALLBACK_LOGO;

            const kickOffStr = new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Asia/Manila',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).format(evtDate).toUpperCase();

            let mappedLeagueKey = league.key;
            if (league.key.startsWith('uefa.')) mappedLeagueKey = 'uefa.champions';

            leagueEvents.push({
              id: evt.id || `${homeName}-${awayName}`,
              leagueKey: mappedLeagueKey,
              leagueRank: league.rank,
              kickOffTimestamp,
              homeName,
              awayName,
              homeLogo,
              awayLogo,
              leagueName: data.leagues?.[0]?.name || league.name,
              kickOff: kickOffStr
            });
          }
        }
        return leagueEvents;
      } catch (err) {
        return [];
      }
    });

    const settledResults = await Promise.allSettled(leaguePromises);
    const seenMatchKeys = new Set();
    let apiPicks = [];

    settledResults.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        res.value.forEach(item => {
          const matchKey = item.id || `${item.homeName}-${item.awayName}`;
          if (!seenMatchKeys.has(matchKey)) {
            seenMatchKeys.add(matchKey);
            apiPicks.push(item);
          }
        });
      }
    });

    // CACHE SAFETY: Never overwrite active memory if network returned empty!
    if (apiPicks.length > 0) {
      apiPicks.sort((a, b) => a.kickOffTimestamp - b.kickOffTimestamp);
      apiPicks.forEach((pick, index) => {
        pick.market = generateScriptedMarket(pick.homeName, pick.awayName, index);
        pick.badge = (index % 2 === 0) ? "TOP PICK" : "HOT";
      });
      cachedTopPicks = apiPicks;
      localStorage.setItem('sbhub_toppicks_cache', JSON.stringify(apiPicks));
    }
  } catch (e) {}

  renderFilteredTopPicks();
}

function filterTopPicks(leagueKey, btnElement) {
  currentFilterKey = leagueKey;
  topPicksPageIndex = 0;

  document.querySelectorAll('.boost-filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const defaultBtn = document.getElementById(`btn-boost-${leagueKey}`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  renderFilteredTopPicks();
}

function getCardsPerPage() {
  const w = window.innerWidth;
  if (w <= 600) return 1;
  if (w <= 900) return 2;
  if (w <= 1300) return 4;
  return 6;
}

function navigateTopPicks(direction) {
  const now = Date.now();
  let activePicks = cachedTopPicks.filter(pick => {
    if (pick.kickOffTimestamp <= now) return false;
    if (currentFilterKey === 'uefa.champions' || currentFilterKey === 'uefa') {
      return pick.leagueKey.startsWith('uefa');
    }
    return pick.leagueKey === currentFilterKey;
  });

  if (activePicks.length === 0) return;

  activePicks.sort((a, b) => a.kickOffTimestamp - b.kickOffTimestamp);

  const pageSize = getCardsPerPage();
  const maxPages = Math.ceil(activePicks.length / pageSize);

  topPicksPageIndex += direction;
  if (topPicksPageIndex < 0) topPicksPageIndex = Math.max(0, maxPages - 1);
  if (topPicksPageIndex >= maxPages) topPicksPageIndex = 0;

  renderFilteredTopPicks();
}

function renderFilteredTopPicks() {
  const container = document.getElementById('topPicksContainer');
  const prevBtn = document.getElementById('topPicksPrevBtn');
  const nextBtn = document.getElementById('topPicksNextBtn');
  if (!container) return;

  const now = Date.now();
  let activePicks = cachedTopPicks.filter(pick => {
    if (pick.kickOffTimestamp <= now) return false;
    if (currentFilterKey === 'uefa.champions' || currentFilterKey === 'uefa') {
      return pick.leagueKey.startsWith('uefa');
    }
    return pick.leagueKey === currentFilterKey;
  });

  if (activePicks.length === 0) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    container.innerHTML = `
      <div style="text-align:center; padding:20px; width:100%; font-size:11px; color:rgba(255,255,255,0.65);">
        <i class='bx bx-calendar-x' style='font-size:20px; display:block; margin-bottom:6px; color:#38bdf8;'></i>
        No upcoming fixtures currently scheduled for ${getLeagueDisplayName(currentFilterKey)}.
      </div>
    `;
    return;
  }

  activePicks.sort((a, b) => a.kickOffTimestamp - b.kickOffTimestamp);

  const pageSize = getCardsPerPage();
  const maxPages = Math.ceil(activePicks.length / pageSize);
  if (topPicksPageIndex >= maxPages) topPicksPageIndex = 0;

  const startIndex = topPicksPageIndex * pageSize;
  const pageItems = activePicks.slice(startIndex, startIndex + pageSize);

  if (activePicks.length > pageSize) {
    if (prevBtn) prevBtn.style.display = 'flex';
    if (nextBtn) nextBtn.style.display = 'flex';
  } else {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  }

  let cardsHtml = "";
  pageItems.forEach(pick => {
    const isTopPick = pick.badge === "TOP PICK";
    cardsHtml += `
      <div class="boost-card ${isTopPick ? 'highlight-border' : ''}">
        <div class="flags-row">
          <img src="${pick.homeLogo}" alt="${pick.homeName}" class="team-flag-img" onerror="this.src='${FALLBACK_LOGO}'">
          <span class="vs-text">VS</span>
          <img src="${pick.awayLogo}" alt="${pick.awayName}" class="team-flag-img" onerror="this.src='${FALLBACK_LOGO}'">
        </div>
        
        <div class="boost-match-info">
          <div class="boost-match-title">${pick.homeName} <span class="vs-light">vs</span> ${pick.awayName}</div>
          <div class="boost-league-sub">${pick.leagueName}</div>
        </div>

        <div>
          <span class="boost-badge ${isTopPick ? 'top-pick' : 'hot'}">${pick.badge}</span>
        </div>

        <div class="boost-market-desc">${pick.market}</div>

        <div class="boost-card-bottom">
          <div class="boost-kickoff-pill"><i class='bx bx-time-five'></i> ${pick.kickOff}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = cardsHtml;
}

window.addEventListener('resize', () => {
  renderFilteredTopPicks();
});

/* --- ANIMATED PLASMA BACKGROUND CANVAS --- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width = 0, height = 0, particles = [];

function resizeCanvas() {
  if (!canvas) return;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  initParticles();
}
window.addEventListener('resize', () => {
  resizeCanvas();
  if (!isMobileDevice()) toggleMobileSidebar(false);
});

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * (isMobileDevice() ? 1.5 : 2) + 1;
    this.vx = (Math.random() - 0.5) * (isMobileDevice() ? 0.4 : 0.8);
    this.vy = (Math.random() - 0.5) * (isMobileDevice() ? 0.4 : 0.8);
    this.alpha = Math.random() * 0.4 + 0.1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
  draw() {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
    if (!isMobileDevice()) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f2fe';
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  }
}

function initParticles() {
  if (!canvas) return;
  particles = [];
  const particleCount = isMobileDevice() ? 15 : 45;
  for (let i = 0; i < particleCount; i++) particles.push(new Particle());
}

resizeCanvas();

function animateCanvas() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateCanvas);
}
if (canvas) animateCanvas();

/* --- SITTING ROBOT EYE & HEAD TRACKING --- */
document.addEventListener('mousemove', (e) => {
  if (isMobileDevice()) return;

  const robotStage = document.getElementById('sittingRobotStage');
  const authOverlay = document.getElementById('authOverlay');
  if (!robotStage || (authOverlay && authOverlay.classList.contains('unlocked'))) return;

  const leftEye = document.getElementById('leftEye');
  const rightEye = document.getElementById('rightEye');
  const robotHead = document.getElementById('robotHead');
  const robotBodyWrapper = document.getElementById('robotBodyWrapper');

  const rect = robotStage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;
  const angle = Math.atan2(deltaY, deltaX);

  const eyeDist = Math.min(5, Math.hypot(deltaX, deltaY) / 35);
  const eyeX = Math.cos(angle) * eyeDist;
  const eyeY = Math.sin(angle) * eyeDist;

  if (leftEye && rightEye) {
    leftEye.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
    rightEye.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
  }

  const rotateY = Math.max(-25, Math.min(25, deltaX / 20));
  const rotateX = Math.max(-15, Math.min(15, -deltaY / 25));

  if (robotHead) robotHead.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  if (robotBodyWrapper) robotBodyWrapper.style.transform = `rotateY(${rotateY * 0.3}deg)`;
});

/* --- WORLD CLOCKS SYSTEM --- */
function updateWorldClocks() {
  const now = new Date();
  const optionsGMT8 = { timeZone: 'Asia/Singapore', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const gmt8El = document.getElementById('clock-gmt8');
  if (gmt8El) gmt8El.textContent = new Intl.DateTimeFormat('en-GB', optionsGMT8).format(now);

  const optionsCET = { timeZone: 'Europe/Berlin', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const cetEl = document.getElementById('clock-cet');
  if (cetEl) cetEl.textContent = new Intl.DateTimeFormat('en-GB', optionsCET).format(now);

  const optionsGMT2 = { timeZone: 'Europe/Athens', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const gmt2El = document.getElementById('clock-gmt2');
  if (gmt2El) gmt2El.textContent = new Intl.DateTimeFormat('en-GB', optionsGMT2).format(now);
}
setInterval(updateWorldClocks, 1000);
updateWorldClocks();

/* --- REAL-TIME PHILIPPINES (MANILA) WEATHER FORECAST --- */
async function fetchManilaWeather() {
  const tempEl = document.getElementById('weatherTemp');
  const condEl = document.getElementById('weatherCond');
  const humEl = document.getElementById('weatherHumidity');
  const windEl = document.getElementById('weatherWind');
  const iconEl = document.getElementById('weatherIcon');

  if (!tempEl) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current_weather=true&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FManila';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();

    let temp, humidity, wind, code;

    if (data && data.current) {
      temp = Math.round(data.current.temperature_2m ?? data.current_weather?.temperature);
      humidity = data.current.relative_humidity_2m ?? 56;
      wind = Math.round(data.current.wind_speed_10m ?? data.current_weather?.windspeed ?? 7);
      code = data.current.weather_code ?? data.current_weather?.weathercode ?? 3;
    } else if (data && data.current_weather) {
      temp = Math.round(data.current_weather.temperature);
      humidity = 56;
      wind = Math.round(data.current_weather.windspeed);
      code = data.current_weather.weathercode;
    } else {
      throw new Error('Invalid weather payload');
    }

    const weatherMeta = parseWMOWeatherCode(code);

    tempEl.textContent = `${temp}°C`;
    if (condEl) condEl.textContent = weatherMeta.label;
    if (humEl) humEl.textContent = `Humidity: ${humidity}%`;
    if (windEl) windEl.textContent = `Wind: ${wind} km/h`;

    if (iconEl) {
      iconEl.className = `bx ${weatherMeta.icon}`;
      iconEl.style.color = weatherMeta.color;
    }
  } catch (err) {
    tempEl.textContent = '32°C';
    if (condEl) condEl.textContent = 'OVERCAST';
    if (humEl) humEl.textContent = 'Humidity: 56%';
    if (windEl) windEl.textContent = 'Wind: 7 km/h';
  }
}

function parseWMOWeatherCode(code) {
  if (code === 0) return { label: 'CLEAR SKY', icon: 'bx-sun', color: '#f59e0b' };
  if (code === 1 || code === 2) return { label: 'PARTLY CLOUDY', icon: 'bx-cloud-sun', color: '#f59e0b' };
  if (code === 3) return { label: 'OVERCAST', icon: 'bx-cloud', color: '#38bdf8' };
  if (code >= 45 && code <= 48) return { label: 'FOGGY', icon: 'bx-cloud-fog', color: '#94a3b8' };
  if (code >= 51 && code <= 67) return { label: 'LIGHT RAIN', icon: 'bx-cloud-drizzle', color: '#60a5fa' };
  if (code >= 80 && code <= 82) return { label: 'HEAVY RAIN', icon: 'bx-cloud-showers-heavy', color: '#3b82f6' };
  if (code >= 95) return { label: 'THUNDERSTORM', icon: 'bx-cloud-lightning', color: '#eab308' };
  return { label: 'CLOUDY', icon: 'bx-cloud', color: '#38bdf8' };
}

/* --- AUTHENTICATION ENGINE --- */
function togglePasswordVisibility() {
  const passInput = document.getElementById('passwordInput');
  const icon = document.getElementById('togglePassIcon');
  if (!passInput || !icon) return;
  
  if (passInput.type === 'password') {
    passInput.type = 'text';
    icon.className = 'bx bx-hide';
  } else {
    passInput.type = 'password';
    icon.className = 'bx bx-show';
  }
}

function handleLogin(event) {
  if (event) event.preventDefault();
  const userInput = document.getElementById('usernameInput');
  const passInput = document.getElementById('passwordInput');
  const rememberCheckbox = document.getElementById('rememberMe');

  const userVal = userInput ? userInput.value.trim() : '';
  const passVal = passInput ? passInput.value.trim() : '';
  const isRemember = rememberCheckbox ? rememberCheckbox.checked : false;

  const errorMsg = document.getElementById('loginErrorMsg');
  const card = document.getElementById('loginCard');

  if (
    userVal.length > 0 && 
    (passVal === DEFAULT_PASS || passVal === "sb2026" || passVal === "sportsbook2026" || passVal.length >= 4)
  ) {
    if (isRemember) {
      localStorage.setItem('sbhub_auth', 'true');
    } else {
      sessionStorage.setItem('sbhub_auth', 'true');
    }
    unlockDashboard();
  } else {
    if (errorMsg) errorMsg.textContent = "ACCESS DENIED: Enter valid Security Key";
    if (card) {
      card.classList.add('shake');
      setTimeout(() => {
        card.classList.remove('shake');
      }, 500);
    }
    if (passInput) {
      passInput.focus();
      passInput.select();
    }
  }
}

function unlockDashboard() {
  document.documentElement.classList.add('sbhub-authenticated');
  const authOverlay = document.getElementById('authOverlay');
  const dashboardApp = document.getElementById('dashboardApp');
  if (authOverlay) {
    authOverlay.classList.add('unlocked');
    authOverlay.style.display = 'none';
  }
  if (dashboardApp) {
    dashboardApp.classList.add('unlocked');
    dashboardApp.style.opacity = '1';
    dashboardApp.style.visibility = 'visible';
  }
}

function handleLogout() {
  localStorage.removeItem('sbhub_auth');
  sessionStorage.removeItem('sbhub_auth');
  document.documentElement.classList.remove('sbhub-authenticated');

  const passInput = document.getElementById('passwordInput');
  if (passInput) passInput.value = '';
  const errorMsg = document.getElementById('loginErrorMsg');
  if (errorMsg) errorMsg.textContent = '';
  const dashboardApp = document.getElementById('dashboardApp');
  const authOverlay = document.getElementById('authOverlay');
  if (dashboardApp) dashboardApp.classList.remove('unlocked');
  if (authOverlay) {
    authOverlay.classList.remove('unlocked');
    authOverlay.style.display = 'flex';
  }
}

/* --- UI TOGGLES & WIDGET MANAGEMENT --- */
function toggleMenu(menuId, btnElement) {
  const targetMenu = document.getElementById(menuId);
  if (!targetMenu) return;
  const isCollapsed = targetMenu.classList.contains('collapsed');
  const icon = btnElement ? btnElement.querySelector('.toggle-icon') : null;
  
  if (isCollapsed) {
    targetMenu.classList.remove('collapsed');
    if (icon) icon.style.transform = 'rotate(0deg)';
  } else {
    targetMenu.classList.add('collapsed');
    if (icon) icon.style.transform = 'rotate(-90deg)';
  }
}

function toggleDropdown(menuId) {
  const menu = document.getElementById(menuId);
  if (menu) menu.classList.toggle('show');
}

function toggleWidget(widgetId, show) {
  const el = document.getElementById(widgetId);
  if (el) el.style.display = show ? 'flex' : 'none';

  const checkbox = document.querySelector(`input[onchange*="${widgetId}"]`);
  if (checkbox) checkbox.checked = show;

  try {
    const savedWidgets = JSON.parse(localStorage.getItem('sbhub_widgets') || '{}');
    savedWidgets[widgetId] = show;
    localStorage.setItem('sbhub_widgets', JSON.stringify(savedWidgets));
  } catch(e) {}
}

function hideWidgetDirect(widgetId) {
  toggleWidget(widgetId, false);
}

function restoreSavedWidgets() {
  try {
    const savedWidgets = JSON.parse(localStorage.getItem('sbhub_widgets') || '{}');
    Object.keys(savedWidgets).forEach(widgetId => {
      toggleWidget(widgetId, savedWidgets[widgetId]);
    });
  } catch(e) {}
}

/* --- THEME SWITCHER ENGINE --- */
function setGradient(theme) {
  const body = document.getElementById('pageBody');
  if (!body) return;
  let backgroundStyle = '';

  const lightThemes = ['plain-daylight', 'plain-sky-light', 'plain-warm-light'];
  if (lightThemes.includes(theme)) {
    body.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
  }

  if (ABSTRACT_WALLPAPERS[theme]) {
    backgroundStyle = `url("${ABSTRACT_WALLPAPERS[theme]}")`;
  } else if (typeof theme === 'string' && (theme.startsWith('http') || theme.startsWith('url(') || theme.startsWith('data:'))) {
    backgroundStyle = theme.startsWith('url(') ? theme : `url("${theme}")`;
  } else {
    switch(theme) {
      case 'plain-slate':
        backgroundStyle = 'linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), #0f172a';
        break;
      case 'plain-navy':
        backgroundStyle = 'linear-gradient(rgba(11, 19, 41, 0.95), rgba(11, 19, 41, 0.95)), #0b1329';
        break;
      case 'plain-onyx':
        backgroundStyle = 'linear-gradient(rgba(18, 18, 18, 0.95), rgba(18, 18, 18, 0.95)), #121212';
        break;
      case 'plain-daylight':
        backgroundStyle = 'linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)), #f8fafc';
        break;
      case 'plain-sky-light':
        backgroundStyle = 'linear-gradient(rgba(224, 242, 254, 0.95), rgba(224, 242, 254, 0.95)), #e0f2fe';
        break;
      case 'plain-warm-light':
        backgroundStyle = 'linear-gradient(rgba(245, 245, 244, 0.95), rgba(245, 245, 244, 0.95)), #f5f5f4';
        break;
      default:
        backgroundStyle = `url("${ABSTRACT_WALLPAPERS['blue-orange-wave']}")`;
    }
  }

  body.style.background = backgroundStyle;
  body.style.backgroundSize = 'cover';
  body.style.backgroundPosition = 'center';
  body.style.backgroundAttachment = 'fixed';
  body.style.backgroundRepeat = 'no-repeat';

  const themeMenu = document.getElementById('themeMenu');
  if (themeMenu) themeMenu.classList.remove('show');
  localStorage.setItem('sbhub_theme', theme);
}

/* --- REAL-TIME LIVE DUTY ROSTER WITH TRADER FILTER --- */
function filterTraderDuty(traderName) {
  activeTraderFilter = traderName.toUpperCase();
  renderLiveDutyWidget(lastRosterSnapshotData);
}

function getGMT8IsoDate() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const year = nowManila.getFullYear();
  const month = String(nowManila.getMonth() + 1).padStart(2, '0');
  const day = String(nowManila.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentSlotInfo() {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours = nowManila.getHours();
  if (hours >= 6 && hours < 9)    return { slotId: "slot_6_9", label: "7:00 - 9:00" };
  if (hours >= 9 && hours < 12)  return { slotId: "slot_9_12", label: "9:00 - 12:00" };
  if (hours >= 12 && hours < 15) return { slotId: "slot_12_15", label: "12:00 - 15:00" };
  if (hours >= 15 && hours < 18) return { slotId: "slot_15_18", label: "15:00 - 18:00" };
  if (hours >= 18 && hours < 21) return { slotId: "slot_18_21", label: "18:00 - 21:00" };
  return { slotId: "slot_21_0", label: "21:00 - 00:00" };
}

function listenToLiveDutyRoster() {
  if (!rosterDb) {
    renderLiveDutyWidget(null);
    return;
  }
  rosterDb.ref('roster_data').on('value', (snapshot) => {
    renderLiveDutyWidget(snapshot.val());
  }, (error) => {
    renderLiveDutyWidget(null);
  });
}

function renderLiveDutyWidget(rosterData) {
  lastRosterSnapshotData = rosterData;
  const container = document.getElementById("liveDutyContent");
  if (!container) return;

  const todayIso = getGMT8IsoDate();
  const { slotId, label: slotLabel } = getCurrentSlotInfo();

  if (!rosterData) {
    const fallbackMembers = [
      { id: 'ann', name: 'ANN', shift: '7-16', task: 'Monitoring Edge & IBET Markets' },
      { id: 'dave', name: 'DAVE', shift: 'REST DAY', task: 'Rest day.' },
      { id: 'ken', name: 'KEN', shift: 'REST DAY', task: 'Rest day.' },
      { id: 'kriztel', name: 'KRIZTEL', shift: '12-21', task: 'Live Risk & Duty Operations' }
    ];

    const filteredMembers = fallbackMembers.filter(m => 
      activeTraderFilter === 'ALL' || m.name === activeTraderFilter
    );

    let fallbackHtml = `
      <div style="font-size:11px; font-weight:700; opacity:0.9; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span>📅 ${todayIso}</span>
        <span class="badge-time">⏰ ${slotLabel}</span>
      </div>
    `;

    filteredMembers.forEach(m => {
      fallbackHtml += `
        <div class="duty-card">
          <div class="duty-top">
            <span>${m.name}</span>
            <span class="badge-time">${m.shift}</span>
          </div>
          <div class="duty-desc">${m.task}</div>
        </div>
      `;
    });

    container.innerHTML = fallbackHtml;
    calculateActiveTraders();
    return;
  }

  let activeDayKey = Object.keys(rosterData).find(key => {
    if (key === 'archives') return false;
    const entry = rosterData[key];
    return entry?.isoDate === todayIso || entry?.date === todayIso || key === todayIso || key.includes(todayIso);
  });

  if (!activeDayKey) {
    const activeKeys = Object.keys(rosterData).filter(k => k !== 'archives');
    activeKeys.sort((a, b) => {
      const dateA = rosterData[b]?.isoDate || rosterData[b]?.date || b;
      const dateB = rosterData[a]?.isoDate || rosterData[a]?.date || a;
      return String(dateA).localeCompare(String(dateB));
    });
    activeDayKey = activeKeys[0];
  }

  const dayData = rosterData[activeDayKey];
  const displayDate = dayData?.isoDate || dayData?.date || todayIso;
  const teamMembers = [
    { id: 'ann', name: 'ANN' }, { id: 'dave', name: 'DAVE' },
    { id: 'ken', name: 'KEN' }, { id: 'kriztel', name: 'KRIZTEL' }
  ];

  const filteredTeam = teamMembers.filter(m => 
    activeTraderFilter === 'ALL' || m.name === activeTraderFilter
  );

  let html = `
    <div style="font-size:11px; font-weight:700; opacity:0.9; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <span>📅 ${displayDate}</span>
      <span class="badge-time">⏰ ${slotLabel}</span>
    </div>
  `;

  filteredTeam.forEach(m => {
    const mGrid = dayData.grid ? dayData.grid[m.id] : null;
    const shiftId = mGrid?.shift || 'shift-7-16';
    const isRest = (shiftId === 'shift-rd' || shiftId === 'shift-vl' || shiftId === 'shift-sl');
    const restLabel = shiftId === 'shift-vl' ? 'VACATION LEAVE' : (shiftId === 'shift-sl' ? 'SICK LEAVE' : 'REST DAY');

    let rawTasks = (mGrid && mGrid.slots) ? mGrid.slots[slotId] || [] : [];
    if (!Array.isArray(rawTasks)) rawTasks = [];
    const tasks = rawTasks.map(item => (typeof item === 'string' ? { text: item, done: false } : { text: item.text || '', done: !!item.done }));

    html += `
      <div class="duty-card">
        <div class="duty-top">
          <span>${m.name}</span>
          <span class="badge-time">${isRest ? restLabel : shiftId.replace('shift-', '')}</span>
        </div>
    `;

    if (isRest) {
      html += `<div class="duty-desc">Rest day.</div>`;
    } else if (tasks.length === 0) {
      html += `<div class="duty-desc">No assigned tasks in this slot.</div>`;
    } else {
      tasks.forEach(t => {
        html += `<div class="duty-desc" style="display:flex; gap:4px; align-items:center;">
          <i class='bx ${t.done ? 'bx-check-circle' : 'bx-time-five'}' style="color:${t.done ? '#34d399' : '#38bdf8'}"></i>
          <span style="${t.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">${t.text}</span>
        </div>`;
      });
    }
    html += `</div>`;
  });

  container.innerHTML = html;
  calculateActiveTraders();
}

/* ==========================================================================
   AUTHENTIC TOURNAMENT NAME RESOLVER
   ========================================================================== */
function resolveCleanLeagueName(evt, comp) {
  const candidates = [
    evt?.league?.name,
    evt?.season?.displayName,
    comp?.league?.name,
    comp?.type?.text
  ];

  for (const name of candidates) {
    if (name && typeof name === 'string' && name.trim().length > 0 && name.toLowerCase() !== 'soccer') {
      return name.trim();
    }
  }

  const slug = (evt?.league?.slug || evt?.season?.slug || '').toLowerCase();
  if (slug.includes('uefa.champions')) return 'UEFA Champions League';
  if (slug.includes('uefa.europa.conf')) return 'UEFA Conference League';
  if (slug.includes('uefa.europa')) return 'UEFA Europa League';
  if (slug.includes('uefa.nations')) return 'UEFA Nations League';
  if (slug.includes('eng.1')) return 'Premier League';
  if (slug.includes('esp.1')) return 'La Liga';
  if (slug.includes('ger.1')) return 'Bundesliga';
  if (slug.includes('ita.1')) return 'Serie A';
  if (slug.includes('fra.1')) return 'Ligue 1';
  if (slug.includes('por.1')) return 'Portugal Liga';
  if (slug.includes('ned.1')) return 'Eredivisie';
  if (slug.includes('fin.1')) return 'Veikkausliiga';
  if (slug.includes('nor.1')) return 'Eliteserien';
  if (slug.includes('afc.champions_league_two') || slug.includes('acl2')) return 'AFC Champions League Two';
  if (slug.includes('afc.champions')) return 'AFC Champions League Elite';
  if (slug.includes('usa.1')) return 'MLS';

  return 'International Soccer';
}

/* ==========================================================================
   TOP GAMES (DAILY MATCHDAY) STRICT PRIORITIZATION LOGIC
   Reference: European Championships + Top European Leagues + MLS(Miami) + Backups
   ========================================================================== */
function classifyMatchPriority(homeName, awayName, leagueTitle, slug) {
  const l = (leagueTitle || '').toLowerCase();
  const s = (slug || '').toLowerCase();
  const h = (homeName || '').toLowerCase();
  const a = (awayName || '').toLowerCase();

  // Tier 1: UEFA Competitions & European Championships
  if (
    s.includes('uefa.champions') || l.includes('champions league') ||
    s.includes('uefa.europa.conf') || l.includes('conference league') ||
    s.includes('uefa.europa') || l.includes('europa league') ||
    s.includes('uefa.nations') || l.includes('nations league') ||
    s.includes('uefa.euro') || l.includes('european championship') ||
    l.includes('uefa')
  ) {
    return { tier: 1, rank: 1 };
  }

  // Tier 1: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Portugal, Netherlands
  if (s.includes('eng.1') || l.includes('premier league')) return { tier: 1, rank: 2 };
  if (s.includes('esp.1') || l.includes('la liga') || l.includes('laliga')) return { tier: 1, rank: 3 };
  if (s.includes('ger.1') || l.includes('bundesliga')) return { tier: 1, rank: 4 };
  if (s.includes('ita.1') || l.includes('serie a')) return { tier: 1, rank: 5 };
  if (s.includes('fra.1') || l.includes('ligue 1')) return { tier: 1, rank: 6 };
  if (s.includes('por.1') || l.includes('primeira liga') || l.includes('portugal')) return { tier: 1, rank: 7 };
  if (s.includes('ned.1') || l.includes('eredivisie')) return { tier: 1, rank: 8 };

  // Tier 2: MLS (ONLY if Inter Miami is participating)
  const isMLS = s.includes('usa.1') || l.includes('mls') || l.includes('major league soccer');
  if (isMLS) {
    const hasMiami = h.includes('inter miami') || a.includes('inter miami') || h.includes('miami') || a.includes('miami');
    if (hasMiami) return { tier: 2, rank: 9 };
    return null; // Reject all other MLS fixtures without Inter Miami
  }

  // Tier 3: Backup Leagues (Finland Veikkausliiga, Norway Eliteserien)
  if (s.includes('fin.1') || l.includes('veikkausliiga') || l.includes('finland')) return { tier: 3, rank: 10 };
  if (s.includes('nor.1') || l.includes('eliteserien') || l.includes('norway')) return { tier: 3, rank: 11 };

  // Tier 4: Prestigious Continental & Cup Matches (AFC Champions League, FA Cup, Copa del Rey)
  if (
    l.includes('afc champions') || s.includes('afc.champions') ||
    l.includes('fa cup') || s.includes('eng.fa') ||
    l.includes('copa del rey') || s.includes('esp.copa_del_rey')
  ) {
    return { tier: 4, rank: 12 };
  }

  // Tier 5: General competitive football
  return { tier: 5, rank: 20 };
}

function getGMT8DateObj(offsetDays = 0) {
  const now = new Date();
  const gmt8String = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const gmt8Date = new Date(gmt8String);
  gmt8Date.setDate(gmt8Date.getDate() + offsetDays);
  return gmt8Date;
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

  const targetDateObj = getGMT8DateObj(selectedGameDayOffset);
  const dateLabelStr = targetDateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
  
  const dayTag = (selectedGameDayOffset === 0) ? `TODAY` : `DAY ${selectedGameDayOffset + 1}`;
  const labelEl = document.getElementById("matchDayDisplay");
  if (labelEl) labelEl.textContent = `${dayTag} (${dateLabelStr})`;

  const targetIsoDay = `${targetDateObj.getFullYear()}-${String(targetDateObj.getMonth() + 1).padStart(2, '0')}-${String(targetDateObj.getDate()).padStart(2, '0')}`;
  const targetDateQuery = getFormattedDateQuery(selectedGameDayOffset);
  const prevDateQuery = getFormattedDateQuery(selectedGameDayOffset - 1);
  const nextDateQuery = getFormattedDateQuery(selectedGameDayOffset + 1);

  // Restore session cache immediately to avoid blank display while loading
  const cacheKey = `sbhub_daily_fixture_${targetIsoDay}`;
  const cachedData = sessionStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        renderDailyGamesCards(container, parsed);
      }
    } catch (e) {}
  }

  try {
    // Ultra-reliable 4-request parallel batch (Global soccer + UEFA dedicated channels)
    const endpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${targetDateQuery}&limit=250`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/scoreboard?dates=${targetDateQuery}&limit=100`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa.conf/scoreboard?dates=${targetDateQuery}&limit=100`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${prevDateQuery}&limit=100`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${nextDateQuery}&limit=100`
    ];

    const results = await Promise.allSettled(endpoints.map(u => fetchCorsSafe(u)));
    const seenMatchKeys = new Set();
    const candidateMatches = [];

    results.forEach(res => {
      if (res.status !== 'fulfilled' || !res.value || !Array.isArray(res.value.events)) return;

      res.value.events.forEach(evt => {
        const comp = evt.competitions?.[0];
        if (!comp) return;

        const dObj = new Date(evt.date || comp.date);
        const matchTimestamp = dObj.getTime();
        if (isNaN(matchTimestamp)) return;

        // Flashscore Manila Date & European UTC Date
        const matchDayInManila = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(dObj);

        const matchDayInUTC = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(dObj);

        // Include match if it kicks off on this Manila calendar day OR is part of tonight's European evening matchday
        const isManilaMatchday = (matchDayInManila === targetIsoDay);
        const isEuropeanSlate = (matchDayInUTC === targetIsoDay);

        if (!isManilaMatchday && !isEuropeanSlate) return;

        const homeTeam = comp.competitors?.find(c => c.homeAway === 'home') || comp.competitors?.[0];
        const awayTeam = comp.competitors?.find(c => c.homeAway === 'away') || comp.competitors?.[1];
        if (!homeTeam || !awayTeam) return;

        const homeName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || "Home";
        const awayName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || "Away";

        const matchKey = evt.id || `${homeName}-${awayName}`;
        if (seenMatchKeys.has(matchKey)) return;

        const cleanLeague = resolveCleanLeagueName(evt, comp);
        const slug = evt.league?.slug || evt.season?.slug || '';
        const priorityMeta = classifyMatchPriority(homeName, awayName, cleanLeague, slug);

        // Discard matches that don't pass priority filters (e.g. non-Miami MLS games)
        if (!priorityMeta) return;

        seenMatchKeys.add(matchKey);

        const rawHomeLogo = homeTeam.team?.logo || homeTeam.team?.logos?.[0]?.href;
        const rawAwayLogo = awayTeam.team?.logo || awayTeam.team?.logos?.[0]?.href;
        const homeLogo = (rawHomeLogo && !rawHomeLogo.includes('default.png')) ? rawHomeLogo : FALLBACK_LOGO;
        const awayLogo = (rawAwayLogo && !rawAwayLogo.includes('default.png')) ? rawAwayLogo : FALLBACK_LOGO;

        const homeScore = homeTeam.score ?? '';
        const awayScore = awayTeam.score ?? '';

        const statusState = evt.status?.type?.state || comp.status?.type?.state || 'pre';
        const statusDetail = evt.status?.type?.shortDetail || comp.status?.type?.shortDetail || '';

        const kickOffTime = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(dObj);

        candidateMatches.push({
          id: matchKey,
          homeName,
          awayName,
          homeLogo,
          awayLogo,
          homeScore,
          awayScore,
          statusState,
          statusDetail,
          leagueName: cleanLeague,
          kickOffTimestamp: matchTimestamp,
          kickOffTime,
          tier: priorityMeta.tier,
          rank: priorityMeta.rank
        });
      });
    });

    if (candidateMatches.length === 0) {
      if (!cachedData) {
        container.innerHTML = `<div style="text-align:center; padding:20px; font-size:11px; color:rgba(255,255,255,0.65);">No scheduled fixtures for ${dateLabelStr} (GMT+8).</div>`;
      }
      return;
    }

    // Dynamic Tier Filtering:
    // Prioritize Tier 1 (UEFA + Top Leagues) and Tier 2 (MLS Inter Miami).
    // If fewer than 4 matches, pull in Tier 3 (Finland Veikkausliiga & Norway Eliteserien).
    // If still scarce, pull in Tier 4 (AFC Champions League / Cups).
    let selectedMatches = candidateMatches.filter(m => m.tier <= 2);
    if (selectedMatches.length < 4) {
      selectedMatches = candidateMatches.filter(m => m.tier <= 3);
    }
    if (selectedMatches.length < 4) {
      selectedMatches = candidateMatches.filter(m => m.tier <= 4);
    }
    if (selectedMatches.length === 0) {
      selectedMatches = candidateMatches;
    }

    // Sort order: Live matches first -> Upcoming chronological -> Full-Time finished
    selectedMatches.sort((a, b) => {
      const stateWeight = (s) => (s === 'in' ? 0 : (s === 'pre' ? 1 : 2));
      const wDiff = stateWeight(a.statusState) - stateWeight(b.statusState);
      if (wDiff !== 0) return wDiff;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.kickOffTimestamp - b.kickOffTimestamp;
    });

    const displaySlate = selectedMatches.slice(0, 10);
    sessionStorage.setItem(cacheKey, JSON.stringify(displaySlate));
    renderDailyGamesCards(container, displaySlate);

  } catch (e) {
    if (!cachedData) {
      container.innerHTML = `<div style="text-align:center; padding:20px; font-size:11px; color:rgba(255,255,255,0.65);">No scheduled fixtures for ${dateLabelStr} (GMT+8).</div>`;
    }
  }
}

function renderDailyGamesCards(container, matches) {
  let gamesHtml = "";
  matches.forEach(item => {
    let centerVsHtml = `<span class="vs-text">vs</span>`;
    let timeStatusHtml = `<span style="color:#38bdf8;"><i class='bx bx-time-five'></i> ${item.kickOffTime}</span>`;

    if (item.statusState === 'in') {
      centerVsHtml = `<span class="vs-text" style="color:#ef4444; font-weight:700; font-size:13px;">${item.homeScore} - ${item.awayScore}</span>`;
      timeStatusHtml = `<span style="color:#ef4444; font-weight:700;"><i class='bx bx-radio-circle-marked'></i> LIVE ${item.statusDetail}</span>`;
    } else if (item.statusState === 'post') {
      centerVsHtml = `<span class="vs-text" style="color:#38bdf8; font-weight:700; font-size:13px;">${item.homeScore} - ${item.awayScore}</span>`;
      timeStatusHtml = `<span style="color:rgba(255,255,255,0.6); font-weight:600;">FT</span>`;
    }

    gamesHtml += `
      <div class="top-game-card">
        <div class="top-game-flags">
          <img src="${item.homeLogo}" alt="${item.homeName}" class="team-flag-img" onerror="this.src='${FALLBACK_LOGO}'">
          ${centerVsHtml}
          <img src="${item.awayLogo}" alt="${item.awayName}" class="team-flag-img" onerror="this.src='${FALLBACK_LOGO}'">
        </div>
        <div class="top-game-title">${item.homeName} <span class="vs-light">vs</span> ${item.awayName}</div>
        <div class="top-game-league">${item.leagueName} &bull; ${timeStatusHtml}</div>
      </div>
    `;
  });

  container.innerHTML = gamesHtml;
}

function navigateMatchDay(dir) {
  selectedGameDayOffset += dir;
  if (selectedGameDayOffset < 0) selectedGameDayOffset = 6;
  if (selectedGameDayOffset > 6) selectedGameDayOffset = 0;
  fetchLiveGames();
}

function calculateActiveTraders() {
  const dutyCards = document.querySelectorAll('.duty-card');
  let activeCount = 0;
  dutyCards.forEach(card => {
    const timeBadge = card.querySelector('.badge-time');
    if (timeBadge) {
      const text = timeBadge.textContent.trim().toUpperCase();
      if (!text.includes('OFF') && !text.includes('REST') && !text.includes('RD') && !text.includes('LEAVE')) {
        activeCount++;
      }
    }
  });
  const el = document.getElementById('activeTraderCount');
  if (el) el.textContent = activeCount + ' Working';
}

/* --- INITIALIZATION --- */
function initDashboardApp() {
  const savedTheme = localStorage.getItem('sbhub_theme');
  if (savedTheme) {
    setGradient(savedTheme);
  } else {
    setGradient('blue-orange-wave');
  }

  const savedGlassOpacity = localStorage.getItem('sbhub_glass_opacity') || '0.45';
  updateGlassOpacity(savedGlassOpacity);
  const sliderInput = document.getElementById('glassOpacitySlider');
  if (sliderInput) sliderInput.value = savedGlassOpacity;

  if (localStorage.getItem('sbhub_auth') === 'true' || sessionStorage.getItem('sbhub_auth') === 'true') {
    unlockDashboard();
  }

  switchBrandTab('ibet');
  restoreSavedWidgets();

  loadCachedTopPicks();
  renderLiveDutyWidget(null);
  fetchLiveGames();

  // Background Live Fetch Pipeline
  fetchTopPicksAndBoosts();
  setInterval(fetchTopPicksAndBoosts, 3 * 60 * 1000);

  // Auto-refresh matchday slate every 60 seconds
  setInterval(fetchLiveGames, 60 * 1000);

  listenToLiveDutyRoster();
  calculateActiveTraders();
  fetchManilaWeather();
  setInterval(fetchManilaWeather, 15 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardApp);
} else {
  initDashboardApp();
}

window.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown-container')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  }
});
