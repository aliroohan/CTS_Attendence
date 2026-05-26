import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { useCheckIn, useCheckOut } from '../hooks/useApi';

export default function CameraScreen({ route, navigation }) {
  const { employee, type, workLocation } = route.params;

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

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef(null);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  if (!permission) return <View style={styles.container}><ActivityIndicator color="#6AB023" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDesc}>We need camera access to take your attendance selfie.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });

      // Resize image to reduce size (max width 800px) and compress
      const manipulatedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get GPS location
      let coords = { latitude: 0, longitude: 0 };
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coords = loc.coords;
      } catch (locErr) {
        console.warn('Location error:', locErr);
      }

      // Build form data
      const formData = new FormData();
      formData.append('employeeId', employee.employeeId);
      formData.append('latitude', coords.latitude.toString());
      formData.append('longitude', coords.longitude.toString());
      formData.append('image', {
        uri: manipulatedPhoto.uri,
        type: 'image/jpeg',
        name: `${type}_${Date.now()}.jpg`,
      });

      if (type === 'checkin') {
        formData.append('workLocation', workLocation || 'office');
        checkIn.mutate(formData, {
          onSuccess: () => {
            Alert.alert('Success', 'Checked in successfully!', [
              { text: 'OK', onPress: () => navigation.pop(2) },
            ]);
          },
          onError: (err) => {
            Alert.alert('Error', err.response?.data?.message || 'Check-in failed.');
            setIsSubmitting(false);
          },
        });
      } else {
        checkOut.mutate(formData, {
          onSuccess: () => {
            Alert.alert('Success', 'Checked out successfully!', [
              { text: 'OK', onPress: () => navigation.pop(1) },
            ]);
          },
          onError: (err) => {
            Alert.alert('Error', err.response?.data?.message || 'Check-out failed.');
            setIsSubmitting(false);
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo.');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {type === 'checkin' ? 'Check-In Selfie' : 'Check-Out Selfie'}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />
        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>Position your face in the circle and take a selfie</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureBtn, isSubmitting && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <View style={styles.captureBtnInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 12 },
  backBtn: { color: '#1F78A4', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginTop: 8 },
  cameraContainer: { flex: 1, marginHorizontal: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#334155', position: 'relative' },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  faceGuide: { width: 220, height: 220, borderRadius: 110, borderWidth: 3, borderColor: 'rgba(106,176,35,0.5)', borderStyle: 'dashed' },
  instructions: { paddingVertical: 14, alignItems: 'center' },
  instructionText: { color: '#94a3b8', fontSize: 14 },
  controls: { paddingBottom: 40, alignItems: 'center' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6AB023', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(106,176,35,0.3)' },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#5a961d' },
  permissionCard: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  permissionDesc: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  permissionBtn: { backgroundColor: '#6AB023', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  permissionBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
});
