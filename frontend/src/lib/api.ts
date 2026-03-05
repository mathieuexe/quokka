const envApiUrl = import.meta.env.VITE_API_URL;
const rawApiUrl =
  envApiUrl && envApiUrl.trim()
    ? envApiUrl
    : typeof window !== "undefined"
      ? `${window.location.origin}/api`
      : "https://quokka.gg/api";
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
export const API_URL = /\/api(\/|$)/.test(normalizedApiUrl) ? normalizedApiUrl : `${normalizedApiUrl}/api`;

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  cacheTtlMs?: number;
  cacheKey?: string;
};

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

type StoredAuth = {
  token?: string | null;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const cachePrefix = "quokka:api:";

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("quokka_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.token || typeof parsed.token !== "string") return null;
    const normalized = parsed.token.trim();
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function readCachedValue<T>(key: string): T | null {
  const now = Date.now();
  const entry = memoryCache.get(key);
  if (entry) {
    if (entry.expiresAt > now) {
      return entry.data as T;
    }
    memoryCache.delete(key);
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${cachePrefix}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed.expiresAt > now) {
      memoryCache.set(key, parsed);
      return parsed.data;
    }
    window.sessionStorage.removeItem(`${cachePrefix}${key}`);
  } catch {
    return null;
  }
  return null;
}

function writeCachedValue<T>(key: string, ttlMs: number, value: T): void {
  const entry: CacheEntry<T> = {
    expiresAt: Date.now() + ttlMs,
    data: value
  };
  memoryCache.set(key, entry);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${cachePrefix}${key}`, JSON.stringify(entry));
  } catch {
    return;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const cacheKey = options.cacheTtlMs && method === "GET" ? options.cacheKey ?? `${method}:${path}` : undefined;
  if (cacheKey) {
    const cached = readCachedValue<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }
  const isFormData = options.body instanceof FormData;
  const body = options.body === undefined ? undefined : isFormData ? options.body : JSON.stringify(options.body);
  const token = typeof options.token === "string" && options.token.trim() ? options.token.trim() : readStoredToken();
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json; charset=utf-8" }),
      ...(token ? { Authorization: `Bearer ${token}`, "x-access-token": token } : {})
    },
    body: body as BodyInit | undefined
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new ApiError(data.message ?? "Erreur API", response.status, data);
  }

  if (cacheKey && options.cacheTtlMs) {
    writeCachedValue(cacheKey, options.cacheTtlMs, data as T);
  }
  return data as T;
}

export type MaintenanceSettings = {
  is_enabled: boolean;
  message: string;
  allowed_ips: string;
  discord_auth_enabled: boolean;
  discord_auth_message: string;
};

export type AnnouncementSettings = {
  is_enabled: boolean;
  text: string;
  icon: string;
  cta_label: string;
  cta_url: string;
  countdown_target: string;
};

export type SiteBrandingSettings = {
  site_title: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
};

export async function getMaintenanceSettings(token: string): Promise<MaintenanceSettings> {
  return apiRequest<MaintenanceSettings>("/admin/maintenance", { token });
}

export async function updateMaintenanceSettings(
  token: string,
  settings: MaintenanceSettings
): Promise<{ message: string }> {
  return apiRequest("/admin/maintenance", {
    method: "PUT",
    token,
    body: settings
  });
}

export async function getAnnouncementSettings(token: string): Promise<AnnouncementSettings> {
  return apiRequest<AnnouncementSettings>("/admin/announcement", { token });
}

export async function updateAnnouncementSettings(
  token: string,
  settings: AnnouncementSettings
): Promise<{ message: string; announcement: AnnouncementSettings }> {
  return apiRequest("/admin/announcement", {
    method: "PUT",
    token,
    body: settings
  });
}

export async function getPublicAnnouncementSettings(): Promise<{ announcement: AnnouncementSettings }> {
  return apiRequest<{ announcement: AnnouncementSettings }>("/announcement", {
    cacheTtlMs: 5 * 60 * 1000,
    cacheKey: "public:announcement"
  });
}

export async function getSiteBrandingSettings(token: string): Promise<SiteBrandingSettings> {
  return apiRequest<SiteBrandingSettings>("/admin/branding", { token });
}

export async function updateSiteBrandingSettings(
  token: string,
  settings: SiteBrandingSettings
): Promise<{ message: string }> {
  return apiRequest("/admin/branding", {
    method: "PUT",
    token,
    body: settings
  });
}

export async function getPublicBrandingSettings(): Promise<{ branding: SiteBrandingSettings }> {
  return apiRequest<{ branding: SiteBrandingSettings }>("/branding", {
    cacheTtlMs: 5 * 60 * 1000,
    cacheKey: "public:branding"
  });
}
