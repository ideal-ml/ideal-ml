export interface DatasetPreviewData {
  headers: string[];
  rows: string[][];
}

export interface Dataset {
  id: string;
  name: string;
  filePath: string;
  description?: string;
  rowCount?: number;
  columns?: string[];
  addedAt: string;
  previewData?: DatasetPreviewData;
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
  mockContent?: {
    modelCard?: string;
    trainingScript?: string;
    featureScript?: string;
    inferenceScript?: string;
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

export type TrainingRunStatus = "pending" | "validating" | "running" | "completed" | "failed";

export interface TrainingMetrics {
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  loss?: number;
  validationAccuracy?: number;
  trainingTime: number; // in seconds
  epochs?: number;
}

export interface ValidationResult {
  isValid: boolean;
  datasetColumns: string[];
  expectedColumns: string[];
  missingColumns: string[];
  extraColumns: string[];
  message: string;
}

export interface TrainingRun {
  id: string;
  modelId: string;
  datasetId: string;
  datasetName: string;
  status: TrainingRunStatus;
  startedAt: string;
  completedAt?: string;
  metrics?: TrainingMetrics;
  outputModelPath?: string;
  logs?: string[];
  validation: ValidationResult;
  triggeredBy: string;
}

export interface TrainingPipeline {
  modelId: string;
  trainingScriptPath?: string;
  lastValidation?: ValidationResult;
  runs: TrainingRun[];
}
