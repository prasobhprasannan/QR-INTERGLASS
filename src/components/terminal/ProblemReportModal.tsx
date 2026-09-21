import React, { useState } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { ISSUE_REASONS, IssueReason, Piece } from '../../types';

interface ProblemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  activePieces: Piece[];
  onSubmit: (pieceId: string, reason: IssueReason, note: string) => Promise<void>;
}

export const ProblemReportModal: React.FC<ProblemReportModalProps> = ({
  isOpen,
  onClose,
  machineId,
  activePieces,
  onSubmit,
}) => {
  const [selectedPieceId, setSelectedPieceId] = useState<string>(
    activePieces[0]?.id || ''
  );
  const [selectedReason, setSelectedReason] = useState<IssueReason>(
    'Glass Breakage'
  );
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPieceId) {
      setErrorMsg('Please choose the affected piece.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit(selectedPieceId, selectedReason, note);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to report problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-rose-950/60 border-b border-rose-800/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-600/30 text-rose-400 border border-rose-600/50">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Report Problem / Damage
              </h3>
              <p className="text-xs text-rose-300 font-mono">
                Terminal: {machineId} • Fast Worker Issue Logging
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

          {/* Piece selection */}
          <div>
            <label htmlFor="problem-piece-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Affected Piece
            </label>
            <select
              id="problem-piece-select"
              value={selectedPieceId}
              onChange={(e) => setSelectedPieceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              {activePieces.map((p) => (
                <option key={p.id} value={p.id}>
                  Piece #{p.pieceNumber} — {p.id} ({p.dimensions.widthMm}x{p.dimensions.heightMm}mm, {p.dimensions.thicknessMm}mm)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Predefined Reason grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Defect / Damage Reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_REASONS.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span>{r}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional short note */}
          <div>
            <label htmlFor="problem-note-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Operator Note (Optional)
            </label>
            <input
              id="problem-note-input"
              type="text"
              placeholder="e.g. Corner chipped during loading or edge cracked"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging...' : 'Submit Defect Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
