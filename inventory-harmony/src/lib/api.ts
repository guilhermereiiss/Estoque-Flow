export const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3001/api/v1";

export type ApiOptions = RequestInit & { token?: string | null };

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json();
  }
  let payload: any = {};
  try {
    payload = await res.json();
  } catch {
    /* noop */
  }
  const err: any = new Error(payload?.erro || `Erro ${res.status}`);
  err.status = res.status;
  err.payload = payload;
  throw err;
}

export function makeApi(getToken: () => string | null) {
  return <T = any>(path: string, opts: RequestInit = {}) =>
    api<T>(path, { ...opts, token: getToken() });
}
