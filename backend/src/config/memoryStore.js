const fs = require('fs');
const path = require('path');
const { seedData } = require('../seed/seedData');

const storePath = path.join(__dirname, '..', '..', 'data_store.json');

class MemoryStore {
  constructor() {
    this.data = {
      users: [],
      stadiums: [],
      events: [],
      bookings: [],
      reviews: []
    };
    this.init();
  }

  init() {
    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.reviews) this.data.reviews = seedData.reviews || [];
      } catch (err) {
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }
  }

  seedDefaults() {
    this.data = {
      users: JSON.parse(JSON.stringify(seedData.users)),
      stadiums: JSON.parse(JSON.stringify(seedData.stadiums)),
      events: JSON.parse(JSON.stringify(seedData.events)),
      bookings: JSON.parse(JSON.stringify(seedData.bookings)),
      reviews: JSON.parse(JSON.stringify(seedData.reviews || []))
    };
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(storePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[Storage Error]', err.message);
    }
  }

  // Users
  getUsers() { return this.data.users; }
  getUserById(id) { return this.data.users.find(u => u._id === id || u.id === id); }
  getUserByEmail(email) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  createUser(user) {
    const newUser = { _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), ...user, createdAt: new Date() };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id, update) {
    const idx = this.data.users.findIndex(u => u._id === id || u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...update };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // Stadiums
  getStadiums() { return this.data.stadiums; }
  getStadiumById(id) { return this.data.stadiums.find(s => s._id === id || s.id === id); }
  createStadium(stadium) {
    const newStadium = { _id: 'stad_' + Date.now(), ...stadium, createdAt: new Date() };
    this.data.stadiums.push(newStadium);
    this.save();
    return newStadium;
  }
  updateStadium(id, update) {
    const idx = this.data.stadiums.findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      this.data.stadiums[idx] = { ...this.data.stadiums[idx], ...update };
      this.save();
      return this.data.stadiums[idx];
    }
    return null;
  }
  deleteStadium(id) {
    this.data.stadiums = this.data.stadiums.filter(s => s._id !== id && s.id !== id);
    this.save();
    return true;
  }

  // Events
  getEvents() { return this.data.events; }
  getEventById(id) { return this.data.events.find(e => e._id === id || e.id === id); }
  createEvent(event) {
    const newEvent = { _id: 'event_' + Date.now(), ...event, createdAt: new Date() };
    this.data.events.push(newEvent);
    this.save();
    return newEvent;
  }
  updateEvent(id, update) {
    const idx = this.data.events.findIndex(e => e._id === id || e.id === id);
    if (idx !== -1) {
      this.data.events[idx] = { ...this.data.events[idx], ...update };
      this.save();
      return this.data.events[idx];
    }
    return null;
  }
  deleteEvent(id) {
    this.data.events = this.data.events.filter(e => e._id !== id && e.id !== id);
    this.save();
    return true;
  }

  // Bookings
  getBookings() { return this.data.bookings; }
  getBookingById(id) { return this.data.bookings.find(b => b._id === id || b.id === id || b.bookingId === id); }
  getBookingsByUserId(userId) { return this.data.bookings.filter(b => b.userId === userId || b.user === userId); }
  createBooking(booking) {
    const newBooking = {
      _id: 'bk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      ...booking,
      createdAt: new Date().toISOString()
    };
    this.data.bookings.unshift(newBooking);
    this.save();
    return newBooking;
  }
  updateBooking(id, update) {
    const idx = this.data.bookings.findIndex(b => b._id === id || b.id === id || b.bookingId === id);
    if (idx !== -1) {
      this.data.bookings[idx] = { ...this.data.bookings[idx], ...update };
      this.save();
      return this.data.bookings[idx];
    }
    return null;
  }

  // Reviews
  getReviews() { return this.data.reviews || []; }
  getReviewsByTarget(targetId) { return (this.data.reviews || []).filter(r => r.targetId === targetId); }
  createReview(review) {
    if (!this.data.reviews) this.data.reviews = [];
    const newReview = { _id: 'rev_' + Date.now(), ...review, createdAt: new Date().toISOString() };
    this.data.reviews.unshift(newReview);
    this.save();
    return newReview;
  }
}

const memoryStore = new MemoryStore();
module.exports = { memoryStore };
