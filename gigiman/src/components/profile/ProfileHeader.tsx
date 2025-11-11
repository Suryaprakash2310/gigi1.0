import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface ProfileHeaderProps {
  name: string;
  id: string;
  role?: string;
  verified?: boolean;
  onEdit?: () => void;
  profileImage?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  id,
  role,
  verified = false,
  onEdit,
  profileImage,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/*  Profile Image */}
        {/* <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require('../../assets/icons/user-placeholder.png')
          }
          style={styles.avatar}
        /> */}

        {/*  User Details */}
        <View style={styles.details}>
          <Text style={styles.name}>{name}</Text>
          {role && <Text style={styles.role}>{role}</Text>}
          <Text style={styles.idText}>ID: {id}</Text>

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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 50,
    marginRight: 15,
  },
  details: {
    flex: 1,
    gap:2
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  role: {
    fontSize: 14,
    color: '#777',
  },
  idText: {
    fontSize: 13,
    color: '#999',
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:5,
  },
  verifyText: {
    fontSize: 13,
  },
  editIcon: {
    padding: 8,
  },
});
