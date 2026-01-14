export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? import.meta.env.VITE_API_BASE ?? 'http://localhost:5001';
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      let message = `GET ${path} failed with ${res.status}`;
      try {
        const data = await res.json();
        message = (data as any)?.detail || (data as any)?.message || message;
      } catch {
        // ignore parsing error
      }
      const error: any = new Error(message);
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  async post<T, B = unknown>(path: string, body?: B): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errMsg = `POST ${path} failed with ${res.status}`;
      try {
        const data = await res.json();
        errMsg = (data as any)?.detail || (data as any)?.message || errMsg;
      } catch {
        // ignore
      }
      const error: any = new Error(errMsg);
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  async put<T, B = unknown>(path: string, body: B): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message = `PUT ${path} failed with ${res.status}`;
      try {
        const data = await res.json();
        message = (data as any)?.detail || (data as any)?.message || message;
      } catch {
        // ignore
      }
      const error: any = new Error(message);
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  async delete<T = void>(path: string): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      let message = `DELETE ${path} failed with ${res.status}`;
      try {
        const data = await res.json();
        message = (data as any)?.detail || (data as any)?.message || message;
      } catch {
        // ignore
      }
      const error: any = new Error(message);
      error.status = res.status;
      throw error;
    }

    try {
      return (await res.json()) as T;
    } catch {
      return undefined as T;
    }
  }

  async patch<T, B = unknown>(path: string, body: B): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message = `PATCH ${path} failed with ${res.status}`;
      try {
        const data = await res.json();
        message = (data as any)?.detail || (data as any)?.message || message;
      } catch {
        // ignore
      }
      const error: any = new Error(message);
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
