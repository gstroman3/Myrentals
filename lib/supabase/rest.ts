const REST_API_PATH = '/rest/v1';

function getSupabaseBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return key;
}

type HeadersInitInput = HeadersInit | undefined;

function buildHeaders(initHeaders: HeadersInitInput, hasBody: boolean): Headers {
  const headers = new Headers(initHeaders ?? {});
  const serviceKey = getServiceRoleKey();
  headers.set('apikey', serviceKey);
  headers.set('Authorization', `Bearer ${serviceKey}`);
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export interface SupabaseRequestOptions extends RequestInit {
  json?: unknown;
}

export async function supabaseRequest(path: string, options: SupabaseRequestOptions = {}) {
  const baseUrl = getSupabaseBaseUrl();
  const url = new URL(path.startsWith('/') ? path : `/${path}`, `${baseUrl}${REST_API_PATH}`);
  const { json, ...init } = options;
  const body = json !== undefined ? JSON.stringify(json) : options.body;
  const headers = buildHeaders(init.headers, body !== undefined && body !== null);
  const response = await fetch(url.toString(), {
    cache: 'no-store',
    ...init,
    body,
    headers,
  });
  return response;
}

export async function supabaseJson<T>(path: string, options: SupabaseRequestOptions = {}): Promise<T> {
  const response = await supabaseRequest(path, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Supabase request failed (${response.status} ${response.statusText}): ${text}`.trim(),
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

