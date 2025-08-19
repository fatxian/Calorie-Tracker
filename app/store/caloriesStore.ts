import { create } from 'zustand';

export type CalorieEntry = {
  id: string;
  name: string;
  kcal: number;
  qty_g?: number;
  source: 'ai' | 'manual';
  createdAt: number;
};

type State = {
  items: CalorieEntry[];
  addEntry: (e: CalorieEntry) => void;
  addEntries: (arr: CalorieEntry[]) => void;
  removeEntry: (id: string) => void;
  clearToday: () => void;
};

export const useCalorieStore = create<State>((set) => ({
  items: [],
  addEntry: (e) => set((s) => ({ items: [e, ...s.items] })),
  addEntries: (arr) => set((s) => ({ items: [...arr, ...s.items] })),
  removeEntry: (id) => set((s) => ({ items: s.items.filter(it => it.id !== id) })),
  clearToday: () => set({ items: [] }),
}));
