import { Model, User } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface ConnectionSettings {
  repoOwner: string;
  repoName: string;
  branch: string;
  configPath: string;
}

export interface ConnectionResponse {
  status: "connected" | "disconnected" | "error";
  modelCount?: number;
  error?: string;
  repoOwner?: string;
  repoName?: string;
  branch?: string;
  configPath?: string;
}

export interface ModelsResponse {
  models: Model[];
  source: string;
}

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return resp;
}

export async function getCurrentUser(): Promise<User | null> {
  const resp = await apiFetch("/api/auth/me");
  if (!resp.ok) return null;
  return resp.json();
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function connect(settings: ConnectionSettings): Promise<ConnectionResponse> {
  const resp = await apiFetch("/api/connection", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return resp.json();
}

export async function disconnect(): Promise<ConnectionResponse> {
  const resp = await apiFetch("/api/connection", {
    method: "DELETE",
  });
  return resp.json();
}

export async function getConnectionStatus(): Promise<ConnectionResponse> {
  const resp = await apiFetch("/api/connection/status");
  return resp.json();
}

export async function fetchModels(refresh?: boolean): Promise<ModelsResponse> {
  const params = refresh ? "?refresh=true" : "";
  const resp = await apiFetch(`/api/models${params}`);
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data.error || "Failed to fetch models");
  }
  return resp.json();
}

export async function fetchModel(id: string): Promise<Model> {
  const resp = await apiFetch(`/api/models/${id}`);
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data.error || "Model not found");
  }
  return resp.json();
}

// Cache connection info for constructing GitHub URLs without extra API calls
let cachedConnectionInfo: ConnectionResponse | null = null;

export function setCachedConnectionInfo(info: ConnectionResponse) {
  cachedConnectionInfo = info;
}

export function getGitHubFileUrl(filePath: string): string | null {
  if (!cachedConnectionInfo || cachedConnectionInfo.status !== "connected") return null;
  const { repoOwner, repoName, branch } = cachedConnectionInfo;
  if (!repoOwner || !repoName) return null;
  return `https://github.com/${repoOwner}/${repoName}/blob/${branch || "main"}/${filePath}`;
}

export async function fetchFileContent(path: string): Promise<string> {
  const resp = await fetch(`${API_BASE}/api/files/${path}`, {
    credentials: "include",
  });
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data.error || "Failed to fetch file");
  }
  return resp.text();
}
