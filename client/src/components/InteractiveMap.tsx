import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
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

// Custom icons for different safety zones
const createCustomIcon = (color: string, icon: string) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
    ">${icon}</div>`,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const safetyIcons = {
  safe: createCustomIcon('#10B981', '✓'), // Green
  moderate: createCustomIcon('#F59E0B', '!'), // Yellow
  unsafe: createCustomIcon('#EF4444', '⚠'), // Red
  forest: createCustomIcon('#059669', '🌲'), // Dark Green
  restricted: createCustomIcon('#6B7280', '🚫') // Gray
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

  // Fetch safety zones
  const { data: safetyZones = [], isLoading: zonesLoading } = useQuery<SafetyZone[]>({
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
            
            {/* Safety Zones Markers */}
            {safetyZones.map((zone) => {
              // For now, create a single point from the zone coordinates
              // In a real app, you'd parse the GeoJSON polygon
              const coords = zone.coordinates as any;
              if (coords?.center) {
                return (
                  <Marker
                    key={zone.id}
                    position={[coords.center.lat, coords.center.lng]}
                    icon={safetyIcons[zone.zoneType as keyof typeof safetyIcons] || DefaultIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm">{zone.name}</h3>
                        <p className="text-xs text-muted-foreground">{zone.state}</p>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            zone.zoneType === 'safe' ? 'bg-green-100 text-green-800' :
                            zone.zoneType === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            zone.zoneType === 'unsafe' ? 'bg-red-100 text-red-800' :
                            zone.zoneType === 'forest' ? 'bg-green-100 text-green-900' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {zone.zoneType.toUpperCase()}
                          </span>
                        </div>
                        {zone.description && (
                          <p className="text-xs mt-2 text-gray-600">{zone.description}</p>
                        )}
                        <p className="text-xs mt-1">Risk Level: {zone.riskLevel}/100</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}

            {/* Tourist Location Markers */}
            {touristLocations.map((location) => (
              <Marker
                key={location.id}
                position={[parseFloat(location.latitude), parseFloat(location.longitude)]}
                icon={createCustomIcon(
                  location.safetyZone === 'safe' ? '#10B981' :
                  location.safetyZone === 'moderate' ? '#F59E0B' :
                  '#EF4444',
                  '👤'
                )}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {location.tourist?.fullName || 'Tourist'}
                    </h3>
                    {location.address && (
                      <p className="text-xs text-muted-foreground mt-1">{location.address}</p>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        location.safetyZone === 'safe' ? 'bg-green-100 text-green-800' :
                        location.safetyZone === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {location.safetyZone.toUpperCase()} ZONE
                      </span>
                    </div>
                    <p className="text-xs mt-1">Safety Score: {location.safetyScore}/100</p>
                    {location.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        Updated: {new Date(location.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {!preview && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Legend */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Safety Zones
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Safe Areas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Moderate Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-800 rounded-full"></div>
                  <span>Forest Areas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Restricted</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <Users className="h-3 w-3" />
                Live Stats
              </h4>
              <div className="space-y-1 text-xs">
                <div>Safety Zones: {safetyZones.length}</div>
                <div>Active Tourists: {touristLocations.length}</div>
                <div>Safe Areas: {safetyZones.filter(z => z.zoneType === 'safe').length}</div>
                <div>High Risk: {touristLocations.filter(l => l.safetyZone === 'unsafe').length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}