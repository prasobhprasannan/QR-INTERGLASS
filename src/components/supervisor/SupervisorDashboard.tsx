import React from 'react';
import {
  Machine,
  WorkOrder,
  MachineAssignment,
  IssueReport,
  ReworkRecord,
  OutsourceRecord,
  OperationType,
} from '../../types';
import {
  Activity,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Truck,
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface SupervisorDashboardProps {
  machines: Machine[];
  workOrders: WorkOrder[];
  assignments: MachineAssignment[];
  issues: IssueReport[];
  reworks: ReworkRecord[];
  outsourceRecords: OutsourceRecord[];
  onSelectMachine: (machineId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  machines,
  workOrders,
  assignments,
  issues,
  reworks,
  outsourceRecords,
  onSelectMachine,
  onNavigateTab,
}) => {
  // Aggregate stats across all pieces
  const allPieces = workOrders.flatMap((wo) => wo.jobs.flatMap((j) => j.pieces));
  const totalPieces = allPieces.length;
  const completedPieces = allPieces.filter((p) => p.currentStatus === 'COMPLETED').length;
  const inProgressPieces = allPieces.filter(
    (p) => p.currentStatus === 'IN_PROGRESS' || p.currentStatus === 'LOADED'
  ).length;
  const damagedPieces = allPieces.filter((p) => p.currentStatus === 'DAMAGED').length;
  const reworkPieces = allPieces.filter((p) => p.currentStatus === 'REWORK').length;
  const rejectedPieces = allPieces.filter((p) => p.currentStatus === 'REJECTED').length;
  const availablePieces = allPieces.filter((p) => p.currentStatus === 'AVAILABLE').length;

  // Open problem reports needing supervisor action
  const openIssues = issues.filter((i) => i.status === 'OPEN');

  // Group machines by department in standard factory sequence:
  // Cutting -> Polishing -> Beveling -> Washing -> Tempering -> Sandblasting -> DG -> Packing & Delivery
  const departments: OperationType[] = [
    'CUTTING',
    'POLISHING',
    'BEVELING',
    'WASHING',
    'TEMPERING',
    'SANDBLASTING',
    'DOUBLE_GLAZING',
    'PACKING_DELIVERY',
  ];

  // Calculate pieces waiting per department
  const queueByDept: Record<OperationType, number> = {
    CUTTING: 0,
    POLISHING: 0,
    BEVELING: 0,
    DRILLING: 0,
    WASHING: 0,
    TEMPERING: 0,
    SANDBLASTING: 0,
    DOUBLE_GLAZING: 0,
    PACKING_DELIVERY: 0,
  };

  for (const p of allPieces) {
    if (p.currentStatus === 'AVAILABLE') {
      const op = p.route[p.currentOperationIndex];
      if (op && queueByDept[op] !== undefined) {
        queueByDept[op] += 1;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* High-level KPIs Bar (Section 19, 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Ordered</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalPieces}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{workOrders.length} Work Orders</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-cyan-400 font-semibold uppercase">Active In-Process</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{inProgressPieces}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Assigned to lines</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-emerald-400 font-semibold uppercase">Finished Pieces</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{completedPieces}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">
            {totalPieces ? Math.round((completedPieces / totalPieces) * 100) : 0}% Complete
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-blue-400 font-semibold uppercase">Queue / Ready</div>
          <div className="text-2xl font-black text-blue-300 mt-1 font-mono">{availablePieces}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Waiting for next step</div>
        </div>

        <div
          onClick={() => onNavigateTab('REWORK')}
          className="bg-slate-900 border border-rose-900/60 hover:border-rose-700 p-4 rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-semibold uppercase">Damaged / Open</span>
            {openIssues.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1 font-mono">{damagedPieces}</div>
          <div className="text-[11px] text-rose-400/80 mt-0.5 font-bold">
            {openIssues.length} Needs Review →
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-purple-400 font-semibold uppercase">Rework In-Flight</div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">{reworkPieces}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{reworks.length} approved cases</div>
        </div>
      </div>

      {/* Bottlenecks / Pipeline Queue Bar (Section 19, 20) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Process Flow Queue Depth (Pieces Waiting per Department)</span>
          </div>
          <span className="text-xs text-slate-400">Identifies Production Bottlenecks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {departments.map((dept) => {
            const count = queueByDept[dept];
            const isBottleneck = count > 15;
            return (
              <div
                key={dept}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isBottleneck
                    ? 'bg-amber-950/40 border-amber-700/80 shadow-xs'
                    : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold tracking-tight text-slate-400 uppercase truncate">
                  {dept.replace('_', ' ')}
                </div>
                <div
                  className={`text-xl font-black mt-1 font-mono ${
                    isBottleneck ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {count}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isBottleneck ? 'High Load' : 'Normal'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Machine Status Grid (All 13 Machines - Section 2, 7, 10, 19) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Live Machine Status Overview ({machines.length} Factory Terminals)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any machine card to open its dedicated operator terminal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {machines.map((m) => {
            const activeAsg = assignments.find(
              (a) =>
                a.machineId === m.id &&
                (a.status === 'LOADED' || a.status === 'IN_PROGRESS' || a.status === 'PAUSED')
            );

            return (
              <div
                key={m.id}
                onClick={() => onSelectMachine(m.id)}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-xl shadow-md transition-all cursor-pointer flex flex-col justify-between hover:shadow-cyan-900/20 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-white group-hover:text-cyan-300 transition-colors">
                          {m.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">
                          {m.department}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{m.name}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        m.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : m.status === 'RUNNING'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                          : m.status === 'PAUSED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : m.status === 'BREAKDOWN'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {/* Active batch info */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Active Work:</span>
                      {activeAsg ? (
                        <span className="font-bold text-cyan-400 font-mono">
                          {activeAsg.pieceIds.length} pieces
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Idle / Available</span>
                      )}
                    </div>
                    {activeAsg && (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Batch:</span>
                        <span className="font-mono text-slate-300 truncate max-w-[130px]">
                          {activeAsg.batchCode || activeAsg.id}
                        </span>
                      </div>
                    )}
                    {m.statusReason && (
                      <div className="text-[11px] text-rose-400 italic">
                        Reason: {m.statusReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/50">
                  <span>Open Terminal →</span>
                  <span className="font-mono">
                    Updated{' '}
                    {new Date(m.statusUpdatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
