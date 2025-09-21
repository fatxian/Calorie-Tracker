import { useState, useMemo } from 'react';
import { View, Text, TextInput, Button, FlatList, Pressable, Platform, Modal } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCalorieStore } from '../store/caloriesStore';

function ymd(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Calories() {
  const items = useCalorieStore((s) => s.items);
  const addEntryAt = useCalorieStore((s) => s.addEntryAt);
  const removeEntry = useCalorieStore((s) => s.removeEntry);

  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const dateStr = useMemo(() => ymd(date), [date]);
  const itemsOfDay = useMemo(() => items.filter(it => it.date === dateStr), [items, dateStr]);
  const total = useMemo(() => itemsOfDay.reduce((s, it) => s + it.kcal, 0), [itemsOfDay]);

  const openPicker = () => {
    setTempDate(date);
    setShowPicker(true);
  };

  const onChangeTemp = (event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
  };

  const onCancelPicker = () => setShowPicker(false);
  const onDonePicker = () => {
    setDate(tempDate);
    setShowPicker(false);
  };

  const add = () => {
    const calories = Number(kcal);
    if (!name || !Number.isFinite(calories)) return;
    addEntryAt(
      { name, kcal: calories, source: 'manual' }, // qty_g 可選
      dateStr
    );
    setName('');
    setKcal('');
  };

  const renderRightActions = (onDelete: () => void) => (
    <View style={{ height: '100%', flexDirection: 'row' }}>
      <Pressable
        onPress={onDelete}
        style={{
          backgroundColor: 'crimson',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginVertical: 4,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      {/* 日期顯示 + 開啟按鈕 */}
      <View style={{ gap:6 }}>
        <Text style={{ fontSize:12, color:'#666' }}>Date</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ fontSize:16 }}>{dateStr}</Text>
          <Button title="Pick date" onPress={openPicker} />
        </View>
      </View>

      {/* Modal：iOS/Android 都有 Cancel/Done */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={onCancelPicker}
      >
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end' }}>
          <View style={{
            backgroundColor:'#fff',
            borderTopLeftRadius:12,
            borderTopRightRadius:12,
            paddingBottom: Platform.OS === 'ios' ? 24 : 12
          }}>
            {/* 工具列 */}
            <View style={{
              flexDirection:'row',
              justifyContent:'space-between',
              paddingHorizontal:16,
              paddingVertical:12,
              borderBottomWidth:1,
              borderColor:'#eee'
            }}>
              <Pressable onPress={onCancelPicker}>
                <Text style={{ color:'#888', fontSize:16 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onDonePicker}>
                <Text style={{ color:'#0A84FF', fontSize:16, fontWeight:'600' }}>Done</Text>
              </Pressable>
            </View>

            {/* 日期選擇器本體（只更新 tempDate） */}
            <View style={{ paddingHorizontal:8, paddingTop: Platform.OS === 'ios' ? 8 : 0 }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTemp}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Text style={{ fontSize:18, fontWeight:'600' }}>
        Total on {dateStr}: {total} kcal
      </Text>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth:1, padding:8, borderRadius:8 }}
      />
      <TextInput
        placeholder="kcal"
        value={kcal}
        onChangeText={setKcal}
        keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'numeric' })}
        style={{ borderWidth:1, padding:8, borderRadius:8 }}
      />
      <Button title="Add" onPress={add} />

      <FlatList
        style={{ marginTop:16 }}
        data={itemsOfDay}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(() => removeEntry(item.id))}>
            <View
              style={{
                flexDirection:'row',
                justifyContent:'space-between',
                paddingVertical:12,
                paddingHorizontal:8,
                borderBottomWidth: 1,
                borderColor: '#eee',
                backgroundColor: '#fff',
                marginVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text>
                {item.name}{item.qty_g ? ` (${item.qty_g}g)` : ''}
              </Text>
              <Text>{item.kcal} kcal</Text>
            </View>
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      />
    </View>
  );
}