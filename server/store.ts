import {
  FactoryState,
  Machine,
  WorkOrder,
  Job,
  Piece,
  MachineAssignment,
  TransferRecord,
  IssueReport,
  ReworkRecord,
  OutsourceRecord,
  MachineStatusHistory,
  EventLog,
  OperationType,
  MachineStatus,
  PieceStatus,
  IssueReason,
  SupervisorDecision,
  Operator,
  PackingCrate,
  DeliveryOrder,
  CrateType,
  DeliveryStatus,
  IntranetQuote,
  IntranetQuoteItem,
  IntranetSyncConfig,
} from '../src/types';

const INITIAL_CRATES: PackingCrate[] = [
  {
    id: 'CRT-2026-001',
    crateNumber: 'CRATE-WO125-A',
    crateType: 'WOODEN_CRATE',
    workOrderId: 'WO-2026-00125',
    customerName: 'Metro Glass & Facade Corp',
    packedPieceIds: ['WO-2026-00125-J1-P001', 'WO-2026-00125-J1-P002'],
    capacityPieces: 8,
    weightKgEstimated: 145,
    status: 'PACKING',
    packerName: 'Lucas Vance (Dispatch QA)',
    packedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: 'Foam corner protectors and interleaving paper applied between float sheets.',
  },
  {
    id: 'CRT-2026-002',
    crateNumber: 'CRATE-WO127-GLASS-RACK',
    crateType: 'A_FRAME',
    workOrderId: 'WO-2026-00127',
    customerName: 'Apex Architecture & Balustrades',
    packedPieceIds: ['WO-2026-00127-J1-P001', 'WO-2026-00127-J1-P002', 'WO-2026-00127-J1-P003'],
    capacityPieces: 10,
    weightKgEstimated: 260,
    status: 'SEALED',
    packerName: 'Lucas Vance (Dispatch QA)',
    packedAt: new Date(Date.now() - 7200000).toISOString(),
    sealedAt: new Date(Date.now() - 1800000).toISOString(),
    notes: 'Heavy duty steel strapping. Ready for direct flatbed truck loading.',
  },
];

const INITIAL_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'DEL-2026-001',
    deliveryNoteNumber: 'DN-2026-8801',
    workOrderId: 'WO-2026-00127',
    customerName: 'Apex Architecture & Balustrades',
    deliveryAddress: '742 Construction Way, Dock 4, Harbor Industrial Park',
    contactPhone: '+1 (555) 392-1084',
    driverName: 'Samir O’Connor',
    vehiclePlate: 'TRK-882-FLT (Flatbed with Crane)',
    crateIds: ['CRT-2026-002'],
    pieceIds: ['WO-2026-00127-J1-P001', 'WO-2026-00127-J1-P002', 'WO-2026-00127-J1-P003'],
    status: 'READY_FOR_DISPATCH',
    notes: 'Requires jobsite overhead hoist crane for unloading at Dock 4.',
  },
];

