const ReservationView = {

  _pendingScheduleId: null,

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
          const train      = trains.find(t => t.id === s.trainId);
          const avail      = SeatService.getAvailableSeatsForSchedule(s.id);
          const priceAdult = s.priceAdult || 10;
          const priceChild = PricingService.getChildPrice(priceAdult);
          return `<tr>
            <td>
              <div style="font-weight:600">${s.route}</div>
              <div class="cell-sub">${s.departureStation} &rarr; ${s.arrivalStation}</div>
            </td>
            <td>${train ? train.name : '—'}</td>
            <td class="mono">${s.departureTime}</td>
            <td class="mono">${s.arrivalTime}</td>
            <td>
              <div style="font-weight:600;color:var(--primary)">${priceAdult.toFixed(2)} SAR</div>
              <div class="cell-sub" style="display:flex;align-items:center;gap:4px">
                Child: ${priceChild.toFixed(2)} SAR
                <span class="badge badge-success">50% off</span>
              </div>
            </td>
            <td style="color:var(--primary);font-weight:600">${avail}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="ReservationView.openBookingModal(${s.id})">
                Book
              </button>
            </td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="7" class="empty">No available schedules</td></tr>';
  },

  _renderReservationsList(isAdmin, isStaff, isClient) {
    const showUser  = isAdmin || isStaff;
    const schedules = ScheduleService.getAll();
    const trains    = TrainService.getAll();
    const users     = DataStore.getUsers();

    document.getElementById('reservations-title').textContent =
      isClient ? 'My Reservations' : 'All Reservations';

    document.getElementById('reservations-head').innerHTML =
      (showUser ? '<th>User</th>' : '') +
      '<th>Route</th><th>Train</th><th>Journey</th><th>Date</th><th>Passenger</th><th>Price</th><th>Status</th><th>Actions</th>';

    let list = isClient
      ? ReservationService.getForUser(App.currentUser.id)
      : ReservationService.getAll();
    list = [...list].sort((a, b) => b.createdAt - a.createdAt);

    document.getElementById('reservations-body').innerHTML = list.length
      ? list.map(r => this._rowHtml(r, schedules, trains, users, showUser, isAdmin, isClient)).join('')
      : '<tr><td colspan="9" class="empty">No reservations found</td></tr>';
  },

  _rowHtml(r, schedules, trains, users, showUser, isAdmin, isClient) {
    const schedule  = schedules.find(s => s.id === r.scheduleId);
    const train     = schedule ? trains.find(t => t.id === schedule.trainId) : null;
    const user      = users.find(u => u.id === r.userId);
    const canCancel = r.status === 'confirmed' &&
      (isAdmin || (isClient && r.userId === App.currentUser.id));

    const passengerBadge = r.passengerType === 'child'
      ? '<span class="badge badge-success">Child</span>'
      : '<span class="badge" style="background:rgba(240,165,0,.15);color:var(--primary)">Adult</span>';

    const priceDisplay = r.totalPrice != null
      ? `<span style="font-weight:600;color:var(--primary)">${r.totalPrice.toFixed(2)} SAR</span>`
      : '—';

    const dateDisplay = r.travelDate
      ? `<span class="mono" style="font-size:12px">${r.travelDate}</span>`
      : '—';

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
      <td>${dateDisplay}</td>
      <td>${passengerBadge}</td>
      <td>${priceDisplay}</td>
      <td><span class="badge badge-${r.status === 'confirmed' ? 'success' : 'danger'}">${r.status}</span></td>
      <td>${canCancel
        ? `<button class="btn btn-danger btn-sm" onclick="ReservationView.confirmCancel(${r.id})">Cancel</button>`
        : ''}</td>
    </tr>`;
  },

  openBookingModal(scheduleId) {
    this._pendingScheduleId = scheduleId;
    const schedule   = ScheduleService.getAll().find(s => s.id === scheduleId);
    const train      = TrainService.getAll().find(t => t.id === schedule.trainId);
    const priceAdult = schedule.priceAdult || 10;
    const priceChild = PricingService.getChildPrice(priceAdult);

    document.getElementById('bm-route').textContent       = schedule.route;
    document.getElementById('bm-stations').textContent    = `${schedule.departureStation} → ${schedule.arrivalStation}`;
    document.getElementById('bm-time').textContent        = `${schedule.departureTime} – ${schedule.arrivalTime}`;
    document.getElementById('bm-train').textContent       = train ? `${train.name} (${train.trainCode})` : '—';
    document.getElementById('bm-price-adult').textContent = priceAdult.toFixed(2) + ' SAR';
    document.getElementById('bm-price-child').textContent = priceChild.toFixed(2) + ' SAR';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bm-date').min   = today;
    document.getElementById('bm-date').value = today;

    document.getElementById('bm-passenger-adult').checked = true;
    this._updateBookingPrice();

    UIUtils.openModal('booking-modal');
  },

  _updateBookingPrice() {
    const schedule    = ScheduleService.getAll().find(s => s.id === this._pendingScheduleId);
    if (!schedule) return;
    const priceAdult  = schedule.priceAdult || 10;
    const isChild     = document.getElementById('bm-passenger-child').checked;
    const total       = PricingService.calculateTotal(priceAdult, isChild ? 'child' : 'adult');
    document.getElementById('bm-total').textContent = total.toFixed(2) + ' SAR';

    document.getElementById('bm-discount-note').style.display = isChild ? '' : 'none';
  },

  confirmBooking() {
    const date          = document.getElementById('bm-date').value;
    const passengerType = document.getElementById('bm-passenger-child').checked ? 'child' : 'adult';
    UIUtils.hideError('bm-date-error');

    if (!date) {
      UIUtils.showError('bm-date-error', 'Please select a travel date');
      return;
    }

    const result = ReservationService.book(
      this._pendingScheduleId,
      App.currentUser.id,
      date,
      passengerType
    );

    if (!result.success) {
      UIUtils.toast(result.error, '', 'error');
      return;
    }

    UIUtils.closeModal('booking-modal');
    UIUtils.toast('Reservation confirmed!', 'Your ticket has been booked.');
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
