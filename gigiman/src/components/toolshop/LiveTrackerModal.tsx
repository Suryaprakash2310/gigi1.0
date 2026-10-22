import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";
import { parseCoordinates, isValidCoordinate, getDirectionsUrl, Coordinates } from "@/utils/location";
import { NavigationStep, RouteNavigationInfo, getManeuverKeyword, getManeuverIcon, formatManeuverDistance } from "@/utils/navigation.utils";

export type { NavigationStep, RouteNavigationInfo };
export type RouteInfo = RouteNavigationInfo;

interface Location {
    latitude: number;
    longitude: number;
    heading: number;
    eta?: string;
}

interface LiveTrackerModalProps {
    visible: boolean;
    onClose: () => void;
    location: Location | null; // Self or Target
    destination?: { latitude: number; longitude: number }; // User/Customer location
    mode?: "tracking" | "navigation"; // tracking = simple view, navigation = self + dest
}

// =================================================================================
// SHARED MAP COMPONENT (MAPBOX VECTOR & SATELLITE TILES WITH REAL-TIME MANEUVERS)
// =================================================================================
const LeafletMapView = ({
    location,
    destination,
    mode,
    style,
    onRouteUpdated,
    showInMapHud = false
}: {
    location: Location | null,
    destination?: { latitude: number; longitude: number },
    mode?: string,
    style?: any,
    onRouteUpdated?: (info: RouteNavigationInfo) => void,
    showInMapHud?: boolean
}) => {
    const webViewRef = useRef<WebView>(null);
    const parsedLoc = parseCoordinates(location);
    const parsedDest = parseCoordinates(destination);

    // Default to valid location or destination or India center
    const lat = parsedLoc?.latitude || parsedDest?.latitude || 20.5937;
    const lng = parsedLoc?.longitude || parsedDest?.longitude || 78.9629;
    const destLat = parsedDest?.latitude || 0;
    const destLng = parsedDest?.longitude || 0;
    const initialZoom = (parsedLoc || parsedDest) ? 16 : 5;

    const mapHtml = React.useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; height: 100vh; width: 100vw; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
          #map { height: 100%; width: 100%; }
          
          @keyframes marker-pulse {
            0% { transform: scale(0.85); opacity: 0.9; }
            50% { transform: scale(1.25); opacity: 0.2; }
            100% { transform: scale(0.85); opacity: 0.9; }
          }
          .vehicle-pulse-ring {
            animation: marker-pulse 2.2s infinite ease-in-out;
          }

          /* In-Map Mapbox Turn-by-Turn Navigation HUD */
          #nav-hud {
            position: absolute;
            top: 14px;
            left: 14px;
            right: 14px;
            z-index: 1000;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            padding: 12px 14px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            display: none;
            color: #FFFFFF;
            transition: all 0.3s ease;
          }

          .hud-main-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .hud-icon-badge {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: #0D9488;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 10px rgba(13, 148, 136, 0.4);
          }

          .hud-text-area {
            flex: 1;
            min-width: 0;
          }

          .hud-top-line {
            display: flex;
            align-items: baseline;
            gap: 6px;
          }

          .hud-distance {
            font-size: 20px;
            font-weight: 800;
            color: #2DD4BF;
            letter-spacing: -0.5px;
          }

          .hud-keyword {
            font-size: 16px;
            font-weight: 700;
            color: #FFFFFF;
          }

          .hud-street {
            font-size: 13px;
            color: #94A3B8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 1px;
            font-weight: 500;
          }

          .hud-next-step {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 11px;
            color: #CBD5E1;
          }

          .hud-next-step svg {
            width: 14px;
            height: 14px;
            fill: #94A3B8;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        ${showInMapHud ? `
        <!-- Dynamic Turn-by-Turn Navigation HUD inside Mapbox View -->
        <div id="nav-hud">
          <div class="hud-main-row">
            <div id="hud-icon-box" class="hud-icon-badge">
              <svg id="hud-svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF"></svg>
            </div>
            <div class="hud-text-area">
              <div class="hud-top-line">
                <span id="hud-distance" class="hud-distance">In 0 m</span>
                <span id="hud-keyword" class="hud-keyword">Go Straight</span>
              </div>
              <div id="hud-street" class="hud-street">Calculating route...</div>
            </div>
          </div>
          <div id="hud-next-bar" class="hud-next-step" style="display:none;">
            <span>Then</span>
            <span id="hud-next-text" style="font-weight: 600;">In 500 m • Turn Right</span>
          </div>
        </div>
        ` : ''}

        <script>
          var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${initialZoom});
          // Tile layers without hardcoded tokens
          
          // Mapbox Vector Streets & Satellite Tile Layers
          var streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© Mapbox © OpenStreetMap',
              tileSize: 512,
              zoomOffset: -1,
              maxZoom: 20
          });

          var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Mapbox © OpenStreetMap',
              tileSize: 512,
              zoomOffset: -1,
              maxZoom: 20
          });

          // Add default Satellite Streets layer
          satelliteLayer.addTo(map);
          var currentLayer = satelliteLayer;

          window.setMapLayer = function(layerName) {
             if (layerName === 'satellite') {
                 if (map.hasLayer(streetsLayer)) map.removeLayer(streetsLayer);
                 if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
                 currentLayer = satelliteLayer;
             } else {
                 if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
                 if (!map.hasLayer(streetsLayer)) streetsLayer.addTo(map);
                 currentLayer = streetsLayer;
             }
          };

          // Modern Vehicle & Destination Pin Icons
          var userStartHtml = '<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">' +
                              '<div class="vehicle-pulse-ring" style="position:absolute;width:44px;height:44px;border-radius:22px;background:rgba(13,148,136,0.3);pointer-events:none;"></div>' +
                              '<div id="vehicle-marker-badge" style="width:36px;height:36px;border-radius:18px;background:linear-gradient(135deg,#0D9488,#042F2E);border:2.5px solid #FFFFFF;box-shadow:0 4px 12px rgba(13,148,136,0.5);display:flex;align-items:center;justify-content:center;transition:transform 0.3s ease;">' +
                              '<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>' +
                              '</div></div>';
          var carIcon = L.divIcon({
              html: userStartHtml,
              className: 'custom-vehicle-marker',
              iconSize: [44, 44],
              iconAnchor: [22, 22]
          });

          var destMarkerHtml = '<div style="display:flex;flex-direction:column;align-items:center;">' +
                               '<div style="width:30px;height:30px;background:#EF4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">' +
                               '<div style="width:10px;height:10px;background:#fff;border-radius:50%;"></div>' +
                               '</div></div>';
          var destIcon = L.divIcon({
              html: destMarkerHtml,
              className: 'custom-dest-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
          });

          // VEHICLE MARKER
          var marker = L.marker([${lat}, ${lng}], {icon: carIcon}).addTo(map);
          var destMarker = null;

          var destLat = ${destLat};
          var destLng = ${destLng};
          var currentLat = ${lat};
          var currentLng = ${lng};
          var hasDestination = ${Boolean(parsedDest && destLat !== 0 && destLng !== 0) ? 'true' : 'false'};

          // Route Polylines
          var routeHaloLayer = null;
          var routeCoreLayer = null;

          // Navigation Steps State
          var navigationSteps = [];
          var currentStepIndex = 0;
          var totalRouteDistance = "0 m";
          var totalRouteDuration = "0 mins";

          // VOICE GUIDANCE SYSTEM
          var voiceEnabled = true;
          var lastSpokenInstruction = "";

          function speakInstruction(text) {
             if (!voiceEnabled || !window.speechSynthesis || !text) return;
             var cleanText = text.replace(/<[^>]*>?/gm, '').trim();
             if (!cleanText || cleanText === lastSpokenInstruction) return;
             lastSpokenInstruction = cleanText;
             
             try {
                window.speechSynthesis.cancel();
                var utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 0.95;
                utterance.pitch = 1.0;
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
             } catch(e) {}
          }

          window.setVoiceEnabled = function(enabled) {
             voiceEnabled = enabled;
             if (!enabled && window.speechSynthesis) {
                 window.speechSynthesis.cancel();
             } else if (enabled && lastSpokenInstruction) {
                 speakInstruction(lastSpokenInstruction);
             }
          };

          // Maneuver Keyword Helpers
          function getKeyword(type, modifier) {
             var mod = (modifier || '').toLowerCase();
             var typ = (type || '').toLowerCase();

             if (typ === 'arrive') return 'Arrive at Destination';
             if (typ === 'depart') return 'Head Out';
             if (mod === 'uturn') return 'Make U-Turn';

             if (mod.indexOf('slight left') !== -1) return 'Slight Left';
             if (mod.indexOf('slight right') !== -1) return 'Slight Right';
             if (mod.indexOf('sharp left') !== -1) return 'Sharp Left';
             if (mod.indexOf('sharp right') !== -1) return 'Sharp Right';
             if (mod.indexOf('left') !== -1) return 'Turn Left';
             if (mod.indexOf('right') !== -1) return 'Turn Right';
             if (mod.indexOf('straight') !== -1 || typ === 'continue') return 'Go Straight';

             return 'Go Straight';
          }

          function getSvgIcon(type, modifier) {
             var mod = (modifier || '').toLowerCase();
             var typ = (type || '').toLowerCase();

             if (typ === 'arrive') {
                return '<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>'; // Flag
             }
             if (mod === 'uturn') {
                return '<path d="M18 10V4h-2v6a5 5 0 0 1-10 0V4H4v6a7 7 0 0 0 14 0zM7 7l-4-4 4-4v8z"/>'; // Uturn
             }
             if (mod.indexOf('left') !== -1) {
                // Turn Left Arrow
                return '<path d="M9 5v4h6a5 5 0 0 1 5 5v5h-2v-5a3 3 0 0 0-3-3H9v4L3 10l6-5z"/>';
             }
             if (mod.indexOf('right') !== -1) {
                // Turn Right Arrow
                return '<path d="M15 5v4H9a5 5 0 0 0-5 5v5h2v-5a3 3 0 0 1 3-3h6v4l6-5-6-5z"/>';
             }
             // Straight Arrow
             return '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>';
          }

          function formatDist(meters) {
             if (meters >= 1000) return (meters / 1000).toFixed(1) + " km";
             return Math.round(meters) + " m";
          }

          // Calculate distance in meters between two lat/lng points
          function getDistanceMeters(lat1, lon1, lat2, lon2) {
             var R = 6371e3;
             var phi1 = lat1 * Math.PI / 180;
             var phi2 = lat2 * Math.PI / 180;
             var dPhi = (lat2 - lat1) * Math.PI / 180;
             var dLam = (lon2 - lon1) * Math.PI / 180;

             var a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
                     Math.cos(phi1) * Math.cos(phi2) *
                     Math.sin(dLam/2) * Math.sin(dLam/2);
             var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
             return R * c;
          }

          // Update In-Map Navigation HUD
          function updateHUD(step, distRemainingToStep) {
             var hud = document.getElementById('nav-hud');
             if (!step || !hud) return;

             hud.style.display = 'block';

             var distStr = distRemainingToStep !== undefined ? formatDist(distRemainingToStep) : step.distanceFormatted;
             document.getElementById('hud-distance').innerText = "In " + distStr;
             document.getElementById('hud-keyword').innerText = step.keyword;
             document.getElementById('hud-street').innerText = step.streetName ? ("onto " + step.streetName) : step.instruction;

             var svg = document.getElementById('hud-svg');
             svg.innerHTML = getSvgIcon(step.type, step.modifier);

             var nextStep = navigationSteps[currentStepIndex + 1];
             var nextBar = document.getElementById('hud-next-bar');
             if (nextStep && nextBar) {
                 nextBar.style.display = 'flex';
                 document.getElementById('hud-next-text').innerText = "In " + nextStep.distanceFormatted + " • " + nextStep.keyword + (nextStep.streetName ? (" " + nextStep.streetName) : "");
             } else if (nextBar) {
                 nextBar.style.display = 'none';
             }
          }

          // Fetch Driving Route using Mapbox Directions API v5
          function fetchMapboxRoute(sLat, sLng, dLat, dLng) {
             if (!sLat || !sLng || !dLat || !dLng) return;

             var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + 
                       sLng + ',' + sLat + ';' + dLng + ',' + dLat + 
                       '?steps=true&geometries=geojson&overview=full&banner_instructions=true&voice_instructions=true&access_token=' + mapboxToken;

             fetch(url)
               .then(function(res) { return res.json(); })
               .then(function(data) {
                  if (!data.routes || !data.routes.length) return;
                  var route = data.routes[0];
                  var geometry = route.geometry;
                  var leg = route.legs && route.legs[0];
                  var rawSteps = (leg && leg.steps) || [];

                  // Draw Mapbox GeoJSON Route Line
                  if (routeHaloLayer) map.removeLayer(routeHaloLayer);
                  if (routeCoreLayer) map.removeLayer(routeCoreLayer);

                  routeHaloLayer = L.geoJSON(geometry, {
                     style: { color: '#042F2E', weight: 8, opacity: 0.4 }
                  }).addTo(map);

                  routeCoreLayer = L.geoJSON(geometry, {
                     style: { color: '#0D9488', weight: 5, opacity: 0.95 }
                  }).addTo(map);

                  // Parse Steps
                  navigationSteps = rawSteps.map(function(s, idx) {
                     var m = s.maneuver || {};
                     var kw = getKeyword(m.type, m.modifier);
                     var distStr = formatDist(s.distance || 0);

                     return {
                        stepIndex: idx,
                        keyword: kw,
                        modifier: m.modifier || 'straight',
                        type: m.type || 'turn',
                        distanceMeters: Math.round(s.distance || 0),
                        distanceFormatted: distStr,
                        distanceText: "In " + distStr,
                        instruction: m.instruction || (kw + (s.name ? (" onto " + s.name) : "")),
                        streetName: s.name || '',
                        location: m.location || null
                     };
                  });

                  totalRouteDistance = formatDist(route.distance || 0);
                  totalRouteDuration = Math.round((route.duration || 0) / 60) + " mins";

                  currentStepIndex = 0;
                  // Skip trivial departure step if needed
                  if (navigationSteps.length > 1 && navigationSteps[0].distanceMeters < 20) {
                     currentStepIndex = 1;
                  }

                  var activeStep = navigationSteps[currentStepIndex] || navigationSteps[0];
                  if (activeStep) {
                     updateHUD(activeStep, activeStep.distanceMeters);
                     speakInstruction("In " + activeStep.distanceFormatted + ", " + activeStep.keyword + (activeStep.streetName ? (" onto " + activeStep.streetName) : ""));
                  }

                  // Fit Bounds to entire route
                  var bounds = routeCoreLayer.getBounds();
                  map.fitBounds(bounds.pad(0.2));

                  // Post full navigation payload to React Native
                  sendPayloadToNative();
               })
               .catch(function(err) {
                  // Ignore fetch errors
               });
          }

          function sendPayloadToNative() {
             var activeStep = navigationSteps[currentStepIndex] || null;
             var nextStep = navigationSteps[currentStepIndex + 1] || null;

             var payload = {
                 type: 'route',
                 distance: totalRouteDistance,
                 duration: totalRouteDuration,
                 instruction: activeStep ? activeStep.instruction : "Follow route",
                 keyword: activeStep ? activeStep.keyword : "Go Straight",
                 distanceToTurn: activeStep ? activeStep.distanceText : ("In " + totalRouteDistance),
                 streetName: activeStep ? activeStep.streetName : "",
                 modifier: activeStep ? activeStep.modifier : "straight",
                 currentStep: activeStep,
                 nextStep: nextStep,
                 steps: navigationSteps
             };

             if (window.ReactNativeWebView) {
                 window.ReactNativeWebView.postMessage(JSON.stringify(payload));
             }
          }

          // Initial route fetch
          if (hasDestination && destLat !== 0 && destLng !== 0) {
             destMarker = L.marker([destLat, destLng], {icon: destIcon}).addTo(map);
             fetchMapboxRoute(currentLat, currentLng, destLat, destLng);
          }

          window.zoomIn = function() { map.zoomIn(); };
          window.zoomOut = function() { map.zoomOut(); };

          window.recenter = function() {
             if (destMarker && marker) {
                var group = new L.featureGroup([marker, destMarker]);
                map.fitBounds(group.getBounds().pad(0.3));
             } else if (marker) {
                map.setView(marker.getLatLng(), 16);
             }
          };

          // Live location update from vehicle GPS
          window.updateLocation = function(lat, lng, head) {
             if(!lat || !lng) return;
             currentLat = lat;
             currentLng = lng;
             var newLatLng = new L.LatLng(lat, lng);
             marker.setLatLng(newLatLng);

             if(head !== undefined && head !== null && head !== 0) {
                 var badge = document.getElementById('vehicle-marker-badge');
                 if(badge) badge.style.transform = 'rotate(' + head + 'deg)';
             }

             // Check maneuver progress
             if (navigationSteps && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
                 var step = navigationSteps[currentStepIndex];
                 if (step && step.location) {
                     var turnLng = step.location[0];
                     var turnLat = step.location[1];
                     var distToTurn = getDistanceMeters(lat, lng, turnLat, turnLng);

                     // Advance step if vehicle is within 25m of the turn
                     if (distToTurn < 25 && currentStepIndex < navigationSteps.length - 1) {
                         currentStepIndex++;
                         var nextStep = navigationSteps[currentStepIndex];
                         updateHUD(nextStep, nextStep.distanceMeters);
                         speakInstruction(nextStep.instruction);
                         sendPayloadToNative();
                     } else {
                         // Live countdown update
                         updateHUD(step, distToTurn);
                     }
                 }
             }
          };

          window.updateDestination = function(lat, lng) {
             if(!lat || !lng) return;
             destLat = lat;
             destLng = lng;
             var newDest = new L.LatLng(lat, lng);
             if (destMarker) {
                 destMarker.setLatLng(newDest);
             } else {
                 destMarker = L.marker(newDest, {icon: destIcon}).addTo(map);
             }
             fetchMapboxRoute(currentLat, currentLng, destLat, destLng);
          };
        </script>
      </body>
    </html>
  `, []);

    useEffect(() => {
        if (location && webViewRef.current) {
            webViewRef.current.injectJavaScript(`if(window.updateLocation) window.updateLocation(${location.latitude}, ${location.longitude}, ${location.heading || 0}); true;`);
        }
    }, [location]);

    useEffect(() => {
        if (destination && webViewRef.current) {
            webViewRef.current.injectJavaScript(`if(window.updateDestination) window.updateDestination(${destination.latitude}, ${destination.longitude}); true;`);
        }
    }, [destination?.latitude, destination?.longitude]);

    const [isSatellite, setIsSatellite] = useState(true);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    const handleToggleLayer = () => {
        const nextMode = !isSatellite;
        setIsSatellite(nextMode);
        webViewRef.current?.injectJavaScript(`if(window.setMapLayer) window.setMapLayer('${nextMode ? 'satellite' : 'streets'}'); true;`);
    };

    const handleToggleVoice = () => {
        const nextVoice = !isVoiceEnabled;
        setIsVoiceEnabled(nextVoice);
        webViewRef.current?.injectJavaScript(`if(window.setVoiceEnabled) window.setVoiceEnabled(${nextVoice}); true;`);
    };

    const handleZoomIn = () => {
        webViewRef.current?.injectJavaScript(`if(window.zoomIn) window.zoomIn(); true;`);
    };

    const handleZoomOut = () => {
        webViewRef.current?.injectJavaScript(`if(window.zoomOut) window.zoomOut(); true;`);
    };

    const handleRecenter = () => {
        webViewRef.current?.injectJavaScript(`if(window.recenter) window.recenter(); true;`);
    };

    return (
        <View style={style || { flex: 1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                onMessage={(event) => {
                    if (onRouteUpdated && event.nativeEvent.data) {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            if (data.type === 'route') {
                                onRouteUpdated(data);
                            }
                        } catch (e) { }
                    }
                }}
            />

            {/* Floating Map Controls (Voice Guidance, Satellite Switcher, Compass & Zoom) */}
            <View style={styles.floatingControlsContainer} pointerEvents="box-none">
                {/* Voice Guidance Toggle */}
                <TouchableOpacity
                    style={[styles.floatingCircleBtn, isVoiceEnabled && { backgroundColor: '#0F172A', borderColor: '#0D9488' }]}
                    onPress={handleToggleVoice}
                    activeOpacity={0.8}
                >
                    <Ionicons name={isVoiceEnabled ? "volume-high" : "volume-mute"} size={22} color={isVoiceEnabled ? "#2DD4BF" : "#94A3B8"} />
                </TouchableOpacity>

                {/* Satellite ↔ Streets Toggle Button */}
                <TouchableOpacity
                    style={[styles.floatingCircleBtn, isSatellite && { backgroundColor: '#0F172A', borderColor: '#0D9488' }]}
                    onPress={handleToggleLayer}
                    activeOpacity={0.8}
                >
                    <Ionicons name={isSatellite ? "earth" : "map-outline"} size={22} color={isSatellite ? "#2DD4BF" : "#1E293B"} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.floatingCircleBtn}
                    onPress={handleRecenter}
                    activeOpacity={0.8}
                >
                    <Ionicons name="compass-outline" size={22} color="#1E293B" />
                </TouchableOpacity>

                <View style={styles.zoomCapsule}>
                    <TouchableOpacity
                        style={styles.zoomHalfBtn}
                        onPress={handleZoomIn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity
                        style={styles.zoomHalfBtn}
                        onPress={handleZoomOut}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={20} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};


// =================================================================================
// EMBEDDED MAP CARD (FOR EMP BOOKING & PRE-OTP TRACKING)
// =================================================================================
export const EmbeddedTrackingMap = ({
    location,
    destination,
    height,
    style,
    isFullScreen = false,
    onRouteUpdated,
    showInMapHud = false,
}: {
    location: Location | null,
    destination?: { latitude: number; longitude: number },
    height?: number | string,
    style?: any,
    isFullScreen?: boolean,
    onRouteUpdated?: (info: RouteNavigationInfo) => void,
    showInMapHud?: boolean,
}) => {
    return (
        <View style={[
            isFullScreen ? { flex: 1, width: '100%' } : { height: height || 320, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E2E8F0', marginVertical: 8 },
            style
        ]}>
            <LeafletMapView
                location={location}
                destination={destination}
                mode="navigation"
                style={{ flex: 1 }}
                onRouteUpdated={onRouteUpdated}
                showInMapHud={showInMapHud}
            />
        </View>
    );
};


// =================================================================================
// MODAL MAP (FOR TOOLSHOP & DASHBOARD WITH TURN-BY-TURN HUD & STEPS DRAWER)
// =================================================================================
export const LiveTrackerModal = ({ visible, onClose, location, destination, mode = "tracking" }: LiveTrackerModalProps) => {
    const parsedLoc = parseCoordinates(location);
    const parsedDest = parseCoordinates(destination);
    const targetCoord = parsedDest || parsedLoc;
    const [routeInfo, setRouteInfo] = useState<RouteNavigationInfo | null>(null);
    const [showAllSteps, setShowAllSteps] = useState(false);

    const openExternalMap = () => {
        if (!targetCoord) return;
        const url = getDirectionsUrl(targetCoord, parsedLoc);
        if (url) {
            Linking.openURL(url).catch(() => {
                const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetCoord.latitude},${targetCoord.longitude}`;
                Linking.openURL(fallbackUrl);
            });
        }
    };

    const getTurnIcon = (modifier?: string, type?: string) => {
        const mod = (modifier || '').toLowerCase();
        const typ = (type || '').toLowerCase();
        if (typ === 'arrive') return 'flag';
        if (mod === 'uturn') return 'refresh';
        if (mod.includes('left')) return 'arrow-undo';
        if (mod.includes('right')) return 'arrow-redo';
        return 'arrow-up';
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Mapbox Navigation & Live Tracking</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Turn-by-Turn Maneuver HUD Card */}
                {routeInfo ? (
                    <View style={styles.navHudCard}>
                        <View style={styles.hudHeaderRow}>
                            <View style={styles.maneuverIconBox}>
                                <Ionicons
                                    name={getTurnIcon(routeInfo.modifier, routeInfo.currentStep?.type) as any}
                                    size={24}
                                    color="#FFFFFF"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                    <Text style={styles.maneuverDistance}>
                                        {routeInfo.distanceToTurn || "In route"}
                                    </Text>
                                    <Text style={styles.maneuverKeyword}>
                                        {routeInfo.keyword || "Go Straight"}
                                    </Text>
                                </View>
                                <Text style={styles.maneuverStreet} numberOfLines={1}>
                                    {routeInfo.streetName ? `onto ${routeInfo.streetName}` : routeInfo.instruction}
                                </Text>
                            </View>

                            <View style={styles.etaBadge}>
                                <Text style={styles.etaText}>{routeInfo.duration}</Text>
                                <Text style={styles.etaSubText}>{routeInfo.distance}</Text>
                            </View>
                        </View>

                        {/* Expandable Turn Steps Toggle */}
                        {routeInfo.steps && routeInfo.steps.length > 0 && (
                            <TouchableOpacity
                                style={styles.stepsToggleRow}
                                onPress={() => setShowAllSteps(!showAllSteps)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.stepsToggleText}>
                                    {showAllSteps ? "Hide Turns" : `View All Turns (${routeInfo.steps.length})`}
                                </Text>
                                <Ionicons name={showAllSteps ? "chevron-up" : "chevron-down"} size={16} color="#0D9488" />
                            </TouchableOpacity>
                        )}

                        {/* Collapsible Turn Steps List */}
                        {showAllSteps && routeInfo.steps && (
                            <ScrollView style={styles.stepsScrollList} nestedScrollEnabled={true}>
                                {routeInfo.steps.map((step, idx) => (
                                    <View key={idx} style={styles.stepItemRow}>
                                        <View style={styles.stepSmallIcon}>
                                            <Ionicons name={getTurnIcon(step.modifier, step.type) as any} size={16} color="#0D9488" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.stepItemKeyword}>
                                                {step.distanceText} • <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{step.keyword}</Text>
                                            </Text>
                                            <Text style={styles.stepItemStreet} numberOfLines={1}>
                                                {step.streetName || step.instruction}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : (
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.infoText}>Calculating Mapbox Driving Route...</Text>
                        </View>
                    </View>
                )}

                <View style={styles.mapContainer}>
                    <LeafletMapView
                        location={location}
                        destination={destination}
                        mode={mode}
                        style={styles.webview}
                        onRouteUpdated={setRouteInfo}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.fullMapBtn} onPress={openExternalMap}>
                        <Text style={styles.btnText}>Open External GPS App</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
    title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
    closeBtn: { padding: 8 },
    infoCard: { padding: 16, backgroundColor: "#F8FAFC", margin: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, elevation: 2 },
    infoRow: { flexDirection: "row", alignItems: "center" },
    infoText: { marginLeft: 10, fontSize: 16, fontWeight: "500", color: "#334155" },
    mapContainer: { flex: 1, width: "100%" },
    webview: { flex: 1 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#eee" },
    fullMapBtn: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

    // Navigation Turn-by-Turn Card
    navHudCard: {
        backgroundColor: '#0F172A',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 6,
    },
    hudHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    maneuverIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0D9488',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0D9488',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
    },
    maneuverDistance: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2DD4BF',
    },
    maneuverKeyword: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    maneuverStreet: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 2,
    },
    etaBadge: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    etaText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    etaSubText: {
        fontSize: 12,
        color: '#2DD4BF',
        fontWeight: '500',
    },
    stepsToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        gap: 4,
    },
    stepsToggleText: {
        color: '#2DD4BF',
        fontSize: 12,
        fontWeight: '600',
    },
    stepsScrollList: {
        maxHeight: 180,
        marginTop: 8,
    },
    stepItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        gap: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    stepSmallIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(13, 148, 136, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepItemKeyword: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    stepItemStreet: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },

    // Floating Controls
    floatingControlsContainer: {
        position: 'absolute',
        right: 16,
        top: 130,
        alignItems: 'center',
        gap: 12,
        zIndex: 50,
    },
    floatingCircleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    zoomCapsule: {
        width: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    zoomHalfBtn: {
        width: 44,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomDivider: {
        width: 32,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
});
