import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

export default function BookingCompleted() {
  const nav: any = useNavigation();
  const scale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timeout = setTimeout(() => nav.navigate('Home'), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [fade, scale, nav]);

  useEffect(() => {
    if (countdown <= 0) setCountdown(0);
  }, [countdown]);

  function goNow() {
    nav.navigate('Home');
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ scale }], opacity: fade }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={64} color="#fff" />
        </View>
        <Text style={styles.title}>Booking Completed</Text>
        <Text style={styles.subtitle}>Your booking was placed successfully.</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Redirecting to dashboard in</Text>
          <Text style={[styles.metaText, styles.countdown]}> {countdown}s</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={goNow} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.small}>Thank you for using Gigiman.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fbff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(width - 48, 420),
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: theme?.colors?.primary ?? '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  metaText: {
    color: '#666',
    fontSize: 13,
  },
  countdown: {
    fontWeight: '700',
    color: theme?.colors?.primary ?? '#007aff',
  },
  button: {
    marginTop: 6,
    backgroundColor: theme?.colors?.primary ?? '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  small: {
    marginTop: 18,
    color: '#9aa4b2',
    fontSize: 12,
  },
});
