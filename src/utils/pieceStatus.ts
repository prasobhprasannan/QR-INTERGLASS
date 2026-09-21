import { Piece, OperationType } from '../types';

export interface FormattedProcessStatus {
  statusLabel: string; // e.g. "CUTTING COMPLETE", "POLISHING COMPLETE", "TEMPERING COMPLETE"
  readyLabel: string; // e.g. "Ready for Next Process: POLISHING", "Ready for Final Dispatch"
  nextOperation?: OperationType | 'FINISHED' | string;
  lastOperation?: OperationType | string;
  badgeClass: string;
  isReadyForNext: boolean;
  isCompleted: boolean;
}

/**
 * Returns clean manufacturing status labels reflecting completed process and readiness for the next process.
 * Example:
 * If cutting was completed -> statusLabel: "CUTTING COMPLETE", readyLabel: "Ready for Next Process: POLISHING"
 * If polishing was completed -> statusLabel: "POLISHING COMPLETE", readyLabel: "Ready for Next Process: DRILLING"
 */
export function getPieceProcessStatus(
  piece: Piece,
  contextMachineDept?: OperationType
): FormattedProcessStatus {
  if (piece.currentStatus === 'DAMAGED') {
    return {
      statusLabel: 'DEFECT / DAMAGED',
      readyLabel: 'Hold in Rework Buffer',
      badgeClass: 'bg-rose-600 text-white font-bold',
      isReadyForNext: false,
      isCompleted: false,
    };
  }

  if (piece.currentStatus === 'REJECTED') {
    return {
      statusLabel: 'SCRAPPED',
      readyLabel: 'Disposed in Scrap Bin',
      badgeClass: 'bg-rose-950 text-rose-300 border border-rose-800 font-bold',
      isReadyForNext: false,
      isCompleted: false,
    };
  }

  // Active / Loaded on machine
  if (piece.currentStatus === 'LOADED' || piece.currentStatus === 'IN_PROGRESS') {
    const currentOp = piece.route[piece.currentOperationIndex] || contextMachineDept || 'PROCESSING';
    return {
      statusLabel: `${currentOp} IN PROGRESS`,
      readyLabel: `Processing on ${piece.currentMachineId || 'terminal'}`,
      nextOperation: piece.route[piece.currentOperationIndex + 1],
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse font-bold',
      isReadyForNext: false,
      isCompleted: false,
    };
  }

  if (piece.currentStatus === 'PAUSED') {
    const currentOp = piece.route[piece.currentOperationIndex] || contextMachineDept || 'PROCESSING';
    return {
      statusLabel: `${currentOp} PAUSED`,
      readyLabel: `Paused on ${piece.currentMachineId || 'terminal'}`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
      isReadyForNext: false,
      isCompleted: false,
    };
  }

  // All route steps completed
  if (
    piece.currentStatus === 'COMPLETED' ||
    piece.currentOperationIndex >= piece.route.length
  ) {
    const lastOp =
      piece.lastCompletedOperation ||
      piece.route[piece.route.length - 1] ||
      'FINAL';
    return {
      statusLabel: `${lastOp} COMPLETE`,
      readyLabel: 'All Processes Complete • Ready for Final Inspection & Dispatch',
      lastOperation: lastOp,
      nextOperation: 'FINISHED',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
      isReadyForNext: true,
      isCompleted: true,
    };
  }

  // Piece has completed previous step(s) and is ready for next step
  if (piece.currentOperationIndex > 0) {
    const lastOp =
      piece.lastCompletedOperation ||
      piece.route[piece.currentOperationIndex - 1] ||
      contextMachineDept ||
      'PREVIOUS';
    const nextOp = piece.route[piece.currentOperationIndex];
    return {
      statusLabel: `${lastOp} COMPLETE`,
      readyLabel: `Ready for Next Process: ${nextOp}`,
      lastOperation: lastOp,
      nextOperation: nextOp,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
      isReadyForNext: true,
      isCompleted: false,
    };
  }

  // Step 0: Ready for initial process
  const firstOp = piece.route[0] || 'PROCESSING';
  return {
    statusLabel: 'WAITING TO START',
    readyLabel: `Ready for 1st Process: ${firstOp}`,
    nextOperation: firstOp,
    badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700 font-bold',
    isReadyForNext: true,
    isCompleted: false,
  };
}
