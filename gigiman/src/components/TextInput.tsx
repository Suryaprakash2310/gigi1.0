import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  KeyboardTypeOptions,
  TouchableWithoutFeedback,
} from 'react-native';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  maxLength?: number;
  multiline?: boolean;
}

const FloatingLabelInput: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  multiline = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const isFloating = isFocused || Boolean(value);

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFloating ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFloating]);

  const labelTop = animatedIsFocused.interpolate({
    inputRange: [0, 1],
    outputRange: [multiline ? 16 : 17, 7],
  });

  const labelFontSize = animatedIsFocused.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11],
  });

  const labelColor = animatedIsFocused.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9CA3AF', error ? '#FF4D4F' : isFocused ? '#111827' : '#6B7280'],
  });

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.inputContainer,
            multiline && styles.multilineContainer,
            {
              borderColor: error
                ? '#FF4D4F'
                : isFocused
                ? '#111827'
                : '#D1D5DB',
            },
          ]}
        >
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
              },
            ]}
          >
            {label}
          </Animated.Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            style={[
              styles.input,
              isFloating && !multiline && styles.inputWithFloatingLabel,
              multiline && styles.multilineInput,
            ]}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline={multiline}
            blurOnSubmit={!multiline}
            placeholder={isFocused && !value ? placeholder : ''}
            placeholderTextColor="#9CA3AF"
            maxLength={maxLength}
          />
        </View>
      </TouchableWithoutFeedback>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default FloatingLabelInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    borderWidth: 1.2,
    borderRadius: 12,
    backgroundColor: '#fff',
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  multilineContainer: {
    height: 'auto',
    minHeight: 90,
    paddingTop: 24,
    paddingBottom: 10,
    justifyContent: 'flex-start',
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    width: '100%',
  },
  inputWithFloatingLabel: {
    marginTop: 14,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 56,
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 4,
  },
});
