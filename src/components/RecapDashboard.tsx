import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, RefreshCw, Search, Trophy } from 'lucide-react';
import { NOMINATIONS, TEACHERS, type RecapSummary } from '../shared/constants';
import { buildRecapExcelBlob } from '../shared/excelExport';
import { generateRecapCsv } from '../shared/votingLogic';
import { GoogleDriveSyncCard } from './GoogleDriveSyncCard';
import { SCHOOL_LOGO_URL, type RecapTab } from './Header';
import { NominationIllustration } from './NominationIllustration';
import { SafeImage } from './SafeImage';

const RECAP_TROPHY_IMAGE = '/src/assets/images/illustration_recap_trophy_1795245596491.jpg';

interface RecapDashboardProps {
  recap: RecapSummary | null;
  isLoading: boolean;
  isLiveConnected: boolean;
  activeTab: RecapTab;
  onSelectTab: (tab: RecapTab) => void;
  onRefresh: () => void;
  onStartVote: () => void;
}

type SortMode = 'order' | 'votes_desc' | 'name_asc';

export const RecapDashboard: React.FC<RecapDashboardProps> = ({
  recap,
  isLoading,
  isLiveConnected,
  activeTab,
  onSelectTab,
  onRefresh,
  onStartVote,
}) => {
  const [teacherQuery, setTeacherQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('order');
  const [onlyWithVotes, setOnlyWithVotes] = useState(false);

  const filteredTeacherRows = useMemo(() => {
    if (!recap) return [];
    const q = teacherQuery.trim().toLowerCase();
    const list = recap.teacherRows.filter((row) => {
      if (onlyWithVotes && row.totalVotes === 0) return false;
      if (q && !row.teacher.name.toLowerCase().includes(q)) return false;
      return true;
    });

    if (sortMode === 'votes_desc') {
      return [...list].sort(
        (a, b) => b.totalVotes - a.totalVotes || a.teacher.order - b.teacher.order
      );
    }
    if (sortMode === 'name_asc') {
      return [...list].sort((a, b) => a.teacher.name.localeCompare(b.teacher.name, 'id'));
    }
    return [...list].sort((a, b) => a.teacher.order - b.teacher.order);
  }, [recap, teacherQuery, sortMode, onlyWithVotes]);

  const handleDownloadCsv = () => {
    if (!recap) return;
    const csv = generateRecapCsv(recap);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-nominasi-guru-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    if (!recap) return;
    const blob = buildRecapExcelBlob(recap);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-nominasi-guru-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formattedUpdatedAt = useMemo(() => {
    if (!recap?.updatedAt) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(recap.updatedAt));
    } catch {
      return recap.updatedAt;
    }
  }, [recap?.updatedAt]);

  if (isLoading && !recap) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Memuat data rekapitulasi suara...
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-red-800">Gagal memuat data rekapitulasi.</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Showcase Banner */}
      <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SafeImage
            src={SCHOOL_LOGO_URL}
            alt="Logo OSIS SMPIT Insan Madani 8"
            className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-1.5 shadow-xs sm:h-24 sm:w-24"
          />
          <div>
            <div className="text-xs font-semibold text-blue-800">
              OSIS SMPIT Insan Madani 8
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Rekapitulasi Voting Real-Time
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              <span>{isLiveConnected ? 'Sinkronisasi langsung aktif' : 'Mode pembaruan berkala'}</span>
              <span className="mx-2 text-slate-300" aria-hidden="true">
                ·
              </span>
              <span>
                Pembaruan:{' '}
                <span className="font-mono tabular-nums font-medium text-slate-800">
                  {formattedUpdatedAt}
                </span>
              </span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                Unduh Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Unduh CSV
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:w-56">
          <SafeImage
            src={RECAP_TROPHY_IMAGE}
            alt="Ilustrasi Rekapitulasi dan Penghargaan Guru"
            fallbackLabel="Rekapitulasi Real-Time"
            className="h-36 w-full object-cover"
          />
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section
        aria-label="Ringkasan statistik voting"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total Pemilih Masuk</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {recap.totalVoters}
          </div>
          <div className="mt-1 text-xs text-slate-500">Siswa telah memilih</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total Suara Nominasi</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {recap.totalSelections}
          </div>
          <div className="mt-1 text-xs text-slate-500">Akumulasi seluruh guru</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Partisipasi Kelas</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {recap.activeClassesCount} / 14
          </div>
          <div className="mt-1 text-xs text-slate-500">Kelas 71–95 berpartisipasi</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Perolehan Suara Terbanyak</div>
          <div className="mt-1.5 truncate text-base font-bold text-slate-900">
            {recap.topTeacher ? recap.topTeacher.teacher.name : 'Belum ada suara'}
          </div>
          <div className="mt-1 font-mono tabular-nums text-xs text-slate-500">
            {recap.topTeacher ? `${recap.topTeacher.totalVotes} total suara` : 'Menunggu pemilih pertama'}
          </div>
        </div>
      </section>

      <GoogleDriveSyncCard recap={recap} />

      {recap.totalVoters === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Belum ada suara voting yang masuk. Tabel di bawah akan otomatis terhitung secara real-time segera setelah pemilih mengirimkan suara.
          </p>
          <button
            type="button"
            onClick={onStartVote}
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            Isi Voting Pertama
          </button>
        </div>
      )}

      {/* Segmented View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Mode tampilan rekapitulasi"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'matrix'}
            onClick={() => onSelectTab('matrix')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriks Guru × Nominasi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'nominations'}
            onClick={() => onSelectTab('nominations')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'nominations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pemenang per Kategori ({NOMINATIONS.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'teachers'}
            onClick={() => onSelectTab('teachers')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'teachers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkasan per Guru ({TEACHERS.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'classes'}
            onClick={() => onSelectTab('classes')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'classes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Partisipasi Kelas &amp; Pemilih
          </button>
        </div>

        {(activeTab === 'matrix' || activeTab === 'teachers') && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={teacherQuery}
                onChange={(e) => setTeacherQuery(e.target.value)}
                placeholder="Cari nama guru..."
                aria-label="Cari guru di tabel rekapitulasi"
                className="w-52 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <select
              aria-label="Urutkan guru"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-700 focus:outline-none"
            >
              <option value="order">Urutan Resmi (01–{String(TEACHERS.length).padStart(2, '0')})</option>
              <option value="votes_desc">Suara Terbanyak</option>
              <option value="name_asc">Nama (A–Z)</option>
            </select>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWithVotes}
                onChange={(e) => setOnlyWithVotes(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
              />
              Hanya yang bersuara
            </label>
          </div>
        )}
      </div>

      {/* TAB 1: Full Teachers x Nominations Matrix Table */}
      {activeTab === 'matrix' && (
        <section
          aria-label="Tabel matriks rekapitulasi guru dan nominasi"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600">
            <span>
              Menampilkan <strong className="font-mono tabular-nums text-slate-900">{filteredTeacherRows.length}</strong> guru × <strong className="font-mono tabular-nums text-slate-900">{NOMINATIONS.length}</strong> kategori nominasi
            </span>
            <span className="text-slate-500">
              Geser tabel ke kanan untuk melihat seluruh kolom nominasi
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th className="sm:sticky sm:left-0 sm:z-20 min-w-[220px] sm:min-w-[240px] border-r border-slate-200 bg-slate-50 px-4 py-3 font-semibold">
                    Nama Guru
                  </th>
                  <th className="sm:sticky sm:left-[240px] sm:z-20 w-20 border-r border-slate-200 bg-slate-50 px-3 py-3 text-right font-semibold">
                    Total
                  </th>
                  <th className="min-w-[180px] border-r border-slate-200 px-3 py-3 font-semibold">
                    Nominasi Teratas
                  </th>
                  {NOMINATIONS.map((nom) => (
                    <th
                      key={nom.id}
                      title={nom.label}
                      className="min-w-[104px] border-r border-slate-100 px-2.5 py-2.5 text-center font-semibold whitespace-nowrap"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <NominationIllustration nominationId={nom.id} size="sm" />
                        <span>{nom.shortLabel}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeacherRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={NOMINATIONS.length + 3}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Tidak ada data guru yang sesuai dengan filter saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredTeacherRows.map((row) => {
                    const topNomIds = new Set(row.topNominations.map((t) => t.nomination.id));
                    return (
                      <tr key={row.teacher.id} className="group hover:bg-slate-50">
                        <td className="sm:sticky sm:left-0 sm:z-10 border-r border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-900 group-hover:bg-slate-50">
                          <span className="mr-2 font-mono tabular-nums text-slate-400">
                            {String(row.teacher.order).padStart(2, '0')}
                          </span>
                          <span>{row.teacher.name}</span>
                        </td>
                        <td className="sm:sticky sm:left-[240px] sm:z-10 border-r border-slate-200 bg-white px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900 group-hover:bg-slate-50">
                          {row.totalVotes}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2.5 text-slate-700">
                          {row.topNominations.length > 0
                            ? row.topNominations
                                .map((t) => `${t.nomination.shortLabel} (${t.votes})`)
                                .join(', ')
                            : '-'}
                        </td>
                        {NOMINATIONS.map((nom) => {
                          const count = row.countsByNomination[nom.id] ?? 0;
                          const isTop = count > 0 && topNomIds.has(nom.id);
                          return (
                            <td
                              key={nom.id}
                              className={`border-r border-slate-100 px-2.5 py-2.5 text-right font-mono tabular-nums ${
                                isTop
                                  ? 'bg-blue-50 font-bold text-blue-900'
                                  : count > 0
                                    ? 'font-semibold text-slate-800'
                                    : 'text-slate-400'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: Category Leaders */}
      {activeTab === 'nominations' && (
        <section
          aria-label="Tabel pemenang sementara per kategori nominasi"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th className="w-12 px-4 py-3">No</th>
                  <th className="px-4 py-3">Kategori Nominasi</th>
                  <th className="px-4 py-3">Peringkat 1 Sementara</th>
                  <th className="px-4 py-3 text-right">Suara #1</th>
                  <th className="px-4 py-3">Peringkat 2</th>
                  <th className="px-4 py-3 text-right">Total Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recap.nominationRows.map((row, idx) => (
                  <tr key={row.nomination.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono tabular-nums text-xs text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <NominationIllustration nominationId={row.nomination.id} size="sm" />
                        <span>{row.nomination.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.leaders.length > 0 ? (
                        <div className="flex items-center gap-2 font-medium text-blue-900">
                          <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                          <span>{row.leaders.map((l) => l.teacher.name).join(' / ')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Belum ada suara</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {row.leaders.length > 0
                        ? `${row.leaders[0].votes} (${row.topPercentage}%)`
                        : '0'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.runnerUps.length > 0
                        ? `${row.runnerUps.map((r) => r.teacher.name).join(' / ')} (${row.runnerUps[0].votes})`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {row.totalVotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: Teacher Summary */}
      {activeTab === 'teachers' && (
        <section
          aria-label="Tabel ringkasan perolehan suara per guru"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th className="w-12 px-4 py-3">No</th>
                  <th className="px-4 py-3">Nama Guru</th>
                  <th className="px-4 py-3 text-right">Total Suara</th>
                  <th className="px-4 py-3">Nominasi Teratas</th>
                  <th className="px-4 py-3">Rincian Suara Nominasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeacherRows.map((row) => {
                  const nonZeroDetails = NOMINATIONS.filter(
                    (n) => (row.countsByNomination[n.id] ?? 0) > 0
                  )
                    .map((n) => ({
                      label: n.label,
                      count: row.countsByNomination[n.id] ?? 0,
                    }))
                    .sort((a, b) => b.count - a.count);

                  return (
                    <tr key={row.teacher.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono tabular-nums text-xs text-slate-400">
                        {String(row.teacher.order).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {row.teacher.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {row.totalVotes}
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-800">
                        {row.topNominations.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {row.topNominations.map((t) => (
                              <span
                                key={t.nomination.id}
                                className="inline-flex items-center gap-1.5"
                              >
                                <NominationIllustration nominationId={t.nomination.id} size="sm" />
                                <span>
                                  {t.nomination.label} ({t.votes})
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {nonZeroDetails.length > 0
                          ? nonZeroDetails.map((d) => `${d.label}: ${d.count}`).join(' · ')
                          : 'Belum ada suara masuk'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: Class Participation & Voter Log */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section
            aria-label="Partisipasi per kelas"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-5"
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Partisipasi Kelas (71–95)</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th className="px-5 py-2.5">Kelas</th>
                  <th className="px-5 py-2.5 text-right">Jumlah Pemilih</th>
                  <th className="px-5 py-2.5 text-right">Total Pilihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recap.classParticipation.map((cls) => (
                  <tr key={cls.classCode} className="hover:bg-slate-50/70">
                    <td className="px-5 py-2.5 font-mono tabular-nums font-semibold text-slate-900">
                      Kelas {cls.classCode}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums text-slate-800">
                      {cls.voterCount}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums text-slate-600">
                      {cls.totalSelections}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            aria-label="Daftar pemilih masuk"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-7"
          >
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Riwayat Pemilih Masuk</h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {recap.recentVoters.length} pemilih
              </span>
            </div>
            {recap.recentVoters.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Belum ada pemilih yang mengirimkan suara.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                    <tr>
                      <th className="px-5 py-2.5">Nama Lengkap</th>
                      <th className="px-5 py-2.5">Kelas</th>
                      <th className="px-5 py-2.5 text-right">Guru Dipilih</th>
                      <th className="px-5 py-2.5 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recap.recentVoters.map((voter) => (
                      <tr key={voter.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-2.5 font-medium text-slate-900">
                          {voter.voterName}
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-slate-700">
                          {voter.voterClass}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono tabular-nums text-slate-800">
                          {voter.selectionCount} / {TEACHERS.length}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono tabular-nums text-xs text-slate-500">
                          {new Intl.DateTimeFormat('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(voter.submittedAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
