import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import AppHeader from '@/components/AppHeader';
import { useNavigation } from '@react-navigation/native';

const ServiceCategoryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([
    { id: '1', name: 'AC Repair', icon: 'snow-outline', count: 12 },
    { id: '2', name: 'Electrical', icon: 'flash-outline', count: 45 },
    { id: '3', name: 'Plumbing', icon: 'water-outline', count: 32 },
    { id: '4', name: 'Carpentry', icon: 'hammer-outline', count: 18 },
    { id: '5', name: 'Painting', icon: 'brush-outline', count: 24 },
    { id: '6', name: 'Cleaning', icon: 'sparkles-outline', count: 56 },
  ]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.iconBox}>
        <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.providerCount}>{item.count} Providers</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Service Categories" showBack onBackPress={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    marginLeft: 16,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  providerCount: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});

export default ServiceCategoryScreen;
