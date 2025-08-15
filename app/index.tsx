import { Redirect } from 'expo-router';
export default function Home() {
  // 一開啟就進到 Calories 分頁
  return <Redirect href='/(tabs)/calories' />;
}
