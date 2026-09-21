import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  Filter,
  Shield,
  UserCheck,
  Phone,
  Award,
  AlertCircle,
  X,
} from 'lucide-react';
import { Operator, Machine, OperationType } from '../../types';
import { api } from '../../services/api';

interface OperatorsManagementViewProps {
  operators: Operator[];
  machines: Machine[];
  onRefresh: () => void;
}

const ALL_OPERATIONS: OperationType[] = [
  'CUTTING',
  'POLISHING',
  'BEVELING',
  'DRILLING',
  'WASHING',
  'TEMPERING',
  'SANDBLASTING',
  'DOUBLE_GLAZING',
  'PACKING_DELIVERY',
];

const SHIFTS = [
  'Shift A (Morning 06:00-14:00)',
  'Shift B (Evening 14:00-22:00)',
  'Shift C (Night 22:00-06:00)',
] as const;

export const OperatorsManagementView: React.FC<OperatorsManagementViewProps> = ({
  operators,
  machines,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formDept, setFormDept] = useState<OperationType>('CUTTING');
  const [formMachineId, setFormMachineId] = useState<string>('');
  const [formShift, setFormShift] = useState<(typeof SHIFTS)[number]>(
    'Shift A (Morning 06:00-14:00)'
  );
  const [formContact, setFormContact] = useState('');
  const [formCertifications, setFormCertifications] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const openAddModal = () => {
    setEditingOperator(null);
    setFormName('');
    setFormBadge(`BDG-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDept('CUTTING');
    setFormMachineId(machines[0]?.id || '');
    setFormShift('Shift A (Morning 06:00-14:00)');
    setFormContact('');
    setFormCertifications('');
    setFormStatus('ACTIVE');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (op: Operator) => {
    setEditingOperator(op);
    setFormName(op.name);
    setFormBadge(op.badgeNumber);
    setFormDept(op.department);
    setFormMachineId(op.assignedMachineId || '');
    setFormShift(op.shift);
    setFormContact(op.contactNumber || '');
    setFormCertifications(op.certifications?.join(', ') || '');
    setFormStatus(op.status);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBadge.trim()) {
      setFeedback({ type: 'error', message: 'Operator Name and Badge Number are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const certList = formCertifications
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      if (editingOperator) {
        await api.updateOperator(editingOperator.id, {
          name: formName.trim(),
          badgeNumber: formBadge.trim(),
          department: formDept,
          assignedMachineId: formMachineId || undefined,
          shift: formShift,
          contactNumber: formContact.trim() || undefined,
          certifications: certList,
          status: formStatus,
        });

        // Also if a machine was assigned, update machine's operator
        if (formMachineId) {
          await api.updateMachine(formMachineId, { currentOperator: formName.trim() });
        }

        setFeedback({
          type: 'success',
          message: `Operator ${formName} updated successfully.`,
        });
      } else {
        await api.addOperator({
          name: formName.trim(),
          badgeNumber: formBadge.trim(),
          department: formDept,
          assignedMachineId: formMachineId || undefined,
          shift: formShift,
          contactNumber: formContact.trim() || undefined,
          certifications: certList,
          status: formStatus,
        });

        if (formMachineId) {
          await api.updateMachine(formMachineId, { currentOperator: formName.trim() });
        }

        setFeedback({
          type: 'success',
          message: `New operator ${formName} registered and assigned.`,
        });
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save operator' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove operator "${name}" from the system?`)) {
      return;
    }
    try {
      await api.deleteOperator(id);
      setFeedback({ type: 'success', message: `Operator "${name}" removed.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove operator' });
    }
  };

  // Filtered operators
  const filteredOperators = operators.filter((op) => {
    const matchesSearch =
      op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.assignedMachineId && op.assignedMachineId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === 'ALL' || op.department === selectedDept;
    const matchesShift = selectedShift === 'ALL' || op.shift.includes(selectedShift);
    const matchesStatus = selectedStatus === 'ALL' || op.status === selectedStatus;

    return matchesSearch && matchesDept && matchesShift && matchesStatus;
  });

  const activeCount = operators.filter((o) => o.status === 'ACTIVE').length;
  const assignedCount = operators.filter((o) => o.assignedMachineId).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Operator Master Directory & Shift Rostering
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manager & Supervisor Control: Add new operators, edit personal badge IDs, assign machines, and schedule shifts.
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-add-operator"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Operator</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Operators</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{operators.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Plant workforce registry</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-emerald-400 font-semibold uppercase">Active on Duty</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Available for production</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-cyan-400 font-semibold uppercase">Assigned to Terminals</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{assignedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Direct machine operators</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-amber-400 font-semibold uppercase">Shift Coverage</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">3 Shifts</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Morning, Evening, Night</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, badge, terminal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Departments</option>
            {ALL_OPERATIONS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Shifts</option>
            <option value="Shift A">Shift A (Morning)</option>
            <option value="Shift B">Shift B (Evening)</option>
            <option value="Shift C">Shift C (Night)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Operators Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOperators.map((op) => {
          const assignedMachine = machines.find((m) => m.id === op.assignedMachineId);

          return (
            <div
              key={op.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm shadow-inner">
                      {op.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{op.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                          {op.badgeNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            op.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : op.status === 'ON_LEAVE'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {op.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(op)}
                      title="Edit Operator"
                      className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(op.id, op.name)}
                      title="Remove Operator"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {op.department}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Terminal:</span>
                    {assignedMachine ? (
                      <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                        {assignedMachine.id} ({assignedMachine.name.split(' ')[0]})
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">Unassigned Pool</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Shift Schedule:</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[160px]">
                      {op.shift.split(' ')[0]} {op.shift.split(' ')[1]}
                    </span>
                  </div>

                  {op.contactNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {op.contactNumber}
                      </span>
                    </div>
                  )}

                  {op.certifications && op.certifications.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>Certifications & Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {op.certifications.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openEditModal(op)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/60 cursor-pointer"
                >
                  Edit Profile & Terminal Assignment
                </button>
              </div>
            </div>
          );
        })}

        {filteredOperators.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No operators match the filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or add a new operator.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Operator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingOperator ? `Edit Operator: ${editingOperator.name}` : 'Register New Operator'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure worker details, badge ID, department, and terminal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marco Silva"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Badge Number / ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BDG-4011"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as OperationType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {ALL_OPERATIONS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Machine Terminal
                  </label>
                  <select
                    value={formMachineId}
                    onChange={(e) => setFormMachineId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="">-- Unassigned (Floor Floating) --</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} - {m.name.slice(0, 24)} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Shift</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as (typeof SHIFTS)[number])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE')
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ACTIVE">ACTIVE (Ready)</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone / Ext (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 234-8910"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Certifications & Qualifications (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CNC Cutting Level 3, Laser Alignment, Safety Handling"
                  value={formCertifications}
                  onChange={(e) => setFormCertifications(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingOperator ? 'Save Changes' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
