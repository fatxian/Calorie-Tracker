import { useMemo } from 'react';
import { View, Text, SectionList } from 'react-native';
import { useCalorieStore } from '../store/caloriesStore';

function ymd(ts = Date.now()) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function History() {
  const items = useCalorieStore(s => s.items);
  const today = ymd();

  // 只拿「非今天」的資料，並依日期分組（新到舊）
  const sections = useMemo(() => {
    const map = new Map<string, { name: string; kcal: number; qty_g?: number; id: string }[]>();
    for (const it of items) {
      if (it.date === today) continue;
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date)!.push({ id: it.id, name: it.name, kcal: it.kcal, qty_g: it.qty_g });
    }
    const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return dates.map(d => ({ title: d, data: map.get(d)! }));
  }, [items, today]);

  if (sections.length === 0) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:16 }}>
        <Text>No past records yet.</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={{ backgroundColor:'#f5f5f5', paddingVertical:6, paddingHorizontal:12 }}>
          <Text style={{ fontWeight:'700' }}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={{
          flexDirection:'row',
          justifyContent:'space-between',
          paddingVertical:12,
          paddingHorizontal:12,
          borderBottomWidth:1, borderColor:'#eee', backgroundColor:'#fff'
        }}>
          <Text>{item.name}{item.qty_g ? ` (${item.qty_g}g)` : ''}</Text>
          <Text>{item.kcal} kcal</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}