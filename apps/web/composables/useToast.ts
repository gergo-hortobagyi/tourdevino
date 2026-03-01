interface ToastMessage {
  kind: 'success' | 'error' | 'info';
  message: string;
}

export function useToast() {
  const toast = useState<ToastMessage | null>('toast-message', () => null);

  const showToast = (kind: ToastMessage['kind'], message: string): void => {
    toast.value = { kind, message };
  };

  const clearToast = (): void => {
    toast.value = null;
  };

  return {
    toast,
    showToast,
    clearToast
  };
}
