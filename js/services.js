const AuthService = {

  login(username, password) {
    const user = DataStore.getUsers().find(
      u => u.username === username && u.password === password
    );
    if (!user) return { success: false, error: 'Invalid username or password' };
    const session = { id: user.id, username: user.username, role: user.role };
    DataStore.saveSession(session);
    return { success: true, user: session };
  },

  logout() {
    DataStore.clearSession();
  },

  register(username, password, confirmPassword) {
    if (!username || username.length < 3) {
      return { success: false, field: 'username', error: 'Username must be at least 3 characters' };
    }
    if (!password || password.length < 8) {
      return { success: false, field: 'password', error: 'Password must be at least 8 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, field: 'confirm', error: 'Passwords do not match' };
    }
    const users = DataStore.getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, field: 'username', error: 'Username already taken' };
    }
    const newUser = {
      id: DataStore.genId(),
      username,
      password,
      role: 'client',
    };
    users.push(newUser);
    DataStore.saveUsers(users);
    const session = { id: newUser.id, username: newUser.username, role: newUser.role };
    DataStore.saveSession(session);
    return { success: true, user: session };
  },

  changePassword(userId, currentPassword, newPassword) {
    const users = DataStore.getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user || user.password !== currentPassword) {
      return { success: false, field: 'current', error: 'Current password is incorrect' };
    }
    if (newPassword.length < 8) {
      return { success: false, field: 'new', error: 'Password must be at least 8 characters' };
    }
    const index = users.findIndex(u => u.id === userId);
    users[index].password = newPassword;
    DataStore.saveUsers(users);
    return { success: true };
  },
};


const PricingService = {
  CHILD_DISCOUNT: 0.50,

  getChildPrice(adultPrice) {
    return adultPrice * (1 - this.CHILD_DISCOUNT);
  },

  getUnitPrice(adultPrice, passengerType) {
    return passengerType === 'child'
      ? this.getChildPrice(adultPrice)
      : adultPrice;
  },

  calculateTotal(adultPrice, passengerType) {
    return this.getUnitPrice(adultPrice, passengerType);
  },

  format(amount) {
    return amount.toFixed(2) + ' SAR';
  },
};


const SeatService = {

  getAvailableSeatsForSchedule(scheduleId) {
    const schedule = DataStore.getSchedules().find(s => s.id === scheduleId);
    if (!schedule) return 0;
    const train = DataStore.getTrains().find(t => t.id === schedule.trainId);
    if (!train) return 0;
    const booked = DataStore.getReservations().filter(
      r => r.scheduleId === scheduleId && r.status === 'confirmed'
    ).length;
    return Math.max(0, train.seatCapacity - booked);
  },

  getAvailableSeatsForTrain(trainId) {
    const train = DataStore.getTrains().find(t => t.id === trainId);
    if (!train) return 0;
    const schedules = DataStore.getSchedules().filter(s => s.trainId === trainId);
    const totalBooked = DataStore.getReservations().filter(
      r => schedules.some(s => s.id === r.scheduleId) && r.status === 'confirmed'
    ).length;
    return Math.max(0, train.seatCapacity * schedules.length - totalBooked);
  },
};


const TrainService = {

  getAll() {
    return DataStore.getTrains();
  },

  add(trainCode, name, seatCapacity) {
    const trains = DataStore.getTrains();
    if (trains.find(t => t.trainCode === trainCode)) {
      return { success: false, field: 'code', error: 'Train code already exists' };
    }
    trains.push({ id: DataStore.genId(), trainCode, name, seatCapacity });
    DataStore.saveTrains(trains);
    return { success: true };
  },

  update(id, trainCode, name, seatCapacity) {
    const trains = DataStore.getTrains();
    if (trains.find(t => t.trainCode === trainCode && t.id !== id)) {
      return { success: false, field: 'code', error: 'Train code already exists' };
    }
    const index = trains.findIndex(t => t.id === id);
    if (index === -1) return { success: false, error: 'Train not found' };
    trains[index] = { ...trains[index], trainCode, name, seatCapacity };
    DataStore.saveTrains(trains);
    return { success: true };
  },

  delete(id) {
    const scheduleIds = DataStore.getSchedules()
      .filter(s => s.trainId === id)
      .map(s => s.id);
    DataStore.saveTrains(DataStore.getTrains().filter(t => t.id !== id));
    DataStore.saveSchedules(DataStore.getSchedules().filter(s => s.trainId !== id));
    DataStore.saveReservations(DataStore.getReservations().filter(r => !scheduleIds.includes(r.scheduleId)));
    return { success: true };
  },
};


const ScheduleService = {

  getAll() {
    return DataStore.getSchedules();
  },

  add(trainId, route, departureStation, arrivalStation, departureTime, arrivalTime, priceAdult) {
    const schedules = DataStore.getSchedules();
    schedules.push({
      id: DataStore.genId(),
      trainId, route, departureStation, arrivalStation, departureTime, arrivalTime,
      priceAdult: parseFloat(priceAdult) || 10,
    });
    DataStore.saveSchedules(schedules);
    return { success: true };
  },

  update(id, trainId, route, departureStation, arrivalStation, departureTime, arrivalTime, priceAdult) {
    const schedules = DataStore.getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return { success: false, error: 'Schedule not found' };
    schedules[index] = {
      ...schedules[index],
      trainId, route, departureStation, arrivalStation, departureTime, arrivalTime,
      priceAdult: parseFloat(priceAdult) || 10,
    };
    DataStore.saveSchedules(schedules);
    return { success: true };
  },

  delete(id) {
    DataStore.saveSchedules(DataStore.getSchedules().filter(s => s.id !== id));
    DataStore.saveReservations(DataStore.getReservations().filter(r => r.scheduleId !== id));
    return { success: true };
  },
};


const ReservationService = {

  getAll() {
    return DataStore.getReservations();
  },

  getForUser(userId) {
    return DataStore.getReservations().filter(r => r.userId === userId);
  },

  book(scheduleId, userId, travelDate, passengerType) {
    const result = this.bookMany(scheduleId, userId, travelDate, [passengerType]);
    if (!result.success) return result;
    return { success: true, reservation: result.reservations[0] };
  },

  bookMany(scheduleId, userId, travelDate, passengerTypes) {
    if (!Array.isArray(passengerTypes) || passengerTypes.length === 0) {
      return { success: false, error: 'At least one passenger is required' };
    }
    const qty = passengerTypes.length;
    if (SeatService.getAvailableSeatsForSchedule(scheduleId) < qty) {
      return { success: false, error: `Only ${SeatService.getAvailableSeatsForSchedule(scheduleId)} seat(s) available` };
    }
    const schedule = DataStore.getSchedules().find(s => s.id === scheduleId);
    if (!schedule) return { success: false, error: 'Schedule not found' };

    const priceAdult   = schedule.priceAdult || 10;
    const reservations = DataStore.getReservations();
    const created      = [];

    passengerTypes.forEach(type => {
      const totalPrice = PricingService.calculateTotal(priceAdult, type);
      const r = {
        id: DataStore.genId(),
        userId,
        scheduleId,
        travelDate,
        passengerType: type,
        totalPrice,
        status: 'confirmed',
        createdAt: Date.now(),
      };
      reservations.push(r);
      created.push(r);
    });

    DataStore.saveReservations(reservations);
    return { success: true, reservations: created };
  },

  cancel(reservationId) {
    const reservations = DataStore.getReservations();
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return { success: false, error: 'Reservation not found' };
    reservations[index].status = 'cancelled';
    DataStore.saveReservations(reservations);
    return { success: true };
  },
};
