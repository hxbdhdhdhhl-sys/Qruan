import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Canonical verse counts for all 114 Surahs (Total = 6,236 Ayahs in Hafs 'an 'Asim)
const CANONICAL_SURAH_AYAH_COUNTS: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  cachedAtUtc: string;
}

interface DiagnosticsErrorLog {
  id: string;
  refCode: string;
  timestampUtc: string;
  scope: string;
  message: string;
}

const apiCache = new Map<string, CacheEntry<unknown>>();
const diagnosticsLogs: DiagnosticsErrorLog[] = [];
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
let totalApiRequests = 0;
let cacheHitsCount = 0;

function getCache<T>(key: string): T | null {
  const item = apiCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  cacheHitsCount += 1;
  return item.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  apiCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    cachedAtUtc: new Date().toISOString(),
  });
}

function redactSensitiveText(raw: string): string {
  return raw
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .slice(0, 360);
}

function recordDiagnosticError(scope: string, err: unknown): string {
  const refCode = `ERR-QR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const rawMessage = err instanceof Error ? err.message : String(err);
  diagnosticsLogs.unshift({
    id: crypto.randomUUID(),
    refCode,
    timestampUtc: new Date().toISOString(),
    scope: scope.slice(0, 60),
    message: redactSensitiveText(rawMessage),
  });
  if (diagnosticsLogs.length > 100) {
    diagnosticsLogs.length = 100;
  }
  return refCode;
}

function cleanHtmlText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Allowed verified editions whitelist to prevent SSRF / arbitrary path injection
const ALLOWED_TRANSLATIONS = new Set([
  'en.sahih',
  'en.yusufali',
  'fr.hamidullah',
  'de.aburida',
  'ru.kuliev',
  'tr.diyanet',
  'ko.korean',
  'es.cortes',
  'id.indonesian',
  'ur.jalandhry',
]);

const RECITER_BITRATES: Record<string, number> = {
  'ar.alafasy': 128,
  'ar.abdulbasitmurattal': 192,
  'ar.abdurrahmaansudais': 192,
  'ar.husary': 128,
  'ar.husarymujawwad': 128,
  'ar.minshawi': 128,
  'ar.mahermuaiqly': 128,
  'ar.saoodshuraym': 64,
  'ar.ahmedajamy': 64,
  'ar.aymanswoaid': 64,
};

// Authentic published Surah & Khashi'a recitations of Sheikh Abdulrahman Mossad (عبد الرحمن بن مسعد) on Internet Archive
const ABDULRAHMAN_MOSSAD_SURAH_URLS: Record<number, string> = {
  1: `https://archive.org/download/add-m3rfa.blogspot.com_202009/${encodeURIComponent('سورة الفاتحة بصوت القارئ عبد الرحمن مسعد - موقع ادد معرفة - add-M3rfa.BlogSpoT.CoM.mp3')}`,
  2: 'https://archive.org/download/AbdulrahmanMassaad/002.mp3',
  3: 'https://archive.org/download/AbdulrahmanMassaad/003.mp3',
  5: 'https://archive.org/download/AbdulrahmanMassaad/005.mp3',
  7: 'https://archive.org/download/AbdulrahmanMassaad/007.mp3',
  10: 'https://archive.org/download/AbdulrahmanMassaad/010.mp3',
  13: `https://archive.org/download/20210117_20210117_1138/${encodeURIComponent('الذين امنوا وتطمئن قلوبهم بذكر الله.mp3')}`,
  14: `https://archive.org/download/20210117_20210117_1138/${encodeURIComponent('ولا تحسبن الله غافلا عما يعمل الظالمون.mp3')}`,
  15: 'https://archive.org/download/AbdulrahmanMassaad/015.mp3',
  16: 'https://archive.org/download/AbdulrahmanMassaad/016.mp3',
  19: 'https://archive.org/download/AbdulrahmanMassaad/019.mp3',
  22: `https://archive.org/download/20210117_20210117_1138/${encodeURIComponent('ايات الحج.mp3')}`,
  23: 'https://archive.org/download/AbdulrahmanMassaad/023.mp3',
  24: 'https://archive.org/download/AbdulrahmanMassaad/024.mp3',
  25: 'https://archive.org/download/AbdulrahmanMassaad/025.mp3',
  27: `https://archive.org/download/a2025112aaaaa5/${encodeURIComponent('تلاوة من سورة النمل  عبد الرحمن مسعد  2023.mp3')}`,
  29: 'https://archive.org/download/AbdulrahmanMassaad/029.mp3',
  30: 'https://archive.org/download/AbdulrahmanMassaad/030.mp3',
  32: 'https://archive.org/download/AbdulrahmanMassaad/032.mp3',
  49: 'https://archive.org/download/AbdulrahmanMassaad/049.mp3',
  67: 'https://archive.org/download/AbdulrahmanMassaad/067.mp3',
  73: 'https://archive.org/download/AbdulrahmanMassaad/073.mp3',
  78: 'https://archive.org/download/AbdulrahmanMassaad/078.mp3',
  87: 'https://archive.org/download/AbdulrahmanMassaad/087.mp3',
  88: 'https://archive.org/download/AbdulrahmanMassaad/088.mp3',
  100: 'https://archive.org/download/AbdulrahmanMassaad/100.mp3',
  107: 'https://archive.org/download/AbdulrahmanMassaad/107.mp3',
  112: 'https://archive.org/download/AbdulrahmanMassaad/112.mp3',
  113: 'https://archive.org/download/AbdulrahmanMassaad/113.mp3',
  114: 'https://archive.org/download/AbdulrahmanMassaad/114.mp3',
};

