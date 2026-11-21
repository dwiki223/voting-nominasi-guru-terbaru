import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { RecapSummary } from '@/src/shared/constants';
import {
  buildRecapExcelBlob,
  DEFAULT_DRIVE_EXCEL_FILENAME,
} from '@/src/shared/excelExport';
import { testConnection } from '@/src/lib/firebase';
import {
  ensureUserProfile,
  saveDriveLinkToFirestore,
  saveRecapSnapshotToFirestore,
  subscribeDriveLinks,
  subscribeRecapSnapshots,
  type FirestoreDriveLinkRecord,
  type FirestoreRecapSnapshotRecord,
} from '@/src/lib/firestoreStore';
import {
  clearDriveAccessToken,
  createExcelFileInDrive,
  DriveAuthExpiredError,
  formatGoogleAuthError,
  initGoogleAuth,
  isSafeHttpsUrl,
  listAppExcelFiles,
  signInWithGoogle,
  signOutGoogle,
  updateExcelFileInDrive,
  type DriveExcelFile,
} from '@/src/lib/googleDrive';

export type DriveMutation =
  | { mode: 'create'; fileName: string }
  | { mode: 'update'; fileId: string; fileName: string };

interface GoogleFirebaseContextValue {
  user: User | null;
  accessToken: string | null;
  needsDriveAuth: boolean;
  isLoggingIn: boolean;
  firestoreStatus: 'checking' | 'connected' | 'offline';
  driveFiles: DriveExcelFile[];
  isLoadingFiles: boolean;
  activeFile: DriveExcelFile | null;
  setActiveFile: React.Dispatch<React.SetStateAction<DriveExcelFile | null>>;
  cloudLinks: FirestoreDriveLinkRecord[];
  cloudSnapshots: FirestoreRecapSnapshotRecord[];
  isSavingSnapshot: boolean;
  isSavingToDrive: boolean;
  lastSyncedUpdatedAt: string | null;
  setLastSyncedUpdatedAt: React.Dispatch<React.SetStateAction<string | null>>;
  statusMessage: string | null;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  errorMessage: string | null;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  loginWithGoogle: () => Promise<boolean>;
  logoutGoogle: () => Promise<void>;
  refreshDriveFiles: () => Promise<void>;
  saveSnapshotToCloud: (recap: RecapSummary) => Promise<void>;
  syncExcelToDrive: (recap: RecapSummary, mutation: DriveMutation) => Promise<boolean>;
}

const GoogleFirebaseContext = createContext<GoogleFirebaseContextValue | null>(null);

