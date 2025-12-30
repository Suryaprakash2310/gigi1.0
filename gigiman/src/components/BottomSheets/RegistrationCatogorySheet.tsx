import React from 'react';
import { View, ScrollView, StyleSheet, Text, Dimensions } from 'react-native';
import { ServiceCard } from './ServiceCard';
import { theme } from '../../theme/theme';
import { REGISTRATION_CATEGORIES } from '../../utils/config/Registration.config';
import { useBottomSheet } from '../../context/BottomSheetContext';

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
      <Text style={styles.header}>Select your category</Text>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {REGISTRATION_CATEGORIES.map((service) => (
          <View key={service.id} style={styles.cardWrapper}>
            <ServiceCard
              title={service.title}
              icon={service.icon}
              onPress={() => handleSelect(service.id)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 16 * 2 - CARD_MARGIN * 2) / 2; // 2 cards per row

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: 24,
  },
  cardWrapper: {
    //width: CARD_WIDTH,
    margin: CARD_MARGIN,
  },
});