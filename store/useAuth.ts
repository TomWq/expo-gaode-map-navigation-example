import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthStore {
  privacyAgreed: boolean;
  setPrivacyAgreed: (privacyAgreed: boolean) => void;
}

const memoryStore: Record<string, string | undefined> = {};
const memoryStorage = {
  getItem: (name: string) => memoryStore[name] ?? null,
  setItem: (name: string, value: string) => {
    memoryStore[name] = value;
  },
  removeItem: (name: string) => {
    delete memoryStore[name];
  },
};

const selectStorage = () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      // ignore and fallback
    }
  }

  return memoryStorage;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      privacyAgreed: false,
      setPrivacyAgreed: (privacyAgreed: boolean) => set({ privacyAgreed }),
    }),
    {
      name: 'auth',
      version: 1,
      storage: createJSONStorage(selectStorage),
      partialize: (state) => ({
        privacyAgreed: state.privacyAgreed,
      }),
    }
  )
);
