// Safety zones data for Northeast India with proper coordinates and classifications
export interface SafetyZoneData {
  id: string;
  name: string;
  state: string;
  zoneType: 'safe' | 'moderate' | 'unsafe' | 'forest' | 'restricted';
  coordinates: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  description: string;
  riskLevel: number; // 0-100
  restrictions?: string[];
}

// Northeast India coordinate boundaries: 23°N-29°N, 88°E-97°E
export const NORTHEAST_BOUNDS = {
  north: 29.0,
  south: 23.0,
  east: 97.0,
  west: 88.0
};

// Major cities and tourist destinations in Northeast India
export const NORTHEAST_CITIES = {
  'Guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'Shillong': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
  'Itanagar': { lat: 27.0844, lng: 93.6053, state: 'Arunachal Pradesh' },
  'Kohima': { lat: 25.6751, lng: 94.1086, state: 'Nagaland' },
  'Imphal': { lat: 24.8170, lng: 93.9368, state: 'Manipur' },
  'Aizawl': { lat: 23.7307, lng: 92.7173, state: 'Mizoram' },
  'Agartala': { lat: 23.8315, lng: 91.2868, state: 'Tripura' },
  'Gangtok': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  'Tezpur': { lat: 26.6344, lng: 92.7933, state: 'Assam' },
  'Dibrugarh': { lat: 27.4728, lng: 94.9120, state: 'Assam' },
  'Silchar': { lat: 24.8333, lng: 92.7789, state: 'Assam' },
  'Cherrapunji': { lat: 25.2747, lng: 91.7323, state: 'Meghalaya' },
  'Dawki': { lat: 25.1167, lng: 91.7667, state: 'Meghalaya' },
  'Tawang': { lat: 27.5859, lng: 91.8716, state: 'Arunachal Pradesh' },
  'Mokokchung': { lat: 26.3226, lng: 94.5251, state: 'Nagaland' },
  'Loktak Lake': { lat: 24.5500, lng: 93.7833, state: 'Manipur' },
  'Lunglei': { lat: 22.8879, lng: 92.7345, state: 'Mizoram' },
  'Udaipur': { lat: 23.5331, lng: 91.4865, state: 'Tripura' },
  'Pelling': { lat: 27.2152, lng: 88.2426, state: 'Sikkim' },
  'Namchi': { lat: 27.1651, lng: 88.3644, state: 'Sikkim' }
};

// Forest reserves and national parks (marked as forest zones)
export const FOREST_ZONES = [
  {
    name: 'Kaziranga National Park',
    state: 'Assam',
    coordinates: { lat: 26.5775, lng: 93.1717 },
    description: 'UNESCO World Heritage Site, home to one-horned rhinoceros'
  },
  {
    name: 'Manas National Park',
    state: 'Assam',
    coordinates: { lat: 26.7044, lng: 90.9127 },
    description: 'UNESCO World Heritage Site and Tiger Reserve'
  },
  {
    name: 'Nameri National Park',
    state: 'Assam',
    coordinates: { lat: 26.9333, lng: 92.8500 },
    description: 'Tiger Reserve with diverse wildlife'
  },
  {
    name: 'Dibru-Saikhowa National Park',
    state: 'Assam',
    coordinates: { lat: 27.5833, lng: 95.1833 },
    description: 'Wetland ecosystem with feral horses'
  },
  {
    name: 'Balphakram National Park',
    state: 'Meghalaya',
    coordinates: { lat: 25.2000, lng: 90.9333 },
    description: 'Land of perpetual winds'
  },
  {
    name: 'Nokrek National Park',
    state: 'Meghalaya',
    coordinates: { lat: 25.5000, lng: 90.2000 },
    description: 'Biosphere reserve with wild citrus fruits'
  },
  {
    name: 'Namdapha National Park',
    state: 'Arunachal Pradesh',
    coordinates: { lat: 27.5000, lng: 96.3500 },
    description: 'Largest protected area in Northeast India'
  },
  {
    name: 'Mouling National Park',
    state: 'Arunachal Pradesh',
    coordinates: { lat: 28.3000, lng: 95.1500 },
    description: 'Important bird area with rare species'
  },
  {
    name: 'Intanki National Park',
    state: 'Nagaland',
    coordinates: { lat: 25.5667, lng: 93.9833 },
    description: 'Hornbill habitat and tribal conservation area'
  },
  {
    name: 'Keibul Lamjao National Park',
    state: 'Manipur',
    coordinates: { lat: 24.5167, lng: 93.8167 },
    description: 'Floating national park, home to Sangai deer'
  },
  {
    name: 'Murlen National Park',
    state: 'Mizoram',
    coordinates: { lat: 23.7000, lng: 93.2833 },
    description: 'Montane forest ecosystem'
  },
  {
    name: 'Phawngpui Blue Mountain National Park',
    state: 'Mizoram',
    coordinates: { lat: 22.6167, lng: 93.0167 },
    description: 'Highest peak in Mizoram'
  },
  {
    name: 'Clouded Leopard National Park',
    state: 'Tripura',
    coordinates: { lat: 23.8000, lng: 91.4167 },
    description: 'Home to clouded leopards and primates'
  },
  {
    name: 'Bison National Park',
    state: 'Tripura',
    coordinates: { lat: 23.7500, lng: 91.4500 },
    description: 'Gaur (Indian bison) habitat'
  },
  {
    name: 'Khangchendzonga National Park',
    state: 'Sikkim',
    coordinates: { lat: 27.7000, lng: 88.1500 },
    description: 'UNESCO World Heritage Site around Mt. Kanchenjunga'
  }
];

