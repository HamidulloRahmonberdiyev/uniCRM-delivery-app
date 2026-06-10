import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Palette as C } from '@/constants/theme';
import type {
  NotificationButton,
  NotificationOptions,
  NotificationVariant,
} from '@/types/notification';

const { width: SCREEN_W } = Dimensions.get('window');

interface NotificationModalProps {
  visible: boolean;
  options: NotificationOptions | null;
  onClose: () => void;
}

const VARIANT_CONFIG: Record<
  NotificationVariant,
  {
    icon: React.ComponentProps<typeof Feather>['name'];
    color: string;
    soft: string;
    ring: string;
  }
> = {
  success: {
    icon: 'check-circle',
    color: '#22C55E',
    soft: '#F0FDF4',
    ring: 'rgba(34, 197, 94, 0.18)',
  },
  error: {
    icon: 'alert-circle',
    color: C.danger,
    soft: C.dangerSoft,
    ring: 'rgba(229, 69, 62, 0.16)',
  },
  warning: {
    icon: 'alert-triangle',
    color: '#F59E0B',
    soft: '#FFFBEB',
    ring: 'rgba(245, 158, 11, 0.16)',
  },
  info: {
    icon: 'info',
    color: C.primary,
    soft: C.primarySoft,
    ring: 'rgba(0, 136, 204, 0.16)',
  },
  confirm: {
    icon: 'help-circle',
    color: C.primary,
    soft: C.primarySoft,
    ring: 'rgba(0, 136, 204, 0.16)',
  },
};

function resolveButtons(options: NotificationOptions): NotificationButton[] {
  if (options.buttons?.length) return options.buttons;
  return [{ text: 'Yaxshi', style: 'default' }];
}

function resolveVariant(options: NotificationOptions): NotificationVariant {
  if (options.variant) return options.variant;

  const buttons = options.buttons ?? [];
  if (buttons.some((b) => b.style === 'destructive')) return 'confirm';

  return 'info';
}

export function NotificationModal({
  visible,
  options,
  onClose,
}: NotificationModalProps) {
  const variant = useMemo(
    () => (options ? resolveVariant(options) : 'info'),
    [options],
  );
  const config = VARIANT_CONFIG[variant];
  const buttons = useMemo(
    () => (options ? resolveButtons(options) : []),
    [options],
  );

  if (!options) return null;

  const handlePress = (button: NotificationButton) => {
    onClose();
    button.onPress?.();
  };

  const isDual = buttons.length === 2;
  const canDismissOnBackdrop = variant !== 'confirm';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={canDismissOnBackdrop ? onClose : undefined}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={styles.backdrop}
      >
        {canDismissOnBackdrop ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        ) : (
          <View style={StyleSheet.absoluteFill} />
        )}

        <Animated.View
          entering={ZoomIn.springify().damping(16).stiffness(220)}
          exiting={FadeOut.duration(160)}
          style={styles.cardWrap}
        >
          <View style={styles.card}>
            <View style={[styles.iconRing, { backgroundColor: config.ring }]}>
              <View style={[styles.iconCircle, { backgroundColor: config.soft }]}>
                <Feather name={config.icon} size={30} color={config.color} />
              </View>
            </View>

            <Text style={styles.title}>{options.title}</Text>
            {options.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}

            <View style={[styles.actions, isDual && styles.actionsRow]}>
              {buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                const isPrimary = !isCancel && !isDestructive;

                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      isDual && styles.buttonHalf,
                      isPrimary && styles.buttonPrimary,
                      isCancel && styles.buttonCancel,
                      isDestructive && styles.buttonDestructive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => handlePress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isPrimary && styles.buttonTextPrimary,
                        isCancel && styles.buttonTextCancel,
                        isDestructive && styles.buttonTextDestructive,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const CARD_W = Math.min(SCREEN_W - 48, 360);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 42, 61, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardWrap: {
    width: CARD_W,
    zIndex: 2,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 26,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 14,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: C.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  actions: {
    width: '100%',
    marginTop: 26,
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  button: {
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonCancel: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  buttonDestructive: {
    backgroundColor: C.danger,
    shadowColor: C.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextCancel: {
    color: C.textSecondary,
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});
