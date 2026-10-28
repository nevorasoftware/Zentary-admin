// API Client for Zentary Admin Panel

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://zentary-backend-production.up.railway.app/api';

// Acepta solo URLs http(s) y data:image/ para mostrar enlaces e imágenes
export const isSafeUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const value = url.trim().toLowerCase();
  return value.startsWith('https://') || value.startsWith('http://') || value.startsWith('data:image/');
};

export interface ResidentUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'RESIDENT' | 'ADMIN' | 'GUARD' | 'RESIDENTIAL_ADMIN';
  isActive: boolean;
  avatarUrl?: string;
  property?: {
    unitNumber: string;
    block?: string;
  };
  house?: {
    id: string;
    unitNumber: string;
    block?: string;
    financialStatus?: string;
  };
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  category: 'MANTENIMIENTO' | 'URGENTE' | 'EVENTO' | 'GENERAL' | string;
  priority?: 'NORMAL' | 'IMPORTANTE' | 'URGENTE';
  targetAudience?: 'TODOS' | 'TORRE' | 'BLOQUE' | 'VIVIENDA';
  targetBlock?: string;
  imageUrl?: string;
  fileUrl?: string;
  createdAt: string;
  author?: {
    fullName: string;
  };
}

export interface PqrsMessageItem {
  id: string;
  pqrsId: string;
  senderId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
  };
}

export interface PqrsTicketItem {
  id: string;
  residentId: string;
  category: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
  priority?: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToUserId?: string;
  assignedToUser?: {
    id: string;
    fullName: string;
    role: string;
  };
  attachments?: string;
  createdAt: string;
  updatedAt: string;
  resident?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    property?: {
      unitNumber: string;
      block?: string;
    };
  };
  house?: {
    id: string;
    unitNumber: string;
    block?: string;
  };
  messages: PqrsMessageItem[];
}

export interface DashboardStats {
  totalResidents: number;
  activeVisits: number;
  pendingParcels: number;
  openPqrs: number;
  pendingPaymentsSum: number;
}

export interface FinancialSummary {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  totalLateFees: number;
  totalBilled: number;
  collectionRate: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  morososHousesCount: number;
  totalPayments: number;
  recentPayments?: any[];
}

export interface TenantInfo {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  country?: string;
  timezone?: string;
}

export interface HouseImportTotals {
  filas: number;
  creadas: number;
  actualizadas: number;
  sinCambios: number;
  errores: number;
  viviendasCreadas: number;
  usuariosCreados: number;
}

export interface HouseImportRow {
  fila: number;
  codigo: string;
  vivienda: 'creada' | 'actualizada' | 'sin_cambios' | 'error';
  usuario: 'creado' | 'actualizado' | 'sin_cambios' | 'ninguno' | 'error';
  mensaje: string;
  usuarioId?: string;
  correo?: string;
  nombre?: string;
}

export interface ParkingZoneItem {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ParkingReservationItem {
  id: string;
  visitId: string;
  zoneId: string;
  zoneName: string | null;
  status: 'RESERVADO' | 'OCUPADO' | string;
  holdFrom: string;
  holdUntil: string;
  occupiedAt?: string | null;
  plate?: string | null;
}

export interface ParkingZoneStatus {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  occupied: number;
  reserved: number;
  upcoming: number;
  free: number;
}

export interface ParkingStatus {
  success: boolean;
  holdMinutes: number;
  zones: ParkingZoneStatus[];
  reservations: ParkingReservationItem[];
}

export interface PaymentGatewayInfo {
  source: 'tenant' | 'company';
  clientId: string | null;
  enabled: boolean;
  hasSecret: boolean;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
}

export const ADMIN_ROLES = ['SUPER_ADMIN', 'RESIDENTIAL_ADMIN', 'ADMIN'];
// Roles que pueden entrar al panel: los guardias solo ven la garita
export const PANEL_ROLES = [...ADMIN_ROLES, 'GUARD'];

export const getAdminToken = (): string => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('zentary_admin_token') || '';
  }
  return '';
};

