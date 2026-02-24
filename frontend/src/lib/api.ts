const API_URL = import.meta.env.VITE_API_URL ?? "https://quokka.gg/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
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
    throw new ApiError(data.message ?? "Erreur API", response.status);
  }

  return data as T;
}

export type MaintenanceSettings = {
  is_enabled: boolean;
  message: string;
  allowed_ips: string;
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
