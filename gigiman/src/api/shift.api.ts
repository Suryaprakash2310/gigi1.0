import apiClient from './client';

export interface ShiftSlot {
  slotId: string;
  label: string;
  startHour: number;
  endHour: number;
}

export interface DaySchedule {
  dayOfWeek: string;
  isWorkingDay: boolean;
  shiftStart: string;
  shiftEnd: string;
  enabledSlots: string[];
}

export interface EmployeeShiftData {
  _id?: string;
  employeeId: string;
  isShiftActive: boolean;
  weeklySchedule: DaySchedule[];
}

export const ShiftAPI = {
  getMyShift: async () => {
    const res = await apiClient.get('/shift/my-shift');
    return res.data;
  },

  updateMyShift: async (data: {
    isShiftActive?: boolean;
    weeklySchedule?: DaySchedule[];
  }) => {
    const res = await apiClient.put('/shift/my-shift', data);
    return res.data;
  },

  getAvailableSlots: async (params?: { date?: string; serviceCategoryId?: string; region?: string }) => {
    const res = await apiClient.get('/shift/slots/available', { params });
    return res.data;
  },
};
