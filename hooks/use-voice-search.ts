import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { notify } from '@/lib/notify';

import {
  getSpeechRecognitionModule,
  isSpeechRecognitionAvailable,
  useSpeechRecognitionEvent,
} from '@/lib/speech-recognition';

const SPEECH_LANG = 'uz-UZ';

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

export function useVoiceSearch(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const speech = getSpeechRecognitionModule();

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', () => setIsListening(false));

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript?.trim();
    if (text) {
      onResultRef.current(text);
    }
    if (event.isFinal) {
      speech?.stop();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);

    if (event.error === 'not-allowed') {
      showPermissionAlert();
      return;
    }

    if (event.error === 'aborted' || event.error === 'no-speech') {
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
      speech.start({
        lang: SPEECH_LANG,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'web_search',
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
