import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AppHeader from "../../components/AppHeader";
import { socket } from "@/socket/socket";
import apiClient from "@/api/client";
import { AppText } from "@/components/ui/Text";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function AddServiceScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { bookingId, domainServiceId } = route.params;
  const [providerId, setProviderId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ dialog state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  useEffect(() => {
    fetchCategories();
    (async () => {
      try {
        const id = await AsyncStorage.getItem("providerId");
        if (id) {
          setProviderId(id);
          console.log("Provider ID:", id);
        }
      } catch (err) {
        console.error("Error reading providerId:", err);
      }
    })();

  }, []);

  // ===============================
  // FETCH SERVICES
  // ===============================
  const fetchCategories = async () => {
    try {
      if (!domainServiceId) {
        console.log("❌ domainServiceId missing");
        return;
      }

      console.log("📡 Fetching services for:", domainServiceId);

      const res = await apiClient.get(
        `auth/showsubservice/${domainServiceId}`
      );

      console.log("📦 API Response:", res.data);

      const flatCategories =
        (res.data as any)?.services?.flatMap((s: any) =>
          (s.serviceCategory || []).map((c: any) => ({
            _id: c._id,
            serviceCategoryName: c.serviceCategoryName,
            price: c.price,
            durationInMinutes: c.durationInMinutes,
            employeeCount: c.employeeCount,
            parentServiceName: s.serviceName,
          }))
        ) || [];

      console.log("📋 Flattened Categories:", flatCategories);

      setCategories(flatCategories);
    } catch (err) {
      console.log("❌ Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };
  // ===============================
  // TAP SERVICE → OPEN DIALOG
  // ===============================
  const handleSelect = (category: any) => {
    setSelectedService(category);
    setConfirmVisible(true);
  };

  // ===============================
  // CONFIRM SERVICE
  // ===============================
  const handleConfirmService = () => {
    if (!selectedService) return;

    console.log("📤 Proposing service:", selectedService.serviceCategoryName);
    console.log("📤 EMITTING extra-service-propose", {
      bookingId,
      employeeId: providerId,
      serviceCategoryId: selectedService._id,
    });
    socket.emit("extra-service-propose", {
      bookingId,
      serviceCategoryId: selectedService._id,
      employeeId: providerId,
    });

    setConfirmVisible(false);
    setSelectedService(null);

    navigation.goBack();
  };

  // ===============================
  // LOADER
  // ===============================
  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack={true}
        onBackPress={() => navigation.goBack()} title="Select Service" />

      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => handleSelect(item)}
          >
            <View style={styles.cardTop}>
              <AppText style={styles.serviceName}>
                {item.serviceCategoryName}
              </AppText>

              <AppText style={styles.price}>
                ₹{item.price}
              </AppText>
            </View>

            <AppText style={styles.parentText}>
              {item.parentServiceName}
            </AppText>

            <View style={styles.metaRow}>
              <AppText style={styles.metaText}>
                ⏱ {item.durationInMinutes} mins
              </AppText>

              <AppText style={styles.metaText}>
                👨‍🔧 {item.employeeCount}
              </AppText>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ✅ CONFIRM DIALOG */}
      <ConfirmDialog
        visible={confirmVisible}
        title="Add Service"
        message={
          selectedService
            ? `Add ${selectedService.serviceCategoryName} for ₹${selectedService.price}?`
            : "Confirm service"
        }
        confirmText="Yes, Add"
        cancelText="Cancel"
        onConfirm={handleConfirmService}
        onCancel={() => {
          setConfirmVisible(false);
          setSelectedService(null);
        }}
      />
    </View>
  );
}

// ===============================
// RESPONSIVE STYLES
// ===============================

const CARD_PADDING = width < 380 ? 14 : 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: CARD_PADDING,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  serviceName: {
    flex: 1,
    marginRight: 10,
    fontSize: width < 380 ? 14 : 16,
  },

  price: {
    color: "#0D9488",
    fontSize: width < 380 ? 15 : 17,
  },

  parentText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 13,
  },

  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 16,
  },

  metaText: {
    color: "#475569",
    fontSize: 12,
  },
});