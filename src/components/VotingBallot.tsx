import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { NOMINATIONS, TEACHERS, type SelectionMap } from '../shared/constants';
import { assignNomination, getNominationAvailability, validateVoterIdentity } from '../shared/votingLogic';
import { SCHOOL_LOGO_URL } from './Header';
import { NominationIllustration } from './NominationIllustration';
import { SafeImage } from './SafeImage';

const BALLOT_GUIDE_IMAGE = '/src/assets/images/illustration_ballot_guide_1795245596415.jpg';
const RECAP_TROPHY_IMAGE = '/src/assets/images/illustration_recap_trophy_1795245596491.jpg';

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
  onConfirmIdentity: () => void;
  onSubmitBallot: () => Promise<{ ok: boolean; error?: string; receipt?: SubmittedReceipt }>;
  onResetForNextVoter: () => void;
  onOpenRecap: () => void;
  submittedReceipt: SubmittedReceipt | null;
}

type FilterMode = 'all' | 'unassigned' | 'assigned';

export const VotingBallot: React.FC<VotingBallotProps> = ({
  isIdentityLocked,
  voterName,
  voterClass,
  selections,
  onChangeSelections,
  onConfirmIdentity,
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

  // Illustrated Nomination Picker modal state
  const [pickerTeacherId, setPickerTeacherId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedCount = Object.keys(selections).length;
  const remainingNominationCount = NOMINATIONS.length - selectedCount;

  const teacherById = useMemo(() => new Map(TEACHERS.map((t) => [t.id, t])), []);
  const nominationById = useMemo(() => new Map(NOMINATIONS.map((n) => [n.id, n])), []);

  useEffect(() => {
    if (!pickerTeacherId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickerTeacherId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pickerTeacherId]);

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

  const activePickerTeacher = pickerTeacherId ? teacherById.get(pickerTeacherId) ?? null : null;

  const pickerAvailability = useMemo(() => {
    if (!pickerTeacherId) return [];
    const list = getNominationAvailability(selections, pickerTeacherId);
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.nomination.label.toLowerCase().includes(q) ||
        item.nomination.shortLabel.toLowerCase().includes(q)
    );
  }, [pickerTeacherId, pickerSearch, selections]);

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

  const handleOpenPicker = (teacherId: string) => {
    if (!isIdentityLocked) return;
    setPickerSearch('');
    setPickerTeacherId(teacherId);
  };

  const handlePickNomination = (nominationId: string) => {
    if (!pickerTeacherId) return;
    handleSelectChange(pickerTeacherId, nominationId);
    setPickerTeacherId(null);
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

  const identityCheck = useMemo(
    () => validateVoterIdentity(voterName, voterClass),
    [voterName, voterClass]
  );
  const isAllTeachersSelected = selectedCount === TEACHERS.length;
  const remainingTeachersCount = TEACHERS.length - selectedCount;
  const canReadySubmit = isIdentityLocked && isAllTeachersSelected;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!isIdentityLocked) {
      if (identityCheck.valid && isAllTeachersSelected) {
        onConfirmIdentity();
      } else {
        setSubmitError(
          'Lengkapi Nama Lengkap dan Kelas pada Langkah 1 lalu tekan "Buka Surat Suara" terlebih dahulu.'
        );
        document.getElementById('voter-name-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    if (!isAllTeachersSelected) {
      const nextMissing = TEACHERS.find((t) => !selections[t.id]);
      setSubmitError(
        `Semua guru (${TEACHERS.length} guru) wajib dipilih nominasinya. Masih ada ${remainingTeachersCount} guru yang belum dipilih${nextMissing ? ` (misalnya: ${nextMissing.name})` : ''}.`
      );
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
            <div className="flex items-start gap-4">
              <SafeImage
                src={RECAP_TROPHY_IMAGE}
                alt="Ilustrasi Penghargaan Nominasi Guru"
                className="hidden sm:block h-16 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <h2 id="receipt-heading" className="text-xl font-bold text-slate-900 sm:text-2xl">
                    Suara Voting Berhasil Dikirim
                  </h2>
                </div>
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
                        <div className="flex items-center gap-2.5">
                          <NominationIllustration nominationId={entry.nomination!.id} size="sm" />
                          <span>{entry.nomination!.label}</span>
                        </div>
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
    <div className="space-y-6 pb-20 lg:pb-0">
      {!isIdentityLocked && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-3.5 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>
              Daftar pilihan guru masih terkunci. Isi <strong>Nama Lengkap</strong> dan{' '}
              <strong>Kelas</strong> pada Langkah 1 di atas, lalu tekan{' '}
              <strong>Buka Surat Suara</strong>.
            </span>
          </div>
          {identityCheck.valid && (
            <button
              type="button"
              onClick={onConfirmIdentity}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 whitespace-nowrap"
            >
              Konfirmasi &amp; Buka Surat Suara
            </button>
          )}
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
        {/* Main Column: Teachers Ballot */}
        <section
          aria-labelledby="ballot-heading"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-8"
        >
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="ballot-heading" className="text-base font-bold text-slate-900 sm:text-lg">
                  Langkah 2: Pilih 1 Nominasi untuk Semua Guru ({TEACHERS.length} Guru)
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Wajib memilih 1 nominasi unik untuk seluruh {TEACHERS.length} guru sebelum mengirim suara. Nominasi yang sudah dipilih otomatis terkunci bagi guru berikutnya.
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
                const selectedNom = currentNomId ? nominationById.get(currentNomId) : undefined;

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
                      <span className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                        {teacher.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:w-80 shrink-0">
                      <button
                        type="button"
                        id={`select-${teacher.id}`}
                        aria-label={`Pilih nominasi untuk ${teacher.name}`}
                        disabled={!isIdentityLocked}
                        onClick={() => handleOpenPicker(teacher.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                          selectedNom
                            ? 'border-blue-300 bg-white font-semibold text-blue-900 hover:border-blue-500'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:text-slate-900'
                        }`}
                      >
                        {selectedNom ? (
                          <NominationIllustration nominationId={selectedNom.id} size="sm" />
                        ) : (
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                            <Award className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {selectedNom ? selectedNom.label : '-- Pilih Nominasi --'}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      </button>

                      {currentNomId && isIdentityLocked && (
                        <button
                          type="button"
                          onClick={() => handleSelectChange(teacher.id, '')}
                          aria-label={`Hapus pilihan nominasi untuk ${teacher.name}`}
                          title="Batalkan pilihan guru ini"
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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

        {/* Right Sidebar: Visual Guide, Live Availability & Submit Controls */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:col-span-4">
          {/* Illustrated Voting Guide Card */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="aspect-[4/3] w-full overflow-hidden border-b border-slate-100 bg-slate-50">
              <SafeImage
                src={BALLOT_GUIDE_IMAGE}
                alt="Ilustrasi Panduan Pengisian Surat Suara Nominasi Guru"
                fallbackLabel="Panduan Voting"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3.5 px-5 py-4">
              <SafeImage
                src={SCHOOL_LOGO_URL}
                alt="Logo OSIS SMPIT Insan Madani 8"
                className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
              />
              <div className="text-xs text-slate-600 leading-snug">
                <div className="font-semibold text-slate-900">Panduan Singkat Voting</div>
                <div>Isi identitas, pilih 1 nominasi bergambar unik per guru, lalu kirim.</div>
              </div>
            </div>
          </div>

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
                disabled={isSubmitting}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap disabled:cursor-wait disabled:opacity-70 ${
                  canReadySubmit
                    ? 'bg-blue-700 text-white hover:bg-blue-800'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting
                  ? 'Mengirim Suara...'
                  : `Kirim Suara Voting (${selectedCount}/${TEACHERS.length})`}
              </button>

              {!canReadySubmit && (
                <p className="text-center text-[11px] text-slate-500">
                  {!isIdentityLocked
                    ? 'Konfirmasi Nama & Kelas pada Langkah 1 terlebih dahulu.'
                    : `Masih ada ${remainingTeachersCount} guru yang belum dipilih (wajib ${TEACHERS.length}/${TEACHERS.length} guru).`}
                </p>
              )}

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
                    <div className="flex items-center gap-2.5 min-w-0">
                      <NominationIllustration
                        nominationId={nom.id}
                        size="sm"
                        className={ownerTeacher ? 'opacity-50 grayscale-[35%]' : ''}
                      />
                      <span
                        className={`truncate ${
                          ownerTeacher ? 'text-slate-400 line-through' : 'font-medium text-slate-800'
                        }`}
                      >
                        {nom.label}
                      </span>
                    </div>

                    <span className="shrink-0 truncate max-w-[130px] text-right text-slate-500">
                      {ownerTeacher ? ownerTeacher.name : 'Tersedia'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Illustrated Nomination Picker Dialog */}
      {activePickerTeacher && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nomination-picker-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
          onClick={() => setPickerTeacherId(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <div className="text-xs font-semibold text-blue-800">
                  Pilih 1 Nominasi Bergambar
                </div>
                <h3
                  id="nomination-picker-title"
                  className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg"
                >
                  {activePickerTeacher.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPickerTeacherId(null)}
                aria-label="Tutup pemilih nominasi"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  autoFocus
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Cari kategori nominasi (misal: Terberwibawa, Tersabar)..."
                  aria-label="Cari kategori nominasi"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>

              {selections[activePickerTeacher.id] && (
                <button
                  type="button"
                  onClick={() => handlePickNomination('')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 whitespace-nowrap shrink-0"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Batalkan Pilihan Guru Ini
                </button>
              )}
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {pickerAvailability.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Tidak ada nominasi yang cocok dengan pencarian &ldquo;{pickerSearch}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {pickerAvailability.map(({ nomination, isAvailable, assignedToTeacherName }) => {
                    const isSelectedHere = selections[activePickerTeacher.id] === nomination.id;
                    return (
                      <button
                        key={nomination.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handlePickNomination(nomination.id)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          isSelectedHere
                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                            : isAvailable
                              ? 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/70'
                              : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-55'
                        }`}
                      >
                        <NominationIllustration nominationId={nomination.id} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {nomination.label}
                            </span>
                            {isSelectedHere && (
                              <Check className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                            )}
                          </div>
                          <div
                            className={`mt-0.5 truncate text-xs ${
                              isSelectedHere
                                ? 'font-medium text-blue-700'
                                : isAvailable
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                            }`}
                          >
                            {isSelectedHere
                              ? 'Dipilih untuk guru ini'
                              : isAvailable
                                ? 'Tersedia'
                                : `Dipilih: ${assignedToTeacherName}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Sticky Mobile Submit Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm lg:hidden">
        {submitError && (
          <div
            role="alert"
            className="mx-auto mb-2 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-800"
          >
            {submitError}
          </div>
        )}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono tabular-nums text-xs font-semibold text-slate-900">
              {selectedCount} / {TEACHERS.length} Guru dipilih
            </div>
            <div className="truncate text-[11px] text-slate-500">
              {!isIdentityLocked
                ? 'Langkah 1 belum dikonfirmasi'
                : !isAllTeachersSelected
                  ? `Kurang ${remainingTeachersCount} guru lagi (wajib semua ${TEACHERS.length})`
                  : 'Semua guru terisi · Siap dikirim'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap disabled:cursor-wait disabled:opacity-70 ${
              canReadySubmit
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {isSubmitting ? 'Mengirim...' : 'Kirim Suara'}
          </button>
        </div>
      </div>
    </div>
  );
};

