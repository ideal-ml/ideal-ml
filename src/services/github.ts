import { Model, GitHubSettings, GitHubCache } from "../types";
import YAML from 'yaml'

const SETTINGS_KEY = "github_settings";
const CACHE_KEY = "github_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getSettings(): GitHubSettings | null {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveSettings(settings: GitHubSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  // Clear cache when settings change
  localStorage.removeItem(CACHE_KEY);
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(CACHE_KEY);
}

function getCache(): GitHubCache | null {
  const stored = localStorage.getItem(CACHE_KEY);
  if (!stored) return null;
  try {
    const cache: GitHubCache = JSON.parse(stored);
    const lastFetched = new Date(cache.lastFetched).getTime();
    if (Date.now() - lastFetched > CACHE_TTL) {
      return null; // Cache expired
    }
    return cache;
  } catch {
    return null;
  }
}

function setCache(models: Model[], repoUrl: string): void {
  const cache: GitHubCache = {
    models,
    lastFetched: new Date().toISOString(),
    repoUrl,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function fetchModelsFromGitHub(
  settings: GitHubSettings
): Promise<Model[]> {
  const repoUrl = `${settings.repoOwner}/${settings.repoName}`;

  // Check cache first
  const cached = getCache();
  if (cached && cached.repoUrl === repoUrl) {
    return cached.models;
  }

  // Fetch from GitHub API
  const url = `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${settings.configPath}?ref=${settings.branch}`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (settings.token) {
    headers.Authorization = `Bearer ${settings.token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Config file not found: ${settings.configPath}`);
    }
    if (response.status === 401) {
      throw new Error("Invalid GitHub token");
    }
    if (response.status === 403) {
      throw new Error("Rate limited or access denied");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  // GitHub returns base64 encoded content
  const content = atob(data.content);
  const parsed = parseConfigFile(content, settings.configPath);

  // Cache the results
  setCache(parsed, repoUrl);

  return parsed;
}

function parseConfigFile(content: string, path: string): Model[] {
  const isYaml = path.endsWith(".yaml") || path.endsWith(".yml");

  let data: unknown;

  if (isYaml) {
    data = YAML.parse(content);
  } else {
    data = JSON.parse(content);
  }

  const modelsArray = Array.isArray(data) ? data : (data as { models?: unknown[] }).models;

  if (!Array.isArray(modelsArray)) {
    throw new Error("Config file must contain an array of models");
  }

  return modelsArray.map((item, index) => normalizeModel(item, index));
}

function normalizeModel(item: unknown, index: number): Model {
  const obj = item as Record<string, unknown>;
  const now = new Date().toISOString();

  const filesObj = obj.files as Record<string, unknown> | undefined;
  const versionsObj = obj.versions as Record<string, unknown>  | undefined;
  return {
    id: String(obj.id || `model-${index}`),
    name: String(obj.name || "Unnamed Model"),
    version: String(obj.version || "Unknown"),
    description: String(obj.description || ""),
    framework: String(obj.framework || "Unknown"),
    status: validateStatus(obj.status),
    owner: String(obj.owner || "Unknown"),
    createdAt: String(obj.createdAt || obj.created_at || now),
    updatedAt: String(obj.updatedAt || obj.updated_at || now),
    metrics: obj.metrics ? {
      accuracy: typeof (obj.metrics as Record<string, unknown>).accuracy === "number"
        ? (obj.metrics as Record<string, unknown>).accuracy as number
        : undefined,
      latency: typeof (obj.metrics as Record<string, unknown>).latency === "number"
        ? (obj.metrics as Record<string, unknown>).latency as number
        : undefined,
    } : undefined,
    versions: versionsObj ? Array.isArray(versionsObj) ? versionsObj.map((ver) => {
      const verObj = ver as Record<string, unknown>;
      const datasetsObj = verObj.datasets as Record<string, unknown>[] | undefined;
      return {
        version: String(verObj.version || "Unknown"),
        createdAt: String(verObj.createdAt || verObj.created_at || "Unknown"),
        notes: String(verObj.notes || ""),
        datasets: datasetsObj ? datasetsObj.map((ds) => {
          const dsObj = ds as Record<string, unknown>;
          return {
            id: String(dsObj.id || `dataset-${Math.random().toString(36).substr(2, 9)}`),
            name: String(dsObj.name || "Unnamed Dataset"),
            filePath: String(dsObj.filePath || dsObj.file_path || ""),
            description: String(dsObj.description || ""),
            rowCount: typeof dsObj.rowCount === "number" ? dsObj.rowCount as number : undefined,
            columns: Array.isArray(dsObj.columns)
              ? (dsObj.columns as unknown[]).map(String)
              : undefined,
            addedAt: String(dsObj.addedAt || dsObj.added_at || now),
          };
        }) : [],
      };
    }) : [] : undefined,
    files: filesObj ? {
      modelCard: typeof filesObj.modelCard === "string" ? filesObj.modelCard : undefined,
      trainingScript: typeof filesObj.trainingScript === "string" ? filesObj.trainingScript : undefined,
      featureScript: typeof filesObj.featureScript === "string" ? filesObj.featureScript : undefined,
      inferenceScript: typeof filesObj.inferenceScript === "string" ? filesObj.inferenceScript : undefined,
      modelFile: typeof filesObj.modelFile === "string" ? filesObj.modelFile : undefined,
    } : undefined,
  };
}

function validateStatus(status: unknown): Model["status"] {
  const validStatuses = ["development", "staging", "production", "archived"];
  if (typeof status === "string" && validStatuses.includes(status)) {
    return status as Model["status"];
  }
  return "development";
}

export function invalidateCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

export async function fetchFileContent(
  filePath: string
): Promise<string> {
  const settings = getSettings();
  if (!settings) {
    throw new Error("GitHub not configured");
  }

  const url = `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${filePath}?ref=${settings.branch}`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (settings.token) {
    headers.Authorization = `Bearer ${settings.token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  const data = await response.json();

  return atob(data.content);
}

export function getGitHubFileUrl(filePath: string): string | null {
  const settings = getSettings();
  if (!settings) return null;

  return `https://github.com/${settings.repoOwner}/${settings.repoName}/blob/${settings.branch}/${filePath}`;
}

export function downloadGitHubFile(filePath: string): string | null {
  const settings = getSettings();
  if (!settings) return null;

  return `https://raw.githubusercontent.com/${settings.repoOwner}/${settings.repoName}/refs/heads/${settings.branch}/${filePath}`;
}
