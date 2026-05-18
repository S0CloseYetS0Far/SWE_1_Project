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
      : `<tr><td colspan="${showUser ? 9 : 8}" class="empty">No reservations found</td></tr>`;
  },

  _rowHtml(r, schedules, trains, users, showUser, isAdmin, isClient) {
    const schedule  = schedules.find(s => s.id === r.scheduleId);
    const train     = schedule ? trains.find(t => t.id === schedule.trainId) : null;
    const user      = users.find(u => u.id === r.userId);
    const canCancel = r.status === 'confirmed' &&
      (isAdmin || (isClient && r.userId === App.currentUser.id));
    const canPrint  = r.status === 'confirmed';

    const passengerBadge = r.passengerType === 'child'
      ? '<span class="badge badge-success">Child</span>'
      : '<span class="badge" style="background:rgba(240,165,0,.15);color:var(--primary)">Adult</span>';

    const priceDisplay = r.totalPrice != null
      ? `<span style="font-weight:600;color:var(--primary)">${r.totalPrice.toFixed(2)} SAR</span>`
      : '—';

    const dateDisplay = r.travelDate
      ? `<span class="mono" style="font-size:12px">${r.travelDate}</span>`
      : '—';

    const actions = [
      canPrint  ? `<button class="btn btn-ghost btn-sm" onclick="ReservationView.printOne(${r.id})">Print</button>` : '',
      canCancel ? `<button class="btn btn-danger btn-sm" onclick="ReservationView.confirmCancel(${r.id})">Cancel</button>` : '',
    ].filter(Boolean).join(' ');

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
      <td style="white-space:nowrap">${actions}</td>
    </tr>`;
  },

  openBookingModal(scheduleId) {
    this._pendingScheduleId = scheduleId;
    const schedule   = ScheduleService.getAll().find(s => s.id === scheduleId);
    const train      = TrainService.getAll().find(t => t.id === schedule.trainId);
    const priceAdult = schedule.priceAdult || 10;
    const priceChild = PricingService.getChildPrice(priceAdult);
    const avail      = SeatService.getAvailableSeatsForSchedule(scheduleId);

    document.getElementById('bm-route').textContent       = schedule.route;
    document.getElementById('bm-stations').textContent    = `${schedule.departureStation} → ${schedule.arrivalStation}`;
    document.getElementById('bm-time').textContent        = `${schedule.departureTime} – ${schedule.arrivalTime}`;
    document.getElementById('bm-train').textContent       = train ? `${train.name} (${train.trainCode})` : '—';
    document.getElementById('bm-price-adult').textContent = priceAdult.toFixed(2) + ' SAR';
    document.getElementById('bm-price-child').textContent = priceChild.toFixed(2) + ' SAR';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bm-date').min   = today;
    document.getElementById('bm-date').value = today;

    const qtyInput = document.getElementById('bm-quantity');
    qtyInput.max   = avail;
    qtyInput.value = 1;
    qtyInput.oninput = () => this._renderPassengerList();

    this._renderPassengerList();
    UIUtils.openModal('booking-modal');
  },

  _renderPassengerList() {
    const qtyInput = document.getElementById('bm-quantity');
    let qty = parseInt(qtyInput.value) || 1;
    const max = parseInt(qtyInput.max) || 1;
    if (qty < 1) qty = 1;
    if (qty > max) { qty = max; qtyInput.value = max; }

    const container = document.getElementById('bm-passenger-list');
    let html = '';
    for (let i = 0; i < qty; i++) {
      html += `
        <div class="passenger-row">
          <div class="passenger-label">Passenger ${i + 1}</div>
          <label class="passenger-opt">
            <input type="radio" name="bm-passenger-${i}" value="adult" checked onchange="ReservationView._updateBookingPrice()">
            <span>Adult</span>
          </label>
          <label class="passenger-opt">
            <input type="radio" name="bm-passenger-${i}" value="child" onchange="ReservationView._updateBookingPrice()">
            <span>Child</span>
          </label>
        </div>`;
    }
    container.innerHTML = html;
    this._updateBookingPrice();
  },

  _collectPassengerTypes() {
    const qty = parseInt(document.getElementById('bm-quantity').value) || 1;
    const types = [];
    for (let i = 0; i < qty; i++) {
      const checked = document.querySelector(`input[name="bm-passenger-${i}"]:checked`);
      types.push(checked ? checked.value : 'adult');
    }
    return types;
  },

  _updateBookingPrice() {
    const schedule = ScheduleService.getAll().find(s => s.id === this._pendingScheduleId);
    if (!schedule) return;
    const priceAdult = schedule.priceAdult || 10;
    const types      = this._collectPassengerTypes();
    const total      = types.reduce((sum, t) => sum + PricingService.getUnitPrice(priceAdult, t), 0);
    document.getElementById('bm-total').textContent = total.toFixed(2) + ' SAR';

    const hasChild = types.includes('child');
    const note = document.getElementById('bm-discount-note');
    if (note) note.style.display = hasChild ? '' : 'none';
  },

  confirmBooking() {
    const date  = document.getElementById('bm-date').value;
    const types = this._collectPassengerTypes();
    UIUtils.hideError('bm-date-error');

    if (!date) {
      UIUtils.showError('bm-date-error', 'Please select a travel date');
      return;
    }

    const result = ReservationService.bookMany(
      this._pendingScheduleId,
      App.currentUser.id,
      date,
      types
    );

    if (!result.success) {
      UIUtils.toast(result.error, '', 'error');
      return;
    }

    UIUtils.closeModal('booking-modal');
    UIUtils.toast(`${result.reservations.length} ticket(s) booked!`, 'Opening print view...');
    this._printTickets(result.reservations);
    this.render();
  },

  printOne(reservationId) {
    const r = DataStore.getReservations().find(x => x.id === reservationId);
    if (!r) return;
    this._printTickets([r]);
  },

  _printTickets(reservations) {
    const schedules = DataStore.getSchedules();
    const trains    = DataStore.getTrains();
    const users     = DataStore.getUsers();

    const ticketsHtml = reservations.map(r => {
      const schedule = schedules.find(s => s.id === r.scheduleId);
      const train    = schedule ? trains.find(t => t.id === schedule.trainId) : null;
      const user     = users.find(u => u.id === r.userId);
      const ticketNo = 'RM-' + String(r.id).slice(-8).toUpperCase();
      return `
        <div class="ticket">
          <div class="ticket-header">
            <div>
              <div class="brand">RIYADH METRO</div>
              <div class="subtitle">Boarding Ticket</div>
            </div>
            <div class="ticket-no">
              <div class="label">Ticket No.</div>
              <div class="value mono">${ticketNo}</div>
            </div>
          </div>

          <div class="route">${schedule ? schedule.route : '—'}</div>
          <div class="stations">
            <span>${schedule ? schedule.departureStation : '—'}</span>
            <span class="arrow">→</span>
            <span>${schedule ? schedule.arrivalStation : '—'}</span>
          </div>

          <div class="grid">
            <div><div class="label">Train</div><div class="value">${train ? train.name : '—'}</div></div>
            <div><div class="label">Train Code</div><div class="value mono">${train ? train.trainCode : '—'}</div></div>
            <div><div class="label">Date</div><div class="value mono">${r.travelDate || '—'}</div></div>
            <div><div class="label">Departure</div><div class="value mono">${schedule ? schedule.departureTime : '—'}</div></div>
            <div><div class="label">Arrival</div><div class="value mono">${schedule ? schedule.arrivalTime : '—'}</div></div>
            <div><div class="label">Passenger Type</div><div class="value">${r.passengerType === 'child' ? 'Child (50% off)' : 'Adult'}</div></div>
            <div><div class="label">Passenger</div><div class="value">${user ? user.username : '—'}</div></div>
            <div><div class="label">Price</div><div class="value price">${(r.totalPrice ?? 0).toFixed(2)} SAR</div></div>
          </div>

          <div class="footer">
            Please arrive 10 minutes before departure. This ticket is non-transferable.
          </div>
        </div>`;
    }).join('');

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Tickets</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; color: #111; }
  .mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
  .ticket {
    max-width: 720px; margin: 0 auto 24px; background: #fff; border: 2px dashed #999;
    border-radius: 12px; padding: 28px; page-break-after: always;
  }
  .ticket:last-child { page-break-after: auto; }
  .ticket-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
  .subtitle { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
  .ticket-no { text-align: right; }
  .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .value { font-size: 15px; font-weight: 600; margin-top: 2px; }
  .value.price { color: #c47a00; font-size: 18px; }
  .route { font-size: 26px; font-weight: 700; margin-top: 18px; }
  .stations { font-size: 16px; color: #333; margin: 6px 0 20px; display: flex; gap: 10px; align-items: center; }
  .arrow { color: #c47a00; font-weight: 700; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; padding: 16px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }
  .footer { font-size: 11px; color: #777; margin-top: 14px; text-align: center; }
  @media print {
    body { background: #fff; padding: 0; }
    .ticket { border-style: dashed; margin: 0; box-shadow: none; }
  }
</style></head>
<body>${ticketsHtml}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };<\/script>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      UIUtils.toast('Pop-up blocked', 'Allow pop-ups to print tickets', 'error');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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
