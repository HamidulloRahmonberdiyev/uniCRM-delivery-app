import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Pressable,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Palette as C } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  UZ_PHONE_PREFIX,
  formatUzPhone,
  digitsFromInput,
  toFullPhone,
  isValidUzPhone,
} from '@/utils/phone';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [digits, setDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const displayValue = formatUzPhone(digits);
  const phoneValid = isValidUzPhone(digits);
  const passwordValid = password.trim().length >= 5;
  const canSubmit = phoneValid && passwordValid;

  const handlePhoneChange = useCallback((text: string) => {
    setError('');
    setDigits(digitsFromInput(text));
  }, []);

  const handleLogin = useCallback(async () => {
    if (!phoneValid) {
      setError("To'liq telefon raqamini kiriting (masalan: 90 123 45 67)");
      return;
    }
    if (!passwordValid) {
      setError("Parol kamida 5 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn(toFullPhone(digits), password);
      router.replace('/(tabs)/orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  }, [digits, password, phoneValid, passwordValid, signIn]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
        </View>
        <Text style={styles.brand}>uniGo</Text>
        <Text style={styles.tagline}>uniGo kuryerlar ilovasi</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kirish</Text>
            <Text style={styles.cardSubtitle}>
              Telefon raqam va parolingizni kiriting
            </Text>

            {/* Telefon */}
            <Text style={styles.inputLabel}>Telefon raqam</Text>
            <Pressable
              style={[
                styles.inputRow,
                phoneFocused && styles.inputRowFocused,
                error && !phoneValid ? styles.inputRowError : null,
              ]}
              onPress={() => phoneRef.current?.focus()}
            >
              <View style={styles.prefixBox}>
                <Text style={styles.prefixFlag}>🇺🇿</Text>
                <Text style={styles.prefixText}>{UZ_PHONE_PREFIX}</Text>
              </View>
              <View style={styles.inputDivider} />
              <TextInput
                ref={phoneRef}
                style={styles.phoneInput}
                value={displayValue}
                onChangeText={handlePhoneChange}
                placeholder="90 123 45 67"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                maxLength={12}
              />
              {digits.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setDigits(''); setError(''); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x-circle" size={18} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </Pressable>

            {/* Parol */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Parol</Text>
            <View
              style={[
                styles.inputRow,
                passwordFocused && styles.inputRowFocused,
                error && !passwordValid ? styles.inputRowError : null,
              ]}
            >
              <Feather name="lock" size={18} color={passwordFocused ? C.primary : C.textMuted} />
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="Parolingiz"
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={C.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, !canSubmit && styles.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Kirish</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Davom etish orqali siz{' '}
            <Text style={styles.footerLink}>foydalanish shartlari</Text>
            ga rozilik bildirasiz
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.primary,
    alignItems: 'center',
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 4,
    marginBottom: 16,
  },
  logoInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontWeight: '500',
  },
  body: {
    flex: 1,
    marginTop: -28,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1B2A3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: C.primary,
    backgroundColor: C.primarySoft,
  },
  inputRowError: {
    borderColor: C.danger,
    backgroundColor: C.dangerSoft,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prefixFlag: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.2,
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: C.divider,
    marginRight: 2,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: C.textPrimary,
    letterSpacing: 0.5,
    padding: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: C.textPrimary,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 4,
    marginLeft: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: C.danger,
    lineHeight: 16,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: C.primaryMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerLink: {
    color: C.primary,
    fontWeight: '600',
  },
});
