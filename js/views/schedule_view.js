const ScheduleView = {

  _editingId: null,

  render() {
    const isAdmin = App.currentUser.role === 'admin';
    document.getElementById('btn-add-schedule').style.display     = isAdmin ? '' : 'none';
    document.getElementById('schedules-actions-head').textContent = isAdmin ? 'Actions' : '';

    const schedules = ScheduleService.getAll();
    const trains    = TrainService.getAll();
    document.getElementById('schedules-body').innerHTML = schedules.length
      ? schedules.map(s => this._rowHtml(s, trains, isAdmin)).join('')
      : '<tr><td colspan="7" class="empty">No schedules found</td></tr>';
  },

  _rowHtml(schedule, trains, isAdmin) {
    const train      = trains.find(t => t.id === schedule.trainId);
    const avail      = SeatService.getAvailableSeatsForSchedule(schedule.id);
    const cap        = train ? train.seatCapacity : 0;
    const priceAdult = schedule.priceAdult || 10;
    const priceChild = PricingService.getChildPrice(priceAdult);
    return `<tr>
      <td>
        <div style="font-weight:600">${schedule.route}</div>
        <div class="cell-sub">${schedule.departureStation} &rarr; ${schedule.arrivalStation}</div>
      </td>
      <td>
        <div>${train ? train.name : '—'}</div>
        <div class="cell-sub mono">${train ? train.trainCode : ''}</div>
      </td>
      <td><span class="mono">${schedule.departureTime}</span></td>
      <td><span class="mono">${schedule.arrivalTime}</span></td>
      <td>
        <div style="font-weight:600;color:var(--primary)">${priceAdult.toFixed(2)} SAR</div>
        <div class="cell-sub">Child: ${priceChild.toFixed(2)} SAR</div>
      </td>
      <td>
        <span style="color:var(--primary);font-weight:600">${avail}</span>
        <span style="color:var(--muted)">/${cap}</span>
      </td>
      ${isAdmin
        ? `<td style="white-space:nowrap">
            <button class="btn btn-ghost btn-sm" onclick="ScheduleView.openModal(${schedule.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="ScheduleView.confirmDelete(${schedule.id})">Delete</button>
          </td>`
        : '<td></td>'}
    </tr>`;
  },

  openModal(id = null) {
    this._editingId = id;
    document.getElementById('schedule-modal-title').textContent = id ? 'Edit Schedule' : 'Add Schedule';
    UIUtils.hideErrors('sm-route-error', 'sm-dep-time-error', 'sm-arr-time-error', 'sm-price-error');

    const trains = TrainService.getAll();
    document.getElementById('sm-train').innerHTML = trains.map(t =>
      `<option value="${t.id}">${t.name} (${t.trainCode})</option>`
    ).join('');

    if (id) {
      const s = ScheduleService.getAll().find(s => s.id === id);
      document.getElementById('sm-train').value       = s.trainId;
      document.getElementById('sm-route').value       = s.route;
      document.getElementById('sm-dep-station').value = s.departureStation;
      document.getElementById('sm-arr-station').value = s.arrivalStation;
      document.getElementById('sm-dep-time').value    = s.departureTime;
      document.getElementById('sm-arr-time').value    = s.arrivalTime;
      document.getElementById('sm-price').value       = s.priceAdult || 10;
    } else {
      document.getElementById('sm-route').value       = '';
      document.getElementById('sm-dep-station').value = '';
      document.getElementById('sm-arr-station').value = '';
      document.getElementById('sm-dep-time').value    = '';
      document.getElementById('sm-arr-time').value    = '';
      document.getElementById('sm-price').value       = '10';
    }
    UIUtils.openModal('schedule-modal');
  },

  save() {
    const trainId    = parseInt(document.getElementById('sm-train').value);
    const route      = document.getElementById('sm-route').value.trim();
    const depStation = document.getElementById('sm-dep-station').value.trim();
    const arrStation = document.getElementById('sm-arr-station').value.trim();
    const depTime    = document.getElementById('sm-dep-time').value;
    const arrTime    = document.getElementById('sm-arr-time').value;
    const priceAdult = parseFloat(document.getElementById('sm-price').value);
    UIUtils.hideErrors('sm-route-error', 'sm-dep-time-error', 'sm-arr-time-error', 'sm-price-error');

    let valid = true;
    if (!route)                        { UIUtils.showError('sm-route-error',    'Route is required');           valid = false; }
    if (!depTime)                      { UIUtils.showError('sm-dep-time-error', 'Departure time is required');  valid = false; }
    if (!arrTime)                      { UIUtils.showError('sm-arr-time-error', 'Arrival time is required');    valid = false; }
    if (!priceAdult || priceAdult < 1) { UIUtils.showError('sm-price-error',    'Price must be at least 1 SAR'); valid = false; }
    if (!valid) return;

    const result = this._editingId
      ? ScheduleService.update(this._editingId, trainId, route, depStation, arrStation, depTime, arrTime, priceAdult)
      : ScheduleService.add(trainId, route, depStation, arrStation, depTime, arrTime, priceAdult);

    if (!result.success) {
      UIUtils.toast(result.error, '', 'error');
      return;
    }

    UIUtils.toast(this._editingId ? 'Schedule updated' : 'Schedule added');
    UIUtils.closeModal('schedule-modal');
    this.render();
  },

  confirmDelete(id) {
    UIUtils.confirm(
      'Delete Schedule',
      'All reservations for this schedule will also be removed.',
      () => {
        ScheduleService.delete(id);
        UIUtils.toast('Schedule deleted');
        this.render();
      }
    );
  },
};
