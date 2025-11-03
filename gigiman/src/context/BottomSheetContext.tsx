import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Animated, Easing, Dimensions } from 'react-native';
import { theme } from '../theme/theme';
import { ServiceSheet } from '../components/BottomSheets/ServiceSheet';
import { RegistrationCatagorySheet } from '../components/BottomSheets/RegistrationCatogorySheet';
import { AddEmployeeSheet } from '../screens/RegistrationPage/AddEmployeeSheet';

const { height } = Dimensions.get('window');

// Enum for all types of bottom sheets in app
export enum BottomSheetType {
  NONE = 'NONE',
  SERVICE_SHEET = 'SERVICE_SHEET',
  REGISTRATION_CATAGORY_SHEET = 'REGISTRATION_CATAGORY_SHEET',
  ADDEMPLOYEE = "AddEmployeeSheet",
  // Add more variants as needed:
  // PROFILE_SHEET = 'PROFILE_SHEET',
  // FILTER_SHEET = 'FILTER_SHEET',
}

interface BottomSheetContextProps {
  sheetType: BottomSheetType;
  sheetData?: any;
  openSheet: (type: BottomSheetType, data?: any) => void;
  closeSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextProps >(undefined);

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) throw new Error('useBottomSheet must be used inside BottomSheetProvider');
  return context;
};

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const [sheetType, setSheetType] = useState<BottomSheetType>(BottomSheetType.NONE);
  const [sheetData, setSheetData] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(height)).current; // start off-screen

  const openSheet = (type: BottomSheetType, data?: any) => {
    setSheetType(type);
    setSheetData(data || null);
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSheetType(BottomSheetType.NONE);
      setSheetData(null);
    });
  };

  useEffect(() => {
    if (sheetType !== BottomSheetType.NONE) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
  }, [sheetType]);


  const renderSheet = useMemo(() => {
  switch (sheetType) {
    case BottomSheetType.SERVICE_SHEET:
      return <ServiceSheet />;
    case BottomSheetType.REGISTRATION_CATAGORY_SHEET:
      return <RegistrationCatagorySheet {...sheetData} />;
    case BottomSheetType.ADDEMPLOYEE:
      return <AddEmployeeSheet />;
    default:
      return null;
  }
}, [sheetType, sheetData]);


  return (
    <BottomSheetContext.Provider value={{ sheetType, sheetData, openSheet, closeSheet }}>
      {children}

      {/* Global bottom sheet modal */}
      <Modal
        visible={sheetType !== BottomSheetType.NONE}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        {/* Dimmed overlay */}
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View style={[styles.overlay, { opacity: slideAnim.interpolate({
            inputRange: [0, height],
            outputRange: [1, 0],
          }) }]} />
        </TouchableWithoutFeedback>

        {/* Animated sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.dragIndicator} />
          {renderSheet}
        </Animated.View>
      </Modal>
    </BottomSheetContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors.background || '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 15,
  },
  dragIndicator: {
    width: 50,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 8,
  },
});
