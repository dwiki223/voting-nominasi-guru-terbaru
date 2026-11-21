# Security Specification: Nominasi Guru Firestore Rules

## 1. Data Invariants
1. **Owner-Only PII Isolation (`/users/{userId}`)**:
   - Every `UserProfile` document contains `email` and `displayName` and is readable/writable strictly by the authenticated, email-verified owner (`request.auth.uid == userId`) or bootstrapped admin (`dwiki223@guru.smp.belajar.id` with `email_verified == true`).
   - Collection-level `list` on `/users` is denied (`allow list: if false;`) to prevent user directory scraping.
   - Self-assigned privilege escalation is blocked: standard users may only create profiles with `role == 'member'` and cannot alter `role` on update.
2. **Master Gate for Subcollections (`/users/{userId}/driveLinks/{linkId}` & `/users/{userId}/recapSnapshots/{snapshotId}`)**:
   - Subcollection writes require the parent `/users/{userId}` document to exist (`exists(...)`), `request.auth.uid == userId`, `request.auth.token.email_verified == true`, and `data.ownerId == request.auth.uid`.
   - Subcollection `list` queries enforce `resource.data.ownerId == request.auth.uid` directly in the rule (no `get()`/`exists()` in `allow list`, zero client delegation).
3. **Temporal & Structural Integrity**:
   - All `create` operations require `createdAt == request.time`, exact `hasAll` and `hasOnly` field sets, bounded string lengths matching `firebase-blueprint.json`, and valid document IDs (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
   - All `update` operations validate `isValid[Entity](incoming())` first, enforce immutable `ownerId` and `createdAt`, require `updatedAt == request.time`, and restrict mutations via `affectedKeys().hasOnly([...])`.

## 2. "Dirty Dozen" Attack Payloads (All Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Write**: Creating `/users/u1` with `request.auth == null`.
2. **Unverified Email Spoof**: Creating `/users/u1` with `email: "dwiki223@guru.smp.belajar.id"` and `email_verified: false`.
3. **Role Self-Escalation on Create**: Creating `/users/u2` as a non-admin with `role: "admin"`.
4. **Role Escalation on Update**: Updating `/users/u2` with `{ role: "admin" }`.
5. **Cross-Tenant Subcollection Read/Write**: Authenticated user `u2` attempting to read or write `/users/u1/driveLinks/link1`.
6. **OwnerId Spoofing**: Creating `/users/u1/driveLinks/link1` as `u1` with payload `ownerId: "u2"`.
7. **Shadow / Ghost Field Injection**: Creating `/users/u1/driveLinks/link1` with an extra undeclared field `isApproved: true`.
8. **Client-Forged Timestamp**: Creating `/users/u1/recapSnapshots/snap1` with `createdAt: "2020-01-01T00:00:00Z"` instead of server `request.time`.
9. **Immutable Field Tampering**: Updating `/users/u1/driveLinks/link1` and altering `createdAt` or `ownerId`.
10. **Denial-of-Wallet Oversized String / ID**: Creating `/users/u1/driveLinks/<1500-char-id>` or `fileName` exceeding `160` characters.
11. **Directory Enumeration (`list` on `/users`)**: Listing `/users` as any signed-in user.
12. **Cross-User Snapshot Deletion / Update**: Non-owner attempting to update or delete `/users/u1/recapSnapshots/snap1` (immutable audit snapshot — updates blocked).
