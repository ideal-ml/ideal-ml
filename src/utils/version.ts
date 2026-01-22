import { Model, Dataset, ModelVersion } from "../types";

export function incrementMinorVersion(version: string): string {
  const parts = version.split(".").map(Number);
  const [major = 0, minor = 0] = parts;
  return `${major}.${minor + 1}.0`;
}

export function createNewVersion(
  model: Model,
  newDatasets: Dataset[],
  notes?: string
): ModelVersion {
  return {
    version: incrementMinorVersion(model.version),
    datasets: newDatasets,
    createdAt: new Date().toISOString(),
    notes,
  };
}

export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vB.major - vA.major;
  if (vA.minor !== vB.minor) return vB.minor - vA.minor;
  return vB.patch - vA.patch;
}
