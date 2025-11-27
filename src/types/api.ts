// API Types - Generated from OpenAPI Schema

// Base API Response Types
export type ApiResponse<T> = {
  status: string;
  message?: string;
  data: T;
};

export type ApiListResponse<T> = {
  status: string;
  data: T[] | { items: T[]; total?: number } | T;
};

export type ApiError = {
  status: string;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
};

// User & Auth Types
export type UserRole = "supervisor" | "warehouse" | "groundcrew";

export type User = {
  user_id: number | string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean | string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LoginResponse = {
  user: User;
  token: string;
  token_type: string;
};

export type RoleInfo = {
  role_id: number;
  name: string;
};

export type Permissions = {
  is_supervisor: string;
  is_warehouse: string;
  is_groundcrew: string;
  can_manage_users: string;
  can_manage_inventory: string;
  can_manage_flights: string;
};

// Aircraft Types
export type Aircraft = {
  aircraft_id: number;
  registration_code: string | null;
  type: string | null;
  type_code?: string | null; // Added to support /aircraft endpoint
  notes?: string | null;
};

export type AircraftType = {
  type_code: string;
  name?: string;
};

// Flight Types
export type FlightStatus = "READY" | "DELAY" | "SCHEDULED";

export type Flight = {
  flight_id: number;
  aircraft: Aircraft;
  route_to: string;
  sched_dep: string | null;
  sched_arr: string | null;
  status: string;
  rescheduled_at?: string | null;
  supervisor?: {
    user_id: number;
    name: string | null;
  };
  created_at?: string | null;
  has_inspection?: boolean;
};

export type FlightCreateData = {
  aircraft_id?: number | null;
  registration_code?: string | null;
  route_to: string;
  sched_dep: string;
  sched_arr?: string | null;
  status?: FlightStatus | null;
};

export type FlightRescheduleData = {
  sched_dep: string;
  sched_arr?: string | null;
  status?: FlightStatus | null;
};

// Item/Catalog Types
export type ItemCategory = "DOC" | "ASE";

export type ItemCatalog = {
  item_id: number;
  name: string;
  category: string;
  unit: string | null;
  requires_doc_number: boolean;
  requires_revision: boolean;
  requires_effective: boolean;
  requires_serial: boolean;
  requires_seal: boolean;
  requires_expiry: boolean;
  created_at: string | null;
  updated_at: string | null;
};

// Inventory Types
export type GcDocInventory = {
  gc_doc_id: number;
  gc_id: number;
  item_id: number;
  quantity: number;
  doc_number: string | null;
  revision_no: string | null;
  effective_date: string | null;
  condition: string | null;
  created_at: string | null;
  updated_at: string | null;
  item?: ItemCatalog;
};

export type GcAseInventory = {
  gc_ase_id: number;
  gc_id: number;
  item_id: number;
  serial_number: string;
  seal_number: string | null;
  expires_at: string | null;
  condition: string | null;
  created_at: string | null;
  updated_at: string | null;
  item?: ItemCatalog;
  quantity?: number;
};

export type AircraftDocInventory = {
  doc_inv_id: number;
  aircraft_id: number;
  item_id: number;
  quantity: number;
  doc_number: string | null;
  revision_no: string | null;
  effective_date: string | null;
  condition: string | null;
  created_at: string | null;
  updated_at: string | null;
  item?: ItemCatalog;
};

export type AircraftAseInventory = {
  ase_inv_id: number;
  aircraft_id: number;
  item_id: number;
  serial_number: string;
  seal_number: string | null;
  expires_at: string | null;
  condition: string | null;
  created_at: string | null;
  updated_at: string | null;
  item?: ItemCatalog;
};

export type GroundcrewInventoryResponse = {
  doc_inventory: GcDocInventory[];
  ase_inventory: GcAseInventory[];
};

export type AircraftInventoryResponse = {
  aircraft: string;
  doc_inventory: AircraftDocInventory[];
  ase_inventory: AircraftAseInventory[];
};

// Inspection Types
export type InspectionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type InspectionOverallStatus = "PASS" | "FAIL" | null;

export type Inspection = {
  inspection_id: number;
  flight: {
    flight_id: number;
    route_to: string;
    sched_dep: string | null;
    aircraft: {
      registration_code: string;
      type: string | null;
    };
  };
  status: string;
  started_at: string | null;
  completed_at: string | null;
  overall_status: string | null;
  duration_minutes: string;
  items_count: number;
  items_passed: number;
  items_failed: number;
};

export type InspectionSummary = {
  total_inspections: number;
  completed_inspections: number;
  in_progress_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  avg_inspection_time: number | null;
};

export type ValidationItem = {
  inspection_item_id: number | string;
  item_id: number;
  item_name: string;
  category: string;
  is_checked: boolean;
  needs_replacement: boolean;
  checked_at: string | null;
  current_serial?: string | null;
  current_doc_number?: string | null;
  current_revision?: string | null;
  expires_at?: string | null;
};

export type AircraftValidation = {
  inspection_id: number;
  aircraft: {
    aircraft_id: string;
    jenis_pesawat: string;
    kode_pesawat: string;
  };
  flight: {
    flight_id: number;
    route_to: string;
  };
  progress: {
    total_items: number;
    checked_items: string | number;
    completion_percentage: number;
    items_need_replacement: string | number;
  };
  items: ValidationItem[] | unknown;
};

// Notification Types
export type NotificationType = "flight" | "expiry" | "inspection" | "request";

export type Notification = {
  notification_id: number;
  type: string;
  message: string;
  related_type: string | null;
  related_id: number | null;
  is_broadcast: boolean;
  created_at: string;
  time_ago: string;
};

export type NotificationStats = {
  total: number;
  today: number;
  this_week: number;
  by_type: {
    flight: number;
    expiry: number;
    inspection: number;
    request: number;
  };
};

// Warehouse Request Types
export type WarehouseRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type WarehouseRequest = {
  wh_req_id: number;
  flight_id?: number;
  requested_by_gc_id: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
  flight?: Flight;
  requested_by?: User;
  items?: Array<{
    item_id: number;
    qty: number;
    reason?: string | null;
  }>;
};

export type WarehouseRequestCreateData = {
  flight_id?: number;
  notes?: string;
  item_id: number;
  qty: number;
  reason?: string | null;
};

// Report Types
export type ReportPeriod = {
  from: string;
  to: string;
  interval: string | unknown;
};

export type InventoryHealth = {
  total_items: number;
  valid_items: number;
  expired_items: number;
  expiring_soon: number;
  health_percentage: number;
};

export type InspectionPerformance = {
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pass_rate: number;
};

export type TimelineEntry = {
  inspections: unknown[];
  count: number;
  summary: {
    total_inspections: number;
    passed: number;
    failed: number;
    total_items_checked: number;
    total_items_replaced: number;
  };
};

export type AircraftStatusReport = {
  aircraft: {
    aircraft_id: string | number;
    registration_code: string;
    type: string;
  };
  period: ReportPeriod;
  current_inventory: {
    total_items: number;
    valid_items: number;
    expired_items: number;
    expiring_soon: number;
    by_category: {
      ASE: {
        total: string | number;
        valid: number;
        expired: number;
        expiring_soon: number;
      };
      DOC: {
        total: string | number;
        valid: number;
        expired: number;
        expiring_soon: number;
      };
    };
  };
  summary: {
    inventory_health: InventoryHealth;
    inspection_performance: InspectionPerformance;
  };
  timeline: Record<string, TimelineEntry>;
};

// Dashboard Types
export type DashboardResponse = {
  role: string;
  message?: string;
};