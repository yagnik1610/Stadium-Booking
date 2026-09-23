/**
 * REST API client helper for E2E tests
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function checkHealth() {
  return request('/health');
}

async function checkReady() {
  return request('/ready');
}

async function registerUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: userData,
  });
}

async function loginUser(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

async function getAdminToken() {
  const adminIdentifier = process.env.E2E_ADMIN_LOGIN_ID || process.env.ADMIN_LOGIN_ID || process.env.ADMIN_EMAIL || 'Admin#1610';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Yagnik#1610';

  const res = await loginUser({
    loginId: adminIdentifier,
    email: adminIdentifier,
    password: adminPassword,
  });

  if (!res.ok || !res.data.token) {
    throw new Error(`Admin login failed: ${res.data.message || res.status}`);
  }
  return res.data.token;
}

async function getStadiums(query = {}) {
  const searchParams = new URLSearchParams(query).toString();
  return request(`/stadiums${searchParams ? '?' + searchParams : ''}`);
}

async function getStadiumById(id) {
  return request(`/stadiums/${id}`);
}

module.exports = {
  request,
  checkHealth,
  checkReady,
  registerUser,
  loginUser,
  getAdminToken,
  getStadiums,
  getStadiumById,
};
