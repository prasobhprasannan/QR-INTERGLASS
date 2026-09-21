import React, { useState } from 'react';
import { Zap, X, ShieldAlert, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface ConcurrencyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessTest: () => void;
}

export const ConcurrencyTestModal: React.FC<ConcurrencyTestModalProps> = ({
  isOpen,
  onClose,
  onSuccessTest,
}) => {
  const [machine1, setMachine1] = useState('CUT-01');
  const [machine2, setMachine2] = useState('CUT-02');
  const [workOrderId, setWorkOrderId] = useState('WO-2026-00125');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    try {
      const result = await api.runSimultaneousScanTest({
        machine1,
        machine2,
        workOrderId,
      });
      setTestResult(result);
      onSuccessTest();
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pilot Concurrency & Simultaneous Scan Test
              </h3>
              <p className="text-xs text-amber-300/80 font-mono">
                Section 9 & 39 Non-Negotiable Atomic Concurrency Verification
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          This test simultaneously fires two parallel API load requests from two different machine terminals (e.g.{' '}
          <strong className="text-cyan-400 font-mono">{machine1}</strong> and{' '}
          <strong className="text-cyan-400 font-mono">{machine2}</strong>) attempting to claim the exact same piece at the identical millisecond timestamp.
        </p>

        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Terminal 1:</label>
            <input
              type="text"
              value={machine1}
              onChange={(e) => setMachine1(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 font-bold"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Terminal 2:</label>
            <input
              type="text"
              value={machine2}
              onChange={(e) => setMachine2(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 font-bold"
            />
          </div>
        </div>

        {/* Results view */}
        {testResult && (
          <div className="space-y-3 pt-2">
            {testResult.error ? (
              <div className="p-3 bg-rose-900/40 border border-rose-700 rounded-xl text-rose-200 text-xs">
                {testResult.error}
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{testResult.summary}</span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Target Piece: <span className="text-cyan-300 font-bold">{testResult.testTargetPieceId}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Machine 1 Outcome */}
                  <div
                    className={`p-3 rounded-lg border ${
                      testResult.machine1Result?.success
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                    }`}
                  >
                    <div className="font-bold font-mono text-white flex items-center gap-1">
                      {testResult.machine1Result?.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>Terminal {machine1}</span>
                    </div>
                    <div className="text-[11px] mt-1">
                      {testResult.machine1Result?.success
                        ? `SUCCESS: Granted assignment ${testResult.machine1Result.assignmentId}`
                        : `CONTROLLED REJECTION: ${testResult.machine1Result?.error}`}
                    </div>
                  </div>

                  {/* Machine 2 Outcome */}
                  <div
                    className={`p-3 rounded-lg border ${
                      testResult.machine2Result?.success
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                    }`}
                  >
                    <div className="font-bold font-mono text-white flex items-center gap-1">
                      {testResult.machine2Result?.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>Terminal {machine2}</span>
                    </div>
                    <div className="text-[11px] mt-1">
                      {testResult.machine2Result?.success
                        ? `SUCCESS: Granted assignment ${testResult.machine2Result.assignmentId}`
                        : `CONTROLLED REJECTION: ${testResult.machine2Result?.error}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isRunning ? 'Firing Parallel Requests...' : 'Trigger Simultaneous Scan Collision'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
