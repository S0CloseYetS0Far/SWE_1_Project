const App = {

  currentUser: null,

  NAV_ITEMS: [
    { id: 'dashboard',    label: 'Dashboard',    icon: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>' },
    { id: 'trains',       label: 'Trains',       icon: '<path d="M4 16c0 1.1.9 2 2 2h1v2h2v-2h6v2h2v-2h1c1.1 0 2-.9 2-2V6c0-3.5-3.6-4-8-4S4 2.5 4 6v10zm8-11c3.9 0 6 .5 6 1s-2.1 1-6 1-6-.5-6-1 2.1-1 6-1zM7 13c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm10 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>' },
    { id: 'schedules',    label: 'Schedules',    icon: '<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>' },
    { id: 'reservations', label: 'Reservations', icon: '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>' },
  ],

  init() {
    this.currentUser = DataStore.getSession();
    LoginView.init();

    if (this.currentUser) {
      this._initSession();
      this.navigate('dashboard');
    }
  },

  onLoginSuccess(user) {
    this.currentUser = user;
    this._initSession();
    this.navigate('dashboard');
  },

  logout() {
    AuthService.logout();
    this.currentUser = null;
    this._showLogin();
  },

  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');

    const navEl = document.getElementById('nav-' + page);
    if (navEl) navEl.classList.add('active');

    if (page === 'dashboard')    MainView.render();
    if (page === 'trains')       TrainView.render();
    if (page === 'schedules')    ScheduleView.render();
    if (page === 'reservations') ReservationView.render();
  },

  _initSession() {
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('main').classList.remove('no-sidebar');
    document.getElementById('user-name').textContent   = this.currentUser.username;
    document.getElementById('user-role').textContent   = this.currentUser.role;
    document.getElementById('user-avatar').textContent = this.currentUser.username[0].toUpperCase();
    this._buildSidebar();
  },

  _showLogin() {
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('main').classList.add('no-sidebar');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-login').classList.add('active');
  },

  _buildSidebar() {
    document.getElementById('sidebar-nav').innerHTML = this.NAV_ITEMS.map(item => `
      <button class="nav-link" id="nav-${item.id}" onclick="App.navigate('${item.id}')">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">${item.icon}</svg>
        ${item.label}
      </button>
    `).join('');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
