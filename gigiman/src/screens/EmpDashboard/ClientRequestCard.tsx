import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { parseCoordinates, reverseGeocodeCoordinates } from '@/utils/location';

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
  coordinates?: any;
  location?: any;
  userLocation?: any;
  items?: Item[];
  total?: number;
  expiresAt?: number;
  isScheduled?: boolean;
  scheduleDateTime?: string;
  createdAt?: string;
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
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string>(data.address || '');

  useEffect(() => {
    let isMounted = true;
    setDisplayAddress(data.address || '');

    const resolveAddress = async () => {
      const addr = data.address || '';
      const addrLower = addr.toLowerCase().trim();
      const isGenericAddress =
        !addr ||
        addrLower === 'current_location' ||
        addrLower === 'current location' ||
        addrLower.startsWith('coordinates:') ||
        /^[-0-9.,\s]+$/.test(addr.trim());

      const coords =
        parseCoordinates(data) ||
        (addr ? parseCoordinates(addr) : null);

      if (coords) {
        if (isGenericAddress) {
          const resolved = await reverseGeocodeCoordinates(coords);
          if (resolved && isMounted) {
            setDisplayAddress(resolved);
          }
        }
      }
    };

    resolveAddress();
    return () => {
      isMounted = false;
    };
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

    // Calculate total duration (default 30s or expiresAt - createdAt)
    const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : (data.expiresAt - 30000);
    const totalDuration = Math.max(data.expiresAt - createdAtMs, 30000);
    const initialRatio = Math.max(0, Math.min(1, initialRemaining / totalDuration));

    progressAnim.setValue(initialRatio);

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

  // Automatically default leader to the first available member/owner if not yet selected
  useEffect(() => {
    if (role === 'team_owner' && !leader && teamMembers.length > 0) {
      setLeader(teamMembers[0]._id);
    }
  }, [role, teamMembers, leader]);

  const toggleHelper = (id: string) => {
    if (helpers.includes(id)) {
      setHelpers((prev) => prev.filter((h) => h !== id));
    } else {
      if (helpers.length >= requiredHelpers) return;
      setHelpers((prev) => [...prev, id]);
    }
  };

  const canAccept =
    role !== 'team_owner' ||
    ((leader !== null || teamMembers.length > 0) &&
      (requiredHelpers === 0 || helpers.length === requiredHelpers) &&
      !helpers.includes(leader || ''));

  const timerColor =
    remaining <= 10 ? '#EF4444' : remaining <= 20 ? '#F59E0B' : '#10B981';

  const formattedTime = data.scheduleDateTime
    ? new Date(data.scheduleDateTime).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : data.createdAt
    ? new Date(data.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Immediate';

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY }] },
      ]}
    >
      {/* TOP HEADER: BADGES */}
      <View style={styles.topBadgeRow}>
        <View style={styles.requestTypeBadge}>
          <View style={styles.liveIndicatorDot} />
          <Text style={styles.requestTypeBadgeText}>
            {role === 'toolshop' ? 'PARTS REQUEST' : 'NEW BOOKING REQUEST'}
          </Text>
        </View>

        <View
          style={[
            styles.timeTypeBadge,
            data.isScheduled ? styles.scheduledBadge : styles.instantBadge,
          ]}
        >
          <Ionicons
            name={data.isScheduled ? 'calendar-outline' : 'flash-outline'}
            size={12}
            color={data.isScheduled ? '#2563EB' : '#D97706'}
          />
          <Text
            style={[
              styles.timeTypeBadgeText,
              { color: data.isScheduled ? '#2563EB' : '#D97706' },
            ]}
          >
            {data.isScheduled ? 'Scheduled' : 'Instant'}
          </Text>
        </View>
      </View>

      {/* CLIENT HERO SECTION */}
      <View style={styles.clientHeroCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={20} color="#0D9488" />
        </View>

        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {data.name || 'Customer'}
          </Text>
          {role !== 'toolshop' && data.serviceCategoryName && (
            <View style={styles.categoryPill}>
              <Ionicons name="construct-outline" size={11} color="#0F766E" />
              <Text style={styles.categoryPillText} numberOfLines={1}>
                {data.serviceCategoryName}
              </Text>
            </View>
          )}
        </View>

        {(data.cost || (role === 'toolshop' && data.total)) && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Payout</Text>
            <Text style={styles.priceValue}>
              ₹{data.cost || data.total}
            </Text>
          </View>
        )}
      </View>

      {/* TOOLSHOP ITEMS (IF TOOLSHOP) */}
      {role === 'toolshop' && data.items && data.items.length > 0 && (
        <View style={styles.toolshopContainer}>
          <View style={styles.toolshopHeader}>
            <Ionicons name="cube-outline" size={14} color="#64748B" />
            <Text style={styles.toolshopTitle}>Requested Parts</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.toolshopRow}>
              <Text style={styles.toolshopItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.toolshopQtyBadge}>
                <Text style={styles.toolshopQtyText}>x{item.quantity}</Text>
              </View>
              <Text style={styles.toolshopPrice}>₹{data.total}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ADDRESS SECTION */}
      {role !== 'toolshop' && displayAddress ? (
        <View style={styles.addressBox}>
          <Ionicons
            name="location-sharp"
            size={16}
            color="#0D9488"
            style={styles.addressIcon}
          />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLabel}>SERVICE LOCATION</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {displayAddress}
            </Text>
          </View>
        </View>
      ) : null}

      {/* META DETAILS CHIPS */}
      {role !== 'toolshop' && (
        <View style={styles.metaChipsRow}>
          {data.durationInMinutes ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={styles.metaChipText}>{data.durationInMinutes}</Text>
            </View>
          ) : null}

          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text style={styles.metaChipText}>{formattedTime}</Text>
          </View>

          {employeeCount > 1 ? (
            <View style={styles.metaChip}>
              <Ionicons name="people-outline" size={13} color="#64748B" />
              <Text style={styles.metaChipText}>{employeeCount} Servicers</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* TEAM OWNER SELECTION UI */}
      {role === 'team_owner' && (
        <View style={styles.teamSection}>
          <View style={styles.teamSectionHeader}>
            <Ionicons name="person-circle-outline" size={16} color="#0F172A" />
            <Text style={styles.sectionTitle}>Assign Team Leader</Text>
          </View>
          <View style={styles.memberList}>
            {teamMembers.map((emp) => {
              const isSelected = leader === emp._id;
              return (
                <TouchableOpacity
                  key={emp._id}
                  activeOpacity={0.7}
                  style={[styles.selectBox, isSelected && styles.leaderSelectedBox]}
                  onPress={() => setLeader(emp._id)}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={17}
                    color={isSelected ? '#059669' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.memberText,
                      isSelected && styles.memberTextSelected,
                    ]}
                  >
                    {emp.fullname}
                  </Text>
                  {isSelected && (
                    <View style={styles.leaderBadge}>
                      <Text style={styles.leaderBadgeText}>Leader</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {requiredHelpers > 0 && (
            <>
              <View style={[styles.teamSectionHeader, { marginTop: 12 }]}>
                <Ionicons name="people-outline" size={16} color="#0F172A" />
                <Text style={styles.sectionTitle}>
                  Select Helpers ({helpers.length}/{requiredHelpers})
                </Text>
              </View>
              <View style={styles.memberList}>
                {teamMembers.map((emp) => {
                  const isLeader = emp._id === leader;
                  const isSelected = helpers.includes(emp._id);
                  return (
                    <TouchableOpacity
                      key={emp._id}
                      disabled={isLeader}
                      activeOpacity={0.7}
                      style={[
                        styles.selectBox,
                        isSelected && styles.helperSelectedBox,
                        isLeader && styles.leaderDisabledBox,
                      ]}
                      onPress={() => toggleHelper(emp._id)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={17}
                        color={
                          isSelected
                            ? '#2563EB'
                            : isLeader
                            ? '#CBD5E1'
                            : '#94A3B8'
                        }
                      />
                      <Text
                        style={[
                          styles.memberText,
                          isSelected && styles.memberTextHelperSelected,
                          isLeader && styles.memberTextDisabled,
                        ]}
                      >
                        {emp.fullname} {isLeader ? '(Leader)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      )}

      {/* COUNTDOWN TIMER BAR */}
      {data.expiresAt && !expired && (
        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <View style={styles.timerHeaderLeft}>
              <Ionicons name="timer-outline" size={14} color={timerColor} />
              <Text style={[styles.timerText, { color: timerColor }]}>
                {remaining}s remaining
              </Text>
            </View>
            <Text style={styles.timerSubText}>Respond before timeout</Text>
          </View>
          <View style={styles.timerTrack}>
            <Animated.View
              style={[
                styles.timerBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: timerColor,
                },
              ]}
            />
          </View>
        </View>
      )}

      {expired && (
        <View style={styles.expiredCard}>
          <Ionicons name="time" size={14} color="#94A3B8" />
          <Text style={styles.expiredCardText}>Request has expired</Text>
        </View>
      )}

      {/* PROFESSIONAL ACCEPT & REJECT ACTION BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rejectBtn}
          onPress={onReject}
        >
          <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={expired}
          style={[
            styles.acceptBtn,
            expired && styles.acceptBtnDisabled,
          ]}
          onPress={() => {
            if (expired) return;
            if (role === 'team_owner') {
              const activeLeader = leader || (teamMembers.length > 0 ? teamMembers[0]._id : null);
              if (!activeLeader && teamMembers.length > 0) {
                Alert.alert("Select Leader", "Please select a team leader to accept this request.");
                return;
              }
              if (requiredHelpers > 0 && helpers.length < requiredHelpers) {
                Alert.alert("Select Helpers", `Please select ${requiredHelpers} helper(s) for this booking.`);
                return;
              }
              onTeamAccept?.({
                leaderEmpId: activeLeader || '',
                helperEmpIds: helpers,
              });
            } else {
              onAccept?.();
            }
          }}
        >
          <Ionicons
            name={
              expired ? 'lock-closed-outline' : 'checkmark-circle'
            }
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.acceptBtnText}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  requestTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.4,
  },
  timeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  scheduledBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  instantBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  timeTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clientHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  toolshopContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toolshopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    paddingBottom: 6,
  },
  toolshopTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  toolshopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toolshopItemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  toolshopQtyBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  toolshopQtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  toolshopPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  teamSection: {
    marginTop: 4,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  teamSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberList: {
    gap: 6,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  leaderSelectedBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  helperSelectedBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  leaderDisabledBox: {
    opacity: 0.45,
    backgroundColor: '#F1F5F9',
  },
  memberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
  },
  memberTextSelected: {
    fontWeight: '700',
    color: '#065F46',
  },
  memberTextHelperSelected: {
    fontWeight: '700',
    color: '#1E40AF',
  },
  memberTextDisabled: {
    color: '#94A3B8',
  },
  leaderBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  timerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timerSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  timerTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 3,
  },
  expiredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 6,
  },
  expiredCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  acceptBtn: {
    flex: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  acceptBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.65,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});