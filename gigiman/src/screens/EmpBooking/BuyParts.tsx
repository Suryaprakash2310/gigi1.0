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
  Vibration,
  Platform,
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
  if (submitting) return;

  try {
    setSubmitting(true);

    const payload = selectedParts.map(p => ({
      partsId: p._id,
      partName: p.partName,
      quantity: p.quantity,
      price: p.price,
    }));

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
      _id: p._id || `${cat._id}-${index}`,
      partName: p.partsname || p.partName,
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
    Vibration.vibrate(50);
    setParts((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id?: string) => {
    Vibration.vibrate(50);
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
      <View style={styles.cardInfo}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={24} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.partName} numberOfLines={1}>{item.partName}</Text>
          <Text style={styles.priceText}>₹{item.price}</Text>
        </View>
      </View>

      <View style={styles.quantityRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => decreaseQty(item._id)}
          activeOpacity={0.6}
        >
          <Ionicons name="remove-circle" size={32} color={item.quantity > 0 ? theme.colors.primary : "#CCC"} />
        </TouchableOpacity>

        <View style={styles.qtyDisplay}>
          <Text style={styles.qtyText}>{item.quantity}</Text>
        </View>

        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => increaseQty(item._id)}
          activeOpacity={0.6}
        >
          <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
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
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
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
          contentContainerStyle={{ paddingBottom: 150 }}
          ListEmptyComponent={() => !loadingParts && (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>
                {selectedCategory ? "No parts found in this category" : "Please select a category above"}
              </Text>
            </View>
          )}
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

      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedParts}
              keyExtractor={(item) => item._id!}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <View style={styles.orderItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderItemName}>{item.partName}</Text>
                    <Text style={styles.orderItemPrice}>₹{item.price} each</Text>
                  </View>
                  <View style={styles.orderItemQty}>
                    <Text style={styles.orderItemQtyText}>x{item.quantity}</Text>
                    <Text style={styles.orderItemTotal}>₹{item.price * item.quantity}</Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.modalDivider} />

            <View style={styles.orderTotalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalAmount}>₹{total}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelBtnText}>Edit Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Order</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  /* CATEGORY */
  categoryList: {
    paddingVertical: 16,
    height: 70,
  },
  categoryPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    elevation: 4,
    shadowOpacity: 0.2,
  },
  categoryPillText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  categoryPillTextActive: {
    color: "#FFF",
  },

  /* PART CARD */
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    padding: 2,
  },
  qtyDisplay: {
    width: 32,
    alignItems: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: '#1F2937',
  },

  /* FLOATING BUTTON */
  floatingButtonWrapper: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  /* EMPTY STATE */
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },

  /* MODAL */
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: '#111827',
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  orderItemPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  orderItemQty: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orderItemQtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  orderItemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontWeight: "700",
    fontSize: 16,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

