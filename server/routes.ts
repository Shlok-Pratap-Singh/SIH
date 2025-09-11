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
      
      res.json(alert);
    } catch (error) {
      console.error("Error creating panic alert:", error);
      res.status(400).json({ message: "Failed to create panic alert" });
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
          updateData.resolvedAt = new Date();
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

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Store WebSocket server for broadcasting
  (global as any).wss = wss;

  return httpServer;
}

function broadcastLocationUpdate(location: any, tourist: any) {
  const wss = (global as any).wss;
  if (!wss) return;

  const message = JSON.stringify({
    type: 'locationUpdate',
    data: { location, tourist }
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastEmergencyAlert(alert: any, tourist: any, policeStation: any) {
  const wss = (global as any).wss;
  if (!wss) return;

  const message = JSON.stringify({
    type: 'emergencyAlert',
    data: { alert, tourist, policeStation }
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
