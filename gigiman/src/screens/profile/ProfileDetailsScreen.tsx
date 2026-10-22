import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme/theme';
import { ProfileContext } from '@/context/ProfileContext';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '@/components/AppHeader';
import { ServiceAPI, Service } from '@/api/service';

const getIconForDomain = (name: string): keyof typeof Ionicons.glyphMap => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('ac') || lower.includes('air condition')) return 'snow-outline';
  if (lower.includes('elect')) return 'flash-outline';
  if (lower.includes('plumb')) return 'water-outline';
  if (lower.includes('carpen') || lower.includes('wood')) return 'hammer-outline';
  if (lower.includes('paint')) return 'brush-outline';
  if (lower.includes('clean')) return 'sparkles-outline';
  if (lower.includes('tv') || lower.includes('appliance') || lower.includes('fridge') || lower.includes('refrigerator')) return 'tv-outline';
  if (lower.includes('mechanic') || lower.includes('car') || lower.includes('bike') || lower.includes('auto')) return 'car-outline';
  if (lower.includes('cctv') || lower.includes('security')) return 'videocam-outline';
  if (lower.includes('pest')) return 'bug-outline';
  return 'construct-outline';
};

const ProfileDetailsScreen = () => {
  const { profile, refreshProfile } = useContext(ProfileContext);
  const navigation = useNavigation<any>();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    refreshProfile?.();
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const res = await ServiceAPI.getAll();
        if (res && res.services && Array.isArray(res.services)) {
          setAllServices(res.services);
        }
      } catch (err) {
        console.warn('Could not fetch services list for mapping:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Compute normalized capable services list from backend profile data
  const capableServices = useMemo(() => {
    if (!profile) return [];

    const rawList =
      profile.services ||
      profile.capableservice ||
      profile.capableServices ||
      profile.serviceCategories ||
      profile.domainServices ||
      profile.toolDomains ||
      profile.categories ||
      [];

    if (!Array.isArray(rawList)) {
      if (typeof rawList === 'string' && rawList.trim()) {
        return [{ id: '1', name: rawList.trim(), icon: getIconForDomain(rawList) }];
      }
      return [];
    }

    return rawList.map((item: any, index: number) => {
      // 1. If it's an object with domainName, domainpartname, or name
      if (typeof item === 'object' && item !== null) {
        const id = item._id || item.id || `srv-${index}`;
        const name =
          item.domainName ||
          item.domainpartname ||
          item.serviceName ||
          item.name ||
          item.title ||
          'Service';
        const image = item.serviceImage || item.domainpartimage || item.image;
        return {
          id,
          name,
          image,
          icon: getIconForDomain(name),
        };
      }

      // 2. If it's a string ID or name
      if (typeof item === 'string') {
        // Check if it matches an ID in allServices
        const matched = allServices.find((s) => s._id === item);
        if (matched) {
          return {
            id: matched._id,
            name: matched.domainName,
            image: matched.serviceImage,
            icon: getIconForDomain(matched.domainName),
          };
        }
        // Otherwise treat as domain name
        return {
          id: `srv-${index}`,
          name: item,
          icon: getIconForDomain(item),
        };
      }

      return {
        id: `srv-${index}`,
        name: 'Service',
        icon: 'construct-outline' as keyof typeof Ionicons.glyphMap,
      };
    });
  }, [profile, allServices]);

  if (!profile) return null;

  const renderDetailItem = (
    icon: string,
    label: string,
    value: string | number | undefined,
    color: string = '#444'
  ) => (
    <View style={styles.detailItem}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const getRoleName = () => {
    switch (profile.role) {
      case 'SINGLE_EMPLOYEE':
        return 'Service Provider';
      case 'MULTI_EMPLOYEE':
        return 'Service Team';
      case 'TOOL_SHOP':
        return 'Tool Shop';
      default:
        return profile.role || 'Service Provider';
    }
  };

  const isToolShop = profile.role === 'TOOL_SHOP';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Profile Details"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={
              (profile.avatar
                ? { uri: profile.avatar }
                : require('../../../assets/icon.png')) as ImageSourcePropType
            }
            style={styles.avatar}
          />
          <View style={styles.profileMainInfo}>
            <Text style={styles.name}>
              {profile.fullname || profile.shopName || profile.ownerName || 'Service Partner'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{getRoleName()}</Text>
            </View>
            {profile.verified === 'Yes' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.verifiedText}>Verified Provider</Text>
              </View>
            )}
          </View>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            {renderDetailItem('call-outline', 'Phone Number', profile.phoneNo || profile.phoneMasked)}
            <View style={styles.divider} />
            {renderDetailItem(
              'location-outline',
              'Address / Location',
              profile.address || profile.storeLocation || profile.location?.address
            )}
            {profile.empId || profile.TeamId || profile.toolShopId ? (
              <>
                <View style={styles.divider} />
                {renderDetailItem(
                  'finger-print-outline',
                  'Provider ID',
                  profile.empId || profile.TeamId || profile.toolShopId
                )}
              </>
            ) : null}
            {profile.ownerName && profile.shopName ? (
              <>
                <View style={styles.divider} />
                {renderDetailItem('person-outline', 'Owner Name', profile.ownerName)}
              </>
            ) : null}
          </View>
        </View>

        {/* ═══════════════════════════════════════
            CAPABLE SERVICES / REGISTERED SKILLS SECTION
        ═══════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>
                {isToolShop ? 'Tool Shop Domains' : 'Capable Services'}
              </Text>
              {capableServices.length > 0 && (
                <View style={styles.serviceCountBadge}>
                  <Text style={styles.serviceCountText}>
                    {capableServices.length} {capableServices.length === 1 ? 'Skill' : 'Skills'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {loadingServices && capableServices.length === 0 ? (
            <View style={[styles.card, { paddingVertical: 20, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.emptySubText}>Loading capable services...</Text>
            </View>
          ) : capableServices.length > 0 ? (
            <View style={styles.servicesGrid}>
              {capableServices.map((service, index) => (
                <View key={service.id || index} style={styles.serviceCardItem}>
                  <View style={styles.serviceIconCircle}>
                    {service.image ? (
                      <Image
                        source={{ uri: service.image }}
                        style={styles.serviceImageThumbnail}
                      />
                    ) : (
                      <Ionicons
                        name={service.icon}
                        size={22}
                        color={theme.colors.primary}
                      />
                    )}
                  </View>

                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={2}>
                      {service.name}
                    </Text>
                    <View style={styles.capableBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                      <Text style={styles.capableBadgeText}>Capable</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyServicesCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="construct-outline" size={26} color="#AAA" />
              </View>
              <Text style={styles.emptyTitle}>No capable services assigned</Text>
              <Text style={styles.emptySubText}>
                Your registered service capabilities retrieved from the system will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile' as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eee',
  },
  profileMainInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  serviceCountBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  serviceCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F2',
    marginHorizontal: 16,
  },
  servicesGrid: {
    gap: 10,
  },
  serviceCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1.5,
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  serviceImageThumbnail: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  capableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  capableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyServicesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default ProfileDetailsScreen;
