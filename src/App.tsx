/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Header, SCHOOL_LOGO_URL, type ActivePage, type RecapTab } from './components/Header';
import { RecapDashboard } from './components/RecapDashboard';
import { SafeImage } from './components/SafeImage';
import { VoterIdentityCard } from './components/VoterIdentityCard';
import { VotingBallot } from './components/VotingBallot';
import type { RecapSummary, SelectionMap } from './shared/constants';

const HERO_AWARDS_IMAGE = '/src/assets/images/hero_teacher_awards_1795245596126.jpg';

interface SubmittedReceipt {
  id: string;
  voterName: string;
  voterClass: string;
  selections: SelectionMap;
  submittedAt: string;
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('vote');
  const [activeRecapTab, setActiveRecapTab] = useState<RecapTab>('matrix');

  // Voter ballot state
  const [voterName, setVoterName] = useState('');
  const [voterClass, setVoterClass] = useState('');
  const [isIdentityLocked, setIsIdentityLocked] = useState(false);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmittedReceipt | null>(null);

  // Real-time recapitulation state
  const [recap, setRecap] = useState<RecapSummary | null>(null);
  const [isLoadingRecap, setIsLoadingRecap] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchRecap = useCallback(async () => {
    try {
      const response = await fetch('/api/recap');
      if (!response.ok) return;
      const data = (await response.json()) as RecapSummary;
      setRecap(data);
    } catch {
      // SSE or manual refresh can recover
    } finally {
      setIsLoadingRecap(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const initRealtime = async () => {
      await fetchRecap();
      if (cancelled) return;

      let supportsSse = false;
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const health = (await healthRes.json()) as { sse?: boolean };
          supportsSse = Boolean(health.sse);
        }
      } catch {
        supportsSse = false;
      }

      if (cancelled) return;

      if (supportsSse) {
        eventSource = new EventSource('/api/stream');
        eventSource.onopen = () => {
          setIsLiveConnected(true);
        };
        eventSource.addEventListener('recap', (event) => {
          try {
            const data = JSON.parse((event as MessageEvent).data) as RecapSummary;
            setRecap(data);
            setIsLoadingRecap(false);
            setIsLiveConnected(true);
          } catch {
            // Ignore malformed frame
          }
        });
        eventSource.onerror = () => {
          setIsLiveConnected(false);
        };
      } else {
        pollTimer = setInterval(() => {
          fetchRecap();
        }, 4000);
      }
    };

    initRealtime();

    return () => {
      cancelled = true;
      eventSource?.close();
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [fetchRecap]);

  const handleNavigate = (page: ActivePage, recapTab?: RecapTab) => {
    setActivePage(page);
    if (recapTab) {
      setActiveRecapTab(recapTab);
    }
  };

  const handleSubmitBallot = async (): Promise<{
    ok: boolean;
    error?: string;
    receipt?: SubmittedReceipt;
  }> => {
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterName,
          voterClass,
          selections,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        return {
          ok: false,
          error: payload.error || 'Gagal mengirimkan suara voting.',
        };
      }
      if (payload.recap) {
        setRecap(payload.recap as RecapSummary);
      }
      const receipt = payload.ballot as SubmittedReceipt;
      setSubmittedReceipt(receipt);
      return { ok: true, receipt };
    } catch {
      return {
        ok: false,
        error: 'Koneksi ke server terputus. Periksa jaringan Anda lalu coba lagi.',
      };
    }
  };

