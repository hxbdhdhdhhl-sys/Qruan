import {
  CalculationMethod,
  Coordinates,
  Madhab,
  Prayer,
  PrayerTimes,
  Qibla,
} from 'adhan';

export type CalcMethodId =
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'NorthAmerica'
  | 'Karachi'
  | 'Turkey'
  | 'Dubai';

export const CALCULATION_METHODS_META: Array<{
  id: CalcMethodId;
  aladhanCode: number;
  nameAr: string;
  nameEn: string;
}> = [
  { id: 'UmmAlQura', aladhanCode: 4, nameAr: 'جامعة أم القرى — مكة المكرمة', nameEn: 'Umm al-Qura University, Makkah' },
  { id: 'MuslimWorldLeague', aladhanCode: 3, nameAr: 'رابطة العالم الإسلامي', nameEn: 'Muslim World League (MWL)' },
  { id: 'Egyptian', aladhanCode: 5, nameAr: 'الهيئة المصرية العامة للمساحة', nameEn: 'Egyptian General Authority' },
  { id: 'Dubai', aladhanCode: 16, nameAr: 'دائرة الشؤون الإسلامية — دبي', nameEn: 'Dubai / Gulf Standard' },
  { id: 'Turkey', aladhanCode: 13, nameAr: 'رئاسة الشؤون الدينية التركية', nameEn: 'Diyanet İşleri, Turkey' },
  { id: 'Karachi', aladhanCode: 1, nameAr: 'جامعة العلوم الإسلامية — كراتشي', nameEn: 'University of Islamic Sciences, Karachi' },
  { id: 'NorthAmerica', aladhanCode: 2, nameAr: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)', nameEn: 'ISNA (North America)' },
];

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

function getAdhanParams(methodId: CalcMethodId, madhab: 'shafi' | 'hanafi') {
  let params = CalculationMethod.UmmAlQura();
  switch (methodId) {
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'Turkey':
      params = CalculationMethod.Turkey();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    default:
      params = CalculationMethod.UmmAlQura();
      break;
  }
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export interface ComputedPrayerSchedule {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  nextPrayerKey: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerNameAr: string;
  nextPrayerNameEn: string;
  nextPrayerTime: Date;
  qiblaDegrees: number;
  distanceToKaabaKm: number;
}

export function computeLocalPrayerTimes(
  lat: number,
  lng: number,
  methodId: CalcMethodId = 'UmmAlQura',
  madhab: 'shafi' | 'hanafi' = 'shafi',
  now: Date = new Date()
): ComputedPrayerSchedule {
  const coords = new Coordinates(lat, lng);
  const params = getAdhanParams(methodId, madhab);
  const pt = new PrayerTimes(coords, now, params);

  const nextP = pt.nextPrayer(now);
  let nextPrayerKey: ComputedPrayerSchedule['nextPrayerKey'] = 'fajr';
  let nextPrayerNameAr = 'الفجر';
  let nextPrayerNameEn = 'Fajr';
  let nextPrayerTime: Date = pt.fajr;

  if (nextP === Prayer.Fajr) {
    nextPrayerKey = 'fajr';
    nextPrayerNameAr = 'الفجر';
    nextPrayerNameEn = 'Fajr';
    nextPrayerTime = pt.fajr;
  } else if (nextP === Prayer.Sunrise) {
    nextPrayerKey = 'sunrise';
    nextPrayerNameAr = 'الشروق';
    nextPrayerNameEn = 'Sunrise';
    nextPrayerTime = pt.sunrise;
  } else if (nextP === Prayer.Dhuhr) {
    nextPrayerKey = 'dhuhr';
    nextPrayerNameAr = 'الظهر';
    nextPrayerNameEn = 'Dhuhr';
    nextPrayerTime = pt.dhuhr;
  } else if (nextP === Prayer.Asr) {
    nextPrayerKey = 'asr';
    nextPrayerNameAr = 'العصر';
    nextPrayerNameEn = 'Asr';
    nextPrayerTime = pt.asr;
  } else if (nextP === Prayer.Maghrib) {
    nextPrayerKey = 'maghrib';
    nextPrayerNameAr = 'المغرب';
    nextPrayerNameEn = 'Maghrib';
    nextPrayerTime = pt.maghrib;
  } else if (nextP === Prayer.Isha) {
    nextPrayerKey = 'isha';
    nextPrayerNameAr = 'العشاء';
    nextPrayerNameEn = 'Isha';
    nextPrayerTime = pt.isha;
  } else {
    // After Isha -> tomorrow's Fajr
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowPt = new PrayerTimes(coords, tomorrow, params);
    nextPrayerKey = 'fajr';
    nextPrayerNameAr = 'الفجر (غداً)';
    nextPrayerNameEn = 'Fajr (Tomorrow)';
    nextPrayerTime = tomorrowPt.fajr;
  }

  const qiblaDegrees = Math.round(Qibla(coords) * 10) / 10;
  const distanceToKaabaKm = Math.round(calculateGeodesicDistanceKm(lat, lng, KAABA_LAT, KAABA_LNG));

  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    nextPrayerKey,
    nextPrayerNameAr,
    nextPrayerNameEn,
    nextPrayerTime,
    qiblaDegrees,
    distanceToKaabaKm,
  };
}

