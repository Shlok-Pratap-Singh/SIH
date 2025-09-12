import { db } from './db';
import { safetyZones, touristLocations, panicAlerts, newsUpdates, policeStations } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

// Configuration for safety scoring weights
const SCORING_CONFIG = {
  weights: {
    incidents: 0.3,        // Recent panic alerts and incidents
    news: 0.2,            // Safety-related news
    policeProximity: 0.2,  // Distance to nearest police station
    density: 0.15,        // Tourist density in area
    terrain: 0.1,         // Base terrain/restriction type
    timeOfDay: 0.05       // Time-based risk factors
  },
  decay: {
    timeDecayHours: 24,   // How quickly incident impact decays
    spatialDecayKm: 5     // How quickly spatial impact decays
  },
  thresholds: {
    safe: 20,
    moderate: 50,
    unsafe: 80
  }
};

interface SafetyInput {
  incidents: number;
  newsAlerts: number;
  policeDistance: number;
  touristDensity: number;
  terrainRisk: number;
  timeRisk: number;
}

interface ComputedSafetyScore {
  score: number;
  confidence: number;
  factors: {
    incidents: number;
    news: number;
    policeProximity: number;
    density: number;
    terrain: number;
    timeOfDay: number;
  };
  category: 'safe' | 'moderate' | 'unsafe';
  lastUpdated: Date;
}

export class SafetyScoringService {
  private static instance: SafetyScoringService;
  private scoreCache = new Map<string, ComputedSafetyScore>();
  private lastCacheUpdate = new Date(0);
  
  static getInstance(): SafetyScoringService {
    if (!SafetyScoringService.instance) {
      SafetyScoringService.instance = new SafetyScoringService();
    }
    return SafetyScoringService.instance;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Apply exponential decay based on time
   */
  private applyTimeDecay(value: number, hoursAgo: number): number {
    const decayRate = Math.log(0.5) / SCORING_CONFIG.decay.timeDecayHours; // Half-life decay
    return value * Math.exp(decayRate * hoursAgo);
  }

  /**
   * Apply spatial decay based on distance
   */
  private applySpatialDecay(value: number, distanceKm: number): number {
    const decayRate = Math.log(0.5) / SCORING_CONFIG.decay.spatialDecayKm; // Half-life decay
    return value * Math.exp(decayRate * distanceKm);
  }

  /**
   * Normalize a value to 0-1 range
   */
  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * Get terrain risk score based on zone type
   */
  private getTerrainRisk(zoneType: string): number {
    const terrainRisks: { [key: string]: number } = {
      'safe': 0.1,
      'moderate': 0.5,
      'unsafe': 0.9,
      'forest': 0.6,
      'restricted': 0.8
    };
    return terrainRisks[zoneType] || 0.5;
  }

  /**
   * Get time-based risk factor
   */
  private getTimeRisk(): number {
    const now = new Date();
    const hour = now.getHours();
    
    // Higher risk during late night/early morning hours
    if (hour >= 22 || hour <= 5) {
      return 0.7;
    } else if (hour >= 18 || hour <= 7) {
      return 0.4;
    } else {
      return 0.2; // Safer during daytime
    }
  }

  /**
   * Calculate safety inputs for a specific zone
   */
  private async calculateSafetyInputs(zoneId: string, zoneLat: number, zoneLng: number): Promise<SafetyInput> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent incidents (panic alerts) near this zone
    const recentIncidents = await db.select()
      .from(panicAlerts)
      .where(and(
        gte(panicAlerts.createdAt, oneWeekAgo),
        eq(panicAlerts.status, 'active')
      ));

    // Calculate incident score with spatial and temporal decay
    let incidentScore = 0;
    for (const incident of recentIncidents) {
      const distance = this.calculateDistance(
        zoneLat, zoneLng, 
        parseFloat(incident.latitude), parseFloat(incident.longitude)
      );
      const hoursAgo = (now.getTime() - new Date(incident.createdAt!).getTime()) / (1000 * 60 * 60);
      
      let impact = 1.0; // Base impact
      if (incident.priority === 'high') impact = 1.5;
      if (incident.priority === 'critical') impact = 2.0;
      
      impact = this.applySpatialDecay(impact, distance);
      impact = this.applyTimeDecay(impact, hoursAgo);
      incidentScore += impact;
    }

    // Get safety-related news alerts
    const recentNews = await db.select()
      .from(newsUpdates)
      .where(gte(newsUpdates.publishedAt, oneWeekAgo));

    let newsScore = 0;
    for (const news of recentNews) {
      const hoursAgo = (now.getTime() - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60);
      let impact = 0.5; // Base news impact
      
      // Higher impact for safety-related categories
      if (news.category === 'emergency') impact = 1.0;
      if (news.category === 'alert') impact = 0.8;
      if (news.category === 'safety') impact = 0.3;
      
      impact = this.applyTimeDecay(impact, hoursAgo);
      newsScore += impact;
    }

    // Calculate distance to nearest police station
    const policeStationList = await db.select().from(policeStations);
    let nearestPoliceDistance = Infinity;
    
    for (const station of policeStationList) {
      const distance = this.calculateDistance(
        zoneLat, zoneLng, 
        parseFloat(station.latitude), parseFloat(station.longitude)
      );
      nearestPoliceDistance = Math.min(nearestPoliceDistance, distance);
    }

    // Get tourist density in the area
    const recentTourists = await db.select()
      .from(touristLocations)
      .where(gte(touristLocations.timestamp, oneDayAgo));

    let touristDensity = 0;
    for (const tourist of recentTourists) {
      const distance = this.calculateDistance(
        zoneLat, zoneLng,
        parseFloat(tourist.latitude), parseFloat(tourist.longitude)
      );
      if (distance <= 2) { // Within 2km radius
        touristDensity += this.applySpatialDecay(1, distance);
      }
    }

    return {
      incidents: incidentScore,
      newsAlerts: newsScore,
      policeDistance: nearestPoliceDistance === Infinity ? 50 : nearestPoliceDistance, // Default 50km if no stations
      touristDensity,
      terrainRisk: 0, // Will be set per zone
      timeRisk: this.getTimeRisk()
    };
  }

