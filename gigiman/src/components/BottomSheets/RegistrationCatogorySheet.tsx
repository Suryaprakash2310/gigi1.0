import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ServiceCard } from './ServiceCard';
import { theme } from '../../theme/theme';
import { REGISTRATION_CATEGORIES } from '../../utils/config/Registration.config';
import { useBottomSheet } from '../../context/BottomSheetContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';


interface RegistrationCatagorySheetProps {
  onSelect: (category: string) => void;

}



export const RegistrationCatagorySheet: React.FC<RegistrationCatagorySheetProps> = ({ onSelect }) => {  
  const { closeSheet } = useBottomSheet();
  
  const handleSelect = (category: string) => {
    closeSheet();
   onSelect(category);
  };



  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid}>
        {REGISTRATION_CATEGORIES.map((service) => (
          <ServiceCard
            key={service.id}
            title={service.title}
            icon={service.icon}
            onPress={() => handleSelect(service.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
