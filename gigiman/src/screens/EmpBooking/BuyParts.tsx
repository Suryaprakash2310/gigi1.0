import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import SearchBar from '../../components/SearchBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookingStackParamList } from '../../navigation/EmpBookingStack';
import BottomButton from '../../components/Bottom';
import AppHeader from '../../components/AppHeader';
type BookingNavProp = NativeStackNavigationProp<BookingStackParamList, 'Booking'>;

const { height } = Dimensions.get('window');

interface PartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const PartsScreen = () => {
  const navigation = useNavigation<BookingNavProp>();
  const [parts, setParts] = useState<PartItem[]>([
    { id: '1', name: 'Eco Breeze Ceiling Fan Eco Breeze Ceiling Fan Eco Breeze Ceiling Fan', price: 420, quantity: 0 },
    { id: '2', name: 'TurboCool Copper Fan', price: 680, quantity: 0 },
    { id: '3', name: 'SmartAir Remote Fan', price: 560, quantity: 0 },
    { id: '4', name: 'WhirlWind Silent Fan', price: 490, quantity: 0 },
    { id: '5', name: 'AeroSpin LED Fan', price: 610, quantity: 0 },
    { id: '6', name: 'BreezeMaster XL Fan', price: 530, quantity: 0 },
    { id: '7', name: 'UltraFlow Designer Fan', price: 700, quantity: 0 },
    { id: '8', name: 'ZenAir Minimalist Fan', price: 475, quantity: 0 },
    { id: '9', name: 'CoolCraft Dual Blade Fan', price: 590, quantity: 0 },
    { id: '10', name: 'Nimbus Smart Ceiling Fan', price: 640, quantity: 0 },
    { id: '11', name: 'Vortex Copper Motor Fan', price: 505, quantity: 0 },
    { id: '12', name: 'SkyGlow Remote Fan', price: 615, quantity: 0 },
  ])

  const [filteredParts, setFilteredParts] = useState<PartItem[]>(parts);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedParts = useMemo(() => parts.filter(p => p.quantity > 0), [parts]);

  // 🧾 Calculate total
  const total = selectedParts.reduce((sum, p) => sum + p.price * p.quantity, 0);

  // ✅ Quantity Increment
  const increaseQty = (id: string) => {
    setParts(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const decreaseQty = (id: string) => {
    setParts(prev =>
      prev.map(item =>
        item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  };

  // const handleSend = () => {
  //   const selected = parts.filter(p => p.quantity > 0);
  //   if (selected.length === 0) {
  //     alert('Please select at least one part.');
  //     return;
  //   }

  //   // Simulate API response
  //   const mockRequestId = 'REQ12345';

  //   navigation.navigate('Booking', {
  //     partsbuyed: true,
  //     requestId: mockRequestId,
  //   });
  // };
  const handleSend = () => {
    const selected = parts.filter(p => p.quantity > 0);
    if (selected.length === 0) {
      alert('Please select at least one part.');
      return;
    }
    setShowConfirmModal(true); // show modal instead of navigating directly
  };




  const renderItem = ({ item }: { item: PartItem }) => (
    <View style={styles.card}>
      <Text style={styles.partName}>{item.name}</Text>
      <View style={styles.quantityRow}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => decreaseQty(item.id)}>
          <Ionicons name="remove" size={18} color="#000" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.circleBtn} onPress={() => increaseQty(item.id)}>
          <Ionicons name="add" size={18} color="#000" />
        </TouchableOpacity>
        <Text style={styles.price}>₹{item.price}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Buy Parts" showBack={true} onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        {/* Header */}


        {/* Search */}
        <SearchBar
          placeholder="Search parts..."
          data={parts}
          searchKey="name"
          onResults={setFilteredParts}
        />

        {/* List */}
        <FlatList
          data={filteredParts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <BottomButton title='Send to Toolshop' onPress={handleSend} widthCount={0.9} />
      </View>
      {/* ✅ Confirmation Modal */}
{showConfirmModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Confirm Your Parts</Text>

      <FlatList
        data={parts.filter(p => p.quantity > 0)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.modalRow}>
            <Text style={styles.modalItem}>{item.name}</Text>
            <Text style={styles.modalQty}>x{item.quantity}</Text>
            <Text style={styles.modalPrice}>₹{item.price * item.quantity}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 10 }}
      />

      <View style={styles.modalFooter}>
        <Text style={styles.modalTotal}>
          Total: ₹
          {parts
            .filter(p => p.quantity > 0)
            .reduce((sum, p) => sum + p.price * p.quantity, 0)}
        </Text>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#ccc' }]}
            onPress={() => setShowConfirmModal(false)}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setShowConfirmModal(false);
              const mockRequestId = 'REQ12345';
              navigation.navigate('Booking', {
                partsbuyed: true,
                requestId: mockRequestId,
              });
            }}>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16, backgroundColor: '#fafafa' },
  listContent: { paddingBottom: 140 },
  card: {
    borderBottomWidth: 1,
    borderColor: theme.colors.mediumLine,
    paddingVertical: 14,
  },
  partName: { ...theme.typography.subheading, paddingBottom: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.mediumLine,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '500' },
  price: { fontSize: 14, fontWeight: '600', color: '#000' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55, // slightly bigger
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  sheetList: {
    //paddingBottom: 80, // avoid overlap with footer
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  sheetName: {
    flex: 1,
    fontSize: 14,
  },
  sheetQty: {
    width: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  sheetPrice: {
    width: 70,
    textAlign: 'right',
    fontWeight: '500',
  },

  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 100,
},
modalContainer: {
  width: '90%',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 16,
  maxHeight: height * 0.6,
},
modalTitle: {
  fontSize: 18,
  fontWeight: '700',
  textAlign: 'center',
  //marginBottom: 10,
  paddingBottom:10,
  color: '#000',
},
modalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginVertical: 6,
},
modalItem: {
  flex: 1,
  fontSize: 14,
  color: '#333',
},
modalQty: {
  width: 40,
  textAlign: 'center',
  fontWeight: '600',
},
modalPrice: {
  width: 60,
  textAlign: 'right',
  fontWeight: '600',
},
modalFooter: {
  marginTop: 10,
  borderTopWidth: 1,
  borderTopColor: '#eee',
  paddingTop: 10,
},
modalTotal: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#000',
  textAlign: 'right',
  marginBottom: 14,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
modalButton: {
  flex: 1,
  paddingVertical: 12,
  marginHorizontal: 5,
  borderRadius: 10,
  alignItems: 'center',
},
modalButtonText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 15,
},


});
