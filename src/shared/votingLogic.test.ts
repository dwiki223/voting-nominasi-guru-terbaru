import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES, NOMINATIONS, TEACHERS, type StoredBallot } from './constants';
import {
  assignNomination,
  buildVoterKey,
  computeRecap,
  generateRecapCsv,
  getNominationAvailability,
  validateBallot,
  validateVoterIdentity,
} from './votingLogic';

test('dataset matches exact counts from requirements (14 classes, 27 teachers, 29 nominations)', () => {
  assert.equal(CLASSES.length, 14);
  assert.equal(TEACHERS.length, 27);
  assert.equal(NOMINATIONS.length, 29);
  assert.equal(TEACHERS[0].name, 'Bpk. Nasan, S.Pd., M.M.');
  assert.equal(TEACHERS[26].name, 'Ibu Auviliana (Ika)');
  assert.equal(NOMINATIONS[0].label, 'Guru Tercantik');
  assert.equal(NOMINATIONS[28].label, 'Guru Terhealthy');
});

test('validateVoterIdentity requires valid name and class from 71-95', () => {
  assert.equal(validateVoterIdentity('', '71').valid, false);
  assert.equal(validateVoterIdentity('A', '71').valid, false);
  assert.equal(validateVoterIdentity('Budi Santoso', '99').valid, false);
  assert.equal(validateVoterIdentity('Budi Santoso', '').valid, false);

  const ok = validateVoterIdentity('  Budi   Santoso  ', '82');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalizedName, 'Budi Santoso');
  assert.equal(ok.validClass, '82');
  assert.equal(buildVoterKey('  budi   santoso ', '82'), 'budi santoso::82');
});

test('assignNomination enforces 1 nomination per teacher and prevents reuse across teachers', () => {
  const r1 = assignNomination({}, 't-01', 'n-06');
  assert.equal(r1.ok, true);
  if (!r1.ok) return;

  // Trying to assign the same nomination n-06 to teacher t-02 must fail
  const r2 = assignNomination(r1.next, 't-02', 'n-06');
  assert.equal(r2.ok, false);

  // Availability check for t-02 marks n-06 unavailable and owned by t-01
  const availT2 = getNominationAvailability(r1.next, 't-02');
  const n06ForT2 = availT2.find((item) => item.nomination.id === 'n-06');
  assert.equal(n06ForT2?.isAvailable, false);
  assert.equal(n06ForT2?.assignedToTeacherId, 't-01');

  // Availability check for t-01 keeps n-06 available for itself
  const availT1 = getNominationAvailability(r1.next, 't-01');
  const n06ForT1 = availT1.find((item) => item.nomination.id === 'n-06');
  assert.equal(n06ForT1?.isAvailable, true);

  // Clearing t-01 makes n-06 available again for t-02
  const r3 = assignNomination(r1.next, 't-01', null);
  assert.equal(r3.ok, true);
  if (!r3.ok) return;
  const r4 = assignNomination(r3.next, 't-02', 'n-06');
  assert.equal(r4.ok, true);
});

test('validateBallot rejects duplicate nominations within a single ballot', () => {
  const invalid = validateBallot({
    voterName: 'Siti Aminah',
    voterClass: '74',
    selections: {
      't-01': 'n-10',
      't-02': 'n-10',
    },
  });
  assert.equal(invalid.valid, false);

  const valid = validateBallot({
    voterName: 'Siti Aminah',
    voterClass: '74',
    selections: {
      't-01': 'n-10',
      't-02': 'n-06',
    },
  });
  assert.equal(valid.valid, true);
});

