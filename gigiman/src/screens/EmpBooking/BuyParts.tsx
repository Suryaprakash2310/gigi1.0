import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";
import SearchBar from "../../components/SearchBar";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BookingStackParamList } from "../../navigation/EmpBookingStack";
import BottomButton from "../../components/Bottom";
import AppHeader from "../../components/AppHeader";
import { fetchCategories, fetchParts } from "@/api/parts.api";
import { createPartRequest } from "@/api/parts.api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";


type BookingNavProp = NativeStackNavigationProp<
  BookingStackParamList,
  "PartBuying"
>;


type PartsRouteProp = RouteProp<
  BookingStackParamList,
  "PartBuying"
>;



// -------------------------
// PART ITEM TYPE
// -------------------------
interface PartItem {
  _id: string;
  partName: string;
  price: number;
  quantity: number;
}

const PartsScreen = () => {
  const navigation = useNavigation<BookingNavProp>();

  // -------------------------
  // STATE
  // -------------------------
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [filteredParts, setFilteredParts] = useState<PartItem[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const route = useRoute<PartsRouteProp>();
const { bookingId } = route.params;
const [submitting, setSubmitting] = useState(false);


//const { height } = Dimensions.get("window");
  

  const handleConfirm = async () => {
    console.log("++++++++++++Confirming part request...");
  if (submitting) return;

  try {
    setSubmitting(true);

    const payload = selectedParts.map(p => ({
      partsId: p._id,
      partName: p.partName,
      quantity: p.quantity,
      price: p.price,
    }));
    console.log("++++++++++++Payload:", payload);

    await createPartRequest(bookingId, payload, total);
    

    navigation.goBack();

  } catch (err: any) {
    alert(err.message || "Failed to request parts");
  } finally {
    setSubmitting(false);
  }
};





  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Sync filteredParts whenever parts change
  useEffect(() => {
    setFilteredParts(parts);
  }, [parts]);

  // -------------------------
  // API: Load Categories
  // -------------------------
  const loadCategories = async () => {
    const res = await fetchCategories();
    setCategories(res.categories || []);
  };

  // -------------------------
  // API: Load Parts
  // -------------------------
  const onCategorySelect = async (cat: any) => {
    setSelectedCategory(cat._id);
    setLoadingParts(true);

    const res = await fetchParts(bookingId, cat._id);

    const formatted: PartItem[] = res.parts.map((p: any, index: number) => ({
      _id: `${cat._id}-${index}`,
      partName: p.partName,
      price: Number(p.price) ,
      quantity: 0,
    }));

    setParts(formatted);
    setFilteredParts(formatted);

    setLoadingParts(false);
  };

  // -------------------------
  // SELECTED PARTS + TOTAL
  // -------------------------
  const selectedParts = useMemo(
    () => parts.filter((p) => p.quantity > 0),
    [parts]
  );

  const total = selectedParts.reduce(
    (sum, p) =>
      sum + (Number(p.price) || 0) * (Number(p.quantity) || 0),
    0
  );

  // -------------------------
  // QUANTITY HANDLERS
  // -------------------------
  const increaseQty = (id?: string) => {
    setParts((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id?: string) => {
    setParts((prev) =>
      prev.map((item) =>
        item._id === id && item.quantity > 0
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  // -------------------------
  // SEND TO TOOLSHOP
  // -------------------------
  const handleSend = () => {
    if (selectedParts.length === 0) {
      alert("Please select at least one part.");
      return;
    }
    setShowConfirmModal(true);
  };

  // -------------------------
  // RENDER PART ITEM
  // -------------------------
  const renderItem = ({ item }: { item: PartItem }) => (
    <View style={styles.card}>
      <Text style={styles.partName}>{item.partName}</Text>

      <View style={styles.quantityRow}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => decreaseQty(item._id)}
        >
          <Ionicons name="remove" size={18} color="#000" />
        </TouchableOpacity>

        <Text style={styles.qtyText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => increaseQty(item._id)}
        >
          <Ionicons name="add" size={18} color="#000" />
        </TouchableOpacity>

        <Text style={styles.price}>₹{item.price}</Text>
      </View>
    </View>
  );

  // -------------------------
  // UI
  // -------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Buy Parts"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>

        {/* Category Pills */}
        <FlatList
          data={categories}
          horizontal
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.categoryPill,
                selectedCategory === item._id && styles.categoryPillActive,
              ]}
              onPress={() => onCategorySelect(item)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === item._id && styles.categoryPillTextActive,
                ]}
              >
                {item.domainpartname}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Search */}
        <SearchBar
          placeholder="Search parts..."
          data={parts}
          searchKey="partName"
          onResults={setFilteredParts}
        />

        {loadingParts && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={{ marginTop: 10 }}
          />
        )}

        {/* Parts List */}
        <FlatList
          data={filteredParts}
          keyExtractor={(item) => item._id!}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        {/* Floating Button */}
        <View style={styles.floatingButtonWrapper}>
          <BottomButton
            title="Send to Toolshop"
            onPress={handleSend}
            widthCount={0.9}
          />
        </View>
      </View>

      {/* Premium Modal */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Your Order</Text>

            <FlatList
              data={selectedParts}
              keyExtractor={(item) => item._id!}
              renderItem={({ item }) => (
                <View style={styles.modalRow}>
                  <Text style={styles.modalItem}>{item.partName}</Text>
                  <Text style={styles.modalQty}>x{item.quantity}</Text>
                  <Text style={styles.modalPrice}>
                    ₹{item.price * item.quantity}
                  </Text>
                </View>
              )}
            />

            <View style={styles.modalFooter}>
              <Text style={styles.modalTotal}>Total: ₹{total}</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );

};

export default PartsScreen;

// -------------------------
// STYLES
// -------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  /* CATEGORY */
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryPillText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  categoryPillTextActive: {
    color: "#FFF",
  },

  /* PART CARD */
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  partName: {
    ...theme.typography.subheading,
    color: "#000",
    marginBottom: 10,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },

  qtyText: {
    fontSize: 16,
    fontWeight: "600",
    width: 35,
    textAlign: "center",
  },

  price: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  /* FLOATING BUTTON */
  floatingButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  /* MODAL */
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    //maxHeight: height * 0.6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  modalItem: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  modalQty: {
    width: 40,
    fontWeight: "600",
    textAlign: "center",
  },
  modalPrice: {
    width: 60,
    textAlign: "right",
    fontWeight: "700",
  },
  modalFooter: {
    marginTop: 20,
  },
  modalTotal: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "right",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

