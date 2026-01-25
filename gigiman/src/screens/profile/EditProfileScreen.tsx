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
    <AppHeader title="Edit Profile" showBack={true} onBackPress={navigation.goBack} subtitle="Update your profile details below"/>
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* <AppHeader title="Edit Profile" showBack={true} onBackPress={navigation.goBack()} /> */}
      {/* <Text style={styles.subtitle}>
        Update your profile details below
      </Text> */}

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
      widthCount={0.85}
      
    />
    </View>
  </View>
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

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  fieldWrapper: {
    marginBottom: 18,
  },

  footer: {
    alignItems: "center",
  },

  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  disabledBtn: {
    opacity: 0.7,
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});


