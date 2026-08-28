// API Client for Zentary Admin Panel

export const API_BASE_URL = 'https://zentary-backend-production.up.railway.app/api';

export interface ResidentUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'RESIDENT' | 'ADMIN' | 'GUARD';
  isActive: boolean;
  avatarUrl?: string;
  property?: {
    unitNumber: string;
    block?: string;
  };
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  category: 'MANTENIMIENTO' | 'URGENTE' | 'EVENTO' | 'GENERAL';
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
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
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
  messages: PqrsMessageItem[];
}

export interface DashboardStats {
  totalResidents: number;
  activeVisits: number;
  pendingParcels: number;
  openPqrs: number;
  pendingPaymentsSum: number;
}

class AdminApiService {
  private getAuthToken(): string {
    if (typeof localStorage !== 'undefined') {
      const storedToken = localStorage.getItem('zentary_admin_token') || localStorage.getItem('zentary_token');
      if (storedToken) return storedToken;
    }
    return 'admin_demo_token';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

      // If token expired or unauthorized (401), clean up local storage & retry with admin_demo_token
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

  async getAnnouncements(): Promise<{ success: boolean; announcements: AnnouncementItem[] }> {
    return this.request('/announcements');
  }

  async createAnnouncement(data: { title: string; body: string; category: string }) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // PQRS Admin API
  async getPqrsList(): Promise<{ success: boolean; pqrsList: PqrsTicketItem[] }> {
    return this.request('/pqrs?all=true');
  }

  async sendPqrsMessage(id: string, message: string): Promise<{ success: boolean; message: PqrsMessageItem }> {
    return this.request(`/pqrs/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updatePqrsStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'): Promise<{ success: boolean; pqrs: PqrsTicketItem }> {
    return this.request(`/pqrs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Payments Admin API
  async getAllPayments(): Promise<{ success: boolean; payments: any[] }> {
    return this.request('/payments/admin/all');
  }

  async createBillingCharge(data: { concept: string; amount: number; dueDate: string; targetResidentId?: string }): Promise<{ success: boolean; payment: any; message?: string }> {
    return this.request('/payments/admin/create-charge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

}

export const adminApi = new AdminApiService();

