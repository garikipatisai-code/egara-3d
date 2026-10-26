import type { LocalizedText } from '../content3/types';

export type Lang = 'en' | 'te';

const EN = {
  title: 'Egara 3D',
  tagline: 'A small wind against a great house.',
  start: 'Start',
  continue: 'Continue',
  chapters: 'Chapters',
  mute: 'Mute',
  unmute: 'Unmute',
  pause: 'Pause',
  resume: 'Resume',
  restart: 'Restart',
  backToChapters: 'Chapters',
  nextChapter: 'Next chapter',
  chapterSelect: 'Choose a chapter',
  locked: 'Locked',
  shards: 'Memories',
  bestTime: 'Best',
  briefing: 'Briefing',
  fly: 'Fly',
  objective: 'Objective',
  paused: 'Paused',
  chapterComplete: 'Chapter complete',
  language: 'Language',
  english: 'English',
  telugu: 'తెలుగు',
  retry: 'Retry',
  webglTitle: 'WebGL unavailable',
  webglBody:
    'Egara 3D needs WebGL. Please try a recent Chrome, Edge, Firefox, or Safari with hardware acceleration on.',
  controls: 'WASD or arrows to fly · Shift boost · Space sting · P pause',
  touchHint: 'Left stick to fly · drag right to look',
  sting: 'Sting',
  boost: 'Boost',
  shardFound: 'Memory recovered',
  respawned: 'Back on the wing',
  storySoFar: 'The tale so far',
  newGame: 'New tale',
  noShards: 'No memories yet',
  completed: 'Complete',
  loading: 'Loading',
  chapter: 'Chapter',
  of: 'of',
  close: 'Close',
  settings: 'Settings',
  shake: 'Camera shake',
  on: 'On',
  off: 'Off',
  credits: 'Credits',
  press: 'Press Space',
  time: 'Time',
  falls: 'Falls',
  continueHint: 'Continue from your last chapter',
  newHint: 'Begin at the first flight',
  epilogue: 'The Wing',
  epilogueBody:
    'The Storyteller closes the glass wing. The tale is whole, or it is not; either way it can be told again.',
  amuletEarned: 'Amulet earned — one extra wingbeat in every tale.',
  amuletMissing: 'The wing is not whole. Twelve memories make the amulet.',
  amulet: 'Amulet',
  oneWing: 'One wing',
  newTale: 'New tale',
  graphics: 'Graphics',
  high: 'High',
  low: 'Low',
  graphicsLow: 'Graphics lowered to keep the frame rate'
} as const;

export type TextKey = keyof typeof EN;

const TE: Record<TextKey, string> = {
  title: 'ఎగర 3D',
  tagline: 'గొప్ప ఇంటికి ఎదురుగా ఒక చిన్న గాలి.',
  start: 'ప్రారంభించు',
  continue: 'కొనసాగించు',
  chapters: 'అధ్యాయాలు',
  mute: 'మ్యూట్',
  unmute: 'అన్‌మ్యూట్',
  pause: 'పాజ్',
  resume: 'కొనసాగించు',
  restart: 'మళ్లీ ప్రారంభించు',
  backToChapters: 'అధ్యాయాలు',
  nextChapter: 'తదుపరి అధ్యాయం',
  chapterSelect: 'అధ్యాయాన్ని ఎంచుకో',
  locked: 'లాక్',
  shards: 'జ్ఞాపకాలు',
  bestTime: 'ఉత్తమం',
  briefing: 'సంక్షిప్తం',
  fly: 'ఎగరండి',
  objective: 'లక్ష్యం',
  paused: 'నిలిపివేయబడింది',
  chapterComplete: 'అధ్యాయం పూర్తయింది',
  language: 'భాష',
  english: 'English',
  telugu: 'తెలుగు',
  retry: 'మళ్లీ ప్రయత్నించు',
  webglTitle: 'WebGL అందుబాటులో లేదు',
  webglBody:
    'ఎగర 3D కి WebGL అవసరం. హార్డ్‌వేర్ యాక్సిలరేషన్ ఆన్ చేసి, తాజా Chrome, Edge, Firefox లేదా Safari వాడండి.',
  controls: 'ఎగరడానికి WASD లేదా బాణాలు · Shift బూస్ట్ · Space కుట్టు · P పాజ్',
  touchHint: 'ఎగరడానికి ఎడమ స్టిక్ · చూడటానికి కుడివైపు లాగండి',
  sting: 'కుట్టు',
  boost: 'బూస్ట్',
  shardFound: 'జ్ఞాపకం దొరికింది',
  respawned: 'మళ్లీ రెక్కపై',
  storySoFar: 'ఇంతవరకు కథ',
  newGame: 'కొత్త కథ',
  noShards: 'ఇంకా జ్ఞాపకాలు లేవు',
  completed: 'పూర్తయింది',
  loading: 'లోడ్ అవుతోంది',
  chapter: 'అధ్యాయం',
  of: 'లో',
  close: 'మూసివేయి',
  settings: 'సెట్టింగ్‌లు',
  shake: 'కెమెరా కదలిక',
  on: 'ఆన్',
  off: 'ఆఫ్',
  credits: 'క్రెడిట్స్',
  press: 'Space నొక్కండి',
  time: 'సమయం',
  falls: 'పడిపోయినవి',
  continueHint: 'చివరి అధ్యాయం నుండి కొనసాగించు',
  newHint: 'మొదటి ఎగురుడుతో ప్రారంభించు',
  epilogue: 'రెక్క',
  epilogueBody:
    'కథకురాలు గాజు రెక్కను మూస్తుంది. కథ పూర్తయింది, లేదా పూర్తి కాలేదు; ఏదైనా మళ్లీ చెప్పవచ్చు.',
  amuletEarned: 'తాయెత్తు దొరికింది — ప్రతి కథలో ఒక అదనపు రెక్క కదలిక.',
  amuletMissing: 'రెక్క పూర్తిగా లేదు. పన్నెండు జ్ఞాపకాలు తాయెత్తును చేస్తాయి.',
  amulet: 'తాయెత్తు',
  oneWing: 'ఒక రెక్క',
  newTale: 'కొత్త కథ',
  graphics: 'గ్రాఫిక్స్',
  high: 'అధికం',
  low: 'తక్కువ',
  graphicsLow: 'ఫ్రేమ్ రేటు కోసం గ్రాఫిక్స్ తగ్గించబడింది'
};

const DICTS: Record<Lang, Record<TextKey, string>> = { en: EN, te: TE };

let current: Lang = 'en';

export function setLang(lang: Lang): void {
  current = lang === 'te' ? 'te' : 'en';
}

export function getLang(): Lang {
  return current;
}

export function toggleLang(): Lang {
  current = current === 'en' ? 'te' : 'en';
  return current;
}

export function t(key: TextKey, vars?: Record<string, string | number>): string {
  const template = DICTS[current][key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/** Pick the current language out of content-authored EN/TE text. */
export function localized(text: LocalizedText): string {
  return current === 'te' ? text.te : text.en;
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
