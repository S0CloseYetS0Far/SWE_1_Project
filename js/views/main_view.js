const MainView = {

  render() {
    const trains       = DataStore.getTrains();
    const schedules    = DataStore.getSchedules();
    const reservations = DataStore.getReservations();
    const activeCount  = reservations.filter(r => r.status === 'confirmed').length;
    const totalSeats   = schedules.reduce((sum, s) => sum + SeatService.getAvailableSeatsForSchedule(s.id), 0);

    this._renderStats(trains, schedules, reservations, activeCount, totalSeats);
    this._renderOccupancy(schedules, trains, reservations);
    this._renderRecentReservations(reservations, schedules);
  },

  _renderStats(trains, schedules, reservations, activeCount, totalSeats) {
    const stats = [
      { label: 'Total Trains',        value: trains.length,        icon: '🚇' },
      { label: 'Total Schedules',     value: schedules.length,     icon: '📅' },
      { label: 'Total Reservations',  value: reservations.length,  icon: '🎫' },
      { label: 'Active Reservations', value: activeCount,          icon: '✅' },
      { label: 'Available Seats',     value: totalSeats,           icon: '💺' },
    ];

    document.getElementById('stats-grid').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-label">${s.icon} ${s.label}</div>
        <div class="stat-value primary">${s.value}</div>
      </div>
    `).join('');
  },

  _renderOccupancy(schedules, trains, reservations) {
    const html = schedules.map(s => {
      const train  = trains.find(t => t.id === s.trainId);
      const cap    = train ? train.seatCapacity : 0;
      const booked = reservations.filter(r => r.scheduleId === s.id && r.status === 'confirmed').length;
      const pct    = cap > 0 ? Math.round(booked / cap * 100) : 0;
      return `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span>${s.route}</span>
            <span class="mono" style="color:var(--primary)">${booked}/${cap}</span>
          </div>
          <div class="seat-bar">
            <div class="seat-bar-track">
              <div class="seat-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="seat-label">${pct}%</span>
          </div>
        </div>`;
    }).join('') || '<div class="empty">No schedules yet</div>';

    document.getElementById('occupancy-list').innerHTML = html;
  },

  _renderRecentReservations(reservations, schedules) {
    const users  = DataStore.getUsers();
    const recent = [...reservations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

    document.getElementById('recent-body').innerHTML = recent.length
      ? recent.map(r => {
          const schedule = schedules.find(s => s.id === r.scheduleId);
          const user     = users.find(u => u.id === r.userId);
          return `<tr>
            <td>${user ? user.username : '—'}</td>
            <td>${schedule ? schedule.route : '—'}</td>
            <td><span class="badge badge-${r.status === 'confirmed' ? 'success' : 'danger'}">${r.status}</span></td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="3" class="empty">No reservations yet</td></tr>';
  },
};
