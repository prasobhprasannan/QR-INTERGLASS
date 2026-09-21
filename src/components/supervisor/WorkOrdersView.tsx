import React, { useState } from 'react';
import { WorkOrder, Piece, OperationType, Job, UserRole } from '../../types';
import {
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  GitFork,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  X,
  Workflow,
  Printer,
  QrCode,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { getPieceProcessStatus } from '../../utils/pieceStatus';
import { QRLabelModal } from '../common/QRLabelModal';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  onSelectPiece: (pieceId: string) => void;
  onRefresh?: () => void;
  userRole?: UserRole | string;
}

const ALL_OPERATIONS: { key: OperationType; label: string }[] = [
  { key: 'CUTTING', label: 'Cutting' },
  { key: 'POLISHING', label: 'Polishing' },
  { key: 'BEVELING', label: 'Beveling' },
  { key: 'WASHING', label: 'Washing' },
  { key: 'TEMPERING', label: 'Temper' },
  { key: 'SANDBLASTING', label: 'Sandblasting' },
  { key: 'DOUBLE_GLAZING', label: 'DG (Double Glazing)' },
  { key: 'PACKING_DELIVERY', label: 'Packing & Delivery' },
];

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  onSelectPiece,
  onRefresh,
  userRole = 'Management/Admin',
}) => {
  const [selectedWoId, setSelectedWoId] = useState<string>(workOrders[0]?.id || '');
  const activeWo = workOrders.find((w) => w.id === selectedWoId) || workOrders[0];

  const isAdmin = userRole === 'Management/Admin';

  // Route Editor Modal state
  const [editingJob, setEditingJob] = useState<{ woId: string; job: Job } | null>(null);
  const [currentRoute, setCurrentRoute] = useState<OperationType[]>([]);
  const [newStepToAdd, setNewStepToAdd] = useState<OperationType>('BEVELING');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [routeFeedback, setRouteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // QR Print Label Modal state
  const [qrModalData, setQrModalData] = useState<{
    workOrder: WorkOrder;
    job?: Job;
    piece?: Piece;
    stage?: 'CUTTING' | 'DELIVERY' | 'GENERAL';
  } | null>(null);

  if (!activeWo) return null;

  const allPieces = activeWo.jobs.flatMap((j) => j.pieces);
  const total = allPieces.length;
  const completed = allPieces.filter((p) => p.currentStatus === 'COMPLETED').length;
  const inProgress = allPieces.filter(
    (p) => p.currentStatus === 'IN_PROGRESS' || p.currentStatus === 'LOADED'
  ).length;
  const damaged = allPieces.filter((p) => p.currentStatus === 'DAMAGED').length;
  const rework = allPieces.filter((p) => p.currentStatus === 'REWORK').length;
  const available = allPieces.filter((p) => p.currentStatus === 'AVAILABLE').length;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const openRouteEditor = (job: Job) => {
    setEditingJob({ woId: activeWo.id, job });
    setCurrentRoute([...job.route]);
    setRouteFeedback(null);
  };

  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === currentRoute.length - 1) return;

    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    const updated = [...currentRoute];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setCurrentRoute(updated);
  };

  const handleRemoveStep = (index: number) => {
    if (currentRoute.length <= 1) {
      setRouteFeedback({
        type: 'error',
        message: 'A manufacturing route must have at least one operation step.',
      });
      return;
    }
    const updated = currentRoute.filter((_, i) => i !== index);
    setCurrentRoute(updated);
  };

  const handleAddStep = () => {
    setCurrentRoute([...currentRoute, newStepToAdd]);
  };

  const handleSaveRoute = async () => {
    if (!editingJob) return;
    if (currentRoute.length === 0) {
      setRouteFeedback({
        type: 'error',
        message: 'Route must have at least one operation.',
      });
      return;
    }

    setIsSavingRoute(true);
    setRouteFeedback(null);
    try {
      await api.updateJobRoute(editingJob.woId, editingJob.job.id, currentRoute, 'Production Manager');
      setRouteFeedback({
        type: 'success',
        message: `Route process updated successfully for Job ${editingJob.job.id}. Pieces synchronized.`,
      });
      onRefresh?.();
      setTimeout(() => {
        setEditingJob(null);
      }, 1000);
    } catch (err: any) {
      setRouteFeedback({
        type: 'error',
        message: err.message || 'Failed to update route',
      });
    } finally {
      setIsSavingRoute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* WO Select tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {workOrders.map((wo) => {
          const isSelected = wo.id === activeWo.id;
          const woTotal = wo.jobs.reduce((sum, j) => sum + j.pieces.length, 0);
          const woDone = wo.jobs
            .flatMap((j) => j.pieces)
            .filter((p) => p.currentStatus === 'COMPLETED').length;
          const pct = woTotal > 0 ? Math.round((woDone / woTotal) * 100) : 0;

          return (
            <button
              key={wo.id}
              onClick={() => setSelectedWoId(wo.id)}
              className={`px-4 py-2.5 rounded-xl text-left border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-cyan-300">{wo.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {pct}%
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium truncate max-w-[200px] mt-0.5">
                {wo.customerName}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected WO Header Details */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white tracking-tight font-mono">
                {activeWo.id}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                {activeWo.status}
              </span>
              <span className="text-xs font-mono text-slate-400">Ref: {activeWo.sourceSystemId}</span>
            </div>
            <p className="text-sm font-semibold text-slate-200 mt-1">{activeWo.projectTitle}</p>
            <p className="text-xs text-slate-400">Customer: {activeWo.customerReference}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Order Date</span>
                <span className="font-mono text-slate-200">
                  {new Date(activeWo.orderDate).toLocaleDateString()}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-500 block">Due Date</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {new Date(activeWo.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* QR Label Print Button for Work Order & Pieces */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-print-wo-labels"
                onClick={() => setQrModalData({ workOrder: activeWo })}
                title="Print Interglass standardized Work Order Master Label & Individual Piece QR Stickers"
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-900/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Work Order & Piece QR Stickers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar & Partial Production Breakdown */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-300">Overall Production Progress</span>
            <span className="text-cyan-400 font-mono font-bold">
              {completed} of {total} pieces completed ({completionPct}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div style={{ width: `${(completed / total) * 100}%` }} className="bg-emerald-500" title="Completed" />
            <div style={{ width: `${(inProgress / total) * 100}%` }} className="bg-cyan-500" title="In Progress" />
            <div style={{ width: `${(available / total) * 100}%` }} className="bg-blue-500" title="Waiting in Queue" />
            <div style={{ width: `${(rework / total) * 100}%` }} className="bg-purple-500" title="In Rework" />
            <div style={{ width: `${(damaged / total) * 100}%` }} className="bg-rose-500" title="Damaged" />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Completed ({completed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Active Processing ({inProgress})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Next Queue ({available})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Rework ({rework})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Damaged ({damaged})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs and Pieces Hierarchy */}
      <div className="space-y-6">
        {activeWo.jobs.map((job, idx) => (
          <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">Job #{idx + 1}: {job.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {job.quantity} pieces
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">{job.glassSpec}</p>
                <p className="text-[11px] text-slate-500">
                  Dimensions: {job.widthMm} x {job.heightMm} mm • Thickness: {job.thicknessMm}mm
                </p>
              </div>

              {/* Route Sequence Pills + Job Actions (QR & Route Editor) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Workflow className="w-3 h-3 text-cyan-400" />
                    <span>Route:</span>
                  </span>
                  {job.route.map((r, i) => (
                    <React.Fragment key={r + i}>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                        {r}
                      </span>
                      {i < job.route.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Print Job QR Label */}
                <button
                  type="button"
                  onClick={() => setQrModalData({ workOrder: activeWo, job })}
                  title="Print Job Label & stickers for this specific job"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Job QR</span>
                </button>

                {/* Change Route: Only Management/Admin can modify routes. Supervisor has read-only view. */}
                {isAdmin ? (
                  <button
                    onClick={() => openRouteEditor(job)}
                    title="Change manufacturing route sequence and processes for this job (Admin Only)"
                    className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Change Route Process</span>
                  </button>
                ) : (
                  <div
                    title="Supervisor has read-only route view. Modifying routes is restricted to Management/Admin only."
                    className="px-2.5 py-1.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-xl text-[11px] font-mono flex items-center gap-1.5 shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Route: Admin Only</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pieces Grid */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Piece Status & Tracking (Click piece to view trace, click QR to print sticker)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {job.pieces.map((p) => {
                  const processStatus = getPieceProcessStatus(p);
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all relative group ${
                        p.currentStatus === 'COMPLETED'
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                          : p.currentStatus === 'IN_PROGRESS' || p.currentStatus === 'LOADED'
                          ? 'bg-cyan-950/30 border-cyan-800/60 text-cyan-200'
                          : p.currentStatus === 'DAMAGED'
                          ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                          : p.currentStatus === 'REWORK'
                          ? 'bg-purple-950/30 border-purple-800/60 text-purple-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center font-mono font-bold">
                        <span
                          onClick={() => onSelectPiece(p.id)}
                          className="cursor-pointer hover:underline text-white"
                          title="View piece audit trace"
                        >
                          #{p.pieceNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQrModalData({ workOrder: activeWo, job, piece: p });
                            }}
                            title="Print piece QR sticker"
                            className="p-1 hover:bg-slate-800 text-cyan-400 hover:text-white rounded transition-colors"
                          >
                            <QrCode className="w-3 h-3" />
                          </button>
                          <span className="text-[9px] px-1 py-0.5 rounded uppercase font-bold truncate max-w-[85px] text-right bg-slate-800 text-cyan-300">
                            {processStatus.statusLabel}
                          </span>
                        </div>
                      </div>
                      <div
                        onClick={() => onSelectPiece(p.id)}
                        className="cursor-pointer text-[10px] text-cyan-300 truncate mt-1 font-medium"
                        title={processStatus.readyLabel}
                      >
                        {processStatus.readyLabel}
                      </div>
                      <div
                        onClick={() => onSelectPiece(p.id)}
                        className="cursor-pointer text-[10px] text-slate-500 font-mono mt-0.5"
                      >
                        Route: {Math.min(p.currentOperationIndex + 1, p.route.length)}/{p.route.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Route Process Editor Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Manufacturing Route Process
                  </h3>
                  <p className="text-xs text-slate-400">
                    Work Order: <span className="font-mono text-cyan-400">{editingJob.woId}</span> • Job: <span className="font-mono text-cyan-400">{editingJob.job.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingJob(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {routeFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  routeFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-700 text-rose-200'
                }`}
              >
                {routeFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{routeFeedback.message}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Quick Route Presets */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Route Process Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentRoute([
                        'CUTTING',
                        'POLISHING',
                        'BEVELING',
                        'WASHING',
                        'TEMPERING',
                        'SANDBLASTING',
                        'DOUBLE_GLAZING',
                        'PACKING_DELIVERY',
                      ])
                    }
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 font-medium cursor-pointer transition-colors"
                  >
                    Full Factory Route (All 8 Steps)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentRoute([
                        'CUTTING',
                        'POLISHING',
                        'BEVELING',
                        'WASHING',
                        'TEMPERING',
                        'SANDBLASTING',
                        'DOUBLE_GLAZING',
                      ])
                    }
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-emerald-300 font-medium cursor-pointer transition-colors"
                  >
                    Direct Delivery (Skip Packing)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentRoute([
                        'CUTTING',
                        'POLISHING',
                        'BEVELING',
                        'WASHING',
                        'TEMPERING',
                      ])
                    }
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-amber-300 font-medium cursor-pointer transition-colors"
                  >
                    Tempered Glass Line
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentRoute(['CUTTING', 'POLISHING', 'BEVELING', 'WASHING'])
                    }
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-purple-300 font-medium cursor-pointer transition-colors"
                  >
                    Beveled & Polished Float
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sequential Route Steps ({currentRoute.length} steps)
                </label>
                <span className="text-[11px] text-slate-500">Affects {editingJob.job.pieces.length} pieces</span>
              </div>

              {/* Steps List */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-56 overflow-y-auto">
                {currentRoute.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-[11px] text-cyan-400">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-slate-200">{step}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'UP')}
                        disabled={idx === 0}
                        title="Move step up in sequence"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'DOWN')}
                        disabled={idx === currentRoute.length - 1}
                        title="Move step down in sequence"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        title="Remove step from route"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Step */}
              <div className="pt-2 flex items-center gap-2">
                <select
                  value={newStepToAdd}
                  onChange={(e) => setNewStepToAdd(e.target.value as OperationType)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {ALL_OPERATIONS.map((op) => (
                    <option key={op.key} value={op.key}>
                      {op.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRoute}
                disabled={isSavingRoute}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingRoute ? 'Updating Route...' : 'Save Route Process Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Label Print Modal */}
      {qrModalData && (
        <QRLabelModal
          isOpen={true}
          onClose={() => setQrModalData(null)}
          workOrder={qrModalData.workOrder}
          job={qrModalData.job}
          piece={qrModalData.piece}
        />
      )}
    </div>
  );
};
