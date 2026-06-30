import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';


import { ProfileContext } from "@/context/ProfileContext";
import { AuthContext } from "@/context/AuthContext";
import { ProfileAPI } from "@/api/profile.api";
import { theme } from "@/theme/theme";
import { EDIT_PROFILE_FIELDS } from "@/utils/config/editProfile.config";
import FloatingLabelInput from "@/components/TextInput";
import BottomButton from "@/components/Bottom";
import AppHeader from "@/components/AppHeader";

export default function EditProfileScreen({ navigation }: any) {
  const { profile, refreshProfile } = useContext(ProfileContext);
  const { userRole } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    profile?.services || profile?.toolDomains || []
  );
  const [locationStatus, setLocationStatus] = useState<string | null>(
    profile?.latitude ? 'Location updated ✔' : null
  );

  const fields = EDIT_PROFILE_FIELDS[userRole || ""] || [];

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant library access to select a profile picture.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setAvatarUri(asset.uri);
        if (asset.base64) {
          setAvatarBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    } catch (err) {
      console.error('Error picking avatar:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const onChange = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleUpdateLocation = async () => {
    try {
      setLocationUpdating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to update your shop location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setForm((prev: any) => ({ 
        ...prev, 
        latitude: latitude.toString(), 
        longitude: longitude.toString() 
      }));
      setLocationStatus('Location updated ✔');
      Alert.alert('Success', 'GPS coordinates captured successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setLocationUpdating(false);
    }
  };

  // const toggleCategory = (cat: string) => {
  //   setSelectedCategories(prev => 
  //     prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
  //   );
  // };

  // const availableCategories = userRole === 'TOOL_SHOP' 
  //   ? ['Hand Tools', 'Power Tools', 'Heavy Machinery', 'Automotive', 'Plumbing', 'Electrical']
  //   : ['AC Repair', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Cleaning'];

  const onSave = async () => {
    const payload: Record<string, any> = {};

    fields.forEach((field) => {
      const newValue = form[field.key];
      const oldValue = profile[field.key];

      if (newValue !== undefined && newValue !== "" && newValue !== oldValue) {
        payload[field.key] = newValue;
      }
    });

    // Handle Latitude/Longitude
    if (form.latitude && form.latitude !== profile.latitude) payload.latitude = form.latitude;
    if (form.longitude && form.longitude !== profile.longitude) payload.longitude = form.longitude;

    // Handle Services/Domains
    if (userRole === 'TOOL_SHOP') {
      payload.toolDomains = selectedCategories;
    } else {
      payload.services = selectedCategories;
    }

    // Handle Avatar
    if (avatarBase64) {
      payload.avatar = avatarBase64;
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert("No changes", "Nothing to update");
      return;
    }

    try {
      setSaving(true);
      await ProfileAPI.editProfile(payload);
      await refreshProfile();
      Alert.alert("Success", "Profile updated");
      navigation.goBack();
    } catch (err) {
      console.error("Edit profile error:", err);
      Alert.alert("Error", "Invalid update data");
    } finally {
      setSaving(false);
    }
  };


  return (
    <View style={styles.root}>
      <AppHeader title="Edit Profile" showBack={true} onBackPress={navigation.goBack} subtitle="Update your profile details below" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 100 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Avatar Edit Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleSelectAvatar} activeOpacity={0.8} style={styles.avatarWrapper}>
            <Image
              source={
                avatarUri
                  ? { uri: avatarUri }
                  : profile?.avatar
                  ? { uri: profile.avatar }
                  : require("../../../assets/icon.png")
              }
              style={styles.avatarImage}
            />
            <View style={styles.editIconWrapper}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Tap to change profile picture</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <View style={styles.fieldWrapper}>
            <View pointerEvents="none">
              <FloatingLabelInput
                label="Phone Number"
                value={profile?.phoneNo || ""}
                placeholder=""
                onChangeText={() => {}}
              />
            </View>
            <Text style={styles.readOnlyHint}>Contact support to change phone number</Text>
          </View>

          {fields.map((field) => (
            <View key={field.key} style={styles.fieldWrapper}>
              <FloatingLabelInput
                label={field.label}
                value={
                  form[field.key] !== undefined
                    ? form[field.key]
                    : profile?.[field.key] || ""
                }
                onChangeText={(text) => onChange(field.key, text)}
                placeholder={`Enter ${field.label}`}
              />
            </View>
          ))}
        </View>

        {/* Location Section */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>Store Location</Text>
          <Text style={styles.desc}>Update your precise GPS location to help customers find you easily.</Text>
          
          <TouchableOpacity 
            style={[styles.locationBtn, locationUpdating && { opacity: 0.7 }]} 
            onPress={handleUpdateLocation}
            disabled={locationUpdating}
          >
            {locationUpdating ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <Text style={styles.locationBtnText}>Update Location</Text>
              </>
            )}
          </TouchableOpacity>
          {locationStatus && <Text style={styles.locationStatus}>{locationStatus}</Text>}
          {(form.latitude || profile?.latitude) && (
            <Text style={styles.coords}>
              Lat: {Number(form.latitude || profile?.latitude).toFixed(4)}, 
              Long: {Number(form.longitude || profile?.longitude).toFixed(4)}
            </Text>
          )}
        </View>

        
      </ScrollView>

      {/* ✅ Bottom Gradient Button */}
      <View style={styles.footer}>
        <BottomButton
          title="Save Changes"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          widthCount={0.9}
        />
      </View>
    </View >
  );


}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 24,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldWrapper: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  readOnlyHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  desc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 20,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  locationBtnText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  locationStatus: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  coords: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e4e8',
  },
  editIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    fontWeight: '600',
  },
});



