import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getSafetyZone, adjustSafetyScoreForTime } from '@/lib/safetyZones';
import type { Tourist } from '@shared/schema';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  address?: string;
  safetyZone: 'safe' | 'moderate' | 'unsafe' | 'forest' | 'restricted';
  safetyScore: number;
}

export function useLocationTracking(tourist?: Tourist) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to update location on server
  const updateLocationMutation = useMutation({
    mutationFn: async (location: Omit<LocationData, 'timestamp'>) => {
      return apiRequest('/api/updateLocation', {
        method: 'POST',
        body: {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          address: location.address,
          safetyZone: location.safetyZone,
          safetyScore: location.safetyScore,
        },
      });
    },
    onSuccess: () => {
      // Invalidate location-related queries with proper cache keys
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/locations'] });
      if (tourist?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/tourist/location', tourist.id] });
      }
    },
    onError: (error) => {
      console.error('Failed to update location:', error);
      toast({
        title: "Location Update Failed",
        description: "Your location could not be updated. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // Using a simple reverse geocoding approach based on nearest cities
      // In production, you'd use a proper geocoding API like Google Maps or MapBox
      const cities = {
        'Guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
        'Shillong': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
        'Itanagar': { lat: 27.0844, lng: 93.6053, state: 'Arunachal Pradesh' },
        'Kohima': { lat: 25.6751, lng: 94.1086, state: 'Nagaland' },
        'Imphal': { lat: 24.8170, lng: 93.9368, state: 'Manipur' },
        'Aizawl': { lat: 23.7307, lng: 92.7173, state: 'Mizoram' },
        'Agartala': { lat: 23.8315, lng: 91.2868, state: 'Tripura' },
        'Gangtok': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
      };

      let nearestCity = 'Unknown Location';
      let minDistance = Infinity;

      for (const [cityName, cityData] of Object.entries(cities)) {
        const distance = Math.sqrt(
          Math.pow(lat - cityData.lat, 2) + Math.pow(lng - cityData.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = `${cityName}, ${cityData.state}`;
        }
      }

      return minDistance < 0.5 ? nearestCity : `${lat.toFixed(4)}, ${lng.toFixed(4)} (Northeast India)`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  // Process new location
  const processLocation = useCallback(async (position: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      
      // Calculate safety zone and score
      const zoneData = getSafetyZone(latitude, longitude);
      const currentHour = new Date().getHours();
      const adjustedScore = adjustSafetyScoreForTime(zoneData.score, currentHour);
      
      // Get address
      const address = await reverseGeocode(latitude, longitude);
      
      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy: accuracy || undefined,
        heading: heading || undefined,
        speed: speed || undefined,
        timestamp: position.timestamp,
        address,
        safetyZone: zoneData.zoneType,
        safetyScore: Math.max(0, Math.min(100, adjustedScore)),
      };

      setCurrentLocation(locationData);
      setLocationHistory(prev => {
        const updated = [locationData, ...prev].slice(0, 100); // Keep last 100 locations
        return updated;
      });

      // Update server (throttled to avoid too many requests)
      const lastUpdate = locationHistory[0];
      if (!lastUpdate || 
          position.timestamp - lastUpdate.timestamp > 30000 || // 30 seconds minimum
          Math.abs(latitude - lastUpdate.latitude) > 0.001 || // Significant movement
          Math.abs(longitude - lastUpdate.longitude) > 0.001) {
        
        updateLocationMutation.mutate(locationData);
      }

      // Check for safety zone changes and alert user
      if (lastUpdate && lastUpdate.safetyZone !== locationData.safetyZone) {
        const zoneColors = {
          safe: 'green',
          moderate: 'yellow',
          unsafe: 'red',
          forest: 'green',
          restricted: 'red'
        };
        
        toast({
          title: `Zone Change: ${locationData.safetyZone.toUpperCase()}`,
          description: `You've entered a ${locationData.safetyZone} zone. ${zoneData.reason}`,
          variant: locationData.safetyZone === 'safe' ? 'default' : 'destructive',
        });
      }

    } catch (error) {
      console.error('Error processing location:', error);
      toast({
        title: "Location Processing Error",
        description: "There was an error processing your location data.",
        variant: "destructive",
      });
    }
  }, [reverseGeocode, updateLocationMutation, locationHistory, toast]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your device does not support location tracking.",
        variant: "destructive",
      });
      return false;
    }

    if (!tourist) {
      toast({
        title: "Tourist Profile Required",
        description: "Please complete your registration to enable location tracking.",
        variant: "destructive",
      });
      return false;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // Cache position for 30 seconds
    };

    const onError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      let message = "Unknown location error occurred.";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location access denied. Please enable location permissions.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
          break;
      }
      
      toast({
        title: "Location Error",
        description: message,
        variant: "destructive",
      });
      
      setIsTracking(false);
      setWatchId(null);
    };

    try {
      const id = navigator.geolocation.watchPosition(
        processLocation,
        onError,
        options
      );
      
      setWatchId(id);
      setIsTracking(true);
      
      toast({
        title: "Location Tracking Started",
        description: "Your location is now being tracked for safety monitoring.",
      });
      
      // Clear disabled flag when user manually starts
      localStorage.removeItem('location-tracking-disabled');
      
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }, [tourist, processLocation, toast]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsTracking(false);
    
    // Remember user's preference to disable tracking
    localStorage.setItem('location-tracking-disabled', 'true');
    
    toast({
      title: "Location Tracking Stopped",
      description: "Location tracking has been disabled.",
    });
  }, [watchId, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Auto-start tracking for registered tourists (only if not previously disabled)
  useEffect(() => {
    const trackingDisabled = localStorage.getItem('location-tracking-disabled');
    
    if (tourist && !isTracking && watchId === null && !trackingDisabled) {
      // Auto-start tracking with a slight delay to allow UI to settle
      const timer = setTimeout(() => {
        startTracking();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [tourist, isTracking, watchId, startTracking]);

  return {
    isTracking,
    currentLocation,
    locationHistory,
    startTracking,
    stopTracking,
    isUpdating: updateLocationMutation.isPending,
    lastUpdateError: updateLocationMutation.error,
  };
}