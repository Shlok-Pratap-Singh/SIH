import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import chroma from 'chroma-js';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, AlertTriangle, Shield } from 'lucide-react';
import type { SafetyZone, TouristLocation } from '@shared/schema';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create a color scale for safety scores (0-100)
// Green (safest) → Yellow → Orange → Red → Dark Red (highest risk)
const safetyColorScale = chroma.scale(['#10B981', '#F59E0B', '#F97316', '#EF4444', '#991B1B'])
  .mode('lch')
  .domain([0, 25, 50, 75, 100]);

// Get color based on safety score
const getSafetyColor = (score: number): string => {
  return safetyColorScale(Math.max(0, Math.min(100, score))).hex();
};

// Create marker icon with dynamic color based on score
const createScoreBasedIcon = (score: number, icon: string) => {
  const color = getSafetyColor(score);
  const textColor = chroma(color).luminance() > 0.5 ? '#000000' : '#FFFFFF';
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: ${textColor};
      font-weight: bold;
    ">${icon}</div>`,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Create zone area icon for polygon centers
const createZoneIcon = (score: number, size: 'small' | 'medium' | 'large' = 'medium') => {
  const color = getSafetyColor(score);
  const sizes = { small: 16, medium: 20, large: 28 };
  const iconSize = sizes[size];
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${iconSize}px;
      height: ${iconSize}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.floor(iconSize * 0.4)}px;
      color: white;
      font-weight: bold;
    ">${Math.round(score)}</div>`,
    className: 'custom-div-icon',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize/2, iconSize/2]
  });
};

interface InteractiveMapProps {
  preview?: boolean;
  selectedState?: string;
  height?: string;
}

// Northeast India center coordinates (Guwahati area)
const NE_CENTER: [number, number] = [26.1445, 91.7362];
const DEFAULT_ZOOM = 7;
const PREVIEW_ZOOM = 6;

