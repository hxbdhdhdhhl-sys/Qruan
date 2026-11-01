/**
 * IndexedDB & CacheStorage Offline Engine for اطمئنان القرآن – Quran Reassurance
 * Enables reading downloaded Surahs, Mushaf pages, Tafsirs, Translations, Library books,
 * and playing downloaded audio recitations completely offline.
 */

const DB_NAME = 'quran_reassurance_offline_v1';
const DB_VERSION = 1;
const STORE_SURAHS = 'surahs';
const STORE_PAGES = 'pages';
const STORE_TAFSIRS = 'tafsirs';
const STORE_BOOKS = 'books';

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SURAHS)) {
        db.createObjectStore(STORE_SURAHS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        db.createObjectStore(STORE_PAGES, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_TAFSIRS)) {
        db.createObjectStore(STORE_TAFSIRS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveOfflineRecord<T extends Record<string, unknown>>(
  storeName: 'surahs' | 'pages' | 'tafsirs' | 'books',
  record: T
): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback gracefully if storage quota is full
  }
}

export async function getOfflineRecord<T>(
  storeName: 'surahs' | 'pages' | 'tafsirs' | 'books',
  key: string
): Promise<T | null> {
  try {
    const db = await openOfflineDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function listDownloadedSurahMeta(): Promise<
  Array<{ surahNumber: number; nameAr: string; reciterId: string; savedAtIso: string }>
> {
  try {
    const raw = localStorage.getItem('qr_downloaded_surahs_index');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function downloadSurahForOffline(
  surahNumber: number,
  nameAr: string,
  translationId: string,
  reciterId: string,
  downloadAudio: boolean,
  onProgress: (percent: number) => void
): Promise<void> {
  onProgress(8);
  const res = await fetch(
    `/api/quran/surah/${surahNumber}?translation=${encodeURIComponent(translationId)}&reciter=${encodeURIComponent(reciterId)}`
  );
  if (!res.ok) {
    throw new Error('تعذر تحميل بيانات السورة للتخزين دون إنترنت');
  }
  const data = await res.json();
  onProgress(30);

  await saveOfflineRecord('surahs', {
    key: `surah_${surahNumber}_${translationId}`,
    surahNumber,
    translationId,
    payload: data,
    savedAtIso: new Date().toISOString(),
  });

  // Also store default Uthmani lookup key so any translation selection still has offline Uthmani fallback
  await saveOfflineRecord('surahs', {
    key: `surah_${surahNumber}_default`,
    surahNumber,
    translationId: 'default',
    payload: data,
    savedAtIso: new Date().toISOString(),
  });

  if (downloadAudio && typeof caches !== 'undefined' && Array.isArray(data.ayahs)) {
    const cache = await caches.open('quran-audio-recitations-cache');
    const ayahs = data.ayahs.slice(0, 45); // Cap batch audio fetch so large Surahs stay responsive
    for (let i = 0; i < ayahs.length; i++) {
      const audioUrl = String(ayahs[i].audioUrl || '');
      if (audioUrl.startsWith('/') || audioUrl.startsWith('http')) {
        try {
          const audioResp = await fetch(audioUrl);
          if (audioResp.ok && audioResp.status === 200) {
            await cache.put(audioUrl, audioResp.clone());
          }
        } catch {
          // Individual audio verse failure doesn't abort text cache
        }
      }
      const pct = 30 + Math.round(((i + 1) / ayahs.length) * 68);
      onProgress(Math.min(98, pct));
    }
  }

  const existing = await listDownloadedSurahMeta();
  const filtered = existing.filter((x) => x.surahNumber !== surahNumber);
  filtered.unshift({
    surahNumber,
    nameAr,
    reciterId,
    savedAtIso: new Date().toISOString(),
  });
  localStorage.setItem('qr_downloaded_surahs_index', JSON.stringify(filtered.slice(0, 114)));
  onProgress(100);
}
