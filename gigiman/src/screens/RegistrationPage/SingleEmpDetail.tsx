import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, FlatList, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator, Button } from 'react-native';
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
import { RegisterAPI } from '@/api/register';
import { ServiceAPI } from '@/api/service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCategories } from '@/api/parts.api';
import { t } from 'i18next';
import { getCurrentLocation } from '@/utils/location';

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
  const [toolShops, setToolShops] = useState<any[]>([]);
  const [filteredToolShop, setFilteredToolShop] = useState<any[]>([]);
  const [selectedToolShop, setSelectedToolShop] = useState<any[]>([])
  const [loading, setLoading] = useState(false);
  const { login, userRole } = useContext(AuthContext);

  let initialFormData;
  if (role === UserRole.MULTI_EMPLOYEE) {
    initialFormData = {
      ownerName: '',
      phone: '',
      address: '',
      services: [],
      longitude: null,
      latitude: null,
      aadharNo: '',
      //employees: [], // list of employees
    };
  } else if (role === UserRole.TOOL_SHOP) {
    initialFormData = {
      ownerName: '',
      shopName: '',
      phoneNo: '',
      //   location: {
      //   type: 'Point',
      //   coordinates: [], // [longitude, latitude]
      // },
      longitude: null,
      latitude: null,
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
      longitude: null,
      latitude: null,
      services: [], // up to 5
    };
  }

  const [formData, setFormData] = useState(initialFormData);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    aadharNo: '',
    gstNumber: '',
    toolShops: '',
    services: '',
    //employees: '',
  });

  const detectLocation = async () => {
    try {
      setLocLoading(true);
      const location = await getCurrentLocation();
      setCoords(location);
      Alert.alert("Location detected");
      console.log("Detected Location:", location);
    } catch (err: any) {
      Alert.alert("Location Error", err.message);
    } finally {
      setLocLoading(false);
    }
  };

  const submitRegistration = async () => {
    try {
      let response;
      if (role === UserRole.SINGLE_EMPLOYEE) {
        response = await RegisterAPI.singleEmployee({
          fullname: formData.name,
          phoneNo: formData.phone,
          aadhaarNo: formData.aadharNo,
          // address: {
          //   city: formData.address, // simplify until you add structured inputs
          //   state: "Tamil Nadu",
          //   pincode: "600001",
          // },
          // location: {
          //   type: "Point",
          //   coordinates: [
          //     formData.coords?.longitude,
          //     formData.coords?.latitude,
          //   ],
          // },
          longitude: coords?.longitude,
          latitude: coords?.latitude,


          services: formData.services.map((s: any) => s._id),
          role: UserRole.SINGLE_EMPLOYEE,
        });
      } else if (role === UserRole.MULTI_EMPLOYEE) {
        response = await RegisterAPI.multipleEmployee({
          storeName: 'no shop',
          ownerName: formData.ownerName,
          //gstNo: "9898989898767675",
          //storeLocation: formData.address,
          phoneNo: formData.phone,
          role: UserRole.MULTI_EMPLOYEE,
          longitude: coords?.longitude,
          latitude: coords?.latitude,
          ownerAadhaar: formData.aadharNo,      // MUST match backend enum exactly
          // members: ["E0019"],                 // array
          //pendingRequests: ["E0019"],
          services: formData.services.map((s: any) => s._id),
        });
      } else {
        response = await RegisterAPI.toolShop({
          shopName: formData.shopName,
          ownerName: formData.ownerName,
          gstNo: formData.gstNumber,
          phoneNo: formData.phone,
          // location: {
          //   type: "Point",
          //   coordinates: [coords?.longitude, coords?.latitude],
          // },
          longitude: coords?.longitude,
          latitude: coords?.latitude,
          categories: formData.toolShopDomain, // ids
          role: UserRole.TOOL_SHOP,
        });
      }
      if (response.data?.token) {
        Alert.alert("Registration Successful");
        console.log('Registration Response:', response.data);
        const { token, role, id } = response.data;
        await login(role, token, id);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Registration failed");
    }
  };

  //const token = response.data.token;

  // 2️⃣ Add all selected services in one API call
  //     const selectedIds = formData.services.map((s: any) => s._id);

  // try {
  //   const serviceResponse = await ServiceAPI.addMultipleServices(token, selectedIds);
  //   console.log("Service Response:", serviceResponse);
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //   login(role, token);
  // } catch (serviceErr) {
  //   console.error("❌ Service Add Error:", serviceErr);
  //   Alert.alert("Error", "Service assignment failed. Please try again.");
  // }


  // 3️⃣ Save token + role and login
  // await AsyncStorage.setItem("userToken", token);
  // await AsyncStorage.setItem("userRole", role);


  //   Alert.alert("Success", "Employee registered with services!");
  // } catch (err) {
  //   console.error("❌ Registration or Service Add Error:", err);
  //   Alert.alert("Error", "Registration failed. Please try again.");
  // }
  // };


  // open sheet with initialSelected + callback
  // const openAddEmployees = () => {
  //   openSheet(BottomSheetType.ADDEMPLOYEE, {
  //     initialSelected: formData.employees,
  //     onSelect: (selectedEmployees: Employee[]) => {
  //       setFormData((prev) => ({ ...prev, employees: selectedEmployees }));
  //       setErrors((prev) => ({
  //         ...prev,
  //         employees: validateEmployees(formData.employees),
  //       }));
  //     },
  //   });
  // };


  // const loadCategories = async () => {
  //     const res = await fetchCategories();
  //     setCategories(res.categories || []);
  //   };

  const removeEmployee = (id: string) => {
    setFormData(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
  };

  const handleToolShopPress = (toolshop: any) => {
    setSelectedToolShop((prevSelected) => {
      const isSelected = prevSelected.some(s => s.id === toolshop.id);

      const updated = isSelected
        ? prevSelected.filter(s => s.id !== toolshop.id)
        : [...prevSelected, toolshop];

      // 🔥 SINGLE SOURCE OF TRUTH
      setFormData(prev => ({
        ...prev,
        toolShopDomain: updated.map(s => s.id),
      }));

      // 🔥 CLEAR ERROR LIVE
      setErrors(prev => ({
        ...prev,
        toolShops: updated.length === 0
          ? 'Please select at least one tool shop'
          : '',
      }));

      return updated;
    });
  };



  useEffect(() => {
    if (currentStep === 3 && role === UserRole.TOOL_SHOP) {
      setLoading(true);
      loadCategories();
    }
  }, [currentStep, role]);
  const loadCategories = async () => {
    try {
      const response = await fetchCategories(); // response is the full object
      const categories = response.categories;   // extract the actual array

      if (!Array.isArray(categories)) {
        console.error("❌ Expected array but got:", categories);
        return;
      }

      const formatted = categories.map((cat: any) => ({
        id: cat._id,
        title: cat.domainPartsName,
        icon: null,
      }));

      setToolShops(formatted);
      setFilteredToolShop(formatted);
    } catch (err) {
      console.log("❌ Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }





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
            <Button
              title={locLoading ? "Detecting location..." : "Use Current Location"}
              onPress={detectLocation}
              disabled={locLoading}
            />

            {coords && (
              <Text style={{ marginTop: 8, color: "textMuted" }}>
                Location captured ✔
              </Text>
            )}
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
                <Text style={styles.title}>Enter your owner's Aadhar Number...</Text>
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
                  data={filteredToolShop}
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
        newErrors.aadharNo = validateAadhar(formData.aadharNo);
      }
    }
    else if (currentStep === 3) {
      if (role === UserRole.TOOL_SHOP) {
        newErrors.toolShops = validateToolShops(formData.toolShopDomain);
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
      submitRegistration(); //  backend call
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
          title={currentStep < 3 ? t('common.save') : 'Register'}
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
    //padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
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

