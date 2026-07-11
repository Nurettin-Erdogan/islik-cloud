export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

const REQUEST_TIMEOUT_MS = 75000;

function trimSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export async function request(apiUrl, token, path, options = {}) {
  const baseUrl = trimSlash(apiUrl || DEFAULT_API_URL);
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...requestOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...(requestOptions.headers || {})
  };

  let response;

  try {
    response = await fetch(baseUrl + path, {
      ...requestOptions,
      headers,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("REQUEST_TIMEOUT");
    }

    const detail = error?.message ? ": " + error.message : "";
    throw new Error("NETWORK_ERROR" + detail);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = "İstek başarısız oldu.";

    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      message = response.statusText || message;
    }

    const requestError = new Error(message);
    requestError.status = response.status;
    throw requestError;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  health(apiUrl) {
    return request(apiUrl, null, "/health");
  },
  login(apiUrl, payload) {
    return request(apiUrl, null, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  register(apiUrl, payload) {
    return request(apiUrl, null, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  me(apiUrl, token) {
    return request(apiUrl, token, "/api/auth/me");
  },
  createPublicRequest(apiUrl, payload) {
    return request(apiUrl, null, "/api/public/requests", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  getPublicRequest(apiUrl, requestCode, phone) {
    return request(
      apiUrl,
      null,
      "/api/public/requests/" + encodeURIComponent(requestCode) + "?phone=" + encodeURIComponent(phone)
    );
  },
  getCustomers(apiUrl, token) {
    return request(apiUrl, token, "/api/customers");
  },
  createCustomer(apiUrl, token, payload) {
    return request(apiUrl, token, "/api/customers", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateCustomer(apiUrl, token, id, payload) {
    return request(apiUrl, token, "/api/customers/" + id, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  deleteCustomer(apiUrl, token, id) {
    return request(apiUrl, token, "/api/customers/" + id, {
      method: "DELETE"
    });
  },
  getJobs(apiUrl, token) {
    return request(apiUrl, token, "/api/jobs");
  },
  createJob(apiUrl, token, payload) {
    return request(apiUrl, token, "/api/jobs", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateJob(apiUrl, token, id, payload) {
    return request(apiUrl, token, "/api/jobs/" + id, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  deleteJob(apiUrl, token, id) {
    return request(apiUrl, token, "/api/jobs/" + id, {
      method: "DELETE"
    });
  }
};
