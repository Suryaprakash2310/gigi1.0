import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { socket } from "../socket/socket";
import * as Location from "expo-location";
import { theme } from "../theme/theme";
import { useLiveTracking } from "../hooks/useLiveTracking";

export const UserLiveTrackingScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookingId } = route.params as { bookingId: string };

    const webViewRef = useRef<WebView>(null);
    const [servicerLocation, setServicerLocation] = useState<{ latitude: number; longitude: number; heading?: number; eta?: string } | null>(null);

    const eta = servicerLocation?.eta || "Calculating...";

    /* ======================================================
       GET USER'S OWN LOCATION
    ====================================================== */
    const userLocation = useLiveTracking(bookingId, true);

    /* ======================================================
       SOCKET LISTENER (USER SIDE)
    ====================================================== */
    useEffect(() => {
        if (!bookingId) return;

        // Ensure socket is connected
        if (!socket.connected) {
            console.log("🔌 Socket not connected, connecting...");
            socket.connect();
        }

        // 1. Join Tracking Room
        console.log(`🔌 Joining tracking room: ${bookingId}`);
        socket.emit("join-tracking", { bookingId });

        // 2. Listen for Location Updates
        const handleLocationUpdate = (data: any) => {
            console.log("📍 User received servicer location:", data);

            if (data.bookingId === bookingId || data.latitude) {
                setServicerLocation({
                    latitude: data.latitude,
                    longitude: data.longitude,
                    heading: data.heading,
                    eta: data.eta,
                });
            }
        };

        socket.on("servicer-location-update", handleLocationUpdate);

        return () => {
            socket.off("servicer-location-update", handleLocationUpdate);
        };
    }, [bookingId]);

    /* ======================================================
       MAP RENDERING (LEAFLET VIA WEBVIEW)
    ====================================================== */
    const mapHtml = React.useMemo(() => {
        const userLat = userLocation?.latitude || 20.5937;
        const userLng = userLocation?.longitude || 78.9629;
        const zoom = userLocation ? 15 : 5;

        return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
          #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${userLat}, ${userLng}], ${zoom});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          // USER marker (green) - customer's own location
          var userIcon = L.divIcon({
            html: '<div style="background:#4CAF50;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            className: ''
          });
          var userMarker = L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map).bindPopup("You");

          // SERVICER marker (blue) - updated via socket
          var servicerIcon = L.divIcon({
            html: '<div style="background:#2196F3;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            className: ''
          });
          var servicerMarker = null;
          var polyline = null;

          // Called from React Native when servicer location arrives
          window.updateServicerLocation = function(lat, lng) {
            if (!lat || !lng) return;
            var newLatLng = new L.LatLng(lat, lng);
            
            if (!servicerMarker) {
              servicerMarker = L.marker(newLatLng, { icon: servicerIcon }).addTo(map).bindPopup("Technician");
            } else {
              servicerMarker.setLatLng(newLatLng);
            }

            // Draw dashed line between servicer and user
            var userLatLng = userMarker.getLatLng();
            if (polyline) map.removeLayer(polyline);
            polyline = L.polyline([newLatLng, userLatLng], {
              color: '#2196F3', weight: 3, dashArray: '8, 8', opacity: 0.7
            }).addTo(map);

            // Fit bounds to show both markers
            var group = new L.featureGroup([userMarker, servicerMarker]);
            map.fitBounds(group.getBounds().pad(0.3));
          };

          // Called from React Native when user's own location updates
          window.updateUserLocation = function(lat, lng) {
            if (!lat || !lng) return;
            userMarker.setLatLng(new L.LatLng(lat, lng));
          };
        </script>
      </body>
    </html>
    `;
    }, [userLocation?.latitude, userLocation?.longitude]);

    // Inject servicer location updates into WebView
    useEffect(() => {
        if (servicerLocation && webViewRef.current) {
            webViewRef.current.injectJavaScript(
                `if(window.updateServicerLocation) window.updateServicerLocation(${servicerLocation.latitude}, ${servicerLocation.longitude}); true;`
            );
        }
    }, [servicerLocation]);

    // Inject user location updates into WebView
    useEffect(() => {
        if (userLocation && webViewRef.current) {
            webViewRef.current.injectJavaScript(
                `if(window.updateUserLocation) window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude}); true;`
            );
        }
    }, [userLocation]);

    const openExternalMap = () => {
        if (!servicerLocation) return;
        const latLng = `${servicerLocation.latitude},${servicerLocation.longitude}`;
        const label = "Technician Location";
        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${latLng}`,
            android: `geo:0,0?q=${latLng}(${label})`,
        });
        if (url) Linking.openURL(url);
    };

    const hasMapData = userLocation || servicerLocation;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Track Technician</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Map View */}
            <View style={styles.mapContainer}>
                {hasMapData ? (
                    <WebView
                        ref={webViewRef}
                        originWhitelist={["*"]}
                        source={{ html: mapHtml }}
                        style={styles.webview}
                        scrollEnabled={false}
                    />
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={{ marginTop: 10, color: "#666" }}>Getting your location...</Text>
                    </View>
                )}
            </View>

            {/* Bottom Sheet Info */}
            <View style={styles.bottomSheet}>
                <View style={styles.handle} />

                <View style={styles.etaRow}>
                    <View>
                        <Text style={styles.etaLabel}>Arriving in</Text>
                        <Text style={styles.etaValue}>{eta}</Text>
                    </View>
                    <View style={[styles.statusBadge, servicerLocation ? {} : { backgroundColor: "#FFF3E0" }]}>
                        <Text style={[styles.statusText, servicerLocation ? {} : { color: "#E65100" }]}>
                            {servicerLocation ? "On the way" : "Waiting..."}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={openExternalMap}>
                        <Ionicons name="map-outline" size={24} color="#fff" />
                        <Text style={styles.actionText}>Open Maps</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}>
                        <Ionicons name="call-outline" size={24} color="#fff" />
                        <Text style={styles.actionText}>Call</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: "#fff",
        zIndex: 1,
    },
    backBtn: {},
    title: { fontSize: 18, fontWeight: "bold" },
    mapContainer: { flex: 1, position: "relative" },
    webview: { flex: 1 },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
    },
    bottomSheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 20,
    },
    etaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    etaLabel: { fontSize: 14, color: "#888", marginBottom: 4 },
    etaValue: { fontSize: 24, fontWeight: "bold", color: "#333" },
    statusBadge: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: { color: "#2E7D32", fontWeight: "600", fontSize: 12 },
    divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 20 },
    actions: { flexDirection: "row", gap: 16 },
    actionBtn: {
        flex: 1,
        backgroundColor: "#000",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    actionText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
