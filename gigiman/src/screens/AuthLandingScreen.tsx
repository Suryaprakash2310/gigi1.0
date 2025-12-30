import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthStack';
import CustomButton from '../components/Bottom';
import { BottomSheetType, useBottomSheet } from '../context/BottomSheetContext';
import { t } from 'i18next';

const { width, height } = Dimensions.get('screen');
type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;

export default function AuthLandingScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { openSheet } = useBottomSheet();

  // Animations
  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(60)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const bgMove = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade + Slide intro
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse Logo Infinity
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Background movement
    Animated.loop(
      Animated.timing(bgMove, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const handleCategorySelect = (category: string) => {
    if (category === 'TOOL_SHOP') {
      navigation.navigate('ToolShopDetail');
    } else {
      navigation.navigate('EmployeeDetail', { role: category });
    }
  };

  // BG animation translate
  const bgTranslateX = bgMove.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const bgTranslateY = bgMove.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <View style={styles.wrapper}>

      {/* Moving Gradient Spotlight */}
      <Animated.View
        style={[
          styles.spotlight,
          { transform: [{ translateX: bgTranslateX }, { translateY: bgTranslateY }] },
        ]}
      />

      {/* Floating Glow Dots */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.topContainer,
          { opacity: fade, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulse }] }]}>
          <Image
            source={require('../../assets/icons/gigiman_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.title}>{t('common.welcome')}</Text>
        <Text style={styles.subtitle}>Empowering Gray Collar Services</Text>
      </Animated.View>

      {/* Bottom Buttons */}
      <Animated.View
        style={[
          styles.bottomContainer,
          { opacity: fade, transform: [{ translateY: slideUp }] },
        ]}
      >
        <CustomButton
          title="Login"
          onPress={() => navigation.navigate('phone')}
          widthCount={0.85}
        />

        <Pressable
          onPress={() =>
            openSheet(BottomSheetType.REGISTRATION_CATAGORY_SHEET, {
              onSelect: handleCategorySelect,
            })
          }
        >
          <Text style={styles.createAccountText}>Create Account</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7ff',
    overflow: 'hidden',
  },

  /* Animated Spotlight */
  spotlight: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(112, 119, 255, 0.25)',
    top: -200,
    left: -200,
    opacity: 0.6,
  },

  /* Glow Circles */
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(180, 90, 255, 0.15)',
    top: 40,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 80,
    backgroundColor: 'rgba(90, 220, 255, 0.15)',
    bottom: 80,
    left: -30,
  },

  topContainer: {
    flex: 3.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  logoWrapper: {
    width: width * 0.52,
    height: width * 0.52,
    borderRadius: width * 0.28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },

  logo: {
    width: '78%',
    height: '78%',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 22,
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

  bottomContainer: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },

  createAccountText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
