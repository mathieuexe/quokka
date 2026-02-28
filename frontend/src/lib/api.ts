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
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const body = options.body === undefined ? undefined : isFormData ? options.body : JSON.stringify(options.body);
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json; charset=utf-8" }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: body as BodyInit | undefined
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new ApiError(data.message ?? "Erreur API", response.status, data);
  }

  return data as T;
}

export type MaintenanceSettings = {
  is_enabled: boolean;
  message: string;
  allowed_ips: string;
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
  return apiRequest<{ announcement: AnnouncementSettings }>("/announcement");
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
  return apiRequest<{ branding: SiteBrandingSettings }>("/branding");
}
