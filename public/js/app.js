/* ── Arcade App JS ── */

/* ─── AUTH SYSTEM ───────────────────────────────────────────
   Token stored in localStorage — never the password.
   Every score submission sends the token as a header.
   Server validates token and resolves the real username.
──────────────────────────────────────────────────────────── */
const User = {
  TOKEN_KEY: 'arcade_token',
  NAME_KEY:  'arcade_username',

  getToken()    { return localStorage.getItem(this.TOKEN_KEY) || null; },
  getUsername() { return localStorage.getItem(this.NAME_KEY)  || null; },
  isLoggedIn()  { return !!this.getToken(); },

  save(token, username) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.NAME_KEY, username);
    this.updateNav();
  },

  async logout() {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'x-arcade-token': token }
        });
      } catch (_) {}
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.NAME_KEY);
    this.updateNav();
  },

  updateNav() {
    const btn = document.getElementById('nav-user-btn');
    if (!btn) return;
    const name = this.getUsername();
    if (name) {
      btn.textContent = '● ' + name;
      btn.classList.add('logged-in');
      btn.title = 'Logged in as ' + name;
    } else {
      btn.textContent = 'Log In';
      btn.classList.remove('logged-in');
      btn.title = 'Log in to save your scores';
    }
  },

  // Verify stored token is still valid on page load
  async verify() {
    const token = this.getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', { headers: { 'x-arcade-token': token } });
      if (!res.ok) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.NAME_KEY);
        this.updateNav();
      }
    } catch (_) {}
  }
};

