import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface WorkingModeToggleProps {
  value: boolean;                 // ✅ controlled
  onToggle: (value: boolean) => void;
}

export const WorkingModeToggle: React.FC<WorkingModeToggleProps> = ({
  value,
  onToggle,
}) => {
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: value ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#A79B94', theme.colors.primary],
  });

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.09],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onToggle(!value)}>
      <View style={[styles.wrapper, { borderColor: value ? theme.colors.text : '#A89F9A' }]}>
        <View style={styles.labelContainer}>
          <Ionicons
            name={value ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={value ? theme.colors.text : '#999'}
          />
          <Text style={[styles.label, { color: value ? theme.colors.text : '#777' }]}>
            {value ? 'Working Mode: ON' : 'Working Mode: OFF'}
          </Text>
        </View>

        <Animated.View style={[styles.container, { backgroundColor }]}>
          <Animated.View
            style={[styles.circle, { transform: [{ translateX }] }]}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 3,
    padding: 5,
    borderRadius: 14,
    backgroundColor: '#FFFDFD',
  },
  container: {
    width: width * 0.18,
    height: width * 0.09,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
  },
  circle: {
    width: width * 0.07,
    height: width * 0.07,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 5,
    fontWeight: '600',
    fontSize: width * 0.035,
  },
});
