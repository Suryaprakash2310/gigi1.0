import React, { useContext, useEffect, useState } from 'react';
import { useAudioGuide } from '../../hooks/useAudioGuide';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, FlatList, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator, Button, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FloatingLabelInput from '../../components/TextInput';
import AppHeader from '../../components/AppHeader';
import CustomButton from '../../components/Bottom';
import { theme } from '../../theme/theme';
import ServiceSelector from './SingleService'; // renamed for consistency
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation<any>();
  const { role } = route.params || {};
  const [currentStep, setCurrentStep] = useState(0);
  const { openSheet } = useBottomSheet();
  const [toolShops, setToolShops] = useState<any[]>([]);
  const [filteredToolShop, setFilteredToolShop] = useState<any[]>([]);
  const [selectedToolShop, setSelectedToolShop] = useState<any[]>([])
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, userRole } = useContext(AuthContext);

  // ─── Audio Guide ───
  const { isMuted, toggleMute, replayCurrentStep } = useAudioGuide(currentStep, role);

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
      avatar: null as string | null,
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
      avatar: null as string | null,
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
      avatar: null as string | null,
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
    shopName: '',
    toolShops: '',
    services: '',
    avatar: '',
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
      setIsSubmitting(true);
      const data = new FormData();

      // Common fields included in majority of roles
      if (formData.avatar) {
        data.append('avatar', {
          uri: formData.avatar,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
      }

      let response;
      if (role === UserRole.SINGLE_EMPLOYEE) {
        data.append('fullname', formData.name);
        data.append('phoneNo', formData.phone);
        data.append('aadhaarNo', formData.aadharNo);
        data.append('longitude', String(coords?.longitude || ''));
        data.append('latitude', String(coords?.latitude || ''));
        data.append('role', UserRole.SINGLE_EMPLOYEE);
        formData.services.forEach((s: any) => data.append('services', s._id));
        
        response = await RegisterAPI.singleEmployee(data);
      } else if (role === UserRole.MULTI_EMPLOYEE) {
        data.append('storeName', 'no shop');
        data.append('ownerName', formData.ownerName);
        data.append('phoneNo', formData.phone);
        data.append('role', UserRole.MULTI_EMPLOYEE);
        data.append('longitude', String(coords?.longitude || ''));
        data.append('latitude', String(coords?.latitude || ''));
        data.append('ownerAadhaar', formData.aadharNo);
        formData.services.forEach((s: any) => data.append('services', s._id));
        
        response = await RegisterAPI.multipleEmployee(data);
      } else {
        data.append('shopName', formData.shopName);
        data.append('ownerName', formData.ownerName);
        data.append('gstNo', formData.gstNumber);
        data.append('phoneNo', formData.phone);
        data.append('longitude', String(coords?.longitude || ''));
        data.append('latitude', String(coords?.latitude || ''));
        data.append('role', UserRole.TOOL_SHOP);
        formData.toolShopDomain.forEach((id: string) => data.append('categories', id));
        
        response = await RegisterAPI.toolShop(data);
      }
      
      if (response.data?.token) {
        Alert.alert("Registration Successful");
        console.log('Registration Response:', response.data);
        const { token, role, id } = response.data;
        await login(role, token, id);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
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

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!res.canceled) {
      setFormData({ ...formData, avatar: res.assets[0].uri });
      setErrors({ ...errors, avatar: '' });
    }
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
        title: cat.domainpartname,
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
    if (name.length < 3) return 'Name must be at least 3 characters';
    if (name.length > 50) return 'Name cannot exceed 50 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Only letters and spaces allowed';
    return '';
  };

  const validateAge = (age: string): string => {
    const num = parseInt(age, 10);
    if (!age.trim()) return 'Age is required';
    if (isNaN(num)) return 'Age must be a number';
    if (num < 18 || num > 60) return 'Age must be between 18 and 60';
    return '';
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) return 'Address is required';
    if (address.length < 10 || address.length > 100) return 'Address must be between 10 and 100 characters';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Phone must be 10 digits and start with 6, 7, 8, or 9';
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




  const StepHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <View style={styles.stepHeaderContainer}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );

  // ==================== STEP RENDERING ====================
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <StepHeader title="Profile Photo" subtitle="Provide a clear photo of yourself" />
            <TouchableOpacity 
              style={styles.imagePicker} 
              onPress={pickImage}
            >
              {formData.avatar ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: formData.avatar }} style={styles.imagePreview} />
                  <View style={styles.changeImageOverlay}>
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={theme.colors.primary} />
                  <Text style={styles.imagePlaceholderText}>Upload Profile Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.avatar ? <Text style={styles.errorText}>{errors.avatar}</Text> : null}

            {role === UserRole.SINGLE_EMPLOYEE && (
              <>
                <StepHeader title="Personal Details" subtitle="Enter your name and age to continue" />
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
                <StepHeader title="Owner Details" subtitle="Enter the shop owner's name" />
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
                <StepHeader title="Shop Details" subtitle="Enter your shop and owner name" />
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
                    setErrors({ ...errors, shopName: validateName(text) });
                  }}
                  error={errors.shopName}
                />
              </>
            )}
          </>
        );

      case 1:
        return (
          <>
            <StepHeader title="Contact Info" subtitle="Enter your address and phone number" />
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
            <TouchableOpacity
              style={[
                styles.locationButton,
                coords ? styles.locationButtonSuccess : {},
                locLoading ? styles.locationButtonLoading : {}
              ]}
              onPress={detectLocation}
              disabled={locLoading}
              activeOpacity={0.7}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
              ) : coords ? (
                <Ionicons name="checkmark-circle" size={20} color="green" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="location-sharp" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              )}

              <Text style={[
                styles.locationButtonText,
                coords ? { color: 'green' } : { color: theme.colors.primary }
              ]}>
                {locLoading ? "Detecting..." : coords ? "Location Captured" : "Use Current Location"}
              </Text>
            </TouchableOpacity>

            {coords && (
              <Text style={{ marginTop: 8, color: "green", fontSize: 13 }}>
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
                <StepHeader title="Identity Verification" subtitle="Enter your Aadhar Number" />
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
                <StepHeader title="Identity Verification" subtitle="Enter owner's Aadhar Number" />
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
                <StepHeader title="Tax Information" subtitle="Enter your GST Number" />
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
                <StepHeader title="Services" subtitle="Select the services you provide" />
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
                <StepHeader title="Tool Shop Domains" subtitle="Select your tool shop specific domains" />
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
      if (!formData.avatar) {
        newErrors.avatar = 'Profile photo is required';
      }

      if (role === UserRole.SINGLE_EMPLOYEE) {
        newErrors.name = validateName(formData.name);
        newErrors.age = validateAge(formData.age);
      } else if (role === UserRole.MULTI_EMPLOYEE) {
        newErrors.name = validateName(formData.ownerName);
      }
      else if (role === UserRole.TOOL_SHOP) {
        newErrors.name = validateName(formData.ownerName);
        newErrors.shopName = validateName(formData.shopName);
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
        showBack={true}
        onBackPress={() => {
          if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
          } else {
            navigation.goBack();
          }
        }}
      />

      {/* ─── Progress Bar ─── */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive,
              currentStep === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* ─── Audio Guide Bar ─── */}
      <View style={styles.audioBar}>
        <View style={styles.audioBarInner}>
          {/* Left: Speaker icon with status dot */}
          <View style={styles.audioSpeakerWrap}>
            <View style={[
              styles.audioIconCircle,
              isMuted && styles.audioIconCircleMuted,
            ]}>
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={18}
                color={isMuted ? '#999' : '#fff'}
              />
            </View>
            {!isMuted && <View style={styles.audioLiveDot} />}
          </View>

          {/* Center: Label */}
          <View style={styles.audioLabelWrap}>
            <Text style={styles.audioBarTitle}>
              {isMuted ? 'Audio Paused' : '🔊 Listening Guide'}
            </Text>
            <Text style={styles.audioBarSubtitle}>
              Step {currentStep + 1} of 4
            </Text>
          </View>

          {/* Right: Action buttons */}
          <View style={styles.audioActions}>
            <TouchableOpacity
              style={[
                styles.audioActionBtn,
                isMuted && styles.audioActionBtnMuted,
              ]}
              onPress={toggleMute}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMuted ? 'play' : 'pause'}
                size={16}
                color={isMuted ? '#888' : theme.colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.audioActionBtn}
              onPress={replayCurrentStep}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <CustomButton
          title={currentStep < 3 ? t('common.save') : 'Register'}
          onPress={handleNext}
          widthCount={0.9}
          loading={isSubmitting}
          disabled={isSubmitting}
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eee',
  },
  progressDotActive: {
    backgroundColor: '#f5d6c8',
  },
  progressDotCurrent: {
    backgroundColor: theme.colors.primary,
    width: 32,
  },
  footer: {
    //padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  stepHeaderContainer: {
    marginBottom: 8,
  },
  stepTitle: {
    color: '#1a2e4a',
    fontSize: 28,
    fontFamily: 'Poppins',
    fontWeight: '700',
    marginBottom: 4,
  },
  stepSubtitle: {
    color: '#666',
    fontSize: 15,
    fontFamily: 'Poppins',
    lineHeight: 22,
    marginBottom: 6,
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary, // or a neutral border if preferred initially
    backgroundColor: '#fff', // or a light tint
    marginTop: 10,
    borderStyle: 'dashed', // optional aesthetics
  },
  locationButtonSuccess: {
    borderColor: 'green',
    backgroundColor: '#f0fdf4', // light green bg
    borderStyle: 'solid',
  },
  locationButtonLoading: {
    opacity: 0.7,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  audioBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  audioBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2ee',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#f5d6c8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  audioSpeakerWrap: {
    position: 'relative',
    marginRight: 12,
  },
  audioIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconCircleMuted: {
    backgroundColor: '#e0e0e0',
  },
  audioLiveDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fdf2ee',
  },
  audioLabelWrap: {
    flex: 1,
  },
  audioBarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a2e4a',
    fontFamily: 'Poppins',
  },
  audioBarSubtitle: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'Poppins',
    marginTop: 1,
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  audioActionBtnMuted: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 8,
  },
});