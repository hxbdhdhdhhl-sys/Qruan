/**
 * Adversarial "Dirty Dozen" Security Rules Specification Test Suite
 * Verifies all 12 attack vectors documented in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenVector {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_VECTORS: DirtyDozenVector[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on bookmarks',
    collectionPath: '/bookmarks/bm_valid_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      surahNumber: 2,
      ayahNumber: 255,
      pageNumber: 42,
      surahName: 'البقرة',
      verseExcerpt: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
      collectionTag: 'آية الكرسي',
      note: 'تأمل',
      isOfficialTafsir: true, // Ghost field
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof on staff_roles',
    collectionPath: '/staff_roles/user_2',
    operation: 'create',
    auth: { uid: 'spoof_admin', email: 'hxbdhdhdhhl@gmail.com', email_verified: false },
    payload: {
      uid: 'user_2',
      role: 'admin',
      assignedBy: 'spoof_admin',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read on users_private',
    collectionPath: '/users_private/victim_uid',
    operation: 'get',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Ownership Spoofing on hifz_plans',
    collectionPath: '/hifz_plans/plan_1',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      userId: 'victim_uid',
      title: 'خطة جزء عم',
      targetScope: 'جزء عم',
      dailyAyahs: 10,
      durationDays: 30,
      memorizedAyahsCount: 0,
      totalTargetAyahs: 564,
      currentSurah: 78,
      currentAyah: 1,
      reminderTime: '06:00',
      status: 'active',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning via Invalid Characters',
    collectionPath: '/bookmarks/bad$id!@#',
    operation: 'get',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Denial-of-Wallet Oversized Note String',
    collectionPath: '/bookmarks/bm_valid_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      note: 'أ'.repeat(5000), // Exceeds 2000 maxLength
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Timestamp Forgery on khatmah_plans',
    collectionPath: '/khatmah_plans/kh_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      title: 'ختمة رمضان',
      durationDays: 30,
      dailyPages: 20,
      completedPages: 0,
      currentJuz: 1,
      reminderTime: '20:00',
      shareConsent: false,
      status: 'active',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable Field Mutation on community_posts',
    collectionPath: '/community_posts/post_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      groupId: 'hijacked_group',
      body: 'تعديل النص',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Blanket Unfiltered List Scraping on bookmarks',
    collectionPath: '/bookmarks',
    operation: 'list',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned Community Post without Existing Group',
    collectionPath: '/community_posts/post_orphan',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      groupId: 'non_existent_group',
      authorId: 'user_1',
      authorName: 'قارئ',
      postType: 'reflection',
      surahNumber: 1,
      ayahNumber: 1,
      juzNumber: 1,
      body: 'الحمد لله رب العالمين',
      status: 'published',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Self-Privilege Escalation on staff_roles',
    collectionPath: '/staff_roles/user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      role: 'admin',
      assignedBy: 'user_1',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Terminal State Re-opening on content_reports',
    collectionPath: '/content_reports/rep_resolved_1',
    operation: 'update',
    auth: { uid: 'moderator_1', email: 'mod@example.com', email_verified: true },
    payload: {
      status: 'open', // Terminal 'resolved' state cannot be reopened by non-admin
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
