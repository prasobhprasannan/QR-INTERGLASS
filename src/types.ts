export type OperationType =
  | 'CUTTING'
  | 'POLISHING'
  | 'BEVELING'
  | 'DRILLING'
  | 'WASHING'
  | 'TEMPERING'
  | 'SANDBLASTING'
  | 'DOUBLE_GLAZING'
  | 'PACKING_DELIVERY';

export type MachineStatus =
  | 'AVAILABLE'
  | 'RUNNING'
  | 'PAUSED'
  | 'BREAKDOWN'
  | 'OFFLINE';

export type PieceStatus =
  | 'AVAILABLE'
  | 'LOADED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAUSED'
  | 'TRANSFERRED'
  | 'DAMAGED'
  | 'REWORK'
  | 'REJECTED'
  | 'MISSING'
  | 'CANCELLED';

export type WorkOrderStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type UserRole = 'Operator' | 'Supervisor' | 'Management/Admin';

export interface Machine {
  id: string; // e.g. 'CUT-01', 'TMP-01', 'OUTSOURCE'
  name: string;
  department: OperationType;
  capabilities: OperationType[];
  status: MachineStatus;
  statusReason?: string;
  statusUpdatedAt: string;
  currentOperator?: string;
  activeAssignmentId?: string;
}

export interface Piece {
  id: string; // e.g. 'WO-2026-00125-J1-P001'
  pieceNumber: number; // 1 to N
  jobId: string;
  workOrderId: string;
  customerReference: string;
  dimensions: {
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
  };
  glassSpec: string; // e.g. "10mm Clear Toughened Float Glass"
  route: OperationType[];
  currentOperationIndex: number; // 0 to route.length - 1
  currentStatus: PieceStatus;
  currentMachineId?: string;
  reworkId?: string;
  lastUpdated: string;
  lastCompletedOperation?: OperationType;
}

export interface Job {
  id: string;
  workOrderId: string;
  glassSpec: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
  route: OperationType[];
  pieces: Piece[];
}

export interface WorkOrder {
  id: string; // e.g. 'WO-2026-00125'
  sourceSystemId: string;
  customerReference: string;
  customerName: string;
  projectTitle: string;
  orderDate: string;
  dueDate: string;
  status: WorkOrderStatus;
  jobs: Job[];
  notes?: string;
}

export interface MachineAssignment {
  id: string;
  workOrderId?: string;
  batchCode?: string;
  machineId: string;
  operation: OperationType;
  pieceIds: string[];
  completedPieceIds?: string[];
  operatorName: string;
  status: 'LOADED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'TRANSFERRED';
  loadedAt: string;
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  completedAt?: string;
  transferredToMachineId?: string;
}

export interface TransferRecord {
  id: string;
  sourceMachineId: string;
  destinationMachineId: string;
  assignmentId: string;
  pieceIds: string[];
  reason: 'Breakdown' | 'Maintenance' | 'Production Balancing' | 'Other';
  note?: string;
  operator: string;
  timestamp: string;
}

export const ISSUE_REASONS = [
  'Glass Breakage',
  'Edge / Corner Breakage',
  'Scratch / Chip',
  'Stain',
  'Dimension Issue',
  'Hole Position Issue',
  'Wrong Glass',
  'Machine Breakdown',
  'Tool Failure / Calibration',
  'Other',
] as const;

export type IssueReason = (typeof ISSUE_REASONS)[number];

export interface IssueReport {
  id: string;
  pieceId: string;
  pieceNumber: number;
  workOrderId: string;
  jobId: string;
  process: OperationType;
  machineId: string;
  reason: IssueReason;
  note?: string;
  operator: string;
  timestamp: string;
  status: 'OPEN' | 'SUPERVISOR_ACTIONED';
  reworkId?: string;
}

export type SupervisorDecision =
  | 'Approve Rework'
  | 'Reject'
  | 'Hold'
  | 'Scrap'
  | 'Repair'
  | 'Accept as-is';

export interface ReworkRecord {
  id: string; // e.g. 'RW-2026-00421'
  issueId: string;
  originalPieceId: string;
  workOrderId: string;
  jobId: string;
  originalOperation: OperationType;
  supervisorDecision: SupervisorDecision;
  supervisorNote?: string;
  approvedRoute: OperationType[];
  currentOperationIndex: number;
  supervisor: string;
  timestamp: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SCRAPPED';
}

