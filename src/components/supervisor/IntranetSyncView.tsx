import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  Server,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText,
  Play,
  Settings,
  Zap,
  Code,
  Copy,
  Check,
  Search,
  Sliders,
  Send,
  Sparkles,
  Truck,
  Box,
  Flame,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { FactoryState, IntranetQuote, IntranetSyncConfig, OperationType, UserRole } from '../../types';
import { api } from '../../services/api';

interface IntranetSyncViewProps {
  state: FactoryState;
  userRole: UserRole;
  onRefresh: () => void;
  onNavigateToWorkOrder?: (woId: string) => void;
}

export const IntranetSyncView: React.FC<IntranetSyncViewProps> = ({
  state,
  userRole,
  onRefresh,
  onNavigateToWorkOrder,
}) => {
  const [quotes, setQuotes] = useState<IntranetQuote[]>(state.intranetQuotes || []);
  const [config, setConfig] = useState<IntranetSyncConfig>(
    state.intranetSyncConfig || {
      localhostUrl: 'http://localhost:5000',
      pollingIntervalSeconds: 5,
      autoSyncApprovedQuotes: false,
      pushProgressToLocalhost: true,
      lastSyncStatus: 'DISCONNECTED',
      lastSyncMessage: 'Ready to connect to Localhost Quote--RR',
    }
  );

  const [activeTab, setActiveTab] = useState<'QUOTES' | 'CONFIG' | 'BRIDGE_CODE' | 'MANUAL_IMPORT'>('QUOTES');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'IN_PRODUCTION' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoPolling, setIsAutoPolling] = useState(false);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<IntranetQuote | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );
  const [copiedScript, setCopiedScript] = useState<'python' | 'node' | null>(null);
  const [manualJsonInput, setManualJsonInput] = useState('');

  // Live polling timer reference
  const pollTimerRef = useRef<any>(null);

  // Sync quotes whenever state updates from SSE
  useEffect(() => {
    if (state.intranetQuotes) {
      setQuotes(state.intranetQuotes);
    }
    if (state.intranetSyncConfig) {
      setConfig(state.intranetSyncConfig);
    }
  }, [state.intranetQuotes, state.intranetSyncConfig]);

  // Primary Live Polling function that executes directly from the client's browser to localhost
  const handleLiveLocalhostSync = useCallback(
    async (showFeedback = true) => {
      setIsSyncing(true);
      const targetUrl = config.localhostUrl.replace(/\/+$/, '');

      try {
        let fetchedQuotes: IntranetQuote[] = [];
        let connectionSuccess = false;

        // Attempt 1: Direct client-side fetch to user's localhost / intranet URL
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const response = await fetch(`${targetUrl}/api/quotes`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            fetchedQuotes = Array.isArray(data) ? data : data.quotes || data.data || [];
            connectionSuccess = true;
          }
        } catch (directErr) {
          // Direct fetch failed (e.g. CORS or server not running on that specific port)
        }

        if (connectionSuccess && fetchedQuotes.length > 0) {
          // Sync into MES backend
          const syncResult = await api.syncIntranetQuotes(fetchedQuotes);
          await api.updateIntranetConfig({
            ...config,
            lastSyncStatus: 'CONNECTED',
            lastSyncTimestamp: new Date().toISOString(),
            lastSyncMessage: `Successfully pulled ${fetchedQuotes.length} quotes live from ${targetUrl} (${syncResult.autoImportedCount} auto-imported).`,
          });
          if (showFeedback) {
            setActionFeedback({
              type: 'success',
              message: `Live sync succeeded! Ingested ${fetchedQuotes.length} quotes from ${targetUrl}.`,
            });
          }
        } else {
          // Check if fallback server or mock sync is available
          await api.updateIntranetConfig({
            ...config,
            lastSyncStatus: connectionSuccess ? 'CONNECTED' : 'DISCONNECTED',
            lastSyncTimestamp: new Date().toISOString(),
            lastSyncMessage: connectionSuccess
              ? `Connected to ${targetUrl}, 0 pending quotations found.`
              : `Localhost at ${targetUrl} is unreachable. Check if Quote--RR or the intranet bridge is running.`,
          });
          if (showFeedback) {
            setActionFeedback({
              type: connectionSuccess ? 'info' : 'error',
              message: connectionSuccess
                ? `Connected to ${targetUrl} (no new quotes).`
                : `Could not reach ${targetUrl}. See the 'Localhost Bridge' tab for setup instructions or test with simulated quotes.`,
            });
          }
        }

        // Bi-directional sync: push floor progress back to localhost if enabled
        if (config.pushProgressToLocalhost && connectionSuccess) {
          for (const q of quotes.filter((q) => q.syncedWorkOrderId)) {
            try {
              const progress = await api.getQuoteProgress(q.id);
              if (progress) {
                await fetch(`${targetUrl}/api/quotes/${encodeURIComponent(q.id)}/progress`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(progress),
                }).catch(() => {});
              }
            } catch (e) {}
          }
        }

        onRefresh();
      } catch (err: any) {
        if (showFeedback) {
          setActionFeedback({ type: 'error', message: err.message || 'Sync error' });
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [config, quotes, onRefresh]
  );

  // Toggle Background Polling
  useEffect(() => {
    if (isAutoPolling && config.pollingIntervalSeconds > 0) {
      pollTimerRef.current = setInterval(() => {
        handleLiveLocalhostSync(false);
      }, config.pollingIntervalSeconds * 1000);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isAutoPolling, config.pollingIntervalSeconds, handleLiveLocalhostSync]);

  // Handle manual 1-click import into production Work Order
  const handleImportQuote = async (quoteId: string) => {
    try {
      setIsSyncing(true);
      const newWo = await api.importIntranetQuote(quoteId);
      setActionFeedback({
        type: 'success',
        message: `Quote ${quoteId} imported as Work Order ${newWo.id}! Pieces and barcodes dispatched to Cutting.`,
      });
      onRefresh();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to import quote' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Push progress manually to localhost
  const handlePushProgress = async (quoteId: string) => {
    try {
      const progress = await api.getQuoteProgress(quoteId);
      const targetUrl = config.localhostUrl.replace(/\/+$/, '');
      const res = await fetch(`${targetUrl}/api/quotes/${encodeURIComponent(quoteId)}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress),
      });
      if (!res.ok) throw new Error(`Localhost returned HTTP ${res.status}`);
      setActionFeedback({
        type: 'success',
        message: `Successfully pushed live telemetry (${progress.progressPercent}% complete) to Quote--RR at ${targetUrl}!`,
      });
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        message: `Failed to push telemetry to ${config.localhostUrl}: ${e.message}`,
      });
    }
  };

  // Simulator: Generate a live incoming approved quotation
  const handleSimulateIncomingQuote = async () => {
    const quoteNum = `QRR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const clients = [
      'Al Futtaim Construction LLC',
      'Arabtec Glazing Systems',
      'Sobha Engineering & Contracting',
      'Emaar Properties PJSC',
      'Damac Luxury Developments',
    ];
    const projects = [
      'Creek Horizon Residential Tower Phase 2',
      'Dubai South Logistics Hub Offices',
      'Business Bay Canal Front Showroom',
      'Palm Jumeirah Luxury Villa Balustrades',
    ];

    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const randomProject = projects[Math.floor(Math.random() * projects.length)];

    const simulatedQuote: IntranetQuote = {
      id: quoteNum,
      customerName: randomClient,
      customerPhone: '+971 4 291 0044',
      customerEmail: 'contracts@intranet-quote.local',
      projectTitle: randomProject,
      quoteDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000 * 20).toISOString(),
      totalAmount: Math.floor(25000 + Math.random() * 75000),
      currency: 'AED',
      status: 'APPROVED',
      items: [
        {
          id: `QI-${quoteNum}-1`,
          description: '12mm Clear Toughened Glass with Flat Polish & Corner Dubbing',
          glassSpec: '12mm Clear Toughened Glass Flat Polish',
          widthMm: 1250,
          heightMm: 2400,
          thicknessMm: 12,
          quantity: 14,
          requiredOperations: ['CUTTING', 'POLISHING', 'WASHING', 'TEMPERING', 'PACKING_DELIVERY'],
          unitRate: 195,
          totalAreaSqm: 42.0,
        },
        {
          id: `QI-${quoteNum}-2`,
          description: '8mm Ultra-Clear Float with 30mm Precision Perimeter Bevel',
          glassSpec: '8mm Ultra-Clear Beveled Glass',
          widthMm: 950,
          heightMm: 1900,
          thicknessMm: 8,
          quantity: 8,
          requiredOperations: ['CUTTING', 'POLISHING', 'BEVELING', 'WASHING', 'PACKING_DELIVERY'],
          unitRate: 230,
          totalAreaSqm: 14.44,
        },
      ],
    };

    const res = await api.syncIntranetQuotes([simulatedQuote]);
    setActionFeedback({
      type: 'success',
      message: `Simulated live quotation ${quoteNum} ingested into Intranet pipeline! Click 'Import to Floor' to convert it into factory pieces.`,
    });
    onRefresh();
  };

  // Handle manual JSON paste import
  const handleManualJsonImport = async () => {
    try {
      const parsed = JSON.parse(manualJsonInput);
      const quotesArray: IntranetQuote[] = Array.isArray(parsed) ? parsed : [parsed];
      if (quotesArray.length === 0 || !quotesArray[0].customerName) {
        throw new Error('Invalid quotation schema. Make sure customerName and items array exist.');
      }
      await api.syncIntranetQuotes(quotesArray);
      setActionFeedback({
        type: 'success',
        message: `Successfully parsed and ingested ${quotesArray.length} quotes!`,
      });
      setManualJsonInput('');
      setActiveTab('QUOTES');
      onRefresh();
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: `Invalid JSON: ${e.message}` });
    }
  };

  // Filtered quotes
  const filteredQuotes = quotes.filter((q) => {
    if (filterStatus === 'APPROVED' && q.status !== 'APPROVED') return false;
    if (filterStatus === 'IN_PRODUCTION' && q.status !== 'IN_PRODUCTION') return false;
    if (filterStatus === 'DRAFT' && q.status !== 'DRAFT') return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = q.id.toLowerCase().includes(query);
      const matchCustomer = q.customerName.toLowerCase().includes(query);
      const matchProject = q.projectTitle.toLowerCase().includes(query);
      return matchId || matchCustomer || matchProject;
    }
    return true;
  });

  const isConnected = config.lastSyncStatus === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md ${
                isConnected ? 'bg-emerald-600' : 'bg-cyan-600'
              }`}
            >
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Quote--RR Intranet Live Synchronization Hub
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 border font-mono ${
                    isConnected
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isConnected ? 'LIVE CONNECTED' : 'AWAITING LOCALHOST'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time bi-directional sync with quotation software running on{' '}
                <span className="text-cyan-300 font-mono font-bold">{config.localhostUrl}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-trigger-sync"
              onClick={() => handleLiveLocalhostSync(true)}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live Now'}</span>
            </button>

            <button
              id="btn-toggle-polling"
              onClick={() => setIsAutoPolling(!isAutoPolling)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                isAutoPolling
                  ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {isAutoPolling ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isAutoPolling ? `Auto-Polling (${config.pollingIntervalSeconds}s)` : 'Enable Auto-Poll'}</span>
            </button>

            <button
              id="btn-simulate-quote"
              onClick={handleSimulateIncomingQuote}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Simulate a new approved quote arriving from Quote--RR"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Quote</span>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Target:{' '}
              <strong className="text-cyan-300">{config.localhostUrl}</strong>
            </span>
            <span>
              Last Sync:{' '}
              <span className="text-slate-200">
                {config.lastSyncTimestamp ? new Date(config.lastSyncTimestamp).toLocaleTimeString() : 'Never'}
              </span>
            </span>
            <span>
              Approved Quotes Ready:{' '}
              <strong className="text-emerald-400 font-bold">
                {quotes.filter((q) => q.status === 'APPROVED').length}
              </strong>
            </span>
            <span>
              In Production:{' '}
              <strong className="text-cyan-400 font-bold">
                {quotes.filter((q) => q.status === 'IN_PRODUCTION').length}
              </strong>
            </span>
          </div>

          <div className="text-slate-400 truncate max-w-md">
            {config.lastSyncMessage || 'Ready to communicate with local Quote--RR.'}
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
              : actionFeedback.type === 'error'
              ? 'bg-rose-950/60 border-rose-700 text-rose-200'
              : 'bg-cyan-950/60 border-cyan-700 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : actionFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-[11px] opacity-70 hover:opacity-100 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="subtab-quotes"
          onClick={() => setActiveTab('QUOTES')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'QUOTES' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Quotations Feed ({quotes.length})</span>
        </button>

        <button
          id="subtab-config"
          onClick={() => setActiveTab('CONFIG')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CONFIG' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Localhost & Polling Config</span>
        </button>

        <button
          id="subtab-bridge"
          onClick={() => setActiveTab('BRIDGE_CODE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'BRIDGE_CODE' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-amber-400" />
          <span>Intranet Bridge Code (Quote--RR)</span>
        </button>

        <button
          id="subtab-manual"
          onClick={() => setActiveTab('MANUAL_IMPORT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'MANUAL_IMPORT' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manual JSON Paste</span>
        </button>
      </div>

      {/* TAB 1: QUOTATIONS FEED */}
      {activeTab === 'QUOTES' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === 'ALL' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({quotes.length})
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved ({quotes.filter((q) => q.status === 'APPROVED').length})
              </button>
              <button
                onClick={() => setFilterStatus('IN_PRODUCTION')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === 'IN_PRODUCTION' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                In Production ({quotes.filter((q) => q.status === 'IN_PRODUCTION').length})
              </button>
              <button
                onClick={() => setFilterStatus('DRAFT')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === 'DRAFT' ? 'bg-slate-800 text-slate-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Draft ({quotes.filter((q) => q.status === 'DRAFT').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search quote #, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Quotations List */}
          {filteredQuotes.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200">No Quotations Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No quotations match the active filter. Click &quot;Sync Live Now&quot; to poll your localhost server or use &quot;Simulate Quote&quot; to test the ingestion flow.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotes.map((quote) => {
                const totalPieces = quote.items.reduce((sum, item) => sum + item.quantity, 0);
                const totalArea = quote.items.reduce(
                  (sum, item) => sum + (item.totalAreaSqm || (item.widthMm * item.heightMm * item.quantity) / 1000000),
                  0
                );
                const linkedWo = state.workOrders.find((w) => w.id === quote.syncedWorkOrderId);

                return (
                  <div
                    key={quote.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-md space-y-3"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-cyan-400 text-sm">
                          {quote.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            quote.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : quote.status === 'IN_PRODUCTION'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {quote.status}
                        </span>
                        {quote.syncedWorkOrderId && (
                          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                            MES Work Order: <strong>{quote.syncedWorkOrderId}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {quote.status === 'APPROVED' && !quote.syncedWorkOrderId && (
                          <button
                            id={`btn-import-${quote.id}`}
                            onClick={() => handleImportQuote(quote.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>1-Click Import to Floor</span>
                          </button>
                        )}

                        {quote.syncedWorkOrderId && (
                          <>
                            <button
                              onClick={() => handlePushProgress(quote.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                              title="Send live progress telemetry back to Quote--RR"
                            >
                              <Send className="w-3 h-3 text-cyan-400" />
                              <span>Push Telemetry</span>
                            </button>

                            {onNavigateToWorkOrder && (
                              <button
                                onClick={() => onNavigateToWorkOrder(quote.syncedWorkOrderId!)}
                                className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs rounded-lg flex items-center gap-1 border border-cyan-500/30 transition-all cursor-pointer"
                              >
                                <span>Floor Tracking</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() =>
                            setSelectedQuoteDetail(selectedQuoteDetail?.id === quote.id ? null : quote)
                          }
                          className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                        >
                          {selectedQuoteDetail?.id === quote.id ? 'Hide Details' : 'View Items'}
                        </button>
                      </div>
                    </div>

                    {/* Meta Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Customer / Client</span>
                        <span className="text-white font-semibold">{quote.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Project Title</span>
                        <span className="text-slate-200">{quote.projectTitle}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Glass Volume</span>
                        <span className="text-cyan-300 font-mono">
                          {totalPieces} pcs • {totalArea.toFixed(2)} m²
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Quoted Amount</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {quote.totalAmount ? quote.totalAmount.toLocaleString() : '0'} {quote.currency || 'AED'}
                        </span>
                      </div>
                    </div>

                    {/* Production Progress Bar if in production */}
                    {linkedWo && (
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">MES Factory Floor Progress:</span>
                          <span className="text-cyan-300 font-mono font-bold">
                            {(() => {
                              const pieces = linkedWo.jobs.flatMap((j) => j.pieces);
                              const completed = pieces.filter((p) => p.currentStatus === 'COMPLETED').length;
                              const pct = pieces.length > 0 ? Math.round((completed / pieces.length) * 100) : 0;
                              return `${completed} / ${pieces.length} pcs completed (${pct}%)`;
                            })()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          {(() => {
                            const pieces = linkedWo.jobs.flatMap((j) => j.pieces);
                            const completed = pieces.filter((p) => p.currentStatus === 'COMPLETED').length;
                            const pct = pieces.length > 0 ? Math.round((completed / pieces.length) * 100) : 0;
                            return (
                              <div
                                className="h-full bg-linear-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Detailed Items Drawer */}
                    {selectedQuoteDetail?.id === quote.id && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5 mt-2 animate-in fade-in">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Quotation Glass Specification Items:
                        </span>
                        <div className="space-y-1.5">
                          {quote.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-white block">
                                  #{idx + 1}: {item.description}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {item.widthMm} x {item.heightMm} x {item.thicknessMm}mm • Qty: {item.quantity} pcs
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.requiredOperations?.map((op) => (
                                  <span
                                    key={op}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300"
                                  >
                                    {op}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">Localhost & Intranet Network Configuration</h3>
            <p className="text-xs text-slate-400">
              Configure how the factory terminal communicates with your local Quote--RR instance.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.updateIntranetConfig(config);
                setActionFeedback({ type: 'success', message: 'Localhost sync settings saved successfully!' });
                onRefresh();
              } catch (err: any) {
                setActionFeedback({ type: 'error', message: err.message });
              }
            }}
            className="space-y-5"
          >
            {/* Host Address */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Localhost / Intranet API Endpoint URL
              </label>
              <input
                type="text"
                value={config.localhostUrl}
                onChange={(e) => setConfig({ ...config, localhostUrl: e.target.value })}
                placeholder="http://localhost:5000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                required
              />
              {/* Presets */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Quick Presets:</span>
                {['http://localhost:5000', 'http://localhost:8000', 'http://localhost:3001', 'http://127.0.0.1:8080'].map(
                  (preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setConfig({ ...config, localhostUrl: preset })}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
                    >
                      {preset}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Polling Interval */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Live Polling Frequency (seconds)
                </label>
                <select
                  value={config.pollingIntervalSeconds}
                  onChange={(e) =>
                    setConfig({ ...config, pollingIntervalSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={3}>3 seconds (Ultra responsive)</option>
                  <option value={5}>5 seconds (Recommended standard)</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              {/* Push Progress Back */}
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={config.pushProgressToLocalhost}
                    onChange={(e) =>
                      setConfig({ ...config, pushProgressToLocalhost: e.target.checked })
                    }
                    className="rounded border-slate-700 text-cyan-600 bg-slate-950"
                  />
                  <span className="text-xs text-slate-300 font-semibold">
                    Bi-directional: Push Shop Floor Progress to Quote--RR
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 ml-5 mt-0.5">
                  Sends pieces cut, tempered, and delivered back to the quotation system.
                </p>
              </div>
            </div>

            {/* Auto Import Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSyncApprovedQuotes}
                  onChange={(e) =>
                    setConfig({ ...config, autoSyncApprovedQuotes: e.target.checked })
                  }
                  className="rounded border-slate-700 text-cyan-600 bg-slate-950"
                />
                <span className="text-xs text-slate-200 font-bold">
                  Auto-Convert Approved Quotes to Factory Work Orders
                </span>
              </label>
              <p className="text-[11px] text-slate-400 ml-5">
                When enabled, newly approved quotes fetched from localhost are immediately converted into active Work Orders, assigning barcodes and routing steps without requiring manual approval.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: INTRANET BRIDGE CODE (PYTHON & NODE.JS) */}
      {activeTab === 'BRIDGE_CODE' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>How to Connect Quote--RR on Intranet Localhost</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Because this MES runs in your web browser on your local computer or intranet workstation, your browser can directly connect to <strong className="text-cyan-300">http://localhost:5000</strong> (or your local Quote--RR server port).
            </p>
            <p className="text-xs text-slate-400">
              Below are ready-to-run lightweight bridge scripts. You can drop this directly into your local machine and run it to instantly connect Quote--RR with this Factory MES!
            </p>
          </div>

          {/* Python Bridge Script */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold font-mono uppercase">
                  Python Bridge
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">quote_rr_bridge.py</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(PYTHON_BRIDGE_CODE);
                  setCopiedScript('python');
                  setTimeout(() => setCopiedScript(null), 2500);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {copiedScript === 'python' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-72 border border-slate-800/80">
              {PYTHON_BRIDGE_CODE}
            </pre>
          </div>

          {/* Node.js Bridge Script */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold font-mono uppercase">
                  Node.js Bridge
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">quote_rr_server.js</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(NODE_BRIDGE_CODE);
                  setCopiedScript('node');
                  setTimeout(() => setCopiedScript(null), 2500);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {copiedScript === 'node' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-72 border border-slate-800/80">
              {NODE_BRIDGE_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL JSON IMPORT */}
      {activeTab === 'MANUAL_IMPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-3xl">
          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">Direct Quotation JSON Importer</h3>
            <p className="text-xs text-slate-400">
              If your intranet software generates or exports a JSON quotation, paste the JSON payload here to ingest it immediately into the factory pipeline.
            </p>
          </div>

          <textarea
            rows={9}
            value={manualJsonInput}
            onChange={(e) => setManualJsonInput(e.target.value)}
            placeholder={`{\n  "id": "QRR-2026-9011",\n  "customerName": "Al Shafar General Contracting",\n  "projectTitle": "Downtown Plaza Facade",\n  "status": "APPROVED",\n  "items": [\n    {\n      "description": "12mm Clear Toughened Glass",\n      "widthMm": 1200,\n      "heightMm": 2400,\n      "thicknessMm": 12,\n      "quantity": 10\n    }\n  ]\n}`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setManualJsonInput(
                  JSON.stringify(
                    {
                      id: `QRR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      customerName: 'Al Naboodah Commercial Glazing',
                      projectTitle: 'Business Bay Tower 4',
                      status: 'APPROVED',
                      totalAmount: 38000,
                      currency: 'AED',
                      items: [
                        {
                          description: '10mm Clear Float Glass with Flat Ground Arris',
                          glassSpec: '10mm Clear Float Glass',
                          widthMm: 1000,
                          heightMm: 2200,
                          thicknessMm: 10,
                          quantity: 12,
                        },
                      ],
                    },
                    null,
                    2
                  )
                );
              }}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Fill Sample JSON
            </button>

            <button
              onClick={handleManualJsonImport}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Ingest Quotation JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Ready-to-use bridge scripts for users running Quote--RR locally
