import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, FlatList, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import FloatingLabelInput from '../../components/TextInput';
import AppHeader from '../../components/AppHeader';
import CustomButton from '../../components/Bottom';
import { theme } from '../../theme/theme';
import ServiceSelector from './SingleService'; // renamed for consistency
import { RouteProp, useRoute } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { UserRole } from '../../utils/enums/CommonEnum';
import { BottomSheetType, useBottomSheet } from '../../context/BottomSheetContext';
import { ToolShopDomainConfig } from '../../utils/config/ToolShop.config';
import SearchBar from '../../components/SearchBar';
import { ServiceCard } from '../../components/BottomSheets/ServiceCard';
import { AuthContext } from '../../context/AuthContext';

interface Employee {
  id: string;
  empId: string;
  name: string;
}

type EmployeeDetailRouteProp = RouteProp<AuthStackParamList, 'EmployeeDetail'>;

export const SingleEmpDetail = () => {
  const route = useRoute<EmployeeDetailRouteProp>();
  const { role } = route.params || {};
  const [currentStep, setCurrentStep] = useState(0);
  const { openSheet } = useBottomSheet();
  const [filteredToolShop, setFilteredToolShop] = useState(ToolShopDomainConfig);
  const [selectedToolShop, setSelectedToolShop] = useState<any[]>([]);
  const { login, userRole } = useContext(AuthContext);

  let initialFormData;
  if (role === UserRole.MULTI_EMPLOYEE) {
    initialFormData = {
      ownerName: '',
      phone: '',
      address: '',
      employees: [], // list of employees
    };
  } else if (role === UserRole.TOOL_SHOP) {
    initialFormData = {
      ownerName: '',
      shopName: '',
      phone: '',
      address: '',
      gstNumber: '',
      toolShopDomain: [],
    };
  } else {
    initialFormData = {
      name: '',
      age: '',
      address: '',
      phone: '',
      aadharNo: '',
      services: [], // up to 5
    };
  }

  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    aadharNo: '',
    gstNumber: '',
    toolShops: '',
    services: '',
    employees: '',
  });

  // open sheet with initialSelected + callback
  const openAddEmployees = () => {
    openSheet(BottomSheetType.ADDEMPLOYEE, {
      initialSelected: formData.employees,
      onSelect: (selectedEmployees: Employee[]) => {
        setFormData((prev) => ({ ...prev, employees: selectedEmployees }));
        setErrors((prev) => ({
          ...prev,
          employees: validateEmployees(formData.employees),
        }));
      },
    });
  };

  const removeEmployee = (id: string) => {
    setFormData(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
  };

  const handleToolShopPress = (toolshop: any) => {
    const isSelected = selectedToolShop.some((s) => s.id === toolshop.id);

    if (isSelected) {
      // 🔹 Remove the deselected toolshop
      const updated = selectedToolShop.filter((s) => s.id !== toolshop.id);
      setSelectedToolShop(updated);
      setFormData((prev) => ({
        ...prev,
        toolShops: updated.map((s) => s.id),
      }));
    } else {
      // 🔹 Add a new toolshop (with 5-limit protection)
      if (selectedToolShop.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 tool shops only.');
        return;
      }
      const updated = [...selectedToolShop, toolshop];
      setSelectedToolShop(updated);
      setFormData((prev) => ({
        ...prev,
        toolShops: updated.map((s) => s.id),
      }));
      // 🔹 live validation
      setErrors((prev) => ({
        ...prev,
        toolShops: updated.length === 0 ? 'Please select at least one tool shop' : '',
      }));
    }

  };







  // ==================== VALIDATIONS ====================
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Only letters and spaces allowed';
    return '';
  };

  const validateAge = (age: string): string => {
    const num = parseInt(age, 10);
    if (!age.trim()) return 'Age is required';
    if (isNaN(num)) return 'Age must be a number';
    if (num < 18 || num > 100) return 'Age must be between 18 and 100';
    return '';
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) return 'Address is required';
    if (address.length < 5) return 'Address must be at least 5 characters';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone)) return 'Phone must be 10 digits';
    return '';
  };

  const validateAadhar = (aadhar: string): string => {
    if (!aadhar.trim()) return 'Aadhar number is required';
    if (!/^\d{12}$/.test(aadhar)) return 'Aadhar must be 12 digits';
    return '';
  };

  const validateGST = (gst: string): string => {
    if (!gst.trim()) return 'GST number is required';
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst))
      return 'Invalid GST number format';
    return '';
  };

  const validateToolShops = (shops: any[]): string => {
    if (shops.length === 0) return 'Please select at least one tool shop';
    return '';
  };

  const validateServices = (services: any[]): string => {
    if (!services || services.length === 0)
      return 'Please select at least one service';
    if (services.length > 3)
      return 'You can select a maximum of 3 services';
    return '';
  };

  const validateEmployees = (employees: any[]): string => {
    if (!employees || employees.length === 0)
      return 'Please add at least one employee';
    return '';
  };




  // ==================== STEP RENDERING ====================
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            {role === UserRole.SINGLE_EMPLOYEE && (
              <>
                <Text style={styles.title}>Enter your Name and Age...</Text>
                <FloatingLabelInput
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    setErrors({ ...errors, name: validateName(text) });
                  }}
                  error={errors.name}
                />
                <FloatingLabelInput
                  label="Age"
                  value={formData.age}
                  onChangeText={(text) => {
                    setFormData({ ...formData, age: text });
                    setErrors({ ...errors, age: validateAge(text) });
                  }}
                  keyboardType="numeric"
                  error={errors.age}
                />
              </>
            )}
            {role === UserRole.MULTI_EMPLOYEE && (
              <>
                <Text style={styles.title}>Enter your Name (Owner name)...</Text>
                <FloatingLabelInput
                  label="Owner Name"
                  value={formData.ownerName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, ownerName: text });
                    setErrors({ ...errors, name: validateName(text) });
                  }}
                  error={errors.name}
                />
              </>
            )}
            {role === UserRole.TOOL_SHOP && (
              <>
                <Text style={styles.title}>Enter your owner name and Shop name...</Text>
                <FloatingLabelInput
                  label="Owner Name"
                  value={formData.ownerName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, ownerName: text });
                    setErrors({ ...errors, name: validateName(text) });
                  }}
                  error={errors.name}
                />
                <FloatingLabelInput
                  label="Shop Name"
                  value={formData.shopName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, shopName: text });
                    setErrors({ ...errors, name: validateName(text) });
                  }}
                  error={errors.name}
                />
              </>
            )}
          </>
        );

      case 1:
        return (
          <>
            <Text style={styles.title}>Enter your Address and Phone number...</Text>
            <FloatingLabelInput
              label="Address"
              value={formData.address}
              onChangeText={(text) => {
                setFormData({ ...formData, address: text });
                setErrors({ ...errors, address: validateAddress(text) });
              }}
              error={errors.address}
            />
            <FloatingLabelInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                setErrors({ ...errors, phone: validatePhone(text) });
              }}
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </>
        );

      case 2:
        return (
          <>
            {role === UserRole.SINGLE_EMPLOYEE && (
              <>
                <Text style={styles.title}>Enter your Aadhar Number...</Text>
                <FloatingLabelInput
                  label="Aadhar Number"
                  value={formData.aadharNo}
                  onChangeText={(text) => {
                    setFormData({ ...formData, aadharNo: text });
                    setErrors({ ...errors, aadharNo: validateAadhar(text) });
                  }}
                  keyboardType="numeric"
                  error={errors.aadharNo}
                />
              </>
            )}
            {role === UserRole.MULTI_EMPLOYEE && (
              <>
                <Text style={styles.title}>Add your Office Employees by employeeId...</Text>
                <View style={styles.addEmp}>
                  <CustomButton title={'Add Employees'} onPress={openAddEmployees}></CustomButton>
                </View>
                {errors.employees ? (
                  <Text style={{ color: 'red', marginBottom: 6 }}>{errors.employees}</Text>
                ) : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {formData.employees.map((emp) => (
                    <View key={emp.id} style={styles.chip}>
                      <Text style={styles.chipText}>{emp.empId} • {emp.name}</Text>
                      <TouchableOpacity onPress={() => removeEmployee(emp.id)}>
                        <Text style={styles.chipRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
            {role === UserRole.TOOL_SHOP && (
              <>
                <Text style={styles.title}>Enter your GST Number...</Text>
                <FloatingLabelInput
                  label="GST Number"
                  value={formData.gstNumber}
                  onChangeText={(text) => {
                    setFormData({ ...formData, gstNumber: text });
                    setErrors({ ...errors, gstNumber: validateGST(text) });
                  }}
                  //keyboardType="numeric"
                  error={errors.gstNumber}
                />
              </>
            )}

          </>
        );

      case 3:
        return (
          <>
            {role !== UserRole.TOOL_SHOP && (
              <>
                <Text style={styles.title}>Select Your Service ...</Text>
                {errors.services ? (
                  <Text style={{ color: 'red' }}>{errors.services}</Text>
                ) : null}
                <ServiceSelector
                  onSelectService={(selectedServices) => {
                    setFormData((prev) => ({
                      ...prev,
                      services: selectedServices, // store selected service list
                    }))
                    setErrors((prev) => ({
                      ...prev,
                      services: validateServices(selectedServices),
                    }));
                  }}
                />
              </>
            )}
            {role === UserRole.TOOL_SHOP && (
              <>
                <Text style={styles.title}>Select Your Tool Shop Domains ...</Text>
                {errors.toolShops ? (
                  <Text style={{ color: 'red' }}>{errors.toolShops}</Text>
                ) : null}

                <SearchBar
                  placeholder="Search tool shop domains..."
                  data={ToolShopDomainConfig}
                  searchKey="title"
                  onResults={setFilteredToolShop} />
                <FlatList
                  data={filteredToolShop}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  renderItem={({ item }) => (
                    <ServiceCard
                      title={item.title}
                      icon={item.icon}
                      onPress={() => handleToolShopPress(item)}
                      isSelected={selectedToolShop.some((s) => s.id === item.id)}
                    />
                  )}
                />
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // ==================== STEP HANDLER ====================
  const handleNext = () => {
    let newErrors = { ...errors };

    if (currentStep === 0) {
      if (role === UserRole.SINGLE_EMPLOYEE) {
        newErrors.name = validateName(formData.name);
        newErrors.age = validateAge(formData.age);
      } else if (role === UserRole.MULTI_EMPLOYEE) {
        newErrors.name = validateName(formData.ownerName);
      }
      else if (role === UserRole.TOOL_SHOP) {
        newErrors.name = validateName(formData.ownerName);
        newErrors.name = validateName(formData.shopName);
      }
    }
    else if (currentStep === 1) {
      newErrors.address = validateAddress(formData.address);
      newErrors.phone = validatePhone(formData.phone);
    }
    else if (currentStep === 2) {
      if (role === UserRole.SINGLE_EMPLOYEE) {
        newErrors.aadharNo = validateAadhar(formData.aadharNo);
      }
      else if (role === UserRole.MULTI_EMPLOYEE) {
        newErrors.employees = validateEmployees(formData.employees);
      }
    }
    else if (currentStep === 3) {
      if (role === UserRole.TOOL_SHOP) {
        newErrors.toolShops = validateToolShops(formData.toolShops);
      }
      else {
        newErrors.services = validateServices(formData.services);
      }
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((err) => err !== '');
    if (hasErrors) return;

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log('Final Form Data:', formData);
      login(role as UserRole);
      // submitRegistration(); //  backend call
    }
  };

  // ==================== UI ====================
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        showBack={currentStep > 0}
        onBackPress={() => setCurrentStep(currentStep - 1)}
      />
      <View style={styles.container}>{renderStepContent()}</View>

      <View style={styles.footer}>
        <CustomButton
          title={currentStep < 3 ? 'Next' : 'Register'}
          onPress={handleNext}
          widthCount={0.9}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    gap: 16,
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.h1,
    marginBottom: 8,
  },
  addEmp: {
    width: '65%',

  },
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

