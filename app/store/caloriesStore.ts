import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalorieEntry = {
  id: string;
  name: string;
  kcal: number;
  qty_g?: number;
  source: 'ai' | 'manual';
  createdAt: number;
  date: string; // 'YYYY-MM-DD'
};

function ymd(ts = Date.now()) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate() + 0).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

type State = {
  items: CalorieEntry[];
  addEntry: (e: Omit<CalorieEntry, 'id' | 'createdAt' | 'date'>) => void;
  addEntries: (arr: Omit<CalorieEntry, 'id' | 'createdAt' | 'date'>[]) => void;
  /** 指定 dateStr（YYYY-MM-DD）新增一筆 */
  addEntryAt: (e: Omit<CalorieEntry, 'id' | 'createdAt' | 'date'>, dateStr: string) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
};

export const useCalorieStore = create<State>()(
  persist(
    (set) => ({
      items: [],

      // 新增到「今天」
      addEntry: (e) =>
        set((s) => ({
          items: [
            {
              id: Math.random().toString(36).slice(2),
              createdAt: Date.now(),
              date: ymd(),
              ...e,
            },
            ...s.items,
          ],
        })),

      // 批次新增到「今天」
      addEntries: (arr) =>
        set((s) => ({
          items: [
            ...arr.map((e) => ({
              id: Math.random().toString(36).slice(2),
              createdAt: Date.now(),
              date: ymd(),
              ...e,
            })),
            ...s.items,
          ],
        })),

      // ✅ 指定日期新增（給你在 Calories 頁用 DatePicker 後寫入）
      addEntryAt: (e, dateStr) =>
        set((s) => ({
          items: [
            {
              id: Math.random().toString(36).slice(2),
              createdAt: Date.now(),
              date: dateStr,
              ...e,
            },
            ...s.items,
          ],
        })),

      removeEntry: (id) =>
        set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'calories-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // version / migrate 可依需要再開
    }
  )
);