import React, { useRef, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { useCalorieStore } from '../store/caloriesStore';

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 8 }}>We need your permission to use the camera</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  const isSimulator = Platform.OS === 'ios' && !Device.isDevice;

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync(); // { uri, width, height, ... }
    setImageUri(photo.uri);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photo album access is required.', 'Go to Settings to allow access to the photo album.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!r.canceled && r.assets?.[0]?.uri) {
      setImageUri(r.assets[0].uri);
    }
  };

  const submitPhoto = async () => {
    if (!imageUri) return;
    try {
      setSubmitting(true);
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
      if (!API_KEY) {
        throw new Error('Missing EXPO_PUBLIC_GOOGLE_AI_API_KEY');
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

      const prompt = `You are a nutrition assistant. Based on the provided image, identify each distinct dish or beverage and provide:
                    1. name (in English)
                    2. total calories (kcal)
                    3. estimated portion size (qty_g, in grams)
                    Do not break down ingredients, and do not add any extra overall totals. Only list each item with its own total calories and portion size.
                    The output must be strictly in JSON, for example:
                    {
                        \"items\": [
                            { \"name\": \"Beef noodles\", \"kcal\": 600, \"qty_g\": 500 },
                            { \"name\": \"Coca-Cola\", \"kcal\": 150, \"qty_g\": 330 }
                        ]
                    }`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [ { text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } } ] }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Gemini ${resp.status}: ${t}`);
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      let parsed: any = {};
      try { parsed = JSON.parse(text); } catch { throw new Error('Model response is not valid JSON: ' + text?.slice(0,120)); }

      const entries = (parsed.items || []).map((it: any) => ({
        id: Math.random().toString(36).slice(2),
        name: String(it.name ?? 'Unknown'),
        kcal: Math.round(Number(it.kcal) || 0),
        qty_g: typeof it.qty_g === 'number' ? Math.round(it.qty_g) : undefined,
        source: 'ai' as const,
        createdAt: Date.now(),
      }));
      useCalorieStore.getState().addEntries(entries);

      Alert.alert(
        'Added',
        entries.map((e: any) => `${e.name} +${e.kcal} kcal`).join('\n')
      );
      router.push('/(tabs)/calories');
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'unknown');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <Button title={submitting ? 'Submitting…' : 'Submit'} onPress={submitPhoto} disabled={submitting} />
            <View style={{ width: 12 }} />
            <Button title="Retake" onPress={() => setImageUri(null)} />
          </View>
        </View>
      ) : isSimulator ? (
        <View style={styles.center}>
          <Text style={{ textAlign: 'center', marginBottom: 12 }}>
          </Text>
          <Button title="Choose from Library" onPress={pickFromLibrary} />
        </View>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.buttonBar}>
            {/* 左下角：相簿選圖 */}
            <View style={styles.leftBtn}>
              <Button title="Album" onPress={pickFromLibrary} />
            </View>
            {/* 中下：拍照 */}
            <View style={styles.centerBtn}>
              <Button title="Take" onPress={takePicture} />
            </View>
            {/* 右下：可預留其他功能（切換鏡頭等） */}
            <View style={styles.rightBtn} />
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, width: '100%' },
  buttonBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftBtn: { width: 120 },
  centerBtn: { alignItems: 'center' },
  rightBtn: { width: 120, alignItems: 'flex-end' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  previewImage: { width: '100%', height: '80%', resizeMode: 'contain' },
  previewButtons: { flexDirection: 'row', marginTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
});
