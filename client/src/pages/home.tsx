import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSafetyScore } from "@/hooks/useSafetyScore";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/MobileHeader";
import DigitalIDCard from "@/components/DigitalIDCard";
import SafetyMap from "@/components/SafetyMap";
import PanicButton from "@/components/PanicButton";
import NewsUpdates from "@/components/NewsUpdates";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Ambulance, Clock, Navigation, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: userProfile, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Location tracking functionality
  const {
    isTracking, 
    currentLocation, 
    startTracking, 
    stopTracking, 
    isUpdating,
    lastUpdateError
  } = useLocationTracking(userProfile?.tourist);

  // Get real-time safety score based on tracked location
  const { safetyScore, zoneType, reason, location, lastUpdated, isLocationAvailable } = useSafetyScore(
    userProfile?.tourist?.id,
    currentLocation || undefined
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is police/admin and redirect to dashboard
  if (userProfile?.user?.role === 'police' || userProfile?.user?.role === 'admin') {
    window.location.href = '/dashboard';
    return null;
  }

  // Check if tourist needs to complete registration
  if (!userProfile?.tourist) {
    window.location.href = '/register';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto bg-card shadow-2xl rounded-3xl overflow-hidden min-h-screen">
        
        {/* Mobile Header */}
        <MobileHeader 
          user={userProfile.user}
          safetyScore={safetyScore}
          data-testid="header-mobile"
        />

        {/* Digital ID Card */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-green-50 to-emerald-50">
          <DigitalIDCard 
            tourist={userProfile.tourist}
            data-testid="card-digital-id"
          />
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {/* Panic Button */}
            <div className="col-span-2">
              <PanicButton 
                tourist={userProfile.tourist}
                data-testid="button-panic"
              />
            </div>
            
            {/* Safety Map */}
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-3 h-auto flex flex-col"
              onClick={() => window.location.href = '/map'}
              data-testid="button-safety-map"
            >
              <MapPin className="text-xl mb-2" />
              <div className="text-sm font-medium">Safety Map</div>
            </Button>
            
            {/* News Updates */}
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-3 h-auto flex flex-col"
              data-testid="button-news"
            >
              <i className="fas fa-newspaper text-xl mb-2"></i>
              <div className="text-sm font-medium">News & Alerts</div>
            </Button>
          </div>

          {/* Location Tracking Status */}
          <Card className="shadow-sm" data-testid="card-location-tracking">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Navigation className="h-4 w-4" />
                  <span>Location Tracking</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isTracking ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isTracking ? stopTracking : startTracking}
                    disabled={isUpdating}
                    data-testid={isTracking ? "button-stop-tracking" : "button-start-tracking"}
                  >
                    {isTracking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentLocation.safetyZone === 'safe' ? 'bg-green-500' :
                      currentLocation.safetyZone === 'moderate' ? 'bg-yellow-500' :
                      currentLocation.safetyZone === 'forest' ? 'bg-green-700' :
                      currentLocation.safetyZone === 'restricted' ? 'bg-gray-500' :
                      'bg-red-500'
                    } ${isUpdating ? 'animate-pulse' : ''}`}>
                      <MapPin className="text-white h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        currentLocation.safetyZone === 'safe' ? 'bg-green-100 text-green-800' :
                        currentLocation.safetyZone === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        currentLocation.safetyZone === 'forest' ? 'bg-green-200 text-green-900' :
                        currentLocation.safetyZone === 'restricted' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentLocation.safetyZone.charAt(0).toUpperCase() + currentLocation.safetyZone.slice(1)} Zone • Score: {currentLocation.safetyScore}/100
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(currentLocation.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {currentLocation.accuracy && (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>±{Math.round(currentLocation.accuracy)}m</span>
                      </div>
                    )}
                  </div>
                  
                  {lastUpdateError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      Failed to sync location to server
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                    <MapPin className="text-white h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground">No location data</div>
                    <div className="text-xs text-muted-foreground">Start tracking to monitor your safety</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety Map Preview */}
          <SafetyMap preview={true} data-testid="map-safety-preview" />

          {/* Recent News */}
          <NewsUpdates limit={2} data-testid="news-updates" />

          {/* Emergency Contacts */}
          <Card className="shadow-sm" data-testid="card-emergency-contacts">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2 p-3 bg-red-50 hover:bg-red-100 border-red-200 h-auto"
                  data-testid="button-police"
                >
                  <Phone className="text-red-600 h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs font-medium text-red-900">Police</div>
                    <div className="text-xs text-red-700">100</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 border-blue-200 h-auto"
                  data-testid="button-medical"
                >
                  <Ambulance className="text-blue-600 h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs font-medium text-blue-900">Medical</div>
                    <div className="text-xs text-blue-700">108</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation currentPath="/" data-testid="nav-bottom" />
      </div>
    </div>
  );
}
