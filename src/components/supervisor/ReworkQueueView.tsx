import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  PauseCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { IssueReport, ReworkRecord, SupervisorDecision, OperationType } from '../../types';
import { api } from '../../services/api';

interface ReworkQueueViewProps {
  issues: IssueReport[];
  reworks: ReworkRecord[];
  onRefresh: () => void;
}

const ALL_OPERATIONS: OperationType[] = [
  'CUTTING',
  'POLISHING',
  'BEVELING',
  'DRILLING',
  'WASHING',
  'TEMPERING',
  'SANDBLASTING',
  'DOUBLE_GLAZING',
  'PACKING_DELIVERY',
];

export const ReworkQueueView: React.FC<ReworkQueueViewProps> = ({
  issues,
  reworks,
  onRefresh,
}) => {
  const openIssues = issues.filter((i) => i.status === 'OPEN');
  const [selectedIssueId, setSelectedIssueId] = useState<string>(openIssues[0]?.id || '');
  const [decision, setDecision] = useState<SupervisorDecision>('Approve Rework');
  const [supervisorNote, setSupervisorNote] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<OperationType[]>(['POLISHING', 'WASHING']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const activeIssue = issues.find((i) => i.id === selectedIssueId) || openIssues[0];

  const handleDecisionSubmit = async () => {
    if (!activeIssue) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.actionSupervisorRework({
        issueId: activeIssue.id,
        decision,
        note: supervisorNote,
        approvedRoute:
          decision === 'Approve Rework' || decision === 'Repair' ? selectedRoute : undefined,
        supervisorName: 'Supervisor QA',
      });
      setFeedback({
        type: 'success',
        message: `Decision '${decision}' successfully applied to piece ${activeIssue.pieceId}.`,
      });
      setSupervisorNote('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRouteStep = (op: OperationType) => {
    if (selectedRoute.includes(op)) {
      if (selectedRoute.length > 1) {
        setSelectedRoute(selectedRoute.filter((o) => o !== op));
      }
    } else {
      setSelectedRoute([...selectedRoute, op]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <span>Supervisor Rework & Defect Disposition Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 16 & 17 — Worker problem reports require formal supervisor approval before rework routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
            {openIssues.length} Pending Actions
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
            {reworks.length} Reworks Tracked
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/60 border-rose-700 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Open Issues List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Open Defect Reports ({openIssues.length})
          </h3>

          {openIssues.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-white text-sm">All Clean!</div>
              <p className="text-xs text-slate-500">No open defects or broken glass reports pending supervisor review.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {openIssues.map((issue) => {
                const isSelected = activeIssue?.id === issue.id;
                return (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-rose-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-cyan-400">
                        {issue.pieceId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                        {issue.reason}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                      <div>
                        Machine: <span className="font-mono text-slate-200">{issue.machineId}</span> ({issue.process})
                      </div>
                      <div>
                        Reported by: <span className="text-slate-200">{issue.operator}</span> at{' '}
                        {new Date(issue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {issue.note && (
                        <div className="italic text-slate-300 mt-1 bg-slate-950/40 p-1.5 rounded">
                          "{issue.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Historical Active Reworks List */}
          {reworks.length > 0 && (
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Rework Records ({reworks.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-950/30">
                {reworks.map((rw) => (
                  <div key={rw.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex justify-between font-mono font-bold">
                      <span className="text-purple-300">{rw.id}</span>
                      <span className="text-slate-400 text-[10px]">{rw.supervisorDecision}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Original Piece: <span className="text-slate-200 font-mono">{rw.originalPieceId}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Rework Route: {rw.approvedRoute.join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Decision and Disposition Console */}
        <div className="lg:col-span-7">
          {activeIssue ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">Issue ID: {activeIssue.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold uppercase">
                    Requires Supervisor Sign-off
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Defect Review for Piece {activeIssue.pieceId}
                </h3>
                <div className="grid grid-cols-3 gap-2 mt-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Work Order</span>
                    <span className="font-mono text-cyan-300">{activeIssue.workOrderId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Process</span>
                    <span className="font-bold text-slate-200">{activeIssue.process}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reported Reason</span>
                    <span className="font-bold text-rose-300">{activeIssue.reason}</span>
                  </div>
                </div>
              </div>

              {/* Decision Options (Section 16: Approve Rework, Reject, Hold, Scrap, Repair, Accept as-is) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Supervisor Action / Disposition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'Approve Rework',
                      'Repair',
                      'Accept as-is',
                      'Hold',
                      'Scrap',
                      'Reject',
                    ] as SupervisorDecision[]
                  ).map((d) => {
                    const isSelected = decision === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDecision(d)}
                        className={`p-3 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? d === 'Approve Rework' || d === 'Repair'
                              ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                              : d === 'Accept as-is'
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                              : 'bg-rose-600 border-rose-500 text-white shadow-md'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>{d}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If Rework or Repair: Approved Route builder */}
              {(decision === 'Approve Rework' || decision === 'Repair') && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Configure Approved Rework Route:
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedRoute.join(' → ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ALL_OPERATIONS.map((op) => {
                      const inRoute = selectedRoute.includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => toggleRouteStep(op)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            inRoute
                              ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {inRoute ? `✓ ${op}` : `+ ${op}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Supervisor Notes & Audit Justification
                </label>
                <textarea
                  rows={2}
                  value={supervisorNote}
                  onChange={(e) => setSupervisorNote(e.target.value)}
                  placeholder="Provide technical reason or QA calibration instructions..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDecisionSubmit}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Decision...' : 'Apply Supervisor Disposition'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select an open defect from the left to review and authorize rework.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
