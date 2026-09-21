import React, { useState, useEffect } from 'react';
import { Search, History, Clock, User, CheckCircle2, AlertTriangle, ArrowRight, Layers, FileText } from 'lucide-react';
import { EventLog, WorkOrder, Piece } from '../../types';
import { api } from '../../services/api';
import { getPieceProcessStatus } from '../../utils/pieceStatus';

interface TraceabilityViewProps {
  initialPieceId?: string;
  workOrders: WorkOrder[];
}

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({
  initialPieceId = '',
  workOrders,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialPieceId);
  const [selectedPieceData, setSelectedPieceData] = useState<{
    piece: Piece;
    timeline: EventLog[];
    workOrder: WorkOrder;
  } | null>(null);
  const [allLogs, setAllLogs] = useState<EventLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load general logs
  const loadLogs = async (query?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (query && query.includes('P')) {
        // Fetch piece traceability
        const data = await api.getPieceTraceability(query);
        setSelectedPieceData(data);
      } else {
        const logs = await api.getAuditLogs(query);
        setAllLogs(logs);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Trace search failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPieceId) {
      setSearchQuery(initialPieceId);
      loadLogs(initialPieceId);
    } else {
      loadLogs();
    }
  }, [initialPieceId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSelectedPieceData(null);
      loadLogs();
      return;
    }
    loadLogs(searchQuery.trim());
  };

  // Quick piece pills for testing
  const samplePieces = [
    'WO-2026-00125-J1-P001',
    'WO-2026-00125-J1-P017',
    'WO-2026-00126-J1-P005',
    'WO-2026-00127-J1-P002',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Piece History & Traceability Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 21 — Full chronological traceability: machine, operator, transfers, damage, rework decisions, and timestamps.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Piece ID (e.g. WO-2026-00125-J1-P017), Work Order, or Machine..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all shadow-md"
          >
            Trace History
          </button>
        </form>

        {/* Quick Sample Search buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
          <span className="font-medium">Quick Trace:</span>
          {samplePieces.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setSearchQuery(p);
                loadLogs(p);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono border border-slate-700 transition-colors"
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedPieceData(null);
              loadLogs();
            }}
            className="px-2 py-1 text-slate-400 hover:text-white"
          >
            Clear Filter
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-900/40 border border-rose-700 rounded-xl text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* If a specific piece is loaded */}
      {selectedPieceData && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              {(() => {
                const processStatus = getPieceProcessStatus(selectedPieceData.piece);
                return (
                  <>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xl font-mono font-black text-white">
                        {selectedPieceData.piece.id}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${processStatus.badgeClass}`}
                      >
                        {processStatus.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                      <span className="text-emerald-400 font-semibold">{processStatus.readyLabel}</span>
                      <span>•</span>
                      <span className="text-slate-400">
                        {selectedPieceData.piece.glassSpec} • {selectedPieceData.piece.dimensions.widthMm} x{' '}
                        {selectedPieceData.piece.dimensions.heightMm} x {selectedPieceData.piece.dimensions.thicknessMm}mm
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Route progression */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Route:</span>
              {selectedPieceData.piece.route.map((op, idx) => {
                const isPassed = idx < selectedPieceData.piece.currentOperationIndex;
                const isCurrent = idx === selectedPieceData.piece.currentOperationIndex;
                return (
                  <React.Fragment key={op + idx}>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isPassed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : isCurrent
                          ? 'bg-cyan-900 text-cyan-200 border border-cyan-500'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {op}
                    </span>
                    {idx < selectedPieceData.piece.route.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chronological Audit Trail ({selectedPieceData.timeline.length} events recorded)
            </h3>

            {selectedPieceData.timeline.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                No state change events recorded for this piece yet. Load or scan the piece on a machine terminal.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 py-2">
                {selectedPieceData.timeline.map((evt) => (
                  <div key={evt.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500" />
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-cyan-300">{evt.event}</span>
                        <span className="text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-3">
                        <span>
                          Actor: <strong className="text-white">{evt.actor}</strong>
                        </span>
                        {evt.newState && (
                          <span>
                            State: <span className="font-mono text-emerald-400">{evt.newState}</span>
                          </span>
                        )}
                      </div>
                      {evt.metadata && (
                        <div className="text-[11px] text-slate-400 font-mono bg-slate-900/70 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(evt.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Event Logs list */}
      {!selectedPieceData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Factory Audit Event Logs ({allLogs.length} events)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">State Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{log.event}</td>
                    <td className="py-2.5 px-3 font-mono text-white">{log.entityId}</td>
                    <td className="py-2.5 px-3 text-slate-300">{log.actor}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">
                      {log.oldState && <span className="text-slate-500">{log.oldState} → </span>}
                      <span className="text-emerald-400 font-bold">{log.newState || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
