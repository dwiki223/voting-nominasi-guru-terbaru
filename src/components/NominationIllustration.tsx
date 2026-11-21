import React from 'react';

interface NominationIllustrationProps {
  nominationId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface IllustrationMeta {
  bg: string;
  border: string;
  render: () => React.ReactNode;
}

const ILLUSTRATIONS: Record<string, IllustrationMeta> = {
  // n-01: Guru Tercantik — Blooming rose & crown jewel
  'n-01': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FFE4E6" />
        <path d="M24 37V24" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 31C19 31 17 27 17 27C21 27 24 29 24 31Z" fill="#22C55E" />
        <path d="M24 29C29 29 31 25 31 25C27 25 24 27 24 29Z" fill="#16A34A" />
        <circle cx="24" cy="19" r="7.5" fill="#F43F5E" />
        <path d="M19 18C20 14 28 14 29 18C26 21 22 21 19 18Z" fill="#FDA4AF" />
        <circle cx="24" cy="18" r="2.5" fill="#BE123C" />
        <path d="M13 13L14.5 10L16 13L13 11.5H16Z" fill="#F59E0B" />
        <circle cx="35" cy="14" r="1.5" fill="#F59E0B" />
      </svg>
    ),
  },
  // n-02: Guru Terganteng — Classic bow tie & golden laurel
  'n-02': {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#E0F2FE" />
        <path d="M12 20L22 24L12 28V20Z" fill="#1D4ED8" />
        <path d="M36 20L26 24L36 28V20Z" fill="#1E40AF" />
        <rect x="21.5" y="21" width="5" height="6" rx="2" fill="#F59E0B" />
        <path d="M14 33C17 36 31 36 34 33" stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M24 12L25.8 15.5L29.5 16L26.8 18.6L27.5 22.2L24 20.4L20.5 22.2L21.2 18.6L18.5 16L22.2 15.5Z" fill="#FBBF24" />
      </svg>
    ),
  },
  // n-03: Guru Termultitalent — Palette, music note & star
  'n-03': {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#E0E7FF" />
        <path d="M26 11C17 11 12 17 12 24C12 31 17 36 23 36C25.5 36 27 34.5 27 32.5C27 31 25.8 30 25.8 28.5C25.8 27 27 26 29 26H32C35 26 37 23.5 37 20C37 14.5 32 11 26 11Z" fill="#FFFFFF" stroke="#4338CA" strokeWidth="2" />
        <circle cx="19" cy="19" r="2.2" fill="#EF4444" />
        <circle cx="25" cy="16.5" r="2.2" fill="#F59E0B" />
        <circle cx="31" cy="19.5" r="2.2" fill="#10B981" />
        <circle cx="17.5" cy="25.5" r="2.2" fill="#3B82F6" />
        <path d="M32 29V36M32 29L37 27.5V34" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="30.5" cy="36" r="2" fill="#4338CA" />
      </svg>
    ),
  },
  // n-04: Guru Terstylish — Designer glasses & geometric collar
  'n-04': {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#EDE9FE" />
        <rect x="9" y="19" width="12.5" height="9" rx="4.5" fill="#1E1B4B" stroke="#7C3AED" strokeWidth="2" />
        <rect x="26.5" y="19" width="12.5" height="9" rx="4.5" fill="#1E1B4B" stroke="#7C3AED" strokeWidth="2" />
        <path d="M21.5 23H26.5" stroke="#7C3AED" strokeWidth="2.2" />
        <path d="M12 21.5L15 24.5" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M29.5 21.5L32.5 24.5" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 34L24 31L31 34L24 38Z" fill="#F59E0B" />
      </svg>
    ),
  },
  // n-05: Guru Terlucu — Joyful theater mask & confetti
  'n-05': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FEF3C7" />
        <circle cx="24" cy="25" r="11.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.8" />
        <path d="M18.5 22C19 20.5 21 20.5 21.5 22" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M26.5 22C27 20.5 29 20.5 29.5 22" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M18.5 27.5C20 31.5 28 31.5 29.5 27.5H18.5Z" fill="#FFFFFF" stroke="#78350F" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="11" cy="14" r="1.8" fill="#EF4444" />
        <circle cx="37" cy="15" r="1.8" fill="#2563EB" />
        <rect x="35" y="32" width="3" height="3" rx="0.5" transform="rotate(20 35 32)" fill="#10B981" />
      </svg>
    ),
  },
  // n-06: Guru Tersabar — Serene lotus & hourglass
  'n-06': {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#CCFBF1" />
        <path d="M24 12C27 17 28 23 24 29C20 23 21 17 24 12Z" fill="#0D9488" />
        <path d="M24 29C17 27 13 21 14 16C18 18 22 23 24 29Z" fill="#14B8A6" />
        <path d="M24 29C31 27 35 21 34 16C30 18 26 23 24 29Z" fill="#14B8A6" />
        <path d="M13 33C17 31.5 31 31.5 35 33" stroke="#0F766E" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M16 36.5C19 35.5 29 35.5 32 36.5" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  // n-07: Guru Terdisiplin — Precision clock & checkmark
  'n-07': {
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#E2E8F0" />
        <rect x="21" y="9" width="6" height="3" rx="1" fill="#334155" />
        <circle cx="24" cy="25" r="12" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
        <path d="M24 18V25L29 28" stroke="#1D4ED8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="24" cy="25" r="1.8" fill="#1E293B" />
      </svg>
    ),
  },
  // n-08: Guru Terkreatif — Glowing lightbulb & sparkles
  'n-08': {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FEF9C3" />
        <path d="M24 12C18.5 12 15 16 15 20.5C15 23.8 17 26.2 19 28.2C19.6 28.8 20 29.8 20 31H28C28 29.8 28.4 28.8 29 28.2C31 26.2 33 23.8 33 20.5C33 16 29.5 12 24 12Z" fill="#FACC15" stroke="#B45309" strokeWidth="1.8" />
        <rect x="20" y="32" width="8" height="2.5" rx="1" fill="#64748B" />
        <rect x="21" y="35.5" width="6" height="2.2" rx="1" fill="#475569" />
        <path d="M24 20V26M21.5 22L24 20L26.5 22" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M11 19H8M40 19H37M13 11L15 13M35 11L33 13" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  // n-09: Guru Terkece — Cool shades & lightning bolt
  'n-09': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#DBEAFE" />
        <path d="M26 11L16 25H23L21 37L32 22H25L26 11Z" fill="#F59E0B" stroke="#1E40AF" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="14" cy="16" r="2" fill="#2563EB" />
        <circle cx="35" cy="31" r="2" fill="#2563EB" />
      </svg>
    ),
  },
  // n-10: Guru Terinspiratif — Open book & rising sun
  'n-10': {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FFEDD5" />
        <circle cx="24" cy="20" r="6" fill="#F97316" />
        <path d="M24 10V12M15 14L16.5 15.5M33 14L31.5 15.5" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 25C16 23 21 24 24 27C27 24 32 23 37 25V35C32 33 27 34 24 36C21 34 16 33 11 35V25Z" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 27V36" stroke="#1E40AF" strokeWidth="1.8" />
      </svg>
    ),
  },
  // n-11: Guru Tertegas — Shield & authoritative gavel
  'n-11': {
    bg: 'bg-red-50',
    border: 'border-red-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FEE2E2" />
        <path d="M24 11L35 15.5V23.5C35 30.5 30.2 35.5 24 38C17.8 35.5 13 30.5 13 23.5V15.5L24 11Z" fill="#1E293B" stroke="#DC2626" strokeWidth="2" />
        <path d="M19 24L22.5 27.5L30 19.5" stroke="#FBBF24" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  // n-12: Guru Terkalem — Calm crescent, leaf & warm tea
  'n-12': {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#CFFAFE" />
        <path d="M15 24H31V29C31 33.4 27.4 36 23 36C18.6 36 15 33.4 15 29V24Z" fill="#FFFFFF" stroke="#0E7490" strokeWidth="2" />
        <path d="M31 25.5H33.5C35 25.5 36 26.8 36 28.2C36 29.8 35 31 33.5 31H31" stroke="#0E7490" strokeWidth="2" fill="none" />
        <path d="M20 20C20 17.5 21.5 17 21 14.5M25 20C25 17.5 26.5 17 26 14.5" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  // n-13: Guru Teragamis — Mosque dome & crescent moon
  'n-13': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#D1FAE5" />
        <path d="M24 12C20 15 16 19 16 24H32C32 19 28 15 24 12Z" fill="#047857" />
        <rect x="13" y="24" width="22" height="12" rx="1.5" fill="#FFFFFF" stroke="#047857" strokeWidth="2" />
        <path d="M21 36V30C21 28.3 22.3 27 24 27C25.7 27 27 28.3 27 30V36" fill="#059669" />
        <path d="M24 9.5C25.2 9.5 26 10.2 26 11C25 11.4 23 11.4 22 11C22 10.2 22.8 9.5 24 9.5Z" fill="#F59E0B" />
        <circle cx="34" cy="14" r="2.2" fill="#F59E0B" />
      </svg>
    ),
  },
  // n-14: Guru Terperhatian — Warm heart & protective hands
  'n-14': {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FCE7F3" />
        <path d="M24 30C24 30 15 24.5 15 18.5C15 15.5 17.3 13.5 20 13.5C21.8 13.5 23.2 14.5 24 15.8C24.8 14.5 26.2 13.5 28 13.5C30.7 13.5 33 15.5 33 18.5C33 24.5 24 30 24 30Z" fill="#EC4899" />
        <path d="M12 31C15 35 20 36 24 36C28 36 33 35 36 31" stroke="#9D174D" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  // n-15: Guru Terceria — Radiant smiling sun & rainbow
  'n-15': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FEF3C7" />
        <circle cx="24" cy="24" r="8" fill="#F59E0B" />
        <path d="M24 10V13M24 35V38M10 24H13M35 24H38M14 14L16.5 16.5M31.5 31.5L34 34M34 14L31.5 16.5M16.5 31.5L14 34" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M21 25C22 27 26 27 27 25" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  // n-16: Guru Terramah — Warm greeting chat & smile
  'n-16': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#DCFCE7" />
        <path d="M12 16C12 13.8 13.8 12 16 12H32C34.2 12 36 13.8 36 16V27C36 29.2 34.2 31 32 31H21L14 36V31H16C13.8 31 12 29.2 12 27V16Z" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="1.5" fill="#15803D" />
        <circle cx="28" cy="20" r="1.5" fill="#15803D" />
        <path d="M19.5 24C21 26.5 27 26.5 28.5 24" stroke="#15803D" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  // n-17: Guru Terrapi — Crisp shirt collar & necktie
  'n-17': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#DBEAFE" />
        <path d="M13 15L24 19L35 15V34H13V15Z" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 14L24 21L32 14" stroke="#1E3A8A" strokeWidth="2" fill="none" />
        <path d="M24 21L26.5 24L24 34L21.5 24L24 21Z" fill="#2563EB" />
      </svg>
    ),
  },
  // n-18: Guru Terbersih — Gleaming water droplet & sparkles
  'n-18': {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#E0F2FE" />
        <path d="M24 11C24 11 14 21.5 14 28C14 33.5 18.5 37 24 37C29.5 37 34 33.5 34 28C34 21.5 24 11 24 11Z" fill="#0EA5E9" />
        <path d="M19.5 29C19.5 31.5 21 33 23 33.5" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M35 14V18M33 16H37" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 15V18M11.5 16.5H14.5" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  // n-19: Guru Terrajin — Stacked books & fountain pen
  'n-19': {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#E0E7FF" />
        <rect x="13" y="28" width="22" height="6" rx="1.5" fill="#1E40AF" />
        <rect x="15" y="21" width="19" height="6" rx="1.5" fill="#D97706" />
        <rect x="13" y="14" width="21" height="6" rx="1.5" fill="#047857" />
        <path d="M16 17H28M18 24H29M16 31H30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  // n-20: Guru Terasik — Headphones & cheerful soundwave
  'n-20': {
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FAE8FF" />
        <path d="M14 25V22C14 16.5 18.5 12 24 12C29.5 12 34 16.5 34 22V25" stroke="#7E22CE" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <rect x="11.5" y="24" width="5" height="9" rx="2.5" fill="#A21CAF" />
        <rect x="31.5" y="24" width="5" height="9" rx="2.5" fill="#A21CAF" />
        <path d="M20 27V31M24 24V33M28 27V31" stroke="#C026D3" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  // n-21: Guru Terfavorit — Golden star trophy & ribbon
  'n-21': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FEF3C7" />
        <path d="M24 11L27.6 18.4L35.8 19.6L29.9 25.3L31.3 33.5L24 29.6L16.7 33.5L18.1 25.3L12.2 19.6L20.4 18.4L24 11Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="24" cy="23" r="3.5" fill="#FEF3C7" />
      </svg>
    ),
  },
  // n-22: Guru Tersemangat — Rocket & energetic flame
  'n-22': {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FFEDD5" />
        <path d="M24 10C29 14 31 20 30 27H18C17 20 19 14 24 10Z" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.8" />
        <circle cx="24" cy="19" r="3" fill="#FFFFFF" />
        <path d="M18 24L13 28L18 28ZM30 24L35 28L30 28Z" fill="#EA580C" />
        <path d="M21 28L24 37L27 28Z" fill="#F59E0B" />
      </svg>
    ),
  },
  // n-23: Guru Tergaul — Overlapping speech bubbles & community
  'n-23': {
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#ECFCCB" />
        <rect x="11" y="13" width="18" height="13" rx="4" fill="#2563EB" />
        <path d="M15 26L14 30L19 26Z" fill="#2563EB" />
        <rect x="20" y="21" width="17" height="12" rx="4" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M32 33L33 37L28 33Z" fill="#16A34A" />
        <circle cx="17" cy="19.5" r="1.2" fill="#FFFFFF" />
        <circle cx="21" cy="19.5" r="1.2" fill="#FFFFFF" />
        <circle cx="25" cy="19.5" r="1.2" fill="#FFFFFF" />
      </svg>
    ),
  },
  // n-24: Guru Terlembut — Gentle feather quill & soft cloud
  'n-24': {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#E0F2FE" />
        <path d="M33 13C25 13 18 19 16 29L13 35L19 32C28 30 34 23 33 13Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 34L30 16" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  // n-25: Guru Terdermawan — Gift box with gold ribbon
  'n-25': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FFE4E6" />
        <rect x="13" y="21" width="22" height="14" rx="2" fill="#E11D48" />
        <rect x="11.5" y="17" width="25" height="5" rx="1.5" fill="#FB7185" />
        <rect x="22" y="17" width="4" height="18" fill="#FBBF24" />
        <path d="M24 17C21 13 16 13 18 17H24ZM24 17C27 13 32 13 30 17H24Z" fill="#F59E0B" />
      </svg>
    ),
  },
  // n-26: Guru Terberwibawa — Golden crown & classic pillar
  'n-26': {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#FEF3C7" />
        <path d="M12 30L14 16L21 22L24 13L27 22L34 16L36 30H12Z" fill="#D97706" stroke="#78350F" strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="13" y="31.5" width="22" height="3.5" rx="1" fill="#1E3A8A" />
        <circle cx="24" cy="12" r="1.8" fill="#FBBF24" />
      </svg>
    ),
  },
  // n-27: Guru Teringgris — Classic clock tower & globe
  'n-27': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#DBEAFE" />
        <path d="M24 9L28 16H20L24 9Z" fill="#B45309" />
        <rect x="19" y="16" width="10" height="20" fill="#1E40AF" />
        <circle cx="24" cy="22" r="3.5" fill="#FFFFFF" />
        <path d="M24 20V22L25.5 23" stroke="#1E40AF" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="17" y="34" width="14" height="3" rx="1" fill="#DC2626" />
      </svg>
    ),
  },
  // n-28: Guru Tersporty — Whistle & athletic medal
  'n-28': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#D1FAE5" />
        <circle cx="24" cy="24" r="10.5" fill="#FFFFFF" stroke="#047857" strokeWidth="2.2" />
        <path d="M24 13.5V17M24 31V34.5M13.5 24H17M31 24H34.5" stroke="#047857" strokeWidth="2" />
        <polygon points="24,19 28.5,22.2 26.8,27.5 21.2,27.5 19.5,22.2" fill="#059669" />
      </svg>
    ),
  },
  // n-29: Guru Terhealthy — Fresh green apple & pulse line
  'n-29': {
    bg: 'bg-green-50',
    border: 'border-green-200',
    render: () => (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#DCFCE7" />
        <path d="M24 18C20.5 16 14.5 18 14.5 24.5C14.5 31 19 36 22.5 36C23.4 36 23.8 35.5 24 35.5C24.2 35.5 24.6 36 25.5 36C29 36 33.5 31 33.5 24.5C33.5 18 27.5 16 24 18Z" fill="#16A34A" />
        <path d="M24 17C24 14 26 11.5 29 11.5C29 14.5 27 17 24 17Z" fill="#15803D" />
        <path d="M18 26H21L23 22.5L25.5 29L27.5 26H30" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
};

export const NominationIllustration: React.FC<NominationIllustrationProps> = ({
  nominationId,
  size = 'md',
  className = '',
}) => {
  const item = ILLUSTRATIONS[nominationId] ?? ILLUSTRATIONS['n-21'];
  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 rounded-lg p-0.5'
      : size === 'lg'
        ? 'h-14 w-14 rounded-xl p-1'
        : 'h-10 w-10 rounded-lg p-0.5';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border ${item.bg} ${item.border} ${sizeClass} ${className}`}
    >
      {item.render()}
    </span>
  );
};
