const PasswordView = {

  handle() {
    const current  = document.getElementById('cp-current').value;
    const newPw    = document.getElementById('cp-new').value;
    const confirm  = document.getElementById('cp-confirm').value;
    UIUtils.hideErrors('cp-current-error', 'cp-new-error', 'cp-confirm-error');

    let valid = true;
    if (!current) { UIUtils.showError('cp-current-error', 'Current password is required'); valid = false; }
    if (!newPw)   { UIUtils.showError('cp-new-error',     'New password is required');     valid = false; }
    if (!confirm) { UIUtils.showError('cp-confirm-error', 'Please confirm your password'); valid = false; }
    if (!valid) return;

    if (newPw !== confirm) {
      UIUtils.showError('cp-confirm-error', 'Passwords do not match');
      return;
    }

    const result = AuthService.changePassword(App.currentUser.id, current, newPw);
    if (!result.success) {
      const fieldMap = { current: 'cp-current-error', new: 'cp-new-error' };
      UIUtils.showError(fieldMap[result.field] || 'cp-current-error', result.error);
      return;
    }

    document.getElementById('cp-current').value = '';
    document.getElementById('cp-new').value     = '';
    document.getElementById('cp-confirm').value = '';
    UIUtils.toast('Password changed successfully');
  },
};
