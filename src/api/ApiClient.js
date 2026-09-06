const { ConfigLoader } = require('../utils/ConfigLoader');

class ApiClient {
  constructor(request) {
    this.request = request;
    this.env = process.env.ENVIRONMENT || 'dev';
    this.config = ConfigLoader.load(this.env);
    this.baseUrl = this.config.apiBaseUrl;
  }

  #buildHeaders() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Playwright request context stores and sends cookies automatically —
      // no manual Cookie header needed
    };
  }

  async get(endpoint, params = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await this.request.get(fullUrl, {
      headers: this.#buildHeaders(),
    });

    return this.#handleResponse(response);
  }

  async post(endpoint, body) {
    const response = await this.request.post(`${this.baseUrl}${endpoint}`, {
      headers: this.#buildHeaders(),
      data: body,
    });

    return this.#handleResponse(response);
  }

  async put(endpoint, body) {
    const response = await this.request.put(`${this.baseUrl}${endpoint}`, {
      headers: this.#buildHeaders(),
      data: body,
    });

    return this.#handleResponse(response);
  }

  async patch(endpoint, body) {
    const response = await this.request.patch(`${this.baseUrl}${endpoint}`, {
      headers: this.#buildHeaders(),
      data: body,
    });

    return this.#handleResponse(response);
  }

  async delete(endpoint) {
    const response = await this.request.delete(`${this.baseUrl}${endpoint}`, {
      headers: this.#buildHeaders(),
    });

    return this.#handleResponse(response);
  }

  async #handleResponse(response) {
    const status = response.status();
    let body;

    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    return { status, body, headers: response.headers(), ok: status >= 200 && status < 300 };
  }

}

module.exports = { ApiClient };