export const GoogleFirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsDriveAuth, setNeedsDriveAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  const [driveFiles, setDriveFiles] = useState<DriveExcelFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [activeFile, setActiveFile] = useState<DriveExcelFile | null>(null);

  const [cloudLinks, setCloudLinks] = useState<FirestoreDriveLinkRecord[]>([]);
  const [cloudSnapshots, setCloudSnapshots] = useState<FirestoreRecapSnapshotRecord[]>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [lastSyncedUpdatedAt, setLastSyncedUpdatedAt] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFiles = useCallback(async (token: string) => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const files = await listAppExcelFiles(token);
      setDriveFiles(files);
      setActiveFile((prev) => {
        if (prev && files.some((f) => f.id === prev.id)) {
          return files.find((f) => f.id === prev.id) ?? prev;
        }
        return files[0] ?? prev;
      });
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        setAccessToken(null);
        setNeedsDriveAuth(true);
      }
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memuat daftar file Excel dari Google Drive.'
      );
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    void testConnection().then((status) => {
      setFirestoreStatus(status);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
        setNeedsDriveAuth(false);
        void loadFiles(token);
      },
      (maybeUser) => {
        setUser(maybeUser);
        setAccessToken(null);
        setNeedsDriveAuth(true);
      }
    );
    return () => unsubscribe();
  }, [loadFiles]);

  // Attach real-time Firestore listeners only when auth is ready and user is email-verified
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setCloudLinks([]);
      setCloudSnapshots([]);
      return;
    }

    let unsubLinks: (() => void) | null = null;
    let unsubSnaps: (() => void) | null = null;
    let cancelled = false;

    const initFirestoreSubscriptions = async () => {
      try {
        await ensureUserProfile(user);
        if (cancelled) return;

        unsubLinks = subscribeDriveLinks(
          user.uid,
          (links) => {
            setCloudLinks(links);
            if (links[0]) {
              setActiveFile((prev) =>
                prev ?? {
                  id: links[0].driveFileId,
                  name: links[0].fileName,
                  webViewLink: links[0].webViewLink,
                }
              );
            }
          },
          (err) => {
            setErrorMessage(err.message);
          }
        );

        unsubSnaps = subscribeRecapSnapshots(
          user.uid,
          (snaps) => {
            setCloudSnapshots(snaps);
          },
          (err) => {
            setErrorMessage(err.message);
          }
        );
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Gagal menyambungkan riwayat cloud Firestore.'
          );
        }
      }
    };

    void initFirestoreSubscriptions();

    return () => {
      cancelled = true;
      unsubLinks?.();
      unsubSnaps?.();
    };
  }, [user]);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { user: authedUser, accessToken: token } = await signInWithGoogle();
      setUser(authedUser);
      setAccessToken(token);
      setNeedsDriveAuth(false);
      await ensureUserProfile(authedUser);
      await loadFiles(token);
      setStatusMessage(
        `Berhasil login sebagai ${authedUser.email}. Google Drive dan Firebase Firestore siap digunakan.`
      );
      return true;
    } catch (err) {
      setErrorMessage(formatGoogleAuthError(err));
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  }, [loadFiles]);

  const logoutGoogle = useCallback(async () => {
    await signOutGoogle();
    setUser(null);
    setAccessToken(null);
    setNeedsDriveAuth(true);
    setDriveFiles([]);
    setCloudLinks([]);
    setCloudSnapshots([]);
    setActiveFile(null);
    setLastSyncedUpdatedAt(null);
    setStatusMessage(null);
    setErrorMessage(null);
  }, []);

  const refreshDriveFiles = useCallback(async () => {
    if (!accessToken) return;
    await loadFiles(accessToken);
  }, [accessToken, loadFiles]);

  const saveSnapshotToCloud = useCallback(
    async (recap: RecapSummary) => {
      if (!user) return;
      setIsSavingSnapshot(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        await saveRecapSnapshotToFirestore(
          user,
          recap,
          activeFile?.name || DEFAULT_DRIVE_EXCEL_FILENAME
        );
        setStatusMessage(
          `Snapshot rekap (${recap.totalVoters} pemilih) berhasil diarsipkan ke Firebase Firestore.`
        );
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal menyimpan snapshot ke Firestore.'
        );
      } finally {
        setIsSavingSnapshot(false);
      }
    },
    [user, activeFile?.name]
  );

  const syncExcelToDrive = useCallback(
    async (recap: RecapSummary, mutation: DriveMutation): Promise<boolean> => {
      if (!accessToken || !user) return false;
      setIsSavingToDrive(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const xlsxBlob = buildRecapExcelBlob(recap);
        let saved: DriveExcelFile;

        if (mutation.mode === 'create') {
          saved = await createExcelFileInDrive(accessToken, mutation.fileName, xlsxBlob);
          setDriveFiles((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)]);
          setStatusMessage(
            `File Excel "${saved.name}" berhasil dibuat di Google Drive dan dicatat ke Firebase Firestore.`
          );
        } else {
          saved = await updateExcelFileInDrive(
            accessToken,
            mutation.fileId,
            mutation.fileName,
            xlsxBlob
          );
          setDriveFiles((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
          setStatusMessage(
            `File Excel "${saved.name}" di Google Drive berhasil diperbarui (${recap.totalVoters} pemilih) dan dicatat ke Firebase Firestore.`
          );
        }

        await saveDriveLinkToFirestore(user, {
          driveFileId: saved.id,
          fileName: saved.name,
          webViewLink: isSafeHttpsUrl(saved.webViewLink) ? saved.webViewLink : '',
          totalVoters: recap.totalVoters,
          totalSelections: recap.totalSelections,
        });
        await saveRecapSnapshotToFirestore(user, recap, saved.name);

        setActiveFile(saved);
        setLastSyncedUpdatedAt(recap.updatedAt);
        return true;
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) {
          clearDriveAccessToken();
          setAccessToken(null);
          setNeedsDriveAuth(true);
        }
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal menyimpan file Excel ke Google Drive.'
        );
        return false;
      } finally {
        setIsSavingToDrive(false);
      }
    },
    [accessToken, user]
  );

  return (
    <GoogleFirebaseContext.Provider
      value={{
        user,
        accessToken,
        needsDriveAuth,
        isLoggingIn,
        firestoreStatus,
        driveFiles,
        isLoadingFiles,
        activeFile,
        setActiveFile,
        cloudLinks,
        cloudSnapshots,
        isSavingSnapshot,
        isSavingToDrive,
        lastSyncedUpdatedAt,
        setLastSyncedUpdatedAt,
        statusMessage,
        setStatusMessage,
        errorMessage,
        setErrorMessage,
        loginWithGoogle,
        logoutGoogle,
        refreshDriveFiles,
        saveSnapshotToCloud,
        syncExcelToDrive,
      }}
    >
      {children}
    </GoogleFirebaseContext.Provider>
  );
};

export function useGoogleFirebase(): GoogleFirebaseContextValue {
  const ctx = useContext(GoogleFirebaseContext);
  if (!ctx) {
    throw new Error('useGoogleFirebase must be used inside GoogleFirebaseProvider');
  }
  return ctx;
}
