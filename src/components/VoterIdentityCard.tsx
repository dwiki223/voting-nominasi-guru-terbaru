import React, { useState } from 'react';
import { CheckCircle2, Edit3, LockOpen, UserCheck } from 'lucide-react';
import { CLASSES } from '../shared/constants';
import { validateVoterIdentity } from '../shared/votingLogic';

interface VoterIdentityCardProps {
  voterName: string;
  voterClass: string;
  isLocked: boolean;
  onChangeName: (name: string) => void;
  onChangeClass: (classCode: string) => void;
  onConfirmIdentity: () => void;
  onUnlockIdentity: () => void;
}

export const VoterIdentityCard: React.FC<VoterIdentityCardProps> = ({
  voterName,
  voterClass,
  isLocked,
  onChangeName,
  onChangeClass,
  onConfirmIdentity,
  onUnlockIdentity,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateVoterIdentity(voterName, voterClass);
    if (!check.valid) {
      setError(check.error ?? 'Identitas pemilih belum lengkap.');
      return;
    }
    setError(null);
    if (check.normalizedName) {
      onChangeName(check.normalizedName);
    }
    onConfirmIdentity();
  };

  if (isLocked) {
    return (
      <section
        aria-label="Identitas pemilih aktif"
        className="rounded-xl border border-emerald-200 bg-white px-5 py-4 sm:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="text-sm text-slate-700">
              <span className="font-medium text-emerald-800">Identitas Terkonfirmasi</span>
              <span className="mx-2 text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold text-slate-900">{voterName}</span>
              <span className="mx-2 text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="font-mono tabular-nums font-medium text-slate-700">
                Kelas {voterClass}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onUnlockIdentity}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            Ubah Identitas
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="voter-identity-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start gap-3">
        <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
        <div>
          <h2 id="voter-identity-heading" className="text-base font-bold text-slate-900 sm:text-lg">
            Langkah 1: Identitas Pemilih
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Tuliskan nama lengkap dan pilih kelas Anda terlebih dahulu sebelum memilih nominasi guru.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-6">
          <label
            htmlFor="voter-name-input"
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Nama Lengkap Pemilih
          </label>
          <input
            id="voter-name-input"
            type="text"
            value={voterName}
            onChange={(e) => {
              onChangeName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Contoh: Raka Pratama"
            autoComplete="name"
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
          />
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="voter-class-select"
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Kelas
          </label>
          <select
            id="voter-class-select"
            value={voterClass}
            onChange={(e) => {
              onChangeClass(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
          >
            <option value="">-- Pilih Kelas --</option>
            <optgroup label="Kelas 7">
              {CLASSES.filter((c) => c.startsWith('7')).map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </optgroup>
            <optgroup label="Kelas 8">
              {CLASSES.filter((c) => c.startsWith('8')).map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </optgroup>
            <optgroup label="Kelas 9">
              {CLASSES.filter((c) => c.startsWith('9')).map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <LockOpen className="h-4 w-4" aria-hidden="true" />
            Buka Surat Suara
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}
    </section>
  );
};
