const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "islik_cloud_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "API request failed.";

    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function register(payload) {
  const response = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  setToken(response.data.token);
  return response;
}

export async function login(payload) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  setToken(response.data.token);
  return response;
}

export async function getMe() {
  return request("/api/auth/me");
}

export async function getCustomers() {
  return request("/api/customers");
}

export async function createCustomer(payload) {
  return request("/api/customers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateCustomer(id, payload) {
  return request(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteCustomer(id) {
  return request(`/api/customers/${id}`, {
    method: "DELETE"
  });
}

export async function getJobs() {
  return request("/api/jobs");
}

export async function createJob(payload) {
  return request("/api/jobs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateJob(id, payload) {
  return request(`/api/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteJob(id) {
  return request(`/api/jobs/${id}`, {
    method: "DELETE"
  });
}
