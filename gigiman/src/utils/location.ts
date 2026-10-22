// src/utils/location.ts
import * as Location from "expo-location";
import { Platform } from "react-native";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validates if the latitude and longitude are within standard geographical bounds.
 */
export const isValidCoordinate = (lat?: number | null, lng?: number | null): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  // Latitude must be -90 to 90, Longitude must be -180 to 180. (0,0) is Null Island
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  return true;
};

/**
 * Universal & Smart Coordinate Extractor
 * Correctly parses lat/lng from any representation:
 * - GeoJSON array [lng, lat] vs [lat, lng] (with auto-detection)
 * - Object: { latitude, longitude } or { lat, lng } (number or numeric string)
 * - Nested objects: job.location, job.userLocation, job.coordinates, job.user
 * - String: "Coordinates: 13.0827, 80.2707" or "13.0827, 80.2707"
 */
export const parseCoordinates = (input: any): Coordinates | null => {
  if (!input) return null;

  // 1. Direct or nested object check
  if (typeof input === "object") {
    // Check direct lat/lng or latitude/longitude properties
    const latVal = input.latitude ?? input.lat ?? input.Latitude ?? input.Lat;
    const lngVal = input.longitude ?? input.lng ?? input.long ?? input.Longitude ?? input.Lng;

    if (latVal !== undefined && lngVal !== undefined && latVal !== null && lngVal !== null) {
      const parsedLat = parseFloat(latVal);
      const parsedLng = parseFloat(lngVal);
      if (isValidCoordinate(parsedLat, parsedLng)) {
        // Disambiguate if lat and lng were accidentally inverted (e.g., in India Lat ~8..37, Lng ~68..98)
        if (parsedLat > 50 && parsedLng <= 40) {
          return { latitude: parsedLng, longitude: parsedLat };
        }
        return { latitude: parsedLat, longitude: parsedLng };
      }
    }

    // Check array: input.coordinates or input directly being an array
    const rawCoords = Array.isArray(input)
      ? input
      : input.coordinates ||
        input.location?.coordinates ||
        input.userLocation?.coordinates ||
        input.user?.location?.coordinates ||
        input.addressCoordinates;

    if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
      const first = parseFloat(rawCoords[0]);
      const second = parseFloat(rawCoords[1]);
      if (!isNaN(first) && !isNaN(second)) {
        // Disambiguate [longitude, latitude] (GeoJSON) vs [latitude, longitude]
        if (first > 50 && second <= 40) {
          // first is Longitude (e.g. 80.27), second is Latitude (e.g. 13.08)
          return { latitude: second, longitude: first };
        } else if (first <= 40 && second > 50) {
          // first is Latitude (e.g. 13.08), second is Longitude (e.g. 80.27)
          return { latitude: first, longitude: second };
        } else if (Math.abs(first) > 90) {
          // first can only be Longitude
          return { latitude: second, longitude: first };
        } else if (Math.abs(second) > 90) {
          // second can only be Longitude
          return { latitude: first, longitude: second };
        } else {
          // Default for standard GeoJSON arrays [lng, lat]
          return { latitude: second, longitude: first };
        }
      }
    }

    // Check nested objects: location, userLocation, user, coords
    if (input.location && input.location !== input) {
      const res = parseCoordinates(input.location);
      if (res) return res;
    }
    if (input.userLocation && input.userLocation !== input) {
      const res = parseCoordinates(input.userLocation);
      if (res) return res;
    }
    if (input.user && input.user !== input) {
      const res = parseCoordinates(input.user);
      if (res) return res;
    }
    if (input.coords && input.coords !== input) {
      const res = parseCoordinates(input.coords);
      if (res) return res;
    }
  }

  // 2. String representation check (e.g. "Coordinates: 13.0827, 80.2707" or "13.0827,80.2707")
  if (typeof input === "string") {
    const clean = input.replace(/Coordinates:\s*/i, "").trim();
    const parts = clean.split(/[,\s]+/).map((p) => parseFloat(p)).filter((n) => !isNaN(n));
    if (parts.length >= 2) {
      const first = parts[0];
      const second = parts[1];
      if (first > 50 && second <= 40) {
        return { latitude: second, longitude: first };
      } else if (first <= 40 && second > 50) {
        return { latitude: first, longitude: second };
      } else if (Math.abs(first) > 90) {
        return { latitude: second, longitude: first };
      } else if (Math.abs(second) > 90) {
        return { latitude: first, longitude: second };
      } else {
        // For text strings "lat, lng", standard convention is Latitude first
        return { latitude: first, longitude: second };
      }
    }
  }

  return null;
};

/**
 * Reverse geocodes coordinates to a human-readable street/area address
 */
export const reverseGeocodeCoordinates = async (
  coords: Coordinates
): Promise<string | null> => {
  try {
    if (!isValidCoordinate(coords.latitude, coords.longitude)) return null;

    const geocodeResult = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (geocodeResult && geocodeResult.length > 0) {
      const place = geocodeResult[0];
      const parts = [
        place.name && place.name !== place.street ? place.name : null,
        place.street,
        place.district || place.subregion,
        place.city,
        place.region,
        place.postalCode,
      ].filter(Boolean);

      const addrText = Array.from(new Set(parts)).join(", ");
      return addrText || null;
    }
  } catch (e) {
    // Ignore reverse geocoding error
  }
  return null;
};

/**
 * Generates platform-specific navigation url to open Google Maps / Apple Maps
 */
export const getDirectionsUrl = (
  destination: Coordinates,
  origin?: Coordinates | null
): string => {
  const destStr = `${destination.latitude},${destination.longitude}`;
  if (Platform.OS === "ios") {
    return `maps:0,0?daddr=${destStr}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destStr}`;
};

export const getCurrentLocation = async () => {
  // 🌐 WEB fallback
  if (Platform.OS === "web") {
    return new Promise<{ latitude: number; longitude: number }>(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            reject(new Error("Location access denied in browser"));
          },
          { enableHighAccuracy: true }
        );
      }
    );
  }

  // 📱 MOBILE (Android / iOS)
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  // 🚨 Check if GPS is ON
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Please turn ON location services");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  if (!location?.coords) {
    throw new Error("Unable to fetch location");
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};
