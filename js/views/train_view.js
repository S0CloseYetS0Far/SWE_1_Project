const TrainView = {

  _editingId: null,

  render() {
    const isAdmin = App.currentUser.role === 'admin';
    document.getElementById('btn-add-train').style.display        = isAdmin ? '' : 'none';
    document.getElementById('trains-actions-head').textContent    = isAdmin ? 'Actions' : '';

    const trains = TrainService.getAll();
    document.getElementById('trains-body').innerHTML = trains.length
      ? trains.map(t => this._rowHtml(t, isAdmin)).join('')
      : '<tr><td colspan="5" class="empty">No trains found</td></tr>';
  },

  _rowHtml(train, isAdmin) {
    const avail = SeatService.getAvailableSeatsForTrain(train.id);
    const pct   = train.seatCapacity > 0 ? Math.round(avail / train.seatCapacity * 100) : 0;
    return `<tr>
      <td><span class="mono" style="color:var(--primary)">${train.trainCode}</span></td>
      <td>${train.name}</td>
      <td>${train.seatCapacity}</td>
      <td>
        <div class="seat-bar">
          <div class="seat-bar-track">
            <div class="seat-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="seat-label">${avail} free</span>
        </div>
      </td>
      ${isAdmin
        ? `<td style="white-space:nowrap">
            <button class="btn btn-ghost btn-sm" onclick="TrainView.openModal(${train.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="TrainView.confirmDelete(${train.id})">Delete</button>
          </td>`
        : '<td></td>'}
    </tr>`;
  },

  openModal(id = null) {
    this._editingId = id;
    document.getElementById('train-modal-title').textContent = id ? 'Edit Train' : 'Add Train';
    UIUtils.hideErrors('tm-code-error', 'tm-name-error', 'tm-capacity-error');

    if (id) {
      const train = TrainService.getAll().find(t => t.id === id);
      document.getElementById('tm-code').value     = train.trainCode;
      document.getElementById('tm-name').value     = train.name;
      document.getElementById('tm-capacity').value = train.seatCapacity;
    } else {
      document.getElementById('tm-code').value     = '';
      document.getElementById('tm-name').value     = '';
      document.getElementById('tm-capacity').value = '';
    }
    UIUtils.openModal('train-modal');
  },

  save() {
    const code     = document.getElementById('tm-code').value.trim();
    const name     = document.getElementById('tm-name').value.trim();
    const capacity = parseInt(document.getElementById('tm-capacity').value);
    UIUtils.hideErrors('tm-code-error', 'tm-name-error', 'tm-capacity-error');

    let valid = true;
    if (!code)                    { UIUtils.showError('tm-code-error',     'Train code is required');          valid = false; }
    if (!name)                    { UIUtils.showError('tm-name-error',     'Train name is required');          valid = false; }
    if (!capacity || capacity < 1){ UIUtils.showError('tm-capacity-error', 'Seat capacity must be at least 1'); valid = false; }
    if (!valid) return;

    const result = this._editingId
      ? TrainService.update(this._editingId, code, name, capacity)
      : TrainService.add(code, name, capacity);

    if (!result.success) {
      UIUtils.showError('tm-code-error', result.error);
      return;
    }

    UIUtils.toast(this._editingId ? 'Train updated successfully' : 'Train added successfully');
    UIUtils.closeModal('train-modal');
    this.render();
  },

  confirmDelete(id) {
    UIUtils.confirm(
      'Delete Train',
      'This will also delete all associated schedules and reservations. Continue?',
      () => {
        TrainService.delete(id);
        UIUtils.toast('Train deleted');
        this.render();
      }
    );
  },
};
