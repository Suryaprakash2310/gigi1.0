import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface Item {
  name: string;
  quantity: number;
}

interface ClientRequest {
  name: string;
  work?: string;
  cost?: string;
  address?: string;
  items?: Item[];
  total?: number;
}

interface ClientRequestCardProps {
  data: ClientRequest;
  role?: 'employee' | 'toolshop';
  onAccept?: () => void;
  onReject?: () => void;
  index?: number; // optional for staggered animation
}

export const ClientRequestCard: React.FC<ClientRequestCardProps> = ({
  data,
  role = 'employee',
  onAccept,
  onReject,
  index = 0,
}) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Animate on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100, // stagger effect if used in a list
      useNativeDriver: true,
    }).start();

    Animated.timing(translateY, {
      toValue: 0,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, translateY, index]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.header}>CLIENT REQUEST</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          NAME : <Text style={styles.value}>{data.name}</Text>
        </Text>

        {role === 'toolshop' ? (
          <>
            {data.items?.map((item, index) => (
              <View key={index} style={styles.modalRow}>
                
                            <Text style={styles.modalItem}>{item.name}</Text>
                            <Text style={styles.modalQty}>x{item.quantity}</Text>
                            <Text style={styles.modalPrice}>₹{data.total}</Text>
                          
              </View>
            ))}
            {data.total && (
              <Text style={[styles.infoText, { marginTop: 5 }]}>
                TOTAL : <Text style={styles.value}>{data.total}</Text>
              </Text>
            )}
          </>
        ) : (
          <>
            {data.work && (
              <Text style={styles.infoText}>
                WORK : <Text style={styles.value}>{data.work}</Text>
              </Text>
            )}
            {data.cost && (
              <Text style={styles.infoText}>
                COST : <Text style={styles.value}>{data.cost}</Text>
              </Text>
            )}
            {data.address && (
              <Text style={styles.infoText}>
                ADDRESS : <Text style={styles.value}>{data.address}</Text>
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.acceptBtn}
          onPress={onAccept}
        >
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.rejectBtn}
          onPress={onReject}
        >
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.9,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginVertical: 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  header: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoContainer: {
    //marginVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    paddingRight:40
  },
  infoText: {
    fontSize: width * 0.038,
    color: '#333',
    marginVertical: 2,
  },
  value: {
    fontWeight: '600',
    color: '#000',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 2,
  },
  itemName: {
    fontSize: width * 0.038,
    color: '#444',
    //flex: 1,
  },
  itemQty: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#111',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: width * 0.025,
    paddingHorizontal: width * 0.1,
    borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: '#F44336',
    paddingVertical: width * 0.025,
    paddingHorizontal: width * 0.1,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: width * 0.04,
  },
  modalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginVertical: 6,
},
modalItem: {
  flex: 1,
  fontSize: 14,
  color: '#333',
},
modalQty: {
  width: 40,
  textAlign: 'center',
  fontWeight: '600',
},
modalPrice: {
  width: 60,
  textAlign: 'right',
  fontWeight: '600',
},
});



// import React from 'react';
// import { ScrollView, View, StyleSheet } from 'react-native';
// import { ClientRequestCard } from '../../components/common/ClientRequestCard';

// export const ToolShopDashboard = () => {
//   const requests = [
//     {
//       id: 1,
//       name: 'Suga',
//       work: 'Pipe replacement',
//       cost: '₹1200',
//       address: 'Trichy',
//     },
//     {
//       id: 2,
//       name: 'Anbu',
//       work: 'Switch setup',
//       cost: '₹800',
//       address: 'Madurai',
//     },
//   ];

//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scroll}>
//         {requests.map((req, index) => (
//           <ClientRequestCard
//             key={req.id}
//             data={req}
//             role="toolshop"
//             index={index}
//             onAccept={() => console.log('Accept', req.id)}
//             onReject={() => console.log('Reject', req.id)}
//           />
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9F9F9', paddingTop: 40 },
//   scroll: { paddingBottom: 80 },
// });



// import React, { useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, Switch, Dimensions } from 'react-native';
// import { ClientRequestCard } from '../../components/common/ClientRequestCard';
// import { theme } from '../../theme/theme';

// const { width } = Dimensions.get('window');

// export const EmployeeDashboard = () => {
//   const [workingMode, setWorkingMode] = useState(true);

//   // 🔹 Sample data (replace later with API data)
//   const [clientRequests, setClientRequests] = useState([
//     {
//       id: 1,
//       name: 'Suga',
//       items: [
//         { name: 'Tap', quantity: 20 },
//         { name: 'Pipe', quantity: 5 },
//       ],
//       total: 500,
//     },
//     {
//       id: 2,
//       name: 'Anbu',
//       items: [
//         { name: 'Switch', quantity: 10 },
//         { name: 'Wire', quantity: 15 },
//       ],
//       total: 800,
//     },
//   ]);

//   // 🔹 Handlers
//   const handleAccept = (id: number) => {
//     console.log(`Accepted Request ID: ${id}`);
//   };

//   const handleReject = (id: number) => {
//     console.log(`Rejected Request ID: ${id}`);
//   };

//   return (
//     <View style={styles.container}>
//       {/* ✅ Header */}
//       <View style={styles.headerContainer}>
//         <Text style={styles.headerText}>GIGIMAN</Text>
//         <Switch
//           value={workingMode}
//           onValueChange={setWorkingMode}
//           trackColor={{ false: '#767577', true: theme.colors.primary }}
//           thumbColor={workingMode ? '#fff' : '#f4f3f4'}
//         />
//       </View>

//       {/* ✅ Scrollable Request List */}
//       <ScrollView contentContainerStyle={styles.scrollArea}>
//         {clientRequests.map((req, index) => (
//           <ClientRequestCard
//             key={req.id}
//             data={req}
//             role="employee"
//             index={index}
//             onAccept={() => handleAccept(req.id)}
//             onReject={() => handleReject(req.id)}
//           />
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9F9F9',
//     paddingTop: 40,
//   },
//   headerContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: width * 0.05,
//     marginBottom: 10,
//   },
//   headerText: {
//     fontSize: width * 0.05,
//     fontWeight: '700',
//     color: theme.colors.primary,
//   },
//   scrollArea: {
//     paddingBottom: 80,
//   },
// });
