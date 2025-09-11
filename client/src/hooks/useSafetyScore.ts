import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSafetyZone, adjustSafetyScoreForTime, adjustSafetyScoreForWeather } from '@/lib/safetyZones';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp: number;
}

interface SafetyScoreData {
  score: number;
  zoneType: 'safe' | 'moderate' | 'unsafe' | 'forest' | 'restricted';
  reason: string;
  location?: LocationData;
  lastUpdated: Date;
}

export function useSafetyScore(touristId?: string) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [safetyScore, setSafetyScore] = useState<SafetyScoreData>({
    score: 50,
    zoneType: 'moderate',
    reason: 'Location not available',
    lastUpdated: new Date()
  });

  // Get latest tourist location from database
  const { data: latestLocation, error: locationError } = useQuery({
    queryKey: touristId ? [`/api/tourist/location/${touristId}`] : undefined,
    enabled: !!touristId,
    refetchInterval: 30000, // Update every 30 seconds
    retry: false
  });

  // Handle API errors gracefully
  useEffect(() => {
    if (locationError) {
      console.warn('Failed to fetch tourist location from database:', locationError);
    }
  }, [locationError]);

  // Get current position from browser
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(newLocation);

        // Update safety score based on new location
        updateSafetyScore(newLocation);
      },
      (error) => {
        console.error('Error getting location:', error);
        // Fall back to database location if available
        if (latestLocation) {
          const dbLocation: LocationData = {
            latitude: parseFloat(latestLocation.latitude),
            longitude: parseFloat(latestLocation.longitude),
            address: latestLocation.address,
            timestamp: new Date(latestLocation.timestamp).getTime()
          };
          setLocation(dbLocation);
          updateSafetyScore(dbLocation);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [latestLocation]);

  // Update safety score when location changes
  function updateSafetyScore(locationData: LocationData) {
    try {
      const zoneData = getSafetyZone(locationData.latitude, locationData.longitude);
      
      // Apply time-based adjustments
      const currentHour = new Date().getHours();
      let adjustedScore = adjustSafetyScoreForTime(zoneData.score, currentHour);
      
      // Apply weather-based adjustments (simplified - would integrate with weather API in production)
      const currentWeather = 'clear'; // Placeholder - would get from weather API
      adjustedScore = adjustSafetyScoreForWeather(adjustedScore, currentWeather);
      
      setSafetyScore({
        score: Math.max(0, Math.min(100, adjustedScore)),
        zoneType: zoneData.zoneType,
        reason: zoneData.reason,
        location: locationData,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error calculating safety score:', error);
      setSafetyScore(prev => ({
        ...prev,
        score: 50,
        reason: 'Unable to calculate safety score',
        lastUpdated: new Date()
      }));
    }
  }

  return {
    safetyScore: safetyScore.score,
    zoneType: safetyScore.zoneType,
    reason: safetyScore.reason,
    location,
    lastUpdated: safetyScore.lastUpdated,
    isLocationAvailable: !!location
  };
}