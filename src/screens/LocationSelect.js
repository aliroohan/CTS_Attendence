import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function LocationSelect({ route, navigation }) {
  const { employee } = route.params;

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, employee])
  );

  const handleSelect = (location) => {
    navigation.navigate('Camera', { employee, type: 'checkin', workLocation: location });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Where are you working?</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Select your work location for today</Text>

        <TouchableOpacity style={styles.optionCard} onPress={() => handleSelect('office')} activeOpacity={0.7}>
          <Text style={styles.optionIcon}>🏢</Text>
          <Text style={styles.optionTitle}>Office</Text>
          <Text style={styles.optionDesc}>Working at the company office</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, styles.optionCardOnSite]} onPress={() => handleSelect('on-site')} activeOpacity={0.7}>
          <Text style={styles.optionIcon}>🏗️</Text>
          <Text style={styles.optionTitle}>On-Site</Text>
          <Text style={styles.optionDesc}>Working at an external location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  backBtn: { color: '#1F78A4', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  content: { paddingHorizontal: 24 },
  subtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 28 },
  optionCard: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 28, marginBottom: 16,
    borderWidth: 2, borderColor: '#334155', alignItems: 'center',
  },
  optionCardOnSite: { borderColor: 'rgba(106,176,35,0.3)' },
  optionIcon: { fontSize: 40, marginBottom: 12 },
  optionTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  optionDesc: { fontSize: 14, color: '#94a3b8' },
});
