/**
 * Multi-Country Location, States/Regions, Cities, and International Calling Codes
 */

export const COUNTRIES = [
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' }
];

export const COUNTRY_LOCATIONS = {
  'India': {
    'Gujarat': [
      'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar',
      'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi'
    ],
    'Maharashtra': [
      'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane',
      'Aurangabad', 'Solapur', 'Navi Mumbai', 'Kolhapur', 'Amravati'
    ],
    'Delhi': [
      'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka'
    ],
    'Karnataka': [
      'Bengaluru', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere'
    ],
    'Tamil Nadu': [
      'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode'
    ],
    'Rajasthan': [
      'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar'
    ],
    'Telangana': [
      'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'
    ],
    'West Bengal': [
      'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'
    ],
    'Odisha': [
      'Bhubaneswar', 'Rourkela', 'Cuttack', 'Berhampur', 'Sambalpur', 'Puri'
    ],
    'Kerala': [
      'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad'
    ],
    'Punjab': [
      'Mohali', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'
    ],
    'Haryana': [
      'Gurugram', 'Faridabad', 'Panchkula', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak'
    ],
    'Goa': [
      'Margao', 'Panaji', 'Vasco da Gama', 'Mapusa', 'Ponda'
    ],
    'Madhya Pradesh': [
      'Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas'
    ],
    'Assam': [
      'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'
    ],
    'Uttar Pradesh': [
      'Lucknow', 'Kanpur', 'Noida', 'Varanasi', 'Agra', 'Prayagraj', 'Ghaziabad', 'Meerut'
    ],
    'Bihar': [
      'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'
    ],
    'Jharkhand': [
      'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'
    ],
    'Chhattisgarh': [
      'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon'
    ],
    'Uttarakhand': [
      'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh'
    ],
    'Himachal Pradesh': [
      'Dharamshala', 'Shimla', 'Mandi', 'Solan', 'Kullu'
    ],
    'Jammu & Kashmir': [
      'Srinagar', 'Jammu', 'Anantnag', 'Baramulla'
    ]
  },
  'United Kingdom': {
    'England': [
      'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Newcastle', 'Bristol'
    ],
    'Scotland': [
      'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'
    ],
    'Wales': [
      'Cardiff', 'Swansea', 'Newport'
    ],
    'Northern Ireland': [
      'Belfast', 'Derry', 'Lisburn'
    ]
  },
  'Spain': {
    'Community of Madrid': [
      'Madrid', 'Alcalá de Henares', 'Getafe', 'Móstoles'
    ],
    'Catalonia': [
      'Barcelona', 'Girona', 'Lleida', 'Tarragona'
    ],
    'Andalusia': [
      'Seville', 'Málaga', 'Granada', 'Córdoba'
    ],
    'Valencian Community': [
      'Valencia', 'Alicante', 'Castellón de la Plana'
    ],
    'Basque Country': [
      'Bilbao', 'San Sebastián', 'Vitoria-Gasteiz'
    ]
  },
  'United States': {
    'New York': [
      'New York', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'
    ],
    'California': [
      'Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'
    ],
    'Texas': [
      'Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'
    ],
    'Florida': [
      'Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'
    ],
    'Illinois': [
      'Chicago', 'Naperville', 'Springfield', 'Peoria'
    ]
  },
  'Australia': {
    'Victoria': [
      'Melbourne', 'Geelong', 'Ballarat', 'Bendigo'
    ],
    'New South Wales': [
      'Sydney', 'Newcastle', 'Central Coast', 'Wollongong'
    ],
    'Queensland': [
      'Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns'
    ],
    'Western Australia': [
      'Perth', 'Fremantle', 'Mandurah'
    ],
    'South Australia': [
      'Adelaide', 'Mount Gambier'
    ]
  },
  'United Arab Emirates': {
    'Dubai': [
      'Dubai'
    ],
    'Abu Dhabi': [
      'Abu Dhabi', 'Al Ain'
    ],
    'Sharjah': [
      'Sharjah'
    ],
    'Ajman': [
      'Ajman'
    ],
    'Ras Al Khaimah': [
      'Ras Al Khaimah'
    ]
  },
  'Canada': {
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'],
    'Quebec': ['Montreal', 'Quebec City', 'Laval'],
    'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'],
    'Alberta': ['Calgary', 'Edmonton']
  },
  'Germany': {
    'Bavaria': ['Munich', 'Nuremberg', 'Augsburg'],
    'Berlin': ['Berlin'],
    'North Rhine-Westphalia': ['Cologne', 'Düsseldorf', 'Dortmund'],
    'Hesse': ['Frankfurt', 'Wiesbaden'],
    'Hamburg': ['Hamburg']
  },
  'France': {
    'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis'],
    'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Cannes'],
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne']
  },
  'Singapore': {
    'Singapore': ['Singapore', 'Jurong', 'Tampines', 'Woodlands']
  }
};

// Re-export India locations for backwards compatibility
export const INDIA_LOCATIONS = COUNTRY_LOCATIONS['India'];

export const getCountryDialCode = (countryName) => {
  const found = COUNTRIES.find((c) => c.name.toLowerCase() === (countryName || '').toLowerCase());
  return found ? found.dialCode : '+91';
};

export const getStatesForCountry = (countryName) => {
  if (!countryName) return [];
  const regions = COUNTRY_LOCATIONS[countryName];
  return regions ? Object.keys(regions) : [];
};

export const getCitiesForState = (countryName, stateName) => {
  if (!countryName || !stateName) return [];
  const regions = COUNTRY_LOCATIONS[countryName];
  if (!regions) return [];
  return regions[stateName] || [];
};
