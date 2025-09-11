import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/MobileHeader";
import DigitalIDCard from "@/components/DigitalIDCard";
import SafetyMap from "@/components/SafetyMap";
import PanicButton from "@/components/PanicButton";
import NewsUpdates from "@/components/NewsUpdates";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Ambulance } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: userProfile, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

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
          safetyScore={92}
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

          {/* Current Location */}
          <Card className="shadow-sm" data-testid="card-current-location">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Current Location</CardTitle>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Safe Zone</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MapPin className="text-white h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Guwahati, Assam</div>
                  <div className="text-xs text-muted-foreground">Near Kamakhya Temple, Tourist Zone</div>
                  <div className="text-xs text-green-600 mt-1">Last updated: 2 mins ago</div>
                </div>
              </div>
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
