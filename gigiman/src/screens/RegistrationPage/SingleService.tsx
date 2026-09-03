import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ServiceCard } from '../../components/BottomSheets/ServiceCard';
import SearchBar from '../../components/SearchBar';
import { Service, ServiceAPI } from '../../api/service';


interface Props {
  onSelectService: (selectedServices: Service[]) => void;
}

const ServiceSelector: React.FC<Props> = ({ onSelectService }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchServices = async () => {
  //     try {
  //       const data = await ServiceAPI.getAll();
  //       if (data.success && data.services) {
  //         setServices(data.services);
  //         setFilteredServices(data.services);
  //         console.log(data.services);
  //       }
  //     } catch (err) {
  //       Alert.alert("Error", "Failed to fetch services");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchServices();
  // }, []);

  useEffect(() => {
  const fetchServices = async () => {
    try {
      console.log("Fetching services from API...");
      const data = await ServiceAPI.getAll();
      console.log("API Response:", data);

      if (data.services && Array.isArray(data.services)) {
        setServices(data.services);
        setFilteredServices(data.services);
      } else {
        console.warn("⚠️ No services found or unexpected data:", data);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      Alert.alert("Error", "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };
  fetchServices();
}, []);


  useEffect(() => {
    onSelectService(selectedServices);
  }, [selectedServices]);

  const handleServicePress = (service: Service) => {
    const isSelected = selectedServices.some((s) => s._id === service._id);

    if (isSelected) {
      setSelectedServices((prev) => prev.filter((s) => s._id !== service._id));
    } else {
      if (selectedServices.length >= 3) {
        Alert.alert('Limit Reached', 'You can select up to 3 services only.');
        return;
      }
      setSelectedServices((prev) => [...prev, service]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <>
          <SearchBar
            placeholder="Search services..."
            data={services}
            searchKey="domainName"
            onResults={setFilteredServices}
          />
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => (
              <ServiceCard
                title={item.domainName}
                icon={item.serviceImage}
                onPress={() => handleServicePress(item)}
                isSelected={selectedServices.some((s) => s._id === item._id)}
              />
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-evenly',
  },
});

export default ServiceSelector;
