import Constants from 'expo-constants';
import { Platform } from 'react-native';

type SpeechEvent = 'start' | 'end' | 'result' | 'error';
type SpeechEventHandler = (event: never) => void;

type SpeechModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  getStateAsync?: () => Promise<
    'inactive' | 'starting' | 'recognizing' | 'stopping'
  >;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
};

/** Expo Go da native modul yo'q — faqat dev build / APK da ishlaydi */
export const isSpeechRecognitionAvailable =
  Platform.OS !== 'web' && Constants.appOwnership !== 'expo';

let speechModule: SpeechModule | null = null;
let speechEventHook: (
  event: SpeechEvent,
  listener: SpeechEventHandler,
) => void = () => {};

if (isSpeechRecognitionAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native = require('expo-speech-recognition');
    speechModule = native.ExpoSpeechRecognitionModule;
    speechEventHook = native.useSpeechRecognitionEvent;
  } catch {
    speechModule = null;
  }
}

export function useSpeechRecognitionEvent(
  event: SpeechEvent,
  listener: SpeechEventHandler,
) {
  speechEventHook(event, listener);
}

export function getSpeechRecognitionModule(): SpeechModule | null {
  return speechModule;
}
