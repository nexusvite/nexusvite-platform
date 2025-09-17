// Simple toast hook for demo
import { useState, useCallback } from 'react';

interface Toast {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((props: Toast) => {
    // For now, just console log the toast
    console.log('Toast:', props);

    // You could also use the browser's notification API or a simple alert
    if (props.variant === 'destructive') {
      alert(`Error: ${props.title}\n${props.description}`);
    } else {
      alert(`${props.title}\n${props.description}`);
    }
  }, []);

  return { toast };
}