export interface OutsourceRecord {
  id: string;
  vendorName: string;
  batchReference: string;
  operation: OperationType; // typically TEMPERING
  pieceIds: string[];
  dispatchedDate: string;
  expectedReturnDate: string;
  dispatchedCount: number;
  receivedCount: number;
  receivedDate?: string;
  status: 'DISPATCHED' | 'PARTIAL_RECEIVED' | 'COMPLETED';
  notes?: string;
}

export interface MachineStatusHistory {
  id: string;
  machineId: string;
  oldStatus: MachineStatus;
  newStatus: MachineStatus;
  reason?: string;
  user: string;
  timestamp: string;
  durationSeconds?: number;
}

export type CrateType = 'WOODEN_CRATE' | 'A_FRAME' | 'STILLAGE' | 'GLASS_RACK';

export interface PackingCrate {
  id: string; // e.g. 'CRT-2026-001'
  crateNumber: string;
  crateType: CrateType;
  workOrderId: string;
  customerName: string;
  packedPieceIds: string[];
  capacityPieces: number;
  weightKgEstimated: number;
  status: 'PACKING' | 'SEALED' | 'DISPATCHED' | 'DELIVERED';
  packerName: string;
  packedAt: string;
  sealedAt?: string;
  notes?: string;
}

export type DeliveryStatus = 'READY_FOR_DISPATCH' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryOrder {
  id: string; // e.g. 'DEL-2026-001'
  deliveryNoteNumber: string;
  workOrderId: string;
  customerName: string;
  deliveryAddress: string;
  contactPhone: string;
  driverName: string;
  vehiclePlate: string;
  crateIds: string[];
  pieceIds: string[];
  status: DeliveryStatus;
  dispatchedAt?: string;
  deliveredAt?: string;
  recipientSignature?: string;
  notes?: string;
}

export interface EventLog {
  id: string;
  entityType: 'WORK_ORDER' | 'PIECE' | 'ASSIGNMENT' | 'MACHINE' | 'TRANSFER' | 'ISSUE' | 'REWORK' | 'OUTSOURCE' | 'PACKING' | 'DELIVERY';
  entityId: string;
  event: string;
  oldState?: string;
  newState?: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Operator {
  id: string; // e.g. 'OP-01'
  name: string;
  badgeNumber: string;
  department: OperationType;
  assignedMachineId?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  shift: 'Shift A (Morning 06:00-14:00)' | 'Shift B (Evening 14:00-22:00)' | 'Shift C (Night 22:00-06:00)';
  contactNumber?: string;
  certifications?: string[];
  createdAt: string;
}

export interface IntranetQuoteItem {
  id?: string;
  description: string;
  glassSpec: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  quantity: number;
  requiredOperations?: OperationType[];
  unitRate?: number;
  totalAreaSqm?: number;
}

export interface IntranetQuote {
  id: string; // e.g. 'QRR-2026-0042' or quotation reference
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  projectTitle: string;
  quoteDate: string;
  validUntil?: string;
  totalAmount?: number;
  currency?: string;
  items: IntranetQuoteItem[];
  status: 'DRAFT' | 'APPROVED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';
  syncedWorkOrderId?: string;
  syncedAt?: string;
  sourceUrl?: string;
}

export interface IntranetSyncConfig {
  localhostUrl: string; // e.g. 'http://localhost:5000'
  pollingIntervalSeconds: number; // e.g. 5
  autoSyncApprovedQuotes: boolean;
  pushProgressToLocalhost: boolean;
  lastSyncTimestamp?: string;
  lastSyncStatus: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  lastSyncMessage?: string;
}

export interface FactoryState {
  machines: Machine[];
  workOrders: WorkOrder[];
  assignments: MachineAssignment[];
  transfers: TransferRecord[];
  issues: IssueReport[];
  reworks: ReworkRecord[];
  outsourceRecords: OutsourceRecord[];
  statusHistory: MachineStatusHistory[];
  eventLogs: EventLog[];
  operators: Operator[];
  crates: PackingCrate[];
  deliveries: DeliveryOrder[];
  intranetQuotes?: IntranetQuote[];
  intranetSyncConfig?: IntranetSyncConfig;
}
