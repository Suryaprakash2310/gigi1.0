import React, { useEffect, useRef, useState } from 'react';
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
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface Item {
  name: string;
  quantity: number;
}

interface TeamMember {
  _id: string;
  fullname: string;
}

interface ClientRequest {
  name: string;
  serviceCategoryName?: string;
  cost?: string;
  durationInMinutes?: string;
  address?: string;
  items?: Item[];
  total?: number;
  expiresAt?: number;
}

interface ClientRequestCardProps {
  data: ClientRequest;
  role?: 'employee' | 'toolshop' | 'team_owner';

  // common
  onAccept?: () => void;
  onReject?: () => void;

  // team owner only
  teamMembers?: TeamMember[];
  employeeCount?: number;
  onTeamAccept?: (data: {
    leaderEmpId: string;
    helperEmpIds: string[];
  }) => void;

  index?: number;
}

export const ClientRequestCard: React.FC<ClientRequestCardProps> = ({
  data,
  role = 'employee',
  onAccept,
  onReject,
  teamMembers = [],
  employeeCount = 1,
  onTeamAccept,
  index = 0,
}) => {
  /** animation */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const TOTAL_DURATION = 50000; // 50 sec
const [remaining, setRemaining] = useState<number>(0);
const [expired, setExpired] = useState(false);
const [displayAddress, setDisplayAddress] = useState<string>(data.address || "");

useEffect(() => {
  setDisplayAddress(data.address || "");
  const resolveAddress = async () => {
    if (!data.address) return;
    const addrLower = data.address.toLowerCase();
    let lat, lng;

    if (addrLower === 'current_location' || addrLower === 'current location') {
      // In dashboard context, we might not have the coordinates directly in 'data'
      // unless we pass it. If data has coordinates, we can reverse geocode.
      if ((data as any).coordinates) {
        lng = (data as any).coordinates[0];
        lat = (data as any).coordinates[1];
      }
    } else if (addrLower.startsWith('coordinates:')) {
      const parts = data.address.replace(/Coordinates:\s*/i, '').split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      try {
        const geocodeResult = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocodeResult && geocodeResult.length > 0) {
          const place = geocodeResult[0];
          const addrText = [place.name, place.street, place.city, place.region].filter(Boolean).join(', ');
          if (addrText) setDisplayAddress(addrText);
        }
      } catch (e) {
        console.log("Reverse geocoding failed", e);
      }
    }
  };
  resolveAddress();
}, [data.address, data]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  useEffect(() => {
  if (!data.expiresAt) return;

  const now = Date.now();
  const initialRemaining = Math.max(data.expiresAt - now, 0);

  setRemaining(Math.ceil(initialRemaining / 1000));

  // Start animated progress
  Animated.timing(progressAnim, {
    toValue: 0,
    duration: initialRemaining,
    useNativeDriver: false,
  }).start();

  const interval = setInterval(() => {
    const timeLeft = data.expiresAt! - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      setExpired(true);
      setRemaining(0);
    } else {
      setRemaining(Math.ceil(timeLeft / 1000));
    }
  }, 1000);

  return () => clearInterval(interval);
}, [data.expiresAt]);

  /** TEAM OWNER STATE */
  const [leader, setLeader] = useState<string | null>(null);
  const [helpers, setHelpers] = useState<string[]>([]);

  const requiredHelpers = Math.max(employeeCount - 1, 0);

  const toggleHelper = (id: string) => {
    if (helpers.includes(id)) {
      setHelpers(prev => prev.filter(h => h !== id));
    } else {
      if (helpers.length >= requiredHelpers) return;
      setHelpers(prev => [...prev, id]);
    }
  };

  const canAccept =
    role !== 'team_owner' ||
    (leader !== null &&
      helpers.length === requiredHelpers &&
      !helpers.includes(leader));

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.header}>CLIENT REQUEST</Text>

      {/* BASIC INFO */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          NAME : <Text style={styles.value}>{data.name}</Text>
        </Text>

        {role === 'toolshop' && (
          <>
            {data.items?.map((item, i) => (
              <View key={i} style={styles.modalRow}>
                <Text style={styles.modalItem}>{item.name}</Text>
                <Text style={styles.modalQty}>x{item.quantity}</Text>
                <Text style={styles.modalPrice}>₹{data.total}</Text>
              </View>
            ))}
          </>
        )}

        {role !== 'toolshop' && (
          <>
            {data.serviceCategoryName && (
              <Text style={styles.infoText}>
                WORK : <Text style={styles.value}>{data.serviceCategoryName}</Text>
              </Text>
            )}
            {displayAddress ? (
              <Text style={styles.infoText}>
                ADDRESS : <Text style={styles.value}>{displayAddress}</Text>
              </Text>
            ) : null}
            {
              data.cost && (
                <Text style={styles.infoText}>
                  COST : <Text style={styles.value}>₹ {data.cost}</Text>
                </Text>
              )
            }
            {
              data.durationInMinutes && (
                <Text style={styles.infoText}>
                  DURATION : <Text style={styles.value}>{data.durationInMinutes}</Text>
                </Text>
              )
            }
          </>
        )}
      </View>

      {/* TEAM OWNER UI */}
      {role === 'team_owner' && (
        <>
          <Text style={styles.sectionTitle}>Select Leader</Text>
          {teamMembers.map(emp => (
            <TouchableOpacity
              key={emp._id}
              style={[
                styles.selectBox,
                leader === emp._id && styles.selected,
              ]}
              onPress={() => setLeader(emp._id)}
            >
              <Text>{emp.fullname}</Text>
            </TouchableOpacity>
          ))}

          {requiredHelpers > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Select Helpers ({requiredHelpers})
              </Text>
              {teamMembers.map(emp => (
                <TouchableOpacity
                  key={emp._id}
                  disabled={emp._id === leader}
                  style={[
                    styles.selectBox,
                    helpers.includes(emp._id) && styles.helperSelected,
                    emp._id === leader && { opacity: 0.4 },
                  ]}
                  onPress={() => toggleHelper(emp._id)}
                >
                  <Text>{emp.fullname}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      )}

      {data.expiresAt && !expired && (
  <View style={styles.timerContainer}>
    <Animated.View
      style={[
        styles.timerBar,
        {
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
          backgroundColor:
            remaining <= 10 ? "#EF4444" : "#22C55E",
        },
      ]}
    />
    <Text style={styles.timerText}>
      {remaining}s remaining
    </Text>
  </View>
)}

      {/* ACTIONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.rejectBtn}
          onPress={onReject}
        >
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={expired || !canAccept}
          style={[
            styles.acceptBtn,
            (expired || !canAccept) && { opacity: 0.4 },
          ]}
          onPress={() => {
            if (expired || !canAccept) return;
            if (role === 'team_owner' && leader) {
              onTeamAccept?.({
                leaderEmpId: leader,
                helperEmpIds: helpers,
              });
            } else {
              onAccept?.();
            }
          }}
        >
          <Text style={styles.btnText}>
            {role === 'team_owner' ? 'Assign & Accept' : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.92,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 8,
  },
  infoText: {
    fontSize: 14,
    marginVertical: 2,
  },
  value: {
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 12,
    fontWeight: '700',
  },
  selectBox: {
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginVertical: 4,
  },
  selected: {
    backgroundColor: '#DCFCE7',
  },
  helperSelected: {
    backgroundColor: '#DBEAFE',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  acceptBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalItem: { flex: 1 },
  modalQty: { width: 40, textAlign: 'center' },
  modalPrice: { width: 60, textAlign: 'right' },
  timerContainer: {
  marginTop: 10,
  backgroundColor: "#E5E7EB",
  borderRadius: 8,
  height: 20,
  overflow: "hidden",
  justifyContent: "center",
},
timerBar: {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
},
timerText: {
  textAlign: "center",
  fontSize: 12,
  fontWeight: "600",
},
});




/*
<ClientRequestCard
  role="team_owner"
  data={booking}
  teamMembers={team.members}
  employeeCount={booking.employeeCount}
  onReject={() => socket.emit("team-reject", {...})}
  onTeamAccept={({ leaderEmpId, helperEmpIds }) => {
    socket.emit("team-accept", {
      bookingId: booking._id,
      teamId,
      leaderEmpId,
      helperEmpIds,
    });
  }}
/>

*/