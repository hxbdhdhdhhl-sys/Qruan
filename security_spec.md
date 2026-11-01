# Security Specification — اطمئنان القرآن (Quran Reassurance)

## 1. Data Invariants & Relationship Mapping

1. **Sacred Quranic Text Integrity**: Canonical Quranic text (114 Surahs, 6,236 Ayahs) is NEVER stored as user-mutable documents in Firestore; it is served read-only from verified canonical Uthmani sources (`api.alquran.cloud` / King Fahd Complex edition) with client-side verse-count & checksum verification.
2. **PII Isolation (Split Collection)**: User public display profiles live in `/users_public/{userId}` with zero PII. Email addresses are strictly isolated in `/users_private/{userId}` and readable only by the verified owner (`request.auth.uid == userId`) or verified Super Admin (`hxbdhdhdhhl@gmail.com` with `email_verified == true`).
3. **Relational Parent Existence**: User-owned records (`bookmarks`, `hifz_plans`, `khatmah_plans`, `community_groups`, `community_posts`, `content_reports`) cannot be created unless `/users_public/{request.auth.uid}` exists. `community_posts` additionally require `/community_groups/{groupId}` to exist.
4. **Strict Ownership & Anti-Spoofing**: Every `userId`, `authorId`, `creatorId`, `reporterId`, and `actorId` must strictly equal `request.auth.uid` upon creation and remain immutable on all updates.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time` (serverTimestamp); client-forged timestamps are rejected.
6. **Terminal State Locking**: Once a `content_reports` document reaches `status == 'resolved'` or a `community_posts` document reaches `status == 'archived'`, non-admin updates are locked.
7. **Query Enforcer (Zero Blanket List)**: Every `allow list` rule evaluates `resource.data` directly (e.g., `existing().userId == request.auth.uid` or `existing().status == 'published'`) with zero `get()` or `exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection (`bookmarks`)**: Valid bookmark payload + `"isOfficialTafsir": true` -> Rejected by `data.keys().hasOnly(...)`.
2. **Unverified Admin Email Spoof (`staff_roles`)**: Token with `email == 'hxbdhdhdhhl@gmail.com'` and `email_verified == false` -> Rejected by `isVerifiedUser()`.
3. **Cross-User PII Read (`users_private`)**: Authenticated user `uid_attacker` calling `get` on `/users_private/uid_victim` -> Rejected by `request.auth.uid == userId || isSuperAdmin()`.
4. **Ownership Spoofing (`hifz_plans`)**: Creating a Hifz plan with `userId: "uid_victim"` while signed in as `uid_attacker` -> Rejected by `data.userId == request.auth.uid`.
5. **ID Poisoning / Oversized Path ID (`bookmarks`)**: Creating `/bookmarks/<200-char-junk-$@#>` -> Rejected by `isValidId(bookmarkId)`.
6. **Denial-of-Wallet 1MB String (`bookmarks.note`)**: Updating `note` with a 50,000-character string -> Rejected by `isValidBookmark(incoming())` (`data.note.size() <= 2000`).
7. **Timestamp Forgery (`khatmah_plans`)**: Creating a Khatmah plan with backdated `createdAt: Timestamp(2020-01-01)` -> Rejected by `incoming().createdAt == request.time`.
8. **Immutable Field Mutation (`community_posts`)**: Author attempting to mutate `createdAt` or `groupId` during an edit -> Rejected by `incoming().createdAt == existing().createdAt` and `affectedKeys().hasOnly(...)`.
9. **Blanket List Scraping (`bookmarks`)**: Client issuing unfiltered `getDocs(collection(db, 'bookmarks'))` -> Rejected by `existing().userId == request.auth.uid`.
10. **Orphaned Community Post (`community_posts`)**: Creating a post referencing a non-existent `groupId` -> Rejected by `exists(/databases/$(database)/documents/community_groups/$(incoming().groupId))`.
11. **Self-Privilege Escalation (`staff_roles`)**: Regular verified user attempting to create `/staff_roles/{theirUid}` with `role: 'admin'` -> Rejected by `isSuperAdmin()`.
12. **Terminal State Re-opening (`content_reports`)**: Reporter attempting to modify a report after `status == 'resolved'` -> Rejected by terminal lock & `allow update` restricted to moderators/admins.
