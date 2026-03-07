import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { socket } from "@/socket/socket";

export const useLiveTracking = (
    bookingId?: string,
    enabled: boolean = true
) => {
    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number;
        longitude: number;
        heading: number | null;
    } | null>(null);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        let isMounted = true;

        const startTracking = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    (location) => {
                        if (!isMounted) return;

                        const { latitude, longitude, heading } = location.coords;

                        // Update local state so the UI can show the marker
                        setCurrentLocation({ latitude, longitude, heading });

                        // Emit to server for others to track
                        socket.emit("send-location", {
                            bookingId,
                            location: {
                                latitude,
                                longitude,
                                heading,
                            },
                        });
                    }
                );
            } catch (err) {
                console.log("Tracking error:", err);
            }
        };

        if (enabled && bookingId) {
            startTracking();
        }

        return () => {
            isMounted = false;

            if (subscription && typeof subscription.remove === "function") {
                try {
                    subscription.remove();
                } catch (err) {
                    console.log("Safe remove error:", err);
                }
            }
        };
    }, [bookingId, enabled]);

    return currentLocation;
};