  /**
   * Compute safety score for a zone
   */
  private computeScore(inputs: SafetyInput, terrainRisk: number): ComputedSafetyScore {
    // Normalize inputs to 0-1 scale
    const normalizedIncidents = this.normalize(inputs.incidents, 0, 5); // 0-5 incidents range
    const normalizedNews = this.normalize(inputs.newsAlerts, 0, 10); // 0-10 news alerts range
    const normalizedPoliceDistance = 1 - this.normalize(inputs.policeDistance, 0, 20); // Closer = safer
    const normalizedDensity = this.normalize(inputs.touristDensity, 0, 20); // More tourists = potentially safer
    const normalizedTerrain = terrainRisk;
    const normalizedTime = inputs.timeRisk;

    // Calculate weighted score (0-100 scale)
    const score = 100 * (
      (normalizedIncidents * SCORING_CONFIG.weights.incidents) +
      (normalizedNews * SCORING_CONFIG.weights.news) +
      (normalizedTerrain * SCORING_CONFIG.weights.terrain) +
      (normalizedTime * SCORING_CONFIG.weights.timeOfDay) +
      (normalizedDensity * SCORING_CONFIG.weights.density) -
      (normalizedPoliceDistance * SCORING_CONFIG.weights.policeProximity) // Police proximity reduces risk
    );

    // Clamp score to 0-100
    const finalScore = Math.max(0, Math.min(100, score));

    // Calculate confidence based on data availability
    let confidence = 0.5; // Base confidence
    confidence += inputs.incidents > 0 ? 0.2 : 0;
    confidence += inputs.newsAlerts > 0 ? 0.15 : 0;
    confidence += inputs.policeDistance < 50 ? 0.15 : 0;
    confidence += inputs.touristDensity > 0 ? 0.1 : 0;
    confidence = Math.min(1, confidence);

    // Determine category
    let category: 'safe' | 'moderate' | 'unsafe';
    if (finalScore <= SCORING_CONFIG.thresholds.safe) {
      category = 'safe';
    } else if (finalScore <= SCORING_CONFIG.thresholds.moderate) {
      category = 'moderate';
    } else {
      category = 'unsafe';
    }

    return {
      score: finalScore,
      confidence,
      factors: {
        incidents: normalizedIncidents,
        news: normalizedNews,
        policeProximity: normalizedPoliceDistance,
        density: normalizedDensity,
        terrain: normalizedTerrain,
        timeOfDay: normalizedTime
      },
      category,
      lastUpdated: new Date()
    };
  }

  /**
   * Update safety scores for all zones
   */
  async updateAllZoneScores(): Promise<void> {
    try {
      const zones = await db.select().from(safetyZones);
      
      for (const zone of zones) {
        let zoneLat = 26.1445; // Default to Guwahati
        let zoneLng = 91.7362;
        
        // Try to extract coordinates from the zone
        if (zone.coordinates) {
          const coords = zone.coordinates as any;
          if (coords.center) {
            zoneLat = coords.center.lat;
            zoneLng = coords.center.lng;
          } else if (coords.lat && coords.lng) {
            zoneLat = coords.lat;
            zoneLng = coords.lng;
          }
        }

        const inputs = await this.calculateSafetyInputs(zone.id, zoneLat, zoneLng);
        const terrainRisk = this.getTerrainRisk(zone.zoneType);
        inputs.terrainRisk = terrainRisk;
        
        const computedScore = this.computeScore(inputs, terrainRisk);
        this.scoreCache.set(zone.id, computedScore);
      }
      
      this.lastCacheUpdate = new Date();
      console.log(`✅ Updated safety scores for ${zones.length} zones`);
      
    } catch (error) {
      console.error('❌ Error updating zone scores:', error);
    }
  }

  /**
   * Get computed safety score for a zone
   */
  getZoneScore(zoneId: string): ComputedSafetyScore | null {
    return this.scoreCache.get(zoneId) || null;
  }

  /**
   * Get all computed zone scores
   */
  getAllZoneScores(): Map<string, ComputedSafetyScore> {
    return new Map(this.scoreCache);
  }

  /**
   * Check if scores need updating (cache is older than 5 minutes)
   */
  shouldUpdateScores(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastCacheUpdate < fiveMinutesAgo;
  }

  /**
   * Start automatic score updates every 5 minutes
   */
  startAutoUpdate(): void {
    // Initial update
    this.updateAllZoneScores();
    
    // Schedule updates every 5 minutes
    setInterval(() => {
      this.updateAllZoneScores();
    }, 5 * 60 * 1000);
    
    console.log('🔄 SafetyScoringService auto-update started (every 5 minutes)');
  }
}