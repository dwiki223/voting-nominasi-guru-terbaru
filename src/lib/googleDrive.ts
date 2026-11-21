import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { EXCEL_MIME_TYPE } from '../shared/excelExport';
import { auth } from './firebase';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'] as const;

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: 'select_account',
});

// Access token is kept strictly in JS memory — never persisted in localStorage/sessionStorage.
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface DriveExcelFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export class DriveAuthExpiredError extends Error {
  constructor() {
    super('Sesi akses Google Drive telah berakhir. Silakan masuk ulang dengan Google.');
    this.name = 'DriveAuthExpiredError';
  }
}

export function isSafeHttpsUrl(url?: string): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function initGoogleAuth(
  onAuthenticated: (user: User, accessToken: string) => void,
  onNeedsAuth: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (user && cachedAccessToken) {
      onAuthenticated(user, cachedAccessToken);
      return;
    }
    if (!user) {
      cachedAccessToken = null;
    } else if (!isSigningIn) {
      cachedAccessToken = null;
    }
    onNeedsAuth(user);
  });
}

export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan izin akses Google Drive. Silakan coba masuk kembali.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function signOutGoogle(): Promise<void> {
  cachedAccessToken = null;
  await signOut(auth);
}

export function getDriveAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearDriveAccessToken(): void {
  cachedAccessToken = null;
}

export function formatGoogleAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Jendela login Google ditutup sebelum proses masuk selesai. Silakan klik tombol masuk lagi.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up login Google diblokir oleh browser Anda. Izinkan pop-up untuk situs ini lalu coba lagi.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return `Domain "${host}" belum terdaftar di Firebase Authorized Domains. Tambahkan "${host}" pada Firebase Console > Authentication > Settings > Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Metode login Google belum aktif pada proyek Firebase ini.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Gagal masuk dengan akun Google. Pastikan pop-up browser diizinkan lalu coba lagi.';
}

async function parseDriveResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    cachedAccessToken = null;
    throw new DriveAuthExpiredError();
  }
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const errObj = json?.error as { message?: string } | undefined;
    const message =
      errObj?.message || `Permintaan ke Google Drive gagal (status ${res.status}).`;
    throw new Error(message);
  }
  return (json ?? {}) as T;
}

export async function listAppExcelFiles(accessToken: string): Promise<DriveExcelFile[]> {
  const query = `mimeType = '${EXCEL_MIME_TYPE}' and trashed = false`;
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '20',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await parseDriveResponse<{ files?: DriveExcelFile[] }>(res);
  return Array.isArray(data.files) ? data.files : [];
}

function buildMultipartBody(
  metadata: Record<string, unknown>,
  blob: Blob
): { body: Blob; contentType: string } {
  const boundary = `nominasi_guru_boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metaPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`;
  const fileHeader =
    `--${boundary}\r\n` +
    `Content-Type: ${EXCEL_MIME_TYPE}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;

  return {
    body: new Blob([metaPart, fileHeader, blob, closing]),
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

export async function createExcelFileInDrive(
  accessToken: string,
  fileName: string,
  xlsxBlob: Blob
): Promise<DriveExcelFile> {
  const { body, contentType } = buildMultipartBody(
    {
      name: fileName,
      mimeType: EXCEL_MIME_TYPE,
      description:
        'Rekapitulasi Voting Pemilihan Nominasi Guru OSIS SMPIT Insan Madani 8 (Format Excel)',
    },
    xlsxBlob
  );

  const params = new URLSearchParams({
    uploadType: 'multipart',
    fields: 'id,name,modifiedTime,webViewLink',
  });

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body,
    }
  );

  return parseDriveResponse<DriveExcelFile>(res);
}

export async function updateExcelFileInDrive(
  accessToken: string,
  fileId: string,
  fileName: string,
  xlsxBlob: Blob
): Promise<DriveExcelFile> {
  const { body, contentType } = buildMultipartBody(
    {
      name: fileName,
    },
    xlsxBlob
  );

  const params = new URLSearchParams({
    uploadType: 'multipart',
    fields: 'id,name,modifiedTime,webViewLink',
  });

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body,
    }
  );

  return parseDriveResponse<DriveExcelFile>(res);
}
