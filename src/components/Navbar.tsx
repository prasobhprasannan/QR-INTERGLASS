import React, { useState } from 'react';
import {
  Factory,
  Monitor,
  ShieldCheck,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Search,
  Lock,
  Unlock,
  User,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { UserRole, Machine, Operator } from '../types';

interface NavbarProps {
  currentView: 'TERMINAL' | 'SUPERVISOR';
  setCurrentView: (view: 'TERMINAL' | 'SUPERVISOR') => void;
  selectedMachineId: string;
  setSelectedMachineId: (id: string) => void;
  machines: Machine[];
  operators?: Operator[];
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isConnected: boolean;
  onOpenConcurrencyTest: () => void;
  onOpenPieceFinder: () => void;
  onResetDatabase: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  selectedMachineId,
  setSelectedMachineId,
  machines,
  operators = [],
  userRole,
  setUserRole,
  isConnected,
  onOpenConcurrencyTest,
  onOpenPieceFinder,
  onResetDatabase,
}) => {
  const currentMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];
  const isWorkerMode = userRole === 'Operator';

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSupervisorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default manager PIN is 1234 or allow direct sign-in
    if (supervisorPin.trim() === '1234' || supervisorPin.trim() === '') {
      setUserRole('Management/Admin');
      setCurrentView('SUPERVISOR');
      setIsLoginModalOpen(false);
      setSupervisorPin('');
      setLoginError('');
    } else {
      setLoginError('Invalid PIN. Default manager PIN is 1234 or press Enter to continue.');
    }
  };

  // 1. WORKER / OPERATOR TERMINAL VIEW: "Machine terminal is only for worker, he only needs to see that certain screen only nothing else"
  if (isWorkerMode) {
    return (
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Industrial Terminal Identifier */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold shadow-inner">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-base sm:text-lg text-slate-100 font-mono">
                    TERMINAL: {currentMachine.id}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {currentMachine.department}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                  {currentMachine.name}
                </p>
              </div>
            </div>

            {/* Center: Machine Station (Fixed & Locked by Admin - Operator cannot change) */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs shadow-inner">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  Station:
                </span>
                <span className="text-cyan-300 font-bold font-mono text-sm">
                  {currentMachine.id}
                </span>
                <span className="text-slate-400 text-xs hidden md:inline">
                  ({currentMachine.name})
                </span>
                <span className="text-[10px] font-mono uppercase bg-amber-950/70 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 font-bold ml-1">
                  Fixed Station • Admin Only
                </span>
              </div>
            </div>

            {/* Right: Machine Status & Manager Login Gate */}
            <div className="flex items-center gap-3">
              {/* Machine Status Pill */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentMachine.status === 'AVAILABLE'
                      ? 'bg-emerald-400 animate-pulse'
                      : currentMachine.status === 'RUNNING'
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono font-bold uppercase text-[11px] text-slate-300">
                  {currentMachine.status}
                </span>
              </div>

              {/* Discrete Supervisor / Management Access Button */}
              <button
                id="btn-supervisor-login"
                onClick={() => setIsLoginModalOpen(true)}
                title="Management, Supervisor & Admin Dashboard Access"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Manager / Supervisor Login</span>
                <span className="sm:hidden">Manager Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Supervisor Access PIN Modal */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-100 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Supervisor / Manager Access</h3>
                  <p className="text-xs text-slate-400">
                    Switch to management dashboard to edit operators, routes, and fleet.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSupervisorLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supervisor PIN (Default: 1234 or leave blank)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter PIN (e.g. 1234)"
                    value={supervisorPin}
                    onChange={(e) => {
                      setSupervisorPin(e.target.value);
                      setLoginError('');
                    }}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center tracking-widest text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  {loginError && (
                    <p className="text-xs text-rose-400 mt-1">{loginError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Access Management Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </header>
    );
  }

  // 2. SUPERVISOR / MANAGER / ADMIN DASHBOARD HEADER
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold shadow-inner">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg text-slate-100">
                  GLASS FACTORY MES
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Manager & Supervisor Center
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Work Orders, Operator Rostering, Route Process Configuration & Traceability
              </p>
            </div>
          </div>

          {/* View Switcher: Management Dashboard vs Worker Terminal Preview */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              id="nav-btn-supervisor"
              onClick={() => setCurrentView('SUPERVISOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'SUPERVISOR'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manager Dashboard</span>
            </button>

            <button
              id="nav-btn-terminal"
              onClick={() => setCurrentView('TERMINAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'TERMINAL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Worker Terminal</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* Station Config: Supervisor & Management/Admin can switch workstation; Operator is locked */}
            {userRole === 'Supervisor' || userRole === 'Management/Admin' ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">Station:</span>
                <select
                  id="station-select"
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  aria-label="Select Machine Station"
                  className="bg-transparent text-cyan-300 font-bold font-mono focus:outline-none cursor-pointer pr-1 text-xs"
                  title="Supervisor and Admin can switch active workstation"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.id} - {m.department}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                title="Machine station is fixed for worker operators. Supervisor or Admin can change station."
                className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs font-mono"
              >
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-[10px] text-slate-400 hidden lg:inline">Station:</span>
                <span className="text-cyan-300 font-bold text-xs">{selectedMachineId}</span>
              </div>
            )}

            {/* Find / Track Piece Location Button */}
            <button
              id="btn-piece-finder"
              onClick={onOpenPieceFinder}
              title="Track and locate any glass piece on the floor"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Track Pieces</span>
            </button>

            {/* Role dropdown */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <span className="text-slate-400 mr-1.5 font-mono text-[11px]">Role:</span>
              <select
                id="role-select"
                value={userRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setUserRole(newRole);
                  if (newRole === 'Operator') {
                    setCurrentView('TERMINAL');
                  } else {
                    setCurrentView('SUPERVISOR');
                  }
                }}
                aria-label="Active User Role"
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="Operator" className="bg-slate-900">Operator (Worker Only)</option>
                <option value="Supervisor" className="bg-slate-900">Supervisor</option>
                <option value="Management/Admin" className="bg-slate-900">Management / Admin</option>
              </select>
            </div>

            {/* Concurrency Pilot Test & Reset button - Management/Admin Only */}
            {userRole === 'Management/Admin' && (
              <>
                <button
                  id="btn-concurrency-test"
                  onClick={onOpenConcurrencyTest}
                  title="Test Atomic Concurrency & Simultaneous Scan Collision"
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="hidden lg:inline">Concurrency</span>
                </button>

                <button
                  id="btn-reset-db"
                  onClick={onResetDatabase}
                  title="Reset Demo Data"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Live SSE indicator */}
            <div
              title={isConnected ? 'Real-time Server Sync Active' : 'Disconnected from Server'}
              className="flex items-center gap-1.5 pl-1"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
