import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// // ✅ Gradient import + web fallback
// let LinearGradient: any;
// if (Platform.OS === "web") {
//   LinearGradient = ({ style, children }: any) => (
//     <View
//       style={[
//         style,
//         {
//           backgroundImage: "linear-gradient(90deg, #E60073, #A600FF)",
//         },
//       ]}
//     >
//       {children}
//     </View>
//   );
// } else {
//   const { LinearGradient: ExpoLinearGradient } = require("expo-linear-gradient");
//   LinearGradient = ExpoLinearGradient;
// }
const { LinearGradient: ExpoLinearGradient } = require("expo-linear-gradient");
   //LinearGradient = ExpoLinearGradient;

interface BottomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  widthCount? : number;
}

export default function BottomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  widthCount = width * 0.9,
}: BottomButtonProps) {
  const insets = useSafeAreaInsets();

  // 🔹 Responsive sizes
  const buttonWidth = width * 0.9; // 90% width with safe horizontal spacing
  const sideMargin = width * 0.01;
  const paddingVertical = Math.max(height * 0.018, 12);
  const fontSize = Math.max(width * 0.045, 14);
  const dotSize = Math.max(width * 0.018, 6);

  // 🔹 Animated loading dots
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    if (loading) {
      const animations = dots.map((dot, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 200),
            Animated.timing(dot, {
              toValue: -8,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.forEach((anim) => anim.start());
      return () => animations.forEach((anim) => anim.stop());
    }
  }, [loading]);

  return (
    <View
      style={[
        styles.container,
        { width: width * widthCount,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 22,
          paddingHorizontal: sideMargin, // ✅ ensures no screen edge touch
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled || loading}
        onPress={onPress}
        style={{ width: "100%", maxWidth: 500 }}
      >
        <LinearGradient
          colors={disabled ? ["#999", "#777"] : ["#8e2e0cff", "#8e2e0cff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              paddingVertical,
              borderRadius: buttonWidth * 0.1,
            },
          ]}
        >
          {loading ? (
            <View style={styles.dotContainer}>
              {dots.map((dot, index) => (
                <Animated.View
                  key={index}
                  style={[
                    {
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                      marginHorizontal: dotSize * 0.3,
                      backgroundColor: "#fff",
                      transform: [{ translateY: dot }],
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.text, { fontSize }]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    //position: "absolute",
    //bottom: 0,
    //width: "100%",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  text: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  dotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