/* ─── LOGIN MODAL ────────────────────────────────────────── */
function injectLoginModal() {
  if (document.getElementById('login-modal-overlay')) return;

  const el = document.createElement('div');
  el.className = 'login-modal-overlay';
  el.id = 'login-modal-overlay';
  el.innerHTML = `
    <div class="login-modal">
      <div class="login-modal-icon">🕹</div>
      <h2 id="auth-modal-title">Welcome Back</h2>
      <p id="auth-modal-sub">Log in to save your scores to the leaderboard.</p>

      <div class="form-grid">
        <div class="field">
          <label>Username</label>
          <input type="text" id="auth-username" placeholder="Your username" maxlength="32" autocomplete="username" />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="auth-password" placeholder="Your password" autocomplete="current-password" />
        </div>
        <div id="auth-error" style="color:var(--danger);font-size:.85rem;min-height:1.2em;"></div>
      </div>

      <div class="login-modal-actions">
        <button class="btn secondary sm" id="auth-cancel-btn">Cancel</button>
        <button class="btn primary" id="auth-submit-btn">Log In →</button>
      </div>

      <div style="margin-top:14px;text-align:center;font-size:.88rem;color:var(--muted);">
        <span id="auth-toggle-text">Don't have an account?</span>
        <button id="auth-toggle-btn" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.88rem;font-family:inherit;padding:0 4px;text-decoration:underline;">Register</button>
      </div>

      <div class="logout-row" id="login-logout-row" style="display:none;">
        <button class="btn sm" id="auth-logout-btn" style="color:var(--danger);border-color:rgba(255,71,87,.25);background:rgba(255,71,87,.06);">Log Out</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  if (!document.getElementById('toast')) {
    const t = document.createElement('div');
    t.className = 'toast'; t.id = 'toast';
    document.body.appendChild(t);
  }
}

function initLoginModal() {
  const overlay   = document.getElementById('login-modal-overlay');
  const titleEl   = document.getElementById('auth-modal-title');
  const subEl     = document.getElementById('auth-modal-sub');
  const userInput = document.getElementById('auth-username');
  const passInput = document.getElementById('auth-password');
  const errorEl   = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');
  const cancelBtn = document.getElementById('auth-cancel-btn');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const toggleTxt = document.getElementById('auth-toggle-text');
  const logoutRow = document.getElementById('login-logout-row');
  const logoutBtn = document.getElementById('auth-logout-btn');
  const navBtn    = document.getElementById('nav-user-btn');

  if (!overlay) return;

  let isRegister = false;

  function setMode(reg) {
    isRegister = reg;
    titleEl.textContent   = reg ? 'Create Account' : 'Welcome Back';
    subEl.textContent     = reg
      ? 'Pick a username and password to track your scores.'
      : 'Log in to save your scores to the leaderboard.';
    submitBtn.textContent = reg ? 'Register →' : 'Log In →';
    toggleTxt.textContent = reg ? 'Already have an account?' : "Don't have an account?";
    toggleBtn.textContent = reg ? 'Log In' : 'Register';
    passInput.autocomplete = reg ? 'new-password' : 'current-password';
    errorEl.textContent = '';
  }

  function openModal() {
    const loggedIn = User.isLoggedIn();
    logoutRow.style.display = loggedIn ? 'flex' : 'none';
    if (loggedIn) {
      setMode(false);
      userInput.value = User.getUsername() || '';
      passInput.value = '';
    } else {
      setMode(false);
      userInput.value = '';
      passInput.value = '';
    }
    errorEl.textContent = '';
    overlay.classList.add('open');
    setTimeout(() => (loggedIn ? passInput : userInput).focus(), 180);
  }

  function closeModal() {
    overlay.classList.remove('open');
    passInput.value = '';
    errorEl.textContent = '';
  }

  async function handleSubmit() {
    const username = userInput.value.trim();
    const password = passInput.value;
    errorEl.textContent = '';

    if (!username) { errorEl.textContent = 'Username is required'; userInput.focus(); return; }
    if (!password) { errorEl.textContent = 'Password is required'; passInput.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = isRegister ? 'Creating…' : 'Logging in…';

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { errorEl.textContent = data.error || 'Something went wrong'; return; }

      User.save(data.token, data.username);
      showToast('Welcome, ' + data.username + '!');
      closeModal();

      // Notify play page if it's listening
      window.dispatchEvent(new CustomEvent('arcade:login', { detail: { username: data.username } }));
    } catch (err) {
      errorEl.textContent = 'Network error — please try again';
    } finally {
      submitBtn.disabled = false;
      setMode(isRegister);
    }
  }

  navBtn    && navBtn.addEventListener('click', openModal);
  cancelBtn && cancelBtn.addEventListener('click', closeModal);
  toggleBtn && toggleBtn.addEventListener('click', () => setMode(!isRegister));
  submitBtn && submitBtn.addEventListener('click', handleSubmit);
  overlay   && overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  [userInput, passInput].forEach(el => el && el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); }));

  logoutBtn && logoutBtn.addEventListener('click', async () => {
    await User.logout();
    showToast('Logged out');
    closeModal();
    window.dispatchEvent(new CustomEvent('arcade:logout'));
  });
}

/* ─── BOOT (every page) ─────────────────────────────────── */
function boot() {
  injectLoginModal();
  User.updateNav();
  User.verify();     // async — quietly invalidates stale tokens
  initLoginModal();
}

/* ─── UTILS ─────────────────────────────────────────────── */
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

function esc(v) {
  return String(v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = (type === 'success' ? '✓  ' : '✕  ') + msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

function statusBadge(s) {
  const map = {
    published:'badge-green', draft:'badge-muted', active:'badge-blue',
    ended:'badge-danger', upcoming:'badge-purple',
    'high-score':'badge-gold','time-attack':'badge-purple',
    survival:'badge-blue', none:'badge-muted'
  };
  return `<span class="badge ${map[s]||'badge-muted'}">${esc(s)}</span>`;
}

function thumbGradient(slug) {
  const p = [
    'rgba(0,90,180,.3),rgba(124,58,237,.25)',
    'rgba(255,107,53,.2),rgba(200,40,120,.25)',
    'rgba(0,180,120,.2),rgba(0,100,200,.25)',
    'rgba(124,58,237,.25),rgba(0,180,255,.2)',
    'rgba(255,209,102,.15),rgba(255,100,50,.2)',
  ];
  return p[(slug||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % p.length];
}

function gameCard(g) {
  return `
    <article class="game-card fade-up">
      <div class="game-thumb" style="background:linear-gradient(135deg,${thumbGradient(g.slug)});">
        <span style="position:relative;z-index:1;">${esc(g.thumbnail||'🎮')}</span>
      </div>
      <div class="game-card-body">
        ${statusBadge(g.scoringType||g.status||'published')}
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.description||'A great arcade game.')}</p>
        <div class="btn-row">
          <a class="btn primary sm" href="${esc(g.path||`/play.html?game=${g.slug}`)}">▶ Play Now</a>
        </div>
      </div>
    </article>`;
}

function tournamentCard(t) {
  return `
    <article class="tournament-card">
      ${statusBadge(t.status||'active')}
      <h3>${esc(t.title)}</h3>
      <p class="muted" style="font-size:.9rem;">${esc(t.description||'')}</p>
      <div style="display:grid;gap:4px;margin-top:10px;font-size:.85rem;">
        <div class="muted">Game: <span style="color:var(--text);">${esc(t.gameId)}</span></div>
        <div class="muted">Start: <span style="color:var(--text);">${t.startAt ? new Date(t.startAt).toLocaleDateString() : '—'}</span></div>
        <div class="muted">End: <span style="color:var(--text);">${t.endAt ? new Date(t.endAt).toLocaleDateString() : 'Ongoing'}</span></div>
      </div>
    </article>`;
}

/* ─── HOME ───────────────────────────────────────────────── */
async function loadHome() {
  boot();
  const [gamesData, scoresData, tournamentsData] = await Promise.all([
    fetchJson('/api/games'), fetchJson('/api/scores'), fetchJson('/api/tournaments')
  ]);
  const games = gamesData.games||[], scores = scoresData.scores||[], tournaments = tournamentsData.tournaments||[];

  document.querySelector('[data-kpi="games"]').textContent       = games.length;
  document.querySelector('[data-kpi="scores"]').textContent      = scores.length;
  document.querySelector('[data-kpi="tournaments"]').textContent = tournaments.length;

  const gG = document.getElementById('featured-games');
  if (gG) gG.innerHTML = games.length
    ? games.slice(0,6).map(gameCard).join('')
    : `<div class="empty"><div class="empty-icon">🎮</div><h3>No games yet</h3></div>`;

  const lb = document.getElementById('home-leaderboard');
  if (lb) lb.innerHTML = scores.length
    ? scores.slice(0,6).map((s,i)=>`
        <div class="list-row">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="rank ${i<3?'top':''}">#${i+1}</span>
            <div><div style="font-weight:600;">${esc(s.playerName)}</div><div class="muted" style="font-size:.8rem;">${esc(s.gameId)}</div></div>
          </div>
          <span class="score-val">${esc(s.score)}</span>
        </div>`).join('')
    : `<div class="list-row muted">No scores yet — start playing!</div>`;

  const tW = document.getElementById('home-tournaments');
  if (tW) tW.innerHTML = tournaments.length
    ? tournaments.slice(0,3).map(tournamentCard).join('')
    : `<div class="empty"><div class="empty-icon">🏆</div><h3>No tournaments yet</h3></div>`;
}

/* ─── GAMES PAGE ─────────────────────────────────────────── */
let allGames = [];

async function loadGamesPage() {
  boot();
  const { games } = await fetchJson('/api/games');
  allGames = games;
  renderGames(allGames);
  setupGamesSearch();
}

function renderGames(list) {
  const el = document.getElementById('games-list');
  if (!el) return;
  el.innerHTML = list.length
    ? list.map(gameCard).join('')
    : `<div class="empty"><div class="empty-icon">🎮</div><h3>No games found</h3><p>Try a different search</p></div>`;
}

function setupGamesSearch() {
  const input = document.getElementById('game-search');
  const chips = document.querySelectorAll('[data-filter]');
  let filter = 'all', query = '';

  function apply() {
    let list = allGames;
    if (filter !== 'all') list = list.filter(g => g.status===filter || g.scoringType===filter);
    if (query) { const q=query.toLowerCase(); list=list.filter(g=>(g.title||'').toLowerCase().includes(q)||(g.description||'').toLowerCase().includes(q)); }
    renderGames(list);
  }

  input && input.addEventListener('input', e => { query = e.target.value.trim(); apply(); });
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); filter=c.dataset.filter; apply();
  }));
}

/* ─── LEADERBOARDS PAGE ──────────────────────────────────── */
async function loadLeaderboardsPage() {
  boot();
  const [gamesData, scoresData] = await Promise.all([fetchJson('/api/games'), fetchJson('/api/scores')]);
  const games = gamesData.games||[], allScores = scoresData.scores||[];
  const tabsEl = document.getElementById('lb-tabs');
  const listEl = document.getElementById('leaderboard-list');
  if (!tabsEl||!listEl) return;

  const tabs = [{id:'all',title:'All Games'}, ...games.map(g=>({id:g.slug,title:g.title}))];

  function renderTab(gameId) {
    const scores = gameId==='all' ? allScores : allScores.filter(s=>s.gameId===gameId);
    listEl.innerHTML = scores.length
      ? scores.slice(0,25).map((s,i)=>`
          <div class="list-row">
            <div style="display:flex;align-items:center;gap:14px;">
              <span class="rank ${i<3?'top':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
              <div>
                <div style="font-weight:600;">${esc(s.playerName)}</div>
                <div class="muted mono" style="font-size:.76rem;">${new Date(s.createdAt).toLocaleDateString()} · ${esc(s.gameId)}</div>
              </div>
            </div>
            <span class="score-val">${esc(s.score)}</span>
          </div>`).join('')
      : `<div class="list-row muted">No scores yet.</div>`;
  }

  tabsEl.innerHTML = tabs.map(t=>`<button class="lb-tab" data-game="${esc(t.id)}">${esc(t.title)}</button>`).join('');
  tabsEl.querySelector('.lb-tab')?.classList.add('active');
  renderTab('all');
  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('.lb-tab'); if(!btn) return;
    tabsEl.querySelectorAll('.lb-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); renderTab(btn.dataset.game);
  });
}

/* ─── TOURNAMENTS PAGE ───────────────────────────────────── */
async function loadTournamentsPage() {
  boot();
  const { tournaments } = await fetchJson('/api/tournaments');
  const el = document.getElementById('tournaments-list');
  if (!el) return;
  el.innerHTML = tournaments.length
    ? tournaments.map(tournamentCard).join('')
    : `<div class="empty"><div class="empty-icon">🏆</div><h3>No tournaments yet</h3></div>`;
}

window.ArcadeApp = { loadHome, loadGamesPage, loadLeaderboardsPage, loadTournamentsPage };
window.User = User;
