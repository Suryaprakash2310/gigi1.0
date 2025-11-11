import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface WorkingModeToggleProps {
  initialValue?: boolean;
  onToggle?: (value: boolean) => void;
}

export const WorkingModeToggle: React.FC<WorkingModeToggleProps> = ({
  initialValue = false,
  onToggle,
}) => {
  const [isActive, setIsActive] = useState(initialValue);
  const animation = useRef(new Animated.Value(initialValue ? 1 : 0)).current;

  // Animate whenever state changes
  useEffect(() => {
    Animated.timing(animation, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handleToggle = () => {
    const newValue = !isActive;
    setIsActive(newValue);
    onToggle?.(newValue);
  };

  // interpolate background color
  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#A79B94', theme.colors.primary],
  });

  // interpolate circle position
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.09],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleToggle}>
    <View style={[styles.wrapper, { borderColor: isActive ? theme.colors.text : '#A89F9A' }]}>
      <View style={styles.labelContainer}>
          <Ionicons
            name={isActive ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={isActive ? theme.colors.text : '#999'}
          />
          <Text style={[styles.label, { color: isActive ? theme.colors.text : '#777' }]}>
            {isActive ? 'Working Mode: ON' : 'Working Mode: OFF'}
          </Text>
        </View>

        {/* Switch toggle */}
        <Animated.View style={[styles.container, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ translateX }],
              },
            ]}
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
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 14,
    backgroundColor: '#FFFDFD',
  },
  container: {
    width: width * 0.18,
    height: width * 0.09,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
