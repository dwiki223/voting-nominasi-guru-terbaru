import * as XLSX from 'xlsx';
import { NOMINATIONS, type RecapSummary } from './constants';

export const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const DEFAULT_DRIVE_EXCEL_FILENAME =
  'Rekap_Voting_Nominasi_Guru_SMPIT_IM8.xlsx';

function formatTimestampId(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function sanitizeExcelFilename(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const base = cleaned || DEFAULT_DRIVE_EXCEL_FILENAME;
  return base.toLowerCase().endsWith('.xlsx') ? base : `${base}.xlsx`;
}

export function buildRecapWorkbook(recap: RecapSummary): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Umum
  const summaryRows: Array<Array<string | number>> = [
    ['LAPORAN REKAPITULASI PEMILIHAN NOMINASI GURU'],
    ['Penyelenggara', 'OSIS SMPIT Insan Madani 8'],
    ['Pembaruan Terakhir', formatTimestampId(recap.updatedAt)],
    [''],
    ['Statistik Utama', 'Nilai'],
    ['Total Pemilih Masuk', recap.totalVoters],
    ['Total Suara Nominasi', recap.totalSelections],
    ['Partisipasi Kelas Aktif', `${recap.activeClassesCount} / 14 kelas`],
    [
      'Guru Perolehan Suara Terbanyak',
      recap.topTeacher
        ? `${recap.topTeacher.teacher.name} (${recap.topTeacher.totalVotes} suara)`
        : 'Belum ada suara',
    ],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 34 }, { wch: 46 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Matriks Guru x Nominasi (28 x 30)
  const matrixHeaders: string[] = [
    'No',
    'Nama Guru',
    'Total Suara',
    'Nominasi Teratas',
    ...NOMINATIONS.map((n) => n.label),
  ];
  const matrixRows: Array<Array<string | number>> = recap.teacherRows.map((row) => {
    const topLabel =
      row.topNominations.length > 0
        ? row.topNominations.map((t) => `${t.nomination.label} (${t.votes})`).join('; ')
        : '-';
    const nomCounts = NOMINATIONS.map((n) => row.countsByNomination[n.id] ?? 0);
    return [row.teacher.order, row.teacher.name, row.totalVotes, topLabel, ...nomCounts];
  });
  const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixRows]);
  wsMatrix['!cols'] = [
    { wch: 6 },
    { wch: 42 },
    { wch: 12 },
    { wch: 32 },
    ...NOMINATIONS.map(() => ({ wch: 18 })),
  ];
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Guru x Nominasi');

  // Sheet 3: Pemenang per Kategori (30)
  const categoryHeaders = [
    'No',
    'Kategori Nominasi',
    'Peringkat 1 Sementara',
    'Suara #1',
    'Persentase (%)',
    'Peringkat 2',
    'Total Suara Kategori',
  ];
  const categoryRows: Array<Array<string | number>> = recap.nominationRows.map((row, idx) => [
    idx + 1,
    row.nomination.label,
    row.leaders.length > 0 ? row.leaders.map((l) => l.teacher.name).join(' / ') : 'Belum ada suara',
    row.leaders.length > 0 ? row.leaders[0].votes : 0,
    row.leaders.length > 0 ? row.topPercentage : 0,
    row.runnerUps.length > 0
      ? `${row.runnerUps.map((r) => r.teacher.name).join(' / ')} (${row.runnerUps[0].votes})`
      : '-',
    row.totalVotes,
  ]);
  const wsCategories = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryRows]);
  wsCategories['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 38 },
    { wch: 10 },
    { wch: 15 },
    { wch: 38 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Pemenang Kategori');

  // Sheet 4: Partisipasi Kelas (14 Kelas)
  const classHeaders = ['Kelas', 'Jumlah Pemilih', 'Total Pilihan Nominasi'];
  const classRows: Array<Array<string | number>> = recap.classParticipation.map((cls) => [
    `Kelas ${cls.classCode}`,
    cls.voterCount,
    cls.totalSelections,
  ]);
  const wsClasses = XLSX.utils.aoa_to_sheet([classHeaders, ...classRows]);
  wsClasses['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsClasses, 'Partisipasi Kelas');

  // Sheet 5: Data Pemilih
  const voterHeaders = ['No', 'Nama Lengkap Pemilih', 'Kelas', 'Jumlah Guru Dipilih', 'Waktu Kirim'];
  const voterRows: Array<Array<string | number>> = recap.recentVoters.map((voter, idx) => [
    idx + 1,
    voter.voterName,
    voter.voterClass,
    voter.selectionCount,
    formatTimestampId(voter.submittedAt),
  ]);
  const wsVoters = XLSX.utils.aoa_to_sheet([voterHeaders, ...voterRows]);
  wsVoters['!cols'] = [{ wch: 6 }, { wch: 34 }, { wch: 10 }, { wch: 20 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, wsVoters, 'Data Pemilih');

  return wb;
}

export function buildRecapExcelBuffer(recap: RecapSummary): Uint8Array {
  const wb = buildRecapWorkbook(recap);
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array;
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}

export function buildRecapExcelBlob(recap: RecapSummary): Blob {
  const bytes = buildRecapExcelBuffer(recap);
  const bufferCopy = new Uint8Array(bytes.byteLength);
  bufferCopy.set(bytes);
  return new Blob([bufferCopy.buffer], { type: EXCEL_MIME_TYPE });
}
