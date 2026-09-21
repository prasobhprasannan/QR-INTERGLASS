import {
  FactoryState,
  Machine,
  WorkOrder,
  Job,
  MachineAssignment,
  TransferRecord,
  IssueReport,
  ReworkRecord,
  OutsourceRecord,
  EventLog,
  MachineStatus,
  IssueReason,
  SupervisorDecision,
  OperationType,
  Operator,
  PackingCrate,
  DeliveryOrder,
  CrateType,
  DeliveryStatus,
} from '../types';

export const api = {
  async getState(): Promise<FactoryState> {
    const res = await fetch('/api/state');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getMachines(): Promise<Machine[]> {
    const res = await fetch('/api/machines');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateMachineStatus(
    machineId: string,
    status: MachineStatus,
    reason?: string,
    user?: string
  ): Promise<Machine> {
    const res = await fetch(`/api/machines/${machineId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, user }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async addMachine(data: Omit<Machine, 'statusUpdatedAt'>): Promise<Machine> {
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async resolveScan(code: string): Promise<any> {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getEligiblePieces(machineId: string, workOrderId: string): Promise<any> {
    const res = await fetch(
      `/api/machines/${machineId}/eligible-pieces?workOrderId=${encodeURIComponent(workOrderId)}`
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async loadPieces(params: {
    machineId: string;
    workOrderId: string;
    mode: 'ALL' | 'QUANTITY' | 'INDIVIDUAL';
    quantity?: number;
    pieceIds?: string[];
    operatorName?: string;
  }): Promise<MachineAssignment> {
    const res = await fetch('/api/assignments/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async startAssignment(id: string, operatorName?: string): Promise<MachineAssignment> {
    const res = await fetch(`/api/assignments/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async pauseAssignment(id: string, reason?: string, operatorName?: string): Promise<MachineAssignment> {
    const res = await fetch(`/api/assignments/${id}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, operatorName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async completeAssignment(id: string, operatorName?: string): Promise<MachineAssignment> {
    const res = await fetch(`/api/assignments/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async completeIndividualPieces(
    id: string,
    pieceIds: string[],
    operatorName?: string
  ): Promise<{ assignment: MachineAssignment; completedCount: number; remainingCount: number; isAllCompleted: boolean }> {
    const res = await fetch(`/api/assignments/${id}/complete-pieces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pieceIds, operatorName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async transferAssignment(params: {
    assignmentId: string;
    targetMachineId: string;
    reason: 'Breakdown' | 'Maintenance' | 'Production Balancing' | 'Other';
    note?: string;
    operatorName?: string;
  }): Promise<TransferRecord> {
    const res = await fetch('/api/assignments/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async reportProblem(params: {
    pieceId: string;
    machineId: string;
    reason: IssueReason;
    note?: string;
    operatorName?: string;
  }): Promise<IssueReport> {
    const res = await fetch('/api/issues/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async actionSupervisorRework(params: {
    issueId: string;
    decision: SupervisorDecision;
    note?: string;
    approvedRoute?: OperationType[];
    supervisorName?: string;
  }): Promise<any> {
    const res = await fetch('/api/rework/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async dispatchOutsource(params: {
    vendorName: string;
    pieceIds: string[];
    expectedReturnDate: string;
    notes?: string;
    operatorName?: string;
  }): Promise<OutsourceRecord> {
    const res = await fetch('/api/outsource/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async receiveOutsource(params: {
    recordId: string;
    receivedPieceIds: string[];
    notes?: string;
    operatorName?: string;
  }): Promise<OutsourceRecord> {
    const res = await fetch('/api/outsource/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getPieceTraceability(pieceId: string): Promise<any> {
    const res = await fetch(`/api/pieces/${encodeURIComponent(pieceId)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getAuditLogs(filterId?: string): Promise<EventLog[]> {
    const url = filterId ? `/api/audit-logs?filterId=${encodeURIComponent(filterId)}` : '/api/audit-logs';
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async runSimultaneousScanTest(params: {
    machine1: string;
    machine2: string;
    workOrderId: string;
  }): Promise<any> {
    const res = await fetch('/api/simultaneous-scan-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  },

  async getOperators(): Promise<Operator[]> {
    const res = await fetch('/api/operators');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async addOperator(data: Omit<Operator, 'id' | 'createdAt'>): Promise<Operator> {
    const res = await fetch('/api/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateOperator(id: string, data: Partial<Operator>): Promise<Operator> {
    const res = await fetch(`/api/operators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async deleteOperator(id: string): Promise<boolean> {
    const res = await fetch(`/api/operators/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return true;
  },

  async updateMachine(id: string, data: Partial<Machine>): Promise<Machine> {
    const res = await fetch(`/api/machines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateJobRoute(
    workOrderId: string,
    jobId: string,
    route: OperationType[],
    actor?: string
  ): Promise<Job> {
    const res = await fetch(
      `/api/work-orders/${encodeURIComponent(workOrderId)}/jobs/${encodeURIComponent(jobId)}/route`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, actor }),
      }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async resetDatabase(): Promise<any> {
    const res = await fetch('/api/reset', { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json;
  },

  // Packing & Crating API
  async getCrates(): Promise<PackingCrate[]> {
    const res = await fetch('/api/crates');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async createCrate(params: {
    workOrderId: string;
    customerName: string;
    crateType: CrateType;
    capacityPieces?: number;
    packerName?: string;
    notes?: string;
  }): Promise<PackingCrate> {
    const res = await fetch('/api/crates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async packPiecesIntoCrate(crateId: string, pieceIds: string[], packerName?: string): Promise<PackingCrate> {
    const res = await fetch(`/api/crates/${encodeURIComponent(crateId)}/pack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pieceIds, packerName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async sealCrate(crateId: string, packerName?: string): Promise<PackingCrate> {
    const res = await fetch(`/api/crates/${encodeURIComponent(crateId)}/seal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packerName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Delivery & Logistics Dispatch API
  async getDeliveries(): Promise<DeliveryOrder[]> {
    const res = await fetch('/api/deliveries');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async createDelivery(params: {
    workOrderId: string;
    customerName: string;
    deliveryAddress: string;
    contactPhone: string;
    driverName: string;
    vehiclePlate: string;
    crateIds: string[];
    pieceIds?: string[];
    notes?: string;
  }): Promise<DeliveryOrder> {
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async dispatchDelivery(deliveryId: string, actor?: string): Promise<DeliveryOrder> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async markDelivered(deliveryId: string, recipientSignature?: string, actor?: string): Promise<DeliveryOrder> {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientSignature, actor }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  // Intranet Localhost Quote--RR Integration API
  async getIntranetQuotes(): Promise<any[]> {
    const res = await fetch('/api/intranet/quotes');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async syncIntranetQuotes(quotes: any[]): Promise<{ quotes: any[]; autoImportedCount: number }> {
    const res = await fetch('/api/intranet/quotes/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotes }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async importIntranetQuote(quoteId: string): Promise<WorkOrder> {
    const res = await fetch(`/api/intranet/quotes/${encodeURIComponent(quoteId)}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getQuoteProgress(quoteId: string): Promise<any> {
    const res = await fetch(`/api/intranet/quotes/${encodeURIComponent(quoteId)}/progress`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async getIntranetConfig(): Promise<any> {
    const res = await fetch('/api/intranet/config');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async updateIntranetConfig(config: any): Promise<any> {
    const res = await fetch('/api/intranet/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },
};
