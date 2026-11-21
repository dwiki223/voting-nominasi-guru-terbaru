import React from 'react';
import { Cloud } from 'lucide-react';
import { useGoogleFirebase } from '@/src/context/GoogleFirebaseContext';
import { SafeImage } from './SafeImage';

export type ActivePage = 'vote' | 'recap';
export type RecapTab = 'matrix' | 'nominations' | 'teachers' | 'classes';

export const SCHOOL_LOGO_URL =
  '/assets/aistudio/WhatsApp_Image_2026-10-11_at_11.55.22_677dcaaf.jpeg';

interface HeaderProps {
  activePage: ActivePage;
  activeRecapTab: RecapTab;
  onNavigate: (page: ActivePage, recapTab?: RecapTab) => void;
  onOpenDriveSync: () => void;
}

const GoogleGIcon: React.FC = () => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="h-4 w-4 shrink-0"
    aria-hidden="true"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  activePage,
  activeRecapTab,
  onNavigate,
  onOpenDriveSync,
}) => {
  const { user, accessToken, isLoggingIn, loginWithGoogle } = useGoogleFirebase();

  const isVote = activePage === 'vote';
  const isMatrix = activePage === 'recap' && (activeRecapTab === 'matrix' || activeRecapTab === 'teachers');
  const isCategories = activePage === 'recap' && activeRecapTab === 'nominations';
  const isClasses = activePage === 'recap' && activeRecapTab === 'classes';

  const handleHeaderDriveClick = async () => {
    if (user && accessToken) {
      onOpenDriveSync();
      return;
    }
    const ok = await loginWithGoogle();
    if (ok) {
      onOpenDriveSync();
    } else {
      onOpenDriveSync();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3 lg:gap-8">
        {/* Zone 1: Single-line Wordmark + Official Logo */}
        <button
          type="button"
          onClick={() => onNavigate('vote')}
          className="inline-flex items-center gap-2 text-left text-sm sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          <SafeImage
            src={SCHOOL_LOGO_URL}
            alt="Logo OSIS SMPIT Insan Madani 8"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-slate-200 bg-white object-contain p-0.5 shrink-0"
          />
          <span>Nominasi Guru</span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => onNavigate('vote')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              isVote
                ? 'border-blue-700 text-blue-800 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Surat Suara
          </button>
          <button
            type="button"
            onClick={() => onNavigate('recap', 'matrix')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              isMatrix
                ? 'border-blue-700 text-blue-800 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabel Rekapitulasi
          </button>
          <button
            type="button"
            onClick={() => onNavigate('recap', 'nominations')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              isCategories
                ? 'border-blue-700 text-blue-800 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Pemenang Kategori
          </button>
          <button
            type="button"
            onClick={() => onNavigate('recap', 'classes')}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              isClasses
                ? 'border-blue-700 text-blue-800 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Partisipasi Kelas
          </button>
        </nav>

        {/* Zone 3: Google Drive & Firebase Quick Login + Primary Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {user && accessToken ? (
            <button
              type="button"
              onClick={onOpenDriveSync}
              title={`Terhubung ke Drive & Firebase (${user.email})`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 whitespace-nowrap shrink-0"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span className="hidden sm:inline max-w-[140px] truncate">
                {user.displayName || user.email}
              </span>
              <span className="sm:hidden">Drive</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleHeaderDriveClick}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <GoogleGIcon />
              <span className="hidden sm:inline">
                {isLoggingIn ? 'Menghubungkan...' : user ? 'Hubungkan Drive' : 'Login Drive & Firebase'}
              </span>
              <span className="sm:hidden">{isLoggingIn ? '...' : 'Drive'}</span>
            </button>
          )}

          {isVote ? (
            <button
              type="button"
              onClick={() => onNavigate('recap', 'matrix')}
              className="rounded-lg bg-blue-700 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <span className="sm:hidden">Rekap</span>
              <span className="hidden sm:inline">Lihat Rekap Live</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('vote')}
              className="rounded-lg bg-blue-700 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <span className="sm:hidden">Voting</span>
              <span className="hidden sm:inline">Isi Surat Suara</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile switcher */}
      <nav
        aria-label="Navigasi seluler"
        className="flex md:hidden border-t border-slate-100 px-4 py-2 gap-4 overflow-x-auto text-xs font-medium"
      >
        <button
          type="button"
          onClick={() => onNavigate('vote')}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 ${
            isVote ? 'border-blue-700 text-blue-800 font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          Surat Suara
        </button>
        <button
          type="button"
          onClick={() => onNavigate('recap', 'matrix')}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 ${
            isMatrix ? 'border-blue-700 text-blue-800 font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          Rekapitulasi
        </button>
        <button
          type="button"
          onClick={() => onNavigate('recap', 'nominations')}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 ${
            isCategories ? 'border-blue-700 text-blue-800 font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          Kategori
        </button>
        <button
          type="button"
          onClick={() => onNavigate('recap', 'classes')}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 ${
            isClasses ? 'border-blue-700 text-blue-800 font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          Kelas
        </button>
      </nav>
    </header>
  );
};
