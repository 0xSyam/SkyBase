import { getToken, setToken, setUser, clearAuth, type StoredUser } from "@/lib/auth/storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://skybase.novarentech.web.id/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResponse<T> = {
  status: string;
  message?: string;
  data: T;
};

export type ApiListResponse<T> = {
  status: string;
  data: T[] | { items: T[]; total?: number } | unknown;
};

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
    body: body !== undefined && body !== null ? (finalHeaders["Content-Type"]?.includes("application/json") ? JSON.stringify(body) : (body as any)) : undefined,
    credentials: "omit",
    signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const errorMessage = isJson && payload?.message ? payload.message : res.statusText;
    const error = new Error(errorMessage || `Request failed: ${res.status}`);
    (error as any).status = res.status;
    (error as any).payload = payload;
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
  async roles() {
    return request<ApiResponse<{ roles: Array<{ role_id: number; name: string }> }>>("/auth/roles");
  },
  async permissions() {
    return request<ApiResponse<{ permissions: string[] }>>("/auth/permissions");
  },
  async getAllUsers() {
    return request<ApiResponse<{ id: string; name: string; role: string }[]>>("/users");
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
    return request<ApiListResponse<any>>("/flights");
  },
  create(data: {
    aircraft_id?: number | null;
    registration_code?: string | null;
    route_to: string;
    sched_dep: string; // ISO
    sched_arr?: string | null; // ISO
    status?: "READY" | "DELAY" | "SCHEDULED" | null;
  }) {
    return request<ApiResponse<any>>("/flights", { method: "POST", body: data });
  },
  reschedule(flightId: number, data: { sched_dep: string; sched_arr?: string | null; status?: "READY" | "DELAY" | "SCHEDULED" | null }) {
    return request<ApiResponse<any>>(`/flights/${flightId}/reschedule`, { method: "PUT", body: data });
  },
};

// Items
export const itemApi = {
  list(params?: { page?: number; per_page?: number; search?: string }) {
    return request<ApiListResponse<any>>("/items", { query: params });
  },
  get(id: number | string) {
    return request<ApiResponse<any>>(`/items/${id}`);
  },
  create(data: any) {
    return request<ApiResponse<any>>("/items", { method: "POST", body: data });
  },
  update(id: number | string, data: any) {
    return request<ApiResponse<any>>(`/items/${id}`, { method: "PUT", body: data });
  },
  remove(id: number | string) {
    return request<ApiResponse<any>>(`/items/${id}`, { method: "DELETE" });
  },
  requirements(id: number | string) {
    return request<ApiListResponse<any>>(`/items/${id}/requirements`);
  },
  byCategory(category: string) {
    return request<ApiListResponse<any>>(`/items/category/${encodeURIComponent(category)}`);
  },
};

// Inventory
export const inventoryApi = {
  groundcrewAll() {
    return request<ApiResponse<{ doc_inventory: any[]; ase_inventory: any[] }>>("/inventory/groundcrew");
  },
  groundcrewDoc() {
    return request<ApiListResponse<any>>("/inventory/groundcrew/doc");
  },
  groundcrewAse() {
    return request<ApiListResponse<any>>("/inventory/groundcrew/ase");
  },
  transferToAircraft(data: { aircraft_id: number; items: Array<{ item_id: number; qty: number }>; notes?: string }) {
    return request<ApiResponse<any>>("/inventory/groundcrew/transfer-to-aircraft", { method: "POST", body: data });
  },
  aircraftInventory(aircraftId: number | string) {
    return request<ApiResponse<any>>(`/inventory/aircraft/${aircraftId}`);
  },
  itemsByCategory(category: string) {
    return request<ApiListResponse<any>>(`/inventory/items/${encodeURIComponent(category)}`);
  },
};

// Inspections (validation flow)
export const inspectionApi = {
  availableFlights() {
    return request<ApiListResponse<any>>("/inspections/available-flights");
  },
  myInspections() {
    return request<ApiListResponse<any>>("/inspections/my-inspections");
  },
  aircraftValidation(aircraftId: number | string) {
    return request<ApiListResponse<any>>(`/inspections/aircraft/${aircraftId}/validation`);
  },
  toggleItem(inspectionItemId: number | string) {
    return request<ApiResponse<any>>(`/inspections/items/${inspectionItemId}/toggle`, { method: "POST" });
  },
  replaceItem(inspectionItemId: number | string, data: { replacement_item_id: number; notes?: string }) {
    return request<ApiResponse<any>>(`/inspections/items/${inspectionItemId}/replace`, { method: "POST", body: data });
  },
  submit(inspectionId: number | string, data: { notes?: string }) {
    return request<ApiResponse<any>>(`/inspections/${inspectionId}/submit`, { method: "POST", body: data });
  },
  summary() {
    return request<ApiResponse<any>>("/inspections/summary");
  },
};

// Notifications
export const notificationApi = {
  list() {
    return request<ApiListResponse<any>>("/notifications");
  },
  recent() {
    return request<ApiListResponse<any>>("/notifications/recent");
  },
  today() {
    return request<ApiListResponse<any>>("/notifications/today");
  },
  stats() {
    return request<ApiResponse<any>>("/notifications/stats");
  },
  byType(type: string) {
    return request<ApiListResponse<any>>(`/notifications/type/${encodeURIComponent(type)}`);
  },
  forItem(relatedType: string, relatedId: number | string) {
    return request<ApiListResponse<any>>(`/notifications/item/${encodeURIComponent(relatedType)}/${relatedId}`);
  },
};

// Reports
export const reportApi = {
  aircraftStatus(params: { aircraft_id: number; from_date: string; to_date: string; group_by?: "daily" | "weekly" | "monthly" | null; type?: "ASE" | "DOC" | "ALL" | null }) {
    return request<ApiResponse<any>>("/reports/aircraft-status", { query: params as any });
  },
  fleetSummary(params: { from_date: string; to_date: string }) {
    return request<ApiResponse<any>>("/reports/fleet-summary", { query: params });
  },
};

// Warehouse requests
export const warehouseRequestApi = {
  list() {
    return request<ApiListResponse<any>>("/warehouse-requests");
  },
  myRequests() {
    return request<ApiListResponse<any>>("/warehouse-requests/my-requests");
  },
  get(id: number | string) {
    return request<ApiResponse<any>>(`/warehouse-requests/${id}`);
  },
  create(data: { flight_id: number; items: Array<{ item_id: number; qty: number }>; notes?: string }) {
    return request<ApiResponse<any>>("/warehouse-requests", { method: "POST", body: data });
  },
  approve(id: number | string) {
    return request<ApiResponse<any>>(`/warehouse-requests/${id}/approve`, { method: "PUT" });
  },
  reject(id: number | string, data?: { reason?: string }) {
    return request<ApiResponse<any>>(`/warehouse-requests/${id}/reject`, { method: "PUT", body: data ?? {} });
  },
};

export const skybase = {
  baseUrl: API_BASE_URL,
  request,
  auth: authApi,
  dashboard: dashboardApi,
  flights: flightApi,
  items: itemApi,
  inventory: inventoryApi,
  inspections: inspectionApi,
  notifications: notificationApi,
  reports: reportApi,
  warehouseRequests: warehouseRequestApi,
};

export default skybase;
