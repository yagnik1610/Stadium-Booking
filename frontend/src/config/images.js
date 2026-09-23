/**
 * Centralized High-Quality Sports & Stadium Image Configuration
 * Curated, high-resolution, razor-sharp photography where subjects occupy the frame.
 */

export const IMAGES = {
  // Hero: Panoramic, high-clarity professional stadium pitch & illuminated arena
  HERO: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=85',
  HERO_STADIUM: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=85',

  // Authentication Pages: Clean architectural sports facility and active pitch
  LOGIN: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1000&q=85',
  LOGIN_STADIUM: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1000&q=85',

  REGISTER: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=85',
  REGISTER_STADIUM: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=85',

  // Actual Individual Sports Categories (NO generic indoor/outdoor)
  SPORTS: {
    FOOTBALL: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    CRICKET: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    BASKETBALL: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    TENNIS: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    BADMINTON: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    VOLLEYBALL: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
    FUTSAL: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
    BOX_CRICKET: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    TABLE_TENNIS: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=800&q=80',
    SWIMMING: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=800&q=80',
  },

  // Fallback stadium gallery for venue cards (16:10 / 4:3 friendly)
  STADIUM_FALLBACKS: [
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'
  ]
};

export default IMAGES;