const PYTHON_BRIDGE_CODE = `# quote_rr_bridge.py
# Run alongside Quote--RR on your intranet / local PC:
# python -m pip install flask flask-cors
# python quote_rr_bridge.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
# Enable CORS so the Glass Factory MES browser UI can sync seamlessly
CORS(app)

# Replace with your actual Quote--RR database or file export
QUOTES_STORE = [
    {
        "id": "QRR-2026-0812",
        "customerName": "Al Habtoor Glass & Aluminum LLC",
        "projectTitle": "Emaar Sky Tower - Podium Canopy & Partitions",
        "status": "APPROVED",
        "totalAmount": 48500,
        "currency": "AED",
        "items": [
            {
                "description": "12mm Clear Toughened Glass Flat Polish",
                "widthMm": 1200,
                "heightMm": 2400,
                "thicknessMm": 12,
                "quantity": 12,
                "requiredOperations": ["CUTTING", "POLISHING", "WASHING", "TEMPERING", "PACKING_DELIVERY"]
            },
            {
                "description": "28mm Low-E High Performance Insulated Glass Units",
                "widthMm": 1500,
                "heightMm": 2100,
                "thicknessMm": 28,
                "quantity": 8,
                "requiredOperations": ["CUTTING", "POLISHING", "WASHING", "TEMPERING", "DOUBLE_GLAZING", "PACKING_DELIVERY"]
            }
        ]
    }
]

@app.route('/api/quotes', methods=['GET'])
def get_quotes():
    """Returns approved and pending quotations for the Factory MES to sync"""
    return jsonify(QUOTES_STORE)

@app.route('/api/quotes/<quote_id>/progress', methods=['POST'])
def receive_progress(quote_id):
    """Receives live telemetry from Glass Factory MES (cut, polished, tempered, delivered)"""
    telemetry = request.json
    print(f"[*] Live Telemetry from Factory for Quote {quote_id}: {telemetry['progressPercent']}% complete")
    return jsonify({"status": "acknowledged", "quote_id": quote_id})

if __name__ == '__main__':
    print("[*] Quote--RR Intranet Bridge running on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

const NODE_BRIDGE_CODE = `// quote_rr_server.js
// Run alongside Quote--RR on your intranet / local PC:
// npm install express cors
// node quote_rr_server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const quotes = [
  {
    id: "QRR-2026-0812",
    customerName: "Al Habtoor Glass & Aluminum LLC",
    projectTitle: "Emaar Sky Tower - Podium Canopy",
    status: "APPROVED",
    totalAmount: 48500,
    currency: "AED",
    items: [
      {
        description: "12mm Clear Toughened Glass Flat Polish",
        widthMm: 1200,
        heightMm: 2400,
        thicknessMm: 12,
        quantity: 12,
        requiredOperations: ["CUTTING", "POLISHING", "WASHING", "TEMPERING", "PACKING_DELIVERY"]
      }
    ]
  }
];

app.get('/api/quotes', (req, res) => {
  res.json(quotes);
});

app.post('/api/quotes/:id/progress', (req, res) => {
  console.log('Received shop floor progress update:', req.body);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(\`Quote--RR Bridge listening on http://localhost:\${PORT}\`);
});
`;
