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
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.inputContainer,
            {
              borderColor: error
                ? '#FF4D4F'
                : isFocused
                ? 'black'
                : '#4a4949ff',
            },
          ]}
        >
          <Animated.Text pointerEvents="none" style={labelStyle}>{label}</Animated.Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            style={styles.input}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline={multiline}
            blurOnSubmit
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor="#999"
            maxLength={maxLength}
          />
        </View>
      </TouchableWithoutFeedback>

      {error ? <Text style={styles.errorText}>{error} </Text> : null}
    </View>
  );
};

export default FloatingLabelInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    //marginBottom: 20,
  },
  inputContainer: {
    borderWidth: 1.2,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 18 : 14,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
   //height: 100, // or any fixed height you need
  //textAlign: 'center',         // horizontal centering
  textAlignVertical: 'center', // vertical centering (Android only)
  //padding: 10,
  //borderWidth: 1,
  //borderColor: '#ccc',
  //borderRadius: 8,
  fontSize: 16,
  width: '100%',
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 4,
  },
});
