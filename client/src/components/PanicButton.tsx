import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Loader } from "lucide-react";
import type { Tourist } from "@shared/schema";

interface PanicButtonProps {
  tourist: Tourist;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    safetyZone?: string;
    safetyScore?: number;
    accuracy?: number;
  };
}

export default function PanicButton({ tourist, currentLocation }: PanicButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPressed, setIsPressed] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);

  const panicMutation = useMutation({
    mutationFn: async () => {
      // Use current tracking location if available, otherwise attempt to get location
      let locationData = currentLocation;
      
      if (!locationData) {
        // Try to get current position if tracking is not active
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 10000
            });
          });
          
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (Emergency Location)`
          };
        } catch (error) {
          throw new Error("Unable to determine your location. Please enable location services and try again.");
        }
      }

      const response = await apiRequest("POST", "/api/panicAlert", {
        latitude: locationData.latitude.toString(),
        longitude: locationData.longitude.toString(),
        address: locationData.address || `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`,
        priority: "critical",
        safetyZone: locationData.safetyZone,
        safetyScore: locationData.safetyScore?.toString(),
      });
      
      return await response.json();
    },
    onSuccess: (response) => {
      setIsPressed(true);
      setAlertId(response?.id || null);
      
      toast({
        title: "🚨 Emergency Alert Sent",
        description: "Authorities have been notified. Help is on the way. Stay calm and safe.",
        duration: 10000,
      });
      
      // Invalidate dashboard queries to show the new alert
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/locations"] });
      
      // Reset button after 30 seconds
      setTimeout(() => {
        setIsPressed(false);
        setAlertId(null);
      }, 30000);
    },
    onError: (error) => {
      console.error('Panic alert failed:', error);
      
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to send emergency alerts. Redirecting...",
          variant: "destructive",
          duration: 5000,
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "🚨 Emergency Alert Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
    },
  });

  const handlePanicPress = () => {
    // Double confirmation for emergency button
    if (!isPressed && !panicMutation.isPending) {
      const shouldSend = window.confirm(
        "⚠️ EMERGENCY ALERT\n\nThis will immediately notify police and emergency services of your location.\n\nPress OK to send alert, or Cancel to abort."
      );
      
      if (shouldSend) {
        panicMutation.mutate();
      }
    }
  };

  return (
    <Button 
      className={`w-full rounded-2xl p-4 shadow-lg transition-all active:scale-95 h-auto ${
        isPressed 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-destructive hover:bg-red-600 text-destructive-foreground'
      }`}
      onClick={handlePanicPress}
      disabled={panicMutation.isPending || isPressed}
    >
      <div className="flex items-center justify-center space-x-3">
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          {panicMutation.isPending ? (
            <Loader className="text-2xl animate-spin" />
          ) : isPressed ? (
            <Check className="text-2xl" />
          ) : (
            <AlertTriangle className="text-2xl" />
          )}
        </div>
        <div className="text-left">
          <div className="font-bold text-lg">
            {panicMutation.isPending ? 'SENDING...' : isPressed ? 'ALERT SENT ✓' : '🚨 EMERGENCY'}
          </div>
          <div className="text-sm opacity-90">
            {panicMutation.isPending 
              ? 'Notifying authorities...' 
              : isPressed 
                ? alertId ? `Alert #${alertId.slice(-6)} • Help dispatched` : 'Help is on the way'
                : currentLocation 
                  ? `Ready • Location: ${currentLocation.accuracy ? `±${Math.round(currentLocation.accuracy)}m` : 'Available'}` 
                  : 'Tap to send immediate alert'
            }
          </div>
        </div>
      </div>
    </Button>
  );
}
