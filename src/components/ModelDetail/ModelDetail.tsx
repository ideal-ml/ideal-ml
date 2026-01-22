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
import { Model, Dataset, ModelVersion } from "../../types";
import { fetchFileContent, getGitHubFileUrl } from "../../services/github";
import { compareVersions } from "../../utils/version";
import Markdown from "react-markdown";
import DatasetPreview from "../DatasetPreview/DatasetPreview";
import AddDatasetDialog from "../AddDatasetDialog/AddDatasetDialog";

interface ModelDetailProps {
  model: Model;
  isConnected: boolean;
  onModelUpdate?: (model: Model) => void;
}

type TabId = "overview" | "model_file" | "training" | "features" | "inference" | "datasets";

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
    if (model.files?.modelCard) {
      loadFile(model.files.modelCard, setModelCardContent, "modelCard");
    }
  }, [model.files?.modelCard, isConnected]);

  useEffect(() => {
    if (activeTab === "training" && model.files?.trainingScript && trainingScript === null && !errors.training) {
      loadFile(model.files.trainingScript, setTrainingScript, "training");
    }
  }, [activeTab, model.files?.trainingScript]);

  useEffect(() => {
    if (activeTab === "features" && model.files?.featureScript && featureScript === null && !errors.features) {
      loadFile(model.files.featureScript, setFeatureScript, "features");
    }
  }, [activeTab, model.files?.featureScript]);

  useEffect(() => {
    if (activeTab === "inference" && model.files?.inferenceScript && inferenceScript === null && !errors.inference) {
      loadFile(model.files.inferenceScript, setInferenceScript, "inference");
    }
  }, [activeTab, model.files?.inferenceScript]);

  const tabs: { id: TabId; label: string; filePath?: string }[] = [
    { id: "overview", label: "Model Card" },
    { id: "datasets", label: "Datasets" },
    { id: "training", label: "Training Script", filePath: model.files?.trainingScript },
    { id: "features", label: "Feature Extraction", filePath: model.files?.featureScript },
    { id: "inference", label: "Inference Script", filePath: model.files?.inferenceScript },
  ];

  const renderMDFile = () => {
    if (!(model.files?.modelCard && isConnected)) {
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

    return (
      <Paper variant="outlined">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}
        >
          <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
            {model.files.modelCard}
          </Typography>
          {getGitHubFileUrl(model.files.modelCard) && (
            <Button
              href={getGitHubFileUrl(model.files.modelCard)!}
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
    if (!isConnected) {
      return (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Connect to GitHub to view this file.</Typography>
        </Paper>
      );
    }

    if (!filePath) {
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

    const githubUrl = getGitHubFileUrl(filePath);

    return (
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
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
                disabled={tab.id !== "overview" && tab.id !== "datasets" && !tab.filePath && !isConnected}
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
