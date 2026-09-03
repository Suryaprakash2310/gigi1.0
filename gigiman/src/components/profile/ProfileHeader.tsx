// src/components/ParallaxProfileHeader.tsx
import React from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const AVATAR_SIZE = 96;
const COLLAPSE_HEIGHT = 80; // final header height

interface Props {
  scrollY: Animated.Value;
  name: string;
  ownerName?: string;
  shopName?: string;
  idText: string;
  subtitle?: string;
  verified?: boolean;
  cancelCount?: number;
  phoneNo?: string;
  avatarUri?: string | null;
  bannerUri?: string | null;
  onEdit?: () => void;
  rightAction?: React.ReactNode;
}

export const ProfileHeader: React.FC<Props> = ({
  scrollY,
  name,
  ownerName,
  shopName,
  idText,
  subtitle,
  verified,
  cancelCount,
  phoneNo,
  avatarUri,
  bannerUri,
  onEdit,
  rightAction,
}) => {
  // interpolate header translate/scale
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - COLLAPSE_HEIGHT],
    outputRange: [0, -(BANNER_HEIGHT - COLLAPSE_HEIGHT)],
    extrapolate: 'clamp',
  });

  const bannerScale = scrollY.interpolate({
    inputRange: [-BANNER_HEIGHT, 0, BANNER_HEIGHT / 2],
    outputRange: [2, 1, 0.9],
    extrapolate: 'clamp',
  });

  // avatar moves up a bit
  const avatarTranslate = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - COLLAPSE_HEIGHT],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - COLLAPSE_HEIGHT],
    outputRange: [1, 0.86],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY: headerTranslate }] }]}>
      {/* <Animated.Image
        source={
          bannerUri
            ? { uri: bannerUri }
            : require('../../../assets/icons/chef.png') // change or add asset
        }
        style={[
          styles.banner,
          {
            transform: [{ scale: bannerScale }],
          },
        ]}
        resizeMode="cover"
      /> */}
      <View style={styles.overlay} />
      <View style={styles.headerRow}>
        <View style={styles.left} />
        <View style={styles.rightAction}>{rightAction}</View>
      </View>

      <Animated.View style={[styles.avatarRow, { transform: [{ translateY: avatarTranslate }] }]}>
        <Animated.View style={[styles.avatarWrap]}>
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : require('../../../assets/icons/chef.png')
            }
            style={styles.avatar}
          />
        </Animated.View>

        <Animated.View style={[styles.info, { transform: [{ scale: titleScale }] }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.name}>{name}</Text>
            {ownerName ? <Text style={styles.name}>{ownerName}</Text> : null}

            {verified && <Ionicons name="checkmark-circle" size={18} color="#00C853" />}
          </View>
          {shopName ? <Text style={styles.subtitle}>{shopName}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.idText}>{idText}</Text>
          {phoneNo ? <Text style={styles.idText}>{phoneNo}</Text> : null}
          {typeof cancelCount === 'number' ? (
            <Text style={styles.idText}>Cancellations: {cancelCount}</Text>
          ) : null}
        </Animated.View>

        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width,
    height: BANNER_HEIGHT,
    overflow: 'hidden',
    marginBottom: 8,
  },
  banner: {
    position: 'absolute',
    width: '100%',
    height: BANNER_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: BANNER_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  headerRow: {
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  left: { width: 40 },
  rightAction: { width: 40, alignItems: 'flex-end' },
  avatarRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#fff',
    fontSize: 13,
    marginTop: 2,
  },
  idText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  editBtn: {
    padding: 8,
  },
});
