import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Haptics from 'expo-haptics';

import { NotificationModal } from '@/components/notification-modal';
import { setNotificationHandler } from '@/lib/notify';
import type { NotificationOptions, NotificationVariant } from '@/types/notification';

interface NotificationContextValue {
  notify: (options: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function hapticForVariant(variant: NotificationVariant) {
  switch (variant) {
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    default:
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<NotificationOptions | null>(null);

  const show = useCallback((next: NotificationOptions) => {
    setOptions(next);
    setVisible(true);
    hapticForVariant(next.variant ?? 'info');
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOptions(null), 220);
  }, []);

  useEffect(() => {
    setNotificationHandler(show);
    return () => setNotificationHandler(null);
  }, [show]);

  const value = useMemo(() => ({ notify: show }), [show]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationModal visible={visible} options={options} onClose={hide} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}
