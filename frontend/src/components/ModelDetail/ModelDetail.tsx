import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Highlight, themes } from "prism-react-renderer";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Add, ArrowBack, OpenInNew } from "@mui/icons-material";
import { Model, Dataset, ModelVersion, TrainingPipeline as TrainingPipelineType, TrainingRun } from "../../types";
import { fetchFileContent, getGitHubFileUrl } from "../../services/api";
import { compareVersions } from "../../utils/version";
import Markdown from "react-markdown";
import DatasetPreview from "../DatasetPreview/DatasetPreview";
import AddDatasetDialog from "../AddDatasetDialog/AddDatasetDialog";
import TrainingPipeline from "../TrainingPipeline/TrainingPipeline";
import { mockPipelines } from "../../data/mockData";

interface ModelDetailProps {
  model: Model;
  isConnected: boolean;
  onModelUpdate?: (model: Model) => void;
}

type TabId = "overview" | "model_file" | "training" | "features" | "inference" | "datasets" | "pipeline";

const statusColors: Record<Model["status"], "warning" | "info" | "success" | "default"> = {
  development: "warning",
  staging: "info",
  production: "success",
  archived: "default",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ModelDetail({ model, isConnected, onModelUpdate }: ModelDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [modelCardContent, setModelCardContent] = useState<string | null>(null);
  const [trainingScript, setTrainingScript] = useState<string | null>(null);
  const [featureScript, setFeatureScript] = useState<string | null>(null);
  const [inferenceScript, setInferenceScript] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedVersion, setSelectedVersion] = useState<string>(model.version);
  const [addDatasetOpen, setAddDatasetOpen] = useState(false);
  const [pipeline, setPipeline] = useState<TrainingPipelineType>(() =>
    mockPipelines[model.id] || { modelId: model.id, runs: [] }
  );

  const sortedVersions = [...(model.versions || [])].sort((a, b) =>
    compareVersions(a.version, b.version)
  );
  const currentVersionData = sortedVersions.find((v) => v.version === selectedVersion);

  const loadFile = async (
    filePath: string | undefined,
    setter: (content: string | null) => void,
    key: string
  ) => {
    if (!filePath || !isConnected) {
      setter(null);
      return;
    }

    setLoading((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: "" }));

    try {
      console.log("Fetching file content for:", filePath);
      const content = await fetchFileContent(filePath);
      setter(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load file";
      setErrors((prev) => ({ ...prev, [key]: message }));
      setter(null);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (model.mockContent?.modelCard && !isConnected) {
      setModelCardContent(model.mockContent.modelCard);
    } else if (model.files?.modelCard) {
      loadFile(model.files.modelCard, setModelCardContent, "modelCard");
    }
  }, [model.files?.modelCard, model.mockContent?.modelCard, isConnected]);

  useEffect(() => {
    if (activeTab === "training" && trainingScript === null && !errors.training) {
      if (model.mockContent?.trainingScript && !isConnected) {
        setTrainingScript(model.mockContent.trainingScript);
      } else if (model.files?.trainingScript) {
        loadFile(model.files.trainingScript, setTrainingScript, "training");
      }
    }
  }, [activeTab, model.files?.trainingScript, model.mockContent?.trainingScript, isConnected]);

  useEffect(() => {
    if (activeTab === "features" && featureScript === null && !errors.features) {
      if (model.mockContent?.featureScript && !isConnected) {
        setFeatureScript(model.mockContent.featureScript);
      } else if (model.files?.featureScript) {
        loadFile(model.files.featureScript, setFeatureScript, "features");
      }
    }
  }, [activeTab, model.files?.featureScript, model.mockContent?.featureScript, isConnected]);

  useEffect(() => {
    if (activeTab === "inference" && inferenceScript === null && !errors.inference) {
      if (model.mockContent?.inferenceScript && !isConnected) {
        setInferenceScript(model.mockContent.inferenceScript);
      } else if (model.files?.inferenceScript) {
        loadFile(model.files.inferenceScript, setInferenceScript, "inference");
      }
    }
  }, [activeTab, model.files?.inferenceScript, model.mockContent?.inferenceScript, isConnected]);

  const tabs: { id: TabId; label: string; filePath?: string; hasMock?: boolean }[] = [
    { id: "overview", label: "Model Card" },
    { id: "datasets", label: "Datasets" },
    { id: "pipeline", label: "Training Pipeline" },
    { id: "training", label: "Training Script", filePath: model.files?.trainingScript, hasMock: !!model.mockContent?.trainingScript },
    { id: "features", label: "Feature Extraction", filePath: model.files?.featureScript, hasMock: !!model.mockContent?.featureScript },
    { id: "inference", label: "Inference Script", filePath: model.files?.inferenceScript, hasMock: !!model.mockContent?.inferenceScript },
  ];

  const renderMDFile = () => {
    const hasMockContent = !!model.mockContent?.modelCard;
    const hasGitHubContent = !!(model.files?.modelCard && isConnected);

    if (!hasMockContent && !hasGitHubContent) {
      return (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            No model card
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Please add a ModelCard.md in your model directory.
          </Typography>
          <Button
            href="https://github.com/spencerwjensen96/example-ml-models"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            endIcon={<OpenInNew />}
          >
            View on GitHub
          </Button>
        </Paper>
      );
    }

    if (loading.modelCard) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6 }}>
          <CircularProgress size={32} sx={{ mb: 2 }} />
          <Typography color="text.secondary">Loading model card...</Typography>
        </Box>
      );
    }

    if (errors.modelCard) {
      return (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadFile(model.files?.modelCard, setModelCardContent, "modelCard")}
            >
              Retry
            </Button>
          }
        >
          Error loading model card: {errors.modelCard}
        </Alert>
      );
    }

    const filePath = model.files?.modelCard;
    const githubUrl = filePath ? getGitHubFileUrl(filePath) : null;

    return (
      <Paper variant="outlined">
        {filePath && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
          >
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
              {filePath}
            </Typography>
            {githubUrl && (
              <Button
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                variant="outlined"
                endIcon={<OpenInNew />}
              >
                View on GitHub
              </Button>
            )}
          </Stack>
        )}
        <Box sx={{ p: 3 }} className="markdown-raw">
          <Markdown>{modelCardContent}</Markdown>
        </Box>
      </Paper>
    );
  };

  const renderCodeBlock = (
    content: string | null,
    filePath: string | undefined,
    loadingKey: string,
    errorKey: string
  ) => {
    // Allow rendering if we have content (from mock or GitHub)
    const hasContent = content !== null;

    if (!isConnected && !hasContent) {
      return (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Connect to GitHub to view this file.</Typography>
        </Paper>
      );
    }

    if (!filePath && !hasContent) {
      return (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No file path configured for this script.</Typography>
        </Paper>
      );
    }

    if (loading[loadingKey]) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6 }}>
          <CircularProgress size={32} sx={{ mb: 2 }} />
          <Typography color="text.secondary">Loading file...</Typography>
        </Box>
      );
    }

    if (errors[errorKey]) {
      return (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (loadingKey === "training") loadFile(filePath, setTrainingScript, "training");
                if (loadingKey === "features") loadFile(filePath, setFeatureScript, "features");
                if (loadingKey === "inference") loadFile(filePath, setInferenceScript, "inference");
              }}
            >
              Retry
            </Button>
          }
        >
          Error: {errors[errorKey]}
        </Alert>
      );
    }

    const githubUrl = filePath ? getGitHubFileUrl(filePath) : null;

    return (
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {filePath && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
          >
            <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
              {filePath}
            </Typography>
          {githubUrl && (
            <Button
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              endIcon={<OpenInNew />}
            >
              View on GitHub
            </Button>
          )}
          </Stack>
        )}
        <Highlight theme={themes.vsDark} code={content || ""} language="python">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className="code-block" style={{ ...style, margin: 0, padding: "16px", overflow: "auto" }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="line-number">{i + 1}</span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </Paper>
    );
  };

  const renderModelFileContents = (filePath: string) => {
    const githubUrl = getGitHubFileUrl(filePath);

    return (
      <Paper variant="outlined" sx={{ mt: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
            {model.files?.modelFile}
          </Typography>
          {githubUrl && (
            <Button
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              endIcon={<OpenInNew />}
            >
              View on GitHub
            </Button>
          )}
        </Stack>
      </Paper>
    );
  };

  const handleAddDataset = (dataset: Omit<Dataset, "id" | "addedAt">) => {
    if (!onModelUpdate) return;

    const newDataset: Dataset = {
      ...dataset,
      id: `ds-${Date.now()}`,
      addedAt: new Date().toISOString(),
    };

    const newVersion = model.version.split(".").map(Number);
    newVersion[1] = (newVersion[1] || 0) + 1;
    newVersion[2] = 0;
    const newVersionStr = newVersion.join(".");

    const existingDatasets = currentVersionData?.datasets || [];
    const newVersionData: ModelVersion = {
      version: newVersionStr,
      datasets: [...existingDatasets, newDataset],
      createdAt: new Date().toISOString(),
      notes: `Added dataset: ${newDataset.name}`,
    };

    const updatedModel: Model = {
      ...model,
      version: newVersionStr,
      updatedAt: new Date().toISOString(),
      versions: [newVersionData, ...(model.versions || [])],
    };

    onModelUpdate(updatedModel);
    setSelectedVersion(newVersionStr);
    setAddDatasetOpen(false);
  };

  const handleRunTraining = (datasetId: string) => {
    const dataset = currentVersionData?.datasets.find((d) => d.id === datasetId);
    if (!dataset) return;

    // Create a new training run (mock - would actually trigger backend)
    const newRun: TrainingRun = {
      id: `run-${Date.now()}`,
      modelId: model.id,
      datasetId,
      datasetName: dataset.name,
      status: "running",
      startedAt: new Date().toISOString(),
      validation: {
        isValid: true,
        datasetColumns: dataset.columns || [],
        expectedColumns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
        missingColumns: [],
        extraColumns: [],
        message: "Validation passed",
      },
      triggeredBy: "Sarah Chen",
    };

    setPipeline((prev) => ({
      ...prev,
      runs: [newRun, ...prev.runs],
    }));

    // Simulate training completion after 3 seconds
    setTimeout(() => {
      setPipeline((prev) => ({
        ...prev,
        runs: prev.runs.map((run) =>
          run.id === newRun.id
            ? {
                ...run,
                status: "completed" as const,
                completedAt: new Date().toISOString(),
                metrics: {
                  accuracy: 0.85 + Math.random() * 0.1,
                  precision: 0.83 + Math.random() * 0.1,
                  recall: 0.86 + Math.random() * 0.1,
                  f1Score: 0.84 + Math.random() * 0.1,
                  trainingTime: Math.floor(120 + Math.random() * 60),
                  epochs: 100,
                },
                outputModelPath: `models/example/outputs/model_${newRun.id}.pkl`,
                logs: [
                  `[${new Date().toISOString()}] Starting training run...`,
                  `[${new Date().toISOString()}] Loading dataset: ${dataset.name}`,
                  `[${new Date().toISOString()}] Training complete.`,
                ],
              }
            : run
        ),
      }));
    }, 3000);
  };

  const renderPipelineTab = () => {
    const datasets = currentVersionData?.datasets || [];
    return (
      <TrainingPipeline
        model={model}
        pipeline={pipeline}
        datasets={datasets}
        onRunTraining={handleRunTraining}
      />
    );
  };

  const renderDatasetsTab = () => {
    const datasets = currentVersionData?.datasets || [];

    return (
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Version</InputLabel>
            <Select
              value={selectedVersion}
              label="Version"
              onChange={(e) => setSelectedVersion(e.target.value)}
            >
              {sortedVersions.map((v) => (
                <MenuItem key={v.version} value={v.version}>
                  v{v.version} ({formatDate(v.createdAt)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDatasetOpen(true)}
          >
            Add Dataset
          </Button>
        </Stack>

        {currentVersionData?.notes && (
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              <strong>Version notes:</strong> {currentVersionData.notes}
            </Typography>
          </Alert>
        )}

        {datasets.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              No datasets
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              This version has no associated datasets.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setAddDatasetOpen(true)}
            >
              Add Dataset
            </Button>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {datasets.map((dataset) => (
              <DatasetPreview key={dataset.id} dataset={dataset} isConnected={isConnected} />
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" sx={{ mb: 4 }}>
        <Button
          component={RouterLink}
          to="/models"
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Back to Models
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1, textAlign: "center", mr: 15 }}>
          {model.name}
        </Typography>
      </Stack>

      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Hero Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Chip
              label={model.status}
              color={statusColors[model.status]}
              size="small"
              sx={{ textTransform: "capitalize", mb: 2 }}
            />

            <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {model.version}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Framework
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {model.framework}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Owner
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {model.owner}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Updated
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(model.updatedAt)}
                </Typography>
              </Box>
            </Stack>

            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {model.description}
            </Typography>

            {model.metrics && (
              <Button
                component={RouterLink}
                to={`/models/${model.id}/metrics`}
                variant="contained"
              >
                View Metrics
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={tab.label}
                disabled={tab.id !== "overview" && tab.id !== "datasets" && tab.id !== "pipeline" && !tab.filePath && !tab.hasMock && !isConnected}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === "overview" && (
            <Box>
              {renderMDFile()}
              {model.files?.modelFile && renderModelFileContents(model.files.modelFile)}
            </Box>
          )}

          {activeTab === "datasets" && renderDatasetsTab()}

          {activeTab === "pipeline" && renderPipelineTab()}

          {activeTab === "training" && (
            <Box>
              {renderCodeBlock(trainingScript, model.files?.trainingScript, "training", "training")}
            </Box>
          )}

          {activeTab === "features" && (
            <Box>
              {renderCodeBlock(featureScript, model.files?.featureScript, "features", "features")}
            </Box>
          )}

          {activeTab === "inference" && (
            <Box>
              {renderCodeBlock(inferenceScript, model.files?.inferenceScript, "inference", "inference")}
            </Box>
          )}
        </Box>
      </Box>

      <AddDatasetDialog
        open={addDatasetOpen}
        onClose={() => setAddDatasetOpen(false)}
        onAdd={handleAddDataset}
      />
    </Box>
  );
}
