import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEmployeeList } from '../hooks/useApi';

export default function SelectEmployee({ navigation }) {
  const [search, setSearch] = useState('');
  const { data: employees = [], isLoading } = useEmployeeList();

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (employee) => {
    navigation.navigate('Home', { employee });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CTS</Text>
        <Text style={styles.subtitle}>Select your Employee ID</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6AB023" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <View style={styles.cardContent}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.employeeId} • {item.designation || item.department || 'Employee'}</Text>
                  {item.assignedShift && (
                    <Text style={styles.shift}>{item.assignedShift.name} ({item.assignedShift.startTime} - {item.assignedShift.endTime})</Text>
                  )}
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No employees found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  logo: { fontSize: 32, fontWeight: '900', color: '#6AB023', letterSpacing: 1 },
  subtitle: { fontSize: 15, color: '#94a3b8', marginTop: 4 },
  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  searchInput: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, paddingHorizontal: 18,
    color: '#f1f5f9', fontSize: 15, borderWidth: 1, borderColor: '#334155',
  },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(106,176,35,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#6AB023' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  meta: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  shift: { fontSize: 12, color: '#64748b', marginTop: 2 },
  arrow: { fontSize: 24, color: '#64748b' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: 15 },
});
