import {
  CLASSES,
  NOMINATIONS,
  TEACHERS,
  type BallotSubmission,
  type ClassCode,
  type ClassParticipationRow,
  type Nomination,
  type NominationLeaderRow,
  type RecapSummary,
  type SelectionMap,
  type StoredBallot,
  type TeacherRecapRow,
  type VoterLogEntry,
} from './constants.js';

const TEACHER_MAP = new Map(TEACHERS.map((t) => [t.id, t]));
const NOMINATION_MAP = new Map(NOMINATIONS.map((n) => [n.id, n]));
const VALID_CLASSES = new Set<string>(CLASSES);

export function normalizeVoterName(name: string): string {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

export function buildVoterKey(name: string, classCode: string): string {
  return `${normalizeVoterName(name).toLowerCase()}::${classCode.trim()}`;
}

export function validateVoterIdentity(
  name: string,
  classCode: string
): { valid: boolean; error?: string; normalizedName?: string; validClass?: ClassCode } {
  const normalizedName = typeof name === 'string' ? normalizeVoterName(name) : '';
  if (normalizedName.length < 2) {
    return {
      valid: false,
      error: 'Nama lengkap wajib diisi minimal 2 huruf sebelum memilih.',
    };
  }
  if (normalizedName.length > 100) {
    return {
      valid: false,
      error: 'Nama lengkap maksimal 100 karakter.',
    };
  }
  const trimmedClass = typeof classCode === 'string' ? classCode.trim() : '';
  if (!VALID_CLASSES.has(trimmedClass)) {
    return {
      valid: false,
      error: 'Silakan pilih kelas Anda terlebih dahulu (71–95).',
    };
  }
  return {
    valid: true,
    normalizedName,
    validClass: trimmedClass as ClassCode,
  };
}

/**
 * Returns nominations paired with availability metadata for a given teacher.
 * A nomination already assigned to another teacher cannot be picked again.
 */
export function getNominationAvailability(
  selections: SelectionMap,
  currentTeacherId: string
): Array<{
  nomination: Nomination;
  isAvailable: boolean;
  assignedToTeacherId: string | null;
  assignedToTeacherName: string | null;
}> {
  const usedByTeacher = new Map<string, string>();
  for (const [teacherId, nominationId] of Object.entries(selections)) {
    if (nominationId) {
      usedByTeacher.set(nominationId, teacherId);
    }
  }

  return NOMINATIONS.map((nomination) => {
    const ownerTeacherId = usedByTeacher.get(nomination.id) ?? null;
    const isSelf = ownerTeacherId === currentTeacherId;
    const isAvailable = ownerTeacherId === null || isSelf;
    const ownerTeacher = ownerTeacherId ? TEACHER_MAP.get(ownerTeacherId) : undefined;

    return {
      nomination,
      isAvailable,
      assignedToTeacherId: ownerTeacherId,
      assignedToTeacherName: ownerTeacher?.name ?? null,
    };
  });
}

/**
 * Assigns or clears a nomination for a teacher while enforcing the strict
 * 1-nomination-per-teacher and 1-teacher-per-nomination rule.
 */
export function assignNomination(
  selections: SelectionMap,
  teacherId: string,
  nominationId: string | null
): { ok: true; next: SelectionMap } | { ok: false; error: string } {
  if (!TEACHER_MAP.has(teacherId)) {
    return { ok: false, error: 'Guru tidak ditemukan dalam daftar resmi.' };
  }

  if (!nominationId) {
    const next = { ...selections };
    delete next[teacherId];
    return { ok: true, next };
  }

  const nomination = NOMINATION_MAP.get(nominationId);
  if (!nomination) {
    return { ok: false, error: 'Pilihan nominasi tidak valid.' };
  }

  for (const [otherTeacherId, assignedNominationId] of Object.entries(selections)) {
    if (otherTeacherId !== teacherId && assignedNominationId === nominationId) {
      const otherTeacher = TEACHER_MAP.get(otherTeacherId);
      return {
        ok: false,
        error: `${nomination.label} sudah dipilih untuk ${otherTeacher?.name ?? 'guru lain'} dan tidak bisa dipilih lagi.`,
      };
    }
  }

  return {
    ok: true,
    next: {
      ...selections,
      [teacherId]: nominationId,
    },
  };
}

export function validateBallot(
  submission: BallotSubmission
):
  | {
      valid: true;
      normalizedName: string;
      validClass: ClassCode;
      cleanSelections: SelectionMap;
    }
  | { valid: false; error: string } {
  if (!submission || typeof submission !== 'object') {
    return { valid: false, error: 'Data surat suara tidak valid.' };
  }
  const identity = validateVoterIdentity(submission.voterName, submission.voterClass);
  if (!identity.valid || !identity.normalizedName || !identity.validClass) {
    return { valid: false, error: identity.error ?? 'Identitas pemilih tidak valid.' };
  }

  if (!submission.selections || typeof submission.selections !== 'object' || Array.isArray(submission.selections)) {
    return { valid: false, error: 'Pilihan nominasi belum diisi.' };
  }

  const cleanSelections: SelectionMap = {};
  const usedNominations = new Set<string>();

  for (const [teacherId, nominationId] of Object.entries(submission.selections)) {
    if (!nominationId) continue;

    const teacher = TEACHER_MAP.get(teacherId);
    if (!teacher) {
      return { valid: false, error: `ID guru tidak dikenal: ${teacherId}` };
    }

    const nomination = NOMINATION_MAP.get(nominationId);
    if (!nomination) {
      return { valid: false, error: `ID nominasi tidak dikenal: ${nominationId}` };
    }

    if (usedNominations.has(nominationId)) {
      return {
        valid: false,
        error: `Nominasi "${nomination.label}" tidak boleh dipilih lebih dari satu kali dalam satu voting.`,
      };
    }

    usedNominations.add(nominationId);
    cleanSelections[teacherId] = nominationId;
  }

  const missingTeachers = TEACHERS.filter((t) => !cleanSelections[t.id]);
  if (missingTeachers.length > 0) {
    return {
      valid: false,
      error: `Semua guru (${TEACHERS.length} guru) wajib dipilih nominasinya. Masih ada ${missingTeachers.length} guru yang belum dipilih (contoh: ${missingTeachers[0].name}).`,
    };
  }

  return {
    valid: true,
    normalizedName: identity.normalizedName,
    validClass: identity.validClass,
    cleanSelections,
  };
}

export function computeRecap(ballots: readonly StoredBallot[], nowIso?: string): RecapSummary {
  const matrix = new Map<string, Record<string, number>>();
  for (const teacher of TEACHERS) {
    const counts: Record<string, number> = {};
    for (const nom of NOMINATIONS) {
      counts[nom.id] = 0;
    }
    matrix.set(teacher.id, counts);
  }

  const classMap = new Map<ClassCode, { voterCount: number; totalSelections: number }>();
  for (const cls of CLASSES) {
    classMap.set(cls, { voterCount: 0, totalSelections: 0 });
  }

  let totalSelections = 0;

  for (const ballot of ballots) {
    const clsStats = classMap.get(ballot.voterClass);
    const ballotCount = Object.keys(ballot.selections).length;
    if (clsStats) {
      clsStats.voterCount += 1;
      clsStats.totalSelections += ballotCount;
    }

    for (const [teacherId, nominationId] of Object.entries(ballot.selections)) {
      const counts = matrix.get(teacherId);
      if (counts && typeof counts[nominationId] === 'number') {
        counts[nominationId] += 1;
        totalSelections += 1;
      }
    }
  }

  const teacherRows: TeacherRecapRow[] = TEACHERS.map((teacher) => {
    const countsByNomination = matrix.get(teacher.id) ?? {};
    let totalVotes = 0;
    let maxNomVotes = 0;

    for (const nom of NOMINATIONS) {
      const c = countsByNomination[nom.id] ?? 0;
      totalVotes += c;
      if (c > maxNomVotes) {
        maxNomVotes = c;
      }
    }

    const topNominations =
      maxNomVotes > 0
        ? NOMINATIONS.filter((n) => (countsByNomination[n.id] ?? 0) === maxNomVotes).map((n) => ({
            nomination: n,
            votes: maxNomVotes,
          }))
        : [];

    return {
      teacher,
      totalVotes,
      countsByNomination,
      topNominations,
    };
  });

  const nominationRows: NominationLeaderRow[] = NOMINATIONS.map((nomination) => {
    let nomTotal = 0;
    const teacherScores = TEACHERS.map((teacher) => {
      const votes = matrix.get(teacher.id)?.[nomination.id] ?? 0;
      nomTotal += votes;
      return { teacher, votes };
    })
      .filter((entry) => entry.votes > 0)
      .sort((a, b) => b.votes - a.votes || a.teacher.order - b.teacher.order);

    const topVotes = teacherScores[0]?.votes ?? 0;
    const leaders = topVotes > 0 ? teacherScores.filter((e) => e.votes === topVotes) : [];
    const nonLeaders = teacherScores.filter((e) => e.votes < topVotes);
    const secondVotes = nonLeaders[0]?.votes ?? 0;
    const runnerUps = secondVotes > 0 ? nonLeaders.filter((e) => e.votes === secondVotes) : [];
    const topPercentage = nomTotal > 0 ? Math.round((topVotes / nomTotal) * 100) : 0;

    return {
      nomination,
      totalVotes: nomTotal,
      leaders,
      runnerUps,
      topPercentage,
    };
  });

  const classParticipation: ClassParticipationRow[] = CLASSES.map((classCode) => {
    const stats = classMap.get(classCode) ?? { voterCount: 0, totalSelections: 0 };
    return {
      classCode,
      voterCount: stats.voterCount,
      totalSelections: stats.totalSelections,
    };
  });

  const activeClassesCount = classParticipation.filter((c) => c.voterCount > 0).length;

  const sortedByTotal = [...teacherRows]
    .filter((r) => r.totalVotes > 0)
    .sort((a, b) => b.totalVotes - a.totalVotes || a.teacher.order - b.teacher.order);

  const topTeacher = sortedByTotal[0]
    ? {
        teacher: sortedByTotal[0].teacher,
        totalVotes: sortedByTotal[0].totalVotes,
      }
    : null;

  const recentVoters: VoterLogEntry[] = [...ballots]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map((b) => ({
      id: b.id,
      voterName: b.voterName,
      voterClass: b.voterClass,
      selectionCount: Object.keys(b.selections).length,
      submittedAt: b.submittedAt,
    }));

  return {
    totalVoters: ballots.length,
    totalSelections,
    activeClassesCount,
    topTeacher,
    teacherRows,
    nominationRows,
    classParticipation,
    recentVoters,
    updatedAt: nowIso ?? new Date().toISOString(),
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateRecapCsv(recap: RecapSummary): string {
  const headers = [
    'No',
    'Nama Guru',
    'Total Suara',
    'Nominasi Teratas',
    ...NOMINATIONS.map((n) => n.label),
  ];

  const rows = recap.teacherRows.map((row) => {
    const topLabel =
      row.topNominations.length > 0
        ? row.topNominations.map((t) => `${t.nomination.label} (${t.votes})`).join('; ')
        : '-';
    const nomCounts = NOMINATIONS.map((n) => row.countsByNomination[n.id] ?? 0);
    return [row.teacher.order, row.teacher.name, row.totalVotes, topLabel, ...nomCounts]
      .map(escapeCsvCell)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}
