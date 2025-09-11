import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTouristSchema,
  insertTouristLocationSchema,
  insertPanicAlertSchema,
  insertNewsUpdateSchema,
} from "@shared/schema";

// Interface for authenticated WebSocket clients
interface AuthenticatedWebSocketClient extends WebSocket {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Also get tourist profile if exists
      const tourist = await storage.getTouristByUserId(userId);
      
      res.json({ user, tourist });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Tourist registration
  app.post('/api/registerTourist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTouristSchema.parse({
        ...req.body,
        userId,
      });

      const tourist = await storage.createTourist(validatedData);
      res.json(tourist);
    } catch (error) {
      console.error("Error registering tourist:", error);
      res.status(400).json({ message: "Failed to register tourist" });
    }
  });

  // Update tourist location
  app.post('/api/updateLocation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tourist = await storage.getTouristByUserId(userId);
      
      if (!tourist) {
        return res.status(404).json({ message: "Tourist not found" });
      }

      const validatedData = insertTouristLocationSchema.parse({
        ...req.body,
        touristId: tourist.id,
      });

      const location = await storage.addTouristLocation(validatedData);
      
      // Broadcast location update via WebSocket
      broadcastLocationUpdate(location, tourist);
      
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(400).json({ message: "Failed to update location" });
    }
  });

  // Create panic alert
  app.post('/api/panicAlert', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tourist = await storage.getTouristByUserId(userId);
      
      if (!tourist) {
        return res.status(404).json({ message: "Tourist not found" });
      }

      const validatedData = insertPanicAlertSchema.parse({
        ...req.body,
        touristId: tourist.id,
      });

      const alert = await storage.createPanicAlert(validatedData);
      
      // Find nearest police station
      const nearestStation = await storage.getNearestPoliceStation(
        parseFloat(alert.latitude),
        parseFloat(alert.longitude)
      );
      
      // Broadcast emergency alert
      broadcastEmergencyAlert(alert, tourist, nearestStation);
      
      // Auto-resolve alert after 4 hours if not manually resolved
      setTimeout(async () => {
        try {
          const currentAlert = await storage.getPanicAlert(alert.id);
          if (currentAlert && currentAlert.status === 'active') {
            await storage.updatePanicAlert(alert.id, {
              status: 'auto-resolved',
              resolvedAt: new Date().toISOString(),
              notes: 'Auto-resolved after 4 hours without manual resolution'
            });
            console.log(`Auto-resolved panic alert ${alert.id} after 4 hours`);
          }
        } catch (error) {
          console.error(`Failed to auto-resolve alert ${alert.id}:`, error);
        }
      }, 4 * 60 * 60 * 1000); // 4 hours
      
      res.json({ 
        id: alert.id,
        message: "Emergency alert sent successfully", 
        status: alert.status,
        nearestPoliceStation: nearestStation?.name || 'Unknown',
        estimatedResponseTime: nearestStation ? '5-15 minutes' : 'Response time unknown',
        createdAt: alert.createdAt
      });
    } catch (error) {
      console.error('Panic alert error:', error);
      
      // Still try to log the attempt even if database fails
      console.log(`⚠️ FAILED EMERGENCY ALERT: User attempted alert but system failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      res.status(500).json({ 
        message: "Failed to send emergency alert", 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Get safety zones
  app.get('/api/getSafetyZones', async (req, res) => {
    try {
      const { state } = req.query;
      const zones = await storage.getSafetyZones(state as string);
      res.json(zones);
    } catch (error) {
      console.error("Error fetching safety zones:", error);
      res.status(500).json({ message: "Failed to fetch safety zones" });
    }
  });

  // Get news updates
  app.get('/api/getNewsUpdates', async (req, res) => {
    try {
      const { state, limit } = req.query;
      const news = await storage.getNewsUpdates(
        state as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(news);
    } catch (error) {
      console.error("Error fetching news updates:", error);
      res.status(500).json({ message: "Failed to fetch news updates" });
    }
  });

  // Police dashboard routes
  app.get('/api/dashboard/tourists', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const tourists = await storage.getAllTourists();
      res.json(tourists);
    } catch (error) {
      console.error("Error fetching tourists:", error);
      res.status(500).json({ message: "Failed to fetch tourists" });
    }
  });

  app.get('/api/dashboard/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      const alerts = await storage.getPanicAlerts(status as string);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get('/api/dashboard/locations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const locations = await storage.getAllActiveTouristLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.put('/api/dashboard/alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      if (updateData.status === 'responded' || updateData.status === 'resolved') {
        updateData.respondedBy = req.user.claims.sub;
        if (updateData.status === 'resolved') {
          updateData.resolvedAt = new Date().toISOString();
        }
      }

      const alert = await storage.updatePanicAlert(id, updateData);
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(400).json({ message: "Failed to update alert" });
    }
  });

  // NewsAPI integration for fetching external news
  app.post('/api/fetchNews', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const newsApiKey = process.env.NEWS_API_KEY || process.env.NEWS_API_KEY_ENV_VAR || "default_key";
      const query = "Northeast India OR Assam OR Meghalaya OR Arunachal Pradesh OR Nagaland OR Manipur OR Mizoram OR Tripura OR Sikkim safety crime accident";
      
      const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}`);
      
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store relevant news in database
      for (const article of data.articles) {
        if (article.title && article.description) {
          await storage.createNewsUpdate({
            title: article.title,
            content: article.description,
            category: 'info',
            sourceUrl: article.url,
            publishedAt: new Date(article.publishedAt),
          });
        }
      }
      
      res.json({ message: "News fetched and stored successfully", count: data.articles.length });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Get police stations
  app.get('/api/policeStations', async (req, res) => {
    try {
      const { state } = req.query;
      const stations = await storage.getPoliceStations(state as string);
      res.json(stations);
    } catch (error) {
      console.error("Error fetching police stations:", error);
      res.status(500).json({ message: "Failed to fetch police stations" });
    }
  });

  // Get tourist's latest location
  app.get('/api/tourist/location/:touristId', isAuthenticated, async (req: any, res) => {
    try {
      const { touristId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify the tourist belongs to this user or user is police/admin
      const user = await storage.getUser(userId);
      const tourist = await storage.getTourist(touristId);
      
      if (!tourist) {
        return res.status(404).json({ message: "Tourist not found" });
      }
      
      if (tourist.userId !== userId && user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const location = await storage.getLatestTouristLocation(touristId);
      res.json(location);
    } catch (error) {
      console.error("Error fetching tourist location:", error);
      res.status(500).json({ message: "Failed to fetch tourist location" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates with authentication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (ws: AuthenticatedWebSocketClient, req) => {
    console.log('WebSocket connection attempted');
    
    // Extract session from request to authenticate WebSocket connection
    const sessionId = req.headers.cookie?.split(';')
      .find(cookie => cookie.trim().startsWith('connect.sid='))
      ?.split('=')[1]?.split('.')[0]?.replace('s:', '');
    
    if (!sessionId) {
      console.log('WebSocket connection rejected: No session');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Verify session exists and get user info
      const sessionData = await storage.getSessionData(sessionId);
      if (!sessionData || !sessionData.userId) {
        console.log('WebSocket connection rejected: Invalid session');
        ws.close(1008, 'Invalid session');
        return;
      }
      
      const user = await storage.getUser(sessionData.userId);
      if (!user) {
        console.log('WebSocket connection rejected: User not found');
        ws.close(1008, 'User not found');
        return;
      }
      
      // Authenticate WebSocket client
      ws.userId = user.id;
      ws.userRole = user.role || 'tourist';
      ws.isAuthenticated = true;
      
      console.log(`WebSocket authenticated: User ${user.id}, Role: ${ws.userRole}`);
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
      return;
    }
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message from authenticated user:', ws.userId, data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed for user:', ws.userId);
    });
  });

  // Store WebSocket server for broadcasting
  (global as any).wss = wss;

  return httpServer;
}

function broadcastLocationUpdate(location: any, tourist: any) {
  const wss = (global as any).wss;
  if (!wss) return;

  // Only send location updates to police/admin users for privacy
  const policeMessage = JSON.stringify({
    type: 'locationUpdate',
    data: { 
      location, 
      tourist: {
        id: tourist.id,
        fullName: tourist.fullName,
        digitalId: tourist.digitalId
      }
    }
  });

  wss.clients.forEach((client: AuthenticatedWebSocketClient) => {
    if (client.readyState === WebSocket.OPEN && 
        client.isAuthenticated && 
        (client.userRole === 'police' || client.userRole === 'admin')) {
      client.send(policeMessage);
    }
  });
}

function broadcastEmergencyAlert(alert: any, tourist: any, policeStation: any) {
  const wss = (global as any).wss;
  if (!wss) {
    console.error('WebSocket server not available for emergency broadcast');
    return;
  }

  // Sanitized emergency data for general broadcast (no PII)
  const publicEmergencyData = {
    type: 'emergencyAlert',
    timestamp: new Date().toISOString(),
    priority: 'critical',
    data: { 
      alert: {
        id: alert.id,
        // Approximate coordinates (reduced precision for privacy)
        latitude: (Math.floor(parseFloat(alert.latitude) * 100) / 100).toString(),
        longitude: (Math.floor(parseFloat(alert.longitude) * 100) / 100).toString(),
        address: alert.address,
        priority: alert.priority,
        status: alert.status,
        createdAt: alert.createdAt
      },
      // No tourist PII in public broadcast
      emergency: {
        type: 'panic_alert',
        area: alert.address?.split(',')[0] || 'Unknown location'
      }
    }
  };

  // Full emergency data for police/admin users (includes PII)
  const policeEmergencyData = {
    type: 'emergencyAlert',
    timestamp: new Date().toISOString(),
    priority: 'critical',
    data: { 
      alert: {
        id: alert.id,
        latitude: alert.latitude,
        longitude: alert.longitude,
        address: alert.address,
        priority: alert.priority,
        status: alert.status,
        createdAt: alert.createdAt
      }, 
      tourist: {
        id: tourist.id,
        fullName: tourist.fullName,
        digitalId: tourist.digitalId,
        phone: tourist.phone,
        emergencyContact: tourist.emergencyContact
      }, 
      policeStation: policeStation ? {
        id: policeStation.id,
        name: policeStation.name,
        contactNumber: policeStation.contactNumber,
        address: policeStation.address,
        latitude: policeStation.latitude,
        longitude: policeStation.longitude
      } : null
    }
  };

  const publicMessage = JSON.stringify(publicEmergencyData);
  const policeMessage = JSON.stringify(policeEmergencyData);
  let publicBroadcastCount = 0;
  let policeBroadcastCount = 0;
  let failureCount = 0;

  wss.clients.forEach((client: AuthenticatedWebSocketClient) => {
    if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
      try {
        if (client.userRole === 'police' || client.userRole === 'admin') {
          // Send full data to police/admin
          client.send(policeMessage);
          policeBroadcastCount++;
        } else {
          // Send sanitized data to regular users
          client.send(publicMessage);
          publicBroadcastCount++;
        }
      } catch (error) {
        console.error('Failed to send emergency alert to client:', error);
        failureCount++;
      }
    }
  });

  console.log(`Emergency alert broadcast - ID: ${alert.id}, Police/Admin: ${policeBroadcastCount}, Public: ${publicBroadcastCount}, Failures: ${failureCount}`);
  
  // Also log the emergency for audit purposes
  console.log(`🚨 EMERGENCY ALERT: Tourist ${tourist.fullName} (${tourist.digitalId}) at ${alert.address} - Alert ID: ${alert.id}`);
}
