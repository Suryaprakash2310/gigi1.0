import React, { useContext, useState } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/Bottom';
import AppHeader from '../components/AppHeader';
import TextInputField from '../components/TextInput';
import TextAreaField from '../components/TextArea';
import { useTranslation } from 'react-i18next';
import { BottomSheetType, useBottomSheet } from '../context/BottomSheetContext';




interface Employee {
  id: string;
  empId: string;
  name: string;
}

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);
  const theme = useTheme();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { openSheet } = useBottomSheet();
  const [formData, setFormData] = useState<{ employees: Employee[] }>({
    employees: [],
  });


// open sheet with initialSelected + callback
const openAddEmployees = () => {
  openSheet(BottomSheetType.SERVICE_SHEET, {
    initialSelected: formData.employees,
    onSelect: (selectedEmployees: Employee[]) => {
      setFormData((prev) => ({ ...prev, employees: selectedEmployees }));
    },
  });
};

const removeEmployee = (id: string) => {
  setFormData(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
};



  
  return (
    <>
    <View>
      <AppHeader
  title="GIGIMAN"
  subtitle="What is your store name?"
  showBack
  rightIcon="notifications-outline"
  onBackPress={() =>{}}
/>



</View>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: theme.colors.background }}>
     <TextInputField
        label="Name"
        value={name}
        placeholder="Enter your name"
        onChangeText={setName}
        //error={!name ? 'Name is required' : ''}
      />

      <TextAreaField
        label="Description"
        value={desc}
        placeholder="Write something..."
        onChangeText={setDesc}
      />

       <Text>{t('common.save')}</Text>

      {/* <CustomButton title="Continue" disabled={true} onPress={() => console.log('Continue')} /> */}
      <CustomButton title="Delete"  onPress={openAddEmployees} />
  
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
  {formData.employees.map((emp) => (
    <View key={emp.id} style={chipStyles.chip}>
      <Text style={chipStyles.chipText}>{emp.empId} • {emp.name}</Text>
      <TouchableOpacity onPress={() => removeEmployee(emp.id)}>
        <Text style={chipStyles.chipRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  ))}
</View>
      {/* <CustomButton title="Loading..." loading onPress={()=>{}}/> */}
      {/* <Button title="Logout" onPress={logout} /> */}
    </View>
    </>
    
  );
 }
 // chip styles
const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  chipText: { marginRight: 8, color: '#222', fontSize: 14 },
  chipRemove: { color: '#c62828', fontSize: 14 },
});
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
// } from 'react-native';
// import { useBottomSheet } from '../context/BottomSheetContext';
// import { theme } from '../theme/theme';


// // Future backend endpoint example:
// // import axios from 'axios';
// // const API_URL = 'https://yourapi.com/employees/search';

// interface Employee {
//   id: string;
//   empId: string;
//   name: string;
// }

// const MOCK_EMPLOYEES: Employee[] = [
//   { id: '1', empId: 'S0001', name: 'Surya Prakash' },
//   { id: '2', empId: 'S0002', name: 'Arjun Kumar' },
//   { id: '3', empId: 'S0003', name: 'Sugadev' },
//   { id: '4', empId: 'S0004', name: 'Vignesh' },
//   { id: '5', empId: 'S0005', name: 'Karthik' },
// ];

// export const AddEmployeeSheet = () => {
//   const { closeSheet } = useBottomSheet();
//   const [searchText, setSearchText] = useState('');
//   const [results, setResults] = useState<Employee[]>([]);
//   const [selected, setSelected] = useState<Employee[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     // mock search filtering
//     if (searchText.trim().length > 0) {
//       setLoading(true);
//       setTimeout(() => {
//         const filtered = MOCK_EMPLOYEES.filter(
//           emp =>
//             emp.name.toLowerCase().includes(searchText.toLowerCase()) ||
//             emp.empId.toLowerCase().includes(searchText.toLowerCase())
//         );
//         setResults(filtered);
//         setLoading(false);
//       }, 300);
//     } else {
//       setResults([]);
//     }
//   }, [searchText]);

