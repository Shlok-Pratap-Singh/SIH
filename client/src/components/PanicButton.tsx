import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

interface PanicButtonProps {
  tourist: any;
}

export default function PanicButton({ tourist }: PanicButtonProps) {
  const { toast } = useToast();
  const [isPressed, setIsPressed] = useState(false);
  const { location, error: locationError } = useLocation();

  const panicMutation = useMutation({
    mutationFn: async () => {
      if (!location) {
        throw new Error("Location not available");
      }

      return await apiRequest("POST", "/api/panicAlert", {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address: `${location.latitude}, ${location.longitude}`,
        priority: "critical",
      });
    },
    onSuccess: () => {
      setIsPressed(true);
      toast({
        title: "Emergency Alert Sent",
        description: "Help is on the way. Stay calm and safe.",
      });
      
      // Reset button after 5 seconds
      setTimeout(() => setIsPressed(false), 5000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Alert Failed",
        description: "Failed to send emergency alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePanicPress = () => {
    if (locationError) {
      toast({
        title: "Location Required",
        description: "Please enable location services to send panic alert.",
        variant: "destructive",
      });
      return;
    }

    panicMutation.mutate();
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
          {isPressed ? (
            <i className="fas fa-check text-2xl"></i>
          ) : (
            <AlertTriangle className="text-2xl" />
          )}
        </div>
        <div className="text-left">
          <div className="font-bold text-lg">
            {isPressed ? 'ALERT SENT' : 'EMERGENCY'}
          </div>
          <div className="text-sm opacity-90">
            {panicMutation.isPending 
              ? 'Sending...' 
              : isPressed 
                ? 'Help is coming' 
                : 'Tap for immediate help'
            }
          </div>
        </div>
      </div>
    </Button>
  );
}
