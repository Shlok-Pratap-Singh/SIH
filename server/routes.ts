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

  // Enhanced NewsAPI integration for fetching Northeast India specific news
  app.post('/api/fetchNews', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'police' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const newsApiKey = process.env.NEWS_API_KEY;
      if (!newsApiKey) {
        return res.status(500).json({ message: "News API key not configured" });
      }

      const results = await fetchNortheastNews(newsApiKey, storage);
      
      res.json({ 
        message: "News fetched and stored successfully", 
        count: results.stored,
        duplicatesSkipped: results.skipped,
        errors: results.errors
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ 
        message: "Failed to fetch news", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Auto-refresh news endpoint (internal use only - require auth or internal header)
  app.post('/api/autoRefreshNews', async (req, res) => {
    try {
      // Check for internal request header or require authentication
      const internalHeader = req.headers['x-internal-request'];
      const isAuthenticated = req.user?.claims?.sub;
      
      if (!internalHeader && !isAuthenticated) {
        return res.status(401).json({ message: "Unauthorized - internal use only" });
      }
      
      // If authenticated user, check role
      if (isAuthenticated) {
        const user = await storage.getUser(req.user.claims.sub);
        if (user?.role !== 'admin') {
          return res.status(403).json({ message: "Access denied - admin only" });
        }
      }

      const newsApiKey = process.env.NEWS_API_KEY;
      if (!newsApiKey) {
        return res.status(500).json({ message: "News API key not configured" });
      }

      const results = await fetchNortheastNews(newsApiKey, storage);
      
      console.log(`Auto-refresh news: ${results.stored} new articles stored, ${results.skipped} skipped`);
      res.json({ success: true, ...results });
    } catch (error) {
      console.error("Auto-refresh news error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
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

// Enhanced news fetching function for Northeast India
async function fetchNortheastNews(apiKey: string, storage: any) {
  const results = { stored: 0, skipped: 0, errors: 0 };
  
  // Get existing articles once for efficient duplicate detection
  const existingNews = await storage.getNewsUpdates();
  const existingTitles = new Set(existingNews.map((news: any) => news.title));
  const existingUrls = new Set(existingNews.map((news: any) => news.sourceUrl).filter(Boolean));
  
  // Multiple search queries for comprehensive coverage
  const searchQueries = [
    'Northeast India tourism safety',
    'Assam Meghalaya travel advisory',
    'Arunachal Pradesh Nagaland security',
    'Manipur Mizoram Tripura news',
    'Sikkim Northeast weather alert',
    'India Northeast border tourism',
  ];

  // State-specific keywords for categorization
  const stateKeywords = {
    'Assam': ['Assam', 'Guwahati', 'Dispur', 'Brahmaputra'],
    'Meghalaya': ['Meghalaya', 'Shillong', 'Cherrapunji', 'Khasi'],
    'Arunachal Pradesh': ['Arunachal', 'Itanagar', 'Tawang'],
    'Nagaland': ['Nagaland', 'Kohima', 'Dimapur', 'Naga'],
    'Manipur': ['Manipur', 'Imphal', 'Loktak'],
    'Mizoram': ['Mizoram', 'Aizawl', 'Mizo'],
    'Tripura': ['Tripura', 'Agartala', 'Ujjayanta'],
    'Sikkim': ['Sikkim', 'Gangtok', 'Nathu La']
  };

  // Safety keywords for categorization
  const safetyKeywords = {
    'emergency': ['emergency', 'disaster', 'earthquake', 'flood', 'landslide', 'cyclone'],
    'alert': ['alert', 'warning', 'advisory', 'caution', 'danger', 'risk'],
    'safety': ['safety', 'security', 'patrol', 'checkpoint', 'safe', 'protection'],
    'info': ['tourism', 'festival', 'culture', 'travel', 'visit', 'attraction']
  };

  try {
    // Fetch from multiple queries to get comprehensive coverage
    for (const query of searchQueries) {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=50&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&apiKey=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn(`NewsAPI error for query "${query}": ${response.status}`);
          results.errors++;
          continue;
        }
        
        const data = await response.json();
        
        if (data.articles && Array.isArray(data.articles)) {
          for (const article of data.articles) {
            try {
              if (article.title && article.description && article.publishedAt) {
                // Efficient duplicate detection using Sets
                const isDuplicate = existingTitles.has(article.title) || 
                                   (article.url && existingUrls.has(article.url));
                
                if (isDuplicate) {
                  results.skipped++;
                  continue;
                }

                // Determine state based on content
                let detectedState = null;
                const articleText = `${article.title} ${article.description}`.toLowerCase();
                
                for (const [state, keywords] of Object.entries(stateKeywords)) {
                  if (keywords.some(keyword => articleText.includes(keyword.toLowerCase()))) {
                    detectedState = state;
                    break;
                  }
                }

                // Determine category based on content
                let category = 'info';
                let priority = 'medium';
                
                for (const [cat, keywords] of Object.entries(safetyKeywords)) {
                  if (keywords.some(keyword => articleText.includes(keyword.toLowerCase()))) {
                    category = cat;
                    if (cat === 'emergency') priority = 'high';
                    else if (cat === 'alert') priority = 'high';
                    else if (cat === 'safety') priority = 'medium';
                    break;
                  }
                }

                // Create news update
                const newsItem = {
                  title: article.title.substring(0, 255), // Ensure title fits
                  content: article.description,
                  category,
                  state: detectedState,
                  priority,
                  sourceUrl: article.url,
                  publishedAt: new Date(article.publishedAt),
                };
                
                await storage.createNewsUpdate(newsItem);
                
                // Add to existing sets to prevent duplicates within this batch
                existingTitles.add(newsItem.title);
                if (newsItem.sourceUrl) {
                  existingUrls.add(newsItem.sourceUrl);
                }
                
                results.stored++;
              }
            } catch (articleError) {
              console.error('Error processing article:', articleError);
              results.errors++;
            }
          }
        }
        
        // Rate limiting to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (queryError) {
        console.error(`Error fetching news for query "${query}":`, queryError);
        results.errors++;
      }
    }
    
    // Cleanup old news (keep only last 30 days) - proper deletion
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Delete old news instead of just marking as inactive
      const deletedCount = await storage.deleteOldNewsUpdates(thirtyDaysAgo);
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old news articles`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up old news:', cleanupError);
    }
    
  } catch (error) {
    console.error('Critical error in fetchNortheastNews:', error);
    results.errors++;
  }

  return results;
}

// Global variables to track automation
let newsAutomationStarted = false;
let autoRefreshInterval: NodeJS.Timeout | null = null;

// Function to start news automation
function startNewsAutomation() {
  if (newsAutomationStarted) {
    console.log('News automation already started');
    return;
  }
  
  const newsApiKey = process.env.NEWS_API_KEY;
  if (!newsApiKey) {
    console.warn('⚠️ NEWS_API_KEY not configured - news automation disabled');
    return;
  }
  
  console.log('🚀 Starting news automation system...');
  newsAutomationStarted = true;
  
  // Initial news fetch
  setTimeout(async () => {
    try {
      console.log('📰 Fetching initial news data...');
      const results = await fetchNortheastNews(newsApiKey, storage);
      console.log(`✅ Initial news fetch completed: ${results.stored} new, ${results.skipped} skipped, ${results.errors} errors`);
    } catch (error) {
      console.error('❌ Initial news fetch failed:', error);
    }
  }, 10000); // 10 seconds after startup
  
  // Auto-refresh news every 6 hours
  autoRefreshInterval = setInterval(async () => {
    try {
      console.log('🔄 Starting scheduled news refresh...');
      const results = await fetchNortheastNews(newsApiKey, storage);
      console.log(`✅ Auto-refresh news completed: ${results.stored} new, ${results.skipped} skipped, ${results.errors} errors`);
    } catch (error) {
      console.error('❌ Auto-refresh news failed:', error);
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours
  
  console.log('✅ News automation scheduled successfully');
}

// Function to stop news automation
function stopNewsAutomation() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  newsAutomationStarted = false;
  console.log('🛑 News automation stopped');
}

// Export for external control
export { startNewsAutomation, stopNewsAutomation };

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
