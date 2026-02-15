
const PROD_URL = 'https://your-backend-name.onrender.com/api';
const DEV_URL = 'http://localhost:5000/api';

const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname.includes('192.168.');

const API_BASE = isLocal ? DEV_URL : PROD_URL;

export const apiClient = {
  async checkStatus() {
    try {
      const res = await fetch(`${API_BASE}/data`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async fetchAllData() {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) throw new Error('Server returned error');
      return res.json();
    } catch (e) {
      console.info("API fetchAllData failed, using local fallback");
      throw e;
    }
  },

  async adminSync(fullData: any) {
    try {
      return await fetch(`${API_BASE}/admin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullData)
      });
    } catch (e) {
      throw e;
    }
  },

  async register(userData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async login(credentials: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
    return res.json();
  },

  async syncUser(userId: string, data: any) {
    return fetch(`${API_BASE}/user/${userId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async saveResult(userId: string, result: any) {
    return fetch(`${API_BASE}/results/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    });
  }
};
