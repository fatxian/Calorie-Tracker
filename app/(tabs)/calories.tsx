import { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { useCalorieStore } from '../store/caloriesStore'; // ← 路徑依你的檔案層級調整

export default function Calories() {
  const items = useCalorieStore((s) => s.items);
  const addEntry = useCalorieStore((s) => s.addEntry);

  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  const add = () => {
    if (!name || !kcal) return;
    addEntry({
      id: Math.random().toString(36).slice(2),
      name,
      kcal: +kcal,
      source: 'manual',
      createdAt: Date.now(),
    });
    setName(''); setKcal('');
  };

  const total = items.reduce((s, it) => s + it.kcal, 0);

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      <Text style={{ fontSize:18, fontWeight:'600' }}>Today: {total} kcal</Text>
      <TextInput placeholder="食物名稱" value={name} onChangeText={setName}
        style={{ borderWidth:1, padding:8, borderRadius:8 }} />
      <TextInput placeholder="熱量 (kcal)" value={kcal} onChangeText={setKcal}
        keyboardType="numeric" style={{ borderWidth:1, padding:8, borderRadius:8 }} />
      <Button title="新增" onPress={add} />
      <FlatList
        style={{ marginTop:16 }}
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8 }}>
            <Text>{item.name}{item.qty_g ? ` (${item.qty_g}g)` : ''}</Text>
            <Text>{item.kcal} kcal</Text>
          </View>
        )}
      />
    </View>
  );
}
