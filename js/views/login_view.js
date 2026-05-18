const LoginView = {

  init() {
    ['login-username', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.handleLogin();
      });
    });
    ['signup-username', 'signup-password', 'signup-confirm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.handleRegister();
      });
    });
  },

  handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    errorEl.style.display = 'none';

    const result = AuthService.login(username, password);
    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      return;
    }

    App.onLoginSuccess(result.user);
  },

  handleRegister() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;
    const errorEl  = document.getElementById('signup-error');
    errorEl.style.display = 'none';

    const result = AuthService.register(username, password, confirm);
    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      return;
    }

    App.onLoginSuccess(result.user);
  },

  showSignup() {
    document.getElementById('login-form').style.display  = 'none';
    document.getElementById('signup-form').style.display = '';
  },

  showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display  = '';
  },
};
