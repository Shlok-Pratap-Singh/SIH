import {
  users,
  tourists,
  touristLocations,
  panicAlerts,
  newsUpdates,
  safetyZones,
  policeStations,
  type User,
  type UpsertUser,
  type Tourist,
  type InsertTourist,
  type TouristLocation,
  type InsertTouristLocation,
  type PanicAlert,
  type InsertPanicAlert,
  type NewsUpdate,
  type InsertNewsUpdate,
  type SafetyZone,
  type PoliceStation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Tourist operations
  createTourist(tourist: InsertTourist): Promise<Tourist>;
  getTouristByDigitalId(digitalId: string): Promise<Tourist | undefined>;
  getTouristByUserId(userId: string): Promise<Tourist | undefined>;
  getTourist(id: string): Promise<Tourist | undefined>;
  getAllTourists(): Promise<Tourist[]>;
  updateTourist(id: string, data: Partial<Tourist>): Promise<Tourist>;

  // Location operations
  addTouristLocation(location: InsertTouristLocation): Promise<TouristLocation>;
  getTouristLocations(touristId: string, limit?: number): Promise<TouristLocation[]>;
  getLatestTouristLocation(touristId: string): Promise<TouristLocation | undefined>;
  getAllActiveTouristLocations(): Promise<(TouristLocation & { tourist: Tourist })[]>;

  // Panic alert operations
  createPanicAlert(alert: InsertPanicAlert): Promise<PanicAlert>;
  getPanicAlerts(status?: string): Promise<(PanicAlert & { tourist: Tourist })[]>;
  updatePanicAlert(id: string, data: Partial<PanicAlert>): Promise<PanicAlert>;
  getPanicAlert(id: string): Promise<PanicAlert | undefined>;

  // News operations
  createNewsUpdate(news: InsertNewsUpdate): Promise<NewsUpdate>;
  getNewsUpdates(state?: string, limit?: number): Promise<NewsUpdate[]>;
  updateNewsUpdate(id: string, data: Partial<NewsUpdate>): Promise<NewsUpdate>;
  deleteOldNewsUpdates(beforeDate: Date): Promise<number>;

  // Safety zones
  getSafetyZones(state?: string): Promise<SafetyZone[]>;
  getSafetyZoneByCoordinates(lat: number, lng: number): Promise<SafetyZone | undefined>;

  // Police stations
  getPoliceStations(state?: string): Promise<PoliceStation[]>;
  getNearestPoliceStation(lat: number, lng: number): Promise<PoliceStation | undefined>;
  
  // Session management for WebSocket authentication
  getSessionData(sessionId: string): Promise<{ userId?: string } | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tourist operations
  async createTourist(tourist: InsertTourist): Promise<Tourist> {
    const digitalId = `NE${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    const qrCodeData = JSON.stringify({
      digitalId,
      name: tourist.fullName,
      validUntil: tourist.validUntil,
      nationality: tourist.nationality,
    });

    const [newTourist] = await db
      .insert(tourists)
      .values({
        ...tourist,
        digitalId,
        qrCodeData,
      })
      .returning();
    return newTourist;
  }

  async getTouristByDigitalId(digitalId: string): Promise<Tourist | undefined> {
    const [tourist] = await db.select().from(tourists).where(eq(tourists.digitalId, digitalId));
    return tourist;
  }

  async getTouristByUserId(userId: string): Promise<Tourist | undefined> {
    const [tourist] = await db.select().from(tourists).where(eq(tourists.userId, userId));
    return tourist;
  }

  async getTourist(id: string): Promise<Tourist | undefined> {
    const [tourist] = await db.select().from(tourists).where(eq(tourists.id, id));
    return tourist;
  }

  async getAllTourists(): Promise<Tourist[]> {
    return await db.select().from(tourists).where(eq(tourists.isActive, true));
  }

  async updateTourist(id: string, data: Partial<Tourist>): Promise<Tourist> {
    const [tourist] = await db
      .update(tourists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tourists.id, id))
      .returning();
    return tourist;
  }

  // Location operations
  async addTouristLocation(location: InsertTouristLocation): Promise<TouristLocation> {
    const [newLocation] = await db
      .insert(touristLocations)
      .values(location)
      .returning();
    return newLocation;
  }

  async getTouristLocations(touristId: string, limit = 50): Promise<TouristLocation[]> {
    return await db
      .select()
      .from(touristLocations)
      .where(eq(touristLocations.touristId, touristId))
      .orderBy(desc(touristLocations.timestamp))
      .limit(limit);
  }

  async getLatestTouristLocation(touristId: string): Promise<TouristLocation | undefined> {
    const [location] = await db
      .select()
      .from(touristLocations)
      .where(eq(touristLocations.touristId, touristId))
      .orderBy(desc(touristLocations.timestamp))
      .limit(1);
    return location;
  }

  async getAllActiveTouristLocations(): Promise<(TouristLocation & { tourist: Tourist })[]> {
    return await db
      .select({
        id: touristLocations.id,
        touristId: touristLocations.touristId,
        latitude: touristLocations.latitude,
        longitude: touristLocations.longitude,
        address: touristLocations.address,
        safetyZone: touristLocations.safetyZone,
        safetyScore: touristLocations.safetyScore,
        timestamp: touristLocations.timestamp,
        tourist: tourists,
      })
      .from(touristLocations)
      .innerJoin(tourists, eq(touristLocations.touristId, tourists.id))
      .where(eq(tourists.isActive, true))
      .orderBy(desc(touristLocations.timestamp));
  }

  // Panic alert operations
  async createPanicAlert(alert: InsertPanicAlert): Promise<PanicAlert> {
    const [newAlert] = await db
      .insert(panicAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getPanicAlerts(status?: string): Promise<(PanicAlert & { tourist: Tourist })[]> {
    const query = db
      .select({
        id: panicAlerts.id,
        touristId: panicAlerts.touristId,
        latitude: panicAlerts.latitude,
        longitude: panicAlerts.longitude,
        address: panicAlerts.address,
        status: panicAlerts.status,
        priority: panicAlerts.priority,
        responseTime: panicAlerts.responseTime,
        respondedBy: panicAlerts.respondedBy,
        notes: panicAlerts.notes,
        createdAt: panicAlerts.createdAt,
        resolvedAt: panicAlerts.resolvedAt,
        tourist: tourists,
      })
      .from(panicAlerts)
      .innerJoin(tourists, eq(panicAlerts.touristId, tourists.id))
      .orderBy(desc(panicAlerts.createdAt));

    if (status) {
      return await query.where(eq(panicAlerts.status, status));
    }
    return await query;
  }

  async updatePanicAlert(id: string, data: Partial<PanicAlert>): Promise<PanicAlert> {
    const [alert] = await db
      .update(panicAlerts)
      .set(data)
      .where(eq(panicAlerts.id, id))
      .returning();
    return alert;
  }

  async getPanicAlert(id: string): Promise<PanicAlert | undefined> {
    const [alert] = await db.select().from(panicAlerts).where(eq(panicAlerts.id, id));
    return alert;
  }

  // News operations
  async createNewsUpdate(news: InsertNewsUpdate): Promise<NewsUpdate> {
    const [newNews] = await db
      .insert(newsUpdates)
      .values(news)
      .returning();
    return newNews;
  }

  async getNewsUpdates(state?: string, limit = 20): Promise<NewsUpdate[]> {
    const query = db
      .select()
      .from(newsUpdates)
      .where(eq(newsUpdates.isActive, true))
      .orderBy(desc(newsUpdates.publishedAt))
      .limit(limit);

    if (state) {
      return await query.where(and(eq(newsUpdates.state, state), eq(newsUpdates.isActive, true)));
    }
    return await query;
  }

  async updateNewsUpdate(id: string, data: Partial<NewsUpdate>): Promise<NewsUpdate> {
    const [news] = await db
      .update(newsUpdates)
      .set(data)
      .where(eq(newsUpdates.id, id))
      .returning();
    return news;
  }

  async deleteOldNewsUpdates(beforeDate: Date): Promise<number> {
    const result = await db
      .delete(newsUpdates)
      .where(sql`${newsUpdates.publishedAt} < ${beforeDate.toISOString()}`);
    
    return result.rowCount || 0;
  }

  // Safety zones
  async getSafetyZones(state?: string): Promise<SafetyZone[]> {
    const query = db
      .select()
      .from(safetyZones)
      .where(eq(safetyZones.isActive, true));

    if (state) {
      return await query.where(and(eq(safetyZones.state, state), eq(safetyZones.isActive, true)));
    }
    return await query;
  }

  async getSafetyZoneByCoordinates(lat: number, lng: number): Promise<SafetyZone | undefined> {
    // This would require PostGIS functions for proper geo queries
    // For now, return a simplified implementation
    const zones = await this.getSafetyZones();
    // TODO: Implement proper geo-spatial queries
    return zones.find(zone => zone.zoneType === 'safe'); // Simplified
  }

  // Police stations
  async getPoliceStations(state?: string): Promise<PoliceStation[]> {
    const query = db
      .select()
      .from(policeStations)
      .where(eq(policeStations.isActive, true));

    if (state) {
      return await query.where(and(eq(policeStations.state, state), eq(policeStations.isActive, true)));
    }
    return await query;
  }

  async getNearestPoliceStation(lat: number, lng: number): Promise<PoliceStation | undefined> {
    // Simplified distance calculation - in production, use PostGIS
    const stations = await this.getPoliceStations();
    if (stations.length === 0) return undefined;

    let nearest = stations[0];
    let minDistance = this.calculateDistance(
      lat, lng,
      parseFloat(nearest.latitude), parseFloat(nearest.longitude)
    );

    for (const station of stations.slice(1)) {
      const distance = this.calculateDistance(
        lat, lng,
        parseFloat(station.latitude), parseFloat(station.longitude)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }

    return nearest;
  }

  // Session management for WebSocket authentication
  async getSessionData(sessionId: string): Promise<{ userId?: string } | null> {
    try {
      // Query the sessions table directly for session data
      const result = await db.execute(sql`
        SELECT sess 
        FROM sessions 
        WHERE sid = ${sessionId} 
        AND expire > NOW()
      `);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Parse session data to extract user info
      const sessionData = result.rows[0];
      const sess = sessionData.sess as any;
      
      // Extract user ID from Passport session structure
      if (sess.passport?.user?.claims?.sub) {
        return { userId: sess.passport.user.claims.sub };
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving session data:', error);
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const storage = new DatabaseStorage();