// Border areas and restricted zones
export const RESTRICTED_ZONES = [
  {
    name: 'China Border - Arunachal Pradesh',
    state: 'Arunachal Pradesh',
    description: 'International border area requiring special permits',
    coordinates: { lat: 28.2180, lng: 94.7278 }
  },
  {
    name: 'China Border - Sikkim',
    state: 'Sikkim',
    description: 'Nathu La Pass and surrounding border areas',
    coordinates: { lat: 27.3914, lng: 88.8414 }
  },
  {
    name: 'Myanmar Border - Nagaland',
    state: 'Nagaland',
    description: 'International border with Myanmar',
    coordinates: { lat: 26.1584, lng: 95.1376 }
  },
  {
    name: 'Myanmar Border - Manipur',
    state: 'Manipur',
    description: 'Moreh border crossing and surrounding areas',
    coordinates: { lat: 24.4825, lng: 94.1086 }
  },
  {
    name: 'Myanmar Border - Mizoram',
    state: 'Mizoram',
    description: 'International border with Myanmar',
    coordinates: { lat: 23.1645, lng: 93.2990 }
  },
  {
    name: 'Bangladesh Border - Meghalaya',
    state: 'Meghalaya',
    description: 'Dawki border and surrounding areas',
    coordinates: { lat: 25.1167, lng: 91.7667 }
  },
  {
    name: 'Bangladesh Border - Tripura',
    state: 'Tripura',
    description: 'Agartala border and surrounding areas',
    coordinates: { lat: 23.8315, lng: 91.2868 }
  },
  {
    name: 'Bangladesh Border - Assam',
    state: 'Assam',
    description: 'International border areas',
    coordinates: { lat: 24.8000, lng: 89.9000 }
  }
];

// Function to determine safety zone based on coordinates
export function getSafetyZone(lat: number, lng: number): {
  zoneType: 'safe' | 'moderate' | 'unsafe' | 'forest' | 'restricted';
  score: number;
  reason: string;
} {
  // Check if coordinates are within Northeast India bounds
  if (lat < NORTHEAST_BOUNDS.south || lat > NORTHEAST_BOUNDS.north || 
      lng < NORTHEAST_BOUNDS.west || lng > NORTHEAST_BOUNDS.east) {
    return {
      zoneType: 'restricted',
      score: 0,
      reason: 'Outside Northeast India jurisdiction'
    };
  }

  // Check if in restricted border areas (within 10km of borders)
  for (const zone of RESTRICTED_ZONES) {
    const distance = calculateDistance(lat, lng, zone.coordinates.lat, zone.coordinates.lng);
    if (distance < 10) { // 10km buffer for border areas
      return {
        zoneType: 'restricted',
        score: 20,
        reason: zone.description
      };
    }
  }

  // Check if in forest/national park areas (within 5km)
  for (const forest of FOREST_ZONES) {
    const distance = calculateDistance(lat, lng, forest.coordinates.lat, forest.coordinates.lng);
    if (distance < 5) { // 5km buffer for forest areas
      return {
        zoneType: 'forest',
        score: 60,
        reason: `Near ${forest.name} - ${forest.description}`
      };
    }
  }

  // Check if near major cities (safe zones)
  for (const [cityName, cityData] of Object.entries(NORTHEAST_CITIES)) {
    const distance = calculateDistance(lat, lng, cityData.lat, cityData.lng);
    if (distance < 20) { // 20km buffer for major cities
      return {
        zoneType: 'safe',
        score: 90,
        reason: `Near ${cityName}, ${cityData.state} - Tourist-friendly area`
      };
    }
  }

  // Check for moderate zones (rural but accessible areas)
  // Areas between cities but not near borders or forests
  const nearestCityDistance = Math.min(
    ...Object.values(NORTHEAST_CITIES).map(city => 
      calculateDistance(lat, lng, city.lat, city.lng)
    )
  );

  if (nearestCityDistance < 50) {
    return {
      zoneType: 'moderate',
      score: 70,
      reason: 'Rural area with moderate infrastructure'
    };
  }

  // Remote areas - potentially unsafe due to lack of infrastructure
  return {
    zoneType: 'unsafe',
    score: 40,
    reason: 'Remote area with limited infrastructure and connectivity'
  };
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Time-based safety scoring adjustments
export function adjustSafetyScoreForTime(baseScore: number, hour: number): number {
  // Reduce safety score during night hours (22:00 - 06:00)
  if (hour >= 22 || hour <= 6) {
    return Math.max(baseScore - 20, 0);
  }
  
  // Slightly reduce score during early morning and late evening
  if ((hour >= 6 && hour <= 8) || (hour >= 19 && hour <= 22)) {
    return Math.max(baseScore - 10, 0);
  }
  
  // Normal hours (09:00 - 18:00)
  return baseScore;
}

// Weather-based safety scoring adjustments
export function adjustSafetyScoreForWeather(baseScore: number, conditions: string): number {
  const weather = conditions.toLowerCase();
  
  if (weather.includes('heavy rain') || weather.includes('storm') || weather.includes('cyclone')) {
    return Math.max(baseScore - 30, 0);
  }
  
  if (weather.includes('rain') || weather.includes('fog') || weather.includes('mist')) {
    return Math.max(baseScore - 15, 0);
  }
  
  if (weather.includes('snow') || weather.includes('hail')) {
    return Math.max(baseScore - 25, 0);
  }
  
  return baseScore;
}

export default {
  NORTHEAST_BOUNDS,
  NORTHEAST_CITIES,
  FOREST_ZONES,
  RESTRICTED_ZONES,
  getSafetyZone,
  adjustSafetyScoreForTime,
  adjustSafetyScoreForWeather
};
