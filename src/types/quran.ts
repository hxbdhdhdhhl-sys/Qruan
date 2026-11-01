export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export type Language = 'ar' | 'en';

export type MainNavId =
  | 'home'
  | 'quran'
  | 'adhkar'
  | 'tools'
  | 'library'
  | 'assistant'
  | 'community'
  | 'account'
  | 'admin';

export type QuranSubTab =
  | 'mushaf'
  | 'surahs'
  | 'juz'
  | 'recitations'
  | 'tafsir'
  | 'search'
  | 'compare_reciters';

export type ToolsSubTab =
  | 'prayer'
  | 'qibla'
  | 'hijri'
  | 'hifz'
  | 'tajweed'
  | 'khatmah'
  | 'haramain';

export type QuranFontStyle = 'uthmani' | 'scheherazade' | 'naskh';

export type MushafThemeMode = 'paper' | 'night' | 'auto';

export type MushafDisplayMode = 'surah' | 'page';

export type AdhkarTabId =
  | 'all'
  | 'morning'
  | 'evening'
  | 'sleep'
  | 'prayer'
  | 'after_prayer'
  | 'travel'
  | 'quranic_duas'
  | 'prophetic_duas'
  | 'prophets_duas'
  | 'favorites'
  | 'tasbih';

export type AdminTabId =
  | 'health'
  | 'catalog'
  | 'broadcast'
  | 'moderation'
  | 'roles'
  | 'audit';

export interface SurahMeta {
  number: number;
  nameAr: string;
  nameEn: string;
  meaningEn: string;
  ayahCount: number;
  revelationType: 'Makki' | 'Madani';
  revelationOrder: number;
  startPage: number;
  startJuz: number;
  summaryAr: string;
}

export interface QuranAyah {
  number: number;
  numberInSurah: number;
  surahNumber?: number;
  surahNameAr?: string;
  textUthmani: string;
  textDisplay?: string;
  translationText: string;
  muyassarTafsir?: string;
  audioUrl: string;
  juz: number;
  hizbQuarter: number;
  page: number;
  sajda: boolean;
}

export interface ReciterProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  riwayahAr: string;
  styleAr: string;
  countryAr: string;
  sampleGlobalAyah: number;
}

export interface TranslationEdition {
  id: string;
  languageAr: string;
  languageEn: string;
  translatorAr: string;
  translatorEn: string;
  sourceAr: string;
}

export interface TafsirEntry {
  id: string;
  title: string;
  author: string;
  source: string;
  text: string;
}

export interface WordMeaning {
  id: number;
  arabic: string;
  meaningEn: string;
  transliteration: string;
}

export interface DhikrItem {
  id: string;
  category:
    | 'morning'
    | 'evening'
    | 'sleep'
    | 'prayer'
    | 'after_prayer'
    | 'travel'
    | 'quranic_duas'
    | 'prophetic_duas'
    | 'prophets_duas';
  titleAr: string;
  titleEn: string;
  arabicText: string;
  translationEn: string;
  VirtueAr: string;
  sourceAr: string;
  gradingAr: string;
  repeatCount: number;
  surahRef?: { surah: number; ayah: number };
}

export interface TajweedRuleLesson {
  id: string;
  category: 'noon_tanween' | 'meem_sakinah' | 'mudood' | 'qalqalah' | 'tafkheem' | 'makharij' | 'kids';
  level: 'beginner' | 'advanced' | 'kids';
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  lettersAr: string;
  stepsAr: string[];
  exampleVerseAr: string;
  exampleRefAr: string;
  globalAyahAudioId: number;
}

export interface LibraryBook {
  id: string;
  category:
    | 'quran_sciences'
    | 'tafsir'
    | 'hadith'
    | 'seerah'
    | 'prophets_stories'
    | 'tajweed'
    | 'aqeedah'
    | 'fiqh'
    | 'adhkar_lectures';
  titleAr: string;
  titleEn: string;
  authorAr: string;
  eraAr: string;
  publisherAr: string;
  summaryAr: string;
  downloadable: boolean;
  audioLectureGlobalAyah?: number;
  chapters: Array<{
    headingAr: string;
    contentAr: string;
  }>;
}

export interface MosqueLandmark {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  countryAr: string;
  lat: number;
  lng: number;
  establishedAr: string;
  significanceAr: string;
  architectureAr: string;
  imageKey?: 'makkah' | 'madinah' | 'sanctuary';
}

export interface BookmarkRecord {
  id: string;
  userId: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  surahName: string;
  verseExcerpt: string;
  collectionTag: string;
  note: string;
  synced?: boolean;
  updatedAtIso: string;
}

export interface HifzPlanRecord {
  id: string;
  userId: string;
  title: string;
  targetScope: string;
  dailyAyahs: number;
  durationDays: number;
  memorizedAyahsCount: number;
  totalTargetAyahs: number;
  currentSurah: number;
  currentAyah: number;
  reminderTime: string;
  status: 'active' | 'completed' | 'paused';
  updatedAtIso: string;
}

export interface KhatmahPlanRecord {
  id: string;
  userId: string;
  title: string;
  durationDays: number;
  dailyPages: number;
  completedPages: number;
  currentJuz: number;
  reminderTime: string;
  shareConsent: boolean;
  status: 'active' | 'completed';
  updatedAtIso: string;
}

export interface UserPublicProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  preferredLang: Language;
  preferredReciter: string;
  lastSurah: number;
  lastAyah: number;
  lastPage: number;
  visibility: 'public' | 'private';
}

export interface NotificationSettings {
  prayerAlerts: boolean;
  adhkarAlerts: boolean;
  quranReminderTime: string;
  hifzReminderTime: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  pauseAll: boolean;
}

export interface AppToast {
  id: string;
  kind: 'success' | 'error' | 'warning' | 'info';
  message: string;
  refCode?: string;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  reciterId: string;
  surahNumber: number;
  surahNameAr: string;
  ayahNumber: number;
  globalAyahNumber: number;
  verseText: string;
  playbackRate: number;
  repeatMode: 'none' | 'ayah' | 'range';
  rangeStartAyah: number;
  rangeEndAyah: number;
  autoAdvance: boolean;
  sleepTimerMinutes: number | null;
  sleepEndsAtMs: number | null;
}
