import { useCallback, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { notify } from '@/lib/notify';
import {
  normalizeVoiceSearchQuery,
  pickBestTranscript,
} from '@/lib/voice-search-normalize';

import {
  getSpeechRecognitionModule,
  isSpeechRecognitionAvailable,
  useSpeechRecognitionEvent,
} from '@/lib/speech-recognition';

/** O'zbekistonda Android'da eng yaxshi natija beradigan til */
const SPEECH_LANG = 'ru-RU';
const SPEECH_LANG_FALLBACKS = ['uz-UZ', 'ru-RU', 'en-US'] as const;
const MAX_CONTEXT_STRINGS = 24;

type VoiceSearchOptions = {
  /** Mijoz ismlari/telefonlari — tanish aniqligini oshiradi */
  contextualStrings?: string[];
};

function showPermissionAlert() {
  notify.confirm(
    'Ruxsat kerak',
    'Ovozli qidiruv uchun mikrofon va nutqni tanish ruxsatini bering.',
    [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Sozlamalar', onPress: () => Linking.openSettings() },
    ],
  );
}

function showUnavailableAlert() {
  notify.warning(
    'Mavjud emas',
    'Ovozli qidiruv Expo Go da ishlamaydi. Development build yoki APK da foydalaning.',
  );
}

function buildContextualStrings(extra?: string[]): string[] {
  const base = ['telefon', 'ism', 'mijoz', 'buyurtma', '+998', '90'];
  const merged = [...base, ...(extra ?? [])]
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(merged)].slice(0, MAX_CONTEXT_STRINGS);
}

export function useVoiceSearch(
  onResult: (text: string) => void,
  options?: VoiceSearchOptions,
) {
  const [isListening, setIsListening] = useState(false);
  const onResultRef = useRef(onResult);
  const contextRef = useRef(options?.contextualStrings);
  onResultRef.current = onResult;
  contextRef.current = options?.contextualStrings;

  const speech = getSpeechRecognitionModule();

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', () => setIsListening(false));

  useSpeechRecognitionEvent('result', (event) => {
    const raw = pickBestTranscript(event.results);
    if (!raw) return;

    const normalized = normalizeVoiceSearchQuery(raw);
    if (!normalized) return;

    // Oraliq natija — qidiruv maydonida jonli ko'rsatish
    if (!event.isFinal) {
      onResultRef.current(normalized);
      return;
    }

    onResultRef.current(normalized);
    speech?.stop();
  });

  useSpeechRecognitionEvent('nomatch', () => {
    setIsListening(false);
    notify.warning(
      'Eshitilmadi',
      'Ovoz aniq eshitilmadi. Qayta urinib, ism yoki telefon raqamini ayting.',
    );
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);

    if (event.error === 'not-allowed') {
      showPermissionAlert();
      return;
    }

    if (
      event.error === 'aborted' ||
      event.error === 'no-speech' ||
      event.error === 'speech-timeout'
    ) {
      return;
    }

    if (event.error === 'language-not-supported') {
      notify.warning(
        'Til qo\'llab-quvvatlanmaydi',
        'Nutqni tanish tili mos emas. Sozlamalarda rus/o\'zbek tilini yoqing.',
      );
      return;
    }

    notify.error('Xatolik', 'Ovozni tanib bo\'lmadi. Qayta urinib ko\'ring.');
  });

  const startListening = useCallback(async () => {
    if (!isSpeechRecognitionAvailable || !speech) {
      showUnavailableAlert();
      return;
    }

    const permission = await speech.requestPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert();
      return;
    }

    try {
      const state = await speech.getStateAsync?.();
      if (state === 'recognizing' || state === 'starting') {
        speech.stop();
      }
    } catch {
      // holat o'qilmasa ham davom etamiz
    }

    try {
      speech.start({
        lang: SPEECH_LANG,
        interimResults: true,
        continuous: true,
        maxAlternatives: 5,
        addsPunctuation: false,
        iosTaskHint: 'search',
        iosVoiceProcessingEnabled: true,
        contextualStrings: buildContextualStrings(contextRef.current),
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'free_form',
          EXTRA_ENABLE_LANGUAGE_DETECTION: true,
          EXTRA_LANGUAGE_DETECTION_ALLOWED_LANGUAGES: [...SPEECH_LANG_FALLBACKS],
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1800,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: Platform.OS === 'android' ? 350 : 0,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1200,
        },
      });
    } catch {
      notify.error('Xatolik', 'Ovozli qidiruv ishga tushmadi.');
    }
  }, [speech]);

  const toggleListening = useCallback(async () => {
    if (!speech) {
      showUnavailableAlert();
      return;
    }

    if (isListening) {
      speech.stop();
      return;
    }

    await startListening();
  }, [isListening, speech, startListening]);

  return { isListening, toggleListening, startListening };
}
