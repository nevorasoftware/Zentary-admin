// API Client for Zentary Admin Panel

export const API_BASE_URL = 'https://zentary-backend-production.up.railway.app/api';

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
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
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

class AdminApiService {
  private getAuthToken(): string {
    if (typeof localStorage !== 'undefined') {
      const storedToken = localStorage.getItem('zentary_admin_token') || localStorage.getItem('zentary_token');
      if (storedToken) return storedToken;
    }
    return 'admin_demo_token';
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      let data = await response.json();

      // If token expired or unauthorized (401), retry with admin_demo_token
      if (response.status === 401 && token !== 'admin_demo_token') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('zentary_admin_token');
          localStorage.removeItem('zentary_token');
        }
        headers['Authorization'] = `Bearer admin_demo_token`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        data = await response.json();
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

  async toggleUserAccess(userId: string, isActive: boolean) {
    return this.request(`/admin/users/${userId}/access`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
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
    status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED' | 'CANCELLED'
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

  async confirmEntry(visitId: string, data?: { gateName?: string; vehiclePlate?: string; notes?: string }): Promise<{ success: boolean; message?: string; visit?: any }> {
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
  }): Promise<{ success: boolean; message?: string; visit?: any }> {
    return this.request('/visits/quick-entry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHouses(): Promise<{ success: boolean; houses: any[] }> {
    return this.request('/houses');
  }
}

export const adminApi = new AdminApiService();
