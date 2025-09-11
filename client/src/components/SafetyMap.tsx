import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, AlertTriangle } from 'lucide-react';
import type { SafetyZone, TouristLocation } from '@shared/schema';

interface SafetyMapProps {
  preview?: boolean;
  selectedState?: string;
}

// Zone type colors mapping
const ZONE_COLORS = {
  safe: 'bg-green-500',
  moderate: 'bg-yellow-500', 
  unsafe: 'bg-red-500',
  forest: 'bg-green-800',
  restricted: 'bg-gray-500'
};

// Northeast India boundaries for visualization
const NE_BOUNDS = {
  north: 29.0,
  south: 23.0,
  east: 97.0,
  west: 88.0
};

// Convert coordinates to relative position on map
function coordsToPosition(lat: number, lng: number) {
  const x = ((lng - NE_BOUNDS.west) / (NE_BOUNDS.east - NE_BOUNDS.west)) * 100;
  const y = ((NE_BOUNDS.north - lat) / (NE_BOUNDS.north - NE_BOUNDS.south)) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

export default function SafetyMap({ preview = false, selectedState }: SafetyMapProps) {
  const height = preview ? "h-48" : "h-96";

  // Fetch safety zones
  const { data: safetyZones = [], isLoading: zonesLoading, error: zonesError } = useQuery<SafetyZone[]>({
    queryKey: selectedState ? [`/api/getSafetyZones?state=${selectedState}`] : ['/api/getSafetyZones'],
    retry: false,
  });

  // Fetch tourist locations for police dashboard
  const { data: touristLocations = [], error: locationsError } = useQuery<(TouristLocation & { tourist: any })[]>({
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
          <div className={`w-full ${height} bg-gradient-to-b from-green-100 to-green-200 rounded-lg flex items-center justify-center`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className={preview ? "pb-3" : undefined}>
        <CardTitle className={preview ? "text-base" : "text-lg"}>
          {preview ? "Area Safety Overview" : "Northeast India Safety Map"}
          {selectedState && <span className="text-sm font-normal ml-2">- {selectedState}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Map with real safety zones */}
          <div className={`w-full ${height} bg-gradient-to-b from-green-100 to-green-200 rounded-lg relative overflow-hidden border border-border`}>
            
            {/* Render safety zones based on database data */}
            {safetyZones.map((zone, index) => {
              try {
                const coords = typeof zone.coordinates === 'string' 
                  ? JSON.parse(zone.coordinates) 
                  : zone.coordinates;
                
                if (coords?.coordinates?.[0]?.[0]) {
                  const [lng, lat] = coords.coordinates[0][0];
                  const position = coordsToPosition(lat, lng);
                  
                  // Size based on risk level and zone type
                  const size = zone.zoneType === 'restricted' ? 'w-20 h-12' : 
                              zone.zoneType === 'forest' ? 'w-16 h-16' :
                              zone.riskLevel && zone.riskLevel > 50 ? 'w-16 h-10' : 'w-12 h-12';
                  
                  return (
                    <div
                      key={zone.id}
                      className={`absolute ${ZONE_COLORS[zone.zoneType as keyof typeof ZONE_COLORS]} 
                        ${zone.zoneType === 'restricted' ? 'rounded-lg' : 'rounded-full'} 
                        opacity-75 ${size} cursor-pointer hover:opacity-90 transition-opacity
                        flex items-center justify-center text-xs text-white font-medium`}
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      title={`${zone.name} (${zone.state}) - ${zone.zoneType} zone - Risk: ${zone.riskLevel || 0}%`}
                      data-testid={`zone-${zone.zoneType}-${index}`}
                    >
                      {zone.zoneType === 'restricted' && <AlertTriangle className="w-3 h-3" />}
                      {zone.zoneType === 'forest' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  );
                }
              } catch (error) {
                console.error('Error parsing zone coordinates:', error);
              }
              return null;
            })}
            
            {/* Render tourist locations if available */}
            {touristLocations.slice(0, 10).map((location, index) => {
              const position = coordsToPosition(
                parseFloat(location.latitude), 
                parseFloat(location.longitude)
              );
              
              return (
                <div
                  key={location.id}
                  className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-lg 
                    ${location.safetyZone === 'safe' ? 'bg-blue-500' :
                      location.safetyZone === 'moderate' ? 'bg-yellow-600' : 'bg-red-600 animate-pulse'}
                  `}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  title={`Tourist: ${location.tourist?.fullName || 'Unknown'} - ${location.safetyZone} zone`}
                  data-testid={`tourist-location-${index}`}
                >
                  <Users className="w-2 h-2 text-white" />
                </div>
              );
            })}
            
            {/* Current user location indicator (if available) */}
            <div className="absolute top-12 left-20 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"
                 title="Your current location"
                 data-testid="current-location-marker">
              <MapPin className="w-2 h-2 text-white ml-0.5 mt-0.5" />
            </div>
            
            {/* State labels for context */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 text-xs font-medium text-green-800 bg-white bg-opacity-75 px-2 py-1 rounded">
                Assam
              </div>
              <div className="absolute top-8 right-8 text-xs font-medium text-green-800 bg-white bg-opacity-75 px-2 py-1 rounded">
                Arunachal Pradesh
              </div>
              <div className="absolute bottom-8 left-8 text-xs font-medium text-green-800 bg-white bg-opacity-75 px-2 py-1 rounded">
                Meghalaya
              </div>
              {!preview && (
                <>
                  <div className="absolute top-1/3 right-4 text-xs font-medium text-green-800 bg-white bg-opacity-75 px-2 py-1 rounded">
                    Nagaland
                  </div>
                  <div className="absolute bottom-4 right-4 text-xs font-medium text-green-800 bg-white bg-opacity-75 px-2 py-1 rounded">
                    Manipur
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center mt-3 space-x-3 text-xs flex-wrap gap-1">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Safe</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Unsafe</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-800 rounded-full"></div>
              <span>Forest</span>
            </div>
            {!preview && (
              <>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Restricted</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>Tourists</span>
                </div>
              </>
            )}
          </div>
          
          {/* Error states */}
          {(zonesError || locationsError) && (
            <div className="mt-2 text-xs text-red-600 text-center">
              {zonesError && "Error loading safety zones"}
              {locationsError && "Error loading tourist locations"}
            </div>
          )}
          
          {/* Zone statistics */}
          {!preview && safetyZones.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Total Zones</div>
                <div className="text-primary font-bold">{safetyZones.length}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Active Tourists</div>
                <div className="text-blue-600 font-bold">{touristLocations.length}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
