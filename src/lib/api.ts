const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('srujan-token');
}

function setToken(token: string) {
  if (token) localStorage.setItem('srujan-token', token);
  else localStorage.removeItem('srujan-token');
}

interface ApiResponse {
  success: boolean;
  message: string;
  // The backend's shape varies per endpoint; callers narrow this with `as`
  // right after the request() call, so `any` here (rather than `unknown`)
  // keeps that existing cast pattern working across the app.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

async function request(path: string, options: RequestInit = {}): Promise<ApiResponse> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed: ${res.status}`);
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot connect to the server. Make sure the backend is running.');
    }
    throw error;
  }
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    getMe: () => request('/auth/me'),
    updateMe: (data: { name?: string; phone?: string; avatarColor?: string }) =>
      request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  },

  // Employees
  employees: {
    list: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/employees${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request(`/employees/${id}`),
    getStats: (id: string) => request(`/employees/${id}/stats`),
    create: (data: Record<string, unknown>) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/employees/${id}`, { method: 'DELETE' }),
  },

  // Attendance
  attendance: {
    list: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/attendance${q ? `?${q}` : ''}`);
    },
    today: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/attendance/today${q ? `?${q}` : ''}`);
    },
    live: () => request('/attendance/live'),
    trend: (period: string = 'month') => request(`/attendance/trend?period=${period}`),
    dashboardStats: () => request('/attendance/dashboard-stats'),
    // employeeId is optional: omit it to mark attendance for the logged-in user
    // themselves; only Super Admin/HR Admin/Manager accounts may pass one to
    // mark attendance on someone else's behalf. latitude/longitude (optional)
    // enable geofence verification that the employee is at the office.
    checkIn: (opts: { employeeId?: string; latitude?: number; longitude?: number; workMode?: 'office' | 'wfh' } = {}) =>
      request('/attendance/check-in', { method: 'POST', body: JSON.stringify(opts) }),
    checkOut: (employeeId?: string) => request('/attendance/check-out', { method: 'POST', body: JSON.stringify(employeeId ? { employeeId } : {}) }),
    startBreak: () => request('/attendance/break-start', { method: 'POST', body: '{}' }),
    endBreak: () => request('/attendance/break-end', { method: 'POST', body: '{}' }),
    myToday: () => request('/attendance/my-today'),
    myHistory: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/attendance/my-history${q ? `?${q}` : ''}`);
    },
  },

  // Departments
  departments: {
    list: () => request('/departments'),
    get: (id: string) => request(`/departments/${id}`),
    create: (data: Record<string, unknown>) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/departments/${id}`, { method: 'DELETE' }),
  },

  // Leave
  leave: {
    list: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/leave${q ? `?${q}` : ''}`);
    },
    stats: () => request('/leave/stats'),
    calendar: (month: string) => request(`/leave/calendar?month=${month}`),
    create: (data: Record<string, unknown>) => request('/leave', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request(`/leave/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/leave/${id}`, { method: 'DELETE' }),
  },

  // Attendance regularization (correction requests)
  regularizations: {
    list: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/regularizations${q ? `?${q}` : ''}`);
    },
    create: (data: Record<string, unknown>) => request('/regularizations', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, reviewNote?: string) =>
      request(`/regularizations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reviewNote }) }),
  },

  // Audit log (Super Admin / HR Admin only)
  auditLogs: {
    list: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/audit-logs${q ? `?${q}` : ''}`);
    },
  },

  // Employee self-service documents (payslips, offer letters, etc.)
  documents: {
    list: (params: Record<string, string> = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/documents${q ? `?${q}` : ''}`);
    },
    upload: (data: Record<string, unknown>) => request('/documents', { method: 'POST', body: JSON.stringify(data) }),
    download: (id: string) => request(`/documents/${id}/download`),
    delete: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),
  },

  // Shifts
  shifts: {
    list: () => request('/shifts'),
    get: (id: string) => request(`/shifts/${id}`),
    create: (data: Record<string, unknown>) => request('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/shifts/${id}`, { method: 'DELETE' }),
  },

  // Notifications
  notifications: {
    list: (filter?: string) => request(`/notifications${filter ? `?filter=${filter}` : ''}`),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
    delete: (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    get: () => request('/analytics'),
  },

  // Token helpers
  setToken,
  getToken,
};