//   // 🔹 FUTURE: Backend search example
//   /*
//   useEffect(() => {
//     const fetchEmployees = async () => {
//       if (searchText.trim().length === 0) return;
//       setLoading(true);
//       try {
//         const response = await axios.get(`${API_URL}?q=${searchText}`);
//         setResults(response.data.employees);
//       } catch (error) {
//         console.error('Search failed', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     const delay = setTimeout(fetchEmployees, 400);
//     return () => clearTimeout(delay);
//   }, [searchText]);
//   */

//   const handleAdd = (emp: Employee) => {
//     if (!selected.some(e => e.id === emp.id)) {
//       setSelected(prev => [...prev, emp]);
//     }
//   };

//   const handleRemove = (id: string) => {
//     setSelected(prev => prev.filter(e => e.id !== id));
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>👷‍♂️ Add Employees</Text>
//       <Text style={styles.subtitle}>Search by Employee ID or Name</Text>

//       {/* Search Box */}
//       <TextInput
//         placeholder="e.g. S0001 or Arjun Kumar"
//         placeholderTextColor="#999"
//         value={searchText}
//         onChangeText={setSearchText}
//         style={styles.searchInput}
//       />

//       {/* Loading spinner */}
//       {loading && (
//         <ActivityIndicator size="small" color={theme.colors.primary || '#007bff'} style={{ marginVertical: 10 }} />
//       )}

//       {/* Search Results */}
//       {!loading && results.length > 0 && (
//         <FlatList
//           data={results}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <TouchableOpacity style={styles.resultItem} onPress={() => handleAdd(item)}>
//               <View>
//                 <Text style={styles.resultName}>{item.name}</Text>
//                 <Text style={styles.resultId}>{item.empId}</Text>
//               </View>
//               <Text style={styles.addText}>＋</Text>
//             </TouchableOpacity>
//           )}
//         />
//       )}

//       {/* Selected Employees */}
//       {selected.length > 0 && (
//         <View style={styles.selectedContainer}>
//           <Text style={styles.selectedTitle}>Added Employees</Text>
//           {selected.map(emp => (
//             <View key={emp.id} style={styles.selectedItem}>
//               <View>
//                 <Text style={styles.selectedName}>{emp.name}</Text>
//                 <Text style={styles.selectedId}>{emp.empId}</Text>
//               </View>
//               <TouchableOpacity onPress={() => handleRemove(emp.id)}>
//                 <Text style={styles.removeText}>✕</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>
//       )}

//       {/* Bottom Buttons */}
//       <View style={styles.buttonRow}>
//         <TouchableOpacity style={styles.cancelBtn} onPress={closeSheet}>
//           <Text style={styles.cancelText}>Cancel</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.saveBtn} onPress={() => {
//           // You can send `selected` to backend or context here
//           closeSheet();
//         }}>
//           <Text style={styles.saveText}>Save</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: theme.colors.background || '#fff',
//     paddingBottom: 30,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: theme.colors.text || '#111',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#777',
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   searchInput: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     fontSize: 16,
//     color: '#222',
//   },
//   resultItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 12,
//     marginTop: 8,
//     elevation: 1,
//   },
//   resultName: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#333',
//   },
//   resultId: {
//     fontSize: 13,
//     color: '#888',
//   },
//   addText: {
//     fontSize: 22,
//     color: theme.colors.primary || '#007bff',
//   },
//   selectedContainer: {
//     marginTop: 16,
//   },
//   selectedTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 8,
//     color: '#333',
//   },
//   selectedItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#e8f5e9',
//     borderRadius: 10,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     marginVertical: 4,
//   },
//   selectedName: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#2e7d32',
//   },
//   selectedId: {
//     fontSize: 13,
//     color: '#388e3c',
//   },
//   removeText: {
//     color: '#e53935',
//     fontSize: 18,
//     paddingHorizontal: 4,
//   },
//   buttonRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 24,
//   },
//   cancelBtn: {
//     flex: 1,
//     backgroundColor: '#eee',
//     padding: 12,
//     borderRadius: 12,
//     marginRight: 8,
//     alignItems: 'center',
//   },
//   cancelText: {
//     color: '#444',
//     fontWeight: '500',
//   },
//   saveBtn: {
//     flex: 1,
//     backgroundColor: theme.colors.primary || '#007bff',
//     padding: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   saveText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
// });
