/**
 * Navigation & Maneuvers Utility for Mapbox Turn-by-Turn Tracking
 */

export interface NavigationStep {
  stepIndex: number;
  keyword: string; // "Turn Left", "Turn Right", "Go Straight", "Slight Left", "Slight Right", "Make U-Turn", "Arrive"
  modifier: string; // "left", "right", "straight", "slight left", etc.
  type: string; // "turn", "depart", "arrive", "continue", etc.
  icon: 'turn-left' | 'turn-right' | 'straight' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'uturn' | 'flag';
  distanceMeters: number;
  distanceFormatted: string; // "350 m" or "1.4 km"
  distanceText: string; // "In 350 m" or "In 1.4 km"
  durationSeconds: number;
  durationMinutes: number;
  instruction: string;
  streetName: string;
  location?: [number, number]; // [lng, lat]
}

export interface RouteNavigationInfo {
  distance: string; // e.g. "7.4 km"
  duration: string; // e.g. "18 mins"
  instruction: string;
  keyword?: string; // "Turn Left", "Turn Right", "Go Straight"
  distanceToTurn?: string; // "In 350 m" or "In 1.2 km"
  streetName?: string;
  modifier?: string;
  icon?: 'turn-left' | 'turn-right' | 'straight' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'uturn' | 'flag';
  currentStep?: NavigationStep;
  nextStep?: NavigationStep;
  steps?: NavigationStep[];
}

/**
 * Maps Mapbox maneuver type and modifier into human-friendly turn keywords
 */
export function getManeuverKeyword(type?: string, modifier?: string): string {
  const typ = (type || '').toLowerCase();
  const mod = (modifier || '').toLowerCase();

  if (typ === 'arrive') return 'Arrive at Destination';
  if (typ === 'depart') return 'Head Out';
  if (mod === 'uturn') return 'Make U-Turn';

  if (mod.includes('slight left')) return 'Slight Left';
  if (mod.includes('slight right')) return 'Slight Right';
  if (mod.includes('sharp left')) return 'Sharp Left';
  if (mod.includes('sharp right')) return 'Sharp Right';
  if (mod.includes('left')) return 'Turn Left';
  if (mod.includes('right')) return 'Turn Right';
  if (mod.includes('straight') || typ === 'continue') return 'Go Straight';

  if (typ === 'roundabout') return 'Enter Roundabout';
  if (typ === 'fork') return mod.includes('left') ? 'Fork Left' : 'Fork Right';
  if (typ === 'merge') return 'Merge';

  return 'Go Straight';
}

/**
 * Returns icon key corresponding to maneuver
 */
export function getManeuverIcon(type?: string, modifier?: string): NavigationStep['icon'] {
  const typ = (type || '').toLowerCase();
  const mod = (modifier || '').toLowerCase();

  if (typ === 'arrive') return 'flag';
  if (mod === 'uturn') return 'uturn';
  if (mod.includes('slight left')) return 'slight-left';
  if (mod.includes('slight right')) return 'slight-right';
  if (mod.includes('sharp left')) return 'sharp-left';
  if (mod.includes('sharp right')) return 'sharp-right';
  if (mod.includes('left')) return 'turn-left';
  if (mod.includes('right')) return 'turn-right';
  return 'straight';
}

/**
 * Format meters into clean readable distance e.g. "250 m" or "1.4 km"
 */
export function formatManeuverDistance(meters: number): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '0 m';
  if (meters >= 1000) {
    return (meters / 1000).toFixed(1) + ' km';
  }
  return Math.round(meters) + ' m';
}

/**
 * Computes distance in meters between two lat/lng points using Haversine formula
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Parses raw Mapbox Directions API response into RouteNavigationInfo
 */
export function parseMapboxRoute(mapboxData: any): RouteNavigationInfo | null {
  if (!mapboxData || !mapboxData.routes || !mapboxData.routes.length) return null;

  const route = mapboxData.routes[0];
  const leg = route.legs && route.legs[0];
  const rawSteps = (leg && leg.steps) || [];

  const parsedSteps: NavigationStep[] = rawSteps.map((step: any, index: number) => {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || 'turn';
    const modifier = maneuver.modifier || '';
    const keyword = getManeuverKeyword(type, modifier);
    const icon = getManeuverIcon(type, modifier);
    const distStr = formatManeuverDistance(step.distance || 0);
    const distanceText = `In ${distStr}`;

    return {
      stepIndex: index,
      keyword,
      modifier: modifier || 'straight',
      type,
      icon,
      distanceMeters: Math.round(step.distance || 0),
      distanceFormatted: distStr,
      distanceText,
      durationSeconds: Math.round(step.duration || 0),
      durationMinutes: Math.round((step.duration || 0) / 60),
      instruction: maneuver.instruction || `${keyword} onto ${step.name || 'road'}`,
      streetName: step.name || '',
      location: maneuver.location || undefined,
    };
  });

  const totalDistanceFormatted = formatManeuverDistance(route.distance || 0);
  const totalDurationFormatted = Math.round((route.duration || 0) / 60) + ' mins';

  const currentStep =
    parsedSteps.find((s) => s.distanceMeters > 20 && s.type !== 'depart') || parsedSteps[0] || undefined;

  const currentIndex = currentStep ? parsedSteps.indexOf(currentStep) : 0;
  const nextStep = parsedSteps[currentIndex + 1] || undefined;

  return {
    distance: totalDistanceFormatted,
    duration: totalDurationFormatted,
    instruction: currentStep ? currentStep.instruction : 'Follow the route to customer location',
    keyword: currentStep ? currentStep.keyword : 'Go Straight',
    distanceToTurn: currentStep ? currentStep.distanceText : `In ${totalDistanceFormatted}`,
    streetName: currentStep ? currentStep.streetName : '',
    modifier: currentStep ? currentStep.modifier : 'straight',
    icon: currentStep ? currentStep.icon : 'straight',
    currentStep,
    nextStep,
    steps: parsedSteps,
  };
}
