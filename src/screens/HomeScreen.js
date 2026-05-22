import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTodayAttendance } from '../hooks/useApi';

export default function HomeScreen({ route, navigation }) {
  const { employee } = route.params;
  const { data: todayData, isLoading, isError, error, refetch } = useTodayAttendance(employee._id);
  const [timer, setTimer] = useState('00:00:00');

  // Handle hardware back button and focus refetch
  useFocusEffect(
    useCallback(() => {
      refetch();
      
      const onBackPress = () => {
        navigation.navigate('SelectEmployee');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, refetch])
  );

  const todayRecord = todayData?.latest;
  const totalTodayMinutes = todayData?.all?.reduce((sum, rec) => sum + (rec.totalMinutes || 0), 0) || 0;

  // Live timer
  useEffect(() => {
    if (!todayRecord?.checkIn || todayRecord?.checkOut) return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(todayRecord.checkIn).getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimer(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  // A session is active if we have a check-in but no check-out
  const isActiveSession = todayRecord?.checkIn && !todayRecord?.checkOut;
  // If the latest record for today has a check-out, we are currently "free" to check in again
  const isCurrentlyOff = !todayRecord || (todayRecord.checkIn && todayRecord.checkOut);

  const handleAction = () => {
    if (isActiveSession) {
      navigation.navigate('Camera', { employee, type: 'checkout' });
    } else {
      navigation.navigate('LocationSelect', { employee });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('SelectEmployee')}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Employee Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{employee.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{employee.name}</Text>
        <Text style={styles.empId}>{employee.employeeId}</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        {isLoading ? (
          <ActivityIndicator color="#6AB023" />
        ) : isError ? (
          <View style={styles.errorContainerInline}>
            <Text style={styles.errorIconInline}>⚠️</Text>
            <Text style={styles.errorTitleInline}>Status Load Failed</Text>
            <Text style={styles.errorTextInline}>
              {error?.response?.data?.message || error?.message || 'Unable to load today\'s status.'}
            </Text>
            <TouchableOpacity style={styles.retryBtnInline} onPress={() => refetch()} activeOpacity={0.8}>
              <Text style={styles.retryBtnTextInline}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.statusLabel}>Today's Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(todayRecord?.status) }]}>
              <Text style={styles.statusText}>
                {isActiveSession ? 'Checked In' : 'Not Checked In'}
              </Text>
            </View>
            {isActiveSession && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>Working Time</Text>
                <Text style={styles.timerValue}>{timer}</Text>
              </View>
            )}
            {todayRecord?.workLocation && (
              <Text style={styles.locationTag}>
                📍 {todayRecord.workLocation === 'on-site' ? 'On-Site' : 'Office'}
              </Text>
            )}
            {totalTodayMinutes > 0 && (
              <Text style={styles.totalHours}>
                Total Today: {(totalTodayMinutes / 60).toFixed(1)} hours
              </Text>
            )}
          </>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.actionBtn, (isLoading || isError) && styles.actionBtnDisabled]}
        onPress={handleAction}
        disabled={isLoading || isError}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionBtnText, (isLoading || isError) && styles.actionBtnTextDisabled]}>
          {isActiveSession ? 'Check Out' : 'Check In'}
        </Text>
      </TouchableOpacity>

      {/* History Link */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('History', { employee })}
      >
        <Text style={styles.historyBtnText}>View Attendance History</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'present': return 'rgba(106,176,35,0.15)';
    case 'late': return 'rgba(245,158,11,0.15)';
    case 'absent': return 'rgba(239,68,68,0.15)';
    default: return 'rgba(100,116,139,0.15)';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: '#1F78A4', fontSize: 18, fontWeight: '600' },
  date: { color: '#94a3b8', fontSize: 13 },
  profileCard: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(106,176,35,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#6AB023' },
  name: { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
  empId: { fontSize: 14, color: '#6AB023', fontWeight: '600', marginTop: 4 },
  shift: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statusCard: { marginHorizontal: 24, backgroundColor: '#1e293b', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  statusLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  statusText: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  timerContainer: { marginTop: 20, alignItems: 'center' },
  timerLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  timerValue: { fontSize: 36, fontWeight: '800', color: '#6AB023', letterSpacing: 2 },
  locationTag: { marginTop: 12, fontSize: 13, color: '#94a3b8' },
  totalHours: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#6AB023' },
  actionBtn: { marginHorizontal: 24, marginTop: 28, backgroundColor: '#6AB023', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  actionBtnDisabled: { backgroundColor: '#334155' },
  actionBtnText: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  actionBtnTextDisabled: { color: '#64748b' },
  historyBtn: { marginHorizontal: 24, marginTop: 14, paddingVertical: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#334155' },
  historyBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '500' },
  errorContainerInline: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  errorIconInline: { fontSize: 32, marginBottom: 8 },
  errorTitleInline: { fontSize: 16, fontWeight: '700', color: '#f87171', marginBottom: 4 },
  errorTextInline: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  retryBtnInline: { backgroundColor: '#6AB023', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  retryBtnTextInline: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
});
