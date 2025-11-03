import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { ServiceCard } from '../../components/BottomSheets/ServiceCard';
import { SERVICES } from '../../utils/config/services.config';
import SearchBar from '../../components/SearchBar';

interface Props {
  onSelectService: (selectedServices: any[]) => void;
}

const ServiceSelector: React.FC<Props> = ({ onSelectService }) => {
  const [filteredServices, setFilteredServices] = useState(SERVICES);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  const handleServicePress = (service: any) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);

    if (isSelected) {
      setSelectedServices((prev) => prev.filter((s) => s.id !== service.id));
    } else {
      if (selectedServices.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 services only.');
        return;
      }
      setSelectedServices((prev) => [...prev, service]);
    }
  };

  useEffect(() => {
    onSelectService(selectedServices);
  }, [selectedServices]);

  return (
    <View style={{ flex: 1 }}>
      

      <SearchBar
        placeholder="Search services..."
        data={SERVICES}
        searchKey="title"
        onResults={setFilteredServices}
      />

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ServiceCard
            title={item.title}
            icon={item.icon}
            onPress={() => handleServicePress(item)}
            isSelected={selectedServices.some((s) => s.id === item.id)}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 18,
    fontWeight: '600',
    //marginVertical: 10,
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-evenly',
    //marginHorizontal: 10,
  },
});

export default ServiceSelector;
