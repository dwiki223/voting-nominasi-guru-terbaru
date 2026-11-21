import React from 'react';

export type ActivePage = 'vote' | 'recap';
export type RecapTab = 'matrix' | 'nominations' | 'teachers' | 'classes';

interface HeaderProps {
  activePage: ActivePage;
  activeRecapTab: RecapTab;
  onNavigate: (page: ActivePage, recapTab?: RecapTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  activeRecapTab,
  onNavigate,
}) => {
  const isVote = activePage === 'vote';
  const isMatrix = activePage === 'recap' && (activeRecapTab === 'matrix' || activeRecapTab === 'teachers');
  const isCategories = activePage === 'recap' && activeRecapTab === 'nominations';
  const isClasses = activePage === 'recap' && activeRecapTab === 'classes';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('vote')}
          className="text-left text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          Nominasi Guru
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

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isVote ? (
            <button
              type="button"
              onClick={() => onNavigate('recap', 'matrix')}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Lihat Rekap Live
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('vote')}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Isi Surat Suara
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