  const handleResetForNextVoter = () => {
    setVoterName('');
    setVoterClass('');
    setIsIdentityLocked(false);
    setSelections({});
    setSubmittedReceipt(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        activePage={activePage}
        activeRecapTab={activeRecapTab}
        onNavigate={handleNavigate}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {activePage === 'vote' ? (
          <div className="space-y-6">
            {/* Hero Showcase Split */}
            <section
              aria-label="Sambutan Pemilihan Nominasi Guru"
              className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-12 lg:items-stretch"
            >
              <div className="flex flex-col justify-between gap-5 p-6 sm:p-8 lg:col-span-7">
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                    <SafeImage
                      src={SCHOOL_LOGO_URL}
                      alt="Logo OSIS SMPIT Insan Madani 8"
                      className="h-28 w-28 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-2 shadow-xs sm:h-36 sm:w-36"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-blue-800 sm:text-sm">
                        OSIS SMPIT Insan Madani 8
                      </div>
                      <div className="text-xs text-slate-500 sm:text-sm">
                        Apresiasi &amp; Pemilihan Nominasi Guru
                      </div>
                      <h1
                        className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
                        style={{ textWrap: 'balance' }}
                      >
                        Pemilihan Nominasi Guru
                      </h1>
                    </div>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    Berikan apresiasi terbaik untuk guru favorit Anda. Pilih 1 nominasi unik untuk setiap guru dan pantau rekapitulasi suaranya secara langsung.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                  <span>
                    <strong className="font-mono tabular-nums font-semibold text-slate-900">
                      27
                    </strong>{' '}
                    Guru
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    <strong className="font-mono tabular-nums font-semibold text-slate-900">
                      29
                    </strong>{' '}
                    Nominasi
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    <strong className="font-mono tabular-nums font-semibold text-slate-900">
                      14
                    </strong>{' '}
                    Kelas (71–95)
                  </span>
                  {recap && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        <strong className="font-mono tabular-nums font-semibold text-blue-800">
                          {recap.totalVoters}
                        </strong>{' '}
                        pemilih (
                        <strong className="font-mono tabular-nums font-semibold text-blue-800">
                          {recap.totalSelections}
                        </strong>{' '}
                        suara)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="relative min-h-[210px] border-t border-slate-200 bg-slate-100 lg:col-span-5 lg:min-h-full lg:border-l lg:border-t-0">
                <SafeImage
                  src={HERO_AWARDS_IMAGE}
                  alt="Ilustrasi Penghargaan dan Nominasi Guru SMPIT Insan Madani 8"
                  fallbackLabel="Anugerah Nominasi Guru"
                  className="h-full w-full object-cover lg:absolute lg:inset-0"
                />
              </div>
            </section>

            {!submittedReceipt && (
              <VoterIdentityCard
                voterName={voterName}
                voterClass={voterClass}
                isLocked={isIdentityLocked}
                onChangeName={setVoterName}
                onChangeClass={setVoterClass}
                onConfirmIdentity={() => setIsIdentityLocked(true)}
                onUnlockIdentity={() => setIsIdentityLocked(false)}
              />
            )}

            <VotingBallot
              isIdentityLocked={isIdentityLocked}
              voterName={voterName}
              voterClass={voterClass}
              selections={selections}
              onChangeSelections={setSelections}
              onSubmitBallot={handleSubmitBallot}
              onResetForNextVoter={handleResetForNextVoter}
              onOpenRecap={() => handleNavigate('recap', 'matrix')}
              submittedReceipt={submittedReceipt}
            />
          </div>
        ) : (
          <RecapDashboard
            recap={recap}
            isLoading={isLoadingRecap}
            isLiveConnected={isLiveConnected}
            activeTab={activeRecapTab}
            onSelectTab={setActiveRecapTab}
            onRefresh={fetchRecap}
            onStartVote={() => handleNavigate('vote')}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <SafeImage
              src={SCHOOL_LOGO_URL}
              alt="Logo OSIS SMPIT Insan Madani 8"
              className="h-7 w-7 rounded-full border border-slate-200 bg-white object-contain p-0.5"
            />
            <span className="font-medium text-slate-700">
              OSIS SMPIT Insan Madani 8 — Portal Pemilihan Nominasi Guru
            </span>
          </div>
          <span>1 Guru 1 Nominasi · Rekapitulasi Otomatis Real-Time</span>
        </div>
      </footer>
    </div>
  );
}