export default function InteractiveMap({ 
  preview = false, 
  selectedState, 
  height = "h-96" 
}: InteractiveMapProps) {
  const mapHeight = preview ? "h-48" : height;

  // Fetch safety zones with enhanced scoring
  const { data: safetyZones = [], isLoading: zonesLoading } = useQuery<any[]>({
    queryKey: selectedState ? [`/api/getSafetyZones?state=${selectedState}`] : ['/api/getSafetyZones'],
    retry: false,
  });

  // Fetch tourist locations for police dashboard
  const { data: touristLocations = [] } = useQuery<(TouristLocation & { tourist: any })[]>({
    queryKey: ['/api/dashboard/locations'],
    retry: false,
    enabled: !preview, // Only fetch for full map view
  });

  if (zonesLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className={preview ? "pb-3" : undefined}>
          <CardTitle className={preview ? "text-base" : "text-lg"}>
            {preview ? "Area Safety Overview" : "Northeast India Safety Map"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`w-full ${mapHeight} bg-gradient-to-b from-green-100 to-green-200 rounded-lg flex items-center justify-center`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className={preview ? "pb-3" : undefined}>
        <CardTitle className={preview ? "text-base flex items-center gap-2" : "text-lg flex items-center gap-2"}>
          <MapPin className="h-4 w-4" />
          {preview ? "Area Safety Overview" : "Northeast India Safety Map"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`w-full ${mapHeight} rounded-lg overflow-hidden border border-border`}>
          <MapContainer
            center={NE_CENTER}
            zoom={preview ? PREVIEW_ZOOM : DEFAULT_ZOOM}
            scrollWheelZoom={!preview}
            touchZoom={true}
            doubleClickZoom={true}
            dragging={!preview}
            zoomControl={!preview}
            style={{ height: '100%', width: '100%' }}
            data-testid="interactive-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            
            {/* Safety Zones Markers with Computed Scores */}
            {safetyZones.map((zone: any) => {
              // Use computed score if available, otherwise fall back to risk level
              const safetyScore = zone.computedScore || zone.riskLevel || 50;
              const confidence = zone.confidence || 0.5;
              const scoreCategory = zone.category || 'moderate';
              
              // For now, create a single point from the zone coordinates
              const coords = zone.coordinates as any;
              if (coords?.center) {
                return (
                  <Marker
                    key={zone.id}
                    position={[coords.center.lat, coords.center.lng]}
                    icon={createZoneIcon(safetyScore, 'large')}
                  >
                    <Popup>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          {zone.name}
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getSafetyColor(safetyScore) }}
                          />
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">{zone.state}</p>
                        
                        {/* Safety Score Display */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Safety Score:</span>
                            <span className="font-bold" style={{ color: getSafetyColor(safetyScore) }}>
                              {Math.round(safetyScore)}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="h-2 rounded-full transition-all" 
                              style={{ 
                                width: `${safetyScore}%`,
                                backgroundColor: getSafetyColor(safetyScore)
                              }}
                            />
                          </div>
                        </div>

                        {/* Category and Confidence */}
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            scoreCategory === 'safe' ? 'bg-green-100 text-green-800' :
                            scoreCategory === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {scoreCategory.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(confidence * 100)}% confidence
                          </span>
                        </div>
                        
                        {zone.description && (
                          <p className="text-xs mt-2 text-gray-600">{zone.description}</p>
                        )}
                        
                        {/* Score Factors */}
                        {zone.scoreFactors && (
                          <div className="mt-2 text-xs">
                            <p className="font-medium">Risk Factors:</p>
                            <div className="grid grid-cols-2 gap-1 mt-1">
                              <span>Incidents: {Math.round(zone.scoreFactors.incidents * 100)}%</span>
                              <span>News: {Math.round(zone.scoreFactors.news * 100)}%</span>
                              <span>Police: {Math.round(zone.scoreFactors.policeProximity * 100)}%</span>
                              <span>Density: {Math.round(zone.scoreFactors.density * 100)}%</span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs mt-2 text-gray-400">
                          Updated: {zone.lastUpdated ? new Date(zone.lastUpdated).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}

            {/* Tourist Location Markers with Dynamic Colors */}
            {touristLocations.map((location) => {
              const touristScore = location.safetyScore || 50;
              return (
                <Marker
                  key={location.id}
                  position={[parseFloat(location.latitude), parseFloat(location.longitude)]}
                  icon={createScoreBasedIcon(touristScore, '👤')}
                >
                  <Popup>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {location.tourist?.fullName || 'Tourist'}
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getSafetyColor(touristScore) }}
                        />
                      </h3>
                      {location.address && (
                        <p className="text-xs text-muted-foreground mt-1">{location.address}</p>
                      )}
                      
                      {/* Safety Score Display */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Current Safety Score:</span>
                          <span className="font-bold" style={{ color: getSafetyColor(touristScore) }}>
                            {touristScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${touristScore}%`,
                              backgroundColor: getSafetyColor(touristScore)
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          location.safetyZone === 'safe' ? 'bg-green-100 text-green-800' :
                          location.safetyZone === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {location.safetyZone.toUpperCase()} ZONE
                        </span>
                      </div>
                      
                      {location.timestamp && (
                        <p className="text-xs text-gray-500 mt-2">
                          Updated: {new Date(location.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {!preview && (
          <div className="mt-4 space-y-4">
            {/* Gradient Color Scale Legend */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Safety Score Scale
              </h4>
              <div className="relative">
                {/* Gradient Bar */}
                <div 
                  className="w-full h-4 rounded-lg" 
                  style={{
                    background: `linear-gradient(to right, ${[0, 25, 50, 75, 100].map(score => getSafetyColor(score)).join(', ')})`
                  }}
                />
                {/* Scale Labels */}
                <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                  <span>0 (Safest)</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100 (Highest Risk)</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Colors automatically update based on real-time safety analysis including incidents, news, police proximity, and tourist density.
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Zone Stats
                </h4>
                <div className="space-y-1 text-xs">
                  <div>Total Zones: {safetyZones.length}</div>
                  <div>Safe (0-25): {safetyZones.filter((z: any) => (z.computedScore || z.riskLevel || 50) <= 25).length}</div>
                  <div>Moderate (26-50): {safetyZones.filter((z: any) => {
                    const score = z.computedScore || z.riskLevel || 50;
                    return score > 25 && score <= 50;
                  }).length}</div>
                  <div>High Risk (51+): {safetyZones.filter((z: any) => (z.computedScore || z.riskLevel || 50) > 50).length}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Tourist Stats
                </h4>
                <div className="space-y-1 text-xs">
                  <div>Active Tourists: {touristLocations.length}</div>
                  <div>In Safe Zones: {touristLocations.filter(l => l.safetyZone === 'safe').length}</div>
                  <div>In Moderate Risk: {touristLocations.filter(l => l.safetyZone === 'moderate').length}</div>
                  <div>In High Risk: {touristLocations.filter(l => l.safetyZone === 'unsafe').length}</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-center text-muted-foreground pt-2 border-t">
              🔄 Scores update every 5 minutes | 📍 Click markers for detailed analysis
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}