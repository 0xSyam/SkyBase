import { getToken, setToken, setUser, clearAuth, type StoredUser } from "@/lib/auth/storage";
import type {
  ApiResponse,
  ApiListResponse,
  Flight,
  FlightCreateData,
  FlightRescheduleData,
  ItemCatalog,
  GroundcrewInventoryResponse,
  AircraftInventoryResponse,
  Inspection,
  InspectionSummary,
  AircraftValidation,
  Notification,
  NotificationStats,
  WarehouseRequest,
  WarehouseRequestCreateData,
  AircraftStatusReport,
  Aircraft, // Pastikan Aircraft diimport atau tambahkan di types/api.ts jika belum ada
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://skybase.novarentech.web.id/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  auth?: boolean; // defaults to true
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path.replace(/^\//, ""), API_BASE_URL + "/");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    headers = {},
    query,
    body,
    auth = true,
    signal,
  } = opts;

  const finalHeaders: Record<string, string> = {
    "Accept": "application/json",
    ...headers,
  };

  if (body !== undefined && body !== null && finalHeaders["Content-Type"] === undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (auth && token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: finalHeaders,
    body: body !== undefined && body !== null ? (finalHeaders["Content-Type"]?.includes("application/json") ? JSON.stringify(body) : (body as BodyInit)) : undefined,
    credentials: "omit",
    signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const errorMessage = isJson && payload?.message ? payload.message : res.statusText;
    const error = new Error(errorMessage || `Request failed: ${res.status}`) as Error & {
      status: number;
      payload: unknown;
    };
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

// Auth
export const authApi = {
  async login(email: string, password: string) {
    type LoginData = { user: StoredUser; token: string; token_type: string };
    const res = await request<ApiResponse<LoginData>>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    if (res?.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  },
  async profile() {
    return request<ApiResponse<StoredUser>>("/auth/profile");
  },
  async logout() {
    try {
      await request<ApiResponse<{ message: string }>>("/auth/logout", { method: "POST" });
    } finally {
      clearAuth();
    }
  },
  async register(params: { name: string; email: string; password: string; password_confirmation: string; role: "supervisor" | "warehouse" | "groundcrew"; phone?: string | null; }) {
    type RegisterData = { user: StoredUser & { user_id: number; is_active?: boolean }; token: string; token_type: string };
    return request<ApiResponse<RegisterData>>("/auth/register", {
      method: "POST",
      auth: false,
      body: params,
    });
  },
  async createUser(params: { name: string; email: string; password: string; role: "warehouse" | "groundcrew"; phone?: string | null; }) {
    type UserData = { user_id: number; name: string; email: string; role: string };
    return request<ApiResponse<UserData>>("/users", {
      method: "POST",
      body: params,
    });
  },
  async updateProfile(data: {
    name: string;
    email: string;
    phone?: string | null;
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
  }) {
    return request<ApiResponse<{ user: StoredUser }>>("/auth/profile", {
      method: "PUT",
      body: data,
    });
  },
  async roles() {
    return request<ApiResponse<{ roles: Array<{ role_id: number; name: string }> }>>("/auth/roles");
  },
  async permissions() {
    return request<ApiResponse<{ permissions: string[] }>>("/auth/permissions");
  },
  async getAllUsers() {
    return request<ApiResponse<Array<{ user_id: number; name: string; email: string; phone?: string; role: string; is_active: boolean; created_at: string }>>>("/users");
  },
  async deleteUser(userId: string | number) {
    return request<ApiResponse<{ message: string }>>(`/users/${userId}`, {
      method: "DELETE",
    });
  },
  async resetPassword(userId: string | number) {
    return request<ApiResponse<{ message: string }>>(`/users/${userId}/reset-password`, {
      method: "PUT",
      body: {
        new_password: "password123",
        new_password_confirmation: "password123"
      }
    });
  },
};

// Dashboards
export const dashboardApi = {
  groundcrew() {
    return request<ApiResponse<{ role: string }>>("/groundcrew/dashboard");
  },
  supervisor() {
    return request<ApiResponse<{ role: string }>>("/supervisor/dashboard");
  },
  warehouse() {
    return request<ApiResponse<{ role: string }>>("/warehouse/dashboard");
  },
};

// Flights
export const flightApi = {
  list() {
    return request<ApiResponse<{ flights: Flight[] }>>("/flights");
  },
  create(data: FlightCreateData) {
    return request<ApiResponse<{ flight_id: number }>>("/flights", { method: "POST", body: data });
  },
  reschedule(flightId: number, data: FlightRescheduleData) {
    return request<ApiResponse<Flight>>(`/flights/${flightId}/reschedule`, { method: "PUT", body: data });
  },
  delete(flightId: number) {
    return request<ApiResponse<{ message: string }>>(`/flights/${flightId}`, { method: "DELETE" });
  },
};

// Aircraft
export const aircraftApi = {
  list() {
    return request<ApiResponse<Aircraft[]>>("/aircraft");
  },
};

// Items
export const itemApi = {
  list(params?: { page?: number; per_page?: number; search?: string }) {
    return request<ApiListResponse<ItemCatalog>>("/items", { query: params });
  },
  get(id: number | string) {
    return request<ApiResponse<ItemCatalog>>(`/items/${id}`);
  },
  create(data: Partial<ItemCatalog>) {
    return request<ApiResponse<ItemCatalog>>("/items", { method: "POST", body: data });
  },
  update(id: number | string, data: Partial<ItemCatalog>) {
    return request<ApiResponse<ItemCatalog>>(`/items/${id}`, { method: "PUT", body: data });
  },
  remove(id: number | string) {
    return request<ApiResponse<{ message: string }>>(`/items/${id}`, { method: "DELETE" });
  },
  requirements(id: number | string) {
    return request<ApiListResponse<unknown>>(`/items/${id}/requirements`);
  },
  byCategory(category: string) {
    return request<ApiListResponse<ItemCatalog>>(`/items/category/${encodeURIComponent(category)}`);
  },
};

// Inventory
export const inventoryApi = {
  groundcrewAll() {
    return request<ApiResponse<GroundcrewInventoryResponse>>("/inventory/groundcrew");
  },
  groundcrewDoc() {
    return request<ApiListResponse<unknown>>("/inventory/groundcrew/doc");
  },
  groundcrewAse() {
    return request<ApiListResponse<unknown>>("/inventory/groundcrew/ase");
  },
  
  transferToAircraft(data: { 
    type: "doc" | "ase"; 
    inventory_id: number; 
    aircraft_id: number; 
    quantity?: number 
  }) {
    return request<ApiResponse<unknown>>("/inventory/groundcrew/transfer-to-aircraft", { 
      method: "POST", 
      body: data 
    });
  },

  aircraftInventory(aircraftId: number | string) {
    return request<ApiResponse<AircraftInventoryResponse>>(`/inventory/aircraft/${aircraftId}`);
  },
  itemsByCategory(category: string) {
    return request<ApiListResponse<ItemCatalog>>(`/inventory/items/${encodeURIComponent(category)}`);
  },
  addDoc(data: { item_id: number; quantity: number; doc_number: string; revision_no: string; effective_date: string; condition?: string }) {
    return request<ApiResponse<unknown>>("/inventory/groundcrew/doc", { method: "POST", body: data });
  },
  updateDoc(gcDocId: number, data: { doc_number: string; revision_no: string; effective_date: string; quantity: number }) {
    return request<ApiResponse<unknown>>(`/inventory/groundcrew/doc/${gcDocId}`, { method: "PUT", body: data });
  },
  deleteDoc(gcDocId: number) {
    return request<ApiResponse<{ message: string }>>(`/inventory/groundcrew/doc/${gcDocId}`, { method: "DELETE" });
  },
  addAse(data: { item_id: number; serial_number: string; seal_number: string; expires_at: string; condition?: string }) {
    return request<ApiResponse<unknown>>("/inventory/groundcrew/ase", { method: "POST", body: data });
  },
  updateAse(gcAseId: number, data: { serial_number: string; seal_number: string; expires_at: string; quantity: number }) {
    return request<ApiResponse<unknown>>(`/inventory/groundcrew/ase/${gcAseId}`, { method: "PUT", body: data });
  },
  deleteAse(gcAseId: number) {
    return request<ApiResponse<{ message: string }>>(`/inventory/groundcrew/ase/${gcAseId}`, { method: "DELETE" });
  },
};

export const inspectionApi = {
  today() {
    return request<ApiListResponse<Flight>>("/inspections/today");
  },
  availableFlights() {
    return request<ApiListResponse<Flight>>("/inspections/available-flights");
  },
  myInspections() {
    return request<ApiListResponse<Inspection>>("/inspections/my-inspections");
  },
  aircraftValidation(aircraftId: number | string) {
    return request<ApiResponse<AircraftValidation>>(`/inspections/aircraft/${aircraftId}/validation`);
  },
  
  toggleItem(inspectionItemId: number | string) {
    return request<ApiResponse<unknown>>(`/inspections/items/${inspectionItemId}/toggle`, { method: "PUT" });
  },
  replaceItem(inspectionItemId: number | string, data: { replacement_item_id: number; notes?: string }) {
    return request<ApiResponse<unknown>>(`/inspections/items/${inspectionItemId}/replace`, { method: "POST", body: data });
  },
  submit(inspectionId: number | string, data: { status: "READY" | "DELAY"; notes?: string }) {
    return request<ApiResponse<unknown>>(`/inspections/${inspectionId}/submit`, { method: "PUT", body: data });
  },
  summary() {
    return request<ApiResponse<InspectionSummary>>("/inspections/summary");
  },
};

// Notifications
export const notificationApi = {
  getAll() {
    return request<ApiListResponse<Notification>>("/notifications");
  },
  getById(id: string | number) {
    return request<ApiResponse<Notification>>(`/notifications/${id}`);
  },
  getRecent() {
    return request<ApiListResponse<Notification>>("/notifications/recent");
  },
  getToday() {
    return request<ApiListResponse<Notification>>("/notifications/today");
  },
  getStats() {
    return request<ApiResponse<NotificationStats>>("/notifications/stats");
  },
  getByType(type: string) {
    return request<ApiListResponse<Notification>>(`/notifications/type/${encodeURIComponent(type)}`);
  },
  getForItem(relatedType: string, relatedId: number | string) {
    return request<ApiListResponse<Notification>>(`/notifications/item/${encodeURIComponent(relatedType)}/${relatedId}`);
  },
};

// Reports
export const reportApi = {
  aircraftStatus(params: { aircraft_id: number; from_date: string; to_date: string; group_by?: "daily" | "weekly" | "monthly" | null; type?: "ASE" | "DOC" | "ALL" | null }) {
    return request<ApiResponse<AircraftStatusReport>>("/reports/aircraft-status", { query: params as Record<string, string | number | boolean | undefined | null> });
  },
  fleetSummary(params: { from_date: string; to_date: string }) {
    return request<ApiResponse<{ message: string }>>("/reports/fleet-summary", { query: params });
  },
};

// Warehouse requests
export const warehouseRequestApi = {
  list() {
    return request<ApiListResponse<WarehouseRequest>>("/warehouse-requests");
  },
  myRequests() {
    return request<ApiListResponse<WarehouseRequest>>("/warehouse-requests/my-requests");
  },
  get(id: number | string) {
    return request<ApiResponse<WarehouseRequest>>(`/warehouse-requests/${id}`);
  },
  create(data: WarehouseRequestCreateData) {
    return request<ApiResponse<WarehouseRequest>>("/warehouse-requests", { method: "POST", body: data });
  },
  approve(id: number | string, data?: { 
    items: Array<{ 
      item_id: number; 
      qty: number;
      seal_number?: string;
      expires_at?: string;
    }> 
  }) {
    return request<ApiResponse<WarehouseRequest>>(`/warehouse-requests/${id}/approve`, { method: "PUT", body: data });
  },
  reject(id: number | string, data: { rejection_reason: string; items?: Array<{ item_id: number; qty: number }> }) {
    return request<ApiResponse<WarehouseRequest>>(`/warehouse-requests/${id}/reject`, { method: "PUT", body: data });
  },
  fulfill(id: number | string) {
    return request<ApiResponse<WarehouseRequest>>(`/warehouse-requests/${id}/fulfill`, { method: "PUT" });
  },
};

export const skybase = {
  baseUrl: API_BASE_URL,
  request,
  auth: authApi,
  dashboard: dashboardApi,
  flights: flightApi,
  aircraft: aircraftApi, // Added aircraft
  items: itemApi,
  inventory: inventoryApi,
  inspections: inspectionApi,
  notifications: notificationApi,
  reports: reportApi,
  warehouseRequests: warehouseRequestApi,
};

export default skybase;