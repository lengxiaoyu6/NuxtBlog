import { useToast as useNuxtToast } from '#imports';

export function useAppToast() {
  const toast = useNuxtToast();

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration = 3000) => {
    toast.add({
      title: message,
      color: type === 'success'
        ? 'primary'
        : type === 'error'
          ? 'error'
          : type === 'warning'
            ? 'warning'
            : 'info',
      duration
    });
  };

  return {
    addToast,
    // Provide fallback for any component still trying to use these
    toasts: [],
    removeToast: () => {}
  };
}
