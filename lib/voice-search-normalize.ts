/** Ovozli qidiruv natijasini ism/telefon qidiruviga moslashtiradi */

const WORD_TO_DIGIT: Record<string, string> = {
  // O'zbek (lotin)
  nol: '0',
  bir: '1',
  bitta: '1',
  ikki: '2',
  uch: '3',
  "to'rt": '4',
  tort: '4',
  besh: '5',
  olti: '6',
  yetti: '7',
  sakkiz: '8',
  "to'qqiz": '9',
  toqqiz: '9',
  // Rus
  ноль: '0',
  нуль: '0',
  один: '1',
  одна: '1',
  два: '2',
  две: '2',
  три: '3',
  четыре: '4',
  пять: '5',
  шесть: '6',
  семь: '7',
  восемь: '8',
  девять: '9',
  // Ingliz
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  // Tez-tez eshitiladigan xatolar
  o: '0',
  oh: '0',
  нол: '0',
};

function wordsToDigits(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      const key = word.replace(/[.,!?]/g, '');
      return WORD_TO_DIGIT[key] ?? word;
    })
    .join(' ');
}

function collapsePhoneDigits(text: string): string {
  const hasPlus = text.includes('+');
  const digits = text.replace(/\D/g, '');
  if (digits.length < 5) return text;

  const letterCount = (text.match(/[a-zа-яёўқғҳ]/gi) ?? []).length;
  if (letterCount > 2) return text;

  if (hasPlus && digits.startsWith('998')) return `+${digits}`;
  return digits;
}

export function normalizeVoiceSearchQuery(raw: string): string {
  let text = raw.trim().toLowerCase();
  if (!text) return '';

  text = text
    .replace(/[«»"'`]/g, '')
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  text = wordsToDigits(text);

  // "9 0 1 2 3" -> "90123"
  const spacedDigits = text.match(/^[\d\s+\-()]+$/);
  if (spacedDigits) {
    return collapsePhoneDigits(text);
  }

  // Ism + raqam aralash bo'lsa, raqamlarni birlashtiramiz
  const digitGroups = text.match(/\d+(?:\s+\d+)*/g);
  if (digitGroups?.length) {
    let normalized = text;
    for (const group of digitGroups) {
      const collapsed = group.replace(/\s+/g, '');
      if (collapsed.length >= 3) {
        normalized = normalized.replace(group, collapsed);
      }
    }
    text = normalized;
  }

  const digitRatio =
    (text.replace(/\D/g, '').length) / (text.replace(/\s/g, '').length || 1);
  if (digitRatio > 0.55) {
    return collapsePhoneDigits(text);
  }

  return text.replace(/\s+/g, ' ').trim();
}

export type SpeechResult = {
  transcript: string;
  confidence: number;
};

/** Eng ishonchli transkripsiyani tanlaydi */
export function pickBestTranscript(results: SpeechResult[]): string {
  if (!results.length) return '';

  const ranked = [...results]
    .map((r) => ({
      text: r.transcript?.trim() ?? '',
      confidence: r.confidence >= 0 ? r.confidence : 0.5,
    }))
    .filter((r) => r.text.length > 0)
    .sort((a, b) => {
      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 0.08) return confDiff;
      return b.text.length - a.text.length;
    });

  return ranked[0]?.text ?? '';
}
