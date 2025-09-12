import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import InteractiveMap from "@/components/InteractiveMap";
import BottomNavigation from "@/components/BottomNavigation";

export default function Map() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto bg-card shadow-2xl rounded-3xl overflow-hidden min-h-screen">
        
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="text-primary-foreground hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Safety Map</h1>
              <p className="text-xs opacity-90">Northeast India</p>
            </div>
          </div>
        </div>

        {/* Full Map */}
        <div className="p-4">
          <InteractiveMap preview={false} height="h-96" data-testid="map-interactive-full" />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation currentPath="/map" data-testid="nav-bottom" />
      </div>
    </div>
  );
}
