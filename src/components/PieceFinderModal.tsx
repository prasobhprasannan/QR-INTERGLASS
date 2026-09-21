import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Monitor,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WorkOrder, Piece, Machine } from '../types';
import { getPieceProcessStatus } from '../utils/pieceStatus';

interface PieceFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrders: WorkOrder[];
  machines: Machine[];
  onNavigateToMachine: (machineId: string) => void;
  onNavigateToTrace: (pieceId: string) => void;
}

export const PieceFinderModal: React.FC<PieceFinderModalProps> = ({
  isOpen,
  onClose,
  workOrders,
  machines,
  onNavigateToMachine,
  onNavigateToTrace,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'DAMAGED'
  >('ALL');

  // Flatten all pieces with their parent WO and job
  const allPiecesWithContext = useMemo(() => {
    return workOrders.flatMap((wo) =>
      wo.jobs.flatMap((job) =>
        job.pieces.map((piece) => {
          const currentOp =
            piece.currentOperationIndex < piece.route.length
              ? piece.route[piece.currentOperationIndex]
              : 'FINISHED';

          // Determine compatible machines for this operation
          const compatibleMachines = machines.filter(
            (m) => m.department === currentOp || m.capabilities.includes(currentOp)
          );

          return {
            piece,
            job,
            workOrder: wo,
            currentOp,
            compatibleMachines,
          };
        })
      )
    );
  }, [workOrders, machines]);

  // Filtered pieces
  const filteredPieces = useMemo(() => {
    return allPiecesWithContext.filter(({ piece, workOrder, currentOp }) => {
      // Search matching
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        piece.id.toLowerCase().includes(query) ||
        `piece #${piece.pieceNumber}`.toLowerCase().includes(query) ||
        `#${piece.pieceNumber}`.toLowerCase().includes(query) ||
        piece.pieceNumber.toString() === query ||
        workOrder.id.toLowerCase().includes(query) ||
        workOrder.customerName.toLowerCase().includes(query) ||
        currentOp.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Status filter
      if (activeFilter === 'QUEUED') {
        return piece.currentStatus === 'AVAILABLE' && currentOp !== 'FINISHED';
      }
      if (activeFilter === 'IN_PROGRESS') {
        return piece.currentStatus === 'IN_PROGRESS' || piece.currentStatus === 'LOADED';
      }
      if (activeFilter === 'COMPLETED') {
        return piece.currentStatus === 'COMPLETED';
      }
      if (activeFilter === 'DAMAGED') {
        return piece.currentStatus === 'DAMAGED' || piece.currentStatus === 'REWORK';
      }

      return true;
    });
  }, [allPiecesWithContext, searchTerm, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full p-6 text-slate-100 flex flex-col max-h-[90vh] space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Piece Finder & Floor Location Tracker</span>
              </h3>
              <p className="text-xs text-slate-400">
                Instantly track down any glass piece, its current station, next route queue, or completed status.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type Piece # (e.g. 1, 17), Piece ID (WO-2026-00125-J1-P001), or Process name..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[11px]">Filter:</span>
          {(
            [
              { id: 'ALL', label: 'All Pieces' },
              { id: 'QUEUED', label: 'Queued / Ready for Next Step' },
              { id: 'IN_PROGRESS', label: 'Active on Line' },
              { id: 'COMPLETED', label: '100% Finished Units' },
              { id: 'DAMAGED', label: 'Damaged / In Rework' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium border transition-all ${
                activeFilter === tab.id
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-slate-500 text-xs ml-auto font-mono">
            {filteredPieces.length} found
          </span>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[300px]">
          {filteredPieces.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <div>No pieces match your filter or search query.</div>
            </div>
          ) : (
            filteredPieces.map(
              ({ piece, job, workOrder, currentOp, compatibleMachines }) => {
                const isFullyComplete = piece.currentStatus === 'COMPLETED';
                const isDamaged = piece.currentStatus === 'DAMAGED';
                const isLoaded =
                  piece.currentStatus === 'IN_PROGRESS' || piece.currentStatus === 'LOADED';
                const isQueued = piece.currentStatus === 'AVAILABLE';

                return (
                  <div
                    key={piece.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left details */}
                    <div className="space-y-1.5">
                      {(() => {
                        const processStatus = getPieceProcessStatus(piece);
                        return (
                          <>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono font-bold text-white text-base">
                                Piece #{piece.pieceNumber}
                              </span>
                              <span className="font-mono text-xs text-cyan-400">{piece.id}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {workOrder.id}
                              </span>
                              <span
                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${processStatus.badgeClass}`}
                              >
                                {processStatus.statusLabel}
                              </span>
                            </div>

                            <div className="text-xs text-slate-400 flex items-center gap-3">
                              <span>{job.glassSpec}</span>
                              <span>•</span>
                              <span>
                                {piece.dimensions.widthMm} x {piece.dimensions.heightMm} x{' '}
                                {piece.dimensions.thicknessMm} mm
                              </span>
                            </div>

                            {/* Current Location / Whereabouts Callout */}
                            <div className="pt-1 text-xs">
                              {isFullyComplete ? (
                                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>
                                    {processStatus.statusLabel} — {processStatus.readyLabel}
                                  </span>
                                </div>
                              ) : isLoaded ? (
                                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                                  <Clock className="w-4 h-4 shrink-0" />
                                  <span>
                                    Currently being processed on machine{' '}
                                    <strong className="text-white font-mono font-bold">
                                      {piece.currentMachineId || 'Active Terminal'}
                                    </strong>{' '}
                                    ({currentOp})
                                  </span>
                                </div>
                              ) : isDamaged ? (
                                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>Damaged / In Rework Queue — Awaiting Supervisor Sign-off</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                                  <ArrowRight className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span>
                                    {piece.currentOperationIndex > 0 && (
                                      <span className="text-emerald-400 font-bold mr-1.5">
                                        [{processStatus.statusLabel}]
                                      </span>
                                    )}
                                    <span className="text-white font-bold">{processStatus.readyLabel}</span>
                                    {compatibleMachines.length > 0 && (
                                      <span className="text-slate-400 font-normal">
                                        {' '}
                                        (Available stations: {compatibleMachines.map((m) => m.id).join(', ')})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {/* Route Progression Pills */}
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">
                          Route:
                        </span>
                        {piece.route.map((op, idx) => {
                          const isDone = idx < piece.currentOperationIndex;
                          const isCurrent = idx === piece.currentOperationIndex;
                          return (
                            <React.Fragment key={op + idx}>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                                  isDone
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                                    : isCurrent
                                    ? 'bg-cyan-900 text-cyan-200 border border-cyan-500 font-bold'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {op}
                              </span>
                              {idx < piece.route.length - 1 && (
                                <span className="text-[10px] text-slate-600">→</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                      {compatibleMachines.length > 0 && !isFullyComplete && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToMachine(compatibleMachines[0].id);
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 w-full justify-center"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>Go to {compatibleMachines[0].id}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToTrace(piece.id);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1.5 w-full justify-center"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Audit Trace</span>
                      </button>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>
    </div>
  );
};
