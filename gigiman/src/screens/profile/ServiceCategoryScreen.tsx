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

import { ServiceAPI } from '@/api/service';

const getIconForDomain = (name: string): any => {
  const lower = name.toLowerCase();
  if (lower.includes('ac') || lower.includes('air conditioning')) return 'snow-outline';
  if (lower.includes('elect')) return 'flash-outline';
  if (lower.includes('plumb')) return 'water-outline';
  if (lower.includes('carpen') || lower.includes('wood')) return 'hammer-outline';
  if (lower.includes('paint')) return 'brush-outline';
  if (lower.includes('clean')) return 'sparkles-outline';
  if (lower.includes('tv') || lower.includes('appliance')) return 'tv-outline';
  if (lower.includes('mechanic') || lower.includes('car') || lower.includes('bike')) return 'car-outline';
  return 'construct-outline';
};

const ServiceCategoryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await ServiceAPI.getAll();
        if (data && data.services) {
          const mapped = data.services.map((item: any) => ({
            id: item._id,
            name: item.domainName,
            icon: getIconForDomain(item.domainName),
            isExpanded: false,
            subservices: null,
            subservicesLoading: false,
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching service categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    if (cat.isExpanded) {
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, isExpanded: false } : c))
      );
      return;
    }

    if (cat.subservices) {
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, isExpanded: true } : c))
      );
      return;
    }

    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, subservicesLoading: true, isExpanded: true } : c))
    );

    try {
      const res = await ServiceAPI.getSubservices(id);
      const subserviceList =
        res?.services?.flatMap((s: any) =>
          (s.serviceCategory || []).map((c: any) => ({
            id: c._id,
            name: c.serviceCategoryName,
            price: c.price,
            duration: c.durationInMinutes,
            employees: c.employeeCount,
            parentName: s.serviceName,
          }))
        ) || [];

      setCategories(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, subservices: subserviceList, subservicesLoading: false }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to load subservices:', err);
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, subservicesLoading: false, isExpanded: false } : c))
      );
    }
  };

  const renderItem = ({ item }: any) => {
    const showChevron = item.isExpanded ? 'chevron-down' : 'chevron-forward';

    return (
      <View style={styles.categoryCardContainer}>
        <TouchableOpacity
          style={styles.categoryCard}
          activeOpacity={0.7}
          onPress={() => toggleCategory(item.id)}
        >
          <View style={styles.iconBox}>
            <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.categoryName}>{item.name}</Text>
          </View>
          <Ionicons name={showChevron} size={20} color="#CCC" />
        </TouchableOpacity>

        {item.isExpanded && (
          <View style={styles.subservicesContainer}>
            {item.subservicesLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
            ) : item.subservices && item.subservices.length > 0 ? (
              item.subservices.map((sub: any) => (
                <View key={sub.id} style={styles.subserviceRow}>
                  <View style={styles.subserviceLeft}>
                    <Text style={styles.subserviceName}>{sub.name}</Text>
                    {sub.parentName && (
                      <Text style={styles.subserviceParent}>{sub.parentName}</Text>
                    )}
                    <View style={styles.subserviceMeta}>
                      <Text style={styles.metaText}>⏱ {sub.duration} mins</Text>
                      <Text style={styles.metaText}>👨‍🔧 {sub.employees}</Text>
                    </View>
                  </View>
                  <Text style={styles.subservicePrice}>₹{sub.price}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noSubservicesText}>No subservices found</Text>
            )}
          </View>
        )}
      </View>
    );
  };

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
  categoryCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  subservicesContainer: {
    backgroundColor: '#FAFBFD',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  subserviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  subserviceLeft: {
    flex: 1,
    marginRight: 12,
  },
  subserviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subserviceParent: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  subserviceMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#666',
  },
  subservicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
  },
  noSubservicesText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default ServiceCategoryScreen;
