/**
 * Toast notification adapter.
 * Provides a unified interface for toast notifications that works both
 * standalone and when integrated with gaim/fe's toast system.
 */

import { logger } from './logger.js';

type ToastStyle = 'white' | 'green' | 'red' | 'blue' | 'yellow';

interface Toast {
  id: string;
  message: string;
  style: ToastStyle;
  persistent: boolean;
}

let toasts = $state<Toast[]>([]);
let idCounter = 0;

function generateId(): string {
  return `toast-${++idCounter}-${Date.now()}`;
}

/**
 * Toast store for notifications.
 * Falls back to console logging when no UI is available.
 */
export const toastStore = {
  get toasts(): Toast[] {
    return toasts;
  },

  add(options: { message: string; style?: ToastStyle; persistent?: boolean }): string {
    const id = generateId();
    const toast: Toast = {
      id,
      message: options.message,
      style: options.style || 'white',
      persistent: options.persistent || false,
    };

    toasts = [...toasts, toast];

    // Log for debugging and non-UI contexts
    const logMethod = toast.style === 'red' ? 'warn' : 'info';
    logger[logMethod](`Toast [${toast.style}]: ${toast.message}`);

    // Auto-remove non-persistent toasts after 4 seconds
    if (!toast.persistent) {
      setTimeout(() => {
        this.remove(id);
      }, 4000);
    }

    return id;
  },

  remove(id: string): void {
    toasts = toasts.filter(t => t.id !== id);
  },

  clear(): void {
    toasts = [];
  },

  success(message: string, persistent = false): string {
    return this.add({ message, style: 'green', persistent });
  },

  error(message: string, persistent = false): string {
    return this.add({ message, style: 'red', persistent });
  },

  info(message: string, persistent = false): string {
    return this.add({ message, style: 'blue', persistent });
  },

  warning(message: string, persistent = false): string {
    return this.add({ message, style: 'yellow', persistent });
  },
};