test('computeRecap aggregates teacher matrix, nomination leaders, class participation, and CSV export', () => {
  const ballots: StoredBallot[] = [
    {
      id: 'b-1',
      voterName: 'Raka Pratama',
      normalizedVoterKey: 'raka pratama::82',
      voterClass: '82',
      selections: { 't-01': 'n-26', 't-02': 'n-06' },
      submittedAt: '2026-11-20T08:00:00.000Z',
    },
    {
      id: 'b-2',
      voterName: 'Nadia Putri',
      normalizedVoterKey: 'nadia putri::91',
      voterClass: '91',
      selections: { 't-01': 'n-26', 't-12': 'n-08' },
      submittedAt: '2026-11-20T08:05:00.000Z',
    },
  ];

  const recap = computeRecap(ballots, '2026-11-20T08:10:00.000Z');
  assert.equal(recap.totalVoters, 2);
  assert.equal(recap.totalSelections, 4);
  assert.equal(recap.activeClassesCount, 2);
  assert.equal(recap.topTeacher?.teacher.id, 't-01');
  assert.equal(recap.topTeacher?.totalVotes, 2);

  const rowT01 = recap.teacherRows.find((r) => r.teacher.id === 't-01');
  assert.equal(rowT01?.countsByNomination['n-26'], 2);
  assert.equal(rowT01?.topNominations[0]?.nomination.label, 'Guru Terberwibawa');

  const nom26 = recap.nominationRows.find((r) => r.nomination.id === 'n-26');
  assert.equal(nom26?.leaders[0]?.teacher.id, 't-01');
  assert.equal(nom26?.leaders[0]?.votes, 2);
  assert.equal(nom26?.topPercentage, 100);

  const csv = generateRecapCsv(recap);
  assert.ok(csv.includes('Bpk. Nasan, S.Pd., M.M.'));
  assert.ok(csv.includes('Guru Terberwibawa'));
});

test('excelExport generates a valid 5-sheet .xlsx workbook and sanitizes filenames', async () => {
  const XLSX = await import('xlsx');
  const { buildRecapExcelBuffer, sanitizeExcelFilename } = await import('./excelExport');

  const ballots: StoredBallot[] = [
    {
      id: 'b-1',
      voterName: 'Raka Pratama',
      normalizedVoterKey: 'raka pratama::82',
      voterClass: '82',
      selections: { 't-01': 'n-26', 't-02': 'n-06' },
      submittedAt: '2026-11-20T08:00:00.000Z',
    },
  ];
  const recap = computeRecap(ballots, '2026-11-20T08:10:00.000Z');
  const bytes = buildRecapExcelBuffer(recap);
  assert.ok(bytes.byteLength > 1000);

  const parsed = XLSX.read(bytes, { type: 'array' });
  assert.deepEqual(parsed.SheetNames, [
    'Ringkasan',
    'Matriks Guru x Nominasi',
    'Pemenang Kategori',
    'Partisipasi Kelas',
    'Data Pemilih',
  ]);

  const matrixSheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    parsed.Sheets['Matriks Guru x Nominasi']
  );
  assert.equal(matrixSheet.length, 27);
  assert.equal(matrixSheet[0]['Nama Guru'], 'Bpk. Nasan, S.Pd., M.M.');
  assert.equal(matrixSheet[0]['Guru Terberwibawa'], 1);

  assert.equal(sanitizeExcelFilename('Rekap Voting: Kelas/9'), 'Rekap_Voting_Kelas_9.xlsx');
  assert.equal(sanitizeExcelFilename('laporan.xlsx'), 'laporan.xlsx');
});

test('blueprintValidation enforces ID regex and maxLength bounds matching firebase-blueprint.json', async () => {
  const {
    BLUEPRINT_LIMITS,
    buildValidatedDriveLinkInput,
    buildValidatedRecapSnapshotInput,
    isValidBlueprintId,
  } = await import('./blueprintValidation');

  assert.equal(isValidBlueprintId('valid_user-123'), true);
  assert.equal(isValidBlueprintId('bad/id'), false);
  assert.equal(isValidBlueprintId('a'.repeat(BLUEPRINT_LIMITS.ID_MAX + 1)), false);

  assert.throws(() =>
    buildValidatedDriveLinkInput({
      ownerId: '../evil',
      driveFileId: 'abc123',
      fileName: 'rekap.xlsx',
      webViewLink: 'https://drive.google.com',
      lastTotalVoters: 1,
      lastTotalSelections: 2,
    })
  );

  const snap = buildValidatedRecapSnapshotInput({
    ownerId: 'user-01',
    title: 'Snapshot Awal',
    totalVoters: 5,
    totalSelections: 42,
    activeClassesCount: 99,
    topTeacherName: 'Bpk. Nasan, S.Pd., M.M.',
    topTeacherVotes: 4,
    driveFileName: 'rekap.xlsx',
  });
  assert.equal(snap.activeClassesCount, 14);
});

