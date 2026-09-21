import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Layers,
  Clock,
  User,
  Activity,
  Check,
  RotateCw,
  Search,
  ScanLine,
  HelpCircle,
  ArrowRight,
  Printer,
  Workflow,
} from 'lucide-react';
import {
  Machine,
  Piece,
  WorkOrder,
  MachineAssignment,
  UserRole,
  IssueReason,
  MachineStatus,
  Operator,
} from '../../types';
import { api } from '../../services/api';
import { getPieceProcessStatus } from '../../utils/pieceStatus';
import { ProblemReportModal } from './ProblemReportModal';
import { TransferModal } from './TransferModal';
import { LoadModal } from './LoadModal';
import { QRLabelModal } from '../common/QRLabelModal';

interface MachineTerminalProps {
  machine: Machine;
  allMachines: Machine[];
  workOrders: WorkOrder[];
  assignments: MachineAssignment[];
  operators?: Operator[];
  userRole: UserRole;
  onRefreshState: () => void;
  onOpenPieceFinder?: () => void;
}

export const MachineTerminal: React.FC<MachineTerminalProps> = ({
  machine,
  allMachines,
  workOrders,
  assignments,
  operators = [],
  userRole,
  onRefreshState,
  onOpenPieceFinder,
}) => {
  // State for active assignment on this machine
  const activeAssignment = assignments.find(
    (a) =>
      a.machineId === machine.id &&
      (a.status === 'LOADED' || a.status === 'IN_PROGRESS' || a.status === 'PAUSED')
  );

  // Active terminal operator
  const defaultOp =
    activeAssignment?.operatorName ||
    machine.currentOperator ||
    operators.find((o) => o.assignedMachineId === machine.id)?.name ||
    operators[0]?.name ||
    'Marco Silva';
  const [terminalOperator, setTerminalOperator] = useState<string>(defaultOp);

  useEffect(() => {
    if (activeAssignment?.operatorName) {
      setTerminalOperator(activeAssignment.operatorName);
    } else if (machine.currentOperator) {
      setTerminalOperator(machine.currentOperator);
    } else {
      const match = operators.find((o) => o.assignedMachineId === machine.id);
      if (match) setTerminalOperator(match.name);
    }
  }, [machine.id, machine.currentOperator, activeAssignment?.operatorName, operators]);

  // Derive pieces for active assignment
  const activePieces: Piece[] = [];
  if (activeAssignment) {
    for (const wo of workOrders) {
      for (const job of wo.jobs) {
        for (const p of job.pieces) {
          if (activeAssignment.pieceIds.includes(p.id)) {
            activePieces.push(p);
          }
        }
      }
    }
  }

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modals state
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [scannedWorkOrder, setScannedWorkOrder] = useState<WorkOrder | null>(null);
  const [eligiblePieces, setEligiblePieces] = useState<Piece[]>([]);
  const [ineligibleReasons, setIneligibleReasons] = useState<
    { pieceId: string; pieceNumber: number; reason: string }[]
  >([]);

  const [selectedPieceIdsToComplete, setSelectedPieceIdsToComplete] = useState<string[]>([]);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // QR Print Label state
  const [qrModalData, setQrModalData] = useState<{
    workOrder: WorkOrder;
    job?: WorkOrder['jobs'][0];
    piece?: Piece;
    stage?: 'CUTTING' | 'DELIVERY' | 'GENERAL';
  } | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Find the WorkOrder active on this machine if any
  const activeWorkOrder = activeAssignment
    ? workOrders.find((w) => w.id === activeAssignment.workOrderId)
    : null;

  // Derive completed vs remaining pieces in current active assignment
  const completedPieceIds = activeAssignment?.completedPieceIds || [];
  const completedPieces = activePieces.filter(
    (p) =>
      completedPieceIds.includes(p.id) ||
      p.currentStatus === 'COMPLETED' ||
      (p.currentStatus === 'AVAILABLE' && p.currentMachineId !== machine.id)
  );
  const remainingPieces = activePieces.filter(
    (p) =>
      !completedPieceIds.includes(p.id) &&
      p.currentStatus !== 'COMPLETED' &&
      p.currentStatus !== 'DAMAGED' &&
      p.currentStatus !== 'REJECTED'
  );
  const damagedCount = activePieces.filter((p) => p.currentStatus === 'DAMAGED').length;
  const progressPct =
    activePieces.length > 0 ? Math.round((completedPieces.length / activePieces.length) * 100) : 0;

  // Upcoming Work Pipeline: Work Orders and pieces where this machine's department is the NEXT upcoming process
  // Note: Cutting table starts the entire glass manufacturing process; it has no upstream queue
  const upcomingWorkOrders = useMemo(() => {
    if (machine.department === 'CUTTING') {
      return [];
    }
    const list: {
      workOrder: WorkOrder;
      job: WorkOrder['jobs'][0];
      piecesCount: number;
      upstreamOp: string;
      upstreamMachineId?: string;
      isUpstreamComplete: boolean;
      routeSequence: string[];
    }[] = [];

    for (const wo of workOrders) {
      if (wo.status === 'COMPLETED' || wo.status === 'DELIVERED') continue;
      for (const job of wo.jobs) {
        const targetOpIdx = job.route.indexOf(machine.department);
        if (targetOpIdx === -1) continue;

        // Pieces where currentOperationIndex <= targetOpIdx and not finished
        const inboundPieces = job.pieces.filter((p) => {
          if (p.currentStatus === 'REJECTED' || p.currentStatus === 'COMPLETED' || p.currentStatus === 'DAMAGED') {
            return false;
          }
          if (activeAssignment?.pieceIds.includes(p.id)) return false;
          return p.currentOperationIndex <= targetOpIdx;
        });

        if (inboundPieces.length > 0) {
          const readyToLoadCount = inboundPieces.filter(
            (p) => p.currentOperationIndex === targetOpIdx && p.currentStatus === 'AVAILABLE'
          ).length;

          const upstreamOp = targetOpIdx > 0 ? job.route[targetOpIdx - 1] : 'RELEASE';
          const upstreamAssignment = assignments.find(
            (a) =>
              a.workOrderId === wo.id &&
              a.operation === upstreamOp &&
              (a.status === 'RUNNING' || a.status === 'LOADED' || a.status === 'IN_PROGRESS' || a.status === 'PAUSED')
          );

          list.push({
            workOrder: wo,
            job,
            piecesCount: inboundPieces.length,
            upstreamOp,
            upstreamMachineId: upstreamAssignment?.machineId,
            isUpstreamComplete: readyToLoadCount > 0,
            routeSequence: job.route,
          });
        }
      }
    }
    return list;
  }, [workOrders, machine.department, assignments, activeAssignment]);

  // USB Scanner auto-capture support: when user types / scans barcodes, keep focus or submit on Enter
  const handleScanSubmit = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = (customCode || scanInput).trim();
    if (!code) return;

    setScanFeedback({ type: 'info', message: `Resolving identifier ${code}...` });
    try {
      const result = await api.resolveScan(code);
      if (result.type === 'JOB' && result.job && result.workOrder) {
        const wo: WorkOrder = result.workOrder;
        const job = result.job;
        setScannedWorkOrder(wo);
        // Fetch eligible pieces for this machine and filter by this specific job
        const eligibleData = await api.getEligiblePieces(machine.id, wo.id);
        const jobEligible = eligibleData.eligiblePieces.filter((p: Piece) => p.jobId === job.id);
        setEligiblePieces(jobEligible);
        setIneligibleReasons(eligibleData.ineligibleReasons);

        if (jobEligible.length > 0) {
          setIsLoadModalOpen(true);
          setScanFeedback({
            type: 'success',
            message: `Job ${job.id} scanned: ${jobEligible.length} piece(s) eligible for ${machine.department}. Ready to load onto ${machine.id}.`,
          });
        } else {
          setScanFeedback({
            type: 'info',
            message: `Job ${job.id} (${job.glassSpec}): No pieces are currently ready for ${machine.department} on ${machine.id}. Check upstream stage.`,
          });
        }
      } else if (result.type === 'WORK_ORDER' && result.workOrder) {
        const wo: WorkOrder = result.workOrder;
        setScannedWorkOrder(wo);
        // Fetch eligible pieces for this machine
        const eligibleData = await api.getEligiblePieces(machine.id, wo.id);
        setEligiblePieces(eligibleData.eligiblePieces);
        setIneligibleReasons(eligibleData.ineligibleReasons);
        setIsLoadModalOpen(true);
        setScanFeedback({
          type: 'success',
          message: `Work Order ${wo.id} loaded (${eligibleData.eligiblePieces.length} pieces eligible for ${machine.department}).`,
        });
      } else if (result.type === 'PIECE' && result.piece) {
        const p: Piece = result.piece;
        // Check if this piece is in the machine's active assignment
        if (
          activeAssignment &&
          activeAssignment.pieceIds.includes(p.id) &&
          !activeAssignment.completedPieceIds?.includes(p.id) &&
          p.currentStatus !== 'DAMAGED'
        ) {
          // Immediately complete this scanned piece
          await handleCompleteIndividual(p.id);
          setScanFeedback({
            type: 'success',
            message: `Piece #${p.pieceNumber} (${p.id}) marked COMPLETED at ${machine.department}!`,
          });
        } else {
          // Individual piece scanned for loading!
          const isCurrentDepartment = p.route[p.currentOperationIndex] === machine.department;
          const isAvailable = p.currentStatus === 'AVAILABLE' || p.currentStatus === 'PAUSED';

          if (isCurrentDepartment && isAvailable) {
            // Load individual piece onto this machine
            await api.loadPieces({
              machineId: machine.id,
              workOrderId: p.workOrderId,
              mode: 'INDIVIDUAL',
              pieceIds: [p.id],
              operatorName: terminalOperator || `${userRole} Operator`,
            });
            await onRefreshState();
            setScanFeedback({
              type: 'success',
              message: `Individual Piece #${p.pieceNumber} (${p.id}) successfully LOADED onto ${machine.id}!`,
            });
          } else if (p.currentStatus === 'LOADED' || p.currentStatus === 'IN_PROGRESS') {
            setScanFeedback({
              type: 'info',
              message: `Piece #${p.pieceNumber} (${p.id}) is already active on ${p.currentMachineId || 'another machine'}.`,
            });
          } else if (!isCurrentDepartment) {
            setScanFeedback({
              type: 'info',
              message: `Piece #${p.pieceNumber} is at route step '${p.route[p.currentOperationIndex]}', not '${machine.department}'.`,
            });
          } else {
            setScanFeedback({
              type: 'info',
              message: `Piece #${p.pieceNumber} status is ${p.currentStatus}. Cannot load.`,
            });
          }
        }
      } else if (result.type === 'REWORK' && result.rework) {
        setScanFeedback({
          type: 'info',
          message: `Rework ${result.rework.id} for piece ${result.rework.originalPieceId}: Status is ${result.rework.status}.`,
        });
      }
      setScanInput('');
    } catch (err: any) {
      setScanFeedback({
        type: 'error',
        message: err.message || 'Scan error: identifier could not be verified.',
      });
    }
  };

  // Machine controls: Start
  const handleStart = async () => {
    if (!activeAssignment) return;
    setIsActionLoading(true);
    try {
      await api.startAssignment(activeAssignment.id, `${userRole} Terminal`);
      setScanFeedback({ type: 'success', message: 'Production started on batch.' });
      onRefreshState();
    } catch (err: any) {
      setScanFeedback({ type: 'error', message: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Machine controls: Pause
  const handlePause = async () => {
    if (!activeAssignment) return;
    setIsActionLoading(true);
    try {
      await api.pauseAssignment(activeAssignment.id, 'Operator pause', `${userRole} Terminal`);
      setScanFeedback({ type: 'info', message: 'Machine assignment paused.' });
      onRefreshState();
    } catch (err: any) {
      setScanFeedback({ type: 'error', message: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Machine controls: Resume
  const handleResume = async () => {
    if (!activeAssignment) return;
    setIsActionLoading(true);
    try {
      await api.startAssignment(activeAssignment.id, `${userRole} Terminal`);
      setScanFeedback({ type: 'success', message: 'Production resumed.' });
      onRefreshState();
    } catch (err: any) {
      setScanFeedback({ type: 'error', message: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Individual piece completion (Section: Individual Completion)
  const handleCompleteIndividual = async (pieceId: string) => {
    if (!activeAssignment) return;
    setIsActionLoading(true);
    try {
      const p = activePieces.find((item) => item.id === pieceId);
      const currentOp = activeAssignment.operation || machine.department;
      const nextOpIndex = (p?.currentOperationIndex ?? 0) + 1;
      const nextOp = p && nextOpIndex < p.route.length ? p.route[nextOpIndex] : 'Final Dispatch';

      const res = await api.completeIndividualPieces(
        activeAssignment.id,
        [pieceId],
        terminalOperator || `${userRole} Terminal`
      );
      setScanFeedback({
        type: 'success',
        message: `Piece #${p?.pieceNumber || ''} (${pieceId}): ${currentOp} COMPLETE • Ready for Next Process: ${nextOp} (${res.completedCount}/${activeAssignment.pieceIds.length} done).`,
      });
      setSelectedPieceIdsToComplete((prev) => prev.filter((id) => id !== pieceId));
      onRefreshState();
    } catch (err: any) {
      setScanFeedback({ type: 'error', message: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Multiple selected pieces completion
  const handleCompleteSelected = async () => {
    if (!activeAssignment || selectedPieceIdsToComplete.length === 0) return;
    setIsActionLoading(true);
    try {
      const currentOp = activeAssignment.operation || machine.department;
      const res = await api.completeIndividualPieces(
        activeAssignment.id,
        selectedPieceIdsToComplete,
        terminalOperator || `${userRole} Terminal`
      );
      setScanFeedback({
        type: 'success',
        message: `${selectedPieceIdsToComplete.length} pieces: ${currentOp} COMPLETE • Ready for next process (${res.completedCount}/${activeAssignment.pieceIds.length} done).`,
      });
      setSelectedPieceIdsToComplete([]);
      onRefreshState();
    } catch (err: any) {
      setScanFeedback({ type: 'error', message: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Complete all remaining pieces ("All Completed" - Section 12)
  const handleCompleteAll = async () => {
    if (!activeAssignment) return;
    setIsActionLoading(true);
    try {
      const currentOp = activeAssignment.operation || machine.department;
      await api.completeAssignment(activeAssignment.id, terminalOperator || `${userRole} Terminal`);
      setScanFeedback({
        type: 'success',
        message: `All ${remainingPieces.length} pieces: ${currentOp} COMPLETE • Ready for next process!`,
      });
      setSelectedPieceIdsToComplete([]);
      onRefreshState();
    } catch (err: any) {
      setScanFeedback({ type: 'error', message: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Fast problem report submit
  const handleProblemSubmit = async (pieceId: string, reason: IssueReason, note: string) => {
    await api.reportProblem({
      pieceId,
      machineId: machine.id,
      reason,
      note,
      operatorName: `${userRole} Operator`,
    });
    setScanFeedback({
      type: 'error',
      message: `Defect logged for piece ${pieceId}. Sent to supervisor rework queue.`,
    });
    onRefreshState();
  };

  // Safe transfer submit
  const handleTransferSubmit = async (params: {
    assignmentId: string;
    targetMachineId: string;
    reason: 'Breakdown' | 'Maintenance' | 'Production Balancing' | 'Other';
    note?: string;
  }) => {
    await api.transferAssignment({
      ...params,
      operatorName: terminalOperator || `${userRole} Operator`,
    });
    setScanFeedback({
      type: 'info',
      message: `Assignment safely transferred to ${params.targetMachineId}.`,
    });
    onRefreshState();
  };

  // Load pieces confirm
  const handleConfirmLoad = async (params: {
    machineId: string;
    workOrderId: string;
    mode: 'ALL' | 'QUANTITY' | 'INDIVIDUAL';
    quantity?: number;
    pieceIds?: string[];
  }) => {
    await api.loadPieces({
      ...params,
      operatorName: terminalOperator || `${userRole} Operator`,
    });
    setScanFeedback({
      type: 'success',
      message: `Pieces loaded onto ${machine.id}. Press START to begin processing.`,
    });
    onRefreshState();
  };

  // Machine status pill color
  const getStatusBadge = (status: MachineStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'RUNNING':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse';
      case 'PAUSED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'BREAKDOWN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'OFFLINE':
        return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Machine Banner / Header (Section 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-mono font-black text-xl text-white shadow-md">
            {machine.id.split('-')[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-white font-mono">
                {machine.id}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                {machine.department}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                  machine.status
                )}`}
              >
                {machine.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{machine.name}</p>
          </div>
        </div>

        {/* Operator Badge & Quick Station Shift Login */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-xs">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                Station Operator
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={terminalOperator}
                  onChange={(e) => setTerminalOperator(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {operators.map((op) => (
                    <option key={op.id} value={op.name} className="bg-slate-900 text-white">
                      {op.name} ({op.badgeNumber})
                    </option>
                  ))}
                  {!operators.some((o) => o.name === terminalOperator) && (
                    <option value={terminalOperator} className="bg-slate-900 text-white">
                      {terminalOperator}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Quick status override for supervisor/management */}
          {(userRole === 'Supervisor' || userRole === 'Management/Admin') && (
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 px-2 font-mono">Machine State:</span>
              {(['AVAILABLE', 'RUNNING', 'PAUSED', 'BREAKDOWN'] as MachineStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={async () => {
                    await api.updateMachineStatus(machine.id, st, 'Manual status change by supervisor', userRole);
                    onRefreshState();
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    machine.status === st
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner & Fast Action Bar (Section 5, 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 uppercase tracking-wider">
            <ScanLine className="w-4 h-4 text-cyan-400" />
            <span>QR Scanner & Barcode Input</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            USB Scanner Keyboard Wedge Ready • Auto-Enters on Scan
          </span>
        </div>

        <form onSubmit={(e) => handleScanSubmit(e)} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <QrCode className="w-5 h-5 text-cyan-400" />
            </div>
            <input
              id="qr-scan-input"
              ref={scanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan Job QR to load job, Piece Sticker to load piece, or enter ID..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-inner"
            />
          </div>
          <button
            type="submit"
            id="btn-scan-submit"
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Scan / Load</span>
          </button>
        </form>

        {/* Quick Demo Scan Buttons for Rapid Floor Testing */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick Floor Test:</span>
          {workOrders.map((wo) => {
            const firstJob = wo.jobs[0];
            return (
              <React.Fragment key={wo.id}>
                {firstJob && (
                  <button
                    type="button"
                    onClick={() => handleScanSubmit(undefined, firstJob.id)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-mono border border-cyan-800/60 transition-colors"
                    title={`Scan Job QR ${firstJob.id} to load job batch`}
                  >
                    Load Job {firstJob.id}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleScanSubmit(undefined, wo.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
                >
                  Scan {wo.id}
                </button>
              </React.Fragment>
            );
          })}
          <button
            type="button"
            onClick={() => handleScanSubmit(undefined, 'WO-2026-00125-J1-P001')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 text-xs font-mono border border-purple-800/60 transition-colors"
            title="Scan individual piece sticker to load or complete"
          >
            Load Individual Piece P001
          </button>
        </div>

        {/* Scan feedback alert */}
        {scanFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
              scanFeedback.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                : scanFeedback.type === 'error'
                ? 'bg-rose-950/50 border-rose-700/60 text-rose-200'
                : 'bg-cyan-950/50 border-cyan-700/60 text-cyan-200'
            }`}
          >
            {scanFeedback.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {scanFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {scanFeedback.type === 'info' && <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
            <span>{scanFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Active Work Area & Touch Controls (Section 7, 12) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Active Work on Machine</h2>
          </div>
          {activeAssignment ? (
            <div className="flex items-center gap-3">
              {activeWorkOrder && (
                <button
                  type="button"
                  onClick={() =>
                    setQrModalData({
                      workOrder: activeWorkOrder,
                      stage: machine.department === 'CUTTING' ? 'CUTTING' : 'GENERAL',
                    })
                  }
                  title="Print QR labels for this active batch"
                  className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Print QR Labels</span>
                </button>
              )}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Batch Code:</span>
                <span className="font-bold text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {activeAssignment.batchCode || activeAssignment.id}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">
              No Work Loaded
            </span>
          )}
        </div>

        {activeAssignment ? (
          <div className="space-y-6">
            {/* Active assignment details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">Operation</span>
                <span className="font-bold text-white text-sm">{activeAssignment.operation}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Loaded Pieces</span>
                <span className="font-bold text-cyan-400 text-base">{activeAssignment.pieceIds.length} pcs</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Assignment Status</span>
                <span className="font-bold text-emerald-400 text-sm">{activeAssignment.status}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Loaded At</span>
                <span className="font-mono text-slate-300 text-xs">
                  {new Date(activeAssignment.loadedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Progress summary banner */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase tracking-wider">Batch Progress:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {completedPieces.length} of {activePieces.length} Pieces Finished ({progressPct}%)
                  </span>
                  {damagedCount > 0 && (
                    <span className="text-rose-400 text-[11px] font-mono bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                      {damagedCount} Damaged
                    </span>
                  )}
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {remainingPieces.length} remaining to be processed
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {completedPieces.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-semibold">
                      {completedPieces.length} piece{completedPieces.length > 1 ? 's' : ''}: {activeAssignment.operation} COMPLETE • Ready for Next Process
                    </span>
                  </div>
                  {onOpenPieceFinder && (
                    <button
                      type="button"
                      onClick={onOpenPieceFinder}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Search className="w-3 h-3" />
                      <span>Track Piece Locations →</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tactile Large Touch Buttons (Section 7, 12) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {/* Start / Resume */}
              {activeAssignment.status === 'LOADED' || activeAssignment.status === 'PAUSED' ? (
                <button
                  id="btn-machine-start"
                  onClick={activeAssignment.status === 'PAUSED' ? handleResume : handleStart}
                  disabled={isActionLoading}
                  className="py-5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>{activeAssignment.status === 'PAUSED' ? 'Resume Processing' : 'START PRODUCTION'}</span>
                </button>
              ) : (
                <button
                  id="btn-machine-pause"
                  onClick={handlePause}
                  disabled={isActionLoading}
                  className="py-5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-base shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <Pause className="w-5 h-5 fill-white" />
                  <span>PAUSE WORK</span>
                </button>
              )}

              {/* All Completed button (Section 12: All Completed) */}
              <button
                id="btn-machine-complete-all"
                onClick={handleCompleteAll}
                disabled={isActionLoading || activeAssignment.status === 'LOADED' || remainingPieces.length === 0}
                className="py-5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-base shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Complete and release all remaining pieces in this batch"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {remainingPieces.length > 0
                    ? `ALL COMPLETED (${remainingPieces.length})`
                    : 'ALL COMPLETED ✓'}
                </span>
              </button>

              {/* Report Problem button (Section 15) */}
              <button
                id="btn-report-problem"
                onClick={() => setIsProblemModalOpen(true)}
                className="py-5 px-4 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-bold text-base shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>REPORT DEFECT</span>
              </button>

              {/* Transfer button (Section 13) */}
              <button
                id="btn-transfer-work"
                onClick={() => setIsTransferModalOpen(true)}
                className="py-5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
              >
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <span>TRANSFER LINE</span>
              </button>
            </div>

            {/* Individual Piece Completion Grid (User Request: individual completion of pieces also needed with All Completed) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Batch Pieces ({activePieces.length})
                  </span>
                  <span className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold">{completedPieces.length}</span> finished ·{' '}
                    <span className="text-cyan-400 font-bold">{remainingPieces.length}</span> active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {remainingPieces.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPieceIdsToComplete.length === remainingPieces.length) {
                            setSelectedPieceIdsToComplete([]);
                          } else {
                            setSelectedPieceIdsToComplete(remainingPieces.map((p) => p.id));
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
                      >
                        {selectedPieceIdsToComplete.length === remainingPieces.length
                          ? 'Deselect All'
                          : 'Select All Remaining'}
                      </button>

                      {selectedPieceIdsToComplete.length > 0 && (
                        <button
                          type="button"
                          id="btn-complete-selected"
                          disabled={isActionLoading || activeAssignment.status === 'LOADED'}
                          onClick={handleCompleteSelected}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete Selected ({selectedPieceIdsToComplete.length})</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {activePieces.map((p) => {
                  const isDone =
                    completedPieceIds.includes(p.id) ||
                    p.currentStatus === 'COMPLETED' ||
                    (p.currentStatus === 'AVAILABLE' && p.currentMachineId !== machine.id);
                  const isDamaged = p.currentStatus === 'DAMAGED' || p.currentStatus === 'REJECTED';
                  const isSelected = selectedPieceIdsToComplete.includes(p.id);

                  const completedOpName = activeAssignment?.operation || machine.department;
                  const currentRouteIdx = p.route.indexOf(completedOpName);
                  const nextOpName =
                    currentRouteIdx !== -1 && currentRouteIdx + 1 < p.route.length
                      ? p.route[currentRouteIdx + 1]
                      : p.currentOperationIndex + 1 < p.route.length
                      ? p.route[p.currentOperationIndex + 1]
                      : null;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-300'
                          : isDamaged
                          ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono font-bold mb-1">
                          <div className="flex items-center gap-2">
                            {!isDone && !isDamaged && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPieceIdsToComplete((prev) => [...prev, p.id]);
                                  } else {
                                    setSelectedPieceIdsToComplete((prev) =>
                                      prev.filter((id) => id !== p.id)
                                    );
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                              />
                            )}
                            <span className="text-white text-sm">Piece #{p.pieceNumber}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setQrModalData({
                                  workOrder: activeWorkOrder || workOrders[0],
                                  piece: p,
                                  stage: machine.department === 'CUTTING' ? 'CUTTING' : 'GENERAL',
                                })
                              }
                              title="Print QR sticker label for this piece"
                              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                                isDone
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isDamaged
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-800 text-cyan-300 border border-slate-700'
                              }`}
                            >
                              {isDone ? `${completedOpName} COMPLETE` : p.currentStatus}
                            </span>
                          </div>
                        </div>

                        <div className="font-mono text-[11px] text-cyan-400 truncate">{p.id}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {p.dimensions.widthMm} x {p.dimensions.heightMm} x {p.dimensions.thicknessMm}mm
                        </div>

                        {!isDone && !isDamaged && (
                          <div className="text-[11px] text-cyan-300 mt-1.5 font-mono">
                            Current: <span className="font-bold text-white">{completedOpName}</span>
                            {nextOpName && (
                              <span className="text-slate-400 font-normal"> → Next: {nextOpName}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Individual piece action button / status indicator */}
                      <div className="pt-3 mt-2 border-t border-slate-800/80">
                        {isDone ? (
                          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex flex-col gap-1 w-full text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{completedOpName} COMPLETE</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-200">
                              <div className="flex items-center gap-1">
                                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="font-semibold text-cyan-300">
                                  {nextOpName
                                    ? `Ready for Next Process: ${nextOpName}`
                                    : 'All Processes Complete • Finished Goods'}
                                </span>
                              </div>
                              {onOpenPieceFinder && (
                                <button
                                  type="button"
                                  onClick={onOpenPieceFinder}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono font-bold ml-1 shrink-0"
                                  title="Locate piece on plant floor"
                                >
                                  Track →
                                </button>
                              )}
                            </div>
                          </div>
                        ) : isDamaged ? (
                          <div className="text-rose-400 text-[11px] font-mono">
                            Sent to rework disposition
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full gap-2">
                            <button
                              type="button"
                              id={`btn-complete-piece-${p.id}`}
                              disabled={isActionLoading || activeAssignment.status === 'LOADED'}
                              onClick={() => handleCompleteIndividual(p.id)}
                              className="flex-1 py-1.5 px-2.5 bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow transition-all active:scale-95"
                              title="Complete this individual piece and release to next machine route"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete Piece</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsProblemModalOpen(true)}
                              className="px-2 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                              title="Report defect on this piece"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-cyan-400 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Machine Ready for Work</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Scan a Work Order QR above or click one of the quick scan sample buttons to view eligible glass pieces ready for{' '}
                <span className="text-cyan-400 font-bold">{machine.department}</span>.
              </p>
            </div>

            {onOpenPieceFinder && (
              <div className="pt-2 border-t border-slate-800/80 max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-xs text-slate-400">Looking for pieces you just completed?</span>
                <button
                  type="button"
                  onClick={onOpenPieceFinder}
                  className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track / Find Pieces on Floor</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Work Pipeline - Forward visibility for downstream processes (e.g. Polishing, Beveling, Tempering).
          Cutting tables start the process directly with released Work Orders, so upcoming pipeline is not shown. */}
      {machine.department !== 'CUTTING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Upcoming Work Pipeline for {machine.department}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {upcomingWorkOrders.length} Inbound
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Work orders moving through upstream routes arriving at{' '}
                  <span className="text-cyan-400 font-bold">{machine.department}</span> next
                </p>
              </div>
            </div>
          </div>

          {upcomingWorkOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-slate-800/80 rounded-xl bg-slate-950/30">
              No inbound work orders currently queued upstream for {machine.department}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {upcomingWorkOrders.map((item, idx) => (
                <div
                  key={item.workOrder.id + idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <span className="font-bold text-cyan-400">{item.workOrder.id}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {item.piecesCount} pcs inbound
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white truncate">
                      {item.workOrder.customerName || item.workOrder.projectTitle}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      Job #{item.job.id}: {item.job.glassSpec}
                    </div>

                    {/* Route sequence display highlighting current upstream -> THIS STATION */}
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                      <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Route:</span>
                      {item.routeSequence.map((step, sIdx) => {
                        const isThisStation = step === machine.department;
                        const isUpstream = step === item.upstreamOp;
                        return (
                          <React.Fragment key={step + sIdx}>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isThisStation
                                  ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                                  : isUpstream
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {step}{isThisStation ? ' (Here)' : ''}
                            </span>
                            {sIdx < item.routeSequence.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Status Banner */}
                    <div className="mt-2 text-xs flex items-center gap-1.5">
                      {item.isUpstreamComplete ? (
                        <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item.upstreamOp} Complete • Ready to Load into {machine.id}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
                          <span>
                            {item.upstreamOp} in progress
                            {item.upstreamMachineId ? ` on ${item.upstreamMachineId}` : ''}
                            {' '}→ coming to {machine.department} after {item.upstreamOp}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQrModalData({
                          workOrder: item.workOrder,
                          job: item.job,
                        })
                      }
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-cyan-400" />
                      <span>Labels</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setScanInput(item.workOrder.id);
                        await handleScanSubmit(undefined, item.workOrder.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        item.isUpstreamComplete
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <ScanLine className="w-3.5 h-3.5" />
                      <span>{item.isUpstreamComplete ? 'Load Eligible Pieces Now' : 'Inspect / Pre-load'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {scannedWorkOrder && (
        <LoadModal
          isOpen={isLoadModalOpen}
          onClose={() => setIsLoadModalOpen(false)}
          machine={machine}
          workOrder={scannedWorkOrder}
          eligiblePieces={eligiblePieces}
          ineligibleReasons={ineligibleReasons}
          onConfirmLoad={handleConfirmLoad}
        />
      )}

      {activeAssignment && (
        <>
          <ProblemReportModal
            isOpen={isProblemModalOpen}
            onClose={() => setIsProblemModalOpen(false)}
            machineId={machine.id}
            activePieces={activePieces}
            onSubmit={handleProblemSubmit}
          />

          <TransferModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            sourceMachine={machine}
            activeAssignment={activeAssignment}
            allMachines={allMachines}
            onConfirmTransfer={handleTransferSubmit}
          />
        </>
      )}

      {/* QR Code Label Print Modal */}
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
