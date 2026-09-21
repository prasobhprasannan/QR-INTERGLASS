import React, { useState } from 'react';
import {
  Package,
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Calendar,
  Layers,
  FileText,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  MapPin,
  Phone,
  Clock,
  Box,
  Check,
} from 'lucide-react';
import {
  FactoryState,
  PackingCrate,
  DeliveryOrder,
  CrateType,
  WorkOrder,
  Piece,
} from '../../types';
import { api } from '../../services/api';
import { QRLabelModal } from '../common/QRLabelModal';

interface PackingDeliveryViewProps {
  state: FactoryState;
  onRefresh: () => void;
  userRole?: string;
}

export const PackingDeliveryView: React.FC<PackingDeliveryViewProps> = ({
  state,
  onRefresh,
  userRole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PACKING' | 'DELIVERY'>('PACKING');
  const [isCreateCrateOpen, setIsCreateCrateOpen] = useState(false);
  const [isCreateDeliveryOpen, setIsCreateDeliveryOpen] = useState(false);
  const [selectedCrateForPacking, setSelectedCrateForPacking] = useState<PackingCrate | null>(null);
  const [selectedPieceIdsToPack, setSelectedPieceIdsToPack] = useState<string[]>([]);
  const [qrModalTarget, setQrModalTarget] = useState<{
    workOrder: WorkOrder;
    initialStage: 'CUTTING' | 'DELIVERY' | 'GENERAL';
  } | null>(null);

  // Form states for New Crate
  const [newCrateWoId, setNewCrateWoId] = useState(state.workOrders[0]?.id || '');
  const [newCrateType, setNewCrateType] = useState<CrateType>('WOODEN_CRATE');
  const [newCrateCapacity, setNewCrateCapacity] = useState(10);
  const [newCratePacker, setNewCratePacker] = useState('Lucas Vance (Dispatch QA)');
  const [newCrateNotes, setNewCrateNotes] = useState('');

  // Form states for New Delivery
  const [newDeliveryWoId, setNewDeliveryWoId] = useState(state.workOrders[0]?.id || '');
  const [deliveryMode, setDeliveryMode] = useState<'DIRECT' | 'CRATED'>('DIRECT');
  const [selectedPieceIdsForDirectDelivery, setSelectedPieceIdsForDirectDelivery] = useState<string[]>([]);
  const [newDeliveryAddress, setNewDeliveryAddress] = useState('Al Jurf Industrial Area 1, Ajman, UAE');
  const [newDeliveryPhone, setNewDeliveryPhone] = useState('+971 6 743 8922');
  const [newDeliveryDriver, setNewDeliveryDriver] = useState('Samir O’Connor');
  const [newDeliveryVehicle, setNewDeliveryVehicle] = useState('DXB-49211 (Flatbed Glass Truck with A-Rack)');
  const [selectedCrateIdsForDelivery, setSelectedCrateIdsForDelivery] = useState<string[]>([]);
  const [newDeliveryNotes, setNewDeliveryNotes] = useState('Direct dispatch: finished glass pieces loaded directly onto transport racks.');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const crates = state.crates || [];
  const deliveries = state.deliveries || [];

  // Find all pieces that have completed all their manufacturing operations across all work orders
  const allCompletedPieces: { piece: Piece; workOrder: WorkOrder }[] = [];
  for (const wo of state.workOrders) {
    for (const job of wo.jobs) {
      for (const piece of job.pieces) {
        if (
          piece.currentStatus === 'COMPLETED' ||
          piece.currentOperationIndex >= piece.route.length
        ) {
          allCompletedPieces.push({ piece, workOrder: wo });
        }
      }
    }
  }

  // Which pieces are already packed in any crate
  const packedPieceIdSet = new Set<string>();
  for (const c of crates) {
    for (const pid of c.packedPieceIds) {
      packedPieceIdSet.add(pid);
    }
  }

  // Pieces waiting to be crated
  const unpackedCompletedPieces = allCompletedPieces.filter(
    (item) => !packedPieceIdSet.has(item.piece.id)
  );

  const handleCreateCrate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const wo = state.workOrders.find((w) => w.id === newCrateWoId);
      if (!wo) throw new Error('Selected Work Order not found.');

      await api.createCrate({
        workOrderId: wo.id,
        customerName: wo.customerName,
        crateType: newCrateType,
        capacityPieces: Number(newCrateCapacity),
        packerName: newCratePacker,
        notes: newCrateNotes,
      });

      setFeedback({ type: 'success', message: 'New packing crate successfully registered.' });
      setIsCreateCrateOpen(false);
      setNewCrateNotes('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create crate.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePackPieces = async () => {
    if (!selectedCrateForPacking || selectedPieceIdsToPack.length === 0) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.packPiecesIntoCrate(
        selectedCrateForPacking.id,
        selectedPieceIdsToPack,
        'Lucas Vance (Dispatch QA)'
      );
      setFeedback({
        type: 'success',
        message: `Successfully packed ${selectedPieceIdsToPack.length} glass pieces into ${selectedCrateForPacking.crateNumber}.`,
      });
      setSelectedCrateForPacking(null);
      setSelectedPieceIdsToPack([]);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to pack pieces.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSealCrate = async (crateId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.sealCrate(crateId, 'Lucas Vance (Dispatch QA)');
      setFeedback({ type: 'success', message: `Crate ${crateId} sealed and approved for loading.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to seal crate.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDirectDelivery = (woId?: string) => {
    const targetWoId = woId || state.workOrders[0]?.id || '';
    setNewDeliveryWoId(targetWoId);
    setDeliveryMode('DIRECT');
    const eligiblePieces = unpackedCompletedPieces
      .filter((item) => item.workOrder.id === targetWoId)
      .map((item) => item.piece.id);
    setSelectedPieceIdsForDirectDelivery(eligiblePieces);
    setSelectedCrateIdsForDelivery([]);
    setIsCreateDeliveryOpen(true);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const wo = state.workOrders.find((w) => w.id === newDeliveryWoId);
      if (!wo) throw new Error('Selected Work Order not found.');

      if (deliveryMode === 'DIRECT' && selectedPieceIdsForDirectDelivery.length === 0) {
        throw new Error('Please select at least one finished piece for direct delivery.');
      }
      if (deliveryMode === 'CRATED' && selectedCrateIdsForDelivery.length === 0) {
        throw new Error('Please select at least one sealed crate for crated delivery.');
      }

      await api.createDelivery({
        workOrderId: wo.id,
        customerName: wo.customerName,
        deliveryAddress: newDeliveryAddress,
        contactPhone: newDeliveryPhone,
        driverName: newDeliveryDriver,
        vehiclePlate: newDeliveryVehicle,
        crateIds: deliveryMode === 'CRATED' ? selectedCrateIdsForDelivery : [],
        pieceIds: deliveryMode === 'DIRECT' ? selectedPieceIdsForDirectDelivery : [],
        notes: newDeliveryNotes,
      });

      setFeedback({
        type: 'success',
        message:
          deliveryMode === 'DIRECT'
            ? `Direct delivery manifest created for ${selectedPieceIdsForDirectDelivery.length} finished pieces. Crating skipped.`
            : 'Delivery manifest with crated units created successfully.',
      });
      setIsCreateDeliveryOpen(false);
      setSelectedCrateIdsForDelivery([]);
      setSelectedPieceIdsForDirectDelivery([]);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create delivery.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (deliveryId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.dispatchDelivery(deliveryId, 'Logistics Supervisor');
      setFeedback({ type: 'success', message: `Delivery ${deliveryId} dispatched to driver. Vehicle in transit.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to dispatch delivery.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelivered = async (deliveryId: string) => {
    const signature = window.prompt('Enter recipient sign-off name / ePOD stamp:', 'Site Supervisor (Received Clean)');
    if (!signature) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.markDelivered(deliveryId, signature, 'Delivery Driver');
      setFeedback({ type: 'success', message: `Delivery ${deliveryId} marked as DELIVERED with confirmed sign-off.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to mark delivered.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Packing & Delivery Logistics</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  Finished Goods Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                End-of-line glass crating, thermal QR dispatch labeling, and jobsite logistics tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeSubTab === 'PACKING' ? (
              <button
                onClick={() => setIsCreateCrateOpen(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Crate</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreateDeliveryOpen(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Create Delivery Run</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Waiting for Crating
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {unpackedCompletedPieces.length}
              </span>
              <span className="text-xs text-slate-400">finished pieces</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Crates
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {crates.filter((c) => c.status === 'PACKING').length}
              </span>
              <span className="text-xs text-slate-400">in packing</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Sealed & Ready
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {crates.filter((c) => c.status === 'SEALED').length}
              </span>
              <span className="text-xs text-slate-400">ready to load</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Deliveries
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-400 font-mono">
                {deliveries.filter((d) => d.status === 'OUT_FOR_DELIVERY' || d.status === 'READY_FOR_DISPATCH').length}
              </span>
              <span className="text-xs text-slate-400">truck runs</span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/60 border-rose-700 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-4 font-mono font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Tabs: Packing vs Delivery */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('PACKING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'PACKING'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Packing & Crating Station ({crates.length} Crates)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('DELIVERY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'DELIVERY'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery & Dispatch Logistics ({deliveries.length} Runs)</span>
        </button>
      </div>

      {/* SUB-TAB 1: PACKING & CRATING */}
      {activeSubTab === 'PACKING' && (
        <div className="space-y-6">
          {/* Unpacked Completed Pieces Buffer Alert */}
          {unpackedCompletedPieces.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Box className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-300">
                    {unpackedCompletedPieces.length} Finished Glass Pieces Ready for Delivery
                  </span>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Orders can be delivered directly to the jobsite once all fabrication steps are complete. Crating into wooden boxes is optional.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenDirectDelivery()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>Direct Deliver Order</span>
                </button>
                <button
                  onClick={() => setIsCreateCrateOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs cursor-pointer border border-slate-700"
                >
                  Optional Crating
                </button>
              </div>
            </div>
          )}

          {/* Crates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crates.map((crate) => {
              const wo = state.workOrders.find((w) => w.id === crate.workOrderId);
              const isFull = crate.packedPieceIds.length >= crate.capacityPieces;

              return (
                <div
                  key={crate.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-cyan-400 block">
                          {crate.crateNumber}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{crate.customerName}</h4>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          WO: {crate.workOrderId}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono ${
                          crate.status === 'SEALED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : crate.status === 'DISPATCHED'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : crate.status === 'DELIVERED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {crate.status}
                      </span>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Crate Type
                        </span>
                        <span className="font-semibold text-slate-200">
                          {crate.crateType.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Est. Weight
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          ~{crate.weightKgEstimated || 120} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Packed Capacity
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isFull ? 'text-emerald-400' : 'text-cyan-400'
                          }`}
                        >
                          {crate.packedPieceIds.length} / {crate.capacityPieces} PCS
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Packer QA
                        </span>
                        <span className="text-slate-300 truncate block text-[11px]">
                          {crate.packerName}
                        </span>
                      </div>
                    </div>

                    {/* Pieces preview */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Packed Pieces ({crate.packedPieceIds.length})
                      </span>
                      {crate.packedPieceIds.length === 0 ? (
                        <span className="text-slate-500 text-[11px] italic">
                          No pieces packed yet. Click "Pack Pieces" below.
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {crate.packedPieceIds.map((pid) => (
                            <span
                              key={pid}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono"
                            >
                              {pid.split('-').pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {crate.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-950/40 p-2 rounded border border-slate-800/60">
                        "{crate.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {wo && (
                        <button
                          onClick={() =>
                            setQrModalTarget({ workOrder: wo })
                          }
                          title="Print Production & Shipping QR Labels"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          <span className="text-[11px]">Print Labels</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {crate.status === 'PACKING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCrateForPacking(crate);
                              setSelectedPieceIdsToPack([]);
                            }}
                            className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold cursor-pointer transition-all"
                          >
                            Pack Pieces
                          </button>

                          {crate.packedPieceIds.length > 0 && (
                            <button
                              onClick={() => handleSealCrate(crate.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                            >
                              Seal Crate
                            </button>
                          )}
                        </>
                      )}

                      {crate.status === 'SEALED' && (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sealed & Ready</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DELIVERY & DISPATCH */}
      {activeSubTab === 'DELIVERY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deliveries.map((del) => {
              const wo = state.workOrders.find((w) => w.id === del.workOrderId);
              return (
                <div
                  key={del.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-cyan-400">
                            {del.deliveryNoteNumber}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {del.id}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{del.customerName}</h4>
                        <span className="text-xs font-mono text-slate-400">WO: {del.workOrderId}</span>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono ${
                          del.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : del.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {del.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Logistics Detail Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                            Jobsite Delivery Address
                          </span>
                          <span className="text-slate-200 font-medium">{del.deliveryAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                            Contact Phone
                          </span>
                          <span className="text-slate-200 font-mono">{del.contactPhone}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                            Driver Name
                          </span>
                          <span className="text-slate-200 font-bold">{del.driverName}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Truck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                            Vehicle Plate / Type
                          </span>
                          <span className="text-slate-200 font-mono">{del.vehiclePlate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Crates loaded */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                        <span>Assigned Crates ({del.crateIds.length})</span>
                        <span className="font-mono text-cyan-400">
                          {del.crateIds.join(', ') || 'Direct Load'}
                        </span>
                      </div>
                      {del.notes && (
                        <p className="text-[11px] text-slate-400 italic">"{del.notes}"</p>
                      )}
                    </div>

                    {del.deliveredAt && (
                      <div className="p-3 mt-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-xs flex items-center justify-between text-emerald-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ePOD Signature: <strong className="text-white">{del.recipientSignature}</strong></span>
                        </div>
                        <span className="font-mono text-[10px]">
                          {new Date(del.deliveredAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {wo && (
                        <button
                          onClick={() =>
                            setQrModalTarget({ workOrder: wo, initialStage: 'DELIVERY' })
                          }
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Dispatch Labels</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {del.status === 'READY_FOR_DISPATCH' && (
                        <button
                          onClick={() => handleDispatch(del.id)}
                          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-cyan-900/30"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Truck</span>
                        </button>
                      )}

                      {del.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleDelivered(del.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-900/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Delivery (ePOD)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Create New Crate */}
      {isCreateCrateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Packaging Crate / A-Frame</h3>
                  <p className="text-xs text-slate-400">Setup a shipping stillage or wooden crate</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateCrateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCrate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Work Order</label>
                <select
                  value={newCrateWoId}
                  onChange={(e) => setNewCrateWoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                >
                  {state.workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Crate Structure Type</label>
                  <select
                    value={newCrateType}
                    onChange={(e) => setNewCrateType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="WOODEN_CRATE">Standard Wooden Crate</option>
                    <option value="A_FRAME">Steel A-Frame Glass Rack</option>
                    <option value="STILLAGE">Heavy Stillage Crate</option>
                    <option value="GLASS_RACK">L-Frame Transport Rack</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Capacity (Pieces)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newCrateCapacity}
                    onChange={(e) => setNewCrateCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Packer QA Officer</label>
                <input
                  type="text"
                  value={newCratePacker}
                  onChange={(e) => setNewCratePacker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Packaging Protection Notes</label>
                <textarea
                  value={newCrateNotes}
                  onChange={(e) => setNewCrateNotes(e.target.value)}
                  placeholder="e.g. Foam corner blocks, Lucite interleaving powder, strapping tension..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCrateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Create Crate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pack Pieces into Crate */}
      {selectedCrateForPacking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Pack Finished Pieces into {selectedCrateForPacking.crateNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Work Order: {selectedCrateForPacking.workOrderId} • Capacity:{' '}
                  {selectedCrateForPacking.capacityPieces} pcs
                </p>
              </div>
              <button
                onClick={() => setSelectedCrateForPacking(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List eligible pieces for this Work Order */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Available Finished Pieces for Crating:
              </span>

              {(() => {
                const availableForThisWo = unpackedCompletedPieces.filter(
                  (item) => item.workOrder.id === selectedCrateForPacking.workOrderId
                );

                if (availableForThisWo.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                      No unpackaged finished pieces found for this Work Order currently.
                    </div>
                  );
                }

                return (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {availableForThisWo.map(({ piece }) => {
                      const isChecked = selectedPieceIdsToPack.includes(piece.id);
                      return (
                        <div
                          key={piece.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedPieceIdsToPack((prev) => prev.filter((id) => id !== piece.id));
                            } else {
                              setSelectedPieceIdsToPack((prev) => [...prev, piece.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-cyan-950/40 border-cyan-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 pointer-events-none"
                            />
                            <div>
                              <span className="font-mono font-bold text-cyan-300 block">
                                #{piece.pieceNumber} • {piece.id}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {piece.dimensions.widthMm} x {piece.dimensions.heightMm} x {piece.dimensions.thicknessMm}mm
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                            Processes Complete
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Selected: <strong className="text-cyan-300">{selectedPieceIdsToPack.length}</strong> pieces
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCrateForPacking(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePackPieces}
                  disabled={selectedPieceIdsToPack.length === 0 || isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Pack Selected Pieces
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Delivery Run */}
      {isCreateDeliveryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Delivery Dispatch Manifest</h3>
                  <p className="text-xs text-slate-400">Assign vehicle, driver, and crates for jobsite dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateDeliveryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Work Order</label>
                <select
                  value={newDeliveryWoId}
                  onChange={(e) => {
                    const woId = e.target.value;
                    setNewDeliveryWoId(woId);
                    const pieces = unpackedCompletedPieces
                      .filter((item) => item.workOrder.id === woId)
                      .map((item) => item.piece.id);
                    setSelectedPieceIdsForDirectDelivery(pieces);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                >
                  {state.workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.customerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Mode Switcher */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="text-slate-300 font-bold block text-xs uppercase tracking-wider">
                  Dispatch Delivery Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('DIRECT')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      deliveryMode === 'DIRECT'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Direct Delivery (Standard)</span>
                    <span className="text-[10px] font-normal opacity-80">No packing needed • Direct to site</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('CRATED')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      deliveryMode === 'CRATED'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Crated Delivery</span>
                    <span className="text-[10px] font-normal opacity-80">Packed in wooden crates</span>
                  </button>
                </div>
              </div>

              {/* DIRECT DELIVERY: Select Finished Pieces */}
              {deliveryMode === 'DIRECT' && (
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold block text-xs">
                      Finished Glass Pieces for Direct Loading:
                    </label>
                    {(() => {
                      const woPieces = unpackedCompletedPieces.filter(
                        (item) => item.workOrder.id === newDeliveryWoId
                      );
                      const allSelected =
                        woPieces.length > 0 &&
                        woPieces.every((item) =>
                          selectedPieceIdsForDirectDelivery.includes(item.piece.id)
                        );
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (allSelected) {
                              setSelectedPieceIdsForDirectDelivery([]);
                            } else {
                              setSelectedPieceIdsForDirectDelivery(
                                woPieces.map((item) => item.piece.id)
                              );
                            }
                          }}
                          className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          {allSelected ? 'Deselect All' : `Select All (${woPieces.length})`}
                        </button>
                      );
                    })()}
                  </div>

                  {(() => {
                    const woPieces = unpackedCompletedPieces.filter(
                      (item) => item.workOrder.id === newDeliveryWoId
                    );
                    if (woPieces.length === 0) {
                      return (
                        <p className="text-slate-500 italic text-[11px] py-2 text-center">
                          No unpackaged completed pieces found for this Work Order.
                        </p>
                      );
                    }
                    return (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {woPieces.map(({ piece }) => {
                          const isChecked = selectedPieceIdsForDirectDelivery.includes(piece.id);
                          return (
                            <label
                              key={piece.id}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-950/40 border-emerald-600/50 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPieceIdsForDirectDelivery((prev) => [
                                        ...prev,
                                        piece.id,
                                      ]);
                                    } else {
                                      setSelectedPieceIdsForDirectDelivery((prev) =>
                                        prev.filter((id) => id !== piece.id)
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-700 text-emerald-600 bg-slate-950"
                                />
                                <span className="font-mono font-bold text-cyan-300">
                                  #{piece.pieceNumber} • {piece.id}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {piece.dimensions.widthMm}x{piece.dimensions.heightMm}mm
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* CRATED DELIVERY: Select Sealed Crates */}
              {deliveryMode === 'CRATED' && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Assign Sealed Crates for this Run:
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
                    {crates
                      .filter((c) => c.status === 'SEALED' || c.status === 'PACKING')
                      .map((c) => {
                        const isChecked = selectedCrateIdsForDelivery.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 text-xs text-slate-300 p-1.5 rounded hover:bg-slate-900 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCrateIdsForDelivery((prev) => [...prev, c.id]);
                                } else {
                                  setSelectedCrateIdsForDelivery((prev) =>
                                    prev.filter((id) => id !== c.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-700 text-cyan-600 bg-slate-900"
                            />
                            <span className="font-mono font-bold text-cyan-400">{c.crateNumber}</span>
                            <span className="text-slate-400 font-mono">
                              ({c.packedPieceIds.length} pcs)
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">{c.status}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Delivery Handling Notes</label>
                <textarea
                  value={newDeliveryNotes}
                  onChange={(e) => setNewDeliveryNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white h-16"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDeliveryOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Create Delivery Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Label Print Modal */}
      {qrModalTarget && (
        <QRLabelModal
          isOpen={true}
          workOrder={qrModalTarget.workOrder}
          onClose={() => setQrModalTarget(null)}
        />
      )}
    </div>
  );
};
