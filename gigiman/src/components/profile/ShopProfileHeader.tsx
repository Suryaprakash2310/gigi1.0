import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface ShopProfileHeaderProps {
  shopName: string;
  shopId: string;
  domain?: string;
  location?: string;
  verified?: boolean;
  onEdit?: () => void;
  shopLogo?: string;
}

export const ShopProfileHeader: React.FC<ShopProfileHeaderProps> = ({
  shopName,
  shopId,
  domain,
  location,
  verified = false,
  onEdit,
  shopLogo,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/*  Shop Logo */}
        {/* <Image
          source={
            shopLogo
              ? { uri: shopLogo }
              : require('../../assets/icons/shop-placeholder.png')
          }
          style={styles.logo}
        /> */}

        {/*  Shop Details */}
        <View style={styles.details}>
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.shopId}>Shop ID: {shopId}</Text>

          {domain && (
            <View style={styles.domainRow}>
              <Ionicons name="globe-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.domainText}>{domain}</Text>
            </View>
          )}

          {location && (
            <View style={styles.domainRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.domainText}>{location}</Text>
            </View>
          )}

          <View style={styles.verifyRow}>
            <Ionicons
              name={verified ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={verified ? 'green' : '#f5a623'}
            />
            <Text style={[styles.verifyText, { color: verified ? 'green' : '#f5a623' }]}>
              {verified ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>

        {/*  Edit Icon */}
        <TouchableOpacity style={styles.editIcon} onPress={onEdit}>
          <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 65,
    height: 65,
    borderRadius: 14,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
  },
  details: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  shopId: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  domainText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#555',
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  verifyText: {
    marginLeft: 5,
    fontSize: 13,
  },
  editIcon: {
    padding: 8,
  },
});
