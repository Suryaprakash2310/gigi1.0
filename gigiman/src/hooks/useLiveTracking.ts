import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { socket } from "@/socket/socket";

export const useLiveTracking = (
    bookingId?: string,
    enabled: boolean = true
) => {
    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

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

                        socket.emit("send-location", {
                            bookingId,
                            location: {
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                heading: location.coords.heading,
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
};