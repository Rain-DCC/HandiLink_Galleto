const TOKEN_KEY = 'handilink_jwt_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function gatewayFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/gateway${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    if (!response.ok) {
      throw new ApiError('Failed to export CSV report.', response.status);
    }
    return (await response.text()) as unknown as T;
  }

  const rawText = await response.text();
  let data: any = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new ApiError(`Request failed (${response.status})`, response.status);
      }
      throw new ApiError('Invalid JSON response received from API Gateway.', response.status);
    }
  } else {
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status);
  }
  return data as T;
}
