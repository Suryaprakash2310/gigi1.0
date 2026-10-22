import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { parseCoordinates, getDirectionsUrl } from '@/utils/location';

interface UserDetailContainerProps {
  name: string;
  serviceCategoryName: string;
  cost: string;
  advancePaid?: string;
  remainingAmount?: string;
  durationInMinutes?: string;
  employeeCount: string;
  address: string;
  coordinates?: any;
  serviceTime?: string;
  bookingNumber?: string;
  bookingStatus?: string;
  onCallPress?: () => void;
  isCalling?: boolean;
}

export const UserDetailContainer = ({
  name,
  serviceCategoryName,
  cost,
  advancePaid,
  remainingAmount,
  durationInMinutes,
  employeeCount,
  address,
  coordinates,
  serviceTime,
  bookingNumber,
  bookingStatus = "Confirmed",
  onCallPress,
  isCalling = false,
}: UserDetailContainerProps) => {

  const openAddressInMap = () => {
    const coords = coordinates ? parseCoordinates(coordinates) : (address ? parseCoordinates(address) : null);
    if (coords) {
      const url = getDirectionsUrl(coords);
      Linking.openURL(url).catch(() => {
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
        Linking.openURL(fallbackUrl);
      });
    } else if (address && address !== '-' && address !== 'Customer Location') {
      const encoded = encodeURIComponent(address);
      const url = Platform.select({
        ios: `maps:0,0?q=${encoded}`,
        android: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      });
      if (url) Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View style={styles.sheetCard}>

      {/* Header: Title & Booking Tag */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>Booking Details</Text>
        <View style={styles.headerMetaRight}>
          {bookingNumber ? (
            <Text style={styles.bookingNumberText}>{bookingNumber}</Text>
          ) : null}
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{bookingStatus}</Text>
          </View>
        </View>
      </View>

      {/* Customer Information Card */}
      <View style={styles.customerCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={24} color="#0D9488" />
        </View>

        <View style={styles.customerDetails}>
          <Text style={styles.customerName} numberOfLines={1}>{name || "Customer"}</Text>
          <TouchableOpacity
            style={styles.customerSubRow}
            onPress={openAddressInMap}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={13} color="#0D9488" style={{ marginRight: 3, marginTop: 1 }} />
            <Text style={[styles.customerLocationText, { color: '#0D9488', fontWeight: '500' }]} numberOfLines={1}>
              {address && address !== '-' ? address : 'Customer Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {onCallPress && (
          <TouchableOpacity
            style={[styles.callCustomerBtn, isCalling && { opacity: 0.6 }]}
            onPress={onCallPress}
            activeOpacity={0.8}
            disabled={isCalling}
          >
            <Ionicons name="call" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.callCustomerBtnText}>
              {isCalling ? "Calling..." : "Call\nCustomer"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Detail Rows (Clean & Minimalist like Screenshot) */}
      <View style={styles.detailsList}>
        {/* Date & Time */}
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Date & Time</Text>
          </View>
          <Text style={styles.detailValue}>{serviceTime || 'Scheduled'}</Text>
        </View>

        {/* Service */}
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="briefcase-outline" size={18} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Service</Text>
          </View>
          <Text style={styles.detailValue} numberOfLines={2}>{serviceCategoryName}</Text>
        </View>

        {/* Duration */}
        {durationInMinutes ? (
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="time-outline" size={18} color="#64748B" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Duration</Text>
            </View>
            <Text style={styles.detailValue}>{durationInMinutes}</Text>
          </View>
        ) : null}

        {/* Total Cost */}
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="cash-outline" size={18} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Total Cost</Text>
          </View>
          <Text style={[styles.detailValue, { fontWeight: '700', color: '#0F172A' }]}>{cost}</Text>
        </View>

        {/* Advance / Remaining if applicable */}
        {advancePaid ? (
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Advance Paid</Text>
            </View>
            <Text style={[styles.detailValue, { color: '#059669', fontWeight: '600' }]}>{advancePaid}</Text>
          </View>
        ) : null}

        {remainingAmount ? (
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="alert-circle-outline" size={18} color="#EA580C" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Remaining Amount</Text>
            </View>
            <Text style={[styles.detailValue, { color: '#C2410C', fontWeight: '700' }]}>{remainingAmount}</Text>
          </View>
        ) : null}

        {/* Address Row */}
        <TouchableOpacity
          style={[styles.detailRow, { borderBottomWidth: 0 }]}
          onPress={openAddressInMap}
          activeOpacity={0.7}
        >
          <View style={[styles.detailLeft, { alignSelf: 'flex-start', marginTop: 2 }]}>
            <Ionicons name="location-outline" size={18} color="#0D9488" style={styles.detailIcon} />
            <Text style={[styles.detailLabel, { color: '#0D9488' }]}>Address</Text>
          </View>
          <View style={styles.addressRight}>
            <Text style={styles.addressText} numberOfLines={3}>
              {address}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  customerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerLocationText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
  callCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#0D9488',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  callCustomerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 10,
    width: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '55%',
  },
  addressRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    flex: 1.2,
  },
  addressText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    textAlign: 'right',
    lineHeight: 18,
  },
});
