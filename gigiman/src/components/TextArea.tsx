import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  numberOfLines?: number;
}

const TextAreaInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  numberOfLines = 4,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#999', '#090909ff'],
    }),
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error
              ? '#FF4D4F'
              : isFocused
              ? 'black'
              : '#E0E0E0',
          },
        ]}
      >
        <Animated.Text style={labelStyle}>{label}</Animated.Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.textArea}
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top" // 👈 ensures text starts at top-left
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#999"
          

        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default TextAreaInput;

const styles = StyleSheet.create({
  container: {
    width: '90%',
  },
  inputContainer: {
    borderWidth: 1.2,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 18 : 14,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
    paddingHorizontal: 16,
    minHeight: 120, // 👈 ensures a larger box like textarea
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 4,
  },
});
