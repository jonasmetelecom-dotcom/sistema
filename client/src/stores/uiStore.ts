import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isTechnicianMode: boolean;
    toggleTechnicianMode: () => void;
    setTechnicianMode: (value: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isTechnicianMode: false,
            toggleTechnicianMode: () => set((state) => ({ isTechnicianMode: !state.isTechnicianMode })),
            setTechnicianMode: (value) => set({ isTechnicianMode: value }),
        }),
        {
            name: 'ui-storage', // unique name
        }
    )
);
