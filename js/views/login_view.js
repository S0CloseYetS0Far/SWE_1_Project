const LoginView = {

  init() {
    document.getElementById('login-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleLogin();
    });
    document.getElementById('login-username').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleLogin();
    });
  },

  handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    errorEl.style.display = 'none';

    const result = AuthService.login(username, password);
    if (!result.success) {
      errorEl.style.display = 'block';
      return;
    }

    App.onLoginSuccess(result.user);
  },
};