const INITIAL_OPERATORS: Operator[] = [
  {
    id: 'OP-01',
    name: 'Marco Silva',
    badgeNumber: 'BDG-4011',
    department: 'CUTTING',
    assignedMachineId: 'CUT-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+1 (555) 234-8910',
    certifications: ['CNC Cutting Level 3', 'Optimizing Nesting'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-02',
    name: 'David Chen',
    badgeNumber: 'BDG-4012',
    department: 'CUTTING',
    assignedMachineId: 'CUT-02',
    status: 'ACTIVE',
    shift: 'Shift B (Evening 14:00-22:00)',
    contactNumber: '+1 (555) 234-8911',
    certifications: ['Bystronic Laser Alignment', 'Glass Safe Handling'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-03',
    name: 'Elena Rostova',
    badgeNumber: 'BDG-4021',
    department: 'POLISHING',
    assignedMachineId: 'POL-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+1 (555) 234-8920',
    certifications: ['Diamond Wheel Profiling', 'Flat Polish Quality'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-04',
    name: 'Carlos Mendez',
    badgeNumber: 'BDG-4031',
    department: 'BEVELING',
    assignedMachineId: 'BEV-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+1 (555) 234-8930',
    certifications: ['High Gloss Beveling', 'Miter Joint Master'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-05',
    name: 'Sarah Jenkins',
    badgeNumber: 'BDG-4041',
    department: 'DRILLING',
    assignedMachineId: 'DRL-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+1 (555) 234-8940',
    certifications: ['Countersink Drilling', 'Waterjet CNC Cutout'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-06',
    name: 'Lukas Meyer',
    badgeNumber: 'BDG-4051',
    department: 'TEMPERING',
    assignedMachineId: 'TMP-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+1 (555) 234-8950',
    certifications: ['Glaston Furnace Calibration', 'Quench Pressure Control'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-07',
    name: 'Amina Al-Mansoor',
    badgeNumber: 'BDG-4061',
    department: 'DOUBLE_GLAZING',
    assignedMachineId: 'DG-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+971 50 234 8960',
    certifications: ['Warm-Edge Spacer Robotic Bending', 'Argon Gas Fill Cert'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-08',
    name: 'Tariq Al-Hashemi',
    badgeNumber: 'BDG-4071',
    department: 'SANDBLASTING',
    assignedMachineId: 'SND-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+971 50 345 6789',
    certifications: ['Mistral Automatic Sandblast', 'Frosted Texture QA'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'OP-09',
    name: 'Lucas Vance',
    badgeNumber: 'BDG-4081',
    department: 'PACKING_DELIVERY',
    assignedMachineId: 'DEL-01',
    status: 'ACTIVE',
    shift: 'Shift A (Morning 06:00-14:00)',
    contactNumber: '+971 50 987 6543',
    certifications: ['Direct Delivery Staging', 'Jobsite Crane Offload QA'],
    createdAt: new Date().toISOString(),
  },
];

// Initial Machines (Fleet of dedicated single-capability workstations)
// Rule: A workstation can only do one thing at a time (e.g. cutting machine only cuts)
const INITIAL_MACHINES: Machine[] = [
  {
    id: 'CUT-01',
    name: 'Bystronic CNC Glass Cutter 1',
    department: 'CUTTING',
    capabilities: ['CUTTING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'CUT-02',
    name: 'Bystronic CNC Glass Cutter 2',
    department: 'CUTTING',
    capabilities: ['CUTTING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'POL-01',
    name: 'Bavelloni Straight Line Edger 1',
    department: 'POLISHING',
    capabilities: ['POLISHING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'POL-02',
    name: 'Bavelloni Double Edging Line 2',
    department: 'POLISHING',
    capabilities: ['POLISHING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'BEV-01',
    name: 'Bando Beveling Station 1',
    department: 'BEVELING',
    capabilities: ['BEVELING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'BEV-02',
    name: 'Bando Beveling Station 2',
    department: 'BEVELING',
    capabilities: ['BEVELING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'WSH-01',
    name: 'Lisec Horizontal Glass Washer 1',
    department: 'WASHING',
    capabilities: ['WASHING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'WSH-02',
    name: 'Lisec Vertical Glass Washer 2',
    department: 'WASHING',
    capabilities: ['WASHING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'TMP-01',
    name: 'Glaston Convection Tempering Furnace 1',
    department: 'TEMPERING',
    capabilities: ['TEMPERING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'OUTSOURCE',
    name: 'External Tempering Logistics Dock',
    department: 'TEMPERING',
    capabilities: ['TEMPERING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'SND-01',
    name: 'Fratelli Pezza Mistral Sandblasting Machine 1',
    department: 'SANDBLASTING',
    capabilities: ['SANDBLASTING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'DG-01',
    name: 'Forel Automated IGU Assembly Line 1',
    department: 'DOUBLE_GLAZING',
    capabilities: ['DOUBLE_GLAZING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'DG-02',
    name: 'Forel Secondary Sealant & Argon Press 2',
    department: 'DOUBLE_GLAZING',
    capabilities: ['DOUBLE_GLAZING'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
  {
    id: 'DEL-01',
    name: 'Interglass Direct Delivery & Dispatch Dock',
    department: 'PACKING_DELIVERY',
    capabilities: ['PACKING_DELIVERY'],
    status: 'AVAILABLE',
    statusUpdatedAt: new Date().toISOString(),
  },
];

const INITIAL_INTRANET_SYNC_CONFIG: IntranetSyncConfig = {
  localhostUrl: 'http://localhost:5000',
  pollingIntervalSeconds: 5,
  autoSyncApprovedQuotes: false,
  pushProgressToLocalhost: true,
  lastSyncStatus: 'DISCONNECTED',
  lastSyncMessage: 'Ready to connect to Localhost Quote--RR software',
};

const INITIAL_INTRANET_QUOTES: IntranetQuote[] = [
  {
    id: 'QRR-2026-0812',
    customerName: 'Al Habtoor Glass & Aluminum LLC',
    customerPhone: '+971 4 394 8812',
    customerEmail: 'contracts@alhabtoorglass.ae',
    projectTitle: 'Emaar Sky Tower - Podium Canopy & Partitions',
    quoteDate: new Date(Date.now() - 86400000).toISOString(),
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    totalAmount: 48500,
    currency: 'AED',
    status: 'APPROVED',
    items: [
      {
        id: 'QI-812-1',
        description: '12mm Clear Toughened Glass with Flat Polished Edges',
        glassSpec: '12mm Clear Toughened Glass Flat Polish',
        widthMm: 1200,
        heightMm: 2400,
        thicknessMm: 12,
        quantity: 12,
        requiredOperations: ['CUTTING', 'POLISHING', 'WASHING', 'TEMPERING', 'PACKING_DELIVERY'],
        unitRate: 185,
        totalAreaSqm: 34.56,
      },
      {
        id: 'QI-812-2',
        description: '28mm Low-E High Performance Insulated Glass Units (6mm Low-E / 16A / 6mm Clear)',
        glassSpec: '28mm Low-E IGU (6mm Low-E / 16A / 6mm Clear)',
        widthMm: 1500,
        heightMm: 2100,
        thicknessMm: 28,
        quantity: 8,
        requiredOperations: ['CUTTING', 'POLISHING', 'WASHING', 'TEMPERING', 'DOUBLE_GLAZING', 'PACKING_DELIVERY'],
        unitRate: 420,
        totalAreaSqm: 25.2,
      },
    ],
  },
  {
    id: 'QRR-2026-0815',
    customerName: 'Sobha Interiors & Fitout LLC',
    customerPhone: '+971 4 456 1290',
    customerEmail: 'procurement@sobhagroup.com',
    projectTitle: 'Marina Heights Luxury Suites - Bathroom Mirrors & Screens',
    quoteDate: new Date(Date.now() - 43200000).toISOString(),
    validUntil: new Date(Date.now() + 86400000 * 15).toISOString(),
    totalAmount: 22400,
    currency: 'AED',
    status: 'APPROVED',
    items: [
      {
        id: 'QI-815-1',
        description: '8mm Ultra-Clear Mirror with 25mm Perimeter Bevel & Privacy Sandblast Band',
        glassSpec: '8mm Ultra-Clear Beveled Mirror with Sandblast Pattern',
        widthMm: 900,
        heightMm: 1800,
        thicknessMm: 8,
        quantity: 10,
        requiredOperations: ['CUTTING', 'POLISHING', 'BEVELING', 'WASHING', 'SANDBLASTING', 'PACKING_DELIVERY'],
        unitRate: 210,
        totalAreaSqm: 16.2,
      },
    ],
  },
  {
    id: 'QRR-2026-0820',
    customerName: 'Damac Properties Development',
    customerPhone: '+971 4 373 1000',
    customerEmail: 'commercial@damacgroup.com',
    projectTitle: 'Hills Commercial Boulevard - Shopfront Glazing',
    quoteDate: new Date(Date.now() - 14400000).toISOString(),
    validUntil: new Date(Date.now() + 86400000 * 20).toISOString(),
    totalAmount: 65000,
    currency: 'AED',
    status: 'DRAFT',
    items: [
      {
        id: 'QI-820-1',
        description: '10mm Clear Float Glass with Flat Ground Arris',
        glassSpec: '10mm Clear Float Glass',
        widthMm: 1100,
        heightMm: 2600,
        thicknessMm: 10,
        quantity: 16,
        requiredOperations: ['CUTTING', 'POLISHING', 'WASHING', 'PACKING_DELIVERY'],
        unitRate: 140,
        totalAreaSqm: 45.76,
      },
    ],
  },
];

// Helper to seed initial Work Orders
function generateSeedWorkOrders(): WorkOrder[] {
  const now = new Date().toISOString();

  // Work Order 1: WO-2026-00125 - Skyline Tower Glazing (80 pieces across 2 jobs)
  const wo1Jobs: Job[] = [
    {
      id: 'JOB-125-1',
      workOrderId: 'WO-2026-00125',
      glassSpec: '12mm Clear Toughened Float Glass with Polished Arris',
      thicknessMm: 12,
      widthMm: 1200,
      heightMm: 2400,
      quantity: 50,
      route: ['CUTTING', 'POLISHING', 'DRILLING', 'TEMPERING', 'WASHING'],
      pieces: [],
    },
    {
      id: 'JOB-125-2',
      workOrderId: 'WO-2026-00125',
      glassSpec: '28mm Solar Control Insulated Glass Unit (6mm Low-E / 16mm Argon / 6mm Clear)',
      thicknessMm: 28,
      widthMm: 1500,
      heightMm: 3000,
      quantity: 30,
      route: ['CUTTING', 'POLISHING', 'DRILLING', 'TEMPERING', 'WASHING', 'DOUBLE_GLAZING'],
      pieces: [],
    },
  ];

  // Populate pieces for Job 1
  for (let i = 1; i <= 50; i++) {
    const pad = String(i).padStart(3, '0');
    wo1Jobs[0].pieces.push({
      id: `WO-2026-00125-J1-P${pad}`,
      pieceNumber: i,
      jobId: 'JOB-125-1',
      workOrderId: 'WO-2026-00125',
      customerReference: 'Skyline-Balustrade-L14',
      dimensions: { widthMm: 1200, heightMm: 2400, thicknessMm: 12 },
      glassSpec: '12mm Clear Toughened Float Glass with Polished Arris',
      route: ['CUTTING', 'POLISHING', 'DRILLING', 'TEMPERING', 'WASHING'],
      currentOperationIndex: 0,
      currentStatus: 'AVAILABLE',
      lastUpdated: now,
    });
  }

  // Populate pieces for Job 2
  for (let i = 1; i <= 30; i++) {
    const pad = String(i).padStart(3, '0');
    wo1Jobs[1].pieces.push({
      id: `WO-2026-00125-J2-P${pad}`,
      pieceNumber: i,
      jobId: 'JOB-125-2',
      workOrderId: 'WO-2026-00125',
      customerReference: 'Skyline-CurtainWall-L22',
      dimensions: { widthMm: 1500, heightMm: 3000, thicknessMm: 28 },
      glassSpec: '28mm Solar Control Insulated Glass Unit (6mm Low-E / 16mm Argon / 6mm Clear)',
      route: ['CUTTING', 'POLISHING', 'DRILLING', 'TEMPERING', 'WASHING', 'DOUBLE_GLAZING'],
      currentOperationIndex: 0,
      currentStatus: 'AVAILABLE',
      lastUpdated: now,
    });
  }

  // Work Order 2: WO-2026-00126 - Meridian Luxury Hotel Mirrors & Beveled Panels (40 pieces)
  const wo2Jobs: Job[] = [
    {
      id: 'JOB-126-1',
      workOrderId: 'WO-2026-00126',
      glassSpec: '8mm Ultra-Clear Low-Iron Glass with 25mm Perimeter Bevel',
      thicknessMm: 8,
      widthMm: 900,
      heightMm: 1800,
      quantity: 40,
      route: ['CUTTING', 'BEVELING', 'TEMPERING', 'WASHING'],
      pieces: [],
    },
  ];

  for (let i = 1; i <= 40; i++) {
    const pad = String(i).padStart(3, '0');
    wo2Jobs[0].pieces.push({
      id: `WO-2026-00126-J1-P${pad}`,
      pieceNumber: i,
      jobId: 'JOB-126-1',
      workOrderId: 'WO-2026-00126',
      customerReference: 'Meridian-Suite-Mirrors',
      dimensions: { widthMm: 900, heightMm: 1800, thicknessMm: 8 },
      glassSpec: '8mm Ultra-Clear Low-Iron Glass with 25mm Perimeter Bevel',
      route: ['CUTTING', 'BEVELING', 'TEMPERING', 'WASHING'],
      currentOperationIndex: 0,
      currentStatus: 'AVAILABLE',
      lastUpdated: now,
    });
  }

  // Work Order 3: WO-2026-00127 - Harbor Bay Architectural Storefronts (25 pieces)
  const wo3Jobs: Job[] = [
    {
      id: 'JOB-127-1',
      workOrderId: 'WO-2026-00127',
      glassSpec: '10mm Clear Float Glass with Flat Ground Edges',
      thicknessMm: 10,
      widthMm: 1000,
      heightMm: 2200,
      quantity: 25,
      route: ['CUTTING', 'POLISHING', 'WASHING'],
      pieces: [],
    },
  ];

  for (let i = 1; i <= 25; i++) {
    const pad = String(i).padStart(3, '0');
    wo3Jobs[0].pieces.push({
      id: `WO-2026-00127-J1-P${pad}`,
      pieceNumber: i,
      jobId: 'JOB-127-1',
      workOrderId: 'WO-2026-00127',
      customerReference: 'HarborBay-Retail-SF04',
      dimensions: { widthMm: 1000, heightMm: 2200, thicknessMm: 10 },
      glassSpec: '10mm Clear Float Glass with Flat Ground Edges',
      route: ['CUTTING', 'POLISHING', 'WASHING'],
      currentOperationIndex: 0,
      currentStatus: 'AVAILABLE',
      lastUpdated: now,
    });
  }

  return [
    {
      id: 'WO-2026-00125',
      sourceSystemId: 'ERP-SO-88491',
      customerReference: 'Apex Facades Ltd',
      customerName: 'Skyline Tower Development',
      projectTitle: 'Skyline Tower Glazing Phase 2',
      orderDate: '2026-09-10T08:00:00.000Z',
      dueDate: '2026-09-28T17:00:00.000Z',
      status: 'IN_PROGRESS',
      jobs: wo1Jobs,
      notes: 'Priority high-rise curtain wall and heavy tempered glass balustrades.',
    },
    {
      id: 'WO-2026-00126',
      sourceSystemId: 'ERP-SO-88495',
      customerReference: 'Meridian Hospitality Group',
      customerName: 'Meridian Grand Hotel',
      projectTitle: 'Executive Suite Beveled Glazing',
      orderDate: '2026-09-12T09:30:00.000Z',
      dueDate: '2026-09-30T17:00:00.000Z',
      status: 'PLANNED',
      jobs: wo2Jobs,
      notes: '25mm high precision perimeter beveling required before furnace.',
    },
    {
      id: 'WO-2026-00127',
      sourceSystemId: 'ERP-SO-88502',
      customerReference: 'Harbor Commercial Contractors',
      customerName: 'Harbor Bay Retail Mall',
      projectTitle: 'Ground Storefront Glazing Panels',
      orderDate: '2026-09-15T11:00:00.000Z',
      dueDate: '2026-10-05T17:00:00.000Z',
      status: 'PLANNED',
      jobs: wo3Jobs,
      notes: 'Standard cutting and polished edge profile.',
    },
  ];
}

class FactoryStore {
  private state: FactoryState;
  private changeListeners: Array<(event: string, data: any) => void> = [];
  // Mutex lock map to guarantee atomic concurrency per piece / machine
  private lock = false;

  constructor() {
    this.state = {
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      workOrders: generateSeedWorkOrders(),
      assignments: [],
      transfers: [],
      issues: [],
      reworks: [],
      outsourceRecords: [],
      statusHistory: [],
      eventLogs: [],
      operators: JSON.parse(JSON.stringify(INITIAL_OPERATORS)),
      crates: JSON.parse(JSON.stringify(INITIAL_CRATES)),
      deliveries: JSON.parse(JSON.stringify(INITIAL_DELIVERIES)),
      intranetQuotes: JSON.parse(JSON.stringify(INITIAL_INTRANET_QUOTES)),
      intranetSyncConfig: JSON.parse(JSON.stringify(INITIAL_INTRANET_SYNC_CONFIG)),
    };

    // Log initial seed audit
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: 'SYSTEM',
      event: 'SYSTEM_INITIALIZED',
      actor: 'System Admin',
      metadata: {
        machineCount: this.state.machines.length,
        workOrderCount: this.state.workOrders.length,
      },
    });
  }

  // Subscribe to live SSE updates
  public onStateChange(listener: (event: string, data: any) => void) {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  private notify(event: string, data: any) {
    for (const listener of this.changeListeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Error notifying state change listener:', err);
      }
    }
  }

  public getState(): FactoryState {
    return this.state;
  }

  public getMachines(): Machine[] {
    return this.state.machines;
  }

  public getMachine(machineId: string): Machine | undefined {
    return this.state.machines.find((m) => m.id === machineId);
  }

  public getWorkOrders(): WorkOrder[] {
    return this.state.workOrders;
  }

  public getWorkOrder(woId: string): WorkOrder | undefined {
    return this.state.workOrders.find((wo) => wo.id === woId);
  }

  public getPiece(pieceId: string): { piece: Piece; job: Job; workOrder: WorkOrder } | null {
    for (const wo of this.state.workOrders) {
      for (const job of wo.jobs) {
        const piece = job.pieces.find((p) => p.id === pieceId);
        if (piece) {
          return { piece, job, workOrder: wo };
        }
      }
    }
    return null;
  }

  public getAssignments(): MachineAssignment[] {
    return this.state.assignments;
  }

  public getIssues(): IssueReport[] {
    return this.state.issues;
  }

  public getReworks(): ReworkRecord[] {
    return this.state.reworks;
  }

  public getOutsourceRecords(): OutsourceRecord[] {
    return this.state.outsourceRecords;
  }

  public getEventLogs(filterEntityId?: string): EventLog[] {
    if (filterEntityId) {
      return this.state.eventLogs.filter(
        (e) => e.entityId === filterEntityId || e.metadata?.pieceId === filterEntityId || e.metadata?.workOrderId === filterEntityId
      );
    }
    return this.state.eventLogs;
  }

  public addEventLog(entry: Omit<EventLog, 'id' | 'timestamp'>) {
    const log: EventLog = {
      ...entry,
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.eventLogs.unshift(log);
    this.notify('EVENT_LOG_ADDED', log);
    return log;
  }

  // Update machine status
  public updateMachineStatus(
    machineId: string,
    newStatus: MachineStatus,
    reason?: string,
    user = 'Operator'
  ): Machine {
    const machine = this.getMachine(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} not found.`);
    }

    const oldStatus = machine.status;
    if (oldStatus === newStatus) {
      return machine;
    }

    machine.status = newStatus;
    machine.statusReason = reason;
    machine.statusUpdatedAt = new Date().toISOString();

    const historyEntry: MachineStatusHistory = {
      id: `MSH-${Date.now()}`,
      machineId,
      oldStatus,
      newStatus,
      reason,
      user,
      timestamp: machine.statusUpdatedAt,
    };
    this.state.statusHistory.unshift(historyEntry);

    this.addEventLog({
      entityType: 'MACHINE',
      entityId: machineId,
      event: `MACHINE_STATUS_${newStatus}`,
      oldState: oldStatus,
      newState: newStatus,
      actor: user,
      metadata: { reason },
    });

    this.notify('MACHINE_UPDATED', machine);
    return machine;
  }

  // Resolve scan for Work Order / Job / Piece / Rework
  public resolveScan(code: string): {
    type: 'WORK_ORDER' | 'JOB' | 'PIECE' | 'REWORK';
    workOrder?: WorkOrder;
    piece?: Piece;
    rework?: ReworkRecord;
    job?: Job;
  } {
    let trimmed = code.trim();

    // Check if JSON payload was scanned
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.pieceId) trimmed = parsed.pieceId;
        else if (parsed.jobId) trimmed = parsed.jobId;
        else if (parsed.woId || parsed.workOrderId) trimmed = parsed.woId || parsed.workOrderId;
        else if (parsed.id) trimmed = parsed.id;
      }
    } catch {
      // Not JSON, continue with trimmed string
    }

    // 1. Check if it's a Piece ID
    const pieceData = this.getPiece(trimmed);
    if (pieceData) {
      return {
        type: 'PIECE',
        piece: pieceData.piece,
        job: pieceData.job,
        workOrder: pieceData.workOrder,
      };
    }

    // 2. Check if it's a Job ID
    for (const w of this.state.workOrders) {
      const foundJob = w.jobs.find((j) => j.id.toUpperCase() === trimmed.toUpperCase());
      if (foundJob) {
        return {
          type: 'JOB',
          job: foundJob,
          workOrder: w,
        };
      }
    }

    // 3. Check if it's a Work Order ID or contains WO
    const wo = this.state.workOrders.find(
      (w) => w.id.toUpperCase() === trimmed.toUpperCase() || w.sourceSystemId.toUpperCase() === trimmed.toUpperCase()
    );
    if (wo) {
      return { type: 'WORK_ORDER', workOrder: wo };
    }

    // 4. Check if it's a Rework code
    const rework = this.state.reworks.find((r) => r.id.toUpperCase() === trimmed.toUpperCase());
    if (rework) {
      const pData = this.getPiece(rework.originalPieceId);
      return {
        type: 'REWORK',
        rework,
        piece: pData?.piece,
        job: pData?.job,
        workOrder: pData?.workOrder,
      };
    }

    throw new Error(`Scanned identifier '${trimmed}' could not be resolved. Please scan a valid Job, Piece, or Work Order QR.`);
  }

  // Get eligible pieces for a machine from a Work Order
  public getEligiblePiecesForMachine(
    machineId: string,
    workOrderId: string
  ): {
    machine: Machine;
    workOrder: WorkOrder;
    eligiblePieces: Piece[];
    ineligibleReasons: { pieceId: string; pieceNumber: number; reason: string }[];
  } {
    const machine = this.getMachine(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} does not exist.`);
    }

    const workOrder = this.getWorkOrder(workOrderId);
    if (!workOrder) {
      throw new Error(`Work Order ${workOrderId} does not exist.`);
    }

    const eligiblePieces: Piece[] = [];
    const ineligibleReasons: { pieceId: string; pieceNumber: number; reason: string }[] = [];

    for (const job of workOrder.jobs) {
      for (const piece of job.pieces) {
        // 1. Check if current operation matches machine capability
        const currentOp = piece.route[piece.currentOperationIndex];
        if (!currentOp) {
          ineligibleReasons.push({
            pieceId: piece.id,
            pieceNumber: piece.pieceNumber,
            reason: 'All route operations are already completed.',
          });
          continue;
        }

        if (!machine.capabilities.includes(currentOp)) {
          ineligibleReasons.push({
            pieceId: piece.id,
            pieceNumber: piece.pieceNumber,
            reason: `Current required operation is ${currentOp}, which is not supported by ${machine.id}.`,
          });
          continue;
        }

        // 2. Check piece status
        if (piece.currentStatus === 'LOADED' || piece.currentStatus === 'IN_PROGRESS') {
          ineligibleReasons.push({
            pieceId: piece.id,
            pieceNumber: piece.pieceNumber,
            reason: `Already actively assigned to machine ${piece.currentMachineId || 'another terminal'}.`,
          });
          continue;
        }

        if (piece.currentStatus === 'DAMAGED') {
          ineligibleReasons.push({
            pieceId: piece.id,
            pieceNumber: piece.pieceNumber,
            reason: `Damaged piece awaiting supervisor rework disposition.`,
          });
          continue;
        }

        if (piece.currentStatus === 'CANCELLED' || piece.currentStatus === 'REJECTED' || piece.currentStatus === 'MISSING') {
          ineligibleReasons.push({
            pieceId: piece.id,
            pieceNumber: piece.pieceNumber,
            reason: `Piece is marked as ${piece.currentStatus}.`,
          });
          continue;
        }

        if (piece.currentStatus === 'COMPLETED') {
          ineligibleReasons.push({
            pieceId: piece.id,
            pieceNumber: piece.pieceNumber,
            reason: `Piece is fully completed.`,
          });
          continue;
        }

        eligiblePieces.push(piece);
      }
    }

    return { machine, workOrder, eligiblePieces, ineligibleReasons };
  }

  // ATOMIC CONCURRENCY CONTROL: Load pieces onto a machine
  public async loadPieces(params: {
    machineId: string;
    workOrderId: string;
    mode: 'ALL' | 'QUANTITY' | 'INDIVIDUAL';
    quantity?: number;
    pieceIds?: string[];
    operatorName?: string;
  }): Promise<MachineAssignment> {
    // Acquire mutex lock to simulate server-side transactional row-locking
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    this.lock = true;

    try {
      const { machineId, workOrderId, mode, quantity, pieceIds, operatorName = 'Operator' } = params;
      const machine = this.getMachine(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found.`);
      }

      if (machine.status === 'BREAKDOWN' || machine.status === 'OFFLINE') {
        throw new Error(`Machine ${machineId} is currently ${machine.status} and cannot receive work.`);
      }

      // Check if machine already has an active loaded/running assignment
      const existingAssignment = this.state.assignments.find(
        (a) => a.machineId === machineId && (a.status === 'LOADED' || a.status === 'IN_PROGRESS' || a.status === 'PAUSED')
      );
      if (existingAssignment) {
        // If loading individual piece(s) belonging to the same Work Order, append into the active assignment
        const currentWoId =
          existingAssignment.workOrderId ||
          (existingAssignment.pieceIds.length > 0 ? this.getPiece(existingAssignment.pieceIds[0])?.workOrder.id : undefined);

        if (mode === 'INDIVIDUAL' && currentWoId === workOrderId) {
          const newPieceIds = (pieceIds || []).filter((id) => !existingAssignment.pieceIds.includes(id));
          if (newPieceIds.length === 0) {
            throw new Error(`Piece is already loaded in the active assignment on machine ${machineId}.`);
          }

          for (const id of newPieceIds) {
            const found = this.getPiece(id);
            if (!found) throw new Error(`Piece '${id}' does not exist.`);
            const p = found.piece;
            if (p.currentStatus === 'LOADED' || p.currentStatus === 'IN_PROGRESS') {
              throw new Error(`Piece ${p.id} is already loaded on machine ${p.currentMachineId || 'another machine'}.`);
            }
            if (p.route[p.currentOperationIndex] !== machine.department) {
              throw new Error(`Piece ${p.id} requires ${p.route[p.currentOperationIndex]}, not ${machine.department}.`);
            }
            if (p.currentStatus !== 'AVAILABLE' && p.currentStatus !== 'PAUSED') {
              throw new Error(`Piece ${p.id} has status ${p.currentStatus}, cannot be loaded.`);
            }

            p.currentStatus = existingAssignment.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'LOADED';
            p.currentMachineId = machineId;
            p.lastUpdated = new Date().toISOString();
            existingAssignment.pieceIds.push(p.id);

            this.addEventLog({
              entityType: 'PIECE',
              entityId: p.id,
              event: 'PIECE_LOADED',
              oldState: 'AVAILABLE',
              newState: p.currentStatus,
              actor: operatorName,
              metadata: { machineId, assignmentId: existingAssignment.id, workOrderId, mode: 'INDIVIDUAL' },
            });
          }

          this.notify('ASSIGNMENT_UPDATED', existingAssignment);
          return existingAssignment;
        }

        throw new Error(
          `Machine ${machineId} already has an active assignment (${existingAssignment.id}) with ${existingAssignment.pieceIds.length} pieces. Complete or transfer it before loading new pieces.`
        );
      }

      const { eligiblePieces } = this.getEligiblePiecesForMachine(machineId, workOrderId);

      let selectedPieces: Piece[] = [];
      if (mode === 'ALL') {
        selectedPieces = eligiblePieces;
      } else if (mode === 'QUANTITY') {
        const qty = Math.max(1, quantity || 1);
        selectedPieces = eligiblePieces.slice(0, qty);
      } else if (mode === 'INDIVIDUAL') {
        if (!pieceIds || pieceIds.length === 0) {
          throw new Error('Please select at least one individual piece to load.');
        }
        const eligibleMap = new Map(eligiblePieces.map((p) => [p.id, p]));
        for (const id of pieceIds) {
          const piece = eligibleMap.get(id);
          if (!piece) {
            // Verify why it's not eligible
            const found = this.getPiece(id);
            if (!found) {
              throw new Error(`Piece '${id}' does not exist.`);
            }
            if (found.piece.currentStatus === 'LOADED' || found.piece.currentStatus === 'IN_PROGRESS') {
              throw new Error(`Piece ${found.piece.id} is already assigned to ${found.piece.currentMachineId || 'another machine'}.`);
            }
            throw new Error(`Piece ${found.piece.id} is not available for operation ${machine.department} at ${machine.id}.`);
          }
          selectedPieces.push(piece);
        }
      }

      if (selectedPieces.length === 0) {
        throw new Error(`No available pieces found matching route operation '${machine.department}' for Work Order ${workOrderId}.`);
      }

      // SECOND CONCURRENCY CHECK: ensure no pieces were concurrently claimed
      for (const p of selectedPieces) {
        if (p.currentStatus === 'LOADED' || p.currentStatus === 'IN_PROGRESS') {
          throw new Error(`Piece ${p.id} was just assigned to machine ${p.currentMachineId}. Concurrent assignment prevented.`);
        }
      }

      const now = new Date().toISOString();
      const assignmentId = `ASG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const batchCode = `BATCH-${machine.id}-${Date.now().toString().slice(-4)}`;

      // Update pieces atomically
      for (const p of selectedPieces) {
        p.currentStatus = 'LOADED';
        p.currentMachineId = machineId;
        p.lastUpdated = now;
      }

      const assignment: MachineAssignment = {
        id: assignmentId,
        workOrderId,
        batchCode,
        machineId,
        operation: machine.department,
        pieceIds: selectedPieces.map((p) => p.id),
        completedPieceIds: [],
        operatorName,
        status: 'LOADED',
        loadedAt: now,
      };

      this.state.assignments.unshift(assignment);

      // Update machine
      machine.status = 'RUNNING';
      machine.currentOperator = operatorName;
      machine.activeAssignmentId = assignmentId;
      machine.statusUpdatedAt = now;

      // Update WorkOrder status if PLANNED
      const wo = this.getWorkOrder(workOrderId);
      if (wo && wo.status === 'PLANNED') {
        wo.status = 'IN_PROGRESS';
      }

      this.addEventLog({
        entityType: 'ASSIGNMENT',
        entityId: assignmentId,
        event: 'ASSIGNMENT_CREATED',
        oldState: 'AVAILABLE',
        newState: 'LOADED',
        actor: operatorName,
        metadata: {
          machineId,
          workOrderId,
          pieceCount: selectedPieces.length,
          pieceIds: selectedPieces.map((p) => p.id),
          mode,
        },
      });

      this.notify('STATE_UPDATED', this.state);
      return assignment;
    } finally {
      this.lock = false;
    }
  }

  // Start processing on a machine assignment
  public startAssignment(assignmentId: string, operatorName = 'Operator'): MachineAssignment {
    const assignment = this.state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    if (assignment.status !== 'LOADED' && assignment.status !== 'PAUSED') {
      throw new Error(`Cannot start assignment with status ${assignment.status}.`);
    }

    const now = new Date().toISOString();
    assignment.status = 'IN_PROGRESS';
    if (!assignment.startedAt) {
      assignment.startedAt = now;
    }
    assignment.resumedAt = now;

    // Update pieces
    for (const pieceId of assignment.pieceIds) {
      const pieceData = this.getPiece(pieceId);
      if (pieceData && pieceData.piece.currentStatus !== 'DAMAGED') {
        pieceData.piece.currentStatus = 'IN_PROGRESS';
        pieceData.piece.lastUpdated = now;
      }
    }

    const machine = this.getMachine(assignment.machineId);
    if (machine) {
      machine.status = 'RUNNING';
      machine.statusUpdatedAt = now;
    }

    this.addEventLog({
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      event: 'ASSIGNMENT_STARTED',
      newState: 'IN_PROGRESS',
      actor: operatorName,
      metadata: { machineId: assignment.machineId, pieceCount: assignment.pieceIds.length },
    });

    this.notify('STATE_UPDATED', this.state);
    return assignment;
  }

  // Pause an assignment
  public pauseAssignment(assignmentId: string, reason = 'Operator paused', operatorName = 'Operator'): MachineAssignment {
    const assignment = this.state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    if (assignment.status !== 'IN_PROGRESS') {
      throw new Error(`Assignment must be IN_PROGRESS to pause.`);
    }

    const now = new Date().toISOString();
    assignment.status = 'PAUSED';
    assignment.pausedAt = now;

    for (const pieceId of assignment.pieceIds) {
      const pieceData = this.getPiece(pieceId);
      if (pieceData && pieceData.piece.currentStatus === 'IN_PROGRESS') {
        pieceData.piece.currentStatus = 'PAUSED';
        pieceData.piece.lastUpdated = now;
      }
    }

    const machine = this.getMachine(assignment.machineId);
    if (machine) {
      machine.status = 'PAUSED';
      machine.statusReason = reason;
      machine.statusUpdatedAt = now;
    }

    this.addEventLog({
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      event: 'ASSIGNMENT_PAUSED',
      newState: 'PAUSED',
      actor: operatorName,
      metadata: { machineId: assignment.machineId, reason },
    });

    this.notify('STATE_UPDATED', this.state);
    return assignment;
  }

  // Complete individual piece(s) within an assignment and advance them to next route step
  public completeIndividualPieces(
    assignmentId: string,
    pieceIdsToComplete: string[],
    operatorName = 'Operator'
  ): { assignment: MachineAssignment; completedCount: number; remainingCount: number; isAllCompleted: boolean } {
    const assignment = this.state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    if (!assignment.completedPieceIds) {
      assignment.completedPieceIds = [];
    }

    const now = new Date().toISOString();
    let newlyCompletedCount = 0;

    for (const pieceId of pieceIdsToComplete) {
      if (!assignment.pieceIds.includes(pieceId)) {
        continue;
      }
      if (assignment.completedPieceIds.includes(pieceId)) {
        continue; // Already completed
      }

      const pieceData = this.getPiece(pieceId);
      if (!pieceData) continue;
      const { piece, workOrder } = pieceData;

      // Do not advance damaged pieces
      if (piece.currentStatus === 'DAMAGED' || piece.currentStatus === 'REJECTED') {
        continue;
      }

      const completedOp = piece.route[piece.currentOperationIndex];
      piece.currentOperationIndex += 1;
      piece.currentMachineId = undefined;
      piece.lastUpdated = now;
      piece.lastCompletedOperation = completedOp;

      if (piece.currentOperationIndex >= piece.route.length) {
        piece.currentStatus = 'COMPLETED';
      } else {
        piece.currentStatus = 'AVAILABLE';
      }

      assignment.completedPieceIds.push(pieceId);
      newlyCompletedCount += 1;

      // Add audit log for individual piece completion
      this.addEventLog({
        entityType: 'PIECE',
        entityId: piece.id,
        event: 'PIECE_COMPLETED',
        oldState: 'IN_PROGRESS',
        newState: piece.currentStatus,
        actor: operatorName,
        metadata: {
          machineId: assignment.machineId,
          assignmentId: assignment.id,
          operation: completedOp,
          nextOperation: piece.route[piece.currentOperationIndex] || 'FINISHED',
          isPieceFinal: piece.currentStatus === 'COMPLETED',
        },
      });

      // Check if entire Work Order is complete
      const allPieces = workOrder.jobs.flatMap((j) => j.pieces);
      const allDone = allPieces.every(
        (p) => p.currentStatus === 'COMPLETED' || p.currentStatus === 'REJECTED'
      );
      if (allDone) {
        workOrder.status = 'COMPLETED';
      }
    }

    // Determine remaining active pieces on machine (not completed, not damaged/rejected)
    const remainingPieces = assignment.pieceIds.filter((id) => {
      if (assignment.completedPieceIds?.includes(id)) return false;
      const pData = this.getPiece(id);
      if (!pData) return false;
      return pData.piece.currentStatus !== 'DAMAGED' && pData.piece.currentStatus !== 'REJECTED';
    });

    const isAllCompleted = remainingPieces.length === 0;

    if (isAllCompleted) {
      assignment.status = 'COMPLETED';
      assignment.completedAt = now;

      // Free machine
      const machine = this.getMachine(assignment.machineId);
      if (machine) {
        machine.status = 'AVAILABLE';
        machine.activeAssignmentId = undefined;
        machine.statusUpdatedAt = now;
      }

      this.addEventLog({
        entityType: 'ASSIGNMENT',
        entityId: assignmentId,
        event: 'ASSIGNMENT_COMPLETED',
        newState: 'COMPLETED',
        actor: operatorName,
        metadata: {
          machineId: assignment.machineId,
          totalPieces: assignment.pieceIds.length,
          operation: assignment.operation,
          completionType: 'ALL_PIECES_COMPLETED',
        },
      });
    }

    this.notify('STATE_UPDATED', this.state);
    return {
      assignment,
      completedCount: assignment.completedPieceIds.length,
      remainingCount: remainingPieces.length,
      isAllCompleted,
    };
  }

  // Complete all remaining pieces in assignment & release to next route operation!
  public completeAssignment(assignmentId: string, operatorName = 'Operator'): MachineAssignment {
    const assignment = this.state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    if (!assignment.completedPieceIds) {
      assignment.completedPieceIds = [];
    }

    const uncompletedIds = assignment.pieceIds.filter(
      (id) => !assignment.completedPieceIds?.includes(id)
    );

    const result = this.completeIndividualPieces(assignmentId, uncompletedIds, operatorName);
    return result.assignment;
  }

  // Transfer an active assignment to a compatible machine (Section 13)
  public transferAssignment(params: {
    assignmentId: string;
    targetMachineId: string;
    reason: 'Breakdown' | 'Maintenance' | 'Production Balancing' | 'Other';
    note?: string;
    operatorName?: string;
  }): TransferRecord {
    const { assignmentId, targetMachineId, reason, note, operatorName = 'Supervisor' } = params;

    const assignment = this.state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    if (assignment.status === 'COMPLETED' || assignment.status === 'TRANSFERRED') {
      throw new Error(`Cannot transfer assignment with status ${assignment.status}.`);
    }

    const sourceMachine = this.getMachine(assignment.machineId);
    const targetMachine = this.getMachine(targetMachineId);

    if (!sourceMachine || !targetMachine) {
      throw new Error('Invalid source or destination machine.');
    }

    if (sourceMachine.id === targetMachine.id) {
      throw new Error('Destination machine must be different from source machine.');
    }

    // Must be compatible capability
    if (!targetMachine.capabilities.includes(assignment.operation)) {
      throw new Error(`Destination machine ${targetMachine.id} does not support operation ${assignment.operation}.`);
    }

    if (targetMachine.status === 'BREAKDOWN' || targetMachine.status === 'OFFLINE') {
      throw new Error(`Destination machine ${targetMachine.id} is currently ${targetMachine.status}.`);
    }

    const now = new Date().toISOString();
    const transferId = `TRF-${Date.now()}`;

    // Mark original assignment as transferred
    assignment.status = 'TRANSFERRED';
    assignment.transferredToMachineId = targetMachineId;

    // Create new assignment at destination machine
    const newAssignmentId = `ASG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAssignment: MachineAssignment = {
      id: newAssignmentId,
      batchCode: assignment.batchCode ? `${assignment.batchCode}-TRF` : undefined,
      machineId: targetMachineId,
      operation: assignment.operation,
      pieceIds: [...assignment.pieceIds],
      operatorName,
      status: 'LOADED',
      loadedAt: now,
    };
    this.state.assignments.unshift(newAssignment);

    // Update pieces to point to new machine
    for (const pieceId of assignment.pieceIds) {
      const pieceData = this.getPiece(pieceId);
      if (pieceData && pieceData.piece.currentStatus !== 'DAMAGED') {
        pieceData.piece.currentMachineId = targetMachineId;
        pieceData.piece.currentStatus = 'LOADED';
        pieceData.piece.lastUpdated = now;
      }
    }

    // Update source machine (if reason is breakdown, mark breakdown)
    if (reason === 'Breakdown') {
      sourceMachine.status = 'BREAKDOWN';
      sourceMachine.statusReason = note || 'Machine breakdown during production';
    } else {
      sourceMachine.status = 'AVAILABLE';
    }
    sourceMachine.activeAssignmentId = undefined;
    sourceMachine.statusUpdatedAt = now;

    // Update target machine
    targetMachine.status = 'RUNNING';
    targetMachine.activeAssignmentId = newAssignmentId;
    targetMachine.statusUpdatedAt = now;

    const transferRecord: TransferRecord = {
      id: transferId,
      sourceMachineId: sourceMachine.id,
      destinationMachineId: targetMachine.id,
      assignmentId,
      pieceIds: [...assignment.pieceIds],
      reason,
      note,
      operator: operatorName,
      timestamp: now,
    };
    this.state.transfers.unshift(transferRecord);

    this.addEventLog({
      entityType: 'TRANSFER',
      entityId: transferId,
      event: 'ASSIGNMENT_TRANSFERRED',
      oldState: sourceMachine.id,
      newState: targetMachine.id,
      actor: operatorName,
      metadata: {
        reason,
        pieceCount: assignment.pieceIds.length,
        note,
      },
    });

    this.notify('STATE_UPDATED', this.state);
    return transferRecord;
  }

  // Report problem / damage (Section 15)
  public reportProblem(params: {
    pieceId: string;
    machineId: string;
    reason: IssueReason;
    note?: string;
    operatorName?: string;
  }): IssueReport {
    const { pieceId, machineId, reason, note, operatorName = 'Operator' } = params;

    const pieceData = this.getPiece(pieceId);
    if (!pieceData) {
      throw new Error(`Piece ${pieceId} not found.`);
    }

    const machine = this.getMachine(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} not found.`);
    }

    const now = new Date().toISOString();
    const issueId = `ISS-${Date.now()}`;

    // Mark piece as DAMAGED
    pieceData.piece.currentStatus = 'DAMAGED';
    pieceData.piece.lastUpdated = now;

    const issue: IssueReport = {
      id: issueId,
      pieceId: pieceData.piece.id,
      pieceNumber: pieceData.piece.pieceNumber,
      workOrderId: pieceData.workOrder.id,
      jobId: pieceData.job.id,
      process: machine.department,
      machineId,
      reason,
      note,
      operator: operatorName,
      timestamp: now,
      status: 'OPEN',
    };

    this.state.issues.unshift(issue);

    this.addEventLog({
      entityType: 'ISSUE',
      entityId: issueId,
      event: 'ISSUE_REPORTED',
      oldState: 'IN_PROGRESS',
      newState: 'DAMAGED',
      actor: operatorName,
      metadata: {
        pieceId: pieceData.piece.id,
        reason,
        machineId,
        note,
      },
    });

    this.notify('STATE_UPDATED', this.state);
    return issue;
  }

  // Supervisor Rework Approval & Decision (Section 16, 17)
  public actionSupervisorRework(params: {
    issueId: string;
    decision: SupervisorDecision;
    note?: string;
    approvedRoute?: OperationType[];
    supervisorName?: string;
  }): ReworkRecord | { success: boolean; message: string } {
    const { issueId, decision, note, approvedRoute, supervisorName = 'Supervisor' } = params;

    const issue = this.state.issues.find((i) => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found.`);
    }

    if (issue.status !== 'OPEN') {
      throw new Error(`Issue ${issueId} has already been dispositioned.`);
    }

    const pieceData = this.getPiece(issue.pieceId);
    if (!pieceData) {
      throw new Error(`Piece ${issue.pieceId} not found.`);
    }

    const now = new Date().toISOString();
    const reworkCode = `RW-2026-${String(this.state.reworks.length + 421).padStart(5, '0')}`;

    issue.status = 'SUPERVISOR_ACTIONED';

    let reworkRecord: ReworkRecord | undefined;

    if (decision === 'Approve Rework' || decision === 'Repair') {
      // When a glass piece gets damaged and is approved for rework, it must re-run all routes again
      // starting from the beginning (e.g. CUTTING) through the workstation where it was damaged.
      let routeToUse: OperationType[];
      if (approvedRoute && approvedRoute.length > 0) {
        routeToUse = [...approvedRoute];
      } else {
        // Re-run the full route starting from step 0 (CUTTING) so the replacement glass piece
        // is cut, processed through all stations, and re-manufactured up to and beyond that workstation
        routeToUse = [...pieceData.job.route];
      }

      reworkRecord = {
        id: reworkCode,
        issueId,
        originalPieceId: pieceData.piece.id,
        workOrderId: pieceData.workOrder.id,
        jobId: pieceData.job.id,
        originalOperation: issue.process,
        supervisorDecision: decision,
        supervisorNote: note,
        approvedRoute: routeToUse,
        currentOperationIndex: 0,
        supervisor: supervisorName,
        timestamp: now,
        status: 'PENDING',
      };

      this.state.reworks.unshift(reworkRecord);

      // Re-link piece: piece route updated to rework route or re-inserted as AVAILABLE for approved route start
      pieceData.piece.reworkId = reworkCode;
      pieceData.piece.route = routeToUse;
      pieceData.piece.currentOperationIndex = 0; // Starts from 1st route step (e.g. CUTTING)
      pieceData.piece.currentStatus = 'AVAILABLE';
      pieceData.piece.currentMachineId = undefined;
      pieceData.piece.lastCompletedOperation = undefined;
      pieceData.piece.lastUpdated = now;

      issue.reworkId = reworkCode;
    } else if (decision === 'Scrap' || decision === 'Reject') {
      pieceData.piece.currentStatus = 'REJECTED';
      pieceData.piece.currentMachineId = undefined;
      pieceData.piece.lastUpdated = now;
    } else if (decision === 'Accept as-is') {
      // Release piece back to AVAILABLE for the next operation
      pieceData.piece.currentOperationIndex += 1;
      pieceData.piece.currentStatus =
        pieceData.piece.currentOperationIndex >= pieceData.piece.route.length ? 'COMPLETED' : 'AVAILABLE';
      pieceData.piece.currentMachineId = undefined;
      pieceData.piece.lastUpdated = now;
    } else if (decision === 'Hold') {
      pieceData.piece.currentStatus = 'DAMAGED';
      pieceData.piece.lastUpdated = now;
    }

    this.addEventLog({
      entityType: 'REWORK',
      entityId: reworkCode,
      event: `SUPERVISOR_DISPOSITION_${decision.toUpperCase().replace(/\s+/g, '_')}`,
      oldState: 'DAMAGED',
      newState: pieceData.piece.currentStatus,
      actor: supervisorName,
      metadata: {
        issueId,
        pieceId: pieceData.piece.id,
        decision,
        note,
      },
    });

    this.notify('STATE_UPDATED', this.state);
    return reworkRecord || { success: true, message: `Disposition ${decision} applied.` };
  }

  // Outsourced Tempering Dispatch (Section 18)
  public dispatchOutsource(params: {
    vendorName: string;
    pieceIds: string[];
    expectedReturnDate: string;
    notes?: string;
    operatorName?: string;
  }): OutsourceRecord {
    const { vendorName, pieceIds, expectedReturnDate, notes, operatorName = 'Supervisor' } = params;

    if (pieceIds.length === 0) {
      throw new Error('Please select at least one piece to dispatch to external tempering vendor.');
    }

    const now = new Date().toISOString();
    const batchReference = `EXT-TMP-${Date.now().toString().slice(-5)}`;
    const recordId = `OUT-${Date.now()}`;

    // Verify pieces
    for (const id of pieceIds) {
      const pieceData = this.getPiece(id);
      if (!pieceData) throw new Error(`Piece ${id} not found.`);
      if (pieceData.piece.route[pieceData.piece.currentOperationIndex] !== 'TEMPERING') {
        throw new Error(`Piece ${id} current operation is not TEMPERING.`);
      }
      pieceData.piece.currentStatus = 'LOADED';
      pieceData.piece.currentMachineId = 'OUTSOURCE';
      pieceData.piece.lastUpdated = now;
    }

    const record: OutsourceRecord = {
      id: recordId,
      vendorName,
      batchReference,
      operation: 'TEMPERING',
      pieceIds,
      dispatchedDate: now,
      expectedReturnDate,
      dispatchedCount: pieceIds.length,
      receivedCount: 0,
      status: 'DISPATCHED',
      notes,
    };

    this.state.outsourceRecords.unshift(record);

    this.addEventLog({
      entityType: 'OUTSOURCE',
      entityId: recordId,
      event: 'OUTSOURCE_DISPATCHED',
      newState: 'DISPATCHED',
      actor: operatorName,
      metadata: { vendorName, count: pieceIds.length, batchReference },
    });

    this.notify('STATE_UPDATED', this.state);
    return record;
  }

  // Outsourced Tempering Receipt (Section 18 - supports partial receipt)
  public receiveOutsource(params: {
    recordId: string;
    receivedPieceIds: string[];
    operatorName?: string;
    notes?: string;
  }): OutsourceRecord {
    const { recordId, receivedPieceIds, operatorName = 'Supervisor', notes } = params;

    const record = this.state.outsourceRecords.find((r) => r.id === recordId);
    if (!record) {
      throw new Error(`Outsource record ${recordId} not found.`);
    }

    if (receivedPieceIds.length === 0) {
      throw new Error('Please specify at least one piece received from vendor.');
    }

    const now = new Date().toISOString();

    for (const id of receivedPieceIds) {
      if (!record.pieceIds.includes(id)) {
        throw new Error(`Piece ${id} is not part of dispatch batch ${record.batchReference}.`);
      }

      const pieceData = this.getPiece(id);
      if (pieceData) {
        // Complete tempering, advance to next operation (Washing)
        pieceData.piece.currentOperationIndex += 1;
        pieceData.piece.currentMachineId = undefined;
        pieceData.piece.currentStatus =
          pieceData.piece.currentOperationIndex >= pieceData.piece.route.length ? 'COMPLETED' : 'AVAILABLE';
        pieceData.piece.lastUpdated = now;
      }
    }

    record.receivedCount += receivedPieceIds.length;
    record.receivedDate = now;
    if (notes) {
      record.notes = (record.notes ? record.notes + ' | ' : '') + notes;
    }

    if (record.receivedCount >= record.dispatchedCount) {
      record.status = 'COMPLETED';
    } else {
      record.status = 'PARTIAL_RECEIVED';
    }

    this.addEventLog({
      entityType: 'OUTSOURCE',
      entityId: recordId,
      event: 'OUTSOURCE_PIECES_RECEIVED',
      newState: record.status,
      actor: operatorName,
      metadata: {
        vendorName: record.vendorName,
        receivedCount: receivedPieceIds.length,
        totalReceived: record.receivedCount,
        dispatchedCount: record.dispatchedCount,
      },
    });

    this.notify('STATE_UPDATED', this.state);
    return record;
  }

  // Add new machine (Master Data Configuration)
  // Workstation Single Operation Constraint: A workstation can only do one thing at a time (e.g. cutting machine only cuts)
  public addMachine(machine: Omit<Machine, 'statusUpdatedAt'>): Machine {
    if (this.state.machines.some((m) => m.id === machine.id)) {
      throw new Error(`Machine ID ${machine.id} already exists.`);
    }
    const newMachine: Machine = {
      ...machine,
      // Single capability strictly enforced: workstation only performs its assigned process
      capabilities: [machine.department],
      statusUpdatedAt: new Date().toISOString(),
    };
    this.state.machines.push(newMachine);
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: newMachine.id,
      event: 'MACHINE_CONFIGURED',
      actor: 'Admin',
      metadata: { department: newMachine.department, capabilities: newMachine.capabilities },
    });
    this.notify('STATE_UPDATED', this.state);
    return newMachine;
  }

  // Operators Master Management (Section: Operator Setup & Assignment)
  public getOperators(): Operator[] {
    return this.state.operators || [];
  }

  public addOperator(data: Omit<Operator, 'id' | 'createdAt'>): Operator {
    if (!data.name || !data.badgeNumber) {
      throw new Error('Operator name and badge number are required.');
    }
    const nextNum = (this.state.operators?.length || 0) + 1;
    const newOp: Operator = {
      id: `OP-${String(nextNum).padStart(2, '0')}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    if (!this.state.operators) {
      this.state.operators = [];
    }
    this.state.operators.push(newOp);
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: newOp.id,
      event: 'OPERATOR_REGISTERED',
      actor: 'Admin',
      metadata: { name: newOp.name, badge: newOp.badgeNumber, department: newOp.department },
    });
    this.notify('STATE_UPDATED', this.state);
    return newOp;
  }

  public updateOperator(id: string, data: Partial<Operator>): Operator {
    const op = this.state.operators?.find((o) => o.id === id);
    if (!op) {
      throw new Error(`Operator ${id} not found.`);
    }
    Object.assign(op, data);
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: id,
      event: 'OPERATOR_UPDATED',
      actor: 'Admin',
      metadata: data,
    });
    this.notify('STATE_UPDATED', this.state);
    return op;
  }

  public deleteOperator(id: string): boolean {
    const idx = this.state.operators?.findIndex((o) => o.id === id);
    if (idx === undefined || idx === -1) {
      throw new Error(`Operator ${id} not found.`);
    }
    const removed = this.state.operators.splice(idx, 1)[0];
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: id,
      event: 'OPERATOR_REMOVED',
      actor: 'Admin',
      metadata: { name: removed.name },
    });
    this.notify('STATE_UPDATED', this.state);
    return true;
  }

  // Update Machine Terminal configuration (department, operator)
  // Workstation Single Operation Constraint: A workstation can only do one thing at a time (e.g. cutting machine only cuts)
  public updateMachine(id: string, data: Partial<Machine>): Machine {
    const machine = this.state.machines.find((m) => m.id === id);
    if (!machine) {
      throw new Error(`Machine ${id} not found.`);
    }
    if (data.department) {
      // Workstation single capability constraint: workstation can only do one thing at a time
      data.capabilities = [data.department];
    }
    Object.assign(machine, data);
    machine.statusUpdatedAt = new Date().toISOString();
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: id,
      event: 'MACHINE_RECONFIGURED',
      actor: 'Manager',
      metadata: data,
    });
    this.notify('STATE_UPDATED', this.state);
    return machine;
  }

  // Update Route Process for a Job and its active pieces
  public updateJobRoute(
    workOrderId: string,
    jobId: string,
    newRoute: OperationType[],
    actor = 'Manager'
  ): Job {
    if (!newRoute || newRoute.length === 0) {
      throw new Error('Manufacturing route must contain at least one operation.');
    }
    const wo = this.state.workOrders.find((w) => w.id === workOrderId);
    if (!wo) throw new Error(`Work order ${workOrderId} not found.`);
    const job = wo.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error(`Job ${jobId} not found in work order ${workOrderId}.`);

    const oldRoute = [...job.route];
    job.route = [...newRoute];

    // Safely update pieces belonging to this job
    for (const piece of job.pieces) {
      const currentOp = piece.route[piece.currentOperationIndex];
      piece.route = [...newRoute];
      // If piece is not yet completed, find where it currently is in the new route
      if (piece.currentStatus !== 'COMPLETED') {
        const foundIndex = newRoute.indexOf(currentOp);
        if (foundIndex !== -1) {
          piece.currentOperationIndex = foundIndex;
        } else {
          // If previous op was removed, clamp or set to first uncompleted
          piece.currentOperationIndex = Math.min(piece.currentOperationIndex, newRoute.length - 1);
        }
      }
      piece.lastUpdated = new Date().toISOString();
    }

    this.addEventLog({
      entityType: 'WORK_ORDER',
      entityId: workOrderId,
      event: 'ROUTE_PROCESS_UPDATED',
      oldState: oldRoute.join(' → '),
      newState: newRoute.join(' → '),
      actor,
      metadata: { jobId, workOrderId },
    });

    this.notify('STATE_UPDATED', this.state);
    return job;
  }

  // Packing & Crating Methods
  public getCrates(): PackingCrate[] {
    return this.state.crates || [];
  }

  public createCrate(params: {
    workOrderId: string;
    customerName: string;
    crateType: CrateType;
    capacityPieces?: number;
    packerName?: string;
    notes?: string;
  }): PackingCrate {
    const { workOrderId, customerName, crateType, capacityPieces = 10, packerName = 'Lucas Vance (Dispatch QA)', notes } = params;
    const count = (this.state.crates?.length || 0) + 1;
    const crateId = `CRT-2026-${String(count).padStart(3, '0')}`;
    const cleanWoNum = workOrderId.replace(/\D/g, '').slice(-3) || '100';
    const crateNumber = `CRATE-WO${cleanWoNum}-${String.fromCharCode(64 + (count % 26 || 1))}`;

    const newCrate: PackingCrate = {
      id: crateId,
      crateNumber,
      crateType,
      workOrderId,
      customerName,
      packedPieceIds: [],
      capacityPieces,
      weightKgEstimated: 0,
      status: 'PACKING',
      packerName,
      packedAt: new Date().toISOString(),
      notes,
    };

    if (!this.state.crates) this.state.crates = [];
    this.state.crates.unshift(newCrate);

    this.addEventLog({
      entityType: 'PACKING',
      entityId: crateId,
      event: 'CRATE_CREATED',
      actor: packerName,
      metadata: { crateNumber, workOrderId, customerName, crateType },
    });

    this.notify('STATE_UPDATED', this.state);
    return newCrate;
  }

  public packPiecesIntoCrate(crateId: string, pieceIds: string[], packerName = 'Lucas Vance (Dispatch QA)'): PackingCrate {
    const crate = this.state.crates?.find((c) => c.id === crateId);
    if (!crate) throw new Error(`Crate ${crateId} not found.`);
    if (crate.status !== 'PACKING') throw new Error(`Crate ${crateId} is already ${crate.status} and sealed.`);

    for (const pid of pieceIds) {
      if (!crate.packedPieceIds.includes(pid)) {
        crate.packedPieceIds.push(pid);
      }
    }
    // Calculate approximate weight: ~2.5kg per m2 per mm thickness
    let estWeight = 0;
    for (const pid of crate.packedPieceIds) {
      const p = this.getPiece(pid);
      if (p) {
        const areaM2 = (p.piece.dimensions.widthMm / 1000) * (p.piece.dimensions.heightMm / 1000);
        estWeight += areaM2 * p.piece.dimensions.thicknessMm * 2.5;
      }
    }
    crate.weightKgEstimated = Math.round(estWeight) || (crate.packedPieceIds.length * 18);

    this.addEventLog({
      entityType: 'PACKING',
      entityId: crateId,
      event: 'PIECES_PACKED',
      actor: packerName,
      metadata: { addedPieces: pieceIds.length, totalPacked: crate.packedPieceIds.length },
    });

    this.notify('STATE_UPDATED', this.state);
    return crate;
  }

  public sealCrate(crateId: string, packerName = 'Supervisor QA'): PackingCrate {
    const crate = this.state.crates?.find((c) => c.id === crateId);
    if (!crate) throw new Error(`Crate ${crateId} not found.`);
    if (crate.packedPieceIds.length === 0) throw new Error('Cannot seal an empty crate. Pack glass pieces first.');

    crate.status = 'SEALED';
    crate.sealedAt = new Date().toISOString();

    this.addEventLog({
      entityType: 'PACKING',
      entityId: crateId,
      event: 'CRATE_SEALED',
      actor: packerName,
      metadata: { crateNumber: crate.crateNumber, pieceCount: crate.packedPieceIds.length },
    });

    this.notify('STATE_UPDATED', this.state);
    return crate;
  }

  // Delivery & Dispatch Logistics Methods
  public getDeliveries(): DeliveryOrder[] {
    return this.state.deliveries || [];
  }

  public createDelivery(params: {
    workOrderId: string;
    customerName: string;
    deliveryAddress: string;
    contactPhone: string;
    driverName: string;
    vehiclePlate: string;
    crateIds: string[];
    pieceIds?: string[];
    notes?: string;
  }): DeliveryOrder {
    const count = (this.state.deliveries?.length || 0) + 1;
    const deliveryId = `DEL-2026-${String(count).padStart(3, '0')}`;
    const deliveryNoteNumber = `DN-2026-${String(8800 + count)}`;

    const newDelivery: DeliveryOrder = {
      id: deliveryId,
      deliveryNoteNumber,
      workOrderId: params.workOrderId,
      customerName: params.customerName,
      deliveryAddress: params.deliveryAddress,
      contactPhone: params.contactPhone,
      driverName: params.driverName,
      vehiclePlate: params.vehiclePlate,
      crateIds: params.crateIds,
      pieceIds: params.pieceIds || [],
      status: 'READY_FOR_DISPATCH',
      notes: params.notes,
    };

    if (!this.state.deliveries) this.state.deliveries = [];
    this.state.deliveries.unshift(newDelivery);

    this.addEventLog({
      entityType: 'DELIVERY',
      entityId: deliveryId,
      event: 'DELIVERY_ORDER_CREATED',
      actor: 'Logistics Coordinator',
      metadata: { deliveryNoteNumber, customer: params.customerName, crates: params.crateIds.length },
    });

    this.notify('STATE_UPDATED', this.state);
    return newDelivery;
  }

  public dispatchDelivery(deliveryId: string, actor = 'Logistics Supervisor'): DeliveryOrder {
    const delivery = this.state.deliveries?.find((d) => d.id === deliveryId);
    if (!delivery) throw new Error(`Delivery ${deliveryId} not found.`);

    delivery.status = 'OUT_FOR_DELIVERY';
    delivery.dispatchedAt = new Date().toISOString();

    // Mark associated crates as DISPATCHED
    if (this.state.crates) {
      for (const crate of this.state.crates) {
        if (delivery.crateIds.includes(crate.id)) {
          crate.status = 'DISPATCHED';
        }
      }
    }

    this.addEventLog({
      entityType: 'DELIVERY',
      entityId: deliveryId,
      event: 'DISPATCHED_TO_DRIVER',
      actor,
      metadata: { vehicle: delivery.vehiclePlate, driver: delivery.driverName },
    });

    this.notify('STATE_UPDATED', this.state);
    return delivery;
  }

  public markDelivered(deliveryId: string, recipientSignature = 'Site Received', actor = 'Delivery Driver'): DeliveryOrder {
    const delivery = this.state.deliveries?.find((d) => d.id === deliveryId);
    if (!delivery) throw new Error(`Delivery ${deliveryId} not found.`);

    delivery.status = 'DELIVERED';
    delivery.deliveredAt = new Date().toISOString();
    delivery.recipientSignature = recipientSignature;

    // Mark crates as DELIVERED
    if (this.state.crates) {
      for (const crate of this.state.crates) {
        if (delivery.crateIds.includes(crate.id)) {
          crate.status = 'DELIVERED';
        }
      }
    }

    this.addEventLog({
      entityType: 'DELIVERY',
      entityId: deliveryId,
      event: 'DELIVERY_CONFIRMED',
      actor,
      metadata: { signature: recipientSignature, deliveredAt: delivery.deliveredAt },
    });

    this.notify('STATE_UPDATED', this.state);
    return delivery;
  }

  // --- INTRANET LOCALHOST QUOTE--RR SYNC METHODS ---

  public getIntranetQuotes(): IntranetQuote[] {
    return this.state.intranetQuotes || [];
  }

  public getIntranetSyncConfig(): IntranetSyncConfig {
    return (
      this.state.intranetSyncConfig || {
        localhostUrl: 'http://localhost:5000',
        pollingIntervalSeconds: 5,
        autoSyncApprovedQuotes: false,
        pushProgressToLocalhost: true,
        lastSyncStatus: 'DISCONNECTED',
        lastSyncMessage: 'Ready to connect to Localhost Quote--RR',
      }
    );
  }

  public updateIntranetSyncConfig(configUpdate: Partial<IntranetSyncConfig>): IntranetSyncConfig {
    this.state.intranetSyncConfig = {
      ...this.getIntranetSyncConfig(),
      ...configUpdate,
      lastSyncTimestamp: new Date().toISOString(),
    };
    this.notify('STATE_UPDATED', this.state);
    return this.state.intranetSyncConfig;
  }

  public upsertIntranetQuotes(incomingQuotes: IntranetQuote[]): {
    quotes: IntranetQuote[];
    autoImportedCount: number;
  } {
    if (!this.state.intranetQuotes) {
      this.state.intranetQuotes = [];
    }

    let autoImportedCount = 0;
    const config = this.getIntranetSyncConfig();

    for (const incoming of incomingQuotes) {
      const idx = this.state.intranetQuotes.findIndex((q) => q.id === incoming.id);
      if (idx >= 0) {
        // Preserve existing syncedWorkOrderId if already imported
        const existing = this.state.intranetQuotes[idx];
        this.state.intranetQuotes[idx] = {
          ...incoming,
          syncedWorkOrderId: existing.syncedWorkOrderId || incoming.syncedWorkOrderId,
          syncedAt: existing.syncedAt || incoming.syncedAt,
          status: existing.syncedWorkOrderId ? 'IN_PRODUCTION' : incoming.status,
        };
      } else {
        this.state.intranetQuotes.unshift(incoming);
      }

      // Auto-import if enabled and quote is approved and not yet imported
      const targetQuote = this.state.intranetQuotes.find((q) => q.id === incoming.id);
      if (
        config.autoSyncApprovedQuotes &&
        targetQuote &&
        targetQuote.status === 'APPROVED' &&
        !targetQuote.syncedWorkOrderId
      ) {
        try {
          this.importQuoteAsWorkOrder(targetQuote.id);
          autoImportedCount++;
        } catch (e) {
          console.error(`Auto-import error for quote ${targetQuote.id}:`, e);
        }
      }
    }

    this.state.intranetSyncConfig = {
      ...config,
      lastSyncStatus: 'CONNECTED',
      lastSyncTimestamp: new Date().toISOString(),
      lastSyncMessage: `Synced ${incomingQuotes.length} quotes from Localhost Quote--RR (${autoImportedCount} auto-imported).`,
    };

    this.notify('STATE_UPDATED', this.state);
    return { quotes: this.state.intranetQuotes, autoImportedCount };
  }

  public importQuoteAsWorkOrder(quoteId: string): WorkOrder {
    const quote = this.state.intranetQuotes?.find((q) => q.id === quoteId);
    if (!quote) throw new Error(`Quote ${quoteId} not found`);

    // Standardized Factory Route Sequence:
    // Cutting -> Polishing -> Beveling -> Washing -> Tempering -> Sandblasting -> Double Glazing -> Packing & Delivery
    const STANDARD_ORDER: OperationType[] = [
      'CUTTING',
      'POLISHING',
      'BEVELING',
      'WASHING',
      'TEMPERING',
      'SANDBLASTING',
      'DOUBLE_GLAZING',
      'PACKING_DELIVERY',
    ];

    const cleanQuoteId = quote.id.replace(/[^A-Za-z0-9]/g, '');
    const woNumber = `WO-${cleanQuoteId}`;

    // If work order already exists, ensure quote is linked
    const existingWo = this.state.workOrders.find((w) => w.id === woNumber);
    if (existingWo) {
      quote.status = 'IN_PRODUCTION';
      quote.syncedWorkOrderId = existingWo.id;
      quote.syncedAt = new Date().toISOString();
      this.notify('STATE_UPDATED', this.state);
      return existingWo;
    }

    const jobs: Job[] = quote.items.map((item, idx) => {
      const jobId = `JOB-${cleanQuoteId}-${idx + 1}`;

      // Build sequence based on item's processes or specifications
      let requestedOps: OperationType[] = [];
      if (item.requiredOperations && item.requiredOperations.length > 0) {
        requestedOps = [...item.requiredOperations];
      } else {
        // Smart inference from description/glassSpec
        const text = `${item.description} ${item.glassSpec}`.toUpperCase();
        requestedOps.push('CUTTING');
        if (text.includes('POLISH') || text.includes('ARRIS') || text.includes('EDGE')) {
          requestedOps.push('POLISHING');
        }
        if (text.includes('BEVEL')) {
          requestedOps.push('BEVELING');
        }
        requestedOps.push('WASHING');
        if (text.includes('TEMPER') || text.includes('TOUGHEN') || text.includes('HEAT')) {
          requestedOps.push('TEMPERING');
        }
        if (text.includes('SANDBLAST') || text.includes('FROST') || text.includes('ETCH')) {
          requestedOps.push('SANDBLASTING');
        }
        if (text.includes('IGU') || text.includes('DGU') || text.includes('DOUBLE') || text.includes('INSULAT')) {
          requestedOps.push('DOUBLE_GLAZING');
        }
        requestedOps.push('PACKING_DELIVERY');
      }

      // Guarantee CUTTING is always first, and PACKING_DELIVERY is included
      if (!requestedOps.includes('CUTTING')) requestedOps.unshift('CUTTING');
      if (!requestedOps.includes('PACKING_DELIVERY')) requestedOps.push('PACKING_DELIVERY');

      // Sort according to standardized factory route order
      const sortedRoute = STANDARD_ORDER.filter((op) => requestedOps.includes(op));

      const pieces: Piece[] = [];
      for (let p = 1; p <= item.quantity; p++) {
        const pad = String(p).padStart(3, '0');
        pieces.push({
          id: `${woNumber}-J${idx + 1}-P${pad}`,
          pieceNumber: p,
          jobId,
          workOrderId: woNumber,
          customerReference: `${quote.customerName.slice(0, 15)}-${item.description.slice(0, 15)}`,
          dimensions: {
            widthMm: item.widthMm,
            heightMm: item.heightMm,
            thicknessMm: item.thicknessMm,
          },
          glassSpec: item.glassSpec || item.description,
          route: sortedRoute,
          currentOperationIndex: 0,
          currentStatus: 'AVAILABLE',
          lastUpdated: new Date().toISOString(),
        });
      }

      return {
        id: jobId,
        workOrderId: woNumber,
        glassSpec: item.glassSpec || item.description,
        thicknessMm: item.thicknessMm,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        quantity: item.quantity,
        route: sortedRoute,
        pieces,
      };
    });

    const newWo: WorkOrder = {
      id: woNumber,
      sourceSystemId: `Quote-RR (${quote.id})`,
      customerReference: quote.customerName,
      customerName: quote.customerName,
      projectTitle: quote.projectTitle,
      orderDate: quote.quoteDate || new Date().toISOString(),
      dueDate: quote.validUntil || new Date(Date.now() + 86400000 * 14).toISOString(),
      status: 'IN_PROGRESS',
      jobs,
      notes: `Direct sync from Intranet Quote--RR (${quote.id}). Total Value: ${quote.totalAmount || 0} ${
        quote.currency || 'AED'
      }`,
    };

    this.state.workOrders.unshift(newWo);
    quote.status = 'IN_PRODUCTION';
    quote.syncedWorkOrderId = newWo.id;
    quote.syncedAt = new Date().toISOString();

    const totalPieces = jobs.reduce((sum, j) => sum + j.pieces.length, 0);

    this.addEventLog({
      entityType: 'WORK_ORDER',
      entityId: newWo.id,
      event: 'QUOTE_IMPORTED_TO_PRODUCTION',
      actor: 'Quote--RR Intranet Sync',
      metadata: {
        quoteId: quote.id,
        totalPieces,
        customerName: quote.customerName,
        projectTitle: quote.projectTitle,
      },
    });

    this.notify('STATE_UPDATED', this.state);
    return newWo;
  }

  public getQuoteProgress(quoteId: string) {
    const quote = this.state.intranetQuotes?.find((q) => q.id === quoteId);
    if (!quote) return null;
    if (!quote.syncedWorkOrderId) {
      return {
        quoteId: quote.id,
        status: quote.status,
        progressPercent: 0,
        totalPieces: quote.items.reduce((acc, i) => acc + i.quantity, 0),
        completedPieces: 0,
        inProduction: false,
      };
    }

    const wo = this.state.workOrders.find((w) => w.id === quote.syncedWorkOrderId);
    if (!wo) return null;

    const allPieces = wo.jobs.flatMap((j) => j.pieces);
    const totalPieces = allPieces.length;
    const completedPieces = allPieces.filter((p) => p.currentStatus === 'COMPLETED').length;

    const opCounts: Record<string, number> = {};
    for (const p of allPieces) {
      const currentOp = p.route[p.currentOperationIndex] || 'DONE';
      opCounts[currentOp] = (opCounts[currentOp] || 0) + 1;
    }

    return {
      quoteId: quote.id,
      workOrderId: wo.id,
      customerName: quote.customerName,
      projectTitle: quote.projectTitle,
      totalPieces,
      completedPieces,
      progressPercent: totalPieces > 0 ? Math.round((completedPieces / totalPieces) * 100) : 0,
      byOperation: opCounts,
      status: wo.status,
      inProduction: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Reset demo data to clean fresh state
  public resetToDefault(): FactoryState {
    this.state = {
      machines: JSON.parse(JSON.stringify(INITIAL_MACHINES)),
      workOrders: generateSeedWorkOrders(),
      assignments: [],
      transfers: [],
      issues: [],
      reworks: [],
      outsourceRecords: [],
      statusHistory: [],
      eventLogs: [],
      operators: JSON.parse(JSON.stringify(INITIAL_OPERATORS)),
      crates: JSON.parse(JSON.stringify(INITIAL_CRATES)),
      deliveries: JSON.parse(JSON.stringify(INITIAL_DELIVERIES)),
      intranetQuotes: JSON.parse(JSON.stringify(INITIAL_INTRANET_QUOTES)),
      intranetSyncConfig: JSON.parse(JSON.stringify(INITIAL_INTRANET_SYNC_CONFIG)),
    };
    this.addEventLog({
      entityType: 'MACHINE',
      entityId: 'SYSTEM',
      event: 'DATABASE_RESET_TO_SEED',
      actor: 'System Admin',
    });
    this.notify('STATE_UPDATED', this.state);
    return this.state;
  }
}

export const factoryStore = new FactoryStore();
