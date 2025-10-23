import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { ServiceCard } from './ServiceCard';
import { theme } from '../../theme/theme';
import { SERVICES } from '../../utils/config/services.config';

export const ServiceSheet = () => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchPlaceholder}>🔍 Search</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {SERVICES.map((service) => (
          <ServiceCard
            key={service.id}
            title={service.title}
            icon={service.icon}
            onPress={() => console.log('Selected:', service.title)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  searchBar: {
    backgroundColor: '#d6e5fa',
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  searchPlaceholder: {
    color: '#666',
    fontFamily: theme.typography.body.fontFamily,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
