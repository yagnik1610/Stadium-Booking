const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Stadium = require('../models/Stadium');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection.db;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const stadiumDataset = [
  // =================== GUJARAT, INDIA ===================
  {
    name: 'Narendra Modi Stadium',
    description: 'The world\'s largest cricket stadium with a capacity of 132,000 spectators, featuring state-of-the-art LED floodlighting, clubhouses, and multiple international-standard practice pitches.',
    location: 'Motera, Ahmedabad',
    address: 'Stadium Rd, Motera, Ahmedabad, Gujarat 380005',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    sports: ['Cricket', 'Athletics'],
    capacity: 132000,
    pricePerHour: 15000,
    facilities: ['LED Floodlights', 'VIP Lounges', 'Clubhouse', 'Olympic Gym', 'Dressing Rooms', 'Ample Parking'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 79 2750 0000',
    openingTime: '06:00',
    closingTime: '23:00',
    isActive: true
  },
  {
    name: 'The Arena by TransStadia (EKA Arena)',
    description: 'India\'s premier multi-purpose convertible stadium equipped with modern retractable seating, FIFA-standard pitch, indoor arena for badminton, kabaddi, and table tennis.',
    location: 'Kankaria, Ahmedabad',
    address: 'Near Kankaria Lake Gate No. 3, Ahmedabad, Gujarat 380022',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    sports: ['Football', 'Badminton', 'Futsal', 'Table Tennis'],
    capacity: 20000,
    pricePerHour: 4500,
    facilities: ['FIFA Standard Turf', 'Indoor Air-Conditioned Arena', 'Badminton Academy', 'Locker Rooms', 'Cafeteria'],
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 79 4001 2000',
    openingTime: '06:00',
    closingTime: '22:30',
    isActive: true
  },
  {
    name: 'Ahmedabad Box Cricket & Turf Arena',
    description: 'Premier floodlit synthetic turf arena dedicated for high-octane box cricket, 5-a-side futsal, and evening weekend tournaments.',
    location: 'Bodakdev, Ahmedabad',
    address: 'Sindhu Bhavan Marg, Bodakdev, Ahmedabad, Gujarat 380054',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    sports: ['Box Cricket', 'Futsal', 'Cricket'],
    capacity: 200,
    pricePerHour: 1200,
    facilities: ['All-Weather Artificial Grass', 'Night Floodlights', 'Netted Enclosure', 'Resting Lounge', 'Beverage Bar'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 98250 11223',
    openingTime: '06:00',
    closingTime: '23:59',
    isActive: true
  },
  {
    name: 'Lalbhai Contractor Stadium',
    description: 'Renowned cricket stadium in South Gujarat hosting domestic Ranji Trophy fixtures, junior cricket training camps, and club leagues.',
    location: 'Dumas Road, Surat',
    address: 'Near Surat Airport, Dumas Rd, Surat, Gujarat 395007',
    city: 'Surat',
    state: 'Gujarat',
    country: 'India',
    sports: ['Cricket'],
    capacity: 7000,
    pricePerHour: 3500,
    facilities: ['Turf Pitch', 'Practice Nets', 'Pavilion', 'Players Dressing Rooms', 'Parking'],
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 261 272 1200',
    openingTime: '06:00',
    closingTime: '21:00',
    isActive: true
  },
  {
    name: 'Reliance Stadium (IPCL Sports Complex)',
    description: 'Iconic cricket venue in Vadodara having hosted memorable One Day Internationals, complete with natural grass outfield and practice facilities.',
    location: 'Gorwa, Vadodara',
    address: 'IPCL Township, Gorwa, Vadodara, Gujarat 390016',
    city: 'Vadodara',
    state: 'Gujarat',
    country: 'India',
    sports: ['Cricket', 'Tennis'],
    capacity: 20000,
    pricePerHour: 5000,
    facilities: ['International Pitch', 'Tennis Courts', 'Spectator Stands', 'Coaching Academy', 'Parking'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 265 223 3400',
    openingTime: '06:30',
    closingTime: '21:30',
    isActive: true
  },

  // =================== MAHARASHTRA, INDIA ===================
  {
    name: 'Wankhede Stadium',
    description: 'The historic seaside cricket temple of Mumbai, host to the iconic 2011 ICC World Cup Final, renowned for electric atmosphere and red-soil bounce.',
    location: 'Churchgate, Mumbai',
    address: 'Vinoo Mankad Rd, Churchgate, Mumbai, Maharashtra 400020',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    sports: ['Cricket'],
    capacity: 33108,
    pricePerHour: 18000,
    facilities: ['International Turf Pitch', 'BCCI High Performance Centre', 'LED Floodlights', 'Media Centre', 'VIP Hospitality'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 22 2279 5500',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Mumbai Football Arena (Andheri Sports Complex)',
    description: 'The premier football stadium of Mumbai, home of Mumbai City FC, featuring FIFA-certified artificial grass and elite floodlight systems.',
    location: 'Andheri West, Mumbai',
    address: 'Veera Desai Road, Andheri West, Mumbai, Maharashtra 400053',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    sports: ['Football', 'Athletics', 'Swimming'],
    capacity: 8000,
    pricePerHour: 6000,
    facilities: ['FIFA Certified Turf', 'Olympic Size Pool', 'Athletic Track', 'Floodlights', 'Players Dressing Rooms'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 22 2674 1234',
    openingTime: '06:00',
    closingTime: '23:00',
    isActive: true
  },
  {
    name: 'Shree Shiv Chhatrapati Sports Complex (Balewadi)',
    description: 'Comprehensive multi-discipline Olympic sports city in Pune hosting international athletics, badminton, tennis, basketball, and aquatic tournaments.',
    location: 'Balewadi, Pune',
    address: 'National Games Park, Balewadi, Pune, Maharashtra 411045',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    sports: ['Badminton', 'Tennis', 'Basketball', 'Swimming', 'Athletics', 'Football'],
    capacity: 12000,
    pricePerHour: 3500,
    facilities: ['Indoor Badminton Courts', 'Synthetic Tennis Courts', 'Olympic Pool', 'Basketball Arena', 'Athletic Synthetic Track'],
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 20 2737 0000',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Maharashtra Cricket Association Stadium',
    description: 'Ultra-modern international cricket stadium situated on the Mumbai-Pune Expressway, famous for its world-class sand-based drainage.',
    location: 'Gahunje, Pune',
    address: 'Mumbai-Pune Expressway, Gahunje, Pune, Maharashtra 412101',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    sports: ['Cricket'],
    capacity: 37406,
    pricePerHour: 12000,
    facilities: ['Sub-Air Drainage System', 'Floodlit Arena', 'Player Club', 'Corporate Boxes', 'Spacious Parking'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 20 2740 5000',
    openingTime: '06:30',
    closingTime: '21:30',
    isActive: true
  },

  // =================== DELHI NCR, INDIA ===================
  {
    name: 'Arun Jaitley Stadium',
    description: 'Historical cricket venue in the heart of Delhi, known for legendary international test matches, IPL fixtures, and player facilities.',
    location: 'Feroz Shah Kotla, New Delhi',
    address: 'Bahadur Shah Zafar Marg, New Delhi, Delhi 110002',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    sports: ['Cricket'],
    capacity: 41842,
    pricePerHour: 14000,
    facilities: ['International Pitch', 'LED Floodlights', 'Corporate Boxes', 'Dressing Rooms', 'Broadcast Facilities'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 11 2331 9323',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Jawaharlal Nehru Stadium Delhi',
    description: 'Massive multi-purpose stadium built for the Commonwealth Games, featuring a FIFA-certified football pitch and a 9-lane IAAF athletic track.',
    location: 'Pragati Vihar, New Delhi',
    address: 'Bhisham Pitamah Marg, Pragati Vihar, New Delhi, Delhi 110003',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    sports: ['Football', 'Athletics'],
    capacity: 60254,
    pricePerHour: 8000,
    facilities: ['IAAF Certified Track', 'FIFA Grade Turf', 'Floodlights', 'Weightlifting Auditorium', 'Locker Facilities'],
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 11 2436 4243',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Major Dhyan Chand National Stadium',
    description: 'India\'s premier hockey temple featuring three world-class synthetic astroturf pitches, host to the Hockey World Cup and national championships.',
    location: 'India Gate, New Delhi',
    address: 'National Stadium, India Gate, New Delhi, Delhi 110001',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    sports: ['Hockey'],
    capacity: 16200,
    pricePerHour: 3500,
    facilities: ['Poligras Astroturf', 'Sprinkler System', 'Floodlights', 'Change Rooms', 'Coaching Hub'],
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 11 2338 2742',
    openingTime: '06:00',
    closingTime: '21:00',
    isActive: true
  },
  {
    name: 'Indira Gandhi Indoor Arena',
    description: 'The largest indoor sports arena in India, equipped with climate-controlled wooden sprung flooring for badminton, basketball, and gymnastics.',
    location: 'IP Estate, New Delhi',
    address: 'Near Yamuna Velodrome, IP Estate, New Delhi, Delhi 110002',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    sports: ['Badminton', 'Basketball', 'Table Tennis', 'Volleyball'],
    capacity: 14348,
    pricePerHour: 4000,
    facilities: ['Air-Conditioned Hall', 'Sprung Hardwood Flooring', 'High Lux Lighting', 'Sauna & Steam', 'Fitness Suite'],
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 11 2337 0643',
    openingTime: '06:30',
    closingTime: '21:30',
    isActive: true
  },

  // =================== KARNATAKA, INDIA ===================
  {
    name: 'M. Chinnaswamy Stadium',
    description: 'Renowned cricket ground in central Bengaluru powered by solar energy, pioneering subsurface drainage for rapid rain recovery.',
    location: 'Cubbon Park, Bengaluru',
    address: 'Queens Rd, Shivaji Nagar, Bengaluru, Karnataka 560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    sports: ['Cricket'],
    capacity: 40000,
    pricePerHour: 14000,
    facilities: ['SubAir Aeration System', 'Solar Power Array', 'LED Floodlights', 'Indoor Cricket Academy', 'Member Pavilion'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 80 2286 1621',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Sree Kanteerava Stadium',
    description: 'Bengaluru\'s landmark sports hub, home to Bengaluru FC, featuring an 8-lane synthetic track and dedicated multi-tier football grandstand.',
    location: 'Sampangi Rama Nagar, Bengaluru',
    address: 'Kasturba Rd, Sampangi Rama Nagar, Bengaluru, Karnataka 560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    sports: ['Football', 'Athletics'],
    capacity: 25810,
    pricePerHour: 5500,
    facilities: ['Synthetic Athletic Track', 'Natural Grass Football Field', 'Indoor Hall', 'Floodlights', 'Dressing Quarters'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 80 2221 4455',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Padukone-Dravid Centre for Sports Excellence',
    description: 'India\'s finest integrated multi-sport high performance training centre offering elite facilities for badminton, tennis, swimming, and football.',
    location: 'Yelahanka, Bengaluru',
    address: 'Survey No. 336, Bettahalasuru, Jala Hobli, Yelahanka, Bengaluru, Karnataka 562157',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    sports: ['Badminton', 'Tennis', 'Swimming', 'Football', 'Cricket'],
    capacity: 3500,
    pricePerHour: 2800,
    facilities: ['16 Air-Conditioned Badminton Courts', 'Synthetic Tennis Courts', 'Olympic 50m Pool', 'Sports Science Lab', 'Café'],
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 80 6845 5555',
    openingTime: '05:30',
    closingTime: '22:00',
    isActive: true
  },

  // =================== TAMIL NADU, INDIA ===================
  {
    name: 'MA Chidambaram Stadium (Chepauk)',
    description: 'One of India\'s oldest and most iconic cricket stadiums, home of Chennai Super Kings, known for sporting cricket pitches and roaring fan support.',
    location: 'Chepauk, Chennai',
    address: 'Victoria Hostel Rd, Chepauk, Triplicane, Chennai, Tamil Nadu 600005',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    sports: ['Cricket'],
    capacity: 38200,
    pricePerHour: 13500,
    facilities: ['ICC Standard Pitch', 'Modern Canopied Stands', 'Floodlighting', 'Cricket Museum', 'VIP Hospitality'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 44 2854 4175',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Jawaharlal Nehru Stadium Chennai (Marina Arena)',
    description: 'Premier football and athletic stadium, home of Chennaiyin FC in the Indian Super League, complete with synthetic running tracks.',
    location: 'Periamet, Chennai',
    address: 'Sydenhams Rd, Periamet, Chennai, Tamil Nadu 600003',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    sports: ['Football', 'Athletics'],
    capacity: 40000,
    pricePerHour: 6000,
    facilities: ['Natural Bermuda Turf', 'Olympic Athletic Track', 'Floodlighting', 'Dressing Rooms', 'Gym'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 44 2561 2450',
    openingTime: '06:00',
    closingTime: '21:30',
    isActive: true
  },
  {
    name: 'SDAT Tennis Stadium (Nungambakkam)',
    description: 'Renowned international tennis stadium in Chennai, long-time host to the ATP Chennai Open, featuring Plexicushion championship courts.',
    location: 'Nungambakkam, Chennai',
    address: 'Lake Area, Nungambakkam, Chennai, Tamil Nadu 600034',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    sports: ['Tennis'],
    capacity: 5800,
    pricePerHour: 1800,
    facilities: ['Plexicushion Courts', 'Centre Court with Stadium Seating', 'Floodlights', 'Players Lounge', 'Pro Shop'],
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 44 2817 1222',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },

  // =================== TELANGANA, INDIA ===================
  {
    name: 'Rajiv Gandhi International Cricket Stadium',
    description: 'Modern cricket colosseum in Hyderabad with extensive facilities, host to international test fixtures, IPL matches, and regional leagues.',
    location: 'Uppal, Hyderabad',
    address: 'RGI Stadium Rd, Uppal, Hyderabad, Telangana 500039',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    sports: ['Cricket'],
    capacity: 55000,
    pricePerHour: 13000,
    facilities: ['Floodlights', 'Advanced Drainage', 'Indoor Practice Nets', 'Media Galleries', 'Corporate Suites'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 40 2717 7777',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'G. M. C. Balayogi Athletic Stadium (Gachibowli)',
    description: 'State-of-the-art sports complex in the IT corridor of Hyderabad, equipped for international football, athletics, and swimming.',
    location: 'Gachibowli, Hyderabad',
    address: 'Old Mumbai Hwy, Gachibowli, Hyderabad, Telangana 500032',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    sports: ['Football', 'Athletics', 'Badminton', 'Swimming'],
    capacity: 30000,
    pricePerHour: 5000,
    facilities: ['Natural Grass Football Arena', 'Synthetic Running Track', 'Indoor Sports Complex', 'Aquatic Complex', 'Parking'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 40 2300 0012',
    openingTime: '06:00',
    closingTime: '21:30',
    isActive: true
  },

  // =================== WEST BENGAL, INDIA ===================
  {
    name: 'Eden Gardens',
    description: 'The historic and soulful mecca of Indian cricket, celebrated worldwide for its passionate 66,000-strong crowd and legendary sporting lore.',
    location: 'BBD Bagh, Kolkata',
    address: 'B.B.D. Bagh, Kolkata, West Bengal 700021',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    sports: ['Cricket'],
    capacity: 66349,
    pricePerHour: 16000,
    facilities: ['Clubhouse', 'LED Tower Floodlights', 'Indoor Training Facilities', 'Press Box', 'Heritage Stands'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 33 2248 0411',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Salt Lake Stadium (Vivekananda Yuba Bharati Krirangan)',
    description: 'One of the largest football stadiums in Asia, host to the FIFA U-17 World Cup Final and the legendary Kolkata Derby between Mohun Bagan and East Bengal.',
    location: 'Bidhannagar, Kolkata',
    address: 'JB Block, Sector III, Bidhannagar, Kolkata, West Bengal 700106',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    sports: ['Football', 'Athletics'],
    capacity: 85000,
    pricePerHour: 9000,
    facilities: ['Natural Hybrid Grass Pitch', 'IAAF Certified Track', 'Player Tunnels', 'Air-Conditioned VIP Suites', 'Extensive Parking'],
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 33 2335 1250',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },

  // =================== RAJASTHAN, INDIA ===================
  {
    name: 'Sawai Mansingh Stadium',
    description: 'Iconic cricket fortress in Jaipur, home of Rajasthan Royals, famous for high-scoring IPL matches and royal heritage architecture.',
    location: 'Amar Jawan Jyoti, Jaipur',
    address: 'Jan Path, Nagar Nigam Colony, Lalkothi, Jaipur, Rajasthan 302005',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    sports: ['Cricket'],
    capacity: 30000,
    pricePerHour: 11000,
    facilities: ['Floodlights', 'Cricket Academy', 'Gymnasium', 'Players Pavilion', 'Press Conference Hall'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 141 274 0808',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },

  // =================== ODISHA, INDIA ===================
  {
    name: 'Kalinga Stadium Sports Complex',
    description: 'India\'s world capital for field hockey and Olympic sports, host of FIH Hockey World Cups, featuring blue synthetic hockey turfs and football arena.',
    location: 'Nayapalli, Bhubaneswar',
    address: 'Bidyut Marg, Nuasahi, Nayapalli, Bhubaneswar, Odisha 751012',
    city: 'Bhubaneswar',
    state: 'Odisha',
    country: 'India',
    sports: ['Hockey', 'Football', 'Athletics', 'Tennis', 'Swimming'],
    capacity: 16000,
    pricePerHour: 4000,
    facilities: ['Olympic Grade Hockey Turf', 'Football Ground', 'High Performance Centre', 'Athletic Track', 'Floodlighting'],
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 674 239 1234',
    openingTime: '05:30',
    closingTime: '22:00',
    isActive: true
  },
  {
    name: 'Birsa Munda International Hockey Stadium',
    description: 'Certified by Guinness World Records as the world\'s largest all-seater field hockey stadium, built specially for the 2023 Men\'s FIH Hockey World Cup.',
    location: 'BPUT Campus, Rourkela',
    address: 'Chhend Colony, Rourkela, Odisha 769015',
    city: 'Rourkela',
    state: 'Odisha',
    country: 'India',
    sports: ['Hockey'],
    capacity: 21800,
    pricePerHour: 4500,
    facilities: ['Poligras Olympic Turf', 'Practice Pitch', 'Fitness Centre', 'Hydrotherapy Pool', 'Dressing Enclosures'],
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 661 240 0100',
    openingTime: '06:00',
    closingTime: '21:30',
    isActive: true
  },

  // =================== KERALA, INDIA ===================
  {
    name: 'Jawaharlal Nehru International Stadium Kochi',
    description: 'Renowned coastal sports bowl with one of the most vociferous football fanbases in Asia, home ground of Kerala Blasters FC in the ISL.',
    location: 'Kaloor, Kochi',
    address: 'Banerji Rd, Kaloor, Kochi, Kerala 682017',
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    sports: ['Football', 'Cricket'],
    capacity: 40000,
    pricePerHour: 6500,
    facilities: ['Natural Grass Playing Turf', 'High Output Floodlights', 'Media Centre', 'VIP Pavilion', 'Locker Amenities'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 484 240 8822',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },

  // =================== PUNJAB, INDIA ===================
  {
    name: 'PCA IS Bindra Stadium Mohali',
    description: 'World-renowned cricket stadium famed for its lively green pitch, low-height light towers, and top-tier player conditioning facilities.',
    location: 'Sector 63, Mohali',
    address: 'Sukhna Path, Phase 9, Sector 63, Sahibzada Ajit Singh Nagar, Punjab 160062',
    city: 'Mohali',
    state: 'Punjab',
    country: 'India',
    sports: ['Cricket'],
    capacity: 27000,
    pricePerHour: 10500,
    facilities: ['16 Pillar-less Floodlight Towers', 'Swimming Pool', 'Indoor Practice Wickets', 'Gymnasium', 'Players Lounge'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 172 223 2301',
    openingTime: '06:00',
    closingTime: '21:30',
    isActive: true
  },

  // =================== GOA, INDIA ===================
  {
    name: 'Fatorda Stadium (Pandit Jawaharlal Nehru Stadium)',
    description: 'Goa\'s premier international football stadium in Margao, home of FC Goa and host to AFC Champions League group stages.',
    location: 'Fatorda, Margao',
    address: 'Near Swimming Pool Complex, Fatorda, Margao, Goa 403602',
    city: 'Margao',
    state: 'Goa',
    country: 'India',
    sports: ['Football'],
    capacity: 19000,
    pricePerHour: 4500,
    facilities: ['Natural Bermuda Grass Pitch', 'HD Floodlights', 'Conference Rooms', 'Athletic Warmup Track', 'Dressing Units'],
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 832 274 1500',
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true
  },

  // =================== MADHYA PRADESH, INDIA ===================
  {
    name: 'Holkar Cricket Stadium',
    description: 'High-scoring cricket arena in Indore boasting exceptional spectator sightlines and a record-breaking batting surface.',
    location: 'Race Course Road, Indore',
    address: 'Y N Road, New Palasia, Indore, Madhya Pradesh 452001',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    sports: ['Cricket'],
    capacity: 30000,
    pricePerHour: 9500,
    facilities: ['International Turf Pitch', 'Rainwater Harvesting', 'LED Lights', 'Media Centre', 'Covered Stands'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 731 254 3602',
    openingTime: '06:00',
    closingTime: '21:00',
    isActive: true
  },

  // =================== ASSAM, INDIA ===================
  {
    name: 'Barsapara Cricket Stadium',
    description: 'Northeast India\'s premier cricket colosseum in Guwahati, featuring scenic views, top-tier pitches, and digital scoreboards.',
    location: 'Barsapara, Guwahati',
    address: 'Stadium Rd, Barsapara, Guwahati, Assam 781018',
    city: 'Guwahati',
    state: 'Assam',
    country: 'India',
    sports: ['Cricket'],
    capacity: 40000,
    pricePerHour: 8500,
    facilities: ['Turf Wickets', 'Floodlights', 'Indoor Cricket Facility', 'Player Rest Suites', 'Press Gallery'],
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+91 361 247 1100',
    openingTime: '06:00',
    closingTime: '21:00',
    isActive: true
  },

  // =================== UNITED KINGDOM ===================
  {
    name: 'Wembley Stadium',
    description: 'The home of English football and the FA Cup Final, crowned by its iconic 133-metre arch with world-class seating and acoustic design.',
    location: 'Wembley, London',
    address: 'London HA9 0WS, United Kingdom',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    sports: ['Football', 'Athletics'],
    capacity: 90000,
    pricePerHour: 22000,
    facilities: ['Sliding Roof', 'Desso GrassMaster Hybrid Pitch', 'VIP Club Wembley', 'Conference Centres', 'Extensive Parking'],
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+44 800 169 2007',
    openingTime: '07:00',
    closingTime: '23:00',
    isActive: true
  },
  {
    name: 'Lord\'s Cricket Ground',
    description: 'Universally hailed as the "Home of Cricket", Lord\'s houses the world-famous Long Room, MCC Museum, and the iconic Victorian Pavilion.',
    location: 'St John\'s Wood, London',
    address: 'St John\'s Wood Rd, London NW8 8QN, United Kingdom',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    sports: ['Cricket'],
    capacity: 31100,
    pricePerHour: 18000,
    facilities: ['MCC Indoor Cricket Academy', 'Historic Victorian Pavilion', 'Media Centre', 'Museum', 'Banqueting Suites'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+44 20 7616 8500',
    openingTime: '08:00',
    closingTime: '21:00',
    isActive: true
  },

  // =================== SPAIN ===================
  {
    name: 'Santiago Bernabéu Stadium',
    description: 'The ultra-modern cathedral of Real Madrid in Paseo de la Castellana, featuring a retractable roof, 360-degree video scoreboard, and subterranean pitch greenhouse.',
    location: 'Chamartín, Madrid',
    address: 'Av. de Concha Espina, 1, Chamartín, 28036 Madrid, Spain',
    city: 'Madrid',
    state: 'Community of Madrid',
    country: 'Spain',
    sports: ['Football'],
    capacity: 81044,
    pricePerHour: 20000,
    facilities: ['Retractable Roof', 'Automated Pitch Storage', '360 Video Board', 'VIP Sky Bar', 'Museum & Trophy Room'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+34 917 45 75 00',
    openingTime: '08:00',
    closingTime: '23:30',
    isActive: true
  },
  {
    name: 'Camp Nou (Spotify Camp Nou)',
    description: 'The legendary fortress of FC Barcelona, the largest stadium in Europe, steeped in Catalan football passion and attacking football traditions.',
    location: 'Les Corts, Barcelona',
    address: 'C. d\'Arístides Maillol, 12, Les Corts, 08028 Barcelona, Spain',
    city: 'Barcelona',
    state: 'Catalonia',
    country: 'Spain',
    sports: ['Football'],
    capacity: 99354,
    pricePerHour: 21000,
    facilities: ['Hybrid Playing Surface', 'La Masia Training Complex', 'Barça Museum', 'VIP Presidential Box', 'Press Room'],
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+34 902 18 99 00',
    openingTime: '08:00',
    closingTime: '23:00',
    isActive: true
  },

  // =================== UNITED STATES ===================
  {
    name: 'Madison Square Garden',
    description: 'The world\'s most famous arena, home to the NBA New York Knicks, hosting legendary basketball championships and historic boxing matches.',
    location: 'Midtown Manhattan, New York',
    address: '4 Pennsylvania Plaza, New York, NY 10001, United States',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    sports: ['Basketball', 'Volleyball', 'Box Cricket'],
    capacity: 19812,
    pricePerHour: 18000,
    facilities: ['Maple Hardwood Court', 'Jumbotron Video System', 'Locker Rooms', 'VIP Lounges', 'Fine Dining Suites'],
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+1 212 465 6741',
    openingTime: '07:00',
    closingTime: '23:59',
    isActive: true
  },
  {
    name: 'Crypto.com Arena (Staples Center)',
    description: 'Premier multi-purpose sports center in downtown Los Angeles, home of the Los Angeles Lakers and host to premier basketball tournaments.',
    location: 'Downtown LA, Los Angeles',
    address: '1111 S Figueroa St, Los Angeles, CA 90015, United States',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    sports: ['Basketball', 'Tennis'],
    capacity: 19067,
    pricePerHour: 17500,
    facilities: ['NBA Hardwood Court', 'LED Ribbon Boards', 'VIP Clubs', 'Training Facility', 'Covered Parking'],
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+1 213 742 7100',
    openingTime: '07:00',
    closingTime: '23:30',
    isActive: true
  },

  // =================== AUSTRALIA ===================
  {
    name: 'Melbourne Cricket Ground (MCG)',
    description: 'The giant sporting colosseum of the Southern Hemisphere, birthplace of Test cricket and the Australian Grand Final with unrivaled sports history.',
    location: 'Yarra Park, Melbourne',
    address: 'Brunton Ave, Richmond VIC 3002, Australia',
    city: 'Melbourne',
    state: 'Victoria',
    country: 'Australia',
    sports: ['Cricket', 'Football', 'Athletics'],
    capacity: 100024,
    pricePerHour: 19000,
    facilities: ['Drop-in Turf Pitches', 'National Sports Museum', 'Massive Light Towers', 'Members Pavilion', 'Player Dressing Quarters'],
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+61 3 9657 8888',
    openingTime: '06:30',
    closingTime: '22:30',
    isActive: true
  },

  // =================== UNITED ARAB EMIRATES ===================
  {
    name: 'Dubai International Cricket Stadium',
    description: 'World-class circular stadium in Dubai Sports City, famous for its unique "Ring of Fire" floodlight arrangement embedded in the roof rim.',
    location: 'Dubai Sports City, Dubai',
    address: 'Sheikh Mohammed Bin Zayed Rd, Dubai Sports City, Dubai, United Arab Emirates',
    city: 'Dubai',
    state: 'Dubai',
    country: 'United Arab Emirates',
    sports: ['Cricket'],
    capacity: 25000,
    pricePerHour: 14000,
    facilities: ['350 Ring of Fire Floodlights', 'ICC Academy Grounds', 'VIP Hospitality Suites', 'Player Conditioning Centre', 'Ample Parking'],
    image: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=85'],
    contactNumber: '+971 4 425 1111',
    openingTime: '06:00',
    closingTime: '23:00',
    isActive: true
  }
];

const seedStadiums = async () => {
  await connectDB();

  try {
    console.log('--- STARTING MULTI-COUNTRY STADIUM SEED PROCESS ---');

    // Find or create admin user for createdBy reference
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.findOne({});
    }

    if (!adminUser) {
      if (!process.env.ADMIN_PASSWORD) {
        console.error('❌ Error: No admin user found in database, and ADMIN_PASSWORD is not set.');
        process.exit(1);
      }
      console.log('No user found in database. Creating admin user from environment configuration...');
      adminUser = await User.create({
        name: process.env.ADMIN_NAME || 'Super Admin',
        email: process.env.ADMIN_EMAIL || 'admin@stadiumbooking.com',
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        mobile: '+91 9876543210',
        isActive: true
      });
      console.log(`Created admin user: ${adminUser.email}`);
    }

    console.log(`Using Admin ID: ${adminUser._id} (${adminUser.name})`);

    const forceUpdate = process.argv.includes('--force-update');
    if (forceUpdate) {
      console.log('⚠️ Forced update mode enabled: Existing stadiums will be updated with seed values.');
    } else {
      console.log('🛡️ Safe mode enabled: Existing stadiums will be preserved and skipped.');
    }

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const data of stadiumDataset) {
      const stadiumPayload = {
        ...data,
        createdBy: adminUser._id
      };

      const existing = await Stadium.findOne({ name: data.name });

      if (existing) {
        if (forceUpdate) {
          await Stadium.updateOne({ _id: existing._id }, { $set: stadiumPayload });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        await Stadium.create(stadiumPayload);
        insertedCount++;
      }
    }

    // Normalize any legacy Madison Square Garden country from 'USA' to 'United States'
    await Stadium.updateMany({ country: 'USA' }, { $set: { country: 'United States' } });

    console.log(`Seed complete!`);
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Skipped existing: ${skippedCount}`);
    console.log(`Updated: ${updatedCount}`);

    const totalActive = await Stadium.countDocuments({ isActive: true });
    const totalIndia = await Stadium.countDocuments({ country: 'India', isActive: true });
    const totalIntl = await Stadium.countDocuments({ country: { $ne: 'India' }, isActive: true });

    console.log(`- Total Active Stadiums: ${totalActive}`);
    console.log(`- Indian Stadiums: ${totalIndia}`);
    console.log(`- International Stadiums: ${totalIntl}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding stadium data:', error);
    process.exit(1);
  }
};

seedStadiums();
