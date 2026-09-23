import { create } from "zustand";

interface UiState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  notifiedAssignmentIds: Set<string>;
  markNotified: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  notifiedAssignmentIds: new Set(),
  markNotified: (id) =>
    set((state) => ({ notifiedAssignmentIds: new Set(state.notifiedAssignmentIds).add(id) })),
}));
