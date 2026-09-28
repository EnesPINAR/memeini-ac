import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Aktif tünel URL'i (Expo --tunnel ile bağlanan cihazlar için)
export const TUNNEL_URL = 'https://textbook-coaches-offshore-donate.trycloudflare.com';
export const LOCAL_SERVER_IP = '192.168.2.137';

export const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : TUNNEL_URL;

const TOKEN_KEY = 'memeini_auth_token';
const REFRESH_TOKEN_KEY = 'memeini_refresh_token';

let memoryToken: string | null = null;

// ==================== TOKEN STORAGE ====================

export async function getStoredToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    if (Platform.OS === 'web') {
      memoryToken = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    } else {
      memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  memoryToken = accessToken;
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  } catch (err) {
    console.warn('Token kaydedilemedi:', err);
  }
}

export async function clearTokens(): Promise<void> {
  memoryToken = null;
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Token silinemedi:', err);
  }
}

// ==================== HTTP CLIENT ====================

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(options.headers as Record<string, string>),
  };

  const token = await getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. gateway error or HTML page)
      if (!response.ok) {
        throw new Error(`Sunucu hatası (${response.status}): Lütfen tekrar deneyin.`);
      }
      return text as unknown as T;
    }

    if (!response.ok) {
      const errorMsg = Array.isArray(json?.message)
        ? json.message.join(', ')
        : json?.message || json?.error || 'Beklenmeyen bir hata oluştu';
      throw new Error(errorMsg);
    }

    // If backend wrapped in { success: true, data: ... }
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.');
    }
    if (err.message && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
      throw new Error('Sunucuya erişilemedi. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw err;
  }
}

// ==================== AUTH API ====================

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarEmoji?: string;
  avatarBg?: string;
  role?: string;
  notificationsEnabled?: boolean;
  stats?: {
    uploadedCount: number;
    starredCount: number;
    savedCount: number;
  };
}

export interface AuthResponse {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export const authApi = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });

    if (res.tokens?.accessToken) {
      await saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
    }
    return res;
  },

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
    avatarEmoji?: string;
    avatarBg?: string;
  }): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim(),
        username: data.username.toLowerCase().trim(),
        password: data.password,
        displayName: data.displayName.trim(),
        avatarEmoji: data.avatarEmoji || '🐹',
        avatarBg: data.avatarBg || '#FFE600',
      }),
    });

    if (res.tokens?.accessToken) {
      await saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored if network error on logout
    } finally {
      await clearTokens();
    }
  },

  async getMe(): Promise<UserProfile> {
    return request<UserProfile>('/api/users/me');
  },
};

// ==================== MEMES & USER COLLECTIONS ====================

export const memesApi = {
  async getExplore(tags?: string, page: number = 1, limit: number = 20) {
    const params = new URLSearchParams();
    if (tags) params.append('tags', tags);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return request<any>(`/api/memes/explore?${params.toString()}`);
  },

  async getRandom() {
    return request<any>('/api/memes/random');
  },

  async search(query: string) {
    return request<any>(`/api/search?q=${encodeURIComponent(query)}`);
  },

  async rateMeme(memeId: string, score: number) {
    return request<any>(`/api/memes/${memeId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  },

  async toggleSave(memeId: string) {
    return request<{ isSaved: boolean; message: string }>(`/api/collections/toggle/${memeId}`, {
      method: 'POST',
    });
  },

  async suggestTag(memeId: string, tagName: string) {
    return request<any>(`/api/memes/${memeId}/suggest-tag`, {
      method: 'POST',
      body: JSON.stringify({ tagName }),
    });
  },

  async deleteRequest(memeId: string, reason: string, note?: string) {
    return request<any>(`/api/memes/${memeId}/delete-request`, {
      method: 'POST',
      body: JSON.stringify({ reason, note }),
    });
  },

  async getUploadedMemes() {
    return request<any[]>('/api/users/me/uploaded');
  },

  async getStarredMemes() {
    return request<any[]>('/api/users/me/starred');
  },

  async getSavedMemes() {
    return request<any[]>('/api/users/me/saved');
  },
};

// ==================== ADMIN API ====================

export interface AdminStats {
  totalUsers: number;
  totalActiveMemes: number;
  pendingQueues: {
    deleteRequests: number;
    suggestedTags: number;
    reports: number;
  };
}

export interface AdminDeleteRequest {
  id: string;
  memeId: string;
  userId: string;
  reason: string;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  meme: {
    id: string;
    title: string;
    mediaUrl: string;
    aspectRatio?: number;
    status: string;
    rating?: number;
    ratingCount?: number;
  };
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface AdminSuggestedTag {
  id: string;
  memeId: string;
  userId: string;
  tagName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  meme: {
    id: string;
    title: string;
    mediaUrl: string;
  };
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface AdminReport {
  id: string;
  memeId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
  meme: {
    id: string;
    title: string;
    mediaUrl: string;
    status?: string;
  };
  reporter: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface AdminHistory {
  deletedMemes: AdminDeleteRequest[];
  addedTags: AdminSuggestedTag[];
  reportsHistory: AdminReport[];
  approvedMemes: {
    id: string;
    title: string;
    mediaUrl: string;
    uploader: {
      id: string;
      username: string;
      displayName: string;
    };
    approvedAt: string;
    tags: string[];
  }[];
}

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    return request<AdminStats>('/api/admin/stats');
  },

  async getDeleteRequests(status: string = 'PENDING'): Promise<AdminDeleteRequest[]> {
    return request<AdminDeleteRequest[]>(`/api/admin/delete-requests?status=${status}`);
  },

  async approveDeleteRequest(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/delete-requests/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectDeleteRequest(id: string, note?: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/delete-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async getSuggestedTags(status: string = 'PENDING'): Promise<AdminSuggestedTag[]> {
    return request<AdminSuggestedTag[]>(`/api/admin/suggested-tags?status=${status}`);
  },

  async approveSuggestedTag(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/suggested-tags/${id}/approve`, {
      method: 'POST',
    });
  },

  async rejectSuggestedTag(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/suggested-tags/${id}/reject`, {
      method: 'POST',
    });
  },

  async getReports(status?: string): Promise<AdminReport[]> {
    const query = status ? `?status=${status}` : '';
    return request<AdminReport[]>(`/api/admin/reports${query}`);
  },

  async updateReportStatus(
    id: string,
    status: 'RESOLVED' | 'DISMISSED',
    dismissReason?: string,
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/admin/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, dismissReason }),
    });
  },

  async updateMeme(
    id: string,
    data: { title?: string; tags?: string[] },
  ): Promise<{ id: string; title: string }> {
    return request<{ id: string; title: string }>(`/api/admin/memes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getHistory(): Promise<AdminHistory> {
    return request<AdminHistory>('/api/admin/history');
  },
};

