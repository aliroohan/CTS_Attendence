import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

// Get list of active employees for selection screen
export function useEmployeeList() {
  return useQuery({
    queryKey: ['employeeList'],
    queryFn: () => api.get('/users/list').then(r => r.data),
  });
}

// Get employee details + today's attendance
export function useEmployeeDetails(employeeId) {
  return useQuery({
    queryKey: ['employeeDetails', employeeId],
    queryFn: async () => {
      const res = await api.get('/users/list');
      const employee = res.data.find(e => e.employeeId === employeeId);
      return employee || null;
    },
    enabled: !!employeeId,
  });
}

// Get today's attendance sessions for an employee
export function useTodayAttendance(userId) {
  return useQuery({
    queryKey: ['todayAttendance', userId],
    queryFn: () => api.get(`/attendance/history/${userId}`, { params: { limit: 10 } }).then(r => {
      // Use local date for comparison to match what backend generates
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const records = r.data.records || [];
      const todayRecords = records.filter(rec => rec.date === todayStr);
      
      // Return both the latest record (for status) and the full list (for summary)
      return {
        latest: todayRecords[0] || null,
        all: todayRecords
      };
    }),
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

// Check-in mutation
export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/attendance/checkin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todayAttendance'] });
    },
  });
}

// Check-out mutation
export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/attendance/checkout', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todayAttendance'] });
    },
  });
}

// Attendance history
export function useAttendanceHistory(userId) {
  return useQuery({
    queryKey: ['attendanceHistory', userId],
    queryFn: () => api.get(`/attendance/history/${userId}`).then(r => r.data),
    enabled: !!userId,
  });
}
