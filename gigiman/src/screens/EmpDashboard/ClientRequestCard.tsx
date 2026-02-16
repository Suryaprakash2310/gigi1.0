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

  // const canAccept =
  //   role !== 'team_owner' ||
  //   (leader &&
  //     helpers.length === requiredHelpers &&
  //     !helpers.includes(leader));

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
            {data.address && (
              <Text style={styles.infoText}>
                ADDRESS : <Text style={styles.value}>{data.address}</Text>
              </Text>
            )}
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
          // disabled={!canAccept}
          style={[
            styles.acceptBtn,
            // !canAccept && { opacity: 0.4 },
          ]}
          onPress={() => {
            // if (role === 'team_owner' && onTeamAccept && leader) {
            //   onTeamAccept({
            //     leaderEmpId: leader,
            //     helperEmpIds: helpers,
            //   });
            // } else {
            onAccept?.();
            // }
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