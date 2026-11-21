import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { NOMINATIONS, TEACHERS, type SelectionMap } from '../shared/constants';
import { assignNomination, getNominationAvailability } from '../shared/votingLogic';

interface SubmittedReceipt {
  id: string;
  voterName: string;
  voterClass: string;
  selections: SelectionMap;
  submittedAt: string;
}

interface VotingBallotProps {
  isIdentityLocked: boolean;
  voterName: string;
  voterClass: string;
  selections: SelectionMap;
  onChangeSelections: (next: SelectionMap) => void;
  onSubmitBallot: () => Promise<{ ok: boolean; error?: string; receipt?: SubmittedReceipt }>;
  onResetForNextVoter: () => void;
  onOpenRecap: () => void;
  submittedReceipt: SubmittedReceipt | null;
}

type FilterMode = 'all' | 'unassigned' | 'assigned';

export const VotingBallot: React.FC<VotingBallotProps> = ({
  isIdentityLocked,
  selections,
  onChangeSelections,
  onSubmitBallot,
  onResetForNextVoter,
  onOpenRecap,
  submittedReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCount = Object.keys(selections).length;
  const remainingNominationCount = NOMINATIONS.length - selectedCount;

  const teacherById = useMemo(() => new Map(TEACHERS.map((t) => [t.id, t])), []);
  const nominationById = useMemo(() => new Map(NOMINATIONS.map((n) => [n.id, n])), []);

  // Inverse map: nominationId -> teacherId
  const nominationOwnerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const [tId, nId] of Object.entries(selections)) {
      if (nId) map.set(nId, tId);
    }
    return map;
  }, [selections]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TEACHERS.filter((teacher) => {
      const hasVote = Boolean(selections[teacher.id]);
      if (filterMode === 'assigned' && !hasVote) return false;
      if (filterMode === 'unassigned' && hasVote) return false;
      if (q && !teacher.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [searchQuery, filterMode, selections]);

  const handleSelectChange = (teacherId: string, nominationId: string) => {
    setSubmitError(null);
    const result = assignNomination(selections, teacherId, nominationId || null);
    if (!result.ok) {
      setInlineNotice(result.error);
      return;
    }
    setInlineNotice(null);
    onChangeSelections(result.next);
  };

  const handleClearAll = () => {
    onChangeSelections({});
    setInlineNotice(null);
    setSubmitError(null);
  };

  const handleJumpToNextUnassigned = () => {
    setFilterMode('all');
    setSearchQuery('');
    const nextTeacher = TEACHERS.find((t) => !selections[t.id]);
    if (!nextTeacher) return;
    setTimeout(() => {
      const el = document.getElementById(`select-${nextTeacher.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 30);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!isIdentityLocked) {
      setSubmitError('Lengkapi dan konfirmasi Nama Lengkap serta Kelas Anda di Langkah 1 terlebih dahulu.');
      return;
    }
    if (selectedCount === 0) {
      setSubmitError('Pilih minimal 1 nominasi untuk 1 guru sebelum mengirim suara.');
      return;
    }
    setIsSubmitting(true);
    const res = await onSubmitBallot();
    setIsSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error ?? 'Gagal menyimpan suara. Silakan coba lagi.');
    }
  };

  if (submittedReceipt) {
    const entries = Object.entries(submittedReceipt.selections)
      .map(([tId, nId]) => ({
        teacher: teacherById.get(tId),
        nomination: nominationById.get(nId),
      }))
      .filter((item) => item.teacher && item.nomination)
      .sort((a, b) => (a.teacher?.order ?? 0) - (b.teacher?.order ?? 0));

    return (
      <section
        aria-labelledby="receipt-heading"
        className="rounded-xl border border-emerald-200 bg-white p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-6">
            <div className="flex items-start gap-3.5">
              <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-700" aria-hidden="true" />
              <div>
                <h2 id="receipt-heading" className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Suara Voting Berhasil Dikirim
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Terima kasih, <strong className="text-slate-900">{submittedReceipt.voterName}</strong>{' '}
                  <span className="text-slate-300" aria-hidden="true">·</span>{' '}
                  <span className="font-mono tabular-nums">Kelas {submittedReceipt.voterClass}</span>{' '}
                  <span className="text-slate-300" aria-hidden="true">·</span>{' '}
                  <span className="font-mono tabular-nums">{entries.length} guru dipilih</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenRecap}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                Lihat Rekapitulasi Real-Time
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onResetForNextVoter}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Pemilih Berikutnya
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Ringkasan Pilihan Nominasi Anda
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 w-12">No</th>
                    <th className="px-4 py-2.5">Nama Guru</th>
                    <th className="px-4 py-2.5">Nominasi Terpilih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry, idx) => (
                    <tr key={entry.teacher!.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono tabular-nums text-xs text-slate-500">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {entry.teacher!.name}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-blue-800">
                        {entry.nomination!.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {!isIdentityLocked && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-3.5 text-sm text-amber-950"
        >
          <Lock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <span>
            Daftar pilihan guru masih terkunci. Isi <strong>Nama Lengkap</strong> dan{' '}
            <strong>Kelas</strong> pada Langkah 1 di atas, lalu tekan{' '}
            <strong>Buka Surat Suara</strong>.
          </span>
        </div>
      )}

      {inlineNotice && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-900"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
            <span>{inlineNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setInlineNotice(null)}
            aria-label="Tutup peringatan"
            className="rounded p-1 text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Main Column: 27 Teachers Ballot */}
        <section
          aria-labelledby="ballot-heading"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-8"
        >
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="ballot-heading" className="text-base font-bold text-slate-900 sm:text-lg">
                  Langkah 2: Pilih 1 Nominasi untuk Setiap Guru
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Nominasi yang sudah dipilih untuk seorang guru otomatis terkunci bagi guru berikutnya.
                </p>
              </div>
              <div className="text-sm font-mono tabular-nums font-semibold text-blue-800">
                {selectedCount} / {TEACHERS.length} Guru
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama guru..."
                  aria-label="Cari nama guru"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>

              <div
                role="group"
                aria-label="Filter daftar guru"
                className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
              >
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({TEACHERS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('unassigned')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'unassigned'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum ({TEACHERS.length - selectedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('assigned')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'assigned'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terpilih ({selectedCount})
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTeachers.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Tidak ada nama guru yang sesuai dengan pencarian atau filter ini.
              </div>
            ) : (
              filteredTeachers.map((teacher) => {
                const currentNomId = selections[teacher.id] ?? '';
                const availability = getNominationAvailability(selections, teacher.id);

                return (
                  <div
                    key={teacher.id}
                    className={`flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 transition-colors ${
                      currentNomId ? 'bg-blue-50/35' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono tabular-nums text-xs font-medium text-slate-400 shrink-0">
                        {String(teacher.order).padStart(2, '0')}
                      </span>
                      <label
                        htmlFor={`select-${teacher.id}`}
                        className="text-sm font-semibold text-slate-900 sm:text-[15px]"
                      >
                        {teacher.name}
                      </label>
                    </div>

                    <div className="flex items-center gap-2 sm:w-80 shrink-0">
                      <select
                        id={`select-${teacher.id}`}
                        aria-label={`Pilih nominasi untuk ${teacher.name}`}
                        disabled={!isIdentityLocked}
                        value={currentNomId}
                        onChange={(e) => handleSelectChange(teacher.id, e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                          currentNomId
                            ? 'border-blue-300 bg-white font-semibold text-blue-900'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <option value="">-- Pilih Nominasi --</option>
                        {availability.map(({ nomination, isAvailable, assignedToTeacherName }) => (
                          <option
                            key={nomination.id}
                            value={nomination.id}
                            disabled={!isAvailable}
                          >
                            {isAvailable
                              ? nomination.label
                              : `${nomination.label} (Sudah dipilih: ${assignedToTeacherName})`}
                          </option>
                        ))}
                      </select>

                      {currentNomId && isIdentityLocked && (
                        <button
                          type="button"
                          onClick={() => handleSelectChange(teacher.id, '')}
                          aria-label={`Hapus pilihan nominasi untuk ${teacher.name}`}
                          title="Batalkan pilihan guru ini"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Sidebar: Live Availability & Submit Controls */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:col-span-4">
          {/* Progress & Submit Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-slate-900">Ringkasan Surat Suara</h3>
              <span className="font-mono tabular-nums text-sm font-semibold text-blue-800">
                {selectedCount} / {TEACHERS.length}
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-700 transition-[width] duration-200"
                style={{ width: `${Math.round((selectedCount / TEACHERS.length) * 100)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>
                Terpakai:{' '}
                <strong className="font-mono tabular-nums text-slate-900">{selectedCount}</strong>
              </span>
              <span>
                Sisa nominasi:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {remainingNominationCount}
                </strong>{' '}
                dari {NOMINATIONS.length}
              </span>
            </div>

            {selectedCount > 0 && selectedCount < TEACHERS.length && isIdentityLocked && (
              <button
                type="button"
                onClick={handleJumpToNextUnassigned}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Lompat ke guru berikutnya yang belum dipilih
              </button>
            )}

            {submitError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                {submitError}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isIdentityLocked || selectedCount === 0 || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting
                  ? 'Mengirim Suara...'
                  : `Kirim Suara Voting (${selectedCount}/${TEACHERS.length})`}
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                >
                  Kosongkan Semua Pilihan
                </button>
              )}
            </div>
          </div>

          {/* Nomination Pool Tracker */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Status Ketersediaan Nominasi
              </h3>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {remainingNominationCount} tersedia
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
              {NOMINATIONS.map((nom) => {
                const ownerTeacherId = nominationOwnerMap.get(nom.id);
                const ownerTeacher = ownerTeacherId ? teacherById.get(ownerTeacherId) : undefined;
                return (
                  <div
                    key={nom.id}
                    className="flex items-center justify-between gap-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {ownerTeacher ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
                      ) : (
                        <span
                          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 ml-1 mr-1"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`truncate ${
                          ownerTeacher ? 'text-slate-400 line-through' : 'font-medium text-slate-800'
                        }`}
                      >
                        {nom.label}
                      </span>
                    </div>

                    <span className="shrink-0 truncate max-w-[140px] text-right text-slate-500">
                      {ownerTeacher ? ownerTeacher.name : 'Tersedia'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
