import React, { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  Monitor,
  ShieldCheck,
  RotateCw,
  Layers,
  FileText,
  AlertTriangle,
  Truck,
  History,
  TrendingDown,
  Settings,
  Zap,
  Users,
  Package,
  Server,
} from 'lucide-react';
import { FactoryState, UserRole, Machine } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { MachineTerminal } from './components/terminal/MachineTerminal';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { WorkOrdersView } from './components/supervisor/WorkOrdersView';
import { ReworkQueueView } from './components/supervisor/ReworkQueueView';
import { OutsourceView } from './components/supervisor/OutsourceView';
import { TraceabilityView } from './components/supervisor/TraceabilityView';
import { AnalyticsView } from './components/supervisor/AnalyticsView';
import { MachinesMasterView } from './components/supervisor/MachinesMasterView';
import { OperatorsManagementView } from './components/supervisor/OperatorsManagementView';
import { PackingDeliveryView } from './components/supervisor/PackingDeliveryView';
import { IntranetSyncView } from './components/supervisor/IntranetSyncView';
import { ConcurrencyTestModal } from './components/supervisor/ConcurrencyTestModal';
import { PieceFinderModal } from './components/PieceFinderModal';

export default function App() {
  const [state, setState] = useState<FactoryState | null>(null);
  const [currentView, setCurrentView] = useState<'TERMINAL' | 'SUPERVISOR'>('TERMINAL');
  const [supervisorTab, setSupervisorTab] = useState<
    'FLOOR' | 'WORK_ORDERS' | 'OPERATORS' | 'MACHINES' | 'INTRANET_SYNC' | 'PACKING_DELIVERY' | 'REWORK' | 'OUTSOURCE' | 'TRACEABILITY' | 'ANALYTICS'
  >('FLOOR');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('CUT-01');
  const [selectedPieceTraceId, setSelectedPieceTraceId] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('Operator');
  const [isConnected, setIsConnected] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [isPieceFinderOpen, setIsPieceFinderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enforce Supervisor vs Admin RBAC tab restrictions:
  // Supervisor only has FLOOR, WORK_ORDERS, OPERATORS, MACHINES.
  // PACKING_DELIVERY, REWORK, OUTSOURCE, TRACEABILITY, ANALYTICS are Management/Admin only.
  useEffect(() => {
    const isAdmin = userRole === 'Management/Admin' || (userRole as string) === 'Management / Admin';
    if (!isAdmin) {
      const adminOnlyTabs = ['PACKING_DELIVERY', 'REWORK', 'OUTSOURCE', 'TRACEABILITY', 'ANALYTICS'];
      if (adminOnlyTabs.includes(supervisorTab)) {
        setSupervisorTab('FLOOR');
      }
    }
  }, [userRole, supervisorTab]);

  // Load state from server
  const fetchState = useCallback(async () => {
    try {
      const data = await api.getState();
      setState(data);
      if (!selectedMachineId && data.machines.length > 0) {
        setSelectedMachineId(data.machines[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch factory state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMachineId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Connect to live SSE stream for real-time synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'CONNECTED') {
              setIsConnected(true);
            } else {
              // State updated, re-fetch fresh state
              fetchState();
            }
          } catch (e) {
            console.error('SSE JSON error:', e);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Retry in 3 seconds
          setTimeout(connectSSE, 3000);
        };
      } catch (e) {
        console.error('SSE initialization error:', e);
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [fetchState]);

  const handleReset = async () => {
    if (window.confirm('Reset factory production database to default seed state?')) {
      await api.resetDatabase();
      fetchState();
    }
  };

  const handleNavigateToTraceability = (pieceId: string) => {
    setSelectedPieceTraceId(pieceId);
    setCurrentView('SUPERVISOR');
    setSupervisorTab('TRACEABILITY');
  };

  if (isLoading || !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center animate-pulse shadow-lg shadow-cyan-900/40">
          <Factory className="w-6 h-6 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">Initializing Glass Factory MES...</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Connecting to authoritative production database</p>
        </div>
      </div>
    );
  }

  const selectedMachine =
    state.machines.find((m) => m.id === selectedMachineId) || state.machines[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedMachineId={selectedMachineId}
        setSelectedMachineId={setSelectedMachineId}
        machines={state.machines}
        operators={state.operators || []}
        userRole={userRole}
        setUserRole={setUserRole}
        isConnected={isConnected}
        onOpenConcurrencyTest={() => setIsConcurrencyModalOpen(true)}
        onOpenPieceFinder={() => setIsPieceFinderOpen(true)}
        onResetDatabase={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'TERMINAL' ? (
          /* Dedicated Machine Terminal (Section 7, 8, 12, 13, 15) */
          <MachineTerminal
            machine={selectedMachine}
            allMachines={state.machines}
            workOrders={state.workOrders}
            assignments={state.assignments}
            operators={state.operators || []}
            userRole={userRole}
            onRefreshState={fetchState}
            onOpenPieceFinder={() => setIsPieceFinderOpen(true)}
          />
        ) : (
          /* Supervisor & Management Center (Section 19, 20, 21, 22, 29, 30) */
          <div className="space-y-6">
            {/* Supervisor Center Sub-Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                id="tab-floor"
                onClick={() => setSupervisorTab('FLOOR')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  supervisorTab === 'FLOOR'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Live Factory Floor</span>
              </button>

              <button
                id="tab-work-orders"
                onClick={() => setSupervisorTab('WORK_ORDERS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  supervisorTab === 'WORK_ORDERS'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Work Orders & Routes</span>
              </button>

              <button
                id="tab-operators"
                onClick={() => setSupervisorTab('OPERATORS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  supervisorTab === 'OPERATORS'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Operators & Rosters ({state.operators?.length || 0})</span>
              </button>

              <button
                id="tab-machines"
                onClick={() => setSupervisorTab('MACHINES')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  supervisorTab === 'MACHINES'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Machine Fleet & Processes</span>
              </button>

              <button
                id="tab-intranet-sync"
                onClick={() => setSupervisorTab('INTRANET_SYNC')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  supervisorTab === 'INTRANET_SYNC'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Intranet Quote--RR Sync</span>
                {state.intranetQuotes &&
                  state.intranetQuotes.filter((q) => q.status === 'APPROVED' && !q.syncedWorkOrderId).length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
              </button>

              {/* Management / Admin Only Modules */}
              {(userRole === 'Management/Admin' || (userRole as string) === 'Management / Admin') && (
                <>
                  <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block shrink-0" />

                  <button
                    id="tab-packing-delivery"
                    onClick={() => setSupervisorTab('PACKING_DELIVERY')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      supervisorTab === 'PACKING_DELIVERY'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>Packing & Delivery</span>
                  </button>

                  <button
                    id="tab-rework"
                    onClick={() => setSupervisorTab('REWORK')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      supervisorTab === 'REWORK'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>
                      Rework Approvals ({state.issues.filter((i) => i.status === 'OPEN').length})
                    </span>
                  </button>

                  <button
                    id="tab-outsource"
                    onClick={() => setSupervisorTab('OUTSOURCE')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      supervisorTab === 'OUTSOURCE'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Outsourced Tempering</span>
                  </button>

                  <button
                    id="tab-traceability"
                    onClick={() => setSupervisorTab('TRACEABILITY')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      supervisorTab === 'TRACEABILITY'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Piece Traceability</span>
                  </button>

                  <button
                    id="tab-analytics"
                    onClick={() => setSupervisorTab('ANALYTICS')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      supervisorTab === 'ANALYTICS'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Loss & Scrap Analytics</span>
                  </button>
                </>
              )}
            </div>

            {/* Tab Views */}
            {supervisorTab === 'FLOOR' && (
              <SupervisorDashboard
                machines={state.machines}
                workOrders={state.workOrders}
                assignments={state.assignments}
                issues={state.issues}
                reworks={state.reworks}
                outsourceRecords={state.outsourceRecords}
                onSelectMachine={(machineId) => {
                  setSelectedMachineId(machineId);
                  setCurrentView('TERMINAL');
                }}
                onNavigateTab={(tab) => {
                  if (tab === 'REWORK') setSupervisorTab('REWORK');
                }}
              />
            )}

            {supervisorTab === 'WORK_ORDERS' && (
              <WorkOrdersView
                workOrders={state.workOrders}
                userRole={userRole}
                onSelectPiece={handleNavigateToTraceability}
                onRefresh={fetchState}
              />
            )}

            {supervisorTab === 'OPERATORS' && (
              <OperatorsManagementView
                operators={state.operators || []}
                machines={state.machines}
                onRefresh={fetchState}
              />
            )}

            {supervisorTab === 'MACHINES' && (
              <MachinesMasterView
                machines={state.machines}
                operators={state.operators || []}
                onRefresh={fetchState}
              />
            )}

            {supervisorTab === 'INTRANET_SYNC' && (
              <IntranetSyncView
                state={state}
                userRole={userRole}
                onRefresh={fetchState}
                onNavigateToWorkOrder={(woId) => {
                  setSupervisorTab('WORK_ORDERS');
                }}
              />
            )}

            {supervisorTab === 'PACKING_DELIVERY' && (
              <PackingDeliveryView
                state={state}
                userRole={userRole}
                onRefresh={fetchState}
              />
            )}

            {supervisorTab === 'REWORK' && (
              <ReworkQueueView
                issues={state.issues}
                reworks={state.reworks}
                onRefresh={fetchState}
              />
            )}

            {supervisorTab === 'OUTSOURCE' && (
              <OutsourceView
                outsourceRecords={state.outsourceRecords}
                workOrders={state.workOrders}
                onRefresh={fetchState}
              />
            )}

            {supervisorTab === 'TRACEABILITY' && (
              <TraceabilityView
                initialPieceId={selectedPieceTraceId}
                workOrders={state.workOrders}
              />
            )}

            {supervisorTab === 'ANALYTICS' && (
              <AnalyticsView
                workOrders={state.workOrders}
                issues={state.issues}
                machines={state.machines}
                assignments={state.assignments}
                reworks={state.reworks}
              />
            )}
          </div>
        )}
      </main>

      {/* Concurrency Pilot Test Modal (Section 9, 39) */}
      <ConcurrencyTestModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
        onSuccessTest={fetchState}
      />

      {/* Glass Piece Location Finder & Floor Tracker Modal */}
      <PieceFinderModal
        isOpen={isPieceFinderOpen}
        onClose={() => setIsPieceFinderOpen(false)}
        workOrders={state.workOrders}
        machines={state.machines}
        onNavigateToMachine={(machineId) => {
          setSelectedMachineId(machineId);
          setCurrentView('TERMINAL');
        }}
        onNavigateToTrace={(pieceId) => {
          handleNavigateToTraceability(pieceId);
        }}
      />
    </div>
  );
}
