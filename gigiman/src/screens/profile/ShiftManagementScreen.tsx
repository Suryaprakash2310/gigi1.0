import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import { theme } from '@/theme/theme';
import { ShiftAPI, DaySchedule, ShiftSlot } from '@/api/shift.api';

const { width } = Dimensions.get('window');

const DEFAULT_SLOTS: ShiftSlot[] = [
  { slotId: '10-11', label: '10:00 AM - 11:00 AM', startHour: 10, endHour: 11 },
  { slotId: '11-12', label: '11:00 AM - 12:00 PM', startHour: 11, endHour: 12 },
  { slotId: '12-13', label: '12:00 PM - 01:00 PM', startHour: 12, endHour: 13 },
  { slotId: '13-14', label: '01:00 PM - 02:00 PM', startHour: 13, endHour: 14 },
  { slotId: '14-15', label: '02:00 PM - 03:00 PM', startHour: 14, endHour: 15 },
  { slotId: '15-16', label: '03:00 PM - 04:00 PM', startHour: 15, endHour: 16 },
  { slotId: '16-17', label: '04:00 PM - 05:00 PM', startHour: 16, endHour: 17 },
  { slotId: '17-18', label: '05:00 PM - 06:00 PM', startHour: 17, endHour: 18 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ShiftManagementScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isShiftActive, setIsShiftActive] = useState(true);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const fetchShift = async () => {
    try {
      setLoading(true);
      const res = await ShiftAPI.getMyShift();
      if (res?.success && res?.data) {
        setIsShiftActive(res.data.isShiftActive !== false);
        if (Array.isArray(res.data.weeklySchedule) && res.data.weeklySchedule.length > 0) {
          setWeeklySchedule(res.data.weeklySchedule);
        } else {
          // Initialize default 10-5 schedule
          const def: DaySchedule[] = DAYS.map(day => ({
            dayOfWeek: day,
            isWorkingDay: true,
            shiftStart: '10:00',
            shiftEnd: '17:00',
            enabledSlots: DEFAULT_SLOTS.map(s => s.slotId),
          }));
          setWeeklySchedule(def);
        }
      }
    } catch (err: any) {
      console.error('Error fetching shift:', err);
      Alert.alert('Notice', 'Unable to fetch shift online. Showing standard 10 AM - 5 PM shifts.');
      const def: DaySchedule[] = DAYS.map(day => ({
        dayOfWeek: day,
        isWorkingDay: true,
        shiftStart: '10:00',
        shiftEnd: '17:00',
        enabledSlots: DEFAULT_SLOTS.map(s => s.slotId),
      }));
      setWeeklySchedule(def);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, []);

  const currentDaySchedule = weeklySchedule.find(d => d.dayOfWeek === selectedDay) || {
    dayOfWeek: selectedDay,
    isWorkingDay: true,
    shiftStart: '10:00',
    shiftEnd: '17:00',
    enabledSlots: DEFAULT_SLOTS.map(s => s.slotId),
  };

  const handleToggleWorkingDay = (val: boolean) => {
    setWeeklySchedule(prev =>
      prev.map(d => (d.dayOfWeek === selectedDay ? { ...d, isWorkingDay: val } : d))
    );
  };

  const handleToggleSlot = (slotId: string) => {
    setWeeklySchedule(prev =>
      prev.map(d => {
        if (d.dayOfWeek !== selectedDay) return d;
        const slots = d.enabledSlots || [];
        const nextSlots = slots.includes(slotId)
          ? slots.filter(id => id !== slotId)
          : [...slots, slotId];
        return { ...d, enabledSlots: nextSlots };
      })
    );
  };

  const handleSelectAllSlots = () => {
    setWeeklySchedule(prev =>
      prev.map(d => {
        if (d.dayOfWeek !== selectedDay) return d;
        return { ...d, isWorkingDay: true, enabledSlots: DEFAULT_SLOTS.map(s => s.slotId) };
      })
    );
  };

  // Employee Wish: Select ALL 10 AM - 5 PM shifts on ALL 7 days
  const handleSelectAllFullWeek = () => {
    setIsShiftActive(true);
    setWeeklySchedule(
      DAYS.map(day => ({
        dayOfWeek: day,
        isWorkingDay: true,
        shiftStart: '10:00',
        shiftEnd: '17:00',
        enabledSlots: DEFAULT_SLOTS.map(s => s.slotId),
      }))
    );
    Alert.alert('All Shifts Selected', 'All 7 days and all 10 AM - 5 PM slots have been selected according to your wish!');
  };

  // Employee Wish: Apply current day's slot configuration to all 7 days
  const handleApplyCurrentDayToAll = () => {
    const currentConfig = currentDaySchedule;
    setWeeklySchedule(
      DAYS.map(day => ({
        dayOfWeek: day,
        isWorkingDay: currentConfig.isWorkingDay,
        shiftStart: currentConfig.shiftStart || '10:00',
        shiftEnd: currentConfig.shiftEnd || '17:00',
        enabledSlots: [...(currentConfig.enabledSlots || [])],
      }))
    );
    Alert.alert('Applied to All Days', `Your ${selectedDay} shift slots have been applied to all 7 days!`);
  };

  // Employee Wish: Weekdays only (Mon - Fri 10 AM - 5 PM)
  const handleSelectWeekdaysOnly = () => {
    setIsShiftActive(true);
    setWeeklySchedule(
      DAYS.map(day => {
        const isWeekend = day === 'Saturday' || day === 'Sunday';
        return {
          dayOfWeek: day,
          isWorkingDay: !isWeekend,
          shiftStart: '10:00',
          shiftEnd: '17:00',
          enabledSlots: !isWeekend ? DEFAULT_SLOTS.map(s => s.slotId) : [],
        };
      })
    );
    Alert.alert('Weekdays Selected', 'Monday to Friday (10 AM - 5 PM) selected. Weekends set to Off.');
  };

  const handleClearSlots = () => {
    setWeeklySchedule(prev =>
      prev.map(d => {
        if (d.dayOfWeek !== selectedDay) return d;
        return { ...d, enabledSlots: [] };
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ShiftAPI.updateMyShift({
        isShiftActive,
        weeklySchedule,
      });
      Alert.alert('Success', 'Shift and working slots saved successfully!');
    } catch (err: any) {
      console.error('Error saving shift:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save shift settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppHeader title="Shift & Working Slots" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading shift schedule...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Shift & Slots" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Master Shift Toggle Card */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.badgeRow}>
                <Ionicons name="time" size={18} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Shift Availability</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Enable to receive instant and scheduled client requests during your active shift (10:00 AM - 05:00 PM).
              </Text>
            </View>
            <Switch
              value={isShiftActive}
              onValueChange={setIsShiftActive}
              trackColor={{ false: '#ddd', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Operating Window Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#1d4ed8" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.infoBannerTitle}>System Working Hours: 10 AM – 5 PM</Text>
            <Text style={styles.infoBannerText}>
              All service requests are scheduled into 1-hour slots. Customers can book instant or up to 3 days in advance.
            </Text>
          </View>
        </View>

        {/* Employee Wish: Quick Preset Shift Selection */}
        <View style={styles.presetCard}>
          <View style={styles.presetHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
              <Text style={styles.presetTitle}>Employee Wish: Shift Selection</Text>
            </View>
            <Text style={styles.presetSubtitle}>1-Tap Quick Apply</Text>
          </View>
          <View style={styles.presetButtonsRow}>
            <TouchableOpacity
              style={styles.presetFullBtn}
              onPress={handleSelectAllFullWeek}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-circle" size={16} color="#fff" />
              <Text style={styles.presetFullBtnText}>Select All (7 Days • 10 AM - 5 PM)</Text>
            </TouchableOpacity>

            <View style={styles.presetSecondaryRow}>
              <TouchableOpacity
                style={styles.presetSecondaryBtn}
                onPress={handleApplyCurrentDayToAll}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.presetSecondaryBtnText}>Apply {selectedDay} to All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetSecondaryBtn}
                onPress={handleSelectWeekdaysOnly}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.presetSecondaryBtnText}>Weekdays Only (Mon-Fri)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Day of Week Selector */}
        <Text style={styles.sectionHeader}>Select Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map(day => {
            const isSelected = day === selectedDay;
            const dayConfig = weeklySchedule.find(d => d.dayOfWeek === day);
            const isWorking = dayConfig ? dayConfig.isWorkingDay : true;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillActive,
                  !isWorking && styles.dayPillOff,
                ]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {day.slice(0, 3)}
                </Text>
                <View
                  style={[
                    styles.dayIndicatorDot,
                    { backgroundColor: isWorking ? (isSelected ? '#fff' : theme.colors.primary) : '#ccc' },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Day Status */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.dayTitle}>{selectedDay}</Text>
              <Text style={styles.dayStatus}>
                {currentDaySchedule.isWorkingDay ? 'Working Day (10:00 AM - 05:00 PM)' : 'Day Off / Leave'}
              </Text>
            </View>
            <Switch
              value={currentDaySchedule.isWorkingDay}
              onValueChange={handleToggleWorkingDay}
              trackColor={{ false: '#ddd', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {currentDaySchedule.isWorkingDay && (
            <>
              <View style={styles.divider} />

              <View style={styles.slotActionRow}>
                <Text style={styles.slotSubheader}>1-Hour Shift Slots (10 AM - 5 PM)</Text>
                <View style={styles.quickActionButtons}>
                  <TouchableOpacity onPress={handleSelectAllSlots} style={styles.quickBtn}>
                    <Text style={styles.quickBtnText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearSlots} style={styles.quickBtn}>
                    <Text style={[styles.quickBtnText, { color: '#ef4444' }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.slotsGrid}>
                {DEFAULT_SLOTS.map(slot => {
                  const isEnabled = currentDaySchedule.enabledSlots?.includes(slot.slotId);
                  return (
                    <TouchableOpacity
                      key={slot.slotId}
                      style={[
                        styles.slotCard,
                        isEnabled && styles.slotCardActive,
                      ]}
                      onPress={() => handleToggleSlot(slot.slotId)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={isEnabled ? '#fff' : '#888'}
                      />
                      <Text style={[styles.slotLabel, isEnabled && styles.slotLabelActive]}>
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Save Shift Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  daysScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 2,
  },
  dayPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    minWidth: 60,
  },
  dayPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayPillOff: {
    opacity: 0.6,
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dayPillTextActive: {
    color: '#fff',
  },
  dayIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  slotActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotSubheader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  slotsGrid: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  slotCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  slotLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  presetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  presetSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  presetButtonsRow: {
    gap: 8,
  },
  presetFullBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  presetFullBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  presetSecondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  presetSecondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
