import { Audio } from "expo-av";
import { Vibration } from "react-native";

let sound: Audio.Sound | null = null;

/**
 * Play the booking alert sound in a continuous loop.
 * Prevents duplicate playback — safe to call multiple times.
 */
export const playBookingSound = async () => {
  try {
    if (sound) return; // already playing — prevent duplicate

    const { sound: newSound } = await Audio.Sound.createAsync(
      require("../../assets/sounds/booking_alert.wav"),
      { isLooping: true }
    );

    sound = newSound;
    await sound.playAsync();

    // Start vibration pattern: 500ms vibrate, 500ms pause, repeat
    Vibration.vibrate([500, 500], true);

    console.log("🔊 Booking alert sound started");
  } catch (err) {
    console.log("🔊 Sound play error:", err);
  }
};

/**
 * Stop the booking alert sound and clean up resources.
 * Safe to call even when no sound is playing.
 */
export const stopBookingSound = async () => {
  try {
    Vibration.cancel();

    if (!sound) return;

    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;

    console.log("🔇 Booking alert sound stopped");
  } catch (err) {
    console.log("🔇 Sound stop error:", err);
  }
};
