// server.ts
import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createServer as createViteServer } from "vite";

// src/shared/constants.ts
var CLASSES = [
  "71",
  "72",
  "73",
  "74",
  "81",
  "82",
  "83",
  "84",
  "85",
  "91",
  "92",
  "93",
  "94",
  "95"
];
var TEACHERS = [
  { id: "t-01", order: 1, name: "Bpk. Nasan, S.Pd., M.M." },
  { id: "t-02", order: 2, name: "Bunda Rita Diana, S.E." },
  { id: "t-03", order: 3, name: "Bpk. Nurasan Fachri, S.Pd." },
  { id: "t-04", order: 4, name: "Bpk. Syarifudin, M.Pd." },
  { id: "t-05", order: 5, name: "Ibu Rosyidah, S.Pd., M.M." },
  { id: "t-06", order: 6, name: "Ibu Napsiah, S.Pd." },
  { id: "t-07", order: 7, name: "Ibu Susi Susilawati, S.Pd." },
  { id: "t-08", order: 8, name: "Bpk. Taufik Anwar, S.Pd." },
  { id: "t-09", order: 9, name: "Ibu Shara Savitri, M.Pd." },
  { id: "t-10", order: 10, name: "Ibu Nanda Salsabila Kamila, S.Pd." },
  { id: "t-11", order: 11, name: "Ibu Annisa Deviana Putri Kurniawan, S.Pd." },
  { id: "t-12", order: 12, name: "Bpk. Dwiki Darmawan, S.Pd." },
  { id: "t-13", order: 13, name: "Bpk. Usman Sahata Hasibuan, S.H." },
  { id: "t-14", order: 14, name: "Ibu Desi Arisandi, S.Pd." },
  { id: "t-15", order: 15, name: "Ibu Indah Permata Sari, S.P." },
  { id: "t-16", order: 16, name: "Ibu Syafira Rizka Amalia" },
  { id: "t-17", order: 17, name: "Bpk. Handri Yosepal Driyana, S.Pd." },
  { id: "t-18", order: 18, name: "Ibu Deva Aulia Wahida" },
  { id: "t-19", order: 19, name: "Ibu Siti Safniyah, S.Kom." },
  { id: "t-20", order: 20, name: "Ibu Wahyu Trihartatik, S.Pd." },
  { id: "t-21", order: 21, name: "Bpk. Ubaidillah, S.Si." },
  { id: "t-22", order: 22, name: "Ibu Rizka Dewi, S.Pd." },
  { id: "t-23", order: 23, name: "Ibu Nabila Putri, S.Pd." },
  { id: "t-24", order: 24, name: "Bpk. Madi" },
  { id: "t-25", order: 25, name: "Bpk. Rohmat" },
  { id: "t-26", order: 26, name: "Bpk. Rizky" },
  { id: "t-27", order: 27, name: "Ibu Auviliana (Ika)" }
];
var NOMINATIONS = [
  { id: "n-01", label: "Guru Tercantik", shortLabel: "Tercantik" },
  { id: "n-02", label: "Guru Terganteng", shortLabel: "Terganteng" },
  { id: "n-03", label: "Guru Termultitalent", shortLabel: "Termultitalent" },
  { id: "n-04", label: "Guru Terstylish", shortLabel: "Terstylish" },
  { id: "n-05", label: "Guru Terlucu", shortLabel: "Terlucu" },
  { id: "n-06", label: "Guru Tersabar", shortLabel: "Tersabar" },
  { id: "n-07", label: "Guru Terdisiplin", shortLabel: "Terdisiplin" },
  { id: "n-08", label: "Guru Terkreatif", shortLabel: "Terkreatif" },
  { id: "n-09", label: "Guru Terkece", shortLabel: "Terkece" },
  { id: "n-10", label: "Guru Terinspiratif", shortLabel: "Terinspiratif" },
  { id: "n-11", label: "Guru Tertegas", shortLabel: "Tertegas" },
  { id: "n-12", label: "Guru Terkalem", shortLabel: "Terkalem" },
  { id: "n-13", label: "Guru Teragamis", shortLabel: "Teragamis" },
  { id: "n-14", label: "Guru Terperhatian", shortLabel: "Terperhatian" },
  { id: "n-15", label: "Guru Terceria", shortLabel: "Terceria" },
  { id: "n-16", label: "Guru Terramah", shortLabel: "Terramah" },
  { id: "n-17", label: "Guru Terrapi", shortLabel: "Terrapi" },
  { id: "n-18", label: "Guru Terbersih", shortLabel: "Terbersih" },
  { id: "n-19", label: "Guru Terrajin", shortLabel: "Terrajin" },
  { id: "n-20", label: "Guru Terasik", shortLabel: "Terasik" },
  { id: "n-21", label: "Guru Terfavorit", shortLabel: "Terfavorit" },
  { id: "n-22", label: "Guru Tersemangat", shortLabel: "Tersemangat" },
  { id: "n-23", label: "Guru Tergaul", shortLabel: "Tergaul" },
  { id: "n-24", label: "Guru Terlembut", shortLabel: "Terlembut" },
  { id: "n-25", label: "Guru Terdermawan", shortLabel: "Terdermawan" },
  { id: "n-26", label: "Guru Terberwibawa", shortLabel: "Terberwibawa" },
  { id: "n-27", label: "Guru Teringgris", shortLabel: "Teringgris" },
  { id: "n-28", label: "Guru Tersporty", shortLabel: "Tersporty" },
  { id: "n-29", label: "Guru Terhealthy", shortLabel: "Terhealthy" }
];

