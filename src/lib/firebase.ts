import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType } from '../types/quran';
import type {
  BookmarkRecord,
  FirestoreErrorInfo,
  HifzPlanRecord,
  KhatmahPlanRecord,
  Language,
  UserPublicProfile,
} from '../types/quran';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const SUPER_ADMIN_EMAIL = 'hxbdhdhdhhl@gmail.com';

// Mandatory Boot Connection Probe
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

// Mandatory Structured Error Handler (Conforms strictly to FirestoreErrorInfo)
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Defensive Sanitization Helpers Matching firebase-blueprint.json Verbatim
export function sanitizeDocId(raw: string): string {
  const cleaned = (raw || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'doc_item';
}

export function clampStr(raw: string, maxLen: number, fallback = ''): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureQuranUserProfile(cred.user);
  return cred.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export async function ensureQuranUserProfile(
  user: User,
  defaultLang: Language = 'ar'
): Promise<UserPublicProfile> {
  const uid = sanitizeDocId(user.uid);
  const publicPath = `users_public/${uid}`;
  const privatePath = `users_private/${uid}`;

  try {
    const existingSnap = await getDoc(doc(db, 'users_public', uid));
    if (existingSnap.exists()) {
      const d = existingSnap.data();
      return {
        uid,
        displayName: String(d.displayName || user.displayName || 'قارئ القرآن'),
        photoURL: String(d.photoURL || user.photoURL || ''),
        bio: String(d.bio || ''),
        preferredLang: d.preferredLang === 'en' ? 'en' : 'ar',
        preferredReciter: String(d.preferredReciter || 'ar.alafasy'),
        lastSurah: Number(d.lastSurah || 1),
        lastAyah: Number(d.lastAyah || 1),
        lastPage: Number(d.lastPage || 1),
        visibility: d.visibility === 'private' ? 'private' : 'public',
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }

  const publicPayload = {
    uid,
    displayName: clampStr(user.displayName || user.email?.split('@')[0] || 'قارئ القرآن', 80, 'قارئ القرآن'),
    photoURL: clampStr(user.photoURL || '', 600, ''),
    bio: '',
    preferredLang: defaultLang,
    preferredReciter: 'ar.alafasy',
    lastSurah: 1,
    lastAyah: 1,
    lastPage: 1,
    visibility: 'public' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users_public', uid), publicPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, publicPath);
  }

  if (user.email) {
    try {
      const privSnap = await getDoc(doc(db, 'users_private', uid));
      if (!privSnap.exists()) {
        await setDoc(doc(db, 'users_private', uid), {
          uid,
          email: clampStr(user.email, 160, 'user@example.com'),
          prayerAlerts: true,
          adhkarAlerts: true,
          wirdReminderTime: '20:00',
          quietHours: '23:00-04:30',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  }

  return {
    uid,
    displayName: publicPayload.displayName,
    photoURL: publicPayload.photoURL,
    bio: '',
    preferredLang: defaultLang,
    preferredReciter: 'ar.alafasy',
    lastSurah: 1,
    lastAyah: 1,
    lastPage: 1,
    visibility: 'public',
  };
}

export async function syncReadingPositionToCloud(
  uid: string,
  surahNumber: number,
  ayahNumber: number,
  pageNumber: number
): Promise<void> {
  if (!auth.currentUser?.emailVerified) return;
  const safeUid = sanitizeDocId(uid);
  const path = `users_public/${safeUid}`;
  try {
    await updateDoc(doc(db, 'users_public', safeUid), {
      lastSurah: Math.max(1, Math.min(114, Math.round(surahNumber))),
      lastAyah: Math.max(1, Math.min(286, Math.round(ayahNumber))),
      lastPage: Math.max(1, Math.min(604, Math.round(pageNumber))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertCloudBookmark(
  uid: string,
  item: Omit<BookmarkRecord, 'id' | 'userId' | 'updatedAtIso'>
): Promise<string> {
  const safeUid = sanitizeDocId(uid);
  const docId = sanitizeDocId(`bm_${safeUid}_${item.surahNumber}_${item.ayahNumber}`);
  const path = `bookmarks/${docId}`;
  try {
    const existingSnap = await getDoc(doc(db, 'bookmarks', docId));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'bookmarks', docId), {
        userId: safeUid,
        surahNumber: Math.max(1, Math.min(114, item.surahNumber)),
        ayahNumber: Math.max(1, Math.min(286, item.ayahNumber)),
        pageNumber: Math.max(1, Math.min(604, item.pageNumber || 1)),
        surahName: clampStr(item.surahName, 80, 'سورة'),
        verseExcerpt: clampStr(item.verseExcerpt, 1200, 'آية كريمة'),
        collectionTag: clampStr(item.collectionTag, 60, 'المفضلة'),
        note: clampStr(item.note, 2000, ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'bookmarks', docId), {
        collectionTag: clampStr(item.collectionTag, 60, 'المفضلة'),
        note: clampStr(item.note, 2000, ''),
        updatedAt: serverTimestamp(),
      });
    }
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeCloudBookmark(docId: string): Promise<void> {
  const safeId = sanitizeDocId(docId);
  const path = `bookmarks/${safeId}`;
  try {
    await deleteDoc(doc(db, 'bookmarks', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCloudHifzPlan(uid: string, plan: HifzPlanRecord): Promise<void> {
  const safeUid = sanitizeDocId(uid);
  const safeId = sanitizeDocId(plan.id);
  const path = `hifz_plans/${safeId}`;
  try {
    const snap = await getDoc(doc(db, 'hifz_plans', safeId));
    if (!snap.exists()) {
      await setDoc(doc(db, 'hifz_plans', safeId), {
        userId: safeUid,
        title: clampStr(plan.title, 120, 'خطة حفظ القرآن'),
        targetScope: clampStr(plan.targetScope, 120, 'جزء عم'),
        dailyAyahs: Math.max(1, Math.min(300, plan.dailyAyahs)),
        durationDays: Math.max(1, Math.min(3650, plan.durationDays)),
        memorizedAyahsCount: Math.max(0, Math.min(6236, plan.memorizedAyahsCount)),
        totalTargetAyahs: Math.max(1, Math.min(6236, plan.totalTargetAyahs)),
        currentSurah: Math.max(1, Math.min(114, plan.currentSurah)),
        currentAyah: Math.max(1, Math.min(286, plan.currentAyah)),
        reminderTime: clampStr(plan.reminderTime, 16, '06:00'),
        status: plan.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'hifz_plans', safeId), {
        title: clampStr(plan.title, 120, 'خطة حفظ القرآن'),
        dailyAyahs: Math.max(1, Math.min(300, plan.dailyAyahs)),
        durationDays: Math.max(1, Math.min(3650, plan.durationDays)),
        memorizedAyahsCount: Math.max(0, Math.min(6236, plan.memorizedAyahsCount)),
        currentSurah: Math.max(1, Math.min(114, plan.currentSurah)),
        currentAyah: Math.max(1, Math.min(286, plan.currentAyah)),
        reminderTime: clampStr(plan.reminderTime, 16, '06:00'),
        status: plan.status,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCloudKhatmahPlan(uid: string, plan: KhatmahPlanRecord): Promise<void> {
  const safeUid = sanitizeDocId(uid);
  const safeId = sanitizeDocId(plan.id);
  const path = `khatmah_plans/${safeId}`;
  try {
    const snap = await getDoc(doc(db, 'khatmah_plans', safeId));
    if (!snap.exists()) {
      await setDoc(doc(db, 'khatmah_plans', safeId), {
        userId: safeUid,
        title: clampStr(plan.title, 120, 'ختمة القرآن الكريم'),
        durationDays: Math.max(1, Math.min(1000, plan.durationDays)),
        dailyPages: Math.max(1, Math.min(604, plan.dailyPages)),
        completedPages: Math.max(0, Math.min(604, plan.completedPages)),
        currentJuz: Math.max(1, Math.min(30, plan.currentJuz)),
        reminderTime: clampStr(plan.reminderTime, 16, '20:00'),
        shareConsent: Boolean(plan.shareConsent),
        status: plan.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'khatmah_plans', safeId), {
        completedPages: Math.max(0, Math.min(604, plan.completedPages)),
        currentJuz: Math.max(1, Math.min(30, plan.currentJuz)),
        reminderTime: clampStr(plan.reminderTime, 16, '20:00'),
        shareConsent: Boolean(plan.shareConsent),
        status: plan.status,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordAdminAudit(
  actorId: string,
  actionType: string,
  targetCollection: string,
  targetId: string,
  summary: string
): Promise<void> {
  const logId = sanitizeDocId(`audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const path = `admin_audit_logs/${logId}`;
  try {
    await setDoc(doc(db, 'admin_audit_logs', logId), {
      actorId: sanitizeDocId(actorId),
      actionType: clampStr(actionType, 60, 'admin_action'),
      targetCollection: clampStr(targetCollection, 60, 'system'),
      targetId: sanitizeDocId(targetId),
      summary: clampStr(summary, 400, 'تحديث إداري'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
};
