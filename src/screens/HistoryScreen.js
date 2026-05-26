import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAttendanceHistory } from '../hooks/useApi';

const PAGE_SIZE = 5;

export default function HistoryScreen({ route, navigation }) {
  const { employee } = route.params;
  const [page, setPage] = useState(1);
  const [allRecords, setAllRecords] = useState([]);

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const { data, isLoading, isError, error, refetch, isRefetching } = useAttendanceHistory(employee._id, { page, limit: PAGE_SIZE });

  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.pages : false;

  // Accumulate records when data changes
  useEffect(() => {
    if (data?.records) {
      if (page === 1) {
        setAllRecords(data.records);
      } else {
        setAllRecords(prev => {
          const existingIds = new Set(prev.map(r => r._id));
          const newRecords = data.records.filter(r => !existingIds.has(r._id));
          return [...prev, ...newRecords];
        });
      }
    }
  }, [data, page]);

  // Reset to page 1 on pull-to-refresh
  const handleRefresh = () => {
    setPage(1);
    setAllRecords([]);
    refetch();
  };

  const handleShowMore = () => {
    setPage(prev => prev + 1);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present': return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' };
      case 'late': return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
      case 'absent': return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
      default: return { bg: 'rgba(100,116,139,0.15)', color: '#64748b' };
    }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  const renderFooter = () => {
    if (isLoading && page > 1) {
      return <ActivityIndicator color="#6AB023" style={{ marginVertical: 20 }} />;
    }
    if (hasMore) {
      return (
        <TouchableOpacity style={styles.showMoreBtn} onPress={handleShowMore} activeOpacity={0.8}>
          <Text style={styles.showMoreText}>Show More</Text>
          {pagination && (
            <Text style={styles.showMoreCount}>
              Showing {allRecords.length} of {pagination.total}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
    if (allRecords.length > 0) {
      return (
        <Text style={styles.endText}>— All records loaded —</Text>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>{employee.name} • {employee.employeeId}</Text>
      </View>

      {isLoading && page === 1 && !isRefetching ? (
        <ActivityIndicator size="large" color="#6AB023" style={{ marginTop: 40 }} />
      ) : isError && allRecords.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load History</Text>
          <Text style={styles.errorText}>
            {error?.response?.data?.message || error?.message || 'Unable to load attendance history. Please check your connection.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={allRecords}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={isRefetching && page === 1}
          onRefresh={handleRefresh}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>
                    {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: statusStyle.color }]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Check-In</Text>
                    <Text style={styles.detailValue}>{formatTime(item.checkIn)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Check-Out</Text>
                    <Text style={styles.detailValue}>{formatTime(item.checkOut)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hours</Text>
                    <Text style={styles.detailValue}>
                      {item.totalMinutes ? `${(item.totalMinutes / 60).toFixed(1)}h` : '—'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={[styles.detailValue, { color: item.workLocation === 'on-site' ? '#f59e0b' : '#3b82f6' }]}>
                      {item.workLocation === 'on-site' ? '🏗️ On-Site' : '🏢 Office'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No attendance records yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { color: '#1F78A4', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateText: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#f1f5f9' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: 15 },
  showMoreBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6AB023',
  },
  showMoreText: { color: '#6AB023', fontSize: 16, fontWeight: '700' },
  showMoreCount: { color: '#64748b', fontSize: 12, marginTop: 4 },
  endText: { textAlign: 'center', color: '#334155', fontSize: 13, marginTop: 12, marginBottom: 20 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#f87171', marginBottom: 8, textAlign: 'center' },
  errorText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: {
    backgroundColor: '#6AB023',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  retryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
});
