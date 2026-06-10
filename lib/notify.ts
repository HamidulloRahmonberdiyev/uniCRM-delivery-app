import type {
  NotificationButton,
  NotificationOptions,
  NotificationVariant,
} from '@/types/notification';

type ShowFn = (options: NotificationOptions) => void;

let showNotification: ShowFn | null = null;

export function setNotificationHandler(fn: ShowFn | null) {
  showNotification = fn;
}

function show(options: NotificationOptions) {
  showNotification?.(options);
}

function withVariant(
  variant: NotificationVariant,
  title: string,
  message?: string,
  buttons?: NotificationButton[],
) {
  show({ title, message, variant, buttons });
}

export const notify = {
  show,
  success: (title: string, message?: string) =>
    withVariant('success', title, message),
  error: (title: string, message?: string) =>
    withVariant('error', title, message),
  warning: (title: string, message?: string) =>
    withVariant('warning', title, message),
  info: (title: string, message?: string) =>
    withVariant('info', title, message),
  confirm: (
    title: string,
    message: string,
    buttons: NotificationButton[],
  ) => withVariant('confirm', title, message, buttons),
};
