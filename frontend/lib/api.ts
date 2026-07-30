export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const AUTH_REQUIRED_EVENT = "talents-hub:auth-required";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
const INTERNAL_API_URL = (process.env.INTERNAL_API_URL ?? API_URL).replace(/\/$/, "");

function requestApiUrl(): string {
  return typeof window === "undefined" ? INTERNAL_API_URL : API_URL;
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const result = query.toString();
  return result ? `?${result}` : "";
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie.split("; ").find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

function notifyAuthRequired(status: number, path: string): void {
  if (typeof window === "undefined" || (status !== 401 && status !== 403)) return;
  window.dispatchEvent(
    new CustomEvent(AUTH_REQUIRED_EVENT, { detail: { status, path } }),
  );
}

export async function getCsrfToken(): Promise<string | undefined> {
  let token = getCookie("csrftoken");
  if (token) return token;

  const response = await fetch(`${requestApiUrl()}/csrf/`, { credentials: "include" });
  const payload: unknown = await response.json().catch(() => null);
  token = getCookie("csrftoken");
  if (token) return token;
  return typeof payload === "object" && payload !== null && "csrfToken" in payload
    ? String(payload.csrfToken)
    : undefined;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) headers.set("X-CSRFToken", csrfToken);
  }

  const response = await fetch(`${requestApiUrl()}${path}`, {
    ...options,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : "Request failed";
    notifyAuthRequired(response.status, path);
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiFormFetch<T>(path: string, body: FormData, options: Omit<RequestInit, "body"> = {}): Promise<T> {
  const method = (options.method ?? "POST").toUpperCase();
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) headers.set("X-CSRFToken", csrfToken);
  }
  const response = await fetch(`${requestApiUrl()}${path}`, { ...options, method, body, credentials: "include", headers });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = typeof payload === "object" && payload !== null && "detail" in payload ? String(payload.detail) : "Request failed";
    notifyAuthRequired(response.status, path);
    throw new ApiError(message, response.status, payload);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
