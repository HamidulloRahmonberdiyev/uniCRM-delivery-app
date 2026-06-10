export type NotificationVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'confirm';

export type NotificationButtonStyle = 'default' | 'cancel' | 'destructive';

export interface NotificationButton {
  text: string;
  style?: NotificationButtonStyle;
  onPress?: () => void;
}

export interface NotificationOptions {
  title: string;
  message?: string;
  variant?: NotificationVariant;
  buttons?: NotificationButton[];
}
