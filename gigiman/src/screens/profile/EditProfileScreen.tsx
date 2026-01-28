import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


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

  const fields = EDIT_PROFILE_FIELDS[userRole || ""] || [];

  const onChange = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    const payload: Record<string, any> = {};

    fields.forEach((field) => {
      const newValue = form[field.key];
      const oldValue = profile[field.key];

      // ✅ only send if changed & not empty
      if (
        newValue !== undefined &&
        newValue !== "" &&
        newValue !== oldValue
      ) {
        payload[field.key] = newValue;
      }
    });

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

        <View style={styles.card}>
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

  footer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10, // Reduced top padding for tighter look
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute', // Make it actually sticky at bottom
    bottom: 0,
  },


});


