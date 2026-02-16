import React, { useEffect, useRef } from "react";
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
const LeafletMapView = ({ location, destination, mode, style }: { location: Location | null, destination?: { latitude: number; longitude: number }, mode?: string, style?: any }) => {
    const webViewRef = useRef<WebView>(null);
    // Default to India center if no location yet
    const lat = location?.latitude || destination?.latitude || 20.5937;
    const lng = location?.longitude || destination?.longitude || 78.9629;
    const destLat = destination?.latitude || 0;
    const destLng = destination?.longitude || 0;
    const initialZoom = (location || destination) ? 15 : 5;

    const mapHtml = React.useMemo(() => `
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
          var map = L.map('map').setView([${lat}, ${lng}], ${initialZoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

          // SERVICER MARKER
          var marker = L.marker([${lat}, ${lng}]).addTo(map).bindPopup("${mode === 'navigation' ? 'You' : 'Servicer'}");

          // DESTINATION MARKER
          var destMarker = null;
          ${destination ? `
            destMarker = L.marker([${destLat}, ${destLng}]).addTo(map).bindPopup("Customer");
            
            // DRAW LINE
            var group = new L.featureGroup([marker, destMarker]);
            var latlngs = [ [${lat}, ${lng}], [${destLat}, ${destLng}] ];
            var polyline = L.polyline(latlngs, {color: 'blue', weight: 4, dashArray: '10, 10', opacity: 0.6}).addTo(map);
            
            map.fitBounds(group.getBounds().pad(0.2));
          ` : ''}

          window.updateLocation = function(lat, lng) {
             if(lat && lng) {
                 var newLatLng = new L.LatLng(lat, lng);
                 marker.setLatLng(newLatLng);
                 // Optional: updating polyline dynamically? 
                 // For now, simpler to leave map fitting bounds or just updating marker
             }
          };
        </script>
      </body>
    </html>
  `, []);

    useEffect(() => {
        if (location && webViewRef.current) {
            webViewRef.current.injectJavaScript(`if(window.updateLocation) window.updateLocation(${location.latitude}, ${location.longitude}); true;`);
        }
    }, [location]);

    return (
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={style}
            scrollEnabled={false}
        />
    );
};


// =================================================================================
// EMBEDDED MAP CARD (FOR EMP BOOKING)
// =================================================================================
export const EmbeddedTrackingMap = ({ location, destination, height = 300 }: { location: Location | null, destination?: { latitude: number; longitude: number }, height?: number }) => {

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
                <View style={{ flex: 1 }} pointerEvents="none">
                    <LeafletMapView
                        location={location}
                        destination={destination}
                        mode="navigation"
                        style={{ flex: 1 }}
                    />
                </View>
            )}

            <View style={styles.overlayFooter} pointerEvents="box-none">
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="navigate-circle" size={24} color={theme.colors.primary} />
                    <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#333' }}>To Customer Location</Text>
                </View>
                <TouchableOpacity onPress={openExternalMap} style={styles.navBtn} activeOpacity={0.7}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>GO</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
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

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.infoText}>ETA: {eta}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.infoText}>Servicer is on the way</Text>
                    </View>
                </View>

                <View style={styles.mapContainer}>
                    <LeafletMapView
                        location={location}
                        destination={destination}
                        mode={mode}
                        style={styles.webview}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.fullMapBtn} onPress={openExternalMap}>
                        <Text style={styles.btnText}>Open in Maps</Text>
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
    infoCard: { padding: 16, backgroundColor: "#f9f9f9", margin: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
    infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    infoText: { marginLeft: 10, fontSize: 16, fontWeight: "500" },
    mapContainer: { flex: 1, width: "100%" },
    webview: { flex: 1 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#eee" },
    fullMapBtn: { backgroundColor: theme.colors.primary, padding: 15, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    // Embedded styles
    overlayFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#eee', zIndex: 10, elevation: 10
    },
    navBtn: {
        backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center',
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 4
    }
});
