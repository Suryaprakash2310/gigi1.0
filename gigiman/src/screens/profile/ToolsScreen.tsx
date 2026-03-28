import React, { useState } from 'react';
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

const ToolsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState([
    { id: '1', name: 'Power Drill Set', domain: 'Electrical', available: 5 },
    { id: '2', name: 'Pipe Wrench', domain: 'Plumbing', available: 12 },
    { id: '3', name: 'Welding Machine', domain: 'Heavy Duty', available: 2 },
    { id: '4', name: 'Multi-meter', domain: 'Electrical', available: 8 },
    { id: '5', name: 'Ladder (10ft)', domain: 'General', available: 15 },
  ]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.toolCard}>
      <View style={styles.iconBox}>
        <Ionicons name="construct-outline" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.toolName}>{item.name}</Text>
        <Text style={styles.domainName}>{item.domain}</Text>
      </View>
      <View style={styles.availabilityBox}>
        <Text style={styles.availText}>{item.available} in stock</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Tools & Inventory" showBack onBackPress={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tools}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  toolCard: {
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
  toolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  domainName: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  availabilityBox: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  availText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default ToolsScreen;
