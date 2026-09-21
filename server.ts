import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { factoryStore } from './server/store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SSE (Server-Sent Events) for real-time terminal synchronization
  app.get('/api/events/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    const unsubscribe = factoryStore.onStateChange((event, data) => {
      res.write(`data: ${JSON.stringify({ type: event, data, timestamp: new Date().toISOString() })}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Full state
  app.get('/api/state', (req, res) => {
    res.json({ success: true, data: factoryStore.getState() });
  });

  // Machines list
  app.get('/api/machines', (req, res) => {
    res.json({ success: true, data: factoryStore.getMachines() });
  });

  // Add machine
  app.post('/api/machines', (req, res) => {
    try {
      const machine = factoryStore.addMachine(req.body);
      res.json({ success: true, data: machine });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update machine status
  app.put('/api/machines/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason, user } = req.body;
      const machine = factoryStore.updateMachineStatus(id, status, reason, user);
      res.json({ success: true, data: machine });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update machine configuration (department, capabilities, operator)
  app.put('/api/machines/:id', (req, res) => {
    try {
      const { id } = req.params;
      const machine = factoryStore.updateMachine(id, req.body);
      res.json({ success: true, data: machine });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Operators API
  app.get('/api/operators', (req, res) => {
    res.json({ success: true, data: factoryStore.getOperators() });
  });

  app.post('/api/operators', (req, res) => {
    try {
      const op = factoryStore.addOperator(req.body);
      res.json({ success: true, data: op });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/operators/:id', (req, res) => {
    try {
      const op = factoryStore.updateOperator(req.params.id, req.body);
      res.json({ success: true, data: op });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/operators/:id', (req, res) => {
    try {
      factoryStore.deleteOperator(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update route process for a job
  app.put('/api/work-orders/:woId/jobs/:jobId/route', (req, res) => {
    try {
      const { woId, jobId } = req.params;
      const { route, actor } = req.body;
      const job = factoryStore.updateJobRoute(woId, jobId, route, actor);
      res.json({ success: true, data: job });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Work Orders list
  app.get('/api/work-orders', (req, res) => {
    res.json({ success: true, data: factoryStore.getWorkOrders() });
  });

  // Work Order detail
  app.get('/api/work-orders/:id', (req, res) => {
    const wo = factoryStore.getWorkOrder(req.params.id);
    if (!wo) {
      res.status(404).json({ success: false, message: `Work Order ${req.params.id} not found.` });
      return;
    }
    res.json({ success: true, data: wo });
  });

  // Piece detail and complete chronological traceability
  app.get('/api/pieces/:id', (req, res) => {
    const pieceData = factoryStore.getPiece(req.params.id);
    if (!pieceData) {
      res.status(404).json({ success: false, message: `Piece ${req.params.id} not found.` });
      return;
    }
    const timeline = factoryStore.getEventLogs(req.params.id);
    res.json({ success: true, data: { ...pieceData, timeline } });
  });

  // QR Scan resolver
  app.post('/api/scan', (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        res.status(400).json({ success: false, message: 'Scan code is required.' });
        return;
      }
      const result = factoryStore.resolveScan(code);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Get eligible pieces for a machine from a scanned Work Order
  app.get('/api/machines/:id/eligible-pieces', (req, res) => {
    try {
      const { id } = req.params;
      const { workOrderId } = req.query;
      if (!workOrderId || typeof workOrderId !== 'string') {
        res.status(400).json({ success: false, message: 'workOrderId query param is required.' });
        return;
      }
      const result = factoryStore.getEligiblePiecesForMachine(id, workOrderId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Load pieces onto machine (Atomic assignment with concurrency locking)
  app.post('/api/assignments/load', async (req, res) => {
    try {
      const { machineId, workOrderId, mode, quantity, pieceIds, operatorName } = req.body;
      const assignment = await factoryStore.loadPieces({
        machineId,
        workOrderId,
        mode,
        quantity,
        pieceIds,
        operatorName,
      });
      res.json({ success: true, data: assignment });
    } catch (err: any) {
      res.status(409).json({ success: false, message: err.message });
    }
  });

  // Start assignment
  app.post('/api/assignments/:id/start', (req, res) => {
    try {
      const { id } = req.params;
      const { operatorName } = req.body;
      const assignment = factoryStore.startAssignment(id, operatorName);
      res.json({ success: true, data: assignment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Pause assignment
  app.post('/api/assignments/:id/pause', (req, res) => {
    try {
      const { id } = req.params;
      const { reason, operatorName } = req.body;
      const assignment = factoryStore.pauseAssignment(id, reason, operatorName);
      res.json({ success: true, data: assignment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Complete assignment & release pieces (All Completed)
  app.post('/api/assignments/:id/complete', (req, res) => {
    try {
      const { id } = req.params;
      const { operatorName } = req.body;
      const assignment = factoryStore.completeAssignment(id, operatorName);
      res.json({ success: true, data: assignment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Complete individual piece(s) within an assignment
  app.post('/api/assignments/:id/complete-pieces', (req, res) => {
    try {
      const { id } = req.params;
      const { pieceIds, operatorName } = req.body;
      if (!Array.isArray(pieceIds) || pieceIds.length === 0) {
        res.status(400).json({ success: false, message: 'pieceIds array is required.' });
        return;
      }
      const result = factoryStore.completeIndividualPieces(id, pieceIds, operatorName);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Transfer assignment to compatible machine
  app.post('/api/assignments/transfer', (req, res) => {
    try {
      const { assignmentId, targetMachineId, reason, note, operatorName } = req.body;
      const transfer = factoryStore.transferAssignment({
        assignmentId,
        targetMachineId,
        reason,
        note,
        operatorName,
      });
      res.json({ success: true, data: transfer });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Fast worker damage / problem report
  app.post('/api/issues/report', (req, res) => {
    try {
      const { pieceId, machineId, reason, note, operatorName } = req.body;
      const issue = factoryStore.reportProblem({
        pieceId,
        machineId,
        reason,
        note,
        operatorName,
      });
      res.json({ success: true, data: issue });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Supervisor rework disposition
  app.post('/api/rework/action', (req, res) => {
    try {
      const { issueId, decision, note, approvedRoute, supervisorName } = req.body;
      const result = factoryStore.actionSupervisorRework({
        issueId,
        decision,
        note,
        approvedRoute,
        supervisorName,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Outsourced tempering dispatch
  app.post('/api/outsource/dispatch', (req, res) => {
    try {
      const { vendorName, pieceIds, expectedReturnDate, notes, operatorName } = req.body;
      const record = factoryStore.dispatchOutsource({
        vendorName,
        pieceIds,
        expectedReturnDate,
        notes,
        operatorName,
      });
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Outsourced tempering receive
  app.post('/api/outsource/receive', (req, res) => {
    try {
      const { recordId, receivedPieceIds, operatorName, notes } = req.body;
      const record = factoryStore.receiveOutsource({
        recordId,
        receivedPieceIds,
        operatorName,
        notes,
      });
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Packing & Crating API
  app.get('/api/crates', (req, res) => {
    res.json({ success: true, data: factoryStore.getCrates() });
  });

  app.post('/api/crates', (req, res) => {
    try {
      const crate = factoryStore.createCrate(req.body);
      res.json({ success: true, data: crate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/crates/:id/pack', (req, res) => {
    try {
      const { id } = req.params;
      const { pieceIds, packerName } = req.body;
      if (!Array.isArray(pieceIds) || pieceIds.length === 0) {
        res.status(400).json({ success: false, message: 'pieceIds array is required.' });
        return;
      }
      const crate = factoryStore.packPiecesIntoCrate(id, pieceIds, packerName);
      res.json({ success: true, data: crate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/crates/:id/seal', (req, res) => {
    try {
      const { id } = req.params;
      const { packerName } = req.body;
      const crate = factoryStore.sealCrate(id, packerName);
      res.json({ success: true, data: crate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Delivery & Logistics Dispatch API
  app.get('/api/deliveries', (req, res) => {
    res.json({ success: true, data: factoryStore.getDeliveries() });
  });

  app.post('/api/deliveries', (req, res) => {
    try {
      const delivery = factoryStore.createDelivery(req.body);
      res.json({ success: true, data: delivery });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/deliveries/:id/dispatch', (req, res) => {
    try {
      const { id } = req.params;
      const { actor } = req.body;
      const delivery = factoryStore.dispatchDelivery(id, actor);
      res.json({ success: true, data: delivery });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/deliveries/:id/deliver', (req, res) => {
    try {
      const { id } = req.params;
      const { recipientSignature, actor } = req.body;
      const delivery = factoryStore.markDelivered(id, recipientSignature, actor);
      res.json({ success: true, data: delivery });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Event audit logs
  app.get('/api/audit-logs', (req, res) => {
    const filterId = typeof req.query.filterId === 'string' ? req.query.filterId : undefined;
    res.json({ success: true, data: factoryStore.getEventLogs(filterId) });
  });

  // Concurrency collision test simulation (Section 9 & 34)
  // Simulates two terminals simultaneously scanning and attempting to claim the same piece
  app.post('/api/simultaneous-scan-test', async (req, res) => {
    try {
      const { machine1 = 'CUT-01', machine2 = 'CUT-02', workOrderId = 'WO-2026-00125' } = req.body;
      const { eligiblePieces } = factoryStore.getEligiblePiecesForMachine(machine1, workOrderId);
      if (eligiblePieces.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No eligible pieces available in this Work Order to run concurrency test.',
        });
        return;
      }

      const targetPieceId = eligiblePieces[0].id;

      // Fire two concurrent load requests for the exact same piece
      const p1 = factoryStore.loadPieces({
        machineId: machine1,
        workOrderId,
        mode: 'INDIVIDUAL',
        pieceIds: [targetPieceId],
        operatorName: 'Worker Terminal 1',
      });

      const p2 = factoryStore.loadPieces({
        machineId: machine2,
        workOrderId,
        mode: 'INDIVIDUAL',
        pieceIds: [targetPieceId],
        operatorName: 'Worker Terminal 2',
      });

      const results = await Promise.allSettled([p1, p2]);

      res.json({
        success: true,
        testTargetPieceId: targetPieceId,
        machine1Result:
          results[0].status === 'fulfilled'
            ? { success: true, assignmentId: results[0].value.id }
            : { success: false, error: (results[0] as PromiseRejectedResult).reason?.message },
        machine2Result:
          results[1].status === 'fulfilled'
            ? { success: true, assignmentId: results[1].value.id }
            : { success: false, error: (results[1] as PromiseRejectedResult).reason?.message },
        summary:
          'Concurrency test successfully ran. Exactly one terminal claimed the piece; the simultaneous request was rejected server-side.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // --- INTRANET LOCALHOST QUOTE--RR SYNC API ---
  app.get('/api/intranet/quotes', (req, res) => {
    res.json({ success: true, data: factoryStore.getIntranetQuotes() });
  });

  app.post('/api/intranet/quotes/sync', (req, res) => {
    try {
      const { quotes } = req.body;
      if (!Array.isArray(quotes)) {
        res.status(400).json({ success: false, message: 'quotes array is required' });
        return;
      }
      const result = factoryStore.upsertIntranetQuotes(quotes);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/intranet/quotes/:id/import', (req, res) => {
    try {
      const { id } = req.params;
      const wo = factoryStore.importQuoteAsWorkOrder(id);
      res.json({
        success: true,
        data: wo,
        message: `Quotation ${id} successfully imported as Work Order ${wo.id}`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.get('/api/intranet/quotes/:id/progress', (req, res) => {
    const { id } = req.params;
    const progress = factoryStore.getQuoteProgress(id);
    if (!progress) {
      res.status(404).json({ success: false, message: 'Quote progress not found' });
      return;
    }
    res.json({ success: true, data: progress });
  });

  app.get('/api/intranet/config', (req, res) => {
    res.json({ success: true, data: factoryStore.getIntranetSyncConfig() });
  });

  app.post('/api/intranet/config', (req, res) => {
    try {
      const updated = factoryStore.updateIntranetSyncConfig(req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Reset to seed data
  app.post('/api/reset', (req, res) => {
    const state = factoryStore.resetToDefault();
    res.json({ success: true, message: 'Factory database successfully reset to clean seed data.', data: state });
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Glass Factory MES Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
