export interface Dataset {
  id: string;
  name: string;
  filePath: string;
  description?: string;
  rowCount?: number;
  columns?: string[];
  addedAt: string;
}

export interface ModelVersion {
  version: string;
  datasets: Dataset[];
  createdAt: string;
  notes?: string;
}

export interface Model {
  id: string;
  name: string;
  version: string;
  description: string;
  framework: string;
  status: "development" | "staging" | "production" | "archived";
  owner: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    accuracy?: number;
    latency?: number;
  };
  files?: {
    modelCard?: string;
    trainingScript?: string;
    featureScript?: string;
    inferenceScript?: string;
    modelFile?: string;
  };
  versions?: ModelVersion[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export type ModelStatus = Model["status"];

export interface GitHubSettings {
  repoOwner: string;
  repoName: string;
  branch: string;
  configPath: string;
  token: string;
}

export interface GitHubCache {
  models: Model[];
  lastFetched: string;
  repoUrl: string;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