export const TENANT_STORAGE_KEY = 'zentary_selected_tenant';

// Residencial elegida por el super administrador; vacío = todas
export const getSelectedTenantId = (): string => {
  try {
    return localStorage.getItem(TENANT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const getTenantHeaders = (): Record<string, string> => {
  const tenantId = getSelectedTenantId();
  return tenantId ? { 'x-tenant-id': tenantId } : {};
};

export const handleUnauthorized = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('zentary_admin_token');
    localStorage.removeItem('zentary_admin_user');
  }
  window.location.reload();
};

class AdminApiService {
  private getAuthToken(): string {
    return getAdminToken();
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getTenantHeaders(),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
      }

      return data;
    } catch (error) {
      console.warn('API request fallback or error:', endpoint, error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    return this.request('/admin/stats');
  }

  async getUsers(role = 'RESIDENT'): Promise<{ success: boolean; users: ResidentUser[] }> {
    return this.request(`/admin/users?role=${role}`);
  }

  async registerTenant(data: { fullName: string; email: string; phone?: string; houseId: string }) {
    return this.request('/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerGuard(data: { fullName: string; email: string; phone?: string }) {
    return this.request('/admin/guards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async releaseResident(userId: string, data: { newUserId?: string; newOwner?: { name: string; phone?: string; email?: string }; reason?: string }) {
    return this.request(`/admin/users/${userId}/release`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleUserAccess(userId: string, isActive: boolean) {
    return this.request(`/admin/users/${userId}/access`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async getCurrentTenant(): Promise<{ success: boolean; code?: string; message?: string; tenant: TenantInfo }> {
    return this.request('/tenants/current');
  }

  async updateCurrentTenant(data: Partial<Omit<TenantInfo, 'id' | 'name'>>): Promise<{ success: boolean; message?: string; tenant: TenantInfo }> {
    return this.request('/tenants/current', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createTenant(data: Partial<TenantInfo>): Promise<{ success: boolean; message?: string; tenant: TenantInfo }> {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Announcements Admin API (Fase 3 Comunidad)
  async getAnnouncements(): Promise<{ success: boolean; announcements: AnnouncementItem[] }> {
    return this.request('/announcements');
  }

  async createAnnouncement(data: {
    title: string;
    body: string;
    category: string;
    priority?: string;
    targetAudience?: string;
    targetBlock?: string;
    imageUrl?: string;
  }) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: string, data: any) {
    return this.request(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // PQRS Admin API (Fase 3 Comunidad)
  async getPqrsList(): Promise<{ success: boolean; pqrsList: PqrsTicketItem[] }> {
    return this.request('/pqrs?all=true');
  }

  async sendPqrsMessage(id: string, message: string): Promise<{ success: boolean; message: PqrsMessageItem }> {
    return this.request(`/pqrs/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updatePqrsStatus(
    id: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  ): Promise<{ success: boolean; pqrs: PqrsTicketItem }> {
    return this.request(`/pqrs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async assignPqrsStaff(id: string, assignedToUserId: string): Promise<{ success: boolean; message: string; pqrs: any }> {
    return this.request(`/pqrs/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedToUserId }),
    });
  }

  // Payments & Finanzas Admin API (Fase 4 Finanzas)
  async getAllPayments(params?: { status?: string; houseId?: string; search?: string }): Promise<{ success: boolean; payments: any[] }> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.houseId) q.append('houseId', params.houseId);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/payments/admin/all${qs}`);
  }

  async getFinancialSummary(): Promise<{ success: boolean; summary: FinancialSummary }> {
    return this.request('/payments/admin/financial-summary');
  }

  async createBillingCharge(data: {
    concept: string;
    amount: number;
    dueDate: string;
    targetResidentId?: string;
    graceDays?: number;
    periodMonth?: number;
    periodYear?: number;
    notes?: string;
  }): Promise<{ success: boolean; payment: any; message?: string }> {
    return this.request('/payments/admin/create-charge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyLateFees(data?: {
    lateFeePercent?: number;
    defaultGraceDays?: number;
  }): Promise<{
    success: boolean;
    message: string;
    processedCount: number;
    totalLateFeesApplied: number;
    affectedHousesCount: number;
  }> {
    return this.request('/payments/admin/apply-late-fees', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async registerManualPayment(data: {
    paymentId?: string;
    residentId?: string;
    houseId?: string;
    amount: number;
    paymentMethod: string;
    receiptUrl?: string;
    notes?: string;
    concept?: string;
  }): Promise<{ success: boolean; message: string; payment: any }> {
    return this.request('/payments/admin/register-manual-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; message: string; payment: any }> {
    return this.request(`/payments/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Amenities Admin API (Fase 3 Comunidad)
  async updateReservationStatus(
    id: string,
    status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED',
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string; reservation: any }> {
    return this.request(`/amenities/admin/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  // Visits & Garita Access Control (Zentary 2.0 - Fase 2)
  async getVisits(params?: { category?: string; status?: string; search?: string }): Promise<{ success: boolean; visits: any[] }> {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/visits${qs}`);
  }

  async getActiveInsideVisits(): Promise<{
    success: boolean;
    summary: { totalInside: number; totalExceeded: number; totalExpectedToday: number };
    activeVisits: any[];
    expectedToday: any[];
  }> {
    return this.request('/visits/active-inside');
  }

  async scanQRToken(token: string): Promise<{ success: boolean; valid: boolean; visit?: any; message?: string; code?: string }> {
    return this.request('/visits/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async confirmEntry(visitId: string, data?: { gateName?: string; vehiclePlate?: string; notes?: string }): Promise<{ success: boolean; message?: string; visit?: any; parkingWarning?: string }> {
    return this.request(`/visits/${visitId}/confirm-entry`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async registerExit(visitId: string, data?: { notes?: string }): Promise<{ success: boolean; message?: string; durationFormatted?: string; durationMinutes?: number; visit?: any }> {
    return this.request(`/visits/${visitId}/exit`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async quickEntry(data: {
    visitorName: string;
    visitorDni?: string;
    visitorPhone?: string;
    vehiclePlate?: string;
    houseId?: string;
    unitNumber?: string;
    entryType?: string;
    notes?: string;
    gateName?: string;
    maxDurationHours?: number;
  }): Promise<{ success: boolean; message?: string; visit?: any; parkingWarning?: string }> {
    return this.request('/visits/quick-entry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHouses(): Promise<{ success: boolean; houses: any[] }> {
    return this.request('/houses');
  }

  async createHouse(data: { unitNumber?: string; prefixId?: string; number?: string; block?: string }): Promise<{ success: boolean; message?: string; house?: any }> {
    return this.request('/houses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHouse(id: string, data: { unitNumber?: string; prefixId?: string | null; number?: string; block?: string | null }): Promise<{ success: boolean; message?: string }> {
    return this.request(`/houses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Importación / exportación CSV de viviendas y residentes
  async exportHousesCsv(): Promise<Blob> {
    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/houses/export`, {
      headers: { ...getTenantHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (response.status === 401) handleUnauthorized();
    if (!response.ok) {
      let message = 'No se pudo exportar el archivo.';
      try { message = (await response.json()).message || message; } catch { /* respuesta sin JSON */ }
      throw new Error(message);
    }
    return response.blob();
  }

  async importHousesCsv(csv: string, dryRun: boolean, fileName?: string): Promise<{ success: boolean; message?: string; dryRun?: boolean; totals?: HouseImportTotals; rows?: HouseImportRow[] }> {
    const token = this.getAuthToken();
    const query = new URLSearchParams();
    if (dryRun) query.set('dryRun', '1');
    if (fileName) query.set('fileName', fileName);
    const response = await fetch(`${API_BASE_URL}/houses/import?${query.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv; charset=utf-8', ...getTenantHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: csv,
    });
    if (response.status === 401) handleUnauthorized();
    // El 413 y los errores de proxy pueden no traer JSON válido
    let data: any = null;
    try { data = await response.json(); } catch { /* respuesta sin JSON */ }
    if (!response.ok || !data) {
      return { success: false, message: data?.message || (response.status === 413 ? 'El archivo supera el máximo de 2 MB.' : 'No se pudo procesar el archivo.') };
    }
    return data;
  }

  async resendCredentials(userId: string, unitNumber?: string): Promise<{ success: boolean; message?: string }> {
    return this.request('/admin/tenants/resend-credentials', {
      method: 'POST',
      body: JSON.stringify({ userId, unitNumber }),
    });
  }

  // House prefixes (prefijos de vivienda)
  async getHousePrefixes(): Promise<{ success: boolean; prefixes: any[] }> {
    return this.request('/house-prefixes');
  }

  async createHousePrefix(data: { code: string; label?: string; houseType?: string }): Promise<{ success: boolean; message?: string; prefix?: any }> {
    return this.request('/house-prefixes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHousePrefix(id: string, data: { code?: string; label?: string; houseType?: string; isActive?: boolean }): Promise<{ success: boolean; message?: string }> {
    return this.request(`/house-prefixes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHousePrefix(id: string): Promise<{ success: boolean; message?: string; deactivated?: boolean }> {
    return this.request(`/house-prefixes/${id}`, { method: 'DELETE' });
  }

  // Parqueos de visita
  async getParkingZones(): Promise<{ success: boolean; message?: string; zones: ParkingZoneItem[]; holdMinutes: number }> {
    return this.request('/parking/zones');
  }

  async getParkingStatus(): Promise<ParkingStatus> {
    return this.request('/parking/status');
  }

  async createParkingZone(data: { name: string; capacity: number }): Promise<{ success: boolean; message?: string; zone?: ParkingZoneItem }> {
    return this.request('/parking/zones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateParkingZone(id: string, data: Partial<Pick<ParkingZoneItem, 'name' | 'capacity' | 'isActive'>>): Promise<{ success: boolean; message?: string; zone?: ParkingZoneItem }> {
    return this.request(`/parking/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteParkingZone(id: string): Promise<{ success: boolean; message?: string; deactivated?: boolean; deleted?: boolean }> {
    return this.request(`/parking/zones/${id}`, { method: 'DELETE' });
  }

  async updateParkingConfig(holdMinutes: number): Promise<{ success: boolean; message?: string; holdMinutes?: number }> {
    return this.request('/parking/config', {
      method: 'PUT',
      body: JSON.stringify({ holdMinutes }),
    });
  }

  // Pasarela de pagos por residencial (el secreto nunca se devuelve)
  async getPaymentGateway(): Promise<{ success: boolean; gateway?: PaymentGatewayInfo; message?: string }> {
    return this.request('/tenants/current/payment-gateway');
  }

  async savePaymentGateway(data: { clientId: string; clientSecret: string; enabled: boolean }): Promise<{ success: boolean; gateway?: PaymentGatewayInfo; message?: string }> {
    return this.request('/tenants/current/payment-gateway', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentGateway(): Promise<{ success: boolean; gateway?: PaymentGatewayInfo; message?: string }> {
    return this.request('/tenants/current/payment-gateway', { method: 'DELETE' });
  }

  async testPaymentGateway(data?: { clientId: string; clientSecret: string }): Promise<{ success: boolean; ok?: boolean; message?: string }> {
    return this.request('/tenants/current/payment-gateway/test', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }
}

export const adminApi = new AdminApiService();
