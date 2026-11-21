import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSpreadsheet,
  FolderSync,
  LogOut,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { useGoogleFirebase, type DriveMutation } from '@/src/context/GoogleFirebaseContext';
import { FIREBASE_PROJECT_ID } from '@/src/lib/firebase';
import { isSafeHttpsUrl } from '@/src/lib/googleDrive';
import { NOMINATIONS, TEACHERS, type RecapSummary } from '@/src/shared/constants';
import {
  DEFAULT_DRIVE_EXCEL_FILENAME,
  sanitizeExcelFilename,
} from '@/src/shared/excelExport';

interface GoogleDriveSyncCardProps {
  recap: RecapSummary;
}

function formatDriveTime(isoOrMs?: string | number): string {
  if (!isoOrMs) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoOrMs));
  } catch {
    return String(isoOrMs);
  }
}

export const GoogleDriveSyncCard: React.FC<GoogleDriveSyncCardProps> = ({ recap }) => {
  const {
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
    errorMessage,
    setErrorMessage,
    loginWithGoogle,
    logoutGoogle,
    refreshDriveFiles,
    saveSnapshotToCloud,
    syncExcelToDrive,
  } = useGoogleFirebase();

  const [newFileName, setNewFileName] = useState(DEFAULT_DRIVE_EXCEL_FILENAME);
  const [pendingMutation, setPendingMutation] = useState<DriveMutation | null>(null);

  const handleRequestCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const safeName = sanitizeExcelFilename(newFileName);
    setPendingMutation({ mode: 'create', fileName: safeName });
  };

  const handleRequestUpdate = (file: { id: string; name: string }) => {
    setErrorMessage(null);
    setPendingMutation({ mode: 'update', fileId: file.id, fileName: file.name });
  };

  const handleConfirmMutation = async () => {
    if (!pendingMutation) return;
    const ok = await syncExcelToDrive(recap, pendingMutation);
    if (ok || !isSavingToDrive) {
      setPendingMutation(null);
    }
  };

  const hasUnsyncedChanges =
    Boolean(activeFile) && lastSyncedUpdatedAt !== recap.updatedAt;
  const isFirebaseAuthenticated = Boolean(user && user.emailVerified);

  return (
    <section
      id="gdrive-excel-sync"
      aria-labelledby="gdrive-sync-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="gdrive-sync-heading" className="text-base font-bold text-slate-900">
              Koneksi Google Drive (Excel .xlsx) &amp; Firebase Firestore
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Masuk dengan akun Google Anda untuk menyimpan file Excel rekapitulasi ke Google Drive sekaligus menyinkronkan tautan dan arsip snapshot ke proyek Firebase{' '}
              <span className="font-mono text-xs font-semibold text-slate-800">
                {FIREBASE_PROJECT_ID}
              </span>
              .
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>
                Firebase Firestore:{' '}
                <strong className={firestoreStatus === 'offline' ? 'text-red-700' : 'text-emerald-700'}>
                  {firestoreStatus === 'offline'
                    ? 'Offline / Periksa Konfigurasi'
                    : isFirebaseAuthenticated
                      ? 'Terhubung & Tersinkronisasi'
                      : 'Siap (Login Google untuk menyambungkan)'}
                </strong>
              </span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span>
                Google Drive Excel:{' '}
                <strong className={!needsDriveAuth && accessToken ? 'text-emerald-700' : 'text-slate-700'}>
                  {!needsDriveAuth && accessToken ? 'Sesi Drive Aktif' : 'Perlu Login Google Drive'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-900">
                {user.displayName || 'Akun Google Terhubung'}
              </div>
              <div className="text-slate-500">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={logoutGoogle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Keluar
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
          {activeFile && isSafeHttpsUrl(activeFile.webViewLink) && (
            <a
              href={activeFile.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline hover:text-emerald-950"
            >
              Buka di Google Drive
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {(needsDriveAuth || !accessToken) && (
        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
          <div className="text-xs text-slate-600 leading-relaxed">
            {user ? (
              <span>
                Akun Firebase Anda (<strong className="text-slate-900">{user.email}</strong>) sudah login. Klik tombol di samping untuk mengaktifkan kembali izin akses upload/update Excel ke Google Drive.
              </span>
            ) : (
              <span>
                Masuk dengan akun Google Anda untuk menyambungkan penyimpanan Excel di Google Drive dan sinkronisasi data ke Firebase Firestore.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
          </button>
        </div>
      )}

      {!needsDriveAuth && accessToken && user && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Active File / Existing Files */}
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                File Excel Tersambung di Google Drive
              </h3>
              <button
                type="button"
                onClick={refreshDriveFiles}
                disabled={isLoadingFiles}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Segarkan Daftar
              </button>
            </div>

            {activeFile ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">
                      {activeFile.name}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Terakhir diubah di Drive: {formatDriveTime(activeFile.modifiedTime)}
                    </div>
                    <div className="mt-1 text-xs">
                      {hasUnsyncedChanges ? (
                        <span className="font-semibold text-amber-800">
                          Data suara terbaru ({recap.totalVoters} pemilih) siap diperbarui ke file ini.
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700">
                          Sudah sinkron dengan data voting terbaru.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRequestUpdate(activeFile)}
                      disabled={isSavingToDrive}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
                    >
                      <FolderSync className="h-3.5 w-3.5" aria-hidden="true" />
                      Perbarui Excel di Drive
                    </button>

                    {isSafeHttpsUrl(activeFile.webViewLink) && (
                      <a
                        href={activeFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                      >
                        Buka di Drive
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-xs text-slate-600">
                Belum ada file Excel voting di Google Drive Anda untuk aplikasi ini. Buat file Excel baru di sebelah kanan untuk mulai menghubungkan data.
              </div>
            )}

            {driveFiles.length > 1 && (
              <div>
                <label
                  htmlFor="drive-file-select"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Pilih file Excel lain dari Google Drive:
                </label>
                <select
                  id="drive-file-select"
                  value={activeFile?.id ?? ''}
                  onChange={(e) => {
                    const found = driveFiles.find((f) => f.id === e.target.value) ?? null;
                    setActiveFile(found);
                    setLastSyncedUpdatedAt(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-700 focus:outline-none"
                >
                  {driveFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({formatDriveTime(f.modifiedTime)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Create New Excel File in Google Drive */}
          <form
            onSubmit={handleRequestCreate}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 lg:col-span-5"
          >
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Buat File Excel (.xlsx) Baru di Drive
              </h3>
              <label
                htmlFor="new-drive-excel-name"
                className="mt-2.5 block text-xs font-medium text-slate-700"
              >
                Nama File Excel
              </label>
              <input
                id="new-drive-excel-name"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={DEFAULT_DRIVE_EXCEL_FILENAME}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingToDrive}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Buat &amp; Simpan ke Google Drive
            </button>
          </form>
        </div>
      )}

      {/* Firestore Real-time Sync Archive — Always available whenever Firebase Auth is signed in */}
      {isFirebaseAuthenticated && (
        <div className="mt-5 border-t border-slate-200 pt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Database className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>
                Riwayat Arsip Cloud (Firebase Firestore) · {cloudLinks.length} tautan Drive ·{' '}
                {cloudSnapshots.length} snapshot
              </span>
            </div>

            <button
              type="button"
              onClick={() => saveSnapshotToCloud(recap)}
              disabled={isSavingSnapshot}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              {isSavingSnapshot ? 'Menyimpan...' : 'Simpan Snapshot ke Firestore'}
            </button>
          </div>

          {cloudLinks.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3.5 py-2 font-semibold">Tautan Excel Tersimpan di Firestore</th>
                    <th className="px-3.5 py-2 text-right font-semibold">Pemilih</th>
                    <th className="px-3.5 py-2 text-right font-semibold">Terakhir Sinkron</th>
                    <th className="px-3.5 py-2 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cloudLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-2 font-medium text-slate-900">{link.fileName}</td>
                      <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-800">
                        {link.lastTotalVoters}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-500">
                        {formatDriveTime(link.updatedAtMs)}
                      </td>
                      <td className="px-3.5 py-2 text-right">
                        {isSafeHttpsUrl(link.webViewLink) ? (
                          <a
                            href={link.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                          >
                            Buka Drive
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {cloudSnapshots.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3.5 py-2 font-semibold">Snapshot</th>
                    <th className="px-3.5 py-2 font-semibold">File Excel Terkait</th>
                    <th className="px-3.5 py-2 text-right font-semibold">Pemilih</th>
                    <th className="px-3.5 py-2 text-right font-semibold">Total Suara</th>
                    <th className="px-3.5 py-2 text-right font-semibold">Waktu Simpan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cloudSnapshots.slice(0, 5).map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-2 font-medium text-slate-900">{snap.title}</td>
                      <td className="px-3.5 py-2 text-slate-600">{snap.driveFileName || '-'}</td>
                      <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-800">
                        {snap.totalVoters}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-800">
                        {snap.totalSelections}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-500">
                        {formatDriveTime(snap.createdAtMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Explicit Confirmation Modal before Mutating User Google Drive Files */}
      {pendingMutation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
          onClick={() => !isSavingToDrive && setPendingMutation(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="drive-confirm-title" className="text-base font-bold text-slate-900">
                {pendingMutation.mode === 'create'
                  ? 'Buat File Excel Baru di Google Drive?'
                  : 'Perbarui File Excel di Google Drive?'}
              </h3>
              <button
                type="button"
                disabled={isSavingToDrive}
                onClick={() => setPendingMutation(null)}
                aria-label="Tutup konfirmasi"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {pendingMutation.mode === 'create' ? (
                <>
                  Aplikasi akan membuat file Excel baru bernama{' '}
                  <strong className="text-slate-900">{pendingMutation.fileName}</strong> di Google Drive Anda ({user?.email}).
                </>
              ) : (
                <>
                  Tindakan ini akan memperbarui (menimpa) isi file{' '}
                  <strong className="text-slate-900">{pendingMutation.fileName}</strong> di Google Drive Anda dengan data rekapitulasi voting terbaru.
                </>
              )}
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 space-y-1">
              <div>
                Total Pemilih: <strong className="font-mono tabular-nums">{recap.totalVoters}</strong> siswa
              </div>
              <div>
                Total Suara Nominasi: <strong className="font-mono tabular-nums">{recap.totalSelections}</strong> suara
              </div>
              <div>
                Isi Workbook: 5 sheet Excel (Ringkasan, Matriks {TEACHERS.length}×{NOMINATIONS.length}, Pemenang Kategori, Partisipasi Kelas, Data Pemilih)
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSavingToDrive}
                onClick={() => setPendingMutation(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingToDrive}
                onClick={handleConfirmMutation}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                <FolderSync className="h-3.5 w-3.5" aria-hidden="true" />
                {isSavingToDrive ? 'Menyimpan...' : 'Konfirmasi & Simpan ke Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
