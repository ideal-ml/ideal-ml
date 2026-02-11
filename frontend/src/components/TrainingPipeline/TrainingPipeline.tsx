import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  ExpandLess,
  ExpandMore,
  PlayArrow,
  Schedule,
  Warning,
} from "@mui/icons-material";
import { Dataset, Model, TrainingPipeline as TrainingPipelineType, TrainingRun, ValidationResult } from "../../types";
import TrainingRunDetails from "../TrainingRunDetails/TrainingRunDetails";

interface TrainingPipelineProps {
  model: Model;
  pipeline: TrainingPipelineType;
  datasets: Dataset[];
  onRunTraining: (datasetId: string) => void;
}

function ValidationStatus({ validation }: { validation: ValidationResult }) {
  if (validation.isValid) {
    return (
      <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Validation Passed
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {validation.message}
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert severity="error" icon={<Error />} sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Validation Failed
      </Typography>
      <Typography variant="caption" display="block">
        {validation.message}
      </Typography>
      {validation.missingColumns.length > 0 && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Missing columns: {validation.missingColumns.join(", ")}
        </Typography>
      )}
      {validation.extraColumns.length > 0 && (
        <Typography variant="caption" display="block">
          Unexpected columns: {validation.extraColumns.join(", ")}
        </Typography>
      )}
    </Alert>
  );
}

function RunStatusChip({ status }: { status: TrainingRun["status"] }) {
  const config: Record<TrainingRun["status"], { color: "success" | "error" | "warning" | "info" | "default"; icon: React.ReactElement }> = {
    pending: { color: "default", icon: <Schedule sx={{ fontSize: 16 }} /> },
    validating: { color: "info", icon: <Schedule sx={{ fontSize: 16 }} /> },
    running: { color: "warning", icon: <Schedule sx={{ fontSize: 16 }} /> },
    completed: { color: "success", icon: <CheckCircle sx={{ fontSize: 16 }} /> },
    failed: { color: "error", icon: <Error sx={{ fontSize: 16 }} /> },
  };

  return (
    <Chip
      size="small"
      label={status}
      color={config[status].color}
      icon={config[status].icon}
      sx={{ textTransform: "capitalize" }}
    />
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function TrainingPipeline({
  model,
  pipeline,
  datasets,
  onRunTraining,
}: TrainingPipelineProps) {
  const [selectedDataset, setSelectedDataset] = useState<string>(datasets[0]?.id || "");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentValidation, setCurrentValidation] = useState<ValidationResult | null>(null);

  const selectedDatasetObj = datasets.find((d) => d.id === selectedDataset);

  const validateDataset = () => {
    if (!selectedDatasetObj) return;

    setIsValidating(true);

    // Simulate validation delay
    setTimeout(() => {
      // Mock validation logic - check if dataset columns match expected
      const expectedColumns = ["Feature 1", "Feature 2", "Feature 3", "Label"];
      const datasetColumns = selectedDatasetObj.columns || [];

      const missingColumns = expectedColumns.filter((c) => !datasetColumns.includes(c));
      const extraColumns = datasetColumns.filter((c) => !expectedColumns.includes(c));
      const isValid = missingColumns.length === 0;

      setCurrentValidation({
        isValid,
        datasetColumns,
        expectedColumns,
        missingColumns,
        extraColumns,
        message: isValid
          ? `All ${expectedColumns.length} required columns found in dataset`
          : `Dataset is missing ${missingColumns.length} required column(s)`,
      });
      setIsValidating(false);
    }, 800);
  };

  const handleRunTraining = () => {
    if (selectedDataset && currentValidation?.isValid) {
      onRunTraining(selectedDataset);
    }
  };

  const hasTrainingScript = !!(model.files?.trainingScript || model.mockContent?.trainingScript);

  return (
    <Stack spacing={3}>
      {/* Pipeline Configuration */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Training Pipeline
          </Typography>

          {!hasTrainingScript ? (
            <Alert severity="warning" icon={<Warning />}>
              No training script configured for this model. Add a training script to enable the pipeline.
            </Alert>
          ) : (
            <Stack spacing={3}>
              {/* Script Info */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Training Script
                </Typography>
                <Paper variant="outlined" sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {model.files?.trainingScript || "mock://train.py"}
                  </Typography>
                </Paper>
              </Box>

              {/* Dataset Selection */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Select Dataset
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <FormControl size="small" sx={{ minWidth: 300 }}>
                    <InputLabel>Dataset</InputLabel>
                    <Select
                      value={selectedDataset}
                      label="Dataset"
                      onChange={(e) => {
                        setSelectedDataset(e.target.value);
                        setCurrentValidation(null);
                      }}
                    >
                      {datasets.map((dataset) => (
                        <MenuItem key={dataset.id} value={dataset.id}>
                          {dataset.name} ({dataset.rowCount?.toLocaleString() || "?"} rows)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    onClick={validateDataset}
                    disabled={!selectedDataset || isValidating}
                  >
                    {isValidating ? "Validating..." : "Validate"}
                  </Button>
                </Stack>
              </Box>

              {/* Validation Result */}
              {isValidating && <LinearProgress />}
              {currentValidation && <ValidationStatus validation={currentValidation} />}

              {/* Run Button */}
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={handleRunTraining}
                  disabled={!currentValidation?.isValid}
                  size="large"
                >
                  Run Training
                </Button>
                {!currentValidation && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Validate dataset before running
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Training Runs History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Training Runs
          </Typography>

          {pipeline.runs.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No training runs yet. Configure and run your first training above.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {pipeline.runs.map((run) => (
                <Paper key={run.id} variant="outlined">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <RunStatusChip status={run.status} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {run.datasetName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(run.startedAt)}
                          {run.metrics && ` • ${formatDuration(run.metrics.trainingTime)}`}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {run.status === "completed" && run.metrics && (
                        <Chip
                          size="small"
                          label={`${(run.metrics.accuracy * 100).toFixed(1)}% accuracy`}
                          color="success"
                          variant="outlined"
                        />
                      )}
                      <IconButton size="small">
                        {expandedRun === run.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Stack>
                  </Box>
                  <Collapse in={expandedRun === run.id}>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <TrainingRunDetails run={run} />
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
