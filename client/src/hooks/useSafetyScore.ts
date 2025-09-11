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

export function useSafetyScore(touristId?: string, currentLocation?: LocationData) {
  const [safetyScore, setSafetyScore] = useState<SafetyScoreData>({
    score: 50,
    zoneType: 'moderate',
    reason: 'Location not available',
    lastUpdated: new Date()
  });

  // Get latest tourist location from database as fallback
  const { data: latestLocation, error: locationError } = useQuery({
    queryKey: touristId ? ['/api/tourist/location', touristId] : undefined,
    enabled: !!touristId && !currentLocation, // Only fetch if no current location
    refetchInterval: 30000, // Update every 30 seconds
    retry: false
  });

  // Handle API errors gracefully
  useEffect(() => {
    if (locationError) {
      console.warn('Failed to fetch tourist location from database:', locationError);
    }
  }, [locationError]);

  // Update safety score when location changes
  useEffect(() => {
    const locationToUse = currentLocation || (latestLocation ? {
      latitude: parseFloat(latestLocation.latitude),
      longitude: parseFloat(latestLocation.longitude),
      address: latestLocation.address,
      timestamp: new Date(latestLocation.timestamp).getTime()
    } : null);

    if (locationToUse) {
      try {
        const zoneData = getSafetyZone(locationToUse.latitude, locationToUse.longitude);
        
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
          location: locationToUse,
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
  }, [currentLocation, latestLocation]);

  return {
    safetyScore: safetyScore.score,
    zoneType: safetyScore.zoneType,
    reason: safetyScore.reason,
    location: safetyScore.location,
    lastUpdated: safetyScore.lastUpdated,
    isLocationAvailable: !!safetyScore.location
  };
}