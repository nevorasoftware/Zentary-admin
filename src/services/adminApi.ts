// API Client for Zentary Admin Panel

export const API_BASE_URL = 'http://localhost:3000/api';

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

export interface DashboardStats {
  totalResidents: number;
  activeVisits: number;
  pendingParcels: number;
  openPqrs: number;
  pendingPaymentsSum: number;
}

class AdminApiService {
  private token: string | null = 'admin_demo_token';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('API request fallback to mock data:', endpoint);
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
}

export const adminApi = new AdminApiService();
