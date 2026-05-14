const ReservationView = {

  render() {
    const isAdmin  = App.currentUser.role === 'admin';
    const isStaff  = App.currentUser.role === 'staff';
    const isClient = App.currentUser.role === 'client';

    this._renderBookingSection(isClient);
    this._renderReservationsList(isAdmin, isStaff, isClient);
  },

  _renderBookingSection(isClient) {
    document.getElementById('available-schedules-section').style.display = isClient ? '' : 'none';
    if (!isClient) return;

    const schedules = ScheduleService.getAll();
    const trains    = TrainService.getAll();
    const bookable  = schedules.filter(s => SeatService.getAvailableSeatsForSchedule(s.id) > 0);

    document.getElementById('bookable-body').innerHTML = bookable.length
      ? bookable.map(s => {
          const train = trains.find(t => t.id === s.trainId);
          const avail = SeatService.getAvailableSeatsForSchedule(s.id);
          return `<tr>
            <td>
              <div style="font-weight:600">${s.route}</div>
              <div class="cell-sub">${s.departureStation} &rarr; ${s.arrivalStation}</div>
            </td>
            <td>${train ? train.name : '—'}</td>
            <td class="mono">${s.departureTime}</td>
            <td class="mono">${s.arrivalTime}</td>
            <td style="color:var(--primary);font-weight:600">${avail}</td>
            <td><button class="btn btn-primary btn-sm" onclick="ReservationView.book(${s.id})">Book</button></td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="6" class="empty">No available schedules</td></tr>';
  },

  _renderReservationsList(isAdmin, isStaff, isClient) {
    const showUser   = isAdmin || isStaff;
    const schedules  = ScheduleService.getAll();
    const trains     = TrainService.getAll();
    const users      = DataStore.getUsers();

    document.getElementById('reservations-title').textContent =
      isClient ? 'My Reservations' : 'All Reservations';

    document.getElementById('reservations-head').innerHTML =
      (showUser ? '<th>User</th>' : '') +
      '<th>Route</th><th>Train</th><th>Journey</th><th>Status</th><th>Actions</th>';

    let list = isClient
      ? ReservationService.getForUser(App.currentUser.id)
      : ReservationService.getAll();
    list = [...list].sort((a, b) => b.createdAt - a.createdAt);

    document.getElementById('reservations-body').innerHTML = list.length
      ? list.map(r => this._rowHtml(r, schedules, trains, users, showUser, isAdmin, isClient)).join('')
      : '<tr><td colspan="6" class="empty">No reservations found</td></tr>';
  },

  _rowHtml(r, schedules, trains, users, showUser, isAdmin, isClient) {
    const schedule  = schedules.find(s => s.id === r.scheduleId);
    const train     = schedule ? trains.find(t => t.id === schedule.trainId) : null;
    const user      = users.find(u => u.id === r.userId);
    const canCancel = r.status === 'confirmed' &&
      (isAdmin || (isClient && r.userId === App.currentUser.id));

    return `<tr>
      ${showUser ? `<td style="font-weight:600">${user ? user.username : '—'}</td>` : ''}
      <td><div style="font-weight:600">${schedule ? schedule.route : '—'}</div></td>
      <td>${train
        ? `<div>${train.name}</div><div class="cell-sub mono">${train.trainCode}</div>`
        : '—'}</td>
      <td>${schedule
        ? `<div class="cell-sub">${schedule.departureStation} &rarr; ${schedule.arrivalStation}</div>
           <div class="mono" style="font-size:12px">${schedule.departureTime} - ${schedule.arrivalTime}</div>`
        : '—'}</td>
      <td><span class="badge badge-${r.status === 'confirmed' ? 'success' : 'danger'}">${r.status}</span></td>
      <td>${canCancel
        ? `<button class="btn btn-danger btn-sm" onclick="ReservationView.confirmCancel(${r.id})">Cancel</button>`
        : ''}</td>
    </tr>`;
  },

  book(scheduleId) {
    const result = ReservationService.book(scheduleId, App.currentUser.id);
    if (!result.success) {
      UIUtils.toast(result.error, '', 'error');
      return;
    }
    UIUtils.toast('Reservation confirmed');
    this.render();
  },

  confirmCancel(reservationId) {
    UIUtils.confirm(
      'Cancel Reservation',
      'Your seat will be released. Are you sure?',
      () => {
        ReservationService.cancel(reservationId);
        UIUtils.toast('Reservation cancelled');
        this.render();
      }
    );
  },
};
