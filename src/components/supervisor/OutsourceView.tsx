import React, { useState } from 'react';
import { Truck, PackageCheck, AlertCircle, Calendar, Plus, Layers, ArrowRight } from 'lucide-react';
import { OutsourceRecord, WorkOrder, Piece } from '../../types';
import { api } from '../../services/api';

interface OutsourceViewProps {
  outsourceRecords: OutsourceRecord[];
  workOrders: WorkOrder[];
  onRefresh: () => void;
}

export const OutsourceView: React.FC<OutsourceViewProps> = ({
  outsourceRecords,
  workOrders,
  onRefresh,
}) => {
  // Find pieces whose current operation is TEMPERING and are AVAILABLE
  const eligibleTemperingPieces: Piece[] = [];
  for (const wo of workOrders) {
    for (const j of wo.jobs) {
      for (const p of j.pieces) {
        if (p.currentStatus === 'AVAILABLE' && p.route[p.currentOperationIndex] === 'TEMPERING') {
          eligibleTemperingPieces.push(p);
        }
      }
    }
  }

  // Dispatch form state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState('Saint-Gobain Advanced Tempering Ltd');
  const [selectedPieceIds, setSelectedPieceIds] = useState<string[]>([]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-09-25');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Receive form state
  const [receivingRecordId, setReceivingRecordId] = useState<string | null>(null);
  const [receivedPieceIds, setReceivedPieceIds] = useState<string[]>([]);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const activeReceivingRecord = outsourceRecords.find((r) => r.id === receivingRecordId);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPieceIds.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one piece to dispatch.' });
      return;
    }
    setIsSubmittingDispatch(true);
    setFeedback(null);
    try {
      await api.dispatchOutsource({
        vendorName,
        pieceIds: selectedPieceIds,
        expectedReturnDate,
        notes: dispatchNotes,
        operatorName: 'Supervisor Logistics',
      });
      setFeedback({
        type: 'success',
        message: `Dispatched ${selectedPieceIds.length} pieces to ${vendorName}.`,
      });
      setIsDispatchModalOpen(false);
      setSelectedPieceIds([]);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Dispatch failed' });
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingRecordId || receivedPieceIds.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one piece received.' });
      return;
    }
    setIsSubmittingReceive(true);
    setFeedback(null);
    try {
      await api.receiveOutsource({
        recordId: receivingRecordId,
        receivedPieceIds,
        notes: receiveNotes,
        operatorName: 'Supervisor Logistics',
      });
      setFeedback({
        type: 'success',
        message: `Received ${receivedPieceIds.length} pieces from vendor. Released to Washing queue.`,
      });
      setReceivingRecordId(null);
      setReceivedPieceIds([]);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Receive failed' });
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  const outstandingCount = outsourceRecords.reduce(
    (sum, r) => sum + (r.dispatchedCount - r.receivedCount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Outsourced Tempering Logistics Dock (OUTSOURCE)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 18 — Dispatch batches to external tempering vendors with partial receipt support & next operation release.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">At Vendor: </span>
            <span className="font-bold font-mono text-cyan-300">{outstandingCount} pieces</span>
          </div>

          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Batch</span>
          </button>
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
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Outsource Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Vendor Dispatch & Receipt Ledger ({outsourceRecords.length} batches)
          </h3>
        </div>

        {outsourceRecords.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            No active or historical outsourced tempering batches. Click "Dispatch New Batch" to send pieces.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Batch Ref</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Dispatched</th>
                  <th className="py-3 px-4">Received / Total</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {outsourceRecords.map((r) => {
                  const outstanding = r.dispatchedCount - r.receivedCount;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{r.batchReference}</td>
                      <td className="py-3.5 px-4 font-medium text-white">{r.vendorName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(r.dispatchedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-emerald-400 font-bold">{r.receivedCount}</span> /{' '}
                        <span className="text-slate-400">{r.dispatchedCount}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{outstanding}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : r.status === 'PARTIAL_RECEIVED'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setReceivingRecordId(r.id);
                              // Default to unreceived piece IDs
                              setReceivedPieceIds(
                                r.pieceIds.slice(r.receivedCount, r.dispatchedCount)
                              );
                            }}
                            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-600/50 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Pieces</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-white">Dispatch Pieces to External Tempering</h3>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Tempering Vendor Name
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>

              {/* Select available tempering pieces */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Select Pieces for Tempering ({selectedPieceIds.length} chosen)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedPieceIds(eligibleTemperingPieces.map((p) => p.id))}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Select All ({eligibleTemperingPieces.length})
                  </button>
                </div>

                {eligibleTemperingPieces.length === 0 ? (
                  <div className="p-3 bg-slate-800 rounded-xl text-xs text-slate-400">
                    No pieces currently waiting at the TEMPERING stage. Complete Cutting, Polishing, and Drilling first.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-700 rounded-xl divide-y divide-slate-800 bg-slate-950/40">
                    {eligibleTemperingPieces.map((p) => {
                      const checked = selectedPieceIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            setSelectedPieceIds((prev) =>
                              prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }
                          className={`p-2.5 flex items-center justify-between cursor-pointer text-xs ${
                            checked ? 'bg-cyan-950/50' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="font-mono font-bold text-slate-200">
                            #{p.pieceNumber} — {p.id}
                          </span>
                          <span className="text-slate-400">
                            {p.dimensions.widthMm}x{p.dimensions.heightMm}mm ({p.dimensions.thicknessMm}mm)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Notes / Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Expedited delivery for high rise glass facade"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispatch || selectedPieceIds.length === 0}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal (Supports Partial Receipt - Section 18) */}
      {activeReceivingRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Receive Pieces from {activeReceivingRecord.vendorName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Batch {activeReceivingRecord.batchReference} • Outstanding:{' '}
                {activeReceivingRecord.dispatchedCount - activeReceivingRecord.receivedCount} pieces
              </p>
            </div>

            <form onSubmit={handleReceive} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Check Received Pieces ({receivedPieceIds.length} of{' '}
                    {activeReceivingRecord.pieceIds.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setReceivedPieceIds(activeReceivingRecord.pieceIds)}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Receive All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-700 rounded-xl divide-y divide-slate-800 bg-slate-950/40">
                  {activeReceivingRecord.pieceIds.map((id, index) => {
                    const isAlreadyReceived = index < activeReceivingRecord.receivedCount;
                    const checked = receivedPieceIds.includes(id);

                    if (isAlreadyReceived) {
                      return (
                        <div key={id} className="p-2 text-xs text-slate-500 flex justify-between bg-slate-900/50">
                          <span className="font-mono line-through">{id}</span>
                          <span className="text-emerald-500/70 font-semibold">Already Received</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={id}
                        onClick={() =>
                          setReceivedPieceIds((prev) =>
                            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
                          )
                        }
                        className={`p-2.5 flex items-center justify-between cursor-pointer text-xs ${
                          checked ? 'bg-emerald-950/50 text-emerald-200' : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <span className="font-mono font-bold">{id}</span>
                        <span className="text-xs">{checked ? '✓ Ready to Receive' : 'Select'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Receiving Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visual inspection passed, glass furnace stamp verified"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingRecordId(null)}
                  className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceive || receivedPieceIds.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
                >
                  Record Receipt & Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
