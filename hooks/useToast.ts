import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string, durationMs?: number) => void;
  hide: () => void;
}

const DEFAULT_DURATION_MS = 3000;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message, durationMs = DEFAULT_DURATION_MS) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message });
    hideTimer = setTimeout(() => set({ message: null }), durationMs);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));
