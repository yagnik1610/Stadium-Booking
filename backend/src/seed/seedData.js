const bcrypt = require('bcryptjs');

const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const userPasswordHash = bcrypt.hashSync('user123', 10);

const seedData = {
  users: [
    {
      _id: 'user_admin_01',
      name: 'Marcus Vance',
      email: 'admin@stadium.com',
      password: adminPasswordHash,
      role: 'admin',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio: 'Head of Match Operations & Arena Booking Director.',
      favoriteSports: ['Football', 'Cricket', 'Basketball'],
      createdAt: new Date('2026-01-01').toISOString()
    },
    {
      _id: 'user_john_02',
      name: 'John Anderson',
      email: 'john@example.com',
      password: userPasswordHash,
      role: 'user',
      phone: '+1 (555) 392-8172',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      bio: 'Football fanatic, Real Madrid supporter & weekend 7v7 striker.',
      favoriteSports: ['Football', 'Tennis'],
      createdAt: new Date('2026-01-10').toISOString()
    },
    {
      _id: 'user_priya_03',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: userPasswordHash,
      role: 'user',
      phone: '+91 98201 44552',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      bio: 'Cricket enthusiast and badminton league player in Bangalore.',
      favoriteSports: ['Cricket', 'Badminton'],
      createdAt: new Date('2026-01-15').toISOString()
    }
  ],

  stadiums: [
    {
      _id: 'stad_bernabeu',
      name: 'Santiago Bernabéu Stadium',
      city: 'Madrid',
      country: 'Spain',
      address: 'Av. de Concha Espina, 1, Chamartín, 28036 Madrid, Spain',
      coordinates: { lat: 40.4530, lng: -3.6883 },
      sports: ['Football'],
      venueType: 'Stadium',
      capacity: 85000,
      rating: 4.9,
      reviewCount: 4280,
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'The iconic stadium of Real Madrid CF, fully modernized with a 360° video scoreboard, hypogeum underground pitch preservation, and luxury VIP skywalk suites.',
      amenities: ['360 Video Screen', 'Retractable Pitch', 'Skywalk VIP Terrace', 'Museum & Trophy Tour', 'Climate Controlled Seats', 'Metro Line 10 Direct'],
      operatingHours: { open: '08:00 AM', close: '11:30 PM' },
      hourlyRate: 150,
      stands: [
        { id: 'tribuna_vip', name: 'Tribuna Real VIP Suites', tier: 'VIP', priceMultiplier: 3.8, rows: 4, seatsPerRow: 12, color: '#f59e0b', entryGate: 'Gate 0 - Presidential Door', viewDescription: 'Center-line elevated luxury leather armchairs with lounge catering' },
        { id: 'lateral_este', name: 'Lateral Este Premium Tier', tier: 'Premium', priceMultiplier: 2.2, rows: 6, seatsPerRow: 16, color: '#3b82f6', entryGate: 'Gate 22 - East Wing', viewDescription: 'Broadside tactical view directly opposite player dugouts' },
        { id: 'fondo_sur', name: 'Fondo Sur (Grada Fans End)', tier: 'Standard', priceMultiplier: 1.3, rows: 8, seatsPerRow: 20, color: '#10b981', entryGate: 'Gate 14 - South Turnstile', viewDescription: 'High-energy supporters goal-end behind the southern net' },
        { id: 'fondo_norte', name: 'Fondo Norte Lower Tier', tier: 'Standard', priceMultiplier: 1.1, rows: 8, seatsPerRow: 20, color: '#06b6d4', entryGate: 'Gate 4 - North Turnstile', viewDescription: 'Pitch-level corner to goalmouth vantage' }
      ]
    },
    {
      _id: 'stad_wankhede',
      name: 'Wankhede Stadium',
      city: 'Mumbai',
      country: 'India',
      address: 'Vinoo Mankad Rd, Churchgate, Mumbai, Maharashtra 400020',
      coordinates: { lat: 18.9389, lng: 72.8258 },
      sports: ['Cricket'],
      venueType: 'Stadium',
      capacity: 33108,
      rating: 4.9,
      reviewCount: 1840,
      image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'Historic seaside international cricket venue overlooking the Arabian Sea, famous for World Cup finals and electric IPL atmosphere.',
      amenities: ['Floodlights', 'Sachin Tendulkar Stand', 'BCCI Headquarters', 'Churchgate Railway Link', 'Multi-Cuisine Food Court', 'Hospitality Boxes'],
      operatingHours: { open: '07:00 AM', close: '11:00 PM' },
      hourlyRate: 120,
      stands: [
        { id: 'vip_lounge', name: 'President Box & VIP Lounge', tier: 'VIP', priceMultiplier: 3.5, rows: 4, seatsPerRow: 12, color: '#f59e0b', entryGate: 'VIP Gate 1', viewDescription: 'Air-conditioned suite behind bowler arm with private balcony' },
        { id: 'grand_stand', name: 'Sachin Tendulkar Grand Stand', tier: 'Premium', priceMultiplier: 2.0, rows: 6, seatsPerRow: 16, color: '#3b82f6', entryGate: 'Gate 3', viewDescription: 'Classic straight-drive view from the eastern terrace' },
        { id: 'north_stand', name: 'North Stand Lower & Upper', tier: 'Standard', priceMultiplier: 1.2, rows: 8, seatsPerRow: 20, color: '#10b981', entryGate: 'Gate 7', viewDescription: 'Famous vocal fans stand behind the bowler wickets' },
        { id: 'east_stand', name: 'Sunil Gavaskar Pavilion', tier: 'Premium', priceMultiplier: 1.8, rows: 6, seatsPerRow: 16, color: '#8b5cf6', entryGate: 'Gate 4', viewDescription: 'Square-of-the-wicket vantage with sea breeze' }
      ]
    },
    {
      _id: 'stad_wembley',
      name: 'Wembley Stadium',
      city: 'London',
      country: 'United Kingdom',
      address: 'Wembley, London HA9 0WS, UK',
      coordinates: { lat: 51.5560, lng: -0.2795 },
      sports: ['Football', 'Concerts'],
      venueType: 'Stadium',
      capacity: 90000,
      rating: 4.8,
      reviewCount: 3450,
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'The home of English football, framed by the iconic 133-meter arch, housing world-class Club Wembley hospitality and major international cup finals.',
      amenities: ['133m Arch Landmark', 'Club Wembley Lounges', 'Wembley Park Underground', 'Retractable Roof', 'Concert Stage Setup'],
      operatingHours: { open: '09:00 AM', close: '11:00 PM' },
      hourlyRate: 200,
      stands: [
        { id: 'club_wembley', name: 'Club Wembley Executive Tier', tier: 'VIP', priceMultiplier: 3.2, rows: 5, seatsPerRow: 14, color: '#f59e0b', entryGate: 'Bobby Moore Entrance', viewDescription: 'Middle tier panoramic 360-degree stadium view with gourmet dining access' },
        { id: 'bobby_moore', name: 'Bobby Moore Stand (South)', tier: 'Premium', priceMultiplier: 1.8, rows: 7, seatsPerRow: 18, color: '#3b82f6', entryGate: 'Turnstiles E-G', viewDescription: 'South stand lower bowl behind the royal box' },
        { id: 'north_stand_w', name: 'North Stand Lower Tier', tier: 'Standard', priceMultiplier: 1.2, rows: 8, seatsPerRow: 20, color: '#10b981', entryGate: 'Turnstiles J-K', viewDescription: 'Direct view beneath the illuminated arch' }
      ]
    },
    {
      _id: 'stad_msg',
      name: 'Madison Square Garden',
      city: 'New York',
      country: 'USA',
      address: '4 Pennsylvania Plaza, New York, NY 10001, USA',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      sports: ['Basketball', 'Concerts'],
      venueType: 'Arena',
      capacity: 19500,
      rating: 4.9,
      reviewCount: 3890,
      image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'The World’s Most Famous Arena, located in the heart of Manhattan atop Penn Station, home to the New York Knicks and legendary sports moments.',
      amenities: ['Chase Bridges Suspended Seating', 'Penn Station Transit', 'Locker Room Lounges', 'Jumbo LED Video Matrix'],
      operatingHours: { open: '10:00 AM', close: '11:30 PM' },
      hourlyRate: 180,
      stands: [
        { id: 'courtside', name: 'Celebrity Courtside Row', tier: 'VIP', priceMultiplier: 4.5, rows: 3, seatsPerRow: 10, color: '#f59e0b', entryGate: 'VIP Floor Tunnel', viewDescription: 'Feet-on-the-hardwood floor seating directly beside player benches' },
        { id: 'lower_bowl', name: 'Lower Bowl Club 100', tier: 'Premium', priceMultiplier: 2.2, rows: 6, seatsPerRow: 16, color: '#3b82f6', entryGate: '7th Avenue Entrance', viewDescription: 'Steep incline premier sightlines for fast basketball action' },
        { id: 'upper_bowl', name: 'Upper Bowl Tier 200', tier: 'Standard', priceMultiplier: 1.0, rows: 8, seatsPerRow: 20, color: '#10b981', entryGate: '8th Avenue Escalators', viewDescription: 'High elevated perspective of the entire arena' }
      ]
    },
    {
      _id: 'stad_apex_turf',
      name: 'Apex Premier Sports Arena & Turf',
      city: 'Bangalore',
      country: 'India',
      address: '88 Tech Park Outer Ring Rd, Marathahalli, Bangalore 560103',
      coordinates: { lat: 12.9569, lng: 77.7011 },
      sports: ['Cricket', 'Football', 'Badminton'],
      venueType: 'Turf',
      capacity: 120,
      rating: 4.9,
      reviewCount: 740,
      image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'FIFA-grade 50mm artificial grass turf for 7v7 football and box cricket with high-intensity LED floodlights (800 Lux), locker rooms, automated bowling machines, and live streaming cameras.',
      amenities: ['FIFA Quality AstroTurf', 'LED Floodlights 800 Lux', 'Changing Rooms & Showers', 'Dugouts & Scoreboard', 'Equipment Rental', 'Free Parking', 'Beverage Cafe'],
      operatingHours: { open: '06:00 AM', close: '11:59 PM' },
      hourlyRate: 40,
      peakHourlyRate: 55,
      turfOptions: [
        { id: 'turf_a', name: 'Main Arena (7v7 Football / Box Cricket)', sport: 'Football', size: '120ft x 80ft', surface: 'FIFA Pro 50mm Synthetic AstroTurf', ratePerHour: 45, peakRatePerHour: 60 },
        { id: 'turf_b', name: 'Court 1 (5v5 Fast Football)', sport: 'Football', size: '60ft x 40ft', surface: 'Shock-Pad Synthetic Grass', ratePerHour: 28, peakRatePerHour: 38 },
        { id: 'turf_c', name: 'Court 2 (Box Cricket Nets & Pitch)', sport: 'Cricket', size: '60ft x 40ft', surface: 'All-Weather Matting Pitch & Nets', ratePerHour: 28, peakRatePerHour: 38 }
      ]
    },
    {
      _id: 'stad_metro_turf',
      name: 'Metro Champions Arena & Turf',
      city: 'Mumbai',
      country: 'India',
      address: 'Near Bandra-Kurla Complex, Bandra East, Mumbai 400051',
      coordinates: { lat: 19.0607, lng: 72.8644 },
      sports: ['Football', 'Cricket', 'Tennis'],
      venueType: 'Turf',
      capacity: 100,
      rating: 4.8,
      reviewCount: 520,
      image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80'
      ],
      description: 'Multi-sport urban arena with shock-absorbent non-abrasive turf, professional umpires available on call, and matchday highlight video recording.',
      amenities: ['Shock-absorbent Grass', 'Bowling Machine', 'Live Video Recording', 'Night Floodlights', 'Referees Available', 'Air Conditioned Lounge'],
      operatingHours: { open: '06:00 AM', close: '11:00 PM' },
      hourlyRate: 38,
      peakHourlyRate: 50,
      turfOptions: [
        { id: 'turf_metro_1', name: 'Pro Turf (Football 6v6)', sport: 'Football', size: '100ft x 70ft', surface: 'Non-Infill Premium Turf', ratePerHour: 40, peakRatePerHour: 55 },
        { id: 'turf_metro_2', name: 'Cricket Arena (With Nets & Bowling Machine)', sport: 'Cricket', size: '90ft x 60ft', surface: 'Turf Pitch + Spring Stumps', ratePerHour: 35, peakRatePerHour: 48 }
      ]
    }
  ],

  events: [
    {
      _id: 'event_champions_final',
      title: 'Champions League Final 2026',
      subTitle: 'Real Madrid vs Manchester City',
      sport: 'Football',
      tournament: 'UEFA Champions League',
      stadiumId: 'stad_bernabeu',
      stadiumName: 'Santiago Bernabéu Stadium',
      city: 'Madrid, Spain',
      date: '2026-09-12',
      time: '20:00',
      doorsOpen: '17:30',
      bannerImage: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
      teamA: { name: 'Real Madrid', code: 'RMA', logo: '⚽', score: '2', color: '#10b981' },
      teamB: { name: 'Manchester City', code: 'MCI', logo: '🏆', score: '1', color: '#06b6d4' },
      basePrice: 85,
      currency: '$',
      status: 'Live',
      livePeriod: "2nd Half • 74'",
      featured: true,
      weatherForecast: { temp: '22°C', condition: 'Mild Evening • Ideal Pitch', windSpeed: '8 km/h' },
      referee: 'Szymon Marciniak (UEFA Elite)',
      bookedSeats: ['tribuna_vip-R1-S3', 'tribuna_vip-R1-S4', 'fondo_sur-R2-S8', 'lateral_este-R3-S5', 'lateral_este-R3-S6']
    },
    {
      _id: 'event_cricket_wc',
      title: 'World Super Series: India vs Australia',
      subTitle: '1st ODI Day-Night Clash',
      sport: 'Cricket',
      tournament: 'ICC World Super Series',
      stadiumId: 'stad_wankhede',
      stadiumName: 'Wankhede Stadium',
      city: 'Mumbai, India',
      date: '2026-09-18',
      time: '14:30',
      doorsOpen: '12:00',
      bannerImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      teamA: { name: 'India', code: 'IND', logo: '🏏', score: '286/4', color: '#3b82f6' },
      teamB: { name: 'Australia', code: 'AUS', logo: '🦘', score: 'Yet to bat', color: '#eab308' },
      basePrice: 60,
      currency: '$',
      status: 'Upcoming',
      livePeriod: '',
      featured: true,
      weatherForecast: { temp: '29°C', condition: 'Sunny with Coastal Breeze', windSpeed: '14 km/h' },
      referee: 'Richard Kettleborough (ICC Elite)',
      bookedSeats: ['vip_lounge-R1-S1', 'vip_lounge-R1-S2', 'grand_stand-R2-S4', 'grand_stand-R2-S5']
    },
    {
      _id: 'event_london_derby',
      title: 'Premier League London Derby',
      subTitle: 'Arsenal vs Chelsea FC',
      sport: 'Football',
      tournament: 'English Premier League',
      stadiumId: 'stad_wembley',
      stadiumName: 'Wembley Stadium',
      city: 'London, UK',
      date: '2026-09-26',
      time: '17:30',
      doorsOpen: '15:00',
      bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      teamA: { name: 'Arsenal', code: 'ARS', logo: '🔴', score: '0', color: '#ef4444' },
      teamB: { name: 'Chelsea', code: 'CHE', logo: '🔵', score: '0', color: '#3b82f6' },
      basePrice: 75,
      currency: '$',
      status: 'Upcoming',
      featured: true,
      weatherForecast: { temp: '16°C', condition: 'Overcast with Light Breeze', windSpeed: '10 km/h' },
      referee: 'Michael Oliver (PGMOL)',
      bookedSeats: ['club_wembley-R1-S5', 'bobby_moore-R3-S10', 'bobby_moore-R3-S11']
    },
    {
      _id: 'event_nba_finals',
      title: 'NBA Showdown: NY Knicks vs LA Lakers',
      subTitle: 'Eastern vs Western Conference Clash',
      sport: 'Basketball',
      tournament: 'NBA Regular Season',
      stadiumId: 'stad_msg',
      stadiumName: 'Madison Square Garden',
      city: 'New York, USA',
      date: '2026-10-04',
      time: '19:30',
      doorsOpen: '18:00',
      bannerImage: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80',
      teamA: { name: 'NY Knicks', code: 'NYK', logo: '🏀', score: '0', color: '#f97316' },
      teamB: { name: 'LA Lakers', code: 'LAL', logo: '⭐', score: '0', color: '#a855f7' },
      basePrice: 95,
      currency: '$',
      status: 'Upcoming',
      featured: false,
      weatherForecast: { temp: '20°C', condition: 'Indoor Climate Controlled', windSpeed: '0 km/h' },
      referee: 'Scott Foster (NBA Crew Chief)',
      bookedSeats: ['courtside-R1-S2', 'courtside-R1-S3']
    },
    {
      _id: 'event_england_sa',
      title: 'International T20: England vs South Africa',
      subTitle: 'High Octane T20 International',
      sport: 'Cricket',
      tournament: 'T20 International Cup',
      stadiumId: 'stad_wankhede',
      stadiumName: 'Wankhede Stadium',
      city: 'Mumbai, India',
      date: '2026-10-12',
      time: '19:00',
      doorsOpen: '17:00',
      bannerImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      teamA: { name: 'England', code: 'ENG', logo: '🦁', score: '0', color: '#ef4444' },
      teamB: { name: 'South Africa', code: 'RSA', logo: '🇿🇦', score: '0', color: '#10b981' },
      basePrice: 50,
      currency: '$',
      status: 'Upcoming',
      featured: false,
      weatherForecast: { temp: '27°C', condition: 'Pleasant Night Lights', windSpeed: '11 km/h' },
      referee: 'Marais Erasmus (ICC)',
      bookedSeats: []
    }
  ],

  reviews: [
    {
      _id: 'rev_101',
      userId: 'user_john_02',
      userName: 'John Anderson',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      targetType: 'stadium',
      targetId: 'stad_bernabeu',
      rating: 5,
      title: 'Unbelievable matchday atmosphere and fast QR entry!',
      comment: 'The new 360-degree screen at Santiago Bernabéu is sensational. Entering through Gate 0 VIP was instant with the mobile pass.',
      verifiedAttendee: true,
      helpfulVotes: 24,
      createdAt: new Date('2026-08-01').toISOString()
    },
    {
      _id: 'rev_102',
      userId: 'user_priya_03',
      userName: 'Priya Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      targetType: 'stadium',
      targetId: 'stad_apex_turf',
      rating: 5,
      title: 'Best turf in Bangalore for box cricket & football!',
      comment: 'Top quality 50mm grass with great lighting. We split the bill easily among 8 players and got our booking confirmed in 30 seconds.',
      verifiedAttendee: true,
      helpfulVotes: 18,
      createdAt: new Date('2026-08-12').toISOString()
    }
  ],

  bookings: [
    {
      _id: 'bk_sample_101',
      bookingId: 'PASS-892301',
      invoiceNumber: 'INV-892301',
      userId: 'user_john_02',
      userEmail: 'john@example.com',
      userName: 'John Anderson',
      type: 'event',
      eventId: 'event_champions_final',
      eventTitle: 'Champions League Final 2026',
      sport: 'Football',
      stadiumName: 'Santiago Bernabéu Stadium',
      eventDate: '2026-09-12',
      eventTime: '20:00',
      standName: 'Tribuna Real VIP Suites',
      gateNumber: 'Gate 0 - Presidential Entrance',
      seats: ['tribuna_vip-R1-S3', 'tribuna_vip-R1-S4'],
      seatLabels: ['Row 1 - Seat 3', 'Row 1 - Seat 4'],
      addOns: [
        { name: 'VIP Parking Pass (Gate 4)', price: 20 },
        { name: 'Matchday Match Programme & Scarf', price: 15 }
      ],
      splitBill: { enabled: false, playerCount: 1, perPersonShare: 700.75 },
      ticketCount: 2,
      subTotal: 680,
      addOnsTotal: 35,
      tax: 35.75,
      discount: 50,
      totalAmount: 700.75,
      currency: '$',
      paymentMethod: 'Credit Card',
      paymentTransactionId: 'TXN-MADRID8891',
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      qrCodeData: 'STADIUM-PASS:PASS-892301|USER:john@example.com|EVENT:Champions League Final 2026|SEATS:tribuna_vip-R1-S3,tribuna_vip-R1-S4',
      createdAt: new Date('2026-08-10T14:22:00').toISOString()
    },
    {
      _id: 'bk_sample_102',
      bookingId: 'TURF-449102',
      invoiceNumber: 'INV-449102',
      userId: 'user_priya_03',
      userEmail: 'priya@example.com',
      userName: 'Priya Sharma',
      type: 'turf',
      stadiumId: 'stad_apex_turf',
      stadiumName: 'Apex Premier Sports Arena & Turf',
      turfOptionName: 'Main Arena (7v7 Football / Box Cricket)',
      sport: 'Football',
      bookingDate: '2026-08-28',
      timeSlots: ['19:00 - 20:00', '20:00 - 21:00'],
      durationHours: 2,
      addOns: [
        { name: 'LED Floodlight Charges (2 Hrs)', price: 15 },
        { name: 'Match Ball & Bibs Set', price: 10 }
      ],
      splitBill: { enabled: true, playerCount: 6, perPersonShare: 20.12, shareLink: 'https://stadiumx.com/pay/TURF-449102' },
      subTotal: 90,
      addOnsTotal: 25,
      tax: 5.75,
      discount: 0,
      totalAmount: 120.75,
      currency: '$',
      paymentMethod: 'UPI / Digital Wallet',
      paymentTransactionId: 'TXN-UPI994201',
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      qrCodeData: 'TURF-PASS:TURF-449102|USER:priya@example.com|VENUE:Apex Turf|DATE:2026-08-28|SLOTS:19:00-21:00',
      createdAt: new Date('2026-08-15T11:05:00').toISOString()
    }
  ]
};

module.exports = { seedData };
