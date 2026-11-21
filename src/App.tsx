/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Header, type ActivePage, type RecapTab } from './components/Header';
import { RecapDashboard } from './components/RecapDashboard';
import { VoterIdentityCard } from './components/VoterIdentityCard';
import { VotingBallot } from './components/VotingBallot';
import type { RecapSummary, SelectionMap } from './shared/constants';

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
    fetchRecap();

    const eventSource = new EventSource('/api/stream');
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

    return () => {
      eventSource.close();
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                  style={{ textWrap: 'balance' }}
                >
                  Pemilihan Nominasi Guru
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Pilih 1 nominasi terbaik untuk setiap guru. Setiap nominasi hanya dapat diberikan kepada 1 guru dan hasil langsung terhitung di tabel rekapitulasi.
                </p>
              </div>
              {recap && (
                <div className="text-xs text-slate-500 sm:text-right">
                  <span>
                    <strong className="font-mono tabular-nums font-semibold text-slate-900">
                      {recap.totalVoters}
                    </strong>{' '}
                    pemilih
                  </span>
                  <span className="mx-2 text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    <strong className="font-mono tabular-nums font-semibold text-slate-900">
                      {recap.totalSelections}
                    </strong>{' '}
                    suara tercatat
                  </span>
                </div>
              )}
            </div>

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
    </div>
  );
}
