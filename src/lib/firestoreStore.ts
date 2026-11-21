import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { RecapSummary } from '../shared/constants';
import {
  buildValidatedDriveLinkInput,
  buildValidatedRecapSnapshotInput,
  buildValidatedUserProfileInput,
  isValidBlueprintId,
} from '../shared/blueprintValidation';
import { db, handleFirestoreError, OperationType } from './firebase';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'dwiki223@guru.smp.belajar.id';

export interface FirestoreDriveLinkRecord {
  id: string;
  ownerId: string;
  driveFileId: string;
  fileName: string;
  webViewLink: string;
  lastTotalVoters: number;
  lastTotalSelections: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface FirestoreRecapSnapshotRecord {
  id: string;
  ownerId: string;
  title: string;
  totalVoters: number;
  totalSelections: number;
  activeClassesCount: number;
  topTeacherName: string;
  topTeacherVotes: number;
  driveFileName: string;
  createdAtMs: number;
}

function timestampToMs(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  return Date.now();
}

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user.emailVerified) return;
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  const expectedRole: 'member' | 'admin' =
    user.email === BOOTSTRAPPED_ADMIN_EMAIL && user.emailVerified ? 'admin' : 'member';

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const profilePayload = buildValidatedUserProfileInput({
    uid: user.uid,
    email: user.email || 'user@example.com',
    displayName: user.displayName || user.email || 'Pengguna Google',
    role: expectedRole,
  });

  if (!existingSnap.exists()) {
    try {
      await setDoc(userRef, {
        ...profilePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
    return;
  }

  try {
    const existingData = existingSnap.data();
    const updatePayload: Record<string, unknown> = {
      displayName: profilePayload.displayName,
      email: profilePayload.email,
      updatedAt: serverTimestamp(),
    };
    if (expectedRole === 'admin' && existingData?.role !== 'admin') {
      updatePayload.role = 'admin';
    }
    await updateDoc(userRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function saveDriveLinkToFirestore(
  user: User,
  input: {
    driveFileId: string;
    fileName: string;
    webViewLink: string;
    totalVoters: number;
    totalSelections: number;
  }
): Promise<void> {
  await ensureUserProfile(user);

  const linkId = input.driveFileId.slice(0, 128);
  if (!isValidBlueprintId(linkId)) {
    throw new Error('ID file Google Drive tidak valid.');
  }

  const path = `users/${user.uid}/driveLinks/${linkId}`;
  const linkRef = doc(db, 'users', user.uid, 'driveLinks', linkId);

  const validated = buildValidatedDriveLinkInput({
    ownerId: user.uid,
    driveFileId: input.driveFileId,
    fileName: input.fileName,
    webViewLink: input.webViewLink,
    lastTotalVoters: input.totalVoters,
    lastTotalSelections: input.totalSelections,
  });

  let existingSnap;
  try {
    existingSnap = await getDoc(linkRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(linkRef, {
        ...validated,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return;
  }

  try {
    await updateDoc(linkRef, {
      driveFileId: validated.driveFileId,
      fileName: validated.fileName,
      webViewLink: validated.webViewLink,
      lastTotalVoters: validated.lastTotalVoters,
      lastTotalSelections: validated.lastTotalSelections,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveRecapSnapshotToFirestore(
  user: User,
  recap: RecapSummary,
  driveFileName: string
): Promise<void> {
  await ensureUserProfile(user);

  const snapshotId = `snap_${Date.now()}`;
  const path = `users/${user.uid}/recapSnapshots/${snapshotId}`;
  const snapRef = doc(db, 'users', user.uid, 'recapSnapshots', snapshotId);

  const validated = buildValidatedRecapSnapshotInput({
    ownerId: user.uid,
    title: `Rekap ${recap.totalVoters} Pemilih (${recap.totalSelections} Suara)`,
    totalVoters: recap.totalVoters,
    totalSelections: recap.totalSelections,
    activeClassesCount: recap.activeClassesCount,
    topTeacherName: recap.topTeacher?.teacher.name ?? '',
    topTeacherVotes: recap.topTeacher?.totalVotes ?? 0,
    driveFileName,
  });

  try {
    await setDoc(snapRef, {
      ...validated,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeDriveLinks(
  userId: string,
  onData: (links: FirestoreDriveLinkRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colPath = `users/${userId}/driveLinks`;
  const q = query(collection(db, 'users', userId, 'driveLinks'), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FirestoreDriveLinkRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId ?? ''),
          driveFileId: String(data.driveFileId ?? ''),
          fileName: String(data.fileName ?? ''),
          webViewLink: String(data.webViewLink ?? ''),
          lastTotalVoters: Number(data.lastTotalVoters ?? 0),
          lastTotalSelections: Number(data.lastTotalSelections ?? 0),
          createdAtMs: timestampToMs(data.createdAt),
          updatedAtMs: timestampToMs(data.updatedAt),
        };
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeRecapSnapshots(
  userId: string,
  onData: (snapshots: FirestoreRecapSnapshotRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const colPath = `users/${userId}/recapSnapshots`;
  const q = query(
    collection(db, 'users', userId, 'recapSnapshots'),
    where('ownerId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FirestoreRecapSnapshotRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId ?? ''),
          title: String(data.title ?? ''),
          totalVoters: Number(data.totalVoters ?? 0),
          totalSelections: Number(data.totalSelections ?? 0),
          activeClassesCount: Number(data.activeClassesCount ?? 0),
          topTeacherName: String(data.topTeacherName ?? ''),
          topTeacherVotes: Number(data.topTeacherVotes ?? 0),
          driveFileName: String(data.driveFileName ?? ''),
          createdAtMs: timestampToMs(data.createdAt),
        };
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list.slice(0, 10));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}
