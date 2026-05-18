const DataStore = {

  DEFAULT_USERS: [
    { id: 1, username: 'admin',  password: 'admin123',  role: 'admin'  },
    { id: 2, username: 'staff',  password: 'staff123',  role: 'staff'  },
    { id: 3, username: 'client', password: 'client123', role: 'client' },
  ],

  DEFAULT_TRAINS: [
    { id: 1, trainCode: 'RYD-L1', name: 'Riyadh Metro Line 1 - Blue',   seatCapacity: 200 },
    { id: 2, trainCode: 'RYD-L2', name: 'Riyadh Metro Line 2 - Green',  seatCapacity: 180 },
    { id: 3, trainCode: 'RYD-L3', name: 'Riyadh Metro Line 3 - Yellow', seatCapacity: 150 },
    { id: 4, trainCode: 'RYD-L4', name: 'Riyadh Metro Line 4 - Red',    seatCapacity: 160 },
    { id: 5, trainCode: 'RYD-L5', name: 'Riyadh Metro Line 5 - Purple', seatCapacity: 140 },
  ],

  DEFAULT_SCHEDULES: [
    { id: 1, trainId: 1, route: 'KAFD - Airport',          departureStation: 'KAFD Station',       arrivalStation: 'Airport Terminal 1',   departureTime: '06:00', arrivalTime: '06:45', priceAdult: 15 },
    { id: 2, trainId: 1, route: 'KAFD - Airport',          departureStation: 'KAFD Station',       arrivalStation: 'Airport Terminal 1',   departureTime: '09:00', arrivalTime: '09:45', priceAdult: 15 },
    { id: 3, trainId: 2, route: 'King Fahd Rd - Al Olaya', departureStation: 'King Fahd Road',     arrivalStation: 'Al Olaya Station',     departureTime: '07:00', arrivalTime: '07:30', priceAdult: 12 },
    { id: 4, trainId: 2, route: 'King Fahd Rd - Al Olaya', departureStation: 'King Fahd Road',     arrivalStation: 'Al Olaya Station',     departureTime: '12:00', arrivalTime: '12:30', priceAdult: 12 },
    { id: 5, trainId: 3, route: 'Downtown - Al Malaz',     departureStation: 'Al Riyadh Station',  arrivalStation: 'Al Malaz Station',     departureTime: '08:00', arrivalTime: '08:50', priceAdult: 15 },
    { id: 6, trainId: 4, route: 'Diplomatic Qtr - Uni',    departureStation: 'Diplomatic Quarter', arrivalStation: 'King Saud University', departureTime: '07:30', arrivalTime: '08:00', priceAdult: 12 },
    { id: 7, trainId: 5, route: 'Al Batha - KKA',          departureStation: 'Al Batha Station',   arrivalStation: 'King Khalid Airport',  departureTime: '10:00', arrivalTime: '11:00', priceAdult: 20 },
  ],

  _idCounter: Date.now(),

  _load(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  _save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  genId() {
    return ++this._idCounter;
  },

  getUsers()        { return this._load('rm_users',        this.DEFAULT_USERS);     },
  getTrains()       { return this._load('rm_trains',       this.DEFAULT_TRAINS);    },
  getSchedules()    { return this._load('rm_schedules',    this.DEFAULT_SCHEDULES); },
  getReservations() { return this._load('rm_reservations', []);                     },

  saveUsers(v)        { this._save('rm_users',        v); },
  saveTrains(v)       { this._save('rm_trains',       v); },
  saveSchedules(v)    { this._save('rm_schedules',    v); },
  saveReservations(v) { this._save('rm_reservations', v); },

  getSession()        { return this._load('rm_session', null); },
  saveSession(user)   { this._save('rm_session', user); },
  clearSession()      { localStorage.removeItem('rm_session'); },
};
