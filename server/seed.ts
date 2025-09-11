import { db } from './db';
import { safetyZones, policeStations, newsUpdates } from '@shared/schema';

// Northeast India Safety Zones
const neZones = [
  // Assam
  {
    name: "Guwahati Tourist Zone",
    state: "Assam",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[91.7362, 26.1445], [91.7862, 26.1445], [91.7862, 26.1945], [91.7362, 26.1945], [91.7362, 26.1445]]]
    }),
    description: "Main tourist area in Guwahati with good infrastructure",
    riskLevel: 10
  },
  {
    name: "Kamakhya Temple Area",
    state: "Assam", 
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[91.7005, 26.1668], [91.7205, 26.1668], [91.7205, 26.1868], [91.7005, 26.1868], [91.7005, 26.1668]]]
    }),
    description: "Sacred temple area with security presence",
    riskLevel: 15
  },
  {
    name: "Assam-Meghalaya Border",
    state: "Assam",
    zoneType: "moderate" as const,
    coordinates: JSON.stringify({
      type: "Polygon", 
      coordinates: [[[91.8800, 25.5000], [91.9800, 25.5000], [91.9800, 25.6000], [91.8800, 25.6000], [91.8800, 25.5000]]]
    }),
    description: "Border area with moderate risks",
    riskLevel: 45
  },
  
  // Meghalaya
  {
    name: "Shillong City Center",
    state: "Meghalaya",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[91.8800, 25.5690], [91.9000, 25.5690], [91.9000, 25.5890], [91.8800, 25.5890], [91.8800, 25.5690]]]
    }),
    description: "Main city area with good infrastructure",
    riskLevel: 20
  },
  {
    name: "Cherrapunji Tourism Area",
    state: "Meghalaya",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[91.7000, 25.3000], [91.7500, 25.3000], [91.7500, 25.3500], [91.7000, 25.3500], [91.7000, 25.3000]]]
    }),
    description: "Popular tourist destination with waterfalls",
    riskLevel: 25
  },
  
  // Arunachal Pradesh
  {
    name: "Itanagar Capital Area",
    state: "Arunachal Pradesh",
    zoneType: "moderate" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[93.6000, 27.0900], [93.6500, 27.0900], [93.6500, 27.1400], [93.6000, 27.1400], [93.6000, 27.0900]]]
    }),
    description: "State capital with basic facilities",
    riskLevel: 40
  },
  {
    name: "China Border Area",
    state: "Arunachal Pradesh",
    zoneType: "restricted" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[94.0000, 28.0000], [95.0000, 28.0000], [95.0000, 29.0000], [94.0000, 29.0000], [94.0000, 28.0000]]]
    }),
    description: "Sensitive border area requiring special permits",
    riskLevel: 90
  },
  
  // Nagaland
  {
    name: "Kohima City",
    state: "Nagaland",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[94.1070, 25.6751], [94.1270, 25.6751], [94.1270, 25.6951], [94.1070, 25.6951], [94.1070, 25.6751]]]
    }),
    description: "State capital with tourist facilities",
    riskLevel: 30
  },
  
  // Manipur
  {
    name: "Imphal Valley",
    state: "Manipur",
    zoneType: "moderate" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[93.9000, 24.8000], [94.0000, 24.8000], [94.0000, 24.9000], [93.9000, 24.9000], [93.9000, 24.8000]]]
    }),
    description: "Main valley area with recent security concerns",
    riskLevel: 60
  },
  
  // Mizoram  
  {
    name: "Aizawl City",
    state: "Mizoram",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[92.7200, 23.7271], [92.7400, 23.7271], [92.7400, 23.7471], [92.7200, 23.7471], [92.7200, 23.7271]]]
    }),
    description: "Peaceful state capital",
    riskLevel: 15
  },
  
  // Tripura
  {
    name: "Agartala Urban Area",
    state: "Tripura",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[91.2900, 23.8315], [91.3100, 23.8315], [91.3100, 23.8515], [91.2900, 23.8515], [91.2900, 23.8315]]]
    }),
    description: "State capital with good connectivity",
    riskLevel: 25
  },
  
  // Sikkim
  {
    name: "Gangtok Tourist Circuit",
    state: "Sikkim",
    zoneType: "safe" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[88.6070, 27.3389], [88.6270, 27.3389], [88.6270, 27.3589], [88.6070, 27.3589], [88.6070, 27.3389]]]
    }),
    description: "Popular tourist destination with good security",
    riskLevel: 10
  },
  {
    name: "Sikkim-Tibet Border",
    state: "Sikkim", 
    zoneType: "restricted" as const,
    coordinates: JSON.stringify({
      type: "Polygon",
      coordinates: [[[88.8000, 28.0000], [89.0000, 28.0000], [89.0000, 28.2000], [88.8000, 28.2000], [88.8000, 28.0000]]]
    }),
    description: "International border requiring permits",
    riskLevel: 85
  }
];