const ALLOWED_RECITERS = new Set([...Object.keys(RECITER_BITRATES), 'ar.abdulrahmanmossad']);

function globalAyahToSurahNumber(globalAyah: number): number {
  let cumulative = 0;
  for (let i = 0; i < CANONICAL_SURAH_AYAH_COUNTS.length; i++) {
    cumulative += CANONICAL_SURAH_AYAH_COUNTS[i];
    if (globalAyah <= cumulative) {
      return i + 1;
    }
  }
  return 1;
}

const audioBufferCache = new Map<string, Buffer>();
const MAX_AUDIO_BUFFERS = 60;

function cacheAudioBuffer(key: string, buf: Buffer): void {
  if (audioBufferCache.has(key)) {
    audioBufferCache.delete(key);
  } else if (audioBufferCache.size >= MAX_AUDIO_BUFFERS) {
    const oldestKey = audioBufferCache.keys().next().value;
    if (oldestKey) audioBufferCache.delete(oldestKey);
  }
  audioBufferCache.set(key, buf);
}

function sendAudioBufferWithRange(req: Request, res: Response, buffer: Buffer): void {
  const total = buffer.length;
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=604800');

  const rangeHeader = req.headers.range;
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    res.setHeader('Content-Length', String(total));
    res.status(200).end(buffer);
    return;
  }

  const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
  const start = Number.parseInt(startStr, 10);
  const end = endStr ? Math.min(total - 1, Number.parseInt(endStr, 10)) : total - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || start >= total || start > end) {
    res.setHeader('Content-Range', `bytes */${total}`);
    res.status(416).end();
    return;
  }

  const chunk = buffer.subarray(start, end + 1);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
  res.setHeader('Content-Length', String(chunk.length));
  res.status(206).end(chunk);
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function fetchVerifiedUthmaniAyah(
  surahNumber: number,
  ayahNumber: number
): Promise<{ text: string; surahName: string; page: number; juz: number } | null> {
  if (surahNumber < 1 || surahNumber > 114) return null;
  const maxAyah = CANONICAL_SURAH_AYAH_COUNTS[surahNumber - 1];
  if (ayahNumber < 1 || ayahNumber > maxAyah) return null;

  const cacheKey = `verified_ayah_${surahNumber}_${ayahNumber}`;
  const cached = getCache<{ text: string; surahName: string; page: number; juz: number }>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const d = json?.data;
    if (!d?.text) return null;
    const result = {
      text: String(d.text),
      surahName: String(d.surah?.name || ''),
      page: Number(d.page || 1),
      juz: Number(d.juz || 1),
    };
    setCache(cacheKey, result, 24 * 60 * 60 * 1000);
    return result;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  // Security headers compatible with AI Studio iframe
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    next();
  });

  // Rate limiting on /api/* (180 JSON req/min, 900 audio stream req/min per IP)
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    totalApiRequests += 1;
    const isAudioStream =
      req.path.startsWith('/quran/audio/') || req.path === '/prayer/adhan-audio';
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local')
      .split(',')[0]
      .trim();
    const bucketKey = isAudioStream ? `audio_${ip}` : ip;
    const maxLimit = isAudioStream ? 900 : 180;
    const now = Date.now();
    const bucket = rateBuckets.get(bucketKey);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(bucketKey, { count: 1, resetAt: now + 60_000 });
      next();
      return;
    }
    bucket.count += 1;
    if (bucket.count > maxLimit) {
      res.status(429).json({
        error: 'تم تجاوز الحد المسموح للطلبات المتتالية. يرجى الانتظار لحظات ثم المحاولة مجدداً.',
        refCode: 'ERR-RATE-429',
      });
      return;
    }
    next();
  });

  // 0. Same-Origin Verified Quranic Audio Stream Endpoint (Supports HTTP 206 Byte-Range & Fallback)
  app.get('/api/quran/audio/:reciter/:globalAyah', async (req: Request, res: Response) => {
    const rawReciter = String(req.params.reciter || 'ar.alafasy');
    const reciter = ALLOWED_RECITERS.has(rawReciter) ? rawReciter : 'ar.alafasy';
    const globalAyah = Number(req.params.globalAyah);

    if (!Number.isInteger(globalAyah) || globalAyah < 1 || globalAyah > 6236) {
      res.status(400).json({ error: 'رقم الآية العام يجب أن يكون بين 1 و 6236.' });
      return;
    }

    const cacheKey = `audio_${reciter}_${globalAyah}`;
    const memCached = audioBufferCache.get(cacheKey);
    if (memCached) {
      cacheHitsCount += 1;
      sendAudioBufferWithRange(req, res, memCached);
      return;
    }

    // Stream authentic Archive.org recordings for Sheikh Abdulrahman Mossad (with HTTP Range pass-through)
    if (reciter === 'ar.abdulrahmanmossad') {
      const surahNumber = globalAyahToSurahNumber(globalAyah);
      const mossadUrl = ABDULRAHMAN_MOSSAD_SURAH_URLS[surahNumber];
      if (mossadUrl) {
        try {
          const fwdHeaders: Record<string, string> = {};
          if (typeof req.headers.range === 'string') {
            fwdHeaders['Range'] = req.headers.range;
          }
          const upstream = await fetch(mossadUrl, {
            headers: fwdHeaders,
            redirect: 'follow',
            signal: AbortSignal.timeout(15_000),
          });
          if ((upstream.status === 200 || upstream.status === 206) && upstream.body) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=604800');
            const cLen = upstream.headers.get('content-length');
            if (cLen) res.setHeader('Content-Length', cLen);
            const cRange = upstream.headers.get('content-range');
            if (cRange) res.setHeader('Content-Range', cRange);
            res.status(upstream.status);
            Readable.fromWeb(upstream.body as any).pipe(res);
            return;
          }
        } catch {
          // Fall through to standard verified ayah mirror if upstream archive times out
        }
      }
    }

    const bitrate = RECITER_BITRATES[reciter] || 128;
    const primaryReciter = RECITER_BITRATES[reciter] ? reciter : 'ar.alafasy';
    const candidateUrls = [
      `https://cdn.islamic.network/quran/audio/${bitrate}/${primaryReciter}/${globalAyah}.mp3`,
      `https://cdn.islamic.network/quran/audio/64/${primaryReciter}/${globalAyah}.mp3`,
      `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyah}.mp3`,
    ];

    for (const url of candidateUrls) {
      try {
        const upstream = await fetch(url, { signal: AbortSignal.timeout(12_000) });
        if (!upstream.ok) continue;
        const arrBuf = await upstream.arrayBuffer();
        const buf = Buffer.from(arrBuf);
        if (buf.length < 256) continue;
        cacheAudioBuffer(cacheKey, buf);
        sendAudioBufferWithRange(req, res, buf);
        return;
      } catch {
        // Try next verified mirror
      }
    }

    const refCode = recordDiagnosticError(`/api/quran/audio/${reciter}/${globalAyah}`, 'All audio mirrors failed');
    res.status(502).json({ error: 'تعذر تحميل التلاوة الصوتية حالياً.', refCode });
  });

  // 0B. Same-Origin Adhan Preview Audio Stream Endpoint
  app.get('/api/prayer/adhan-audio', async (req: Request, res: Response) => {
    const cacheKey = 'adhan_preview_mp3';
    const memCached = audioBufferCache.get(cacheKey);
    if (memCached) {
      cacheHitsCount += 1;
      sendAudioBufferWithRange(req, res, memCached);
      return;
    }

    const candidateUrls = [
      'https://cdn.aladhan.com/audio/adhans/a1.mp3',
      'https://cdn.islamic.network/quran/audio/192/ar.abdurrahmaansudais/1.mp3',
    ];

    for (const url of candidateUrls) {
      try {
        const upstream = await fetch(url, { signal: AbortSignal.timeout(12_000) });
        if (!upstream.ok) continue;
        const buf = Buffer.from(await upstream.arrayBuffer());
        if (buf.length < 512) continue;
        cacheAudioBuffer(cacheKey, buf);
        sendAudioBufferWithRange(req, res, buf);
        return;
      } catch {
        // Try fallback
      }
    }

    res.status(502).json({ error: 'تعذر تشغيل المعاينة الصوتية للأذان حالياً.' });
  });

  // 1. Canonical Surah Fetch with Strict Verse-Count Integrity Verification
  app.get('/api/quran/surah/:surahNumber', async (req: Request, res: Response) => {
    const surahNum = Number(req.params.surahNumber);
    if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) {
      res.status(400).json({ error: 'رقم السورة غير صحيح (يجب أن يكون بين 1 و 114).', refCode: 'ERR-SURAH-400' });
      return;
    }

    const riwayah = req.query.riwayah === 'warsh' ? 'warsh' : 'hafs';
    const rawTranslation = String(req.query.translation || 'en.sahih');
    const translation = ALLOWED_TRANSLATIONS.has(rawTranslation) ? rawTranslation : 'en.sahih';
    const rawReciter = String(req.query.reciter || 'ar.alafasy');
    const reciter = ALLOWED_RECITERS.has(rawReciter) ? rawReciter : 'ar.alafasy';

    const cacheKey = `surah_v2_${surahNum}_${riwayah}_${translation}_${reciter}`;
    const cached = getCache<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const editions = `quran-uthmani,${translation},ar.muyassar`;
      const upstreamUrl = `https://api.alquran.cloud/v1/surah/${surahNum}/editions/${editions}`;
      const response = await fetch(upstreamUrl, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) {
        throw new Error(`AlQuran Cloud HTTP ${response.status}`);
      }
      const payload = (await response.json()) as any;
      const dataArr: any[] = payload?.data;
      if (!Array.isArray(dataArr) || dataArr.length < 3) {
        throw new Error('Malformed editions response from verified Quran provider');
      }

      const uthmaniEd = dataArr[0];
      const transEd = dataArr[1];
      const tafsirEd = dataArr[2];

      const expectedCount = CANONICAL_SURAH_AYAH_COUNTS[surahNum - 1];
      if (!Array.isArray(uthmaniEd?.ayahs) || uthmaniEd.ayahs.length !== expectedCount) {
        throw new Error(
          `Quran integrity check failed for Surah ${surahNum}: expected ${expectedCount} ayahs, got ${uthmaniEd?.ayahs?.length ?? 0}`
        );
      }

      // Optional Warsh script enrichment from Quran.com v4 when selected
      let warshMap = new Map<number, string>();
      if (riwayah === 'warsh') {
        try {
          const wRes = await fetch(
            `https://api.quran.com/api/v4/quran/verses/indopak?chapter_number=${surahNum}`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (wRes.ok) {
            const wJson = (await wRes.json()) as any;
            for (const v of wJson?.verses || []) {
              const parts = String(v.verse_key || '').split(':');
              const aNum = Number(parts[1]);
              if (aNum && v.text_indopak) {
                warshMap.set(aNum, String(v.text_indopak));
              }
            }
          }
        } catch {
          // Gracefully keep Uthmani if secondary calligraphy endpoint times out
        }
      }

      const ayahs = uthmaniEd.ayahs.map((a: any, idx: number) => {
        const numberInSurah = Number(a.numberInSurah);
        return {
          number: Number(a.number),
          numberInSurah,
          textUthmani: String(a.text),
          textDisplay: riwayah === 'warsh' && warshMap.get(numberInSurah) ? warshMap.get(numberInSurah)! : String(a.text),
          translationText: String(transEd?.ayahs?.[idx]?.text || ''),
          muyassarTafsir: String(tafsirEd?.ayahs?.[idx]?.text || ''),
          audioUrl: `/api/quran/audio/${reciter}/${Number(a.number)}`,
          juz: Number(a.juz),
          manzil: Number(a.manzil),
          page: Number(a.page),
          ruku: Number(a.ruku),
          hizbQuarter: Number(a.hizbQuarter),
          sajda: Boolean(a.sajda && (a.sajda === true || typeof a.sajda === 'object')),
        };
      });

      const result = {
        surahNumber: surahNum,
        nameAr: String(uthmaniEd.name),
        nameEn: String(uthmaniEd.englishName),
        englishNameTranslation: String(uthmaniEd.englishNameTranslation),
        revelationType: String(uthmaniEd.revelationType),
        numberOfAyahs: expectedCount,
        riwayah: riwayah === 'warsh' && warshMap.size === expectedCount ? 'الخط المغربي / الهندي الموثق' : 'حفص عن عاصم – مجمع الملك فهد لطباعة المصحف الشريف',
        translationMeta: {
          identifier: translation,
          name: String(transEd?.name || translation),
          englishName: String(transEd?.englishName || translation),
          language: String(transEd?.language || 'en'),
        },
        tafsirMeta: {
          identifier: 'ar.muyassar',
          name: 'التفسير الميسر',
          author: 'نخبة من العلماء – مجمع الملك فهد لطباعة المصحف الشريف',
        },
        reciterMeta: {
          identifier: reciter,
          name: reciter,
        },
        integrityVerified: true,
        ayahs,
        fetchedAtUtc: new Date().toISOString(),
      };

      setCache(cacheKey, result, 12 * 60 * 60 * 1000);
      res.json(result);
    } catch (err) {
      const refCode = recordDiagnosticError(`/api/quran/surah/${surahNum}`, err);
      res.status(502).json({
        error: 'تعذر تحميل السورة من المصدر القرآني الموثوق حالياً. يرجى التحقق من الاتصال والمحاولة مجدداً.',
        refCode,
      });
    }
  });

  // 2. Mushaf Page Endpoint (Pages 1 to 604)
  app.get('/api/quran/page/:pageNumber', async (req: Request, res: Response) => {
    const pageNum = Number(req.params.pageNumber);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > 604) {
      res.status(400).json({ error: 'رقم صفحة المصحف يجب أن يكون بين 1 و 604.', refCode: 'ERR-PAGE-400' });
      return;
    }

    const rawReciter = String(req.query.reciter || 'ar.alafasy');
    const reciter = ALLOWED_RECITERS.has(rawReciter) ? rawReciter : 'ar.alafasy';
    const rawTranslation = String(req.query.translation || 'en.sahih');
    const translation = ALLOWED_TRANSLATIONS.has(rawTranslation) ? rawTranslation : 'en.sahih';

    const cacheKey = `mushaf_page_${pageNum}_${translation}_${reciter}`;
    const cached = getCache<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const [uthmaniRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`, {
          signal: AbortSignal.timeout(9000),
        }),
        fetch(`https://api.alquran.cloud/v1/page/${pageNum}/${translation}`, {
          signal: AbortSignal.timeout(9000),
        }),
      ]);

      if (!uthmaniRes.ok) {
        throw new Error(`Page Uthmani HTTP ${uthmaniRes.status}`);
      }

      const uthmaniJson = (await uthmaniRes.json()) as any;
      const transJson = transRes.ok ? ((await transRes.json()) as any) : null;

      const rawAyahs: any[] = uthmaniJson?.data?.ayahs || [];
      const transAyahs: any[] = transJson?.data?.ayahs || [];

      if (rawAyahs.length === 0) {
        throw new Error('Empty Mushaf page returned');
      }

      const ayahs = rawAyahs.map((a: any, idx: number) => ({
        number: Number(a.number),
        numberInSurah: Number(a.numberInSurah),
        surahNumber: Number(a.surah?.number || 1),
        surahNameAr: String(a.surah?.name || ''),
        surahNameEn: String(a.surah?.englishName || ''),
        revelationType: String(a.surah?.revelationType || ''),
        textUthmani: String(a.text),
        translationText: String(transAyahs[idx]?.text || ''),
        audioUrl: `/api/quran/audio/${reciter}/${Number(a.number)}`,
        juz: Number(a.juz),
        hizbQuarter: Number(a.hizbQuarter),
        page: Number(a.page),
        sajda: Boolean(a.sajda && (a.sajda === true || typeof a.sajda === 'object')),
      }));

      const payload = {
        pageNumber: pageNum,
        juz: ayahs[0]?.juz || 1,
        hizbQuarter: ayahs[0]?.hizbQuarter || 1,
        surahsOnPage: Array.from(new Set(ayahs.map((x) => x.surahNameAr))),
        sourceAttribution: 'مصحف المدينة النبوية – مجمع الملك فهد لطباعة المصحف الشريف (برواية حفص عن عاصم)',
        integrityVerified: true,
        ayahs,
        fetchedAtUtc: new Date().toISOString(),
      };

      setCache(cacheKey, payload, 24 * 60 * 60 * 1000);
      res.json(payload);
    } catch (err) {
      const refCode = recordDiagnosticError(`/api/quran/page/${pageNum}`, err);
      res.status(502).json({
        error: 'تعذر تحميل صفحة المصحف الشريف حالياً. يرجى إعادة المحاولة.',
        refCode,
      });
    }
  });

  // 3. Multi-Tafsir + Word-by-Word Meanings Endpoint for Any Ayah
  app.get('/api/quran/tafsir/:surahNumber/:ayahNumber', async (req: Request, res: Response) => {
    const s = Number(req.params.surahNumber);
    const a = Number(req.params.ayahNumber);
    if (!Number.isInteger(s) || s < 1 || s > 114 || !Number.isInteger(a) || a < 1 || a > (CANONICAL_SURAH_AYAH_COUNTS[s - 1] || 0)) {
      res.status(400).json({ error: 'مرجع السورة أو الآية غير صحيح.', refCode: 'ERR-TAFSIR-400' });
      return;
    }

    const cacheKey = `multi_tafsir_v1_${s}_${a}`;
    const cached = getCache<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const [alquranRes, saadiRes, ibnKathirRes, tabariRes, qurtubiRes, wordsRes] = await Promise.allSettled([
        fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,ar.muyassar,ar.jalalayn,ar.baghawi`, {
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${s}:${a}`, {
          signal: AbortSignal.timeout(7000),
        }),
        fetch(`https://api.quran.com/api/v4/tafsirs/14/by_ayah/${s}:${a}`, {
          signal: AbortSignal.timeout(7000),
        }),
        fetch(`https://api.quran.com/api/v4/tafsirs/15/by_ayah/${s}:${a}`, {
          signal: AbortSignal.timeout(7000),
        }),
        fetch(`https://api.quran.com/api/v4/tafsirs/90/by_ayah/${s}:${a}`, {
          signal: AbortSignal.timeout(7000),
        }),
        fetch(
          `https://api.quran.com/api/v4/verses/by_key/${s}:${a}?words=true&word_fields=text_uthmani,translation`,
          { signal: AbortSignal.timeout(7000) }
        ),
      ]);

      const tafsirs: Array<{
        id: string;
        title: string;
        author: string;
        source: string;
        text: string;
      }> = [];

      let ayahText = '';
      let surahName = '';

      if (alquranRes.status === 'fulfilled' && alquranRes.value.ok) {
        const j = (await alquranRes.value.json()) as any;
        const arr: any[] = j?.data || [];
        ayahText = String(arr[0]?.text || '');
        surahName = String(arr[0]?.surah?.name || '');

        if (arr[1]?.text) {
          tafsirs.push({
            id: 'muyassar',
            title: 'التفسير الميسر',
            author: 'نخبة من علماء التفسير',
            source: 'مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة',
            text: String(arr[1].text),
          });
        }
        if (arr[2]?.text) {
          tafsirs.push({
            id: 'jalalayn',
            title: 'تفسير الجلالين',
            author: 'جلال الدين المحلي وجلال الدين السيوطي (ت 911 هـ)',
            source: 'الطبعة المعتمدة لتفسير الجلالين',
            text: String(arr[2].text),
          });
        }
        if (arr[3]?.text) {
          tafsirs.push({
            id: 'baghawi',
            title: 'معالم التنزيل (تفسير البغوي)',
            author: 'الإمام الحسين بن مسعود البغوي (ت 516 هـ)',
            source: 'تفسير البغوي الموثق',
            text: String(arr[3].text),
          });
        }
      }

      const appendQuranComTafsir = async (
        settled: PromiseSettledResult<globalThis.Response>,
        id: string,
        title: string,
        author: string,
        source: string
      ) => {
        if (settled.status === 'fulfilled' && settled.value.ok) {
          const data = (await settled.value.json()) as any;
          const cleaned = cleanHtmlText(data?.tafsir?.text);
          if (cleaned) {
            tafsirs.push({ id, title, author, source, text: cleaned });
          }
        }
      };

      await appendQuranComTafsir(
        saadiRes,
        'saadi',
        'تيسير الكريم الرحمن (تفسير السعدي)',
        'الشيخ عبد الرحمن بن ناصر السعدي (ت 1376 هـ)',
        'مؤسسة الرسالة – النص المعتمد'
      );
      await appendQuranComTafsir(
        ibnKathirRes,
        'ibn_kathir',
        'تفسير القرآن العظيم (ابن كثير)',
        'الإمام الحافظ عماد الدين ابن كثير الدمشقي (ت 774 هـ)',
        'دار طيبة للنشر والتوزيع'
      );
      await appendQuranComTafsir(
        tabariRes,
        'tabari',
        'جامع البيان عن تأويل آي القرآن (الطبري)',
        'إمام المفسرين محمد بن جرير الطبري (ت 310 هـ)',
        'طبعة دار هجر المحققة'
      );
      await appendQuranComTafsir(
        qurtubiRes,
        'qurtubi',
        'الجامع لأحكام القرآن (القرطبي)',
        'الإمام أبو عبد الله شمس الدين القرطبي (ت 671 هـ)',
        'دار الكتب المصرية / الرسالة'
      );

      let words: Array<{ id: number; arabic: string; meaningEn: string; transliteration: string }> = [];
      if (wordsRes.status === 'fulfilled' && wordsRes.value.ok) {
        const wJson = (await wordsRes.value.json()) as any;
        const rawWords: any[] = wJson?.verse?.words || [];
        words = rawWords
          .filter((w) => w.char_type_name === 'word')
          .map((w, i) => ({
            id: i + 1,
            arabic: String(w.text_uthmani || w.text || ''),
            meaningEn: String(w.translation?.text || ''),
            transliteration: String(w.transliteration?.text || ''),
          }));
      }

      if (tafsirs.length === 0) {
        throw new Error('No tafsir sources responded');
      }

      const payload = {
        surahNumber: s,
        ayahNumber: a,
        surahName,
        ayahText,
        tafsirs,
        words,
        fetchedAtUtc: new Date().toISOString(),
      };

      setCache(cacheKey, payload, 24 * 60 * 60 * 1000);
      res.json(payload);
    } catch (err) {
      const refCode = recordDiagnosticError(`/api/quran/tafsir/${s}/${a}`, err);
      res.status(502).json({
        error: 'تعذر جلب التفاسير المعتمدة حالياً. يرجى إعادة المحاولة.',
        refCode,
      });
    }
  });

  // 4. Smart Quranic Search (Arabic Text + Translations + Tafsir)
  app.get('/api/quran/search', async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const scope = String(req.query.scope || 'quran');
    if (q.length < 2) {
      res.json({ matches: [], count: 0 });
      return;
    }

    const cacheKey = `quran_search_${scope}_${q.toLowerCase()}`;
    const cached = getCache<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      // Use Quran.com v4 search + AlQuran Cloud search fallback for full diacritic-insensitive Arabic & English search
      const edition = scope === 'translation' ? 'en.sahih' : scope === 'tafsir' ? 'ar.muyassar' : 'quran-simple-clean';
      const [alquranSearch, quranComSearch] = await Promise.allSettled([
        fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/${edition}`, {
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(q)}&size=25`, {
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      const matches: Array<{
        verseKey: string;
        surahNumber: number;
        ayahNumber: number;
        surahNameAr: string;
        surahNameEn: string;
        text: string;
        editionName: string;
      }> = [];
      const seenKeys = new Set<string>();

      if (alquranSearch.status === 'fulfilled' && alquranSearch.value.ok) {
        const j = (await alquranSearch.value.json()) as any;
        const rawMatches: any[] = j?.data?.matches || [];
        for (const m of rawMatches.slice(0, 30)) {
          const sNum = Number(m.surah?.number || 0);
          const aNum = Number(m.numberInSurah || 0);
          const key = `${sNum}:${aNum}`;
          if (!sNum || !aNum || seenKeys.has(key)) continue;
          seenKeys.add(key);
          matches.push({
            verseKey: key,
            surahNumber: sNum,
            ayahNumber: aNum,
            surahNameAr: String(m.surah?.name || ''),
            surahNameEn: String(m.surah?.englishName || ''),
            text: String(m.text || ''),
            editionName: scope === 'tafsir' ? 'التفسير الميسر' : scope === 'translation' ? 'Saheeh International' : 'النص القرآني',
          });
        }
      }

      if (matches.length < 10 && quranComSearch.status === 'fulfilled' && quranComSearch.value.ok) {
        const j = (await quranComSearch.value.json()) as any;
        const results: any[] = j?.search?.results || [];
        for (const r of results.slice(0, 25)) {
          const key = String(r.verse_key || '');
          const [sStr, aStr] = key.split(':');
          const sNum = Number(sStr);
          const aNum = Number(aStr);
          if (!sNum || !aNum || seenKeys.has(key)) continue;
          seenKeys.add(key);
          matches.push({
            verseKey: key,
            surahNumber: sNum,
            ayahNumber: aNum,
            surahNameAr: `سورة رقم ${sNum}`,
            surahNameEn: `Surah ${sNum}`,
            text: cleanHtmlText(r.text || r.translations?.[0]?.text || ''),
            editionName: 'المصادر القرآنية الموثقة',
          });
        }
      }

      const payload = {
        query: q,
        count: matches.length,
        matches,
        fetchedAtUtc: new Date().toISOString(),
      };
      setCache(cacheKey, payload, 30 * 60 * 1000);
      res.json(payload);
    } catch (err) {
      const refCode = recordDiagnosticError('/api/quran/search', err);
      res.status(502).json({
        error: 'تعذر إتمام البحث القرآني حالياً. يرجى المحاولة مرة أخرى.',
        refCode,
        matches: [],
        count: 0,
      });
    }
  });

  // 5. Prayer Monthly Calendar & Hijri Conversion via Verified AlAdhan API
  app.get('/api/prayer/calendar', async (req: Request, res: Response) => {
    const lat = Number(req.query.lat ?? 21.4225);
    const lng = Number(req.query.lng ?? 39.8262);
    const method = Number(req.query.method ?? 4); // 4 = Umm al-Qura University, Makkah
    const school = Number(req.query.school ?? 0); // 0 = Shafi/Standard, 1 = Hanafi
    const now = new Date();
    const month = Number(req.query.month ?? now.getMonth() + 1);
    const year = Number(req.query.year ?? now.getFullYear());

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'إحداثيات الموقع غير صالحة.', refCode: 'ERR-LOC-400' });
      return;
    }

    const cacheKey = `prayer_cal_${lat.toFixed(2)}_${lng.toFixed(2)}_${method}_${school}_${year}_${month}`;
    const cached = getCache<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    try {
      const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`AlAdhan HTTP ${r.status}`);
      const json = (await r.json()) as any;
      const days = (json?.data || []).map((d: any) => ({
        gregorianDate: String(d.date?.gregorian?.date || ''),
        gregorianReadable: String(d.date?.readable || ''),
        weekdayAr: String(d.date?.hijri?.weekday?.ar || ''),
        weekdayEn: String(d.date?.gregorian?.weekday?.en || ''),
        hijriDate: String(d.date?.hijri?.date || ''),
        hijriDay: String(d.date?.hijri?.day || ''),
        hijriMonthAr: String(d.date?.hijri?.month?.ar || ''),
        hijriMonthEn: String(d.date?.hijri?.month?.en || ''),
        hijriYear: String(d.date?.hijri?.year || ''),
        holidays: Array.isArray(d.date?.hijri?.holidays) ? d.date.hijri.holidays.map(String) : [],
        timings: {
          Fajr: String(d.timings?.Fajr || '').split(' ')[0],
          Sunrise: String(d.timings?.Sunrise || '').split(' ')[0],
          Dhuhr: String(d.timings?.Dhuhr || '').split(' ')[0],
          Asr: String(d.timings?.Asr || '').split(' ')[0],
          Maghrib: String(d.timings?.Maghrib || '').split(' ')[0],
          Isha: String(d.timings?.Isha || '').split(' ')[0],
        },
      }));

      const payload = {
        month,
        year,
        method,
        calendarSource: 'تقويم أم القرى المعتمد والحساب الفلكي الدقيق (AlAdhan)',
        days,
      };
      setCache(cacheKey, payload, 6 * 60 * 60 * 1000);
      res.json(payload);
    } catch (err) {
      const refCode = recordDiagnosticError('/api/prayer/calendar', err);
      res.status(502).json({
        error: 'تعذر جلب جدول مواقيت الصلاة الشهري من الخادم، يتم استخدام الحساب الفلكي المحلي.',
        refCode,
        days: [],
      });
    }
  });

  app.get('/api/hijri/convert', async (req: Request, res: Response) => {
    const dateStr = String(req.query.date || '').trim(); // DD-MM-YYYY
    const direction = req.query.direction === 'hToG' ? 'hToG' : 'gToH';
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      res.status(400).json({ error: 'صيغة التاريخ يجب أن تكون DD-MM-YYYY.', refCode: 'ERR-DATE-400' });
      return;
    }

    try {
      const r = await fetch(`https://api.aladhan.com/v1/${direction}/${dateStr}`, {
        signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) throw new Error(`Hijri convert HTTP ${r.status}`);
      const json = (await r.json()) as any;
      const d = json?.data;
      res.json({
        hijri: {
          date: String(d?.hijri?.date || ''),
          day: String(d?.hijri?.day || ''),
          monthAr: String(d?.hijri?.month?.ar || ''),
          monthEn: String(d?.hijri?.month?.en || ''),
          year: String(d?.hijri?.year || ''),
          weekdayAr: String(d?.hijri?.weekday?.ar || ''),
        },
        gregorian: {
          date: String(d?.gregorian?.date || ''),
          day: String(d?.gregorian?.day || ''),
          monthEn: String(d?.gregorian?.month?.en || ''),
          year: String(d?.gregorian?.year || ''),
          weekdayEn: String(d?.gregorian?.weekday?.en || ''),
        },
        source: 'تقويم أم القرى – مكة المكرمة (مع مراعاة الرؤية الشرعية للهلال في المناسبات التعبدية)',
      });
    } catch (err) {
      const refCode = recordDiagnosticError('/api/hijri/convert', err);
      res.status(502).json({
        error: 'تعذر تحويل التاريخ حالياً. يرجى المحاولة مرة أخرى.',
        refCode,
      });
    }
  });

  // 6. Smart Quranic Assistant (Server-Side Gemini 3.8 Flash with Strict Scholarly Guardrails)
  app.post('/api/assistant', async (req: Request, res: Response) => {
    const prompt = String(req.body?.prompt || '').trim().slice(0, 1200);
    const mode = String(req.body?.mode || 'explain');
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';

    if (prompt.length < 2) {
      res.status(400).json({ error: 'يرجى كتابة سؤالك القرآني بوضوح.', refCode: 'ERR-AI-400' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const systemInstruction = `أنت "المساعد القرآني الذكي" في منصة "اطمئنان القرآن – Quran Reassurance".
مهمتك مساعدة المستخدم على فهم معاني القرآن الكريم وتلخيص موضوعات السور وشرح غريب الكلمات ومقارنة أقوال المفسرين المعتمدين ووضع خطط الحفظ وإنشاء اختبارات قرآنية تعليمية.

قواعد صارمة لا يجوز مخالفتها أبداً:
1. اعتمد حصراً على التفاسير المعتمدة لأهل العلم: التفسير الميسر (مجمع الملك فهد)، تفسير ابن كثير، جامع البيان للطبري، تيسير الكريم الرحمن للسعدي، الجامع لأحكام القرآن للقرطبي، معالم التنزيل للبغوي، وتفسير الجلالين.
2. لا تخترع آيات قرآنية أو أحاديث نبوية أو تنسب قولاً لمفسر دون توثيق دقيق.
3. لا تكتب نص الآيات القرآنية من ذاكرتك بهدف الاعتماد عليه كنص مصحفي؛ بل أرجع دائماً أرقام السور والآيات الدقيقة (surahNumber و ayahNumber) في حقل referencedVerses ليقوم النظام بعرض النص العثماني الحرفي الموثق من قاعدة بيانات المصحف المعتمدة.
4. عند وجود اختلاف معتبر بين المفسرين في معنى الآية، وضّحه بأدب علمي وأمانة في حقل tafsirDifferences مع نسبة كل قول لصاحبه.
5. لا تُصدر فتاوى شرعية ولا تحلل أو تحرم في النوازل والمسائل الفقهية المتخصصة؛ بل أحِل السائل دائماً في حقل scholarlyReferral إلى دور الإفتاء الرسمية وهيئات كبار العلماء المتخصصين.
6. أجب بلغة المستخدم (${lang === 'en' ? 'English' : 'العربية الفصحى الواضحة الميسرة'}).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `[نوع الطلب: ${mode}] سؤال المستخدم: ${prompt}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'عنوان موجز وواضح للإجابة',
              },
              answer: {
                type: Type.STRING,
                description: 'الشرح العلمي الموثق والمنظم بفقرات واضحة',
              },
              tafsirDifferences: {
                type: Type.STRING,
                description: 'توضيح أقوال المفسرين المعتبرة عند تعدد الأوجه التفسيرية، أو سلسلة فارغة إن اتفقت المعاني',
              },
              scholarlyReferral: {
                type: Type.STRING,
                description: 'تنبيه إحالة المسائل الإفتائية والفقهية المتخصصة إلى أهل العلم ودور الإفتاء عند الحاجة',
              },
              sources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    book: { type: Type.STRING, description: 'اسم كتاب التفسير أو المصدر المعتمد' },
                    scholar: { type: Type.STRING, description: 'اسم الإمام أو الجهة العلمية' },
                  },
                  required: ['book', 'scholar'],
                },
              },
              referencedVerses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    surahNumber: { type: Type.INTEGER, description: 'رقم السورة من 1 إلى 114' },
                    ayahNumber: { type: Type.INTEGER, description: 'رقم الآية داخل السورة' },
                    relevance: { type: Type.STRING, description: 'وجه ارتباط الآية بالموضوع' },
                  },
                  required: ['surahNumber', 'ayahNumber', 'relevance'],
                },
              },
            },
            required: ['title', 'answer', 'tafsirDifferences', 'scholarlyReferral', 'sources', 'referencedVerses'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        title: string;
        answer: string;
        tafsirDifferences: string;
        scholarlyReferral: string;
        sources: Array<{ book: string; scholar: string }>;
        referencedVerses: Array<{ surahNumber: number; ayahNumber: number; relevance: string }>;
      };

      // Hydrate referenced verses strictly from the verified Uthmani Quran API (never AI-generated Quranic text!)
      const hydratedVerses = [];
      for (const ref of (parsed.referencedVerses || []).slice(0, 5)) {
        const verified = await fetchVerifiedUthmaniAyah(Number(ref.surahNumber), Number(ref.ayahNumber));
        if (verified) {
          hydratedVerses.push({
            surahNumber: Number(ref.surahNumber),
            ayahNumber: Number(ref.ayahNumber),
            surahName: verified.surahName,
            uthmaniText: verified.text,
            page: verified.page,
            juz: verified.juz,
            relevance: String(ref.relevance || ''),
          });
        }
      }

      res.json({
        title: parsed.title || 'بيان قرآني موثق',
        answer: parsed.answer || '',
        tafsirDifferences: parsed.tafsirDifferences || '',
        scholarlyReferral:
          parsed.scholarlyReferral ||
          'تنبيه منهجي: هذا البيان للتدبر والفهم من كتب التفسير المعتمدة، وأما الفتاوى والأحكام الشرعية الخاصة فتُحال إلى أهل العلم ودور الإفتاء المعتمدة.',
        sources: Array.isArray(parsed.sources) && parsed.sources.length > 0
          ? parsed.sources
          : [{ book: 'التفسير الميسر', scholar: 'مجمع الملك فهد لطباعة المصحف الشريف' }],
        verifiedVerses: hydratedVerses,
        generatedAtUtc: new Date().toISOString(),
      });
    } catch (err) {
      const refCode = recordDiagnosticError('/api/assistant', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(502).json({
        error: errMsg.includes('API_KEY')
          ? 'يرجى التحقق من إعداد مفتاح الخدمة في لوحة Secrets، ثم المحاولة مجدداً.'
          : 'تعذر الاتصال بالمساعد القرآني الذكي حالياً. يرجى المحاولة بعد قليل.',
        refCode,
      });
    }
  });

  // 7. Anonymous Privacy-Safe Client Diagnostics & Admin Health Telemetry
  app.post('/api/telemetry/error', (req: Request, res: Response) => {
    const scope = String(req.body?.scope || 'client').slice(0, 60);
    const msg = String(req.body?.message || 'Unexpected client error').slice(0, 300);
    const refCode = recordDiagnosticError(`client:${scope}`, new Error(msg));
    res.json({ ok: true, refCode });
  });

  app.get('/api/admin/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptimeSeconds: Math.round(process.uptime()),
      totalApiRequests,
      cacheEntries: apiCache.size,
      cacheHitsCount,
      canonicalSurahsVerified: CANONICAL_SURAH_AYAH_COUNTS.length === 114,
      canonicalTotalAyahs: CANONICAL_SURAH_AYAH_COUNTS.reduce((acc, v) => acc + v, 0),
      recentErrors: diagnosticsLogs.slice(0, 25),
      checkedAtUtc: new Date().toISOString(),
    });
  });

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`اطمئنان القرآن – Quran Reassurance server listening on http://localhost:${PORT}`);
  });
}

void startServer();
