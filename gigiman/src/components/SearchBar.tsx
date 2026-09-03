// src/components/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface SearchBarProps<T> {
  placeholder?: string;
  data: T[];
  searchKey: keyof T;
  onResults: (filteredData: T[]) => void;
}

export default function SearchBar<T>({
  placeholder = 'Search...',
  data,
  searchKey,
  onResults,
}: SearchBarProps<T>) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (query.trim() === '') {
      onResults(data);
    } else {
      const filtered = data.filter(item => {
        const value = String(item[searchKey]).toLowerCase();
        return value.includes(query.toLowerCase());
      });
      onResults(filtered);
    }
  }, [query, data]);

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#888" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={query}
        onChangeText={setQuery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
});
