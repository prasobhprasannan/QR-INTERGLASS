import React, { useState } from 'react';
import { ArrowRightLeft, X, AlertOctagon } from 'lucide-react';
import { Machine, MachineAssignment } from '../../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMachine: Machine;
  activeAssignment: MachineAssignment;
  allMachines: Machine[];
  onConfirmTransfer: (params: {
    assignmentId: string;
    targetMachineId: string;
    reason: 'Breakdown' | 'Maintenance' | 'Production Balancing' | 'Other';
    note?: string;
  }) => Promise<void>;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  sourceMachine,
  activeAssignment,
  allMachines,
  onConfirmTransfer,
}) => {
  // Filter compatible destination machines (same operation capability, not source machine, not offline)
  const compatibleMachines = allMachines.filter(
    (m) =>
      m.id !== sourceMachine.id &&
      m.capabilities.includes(activeAssignment.operation) &&
      m.status !== 'OFFLINE'
  );

  const [targetMachineId, setTargetMachineId] = useState<string>(
    compatibleMachines[0]?.id || ''
  );
  const [reason, setReason] = useState<
    'Breakdown' | 'Maintenance' | 'Production Balancing' | 'Other'
  >('Breakdown');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMachineId) {
      setErrorMsg('No compatible destination machine selected.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmTransfer({
        assignmentId: activeAssignment.id,
        targetMachineId,
        reason,
        note,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-600/30 text-amber-400 border border-amber-600/50">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Transfer Active Work
              </h3>
              <p className="text-xs text-amber-300 font-mono">
                From: {sourceMachine.id} ({sourceMachine.department})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-900/40 border border-rose-700 rounded-lg text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Active Batch:</span>
              <span className="font-mono text-slate-200">{activeAssignment.batchCode || activeAssignment.id}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pieces in Assignment:</span>
              <span className="font-bold text-cyan-400">{activeAssignment.pieceIds.length} pieces</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Operation:</span>
              <span className="font-semibold text-slate-200">{activeAssignment.operation}</span>
            </div>
          </div>

          {/* Target machine */}
          <div>
            <label htmlFor="target-machine-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Compatible Destination Machine
            </label>
            {compatibleMachines.length === 0 ? (
              <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>No other machines currently have matching capability for {activeAssignment.operation}.</span>
              </div>
            ) : (
              <select
                id="target-machine-select"
                value={targetMachineId}
                onChange={(e) => setTargetMachineId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {compatibleMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} — {m.name} [Status: {m.status}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transfer reason */}
          <div>
            <label htmlFor="transfer-reason-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Transfer Reason
            </label>
            <select
              id="transfer-reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Breakdown">Machine Breakdown (Unscheduled)</option>
              <option value="Maintenance">Scheduled Line Maintenance</option>
              <option value="Production Balancing">Production Balancing / Line Load Optimization</option>
              <option value="Other">Other Documented Reason</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="transfer-note-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Transfer Notes & Instructions
            </label>
            <input
              id="transfer-note-input"
              type="text"
              placeholder="e.g. Spindle overheat on CUT-01, moving batch to CUT-02"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || compatibleMachines.length === 0}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Transferring...' : 'Execute Safe Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