export function calculateGeodesicDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatTimeHHMM(date: Date, lang: 'ar' | 'en' = 'ar'): string {
  return date.toLocaleTimeString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCountdownHMS(target: Date, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((target.getTime() - nowMs) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getFormattedHijriToday(date: Date = new Date()): {
  ar: string;
  en: string;
} {
  try {
    const ar = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    const en = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return { ar, en };
  } catch {
    return { ar: 'التقويم الهجري — أم القرى', en: 'Hijri Calendar (Umm al-Qura)' };
  }
}

export const HIJRI_MONTHS_LIST = [
  { number: 1, ar: 'المحرّم', en: 'Muharram', noteAr: 'من الأشهر الحرم، وفيه يوم عاشوراء (10 المحرم).' },
  { number: 2, ar: 'صفر', en: 'Safar', noteAr: 'ثاني شهور السنة الهجرية القمرية.' },
  { number: 3, ar: 'ربيع الأول', en: 'Rabi\' al-Awwal', noteAr: 'شهد الهجرة النبوية المباركة والوصول إلى المدينة المنورة.' },
  { number: 4, ar: 'ربيع الآخر', en: 'Rabi\' al-Thani', noteAr: 'رابع شهور السنة الهجرية.' },
  { number: 5, ar: 'جمادى الأولى', en: 'Jumada al-Ula', noteAr: 'خامس شهور السنة الهجرية.' },
  { number: 6, ar: 'جمادى الآخرة', en: 'Jumada al-Akhirah', noteAr: 'سادس شهور السنة الهجرية.' },
  { number: 7, ar: 'رجب', en: 'Rajab', noteAr: 'من الأشهر الحرم الأربعة المعظمة.' },
  { number: 8, ar: 'شعبان', en: 'Sha\'ban', noteAr: 'تُرفع فيه الأعمال، وكان النبي ﷺ يكثر فيه من الصيام.' },
  { number: 9, ar: 'رمضان المبارك', en: 'Ramadan', noteAr: 'شهر نزول القرآن العظيم والصيام والقيام وليلة القدر.' },
  { number: 10, ar: 'شوّال', en: 'Shawwal', noteAr: 'أول أشهر الحج وفي غرته عيد الفطر المبارك وصيام الست.' },
  { number: 11, ar: 'ذو القعدة', en: 'Dhu al-Qi\'dah', noteAr: 'من الأشهر الحرم وأشهر الحج المعلومات.' },
  { number: 12, ar: 'ذو الحجة', en: 'Dhu al-Hijjah', noteAr: 'من الأشهر الحرم، وفيه العشر المباركة ويوم عرفة وعيد الأضحى.' },
];

export const ISLAMIC_OCCASIONS = [
  { id: 'ramadan', titleAr: 'غرة شهر رمضان المبارك', hijriDateAr: '1 رمضان', descriptionAr: 'شهر القرآن والصيام والقيام والعتق من النيران.' },
  { id: 'laylat_qadr', titleAr: 'العشر الأواخر وليلة القدر', hijriDateAr: '21 - 29 رمضان', descriptionAr: 'ليلة أنزل فيها القرآن، خير من ألف شهر.' },
  { id: 'eid_fitr', titleAr: 'عيد الفطر السعيد', hijriDateAr: '1 شوال', descriptionAr: 'يوم الجائزة والفرح بإتمام الصيام وزكاة الفطر.' },
  { id: 'arafah', titleAr: 'يوم عرفة العظيم', hijriDateAr: '9 ذو الحجة', descriptionAr: 'ركن الحج الأعظم، صيامه لغير الحاج يكفّر سنتين.' },
  { id: 'eid_adha', titleAr: 'عيد الأضحى المبارك', hijriDateAr: '10 ذو الحجة', descriptionAr: 'يوم النحر الأكبر وتعظيم شعائر الله.' },
  { id: 'hijri_new_year', titleAr: 'رأس السنة الهجرية', hijriDateAr: '1 المحرم', descriptionAr: 'تذكر دروس الهجرة النبوية الشريفة وبناء الأمة.' },
  { id: 'ashura', titleAr: 'يوم عاشوراء', hijriDateAr: '10 المحرم', descriptionAr: 'يوم نجّى الله فيه موسى عليه السلام، وصيامه يكفّر السنة الماضية.' },
];
