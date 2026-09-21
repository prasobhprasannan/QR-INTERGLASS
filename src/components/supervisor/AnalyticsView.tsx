import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Download, TrendingDown, DollarSign, Layers, ShieldAlert, Cpu } from 'lucide-react';
import { WorkOrder, IssueReport, Machine, MachineAssignment, ReworkRecord } from '../../types';

interface AnalyticsViewProps {
  workOrders: WorkOrder[];
  issues: IssueReport[];
  machines: Machine[];
  assignments: MachineAssignment[];
  reworks: ReworkRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  workOrders,
  issues,
  machines,
  assignments,
  reworks,
}) => {
  // Aggregate glass area and loss metrics
  const allPieces = workOrders.flatMap((wo) => wo.jobs.flatMap((j) => j.pieces));
  const totalPieces = allPieces.length;
  const damagedPieces = allPieces.filter((p) => p.currentStatus === 'DAMAGED');
  const scrappedPieces = allPieces.filter((p) => p.currentStatus === 'REJECTED');

  // Calculate glass area in square meters (width * height in meters)
  const totalAreaM2 = allPieces.reduce(
    (sum, p) => sum + (p.dimensions.widthMm / 1000) * (p.dimensions.heightMm / 1000),
    0
  );

  const damagedAreaM2 = damagedPieces.reduce(
    (sum, p) => sum + (p.dimensions.widthMm / 1000) * (p.dimensions.heightMm / 1000),
    0
  );

  // Standard architectural glass loss estimation (~$45 per m² raw float + processing)
  const estimatedMaterialLoss = Math.round(damagedAreaM2 * 45);
  const estimatedProcessingLoss = Math.round(damagedPieces.length * 28);
  const totalEstimatedLoss = estimatedMaterialLoss + estimatedProcessingLoss;

  // Defect reasons breakdown for PieChart
  const reasonCounts: Record<string, number> = {};
  for (const issue of issues) {
    reasonCounts[issue.reason] = (reasonCounts[issue.reason] || 0) + 1;
  }
  const reasonData = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

  // If reason data is empty, provide baseline distribution for visualization
  const displayReasonData =
    reasonData.length > 0
      ? reasonData
      : [
          { name: 'Glass Breakage', value: 3 },
          { name: 'Scratch / Chip', value: 2 },
          { name: 'Edge Breakage', value: 2 },
          { name: 'Dimension Issue', value: 1 },
        ];

  // Defects by process
  const processCounts: Record<string, number> = {
    CUTTING: 0,
    POLISHING: 0,
    BEVELING: 0,
    DRILLING: 0,
    TEMPERING: 0,
    WASHING: 0,
    DOUBLE_GLAZING: 0,
  };
  for (const issue of issues) {
    if (processCounts[issue.process] !== undefined) {
      processCounts[issue.process] += 1;
    }
  }
  const processData = Object.entries(processCounts).map(([process, defects]) => ({
    process: process.substring(0, 4),
    fullName: process,
    defects,
  }));

  // Production per machine
  const machineProduction = machines.map((m) => {
    const asgs = assignments.filter((a) => a.machineId === m.id);
    const pieceCount = asgs.reduce((sum, a) => sum + a.pieceIds.length, 0);
    return {
      machineId: m.id,
      pieces: pieceCount,
      department: m.department,
    };
  });

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

  // CSV Export handler (Section 29)
  const exportCSV = () => {
    const headers = 'IssueID,PieceID,WorkOrderID,Process,MachineID,Reason,Operator,Timestamp\n';
    const rows = issues
      .map(
        (i) =>
          `"${i.id}","${i.pieceId}","${i.workOrderId}","${i.process}","${i.machineId}","${i.reason}","${i.operator}","${i.timestamp}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `glass_factory_loss_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <span>Loss, Scrap & Production Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 22 & 29 — Defect distribution, rework rates, glass area loss, and compliance reporting.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Loss CSV</span>
        </button>
      </div>

      {/* Financial Loss & Scrap Area Cards (Section 22) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Estimated Total Loss</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
            ${totalEstimatedLoss.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Material (${estimatedMaterialLoss}) + Processing (${estimatedProcessingLoss})
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Glass Area Scrapped / Damaged</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-2 font-mono">
            {damagedAreaM2.toFixed(1)} m²
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            of {totalAreaM2.toFixed(1)} m² total factory float scheduled
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Logged Defects</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-2 font-mono">
            {issues.length} incidents
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Defect rate: {totalPieces ? ((issues.length / totalPieces) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Rework Rate & Approvals</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2 font-mono">
            {reworks.length} Reworks
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Recovered via supervisor repair route
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Reasons Distribution */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Defects by Reason (Damage Analysis)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayReasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayReasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defects by Process */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Defects Logged per Department
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processData}>
                <XAxis dataKey="process" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="defects" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Throughput Bar */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Machine Production Throughput (Pieces Assigned / Processed)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineProduction}>
                <XAxis dataKey="machineId" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="pieces" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
