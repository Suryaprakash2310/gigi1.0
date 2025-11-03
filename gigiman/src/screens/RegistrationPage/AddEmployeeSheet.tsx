import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { theme } from '../../theme/theme';
import { useBottomSheet } from '../../context/BottomSheetContext';

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// Simple local mock (replace with API later)
interface Employee {
  id: string;
  empId: string;
  name: string;
}
const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', empId: 'S0001', name: 'Surya Prakash' },
  { id: '2', empId: 'S0002', name: 'Arjun Kumar' },
  { id: '3', empId: 'S0003', name: 'Sugadev' },
  { id: '4', empId: 'S0004', name: 'Vignesh' },
  { id: '5', empId: 'S0005', name: 'Karthik' },
  { id: '6', empId: 'S0006', name: 'Ramesh' },
  { id: '7', empId: 'S0007', name: 'Priya' },
  { id: '8', empId: 'S0008', name: 'Anjali' },
  // add more as needed for testing scroll
];

export const AddEmployeeSheet: React.FC = () => {
  const { closeSheet, sheetData } = useBottomSheet();
  // sheetData: { initialSelected?: Employee[], onSelect?: (selected: Employee[]) => void }

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // initialize selected from parent each time sheetData changes
  useEffect(() => {
    if (sheetData?.initialSelected && Array.isArray(sheetData.initialSelected)) {
      setSelected(sheetData.initialSelected);
    } else {
      setSelected([]);
    }
  }, [sheetData]);

  // mock search with debounce
  useEffect(() => {
    if (searchText.trim().length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      const q = searchText.trim().toLowerCase();
      const filtered = MOCK_EMPLOYEES.filter(
        (emp) => emp.name.toLowerCase().includes(q) || emp.empId.toLowerCase().includes(q)
      );
      setResults(filtered);
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [searchText]);

  const handleAdd = (emp: Employee) => {
    if (!selected.some((e) => e.id === emp.id)) {
      setSelected((prev) => [...prev, emp]);
    }
  };

  const handleRemoveLocal = (id: string) => {
    setSelected((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = () => {
    if (sheetData?.onSelect) sheetData.onSelect(selected);
    closeSheet();
  };

  // render result row
  const renderResult = ({ item }: { item: Employee }) => {
    const already = selected.some((s) => s.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.resultItem, already && styles.resultItemSelected]}
        onPress={() => handleAdd(item)}
        activeOpacity={0.8}
      >
        <View>
          <Text style={[styles.resultName, already && styles.resultNameSelected]}>{item.name}</Text>
          <Text style={[styles.resultId, already && styles.resultIdSelected]}>{item.empId}</Text>
        </View>
        <Text style={[styles.addText, already && styles.addTextDisabled]}>{already ? '✓' : '＋'}</Text>
      </TouchableOpacity>
    );
  };

  // footer component for flatlist: the selected items area
  const SelectedFooter = () => {
    if (selected.length === 0) return null;
    return (
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedTitle}>Added Employees</Text>
        {selected.map((emp) => (
          <View key={emp.id} style={styles.selectedItem}>
            <View>
              <Text style={styles.selectedName}>{emp.name}</Text>
              <Text style={styles.selectedId}>{emp.empId}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveLocal(emp.id)}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Keep header and search static, list scrolls between */}
      <KeyboardAvoidingView
        behavior={IS_IOS ? 'padding' : undefined}
        keyboardVerticalOffset={IS_IOS ? 80 : 0}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>👷‍♂️ Add Employees</Text>
          <Text style={styles.subtitle}>Search by Employee ID or Name</Text>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            placeholder="e.g. S0001 or Arjun Kumar"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Main scrollable list area */}
        <View style={styles.listArea}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary || '#007bff'} style={{ marginTop: 12 }} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderResult}
              ListEmptyComponent={
                searchText.trim().length > 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No matches found</Text>
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Type to search employees</Text>
                  </View>
                )
              }
              contentContainerStyle={styles.flatContent}
              keyboardShouldPersistTaps="handled"
              // make footer display selected items (scrollable with list)
              ListFooterComponent={<SelectedFooter />}
            />
          )}
        </View>

        {/* Static bottom button row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={closeSheet} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
            <Text style={styles.saveText}>Save ({selected.length})</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const basePadding = Math.round(width * 0.04); // responsive padding

const styles = StyleSheet.create({
  safe: {
    backgroundColor: theme.colors.background || '#fff',
  },
  container: {
    maxHeight: Math.min(height * 0.85, 760), // adaptive sheet height
    width: '100%',
  },
  header: {
    paddingHorizontal: basePadding,
    paddingTop: 12,
    paddingBottom: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: Math.round(width * 0.05),
    fontWeight: '700',
    color: theme.colors.text || '#111',
  },
  subtitle: {
    fontSize: Math.round(width * 0.032),
    color: '#777',
    marginTop: 4,
  },
  searchWrap: {
    paddingHorizontal: basePadding,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: IS_IOS ? 12 : 10,
    fontSize: Math.round(width * 0.042),
    color: '#222',
  },
  listArea: {
    flex: 1,
    paddingHorizontal: basePadding,
    // give FlatList a fixed height to ensure footer/button layout stable
    // FlatList will fill available space between header+search and bottom buttons
    maxHeight: Math.min(height * 0.6, 520),
  },
  flatContent: {
    paddingBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    elevation: 1,
  },
  resultItemSelected: {
    backgroundColor: '#eef2ff',
  },
  resultName: { fontSize: Math.round(width * 0.042), fontWeight: '600', color: '#333' },
  resultNameSelected: { color: theme.colors.primary || '#007bff' },
  resultId: { fontSize: Math.round(width * 0.034), color: '#888' },
  resultIdSelected: { color: '#666' },
  addText: { fontSize: Math.round(width * 0.07), color: theme.colors.primary || '#007bff' },
  addTextDisabled: { color: '#4caf50' },

  // selected list
  selectedContainer: { marginTop: 12 },
  selectedTitle: { fontSize: Math.round(width * 0.042), fontWeight: '600', marginBottom: 8, color: '#333' },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  selectedName: { fontSize: Math.round(width * 0.04), fontWeight: '600', color: '#2e7d32' },
  selectedId: { fontSize: Math.round(width * 0.034), color: '#388e3c' },
  removeText: { color: '#e53935', fontSize: Math.round(width * 0.05) },

  emptyBox: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { color: '#999' },

  // bottom buttons (static)
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: basePadding,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: theme.colors.background || '#fff',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#333', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary || '#007bff',
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
export default AddEmployeeSheet;
