import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../theme/theme';
import { ServiceSheet } from '../components/BottomSheets/ServiceSheet';

// Enum for all types of bottom sheets in app
export enum BottomSheetType {
  NONE = 'NONE',
  SERVICE_SHEET = 'SERVICE_SHEET',
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

const BottomSheetContext = createContext<BottomSheetContextProps | undefined>(undefined);

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) throw new Error('useBottomSheet must be used inside BottomSheetProvider');
  return context;
};

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const [sheetType, setSheetType] = useState<BottomSheetType>(BottomSheetType.NONE);
  const [sheetData, setSheetData] = useState<any>(null);

  const openSheet = (type: BottomSheetType, data?: any) => {
    setSheetType(type);
    setSheetData(data || null);
  };

  const closeSheet = () => {
    setSheetType(BottomSheetType.NONE);
    setSheetData(null);
  };

  const renderSheet = () => {
    switch (sheetType) {
      case BottomSheetType.SERVICE_SHEET:
        return <ServiceSheet />;
      // Add new sheets easily here:
      // case BottomSheetType.PROFILE_SHEET:
      //   return <ProfileSheet />;
      default:
        return null;
    }
  };

  return (
    <BottomSheetContext.Provider value={{ sheetType, sheetData, openSheet, closeSheet }}>
      {children}

      {/* Global bottom sheet modal */}
      <Modal
        visible={sheetType !== BottomSheetType.NONE}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>{renderSheet()}</View>
      </Modal>
    </BottomSheetContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
     backgroundColor: 'rgba(91, 88, 88, 0.4)',
  },
  sheetContainer: {
    //backgroundColor: 'rgba(217, 214, 214, 0.4)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '85%',
  },
});
