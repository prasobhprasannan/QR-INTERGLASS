import React, { useState } from 'react';
import { Plus, Check, AlertCircle, Edit3, User, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { Machine, OperationType, Operator } from '../../types';
import { api } from '../../services/api';

interface MachinesMasterViewProps {
  machines: Machine[];
  operators?: Operator[];
  onRefresh: () => void;
}

const ALL_OPERATIONS: { key: OperationType; label: string; description: string }[] = [
  { key: 'CUTTING', label: 'Cutting', description: 'Raw glass scoring & CNC cutting table' },
  { key: 'POLISHING', label: 'Polishing', description: 'Straight-line edging & flat edge polish' },
  { key: 'BEVELING', label: 'Beveling', description: 'Decorative beveling & miter edge profiling' },
  { key: 'WASHING', label: 'Washing', description: 'High-speed glass washing & deionized drying' },
  { key: 'TEMPERING', label: 'Temper (Tempering)', description: 'Thermal convection furnace toughening' },
  { key: 'SANDBLASTING', label: 'Sandblasting', description: 'Frosted etching & surface abrasive treatment' },
  { key: 'DOUBLE_GLAZING', label: 'DG (Double Glazing)', description: 'IGU dual-seal insulating unit robotic line' },
  { key: 'PACKING_DELIVERY', label: 'Packing & Delivery', description: 'Direct delivery dispatch staging & crating' },
];

export const MachinesMasterView: React.FC<MachinesMasterViewProps> = ({
  machines,
  operators = [],
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // Add Form State (Single dedicated operation only)
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState<OperationType>('CUTTING');
  const [newOperator, setNewOperator] = useState<string>('');

  // Edit Form State (Single dedicated operation only)
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState<OperationType>('CUTTING');
  const [editOperator, setEditOperator] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleOpenEdit = (m: Machine) => {
    setEditingMachine(m);
    setEditName(m.name);
    setEditDept(m.department);
    setEditOperator(m.currentOperator || '');
    setFeedback(null);
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) {
      setFeedback({ type: 'error', message: 'Machine ID and Name are required.' });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      // Work station single capability constraint: workstation can only do one thing at a time
      await api.addMachine({
        id: newId.toUpperCase().trim(),
        name: newName.trim(),
        department: newDept,
        capabilities: [newDept],
        status: 'AVAILABLE',
        currentOperator: newOperator || undefined,
      });
      setFeedback({
        type: 'success',
        message: `Machine terminal ${newId.toUpperCase()} configured for dedicated operation [${newDept}].`,
      });
      setIsAddModalOpen(false);
      setNewId('');
      setNewName('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add machine' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      // Work station single capability constraint: workstation can only do one thing at a time
      await api.updateMachine(editingMachine.id, {
        name: editName.trim(),
        department: editDept,
        capabilities: [editDept],
        currentOperator: editOperator.trim() || undefined,
      });
      setFeedback({
        type: 'success',
        message: `Workstation ${editingMachine.id} updated: dedicated to [${editDept}] only.`,
      });
      setEditingMachine(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update machine' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Workstations & Machine Terminals Setup
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure workstation assignments, dedicated single-purpose operations, and assigned operators.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setNewId('');
            setNewName('');
            setNewDept('CUTTING');
            setNewOperator('');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Workstation</span>
        </button>
      </div>

      {/* Factory Constraint Rule Callout */}
      <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 flex items-center gap-3 text-xs text-cyan-200">
        <Info className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          <strong className="font-semibold text-white">Single Operation Rule: </strong>
          A workstation can only do one thing at a time (e.g. a cutting machine can only do cutting, a polishing machine only polishes). Work orders progress through sequential workstations along the route.
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/60 border-rose-700 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Machines Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
          <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Terminal ID</th>
              <th className="py-3 px-4">Machine Name</th>
              <th className="py-3 px-4">Dedicated Operation</th>
              <th className="py-3 px-4">Assigned Operator</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {machines.map((m) => {
              const operatorMatch = operators.find(
                (o) => o.assignedMachineId === m.id || o.name === m.currentOperator
              );
              const opMeta = ALL_OPERATIONS.find((o) => o.key === m.department);

              return (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{m.id}</td>
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div>{m.name}</div>
                    {opMeta && (
                      <div className="text-[11px] text-slate-500 font-normal">{opMeta.description}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-mono font-bold text-[11px]">
                      <span>{opMeta?.label || m.department}</span>
                      <span className="text-[10px] text-cyan-400/70 font-sans font-normal">(Dedicated)</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {m.currentOperator || operatorMatch ? (
                      <span className="flex items-center gap-1.5 text-slate-200 font-medium text-[11px]">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{m.currentOperator || operatorMatch?.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">None assigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        m.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : m.status === 'RUNNING'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : m.status === 'PAUSED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700/60 inline-flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Change Workstation Process</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Machine Modal */}
      {editingMachine && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Configure Workstation: <span className="text-cyan-400 font-mono">{editingMachine.id}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  A workstation performs strictly one operation at a time.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Machine Terminal Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Dedicated Operation (Workstation can only do ONE thing at a time)
                </label>
                <div className="space-y-2">
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value as OperationType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500"
                  >
                    {ALL_OPERATIONS.map((op) => (
                      <option key={op.key} value={op.key}>
                        {op.label} — {op.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-cyan-300">Selected: {editDept}</span>. This workstation will exclusively execute {editDept} operations.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Assigned Operator
                </label>
                <select
                  value={editOperator}
                  onChange={(e) => setEditOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- None (Floating) --</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.name}>
                      {op.name} ({op.badgeNumber}) - {op.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMachine(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Dedicated Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-white">Add New Dedicated Workstation</h3>
            <p className="text-xs text-slate-400">
              Each workstation performs strictly one manufacturing operation at a time.
            </p>

            <form onSubmit={handleAddMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Machine Terminal ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. CUT-03, POL-03, BEV-03, SND-02"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Machine Name / Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bystronic CNC Table 3"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Dedicated Operation (Workstation can only do one thing)
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value as OperationType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                >
                  {ALL_OPERATIONS.map((op) => (
                    <option key={op.key} value={op.key}>
                      {op.label} — {op.description}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Single-operation constraint: workstation is locked strictly to this process.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Initial Operator
                </label>
                <select
                  value={newOperator}
                  onChange={(e) => setNewOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- None (Floating) --</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.name}>
                      {op.name} ({op.badgeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Deploy Workstation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