// src/shared/votingLogic.ts
var TEACHER_MAP = new Map(TEACHERS.map((t) => [t.id, t]));
var NOMINATION_MAP = new Map(NOMINATIONS.map((n) => [n.id, n]));
var VALID_CLASSES = new Set(CLASSES);
function normalizeVoterName(name) {
  return name.trim().replace(/\s+/g, " ");
}
function buildVoterKey(name, classCode) {
  return `${normalizeVoterName(name).toLowerCase()}::${classCode.trim()}`;
}
function validateVoterIdentity(name, classCode) {
  const normalizedName = normalizeVoterName(name);
  if (normalizedName.length < 2) {
    return {
      valid: false,
      error: "Nama lengkap wajib diisi minimal 2 huruf sebelum memilih."
    };
  }
  if (normalizedName.length > 100) {
    return {
      valid: false,
      error: "Nama lengkap maksimal 100 karakter."
    };
  }
  const trimmedClass = classCode.trim();
  if (!VALID_CLASSES.has(trimmedClass)) {
    return {
      valid: false,
      error: "Silakan pilih kelas Anda terlebih dahulu (71\u201395)."
    };
  }
  return {
    valid: true,
    normalizedName,
    validClass: trimmedClass
  };
}
function validateBallot(submission) {
  const identity = validateVoterIdentity(submission.voterName, submission.voterClass);
  if (!identity.valid || !identity.normalizedName || !identity.validClass) {
    return { valid: false, error: identity.error ?? "Identitas pemilih tidak valid." };
  }
  if (!submission.selections || typeof submission.selections !== "object") {
    return { valid: false, error: "Pilihan nominasi belum diisi." };
  }
  const cleanSelections = {};
  const usedNominations = /* @__PURE__ */ new Set();
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
        error: `Nominasi "${nomination.label}" tidak boleh dipilih lebih dari satu kali dalam satu voting.`
      };
    }
    usedNominations.add(nominationId);
    cleanSelections[teacherId] = nominationId;
  }
  if (Object.keys(cleanSelections).length === 0) {
    return {
      valid: false,
      error: "Pilih minimal 1 nominasi untuk 1 guru sebelum mengirim suara."
    };
  }
  return {
    valid: true,
    normalizedName: identity.normalizedName,
    validClass: identity.validClass,
    cleanSelections
  };
}
function computeRecap(ballots, nowIso) {
  const matrix = /* @__PURE__ */ new Map();
  for (const teacher of TEACHERS) {
    const counts = {};
    for (const nom of NOMINATIONS) {
      counts[nom.id] = 0;
    }
    matrix.set(teacher.id, counts);
  }
  const classMap = /* @__PURE__ */ new Map();
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
      if (counts && typeof counts[nominationId] === "number") {
        counts[nominationId] += 1;
        totalSelections += 1;
      }
    }
  }
  const teacherRows = TEACHERS.map((teacher) => {
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
    const topNominations = maxNomVotes > 0 ? NOMINATIONS.filter((n) => (countsByNomination[n.id] ?? 0) === maxNomVotes).map((n) => ({
      nomination: n,
      votes: maxNomVotes
    })) : [];
    return {
      teacher,
      totalVotes,
      countsByNomination,
      topNominations
    };
  });
  const nominationRows = NOMINATIONS.map((nomination) => {
    let nomTotal = 0;
    const teacherScores = TEACHERS.map((teacher) => {
      const votes = matrix.get(teacher.id)?.[nomination.id] ?? 0;
      nomTotal += votes;
      return { teacher, votes };
    }).filter((entry) => entry.votes > 0).sort((a, b) => b.votes - a.votes || a.teacher.order - b.teacher.order);
    const topVotes = teacherScores[0]?.votes ?? 0;
    const leaders = topVotes > 0 ? teacherScores.filter((e) => e.votes === topVotes) : [];
    const nonLeaders = teacherScores.filter((e) => e.votes < topVotes);
    const secondVotes = nonLeaders[0]?.votes ?? 0;
    const runnerUps = secondVotes > 0 ? nonLeaders.filter((e) => e.votes === secondVotes) : [];
    const topPercentage = nomTotal > 0 ? Math.round(topVotes / nomTotal * 100) : 0;
    return {
      nomination,
      totalVotes: nomTotal,
      leaders,
      runnerUps,
      topPercentage
    };
  });
  const classParticipation = CLASSES.map((classCode) => {
    const stats = classMap.get(classCode) ?? { voterCount: 0, totalSelections: 0 };
    return {
      classCode,
      voterCount: stats.voterCount,
      totalSelections: stats.totalSelections
    };
  });
  const activeClassesCount = classParticipation.filter((c) => c.voterCount > 0).length;
  const sortedByTotal = [...teacherRows].filter((r) => r.totalVotes > 0).sort((a, b) => b.totalVotes - a.totalVotes || a.teacher.order - b.teacher.order);
  const topTeacher = sortedByTotal[0] ? {
    teacher: sortedByTotal[0].teacher,
    totalVotes: sortedByTotal[0].totalVotes
  } : null;
  const recentVoters = [...ballots].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((b) => ({
    id: b.id,
    voterName: b.voterName,
    voterClass: b.voterClass,
    selectionCount: Object.keys(b.selections).length,
    submittedAt: b.submittedAt
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
    updatedAt: nowIso ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server.ts
var PORT = Number(process.env.PORT || 3e3);
var DATA_DIR = path.resolve(process.cwd(), "data");
var VOTES_FILE = path.join(DATA_DIR, "votes.json");
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VOTES_FILE)) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify([], null, 2), "utf8");
  }
}
function loadBallots() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(VOTES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveBallots(ballots) {
  ensureDataFile();
  const tempFile = `${VOTES_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(ballots, null, 2), "utf8");
  fs.renameSync(tempFile, VOTES_FILE);
}
var cachedBallots = loadBallots();
var sseClients = /* @__PURE__ */ new Set();
function getRecapSnapshot() {
  return computeRecap(cachedBallots);
}
function broadcastRecap(recap) {
  const payload = `event: recap
data: ${JSON.stringify(recap)}

`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, sse: true, totalVoters: cachedBallots.length });
  });
  app.get("/api/recap", (_req, res) => {
    res.json(getRecapSnapshot());
  });
  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    sseClients.add(res);
    const initial = getRecapSnapshot();
    res.write(`event: recap
data: ${JSON.stringify(initial)}

`);
    const keepAlive = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25e3);
    req.on("close", () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });
  app.post("/api/votes", (req, res) => {
    const body = req.body;
    const validation = validateBallot(body);
    if (!validation.valid) {
      res.status(400).json({ ok: false, error: validation.error });
      return;
    }
    const voterKey = buildVoterKey(validation.normalizedName, validation.validClass);
    const duplicate = cachedBallots.find((b) => b.normalizedVoterKey === voterKey);
    if (duplicate) {
      res.status(409).json({
        ok: false,
        error: `Pemilih atas nama "${validation.normalizedName}" dari kelas ${validation.validClass} sudah pernah mengirimkan suara.`
      });
      return;
    }
    const newBallot = {
      id: crypto.randomUUID(),
      voterName: validation.normalizedName,
      normalizedVoterKey: voterKey,
      voterClass: validation.validClass,
      selections: validation.cleanSelections,
      submittedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    cachedBallots = [...cachedBallots, newBallot];
    saveBallots(cachedBallots);
    const recap = getRecapSnapshot();
    broadcastRecap(recap);
    res.status(201).json({
      ok: true,
      ballot: {
        id: newBallot.id,
        voterName: newBallot.voterName,
        voterClass: newBallot.voterClass,
        selections: newBallot.selections,
        submittedAt: newBallot.submittedAt
      },
      recap
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
