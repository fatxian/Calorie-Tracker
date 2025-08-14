import { View, Button } from 'react-native';
import { router } from 'expo-router';
export default function Home() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:12 }}>
      <Button title="開啟相機頁" onPress={() => router.push('/camera')} />
    </View>
  );
}
