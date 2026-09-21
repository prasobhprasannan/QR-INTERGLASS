import React, { useState } from 'react';
import { Layers, X, CheckSquare, Square, AlertCircle, Play } from 'lucide-react';
import { Machine, Piece, WorkOrder } from '../../types';

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine;
  workOrder: WorkOrder;
  eligiblePieces: Piece[];
  ineligibleReasons: { pieceId: string; pieceNumber: number; reason: string }[];
  onConfirmLoad: (params: {
    machineId: string;
    workOrderId: string;
    mode: 'ALL' | 'QUANTITY' | 'INDIVIDUAL';
    quantity?: number;
    pieceIds?: string[];
  }) => Promise<void>;
}

export const LoadModal: React.FC<LoadModalProps> = ({
  isOpen,
  onClose,
  machine,
  workOrder,
  eligiblePieces,
  ineligibleReasons,
  onConfirmLoad,
}) => {
  const [loadMode, setLoadMode] = useState<'ALL' | 'QUANTITY' | 'INDIVIDUAL'>('ALL');
  const [quantity, setQuantity] = useState<number>(Math.min(25, eligiblePieces.length || 1));
  const [selectedPieceIds, setSelectedPieceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePiece = (id: string) => {
    setSelectedPieceIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllIndividual = () => {
    setSelectedPieceIds(eligiblePieces.map((p) => p.id));
  };

  const clearAllIndividual = () => {
    setSelectedPieceIds([]);
  };

  const handleLoad = async () => {
    setErrorMsg(null);
    if (eligiblePieces.length === 0) {
      setErrorMsg(`No eligible pieces ready for ${machine.department} on ${machine.id}.`);
      return;
    }

    if (loadMode === 'INDIVIDUAL' && selectedPieceIds.length === 0) {
      setErrorMsg('Please select at least one piece to load.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmLoad({
        machineId: machine.id,
        workOrderId: workOrder.id,
        mode: loadMode,
        quantity: loadMode === 'QUANTITY' ? quantity : undefined,
        pieceIds: loadMode === 'INDIVIDUAL' ? selectedPieceIds : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load pieces.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-cyan-950/70 border-b border-cyan-800/60 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/30 text-cyan-400 border border-cyan-500/40">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Load Pieces to {machine.id}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-300 font-mono">
                  {machine.department}
                </span>
              </h3>
              <p className="text-xs text-cyan-300 font-mono">
                {workOrder.id} • {workOrder.customerName}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-900/40 border border-rose-700 rounded-xl text-rose-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick stats banner */}
          <div className="grid grid-cols-3 gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 text-center">
            <div>
              <div className="text-xs text-slate-400">Total WO Pieces</div>
              <div className="text-lg font-bold text-slate-200">
                {workOrder.jobs.reduce((sum, j) => sum + j.pieces.length, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-cyan-400 font-medium">Ready for {machine.department}</div>
              <div className="text-lg font-bold text-cyan-300">{eligiblePieces.length}</div>
            </div>
            <div>
              <div className="text-xs text-amber-400 font-medium">Other Stage / Busy</div>
              <div className="text-lg font-bold text-amber-300">{ineligibleReasons.length}</div>
            </div>
          </div>

          {/* Load Mode Selector (Section 8) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Choose Loading Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLoadMode('ALL')}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  loadMode === 'ALL'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-xs'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">Load All</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  All {eligiblePieces.length} available
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLoadMode('QUANTITY')}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  loadMode === 'QUANTITY'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-xs'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">Load Quantity</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Next N available
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLoadMode('INDIVIDUAL')}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  loadMode === 'INDIVIDUAL'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-xs'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-sm">Individual Pieces</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Select specific IDs
                </div>
              </button>
            </div>
          </div>

          {/* Quantity Mode Input */}
          {loadMode === 'QUANTITY' && (
            <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="quantity-input" className="text-xs font-semibold uppercase text-slate-300">
                  Select Number of Pieces:
                </label>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {quantity} of {eligiblePieces.length} available
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="quantity-input"
                  type="number"
                  min={1}
                  max={eligiblePieces.length}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(eligiblePieces.length, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-28 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-center text-lg font-bold text-white focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="range"
                  min={1}
                  max={eligiblePieces.length}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  aria-label="Adjust piece quantity"
                  className="flex-1 accent-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Individual Mode Table */}
          {loadMode === 'INDIVIDUAL' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Select Pieces ({selectedPieceIds.length} chosen):
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllIndividual}
                    className="text-cyan-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={clearAllIndividual}
                    className="text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-700 rounded-xl divide-y divide-slate-800 bg-slate-950/40">
                {eligiblePieces.map((p) => {
                  const isChecked = selectedPieceIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePiece(p.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-cyan-950/50' : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-cyan-400">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">
                            Piece #{p.pieceNumber} — <span className="font-mono text-cyan-300">{p.id}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.dimensions.widthMm} x {p.dimensions.heightMm} mm • {p.dimensions.thicknessMm}mm
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        Step {p.currentOperationIndex + 1}/{p.route.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ineligible pieces preview info (Section 28 clear business messages) */}
          {ineligibleReasons.length > 0 && (
            <details className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-xs">
              <summary className="text-slate-400 hover:text-slate-200 cursor-pointer font-medium flex items-center justify-between">
                <span>View {ineligibleReasons.length} pieces not currently eligible for {machine.id}</span>
                <span className="text-[10px] text-slate-500">Click to expand</span>
              </summary>
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pt-2 border-t border-slate-700/50">
                {ineligibleReasons.slice(0, 15).map((r) => (
                  <div key={r.pieceId} className="flex items-start gap-2 text-slate-400">
                    <span className="font-mono text-slate-300 shrink-0">#{r.pieceNumber}:</span>
                    <span className="text-amber-300/80">{r.reason}</span>
                  </div>
                ))}
                {ineligibleReasons.length > 15 && (
                  <div className="text-slate-500 italic text-[11px]">
                    ...and {ineligibleReasons.length - 15} more
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-950/70 border-t border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            {loadMode === 'ALL' && `Will load all ${eligiblePieces.length} pieces`}
            {loadMode === 'QUANTITY' && `Will load ${quantity} of ${eligiblePieces.length} pieces`}
            {loadMode === 'INDIVIDUAL' && `Will load ${selectedPieceIds.length} selected pieces`}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLoad}
              disabled={isSubmitting || eligiblePieces.length === 0}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Assigning...' : 'Confirm & Load Pieces'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
