export const BLUEPRINT_LIMITS = {
  ID_MAX: 128,
  EMAIL_MIN: 3,
  EMAIL_MAX: 160,
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 120,
  DRIVE_FILE_ID_MAX: 200,
  FILE_NAME_MIN: 1,
  FILE_NAME_MAX: 160,
  WEB_VIEW_LINK_MAX: 500,
  TITLE_MIN: 1,
  TITLE_MAX: 120,
  TOP_TEACHER_NAME_MAX: 120,
  MAX_CLASSES: 14,
} as const;

export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

export function isValidBlueprintId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= BLUEPRINT_LIMITS.ID_MAX && ID_PATTERN.test(id);
}

export function isValidDriveFileId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_LIMITS.DRIVE_FILE_ID_MAX &&
    ID_PATTERN.test(id)
  );
}

export function sanitizeBoundedText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function buildValidatedUserProfileInput(params: {
  uid: string;
  email: string;
  displayName: string;
  role: 'member' | 'admin';
}) {
  if (!isValidBlueprintId(params.uid)) {
    throw new Error('UID pengguna tidak valid terhadap skema blueprint.');
  }
  const email = sanitizeBoundedText(params.email, BLUEPRINT_LIMITS.EMAIL_MAX);
  if (email.length < BLUEPRINT_LIMITS.EMAIL_MIN) {
    throw new Error('Email pengguna wajib minimal 3 karakter.');
  }
  const displayName =
    sanitizeBoundedText(params.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) || 'Pengguna';

  return {
    uid: params.uid,
    email,
    displayName,
    role: params.role,
  };
}

export function buildValidatedDriveLinkInput(params: {
  ownerId: string;
  driveFileId: string;
  fileName: string;
  webViewLink: string;
  lastTotalVoters: number;
  lastTotalSelections: number;
}) {
  if (!isValidBlueprintId(params.ownerId)) {
    throw new Error('Owner ID tidak valid terhadap skema blueprint.');
  }
  if (!isValidDriveFileId(params.driveFileId)) {
    throw new Error('Google Drive File ID tidak valid terhadap skema blueprint.');
  }
  const fileName = sanitizeBoundedText(params.fileName, BLUEPRINT_LIMITS.FILE_NAME_MAX);
  if (fileName.length < BLUEPRINT_LIMITS.FILE_NAME_MIN) {
    throw new Error('Nama file Excel tidak boleh kosong.');
  }
  const webViewLink = sanitizeBoundedText(params.webViewLink, BLUEPRINT_LIMITS.WEB_VIEW_LINK_MAX);
  const lastTotalVoters = Math.max(0, Math.trunc(params.lastTotalVoters));
  const lastTotalSelections = Math.max(0, Math.trunc(params.lastTotalSelections));

  return {
    ownerId: params.ownerId,
    driveFileId: params.driveFileId,
    fileName,
    webViewLink,
    lastTotalVoters,
    lastTotalSelections,
  };
}

export function buildValidatedRecapSnapshotInput(params: {
  ownerId: string;
  title: string;
  totalVoters: number;
  totalSelections: number;
  activeClassesCount: number;
  topTeacherName: string;
  topTeacherVotes: number;
  driveFileName: string;
}) {
  if (!isValidBlueprintId(params.ownerId)) {
    throw new Error('Owner ID tidak valid terhadap skema blueprint.');
  }
  const title =
    sanitizeBoundedText(params.title, BLUEPRINT_LIMITS.TITLE_MAX) || 'Snapshot Rekap Voting';
  const totalVoters = Math.max(0, Math.trunc(params.totalVoters));
  const totalSelections = Math.max(0, Math.trunc(params.totalSelections));
  const activeClassesCount = Math.min(
    BLUEPRINT_LIMITS.MAX_CLASSES,
    Math.max(0, Math.trunc(params.activeClassesCount))
  );
  const topTeacherName = sanitizeBoundedText(
    params.topTeacherName,
    BLUEPRINT_LIMITS.TOP_TEACHER_NAME_MAX
  );
  const topTeacherVotes = Math.max(0, Math.trunc(params.topTeacherVotes));
  const driveFileName = sanitizeBoundedText(
    params.driveFileName,
    BLUEPRINT_LIMITS.FILE_NAME_MAX
  );

  return {
    ownerId: params.ownerId,
    title,
    totalVoters,
    totalSelections,
    activeClassesCount,
    topTeacherName,
    topTeacherVotes,
    driveFileName,
  };
}

export function buildBallotDocumentId(normalizedVoterKey: string, voterClass: string): string {
  // Deterministic dual 32-bit FNV-1a hash so the ID is URL/Firestore-safe (^[a-zA-Z0-9_\-]+$)
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < normalizedVoterKey.length; i++) {
    const code = normalizedVoterKey.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(36).padStart(7, '0');
  const part2 = (h2 >>> 0).toString(36).padStart(7, '0');
  return `ballot_${voterClass}_${part1}_${part2}`;
}

export function buildValidatedBallotInput(params: {
  voterName: string;
  normalizedVoterKey: string;
  voterClass: string;
  selections: Record<string, string>;
}) {
  const voterName = sanitizeBoundedText(params.voterName, 100);
  if (voterName.length < 2) {
    throw new Error('Nama pemilih minimal 2 karakter.');
  }
  const normalizedVoterKey = sanitizeBoundedText(params.normalizedVoterKey, 110);
  if (normalizedVoterKey.length < 6) {
    throw new Error('Kunci identitas pemilih tidak valid.');
  }
  const id = buildBallotDocumentId(normalizedVoterKey, params.voterClass);
  if (!isValidBlueprintId(id)) {
    throw new Error('ID dokumen surat suara tidak valid.');
  }
  return {
    id,
    schemaVersion: 1 as const,
    voterName,
    normalizedVoterKey,
    voterClass: params.voterClass,
    selections: { ...params.selections },
  };
}
