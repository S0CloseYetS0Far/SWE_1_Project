const UIUtils = {

  toast(title, message = '', type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  confirm(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-dialog').classList.add('open');
    document.getElementById('confirm-ok').onclick = () => {
      this.closeConfirm();
      onConfirm();
    };
  },

  closeConfirm() {
    document.getElementById('confirm-dialog').classList.remove('open');
  },

  openModal(id) {
    document.getElementById(id).classList.add('open');
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  },

  showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent    = message;
    el.style.display  = 'block';
  },

  hideError(elementId) {
    document.getElementById(elementId).style.display = 'none';
  },

  hideErrors(...elementIds) {
    elementIds.forEach(id => this.hideError(id));
  },
};
