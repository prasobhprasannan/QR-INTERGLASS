import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  QrCode,
  FileText,
  Tag,
} from 'lucide-react';
import { WorkOrder, Job, Piece } from '../../types';

interface QRLabelModalProps {
  isOpen?: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  job?: Job;
  piece?: Piece;
  initialStage?: string;
  stage?: string;
}

export const QRLabelModal: React.FC<QRLabelModalProps> = ({
  isOpen = true,
  onClose,
  workOrder,
  piece,
}) => {
  // All individual pieces belong to the Work Order itself
  const allWorkOrderPieces = useMemo(() => {
    return workOrder.jobs.flatMap((j) => j.pieces);
  }, [workOrder]);

  const [activeTab, setActiveTab] = useState<'WORK_ORDER' | 'PIECES'>(piece ? 'PIECES' : 'WORK_ORDER');
  const [selectedPieceId, setSelectedPieceId] = useState<string>(piece ? piece.id : 'ALL');
  const [woQrUrl, setWoQrUrl] = useState<string>('');
  const [piecesQrMap, setPiecesQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(true);

  if (!isOpen) return null;

  // Generate QR codes for Work Order master and all individual pieces
  useEffect(() => {
    let isMounted = true;
    async function generateCodes() {
      setIsGenerating(true);
      try {
        // Work Order Master QR code - encodes workOrder.id for rapid workstation loading
        const woUrl = await QRCode.toDataURL(workOrder.id, {
          width: 320,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });

        if (isMounted) setWoQrUrl(woUrl);

        // Piece QR code payloads - raw piece ID for laser / barcode scanner on shop floor
        const pieceMap: Record<string, string> = {};
        for (const p of allWorkOrderPieces) {
          const pUrl = await QRCode.toDataURL(p.id, {
            width: 280,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M',
          });
          pieceMap[p.id] = pUrl;
        }

        if (isMounted) {
          setPiecesQrMap(pieceMap);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Failed to generate QR codes:', err);
        if (isMounted) setIsGenerating(false);
      }
    }

    generateCodes();
    return () => {
      isMounted = false;
    };
  }, [workOrder.id, allWorkOrderPieces]);

  const handlePrint = () => {
    window.print();
  };

  const piecesToRender =
    selectedPieceId === 'ALL'
      ? allWorkOrderPieces
      : allWorkOrderPieces.filter((p) => p.id === selectedPieceId);

  // Collect unique specifications across the Work Order
  const uniqueGlassSpecs = Array.from(new Set(allWorkOrderPieces.map((p) => p.glassSpec)));
  const masterRoute = workOrder.jobs[0]?.route || ['CUTTING', 'POLISHING', 'TEMPERING'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto">
      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col text-slate-100 overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:bg-white print:text-black">
        {/* Header - Screen only */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Production QR Stickers & Master Label</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                INTERGLASS CO L.L.C • WO: <span className="text-white font-bold">{workOrder.id}</span> • Customer:{' '}
                <span className="text-slate-300 font-semibold">{workOrder.customerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print Stickers</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls - Screen only */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Sticker Type:</span>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('WORK_ORDER')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'WORK_ORDER'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Work Order Master Label</span>
              </button>
              <button
                onClick={() => setActiveTab('PIECES')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'PIECES'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Work Order Piece Stickers ({allWorkOrderPieces.length})</span>
              </button>
            </div>
          </div>

          {activeTab === 'PIECES' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Select:</span>
              <select
                value={selectedPieceId}
                onChange={(e) => setSelectedPieceId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 font-mono"
              >
                <option value="ALL">All {allWorkOrderPieces.length} Pieces of {workOrder.id} (Sticker Batch)</option>
                {allWorkOrderPieces.map((p) => (
                  <option key={p.id} value={p.id}>
                    Piece #{p.pieceNumber} ({p.id}) • {p.dimensions.widthMm}x{p.dimensions.heightMm}mm
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Printable Label View Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-950/40 print:bg-white print:p-0 print:overflow-visible">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-mono">Generating high-resolution QR barcodes...</p>
            </div>
          ) : activeTab === 'WORK_ORDER' ? (
            /* Work Order Master Label */
            <div className="max-w-xl mx-auto bg-white text-black p-6 rounded-xl border-2 border-black shadow-lg font-sans print:shadow-none print:border-2 print:border-black print:rounded-none print:m-0 print:max-w-none">
              {/* Company Header */}
              <div className="border-b-2 border-black pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-black uppercase">
                      INTERGLASS CO L.L.C
                    </h1>
                    <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                      Al Jurf Industrial Area 1 , Ajman
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-black block">
                      WO: {workOrder.id}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-600 block">
                      Total: {allWorkOrderPieces.length} PCS
                    </span>
                  </div>
                </div>

                {/* Customer Row */}
                <div className="mt-2.5 pt-2 border-t border-neutral-300 flex items-center justify-between">
                  <div className="text-sm font-bold text-black">
                    <span className="text-neutral-500 uppercase font-semibold text-xs mr-1">Customer:</span>
                    <span className="font-black text-black">{workOrder.customerName}</span>
                  </div>
                  <div className="text-xs font-mono text-neutral-600">
                    Ref: {workOrder.sourceSystemId}
                  </div>
                </div>
              </div>

              {/* QR and Work Order Specs Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 items-center">
                <div className="flex flex-col items-center justify-center p-2 bg-neutral-50 border border-neutral-300 rounded">
                  {woQrUrl ? (
                    <img
                      src={woQrUrl}
                      alt="Work Order Master QR Code"
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs text-neutral-500">
                      QR Barcode
                    </div>
                  )}
                  <span className="font-mono text-[10px] font-bold tracking-widest mt-1 text-neutral-700">
                    SCAN TO LOAD WORK ORDER
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Work Order</span>
                    <span className="font-mono font-black text-sm text-black">{workOrder.id}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Glass Specifications</span>
                    <div className="space-y-0.5 mt-0.5">
                      {uniqueGlassSpecs.map((spec, sIdx) => (
                        <span key={sIdx} className="font-bold text-black text-xs leading-tight block">
                          • {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total Pieces</span>
                      <span className="font-mono font-black text-sm text-black">{allWorkOrderPieces.length} PCS</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block">Due Date</span>
                      <span className="font-mono font-bold text-neutral-800 text-xs">
                        {new Date(workOrder.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-neutral-200">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Project Title</span>
                    <span className="text-xs text-neutral-800 font-medium truncate block">
                      {workOrder.projectTitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manufacturing Route Sequence Flow */}
              <div className="border-t-2 border-black pt-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  ROUTE SEQUENCE:
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {masterRoute.map((op, idx) => (
                    <React.Fragment key={op + idx}>
                      <span className="px-2 py-1 bg-neutral-100 border border-neutral-400 font-mono text-[11px] font-black rounded-xs">
                        {idx + 1}. {op}
                      </span>
                      {idx < masterRoute.length - 1 && <span className="text-neutral-500 font-black">➔</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-300 mt-4 pt-2 flex justify-between items-center text-[9px] font-mono text-neutral-600">
                <span>INTERGLASS CO L.L.C • Ajman UAE</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            /* Glass Pieces QR Stickers (Thermal Sticker Format) - from Work Order itself */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:m-0">
              {piecesToRender.map((p) => {
                const qrUrl = piecesQrMap[p.id];
                return (
                  <div
                    key={p.id}
                    className="bg-white text-black p-4 rounded-xl border-2 border-black shadow-md font-sans print:shadow-none print:border-2 print:border-black print:rounded-none print:break-inside-avoid"
                  >
                    {/* Company Header on Sticker */}
                    <div className="border-b border-black pb-1.5 mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-black text-sm text-black tracking-tight uppercase">
                            INTERGLASS CO L.L.C
                          </div>
                          <div className="text-[10px] font-medium text-neutral-700">
                            Al Jurf Industrial Area 1 , Ajman
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-black font-mono block">
                            PC #{p.pieceNumber}
                          </span>
                          <span className="text-[9px] text-neutral-600 font-mono block">
                            of {allWorkOrderPieces.length}
                          </span>
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="mt-1 pt-1 border-t border-neutral-200 flex items-center justify-between text-[10px]">
                        <div className="truncate font-semibold text-black">
                          <span className="text-neutral-500 uppercase text-[9px] mr-1">Customer:</span>
                          <span className="font-bold">{workOrder.customerName}</span>
                        </div>
                        <div className="font-mono text-[9px] text-neutral-800 font-bold shrink-0 ml-1">
                          WO: {workOrder.id}
                        </div>
                      </div>
                    </div>

                    {/* Middle: QR code & Piece specs */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center p-1 bg-neutral-50 border border-neutral-300 rounded-xs shrink-0">
                        {qrUrl ? (
                          <img
                            src={qrUrl}
                            alt={`QR ${p.id}`}
                            className="w-24 h-24 object-contain"
                          />
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center text-[10px] text-neutral-400">
                            Loading QR
                          </div>
                        )}
                        <span className="font-mono text-[8px] font-bold text-neutral-600">
                          SCAN TO LOAD
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">Piece ID</span>
                          <span className="font-mono font-black text-[11px] text-black truncate block">
                            {p.id}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">Dimensions</span>
                          <span className="font-mono font-bold text-xs text-black">
                            {p.dimensions.widthMm} x {p.dimensions.heightMm} x {p.dimensions.thicknessMm} mm
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">Specification</span>
                          <span className="text-[10px] font-medium text-black line-clamp-1 block">
                            {p.glassSpec}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Route Breadcrumb */}
                    <div className="border-t border-neutral-200 mt-2 pt-1.5">
                      <div className="text-[8px] font-bold uppercase text-neutral-500 mb-0.5">
                        Route Sequence:
                      </div>
                      <div className="text-[9px] font-mono font-semibold text-neutral-800 truncate">
                        {p.route.join(' ➔ ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