// Northeast India Police Stations
const policeStationData = [
  // Assam
  { name: "Guwahati Central Police Station", state: "Assam", district: "Kamrup Metro", latitude: "26.1445", longitude: "91.7362", phoneNumber: "+91-361-2540775", email: "guwahaticentral@assampolice.gov.in" },
  { name: "Kamakhya Police Outpost", state: "Assam", district: "Kamrup Metro", latitude: "26.1668", longitude: "91.7105", phoneNumber: "+91-361-2665432", email: "kamakhya@assampolice.gov.in" },
  
  // Meghalaya
  { name: "Shillong Sadar Police Station", state: "Meghalaya", district: "East Khasi Hills", latitude: "25.5690", longitude: "91.8890", phoneNumber: "+91-364-2223345", email: "shillongsadar@megpolice.gov.in" },
  { name: "Cherrapunji Police Station", state: "Meghalaya", district: "East Khasi Hills", latitude: "25.3000", longitude: "91.7250", phoneNumber: "+91-364-2887766", email: "cherrapunji@megpolice.gov.in" },
  
  // Arunachal Pradesh
  { name: "Itanagar Police Station", state: "Arunachal Pradesh", district: "Papum Pare", latitude: "27.0900", longitude: "93.6250", phoneNumber: "+91-360-2214455", email: "itanagar@arunpol.gov.in" },
  
  // Nagaland
  { name: "Kohima Police Station", state: "Nagaland", district: "Kohima", latitude: "25.6751", longitude: "94.1170", phoneNumber: "+91-370-2290123", email: "kohima@nagalandpolice.gov.in" },
  
  // Manipur  
  { name: "Imphal Police Station", state: "Manipur", district: "Imphal West", latitude: "24.8170", longitude: "93.9368", phoneNumber: "+91-385-2414567", email: "imphal@manipurpolice.gov.in" },
  
  // Mizoram
  { name: "Aizawl Police Station", state: "Mizoram", district: "Aizawl", latitude: "23.7271", longitude: "92.7300", phoneNumber: "+91-389-2323234", email: "aizawl@mizpolice.gov.in" },
  
  // Tripura
  { name: "Agartala Police Station", state: "Tripura", district: "West Tripura", latitude: "23.8315", longitude: "91.3000", phoneNumber: "+91-381-2385566", email: "agartala@tripurapolice.gov.in" },
  
  // Sikkim
  { name: "Gangtok Police Station", state: "Sikkim", district: "East Sikkim", latitude: "27.3389", longitude: "88.6170", phoneNumber: "+91-3592-202033", email: "gangtok@sikkimpolice.gov.in" }
];

// Initial Northeast India News Updates
const initialNews = [
  {
    title: "Northeast India Tourism Safety Guidelines Updated for 2024",
    content: "The Ministry of Tourism has released updated safety guidelines for travelers visiting the eight northeastern states, emphasizing digital ID requirements and emergency protocols.",
    category: "safety" as const,
    state: "Assam",
    priority: "high" as const,
    sourceUrl: "https://tourism.gov.in/ne-guidelines-2024",
    publishedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    title: "Guwahati Introduces New Tourist Safety Zones",
    content: "Guwahati municipal authorities have designated new safety zones around major tourist attractions with enhanced security measures and emergency response systems.",
    category: "info" as const,
    state: "Assam",
    priority: "medium" as const,
    sourceUrl: "https://guwahati.gov.in/safety-zones",
    publishedAt: new Date('2024-01-20T14:30:00Z')
  },
  {
    title: "Cherrapunji Weather Alert for Tourist Safety", 
    content: "Heavy rainfall warning issued for Cherrapunji region. Tourists advised to avoid waterfall areas and carry emergency communication devices.",
    category: "alert" as const,
    state: "Meghalaya",
    priority: "high" as const,
    sourceUrl: "https://megweather.gov.in/alert-jan2024",
    publishedAt: new Date('2024-01-22T08:00:00Z')
  },
  {
    title: "Sikkim Launches Digital Tourist Registration System",
    content: "Sikkim becomes the first northeastern state to implement mandatory digital tourist registration with QR-coded permits for enhanced safety tracking.",
    category: "info" as const,
    state: "Sikkim", 
    priority: "medium" as const,
    sourceUrl: "https://sikkimtourism.gov.in/digital-registration",
    publishedAt: new Date('2024-01-25T11:15:00Z')
  },
  {
    title: "Emergency Response Drills Conducted Across Northeast India",
    content: "Multi-state emergency response drills involving tourist safety scenarios completed successfully across all northeastern states with improved coordination protocols.",
    category: "safety" as const,
    priority: "medium" as const,
    sourceUrl: "https://nedisaster.gov.in/drills-2024",
    publishedAt: new Date('2024-01-28T16:45:00Z')
  }
];

export async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Insert safety zones
    console.log("Seeding safety zones...");
    for (const zone of neZones) {
      await db.insert(safetyZones).values(zone).onConflictDoNothing();
    }
    
    // Insert police stations
    console.log("Seeding police stations...");
    for (const station of policeStationData) {
      await db.insert(policeStations).values(station).onConflictDoNothing();
    }
    
    // Insert initial news
    console.log("Seeding news updates...");
    for (const news of initialNews) {
      await db.insert(newsUpdates).values(news).onConflictDoNothing();
    }
    
    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if called directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });