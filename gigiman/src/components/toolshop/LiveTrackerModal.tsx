import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";

interface Location {
    latitude: number;
    longitude: number;
    heading: number;
    eta?: string;
}

interface RouteInfo {
    distance: string; // e.g. "2.5 km"
    duration: string; // e.g. "15 mins"
    instruction: string; // e.g. "Turn left onto Main St"
}

interface LiveTrackerModalProps {
    visible: boolean;
    onClose: () => void;
    location: Location | null; // Self or Target
    destination?: { latitude: number; longitude: number }; // User/Customer location
    mode?: "tracking" | "navigation"; // tracking = simple view, navigation = self + dest
}

// =================================================================================
// SHARED MAP COMPONENT
// =================================================================================
const LeafletMapView = ({
    location,
    destination,
    mode,
    style,
    onRouteUpdated
}: {
    location: Location | null,
    destination?: { latitude: number; longitude: number },
    mode?: string,
    style?: any,
    onRouteUpdated?: (info: RouteInfo) => void
}) => {
    const webViewRef = useRef<WebView>(null);
    // Default to India center if no location yet
    const lat = location?.latitude || destination?.latitude || 20.5937;
    const lng = location?.longitude || destination?.longitude || 78.9629;
    const destLat = destination?.latitude || 0;
    const destLng = destination?.longitude || 0;
    const initialZoom = (location || destination) ? 16 : 5;

    const mapHtml = React.useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        
        <style>
          body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
          #map { height: 100%; width: 100%; }
          .leaflet-routing-container { display: none !important; } /* Hide default itinerary box */
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${initialZoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
              attribution: 'Gigiman Map',
              maxZoom: 19
          }).addTo(map);

          // Custom Icons
          var carIcon = L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Car/Bike icon
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
          });

          var destIcon = L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Pin icon
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
          });

          // SERVICER MARKER
          var marker = L.marker([${lat}, ${lng}], {icon: carIcon}).addTo(map);
          var destMarker = null;

          // ROUTING CONTROL
          var control = null;
          var destLat = ${destLat};
          var destLng = ${destLng};
          var hasDestination = ${destination ? 'true' : 'false'};

          function setupRouteEvents(ctrl) {
             ctrl.on('routesfound', function(e) {
                var routes = e.routes;
                var summary = routes[0].summary;
                var instructions = routes[0].instructions;
                
                // Get next significant instruction
                var nextStep = instructions.find(function(i) { return i.distance > 20 && i.type !== 'Head' }) || instructions[0];
                
                var distStr = (summary.totalDistance > 1000) 
                              ? (summary.totalDistance / 1000).toFixed(1) + " km" 
                              : Math.round(summary.totalDistance) + " m";
                
                var timeStr = Math.round(summary.totalTime / 60) + " mins";

                var payload = {
                    type: 'route',
                    distance: distStr,
                    duration: timeStr,
                    instruction: nextStep ? nextStep.text : "Arriving soon"
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify(payload));
             });
          }

          if (hasDestination && destLat !== 0 && destLng !== 0) {
             destMarker = L.marker([destLat, destLng], {icon: destIcon}).addTo(map);

             control = L.Routing.control({
                waypoints: [
                    L.latLng(${lat}, ${lng}),
                    L.latLng(destLat, destLng)
                ],
                lineOptions: {
                    styles: [{color: '#6200ea', opacity: 0.8, weight: 6}] // Swiggy/Zomato style bold line
                },
                createMarker: function() { return null; }, // We manage markers manually
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
             }).addTo(map);

             setupRouteEvents(control);
          }

          window.updateLocation = function(lat, lng, head) {
             if(lat && lng) {
                 var newLatLng = new L.LatLng(lat, lng);
                 marker.setLatLng(newLatLng);
                 if(head && marker.setRotationAngle) marker.setRotationAngle(head);
                 
                 // Update route start point
                 if (control) {
                    control.setWaypoints([newLatLng, L.latLng(destLat, destLng)]);
                 } else {
                     map.panTo(newLatLng);
                 }
             }
          };

          window.updateDestination = function(lat, lng) {
             if(lat && lng) {
                 destLat = lat;
                 destLng = lng;
                 var newDest = new L.LatLng(lat, lng);
                 
                 if (destMarker) {
                     destMarker.setLatLng(newDest);
                 } else {
                     destMarker = L.marker(newDest, {icon: destIcon}).addTo(map);
                 }

                 if (control) {
                     var startPos = marker.getLatLng();
                     control.setWaypoints([startPos, newDest]);
                 } else {
                     var startPos = marker.getLatLng();
                     control = L.Routing.control({
                        waypoints: [startPos, newDest],
                        lineOptions: { styles: [{color: '#6200ea', opacity: 0.8, weight: 6}] },
                        createMarker: function() { return null; },
                        addWaypoints: false,
                        draggableWaypoints: false,
                        fitSelectedRoutes: true,
                        showAlternatives: false,
                     }).addTo(map);
                     setupRouteEvents(control);
                 }
             }
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

    return (
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={style}
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
    );
};


// =================================================================================
// EMBEDDED MAP CARD (FOR EMP BOOKING)
// =================================================================================
export const EmbeddedTrackingMap = ({ location, destination, height = 300 }: { location: Location | null, destination?: { latitude: number; longitude: number }, height?: number }) => {
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    const openExternalMap = () => {
        if (!destination) return;
        const dAddr = `${destination.latitude},${destination.longitude}`;
        const url = Platform.select({
            ios: `maps:0,0?daddr=${dAddr}`,
            android: `google.navigation:q=${dAddr}`
        });
        if (url) Linking.openURL(url);
    };

    return (
        <View style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0f0f0', marginVertical: 10, borderWidth: 1, borderColor: '#eee' }}>
            {(!location && !destination) ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 10, color: '#666', fontSize: 13 }}>Getting your location...</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <LeafletMapView
                        location={location}
                        destination={destination}
                        mode="navigation"
                        style={{ flex: 1 }}
                        onRouteUpdated={setRouteInfo}
                    />
                </View>
            )}

            {/* NAVIGATION OVERLAY */}
            <View style={styles.overlayFooter} pointerEvents="box-none">
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        {/* Swiggy/Zomato style bold instruction */}
                        <Ionicons name="compass" size={20} color={theme.colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#111', flexShrink: 1 }} numberOfLines={1}>
                            {routeInfo?.instruction || "Head to Destination"}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#555', backgroundColor: '#e0e0e0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            {routeInfo?.distance || "--"}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>
                            {routeInfo?.duration || "--"}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={openExternalMap} style={styles.navBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};


// =================================================================================
// MODAL MAP (FOR DASHBOARD)
// =================================================================================
export const LiveTrackerModal = ({ visible, onClose, location, destination, mode = "tracking" }: LiveTrackerModalProps) => {
    const lat = location?.latitude || 0;
    const lng = location?.longitude || 0;
    const eta = location?.eta || "--";
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    const openExternalMap = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = 'Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        }) || '';
        if (url) Linking.openURL(url);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Live Tracking</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Tracking Info Card */}
                {routeInfo ? (
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="time" size={24} color={theme.colors.primary} />
                            <Text style={[styles.infoText, { fontSize: 20, fontWeight: 'bold' }]}>
                                {routeInfo.duration} <Text style={{ fontSize: 14, fontWeight: 'normal', color: '#666' }}>({routeInfo.distance})</Text>
                            </Text>
                        </View>
                        <View style={{ marginTop: 8, paddingLeft: 4 }}>
                            <Text style={{ fontSize: 16, color: '#333' }}>
                                <Ionicons name="return-up-forward" size={16} color="#333" /> {routeInfo.instruction}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.infoText}>Calculating Route...</Text>
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
                        <Text style={styles.btnText}>Open Google Maps</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
    title: { fontSize: 18, fontWeight: "700" },
    closeBtn: { padding: 8 },
    infoCard: { padding: 16, backgroundColor: "#f9f9f9", margin: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, elevation: 2 },
    infoRow: { flexDirection: "row", alignItems: "center" },
    infoText: { marginLeft: 10, fontSize: 16, fontWeight: "500" },
    mapContainer: { flex: 1, width: "100%" },
    webview: { flex: 1 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#eee" },
    fullMapBtn: { backgroundColor: theme.colors.primary, padding: 15, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    // Embedded styles
    overlayFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.98)',
        padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#ddd', zIndex: 10, elevation: 10
    },
    navBtn: {
        backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center',
        padding: 8, borderRadius: 30, elevation: 4
    }
});
