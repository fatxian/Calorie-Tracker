import React, { useRef, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
// ✅ 改用 Expo 公開環境變數，避免 @env 類型錯誤
//    在專案根目錄建立 .env，寫入：EXPO_PUBLIC_GOOGLE_AI_API_KEY=你的金鑰
//    之後以 process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY 取得（不需安裝 react-native-dotenv）

export default function camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 還在讀取權限物件
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission…</Text>
      </View>
    );
  }

  // 尚未授權
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 8 }}>We need your permission to use the camera</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  // iOS 模擬器沒有鏡頭，但我們仍然提供「相簿選圖」
  const isSimulator = Platform.OS === 'ios' && !Device.isDevice;

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync(); // { uri, width, height, ... }
    setImageUri(photo.uri);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'AI 結果',
        parsed.items
          .map((it: any) => `${it.name} ≈ ${Math.round(it.kcal)} kcal`)
          .join('/n')
      );
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
      // 直接使用靜態 import 的 FileSystem（避免 dynamic import 造成 undefined）
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
      if (!API_KEY) {
        throw new Error('Missing EXPO_PUBLIC_GOOGLE_AI_API_KEY');
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

      const prompt = `你是營養助理。辨識餐點，估計每一項的熱量(kcal)與可用的份量(克)，若不確定請給合理估計與信心度。只輸出 JSON：{"items":[{"name":"","kcal":0,"qty_g":0,"confidence":0.0}]}`;

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
      try { parsed = JSON.parse(text); } catch { throw new Error('模型回覆非 JSON：' + text?.slice(0,120)); }

      Alert.alert(
        'AI 結果',
        parsed.items
          .map((it: any) => `${it.name} ≈ ${Math.round(it.kcal)} kcal`)
          .join('/n')
      );
    } catch (e: any) {
      Alert.alert('送出失敗', e?.message ?? 'unknown');
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
            iOS 模擬器不支援相機預覽。你可以先用相簿挑選照片來測流程。
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
