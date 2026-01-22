import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  CheckCircle,
  Error,
  FolderOpen,
  Person,
  Speed,
  TrendingUp,
} from "@mui/icons-material";
import { TrainingRun } from "../../types";

interface TrainingRunDetailsProps {
  run: TrainingRun;
}

function MetricCard({
  label,
  value,
  icon,
  color = "text.primary",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
      <Box sx={{ color: "action.active", mb: 1 }}>{icon}</Box>
      <Typography variant="h6" sx={{ color, fontWeight: 600 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TrainingRunDetails({ run }: TrainingRunDetailsProps) {
  return (
    <Stack spacing={3}>
      {/* Run Info */}
      <Stack direction="row" spacing={4} flexWrap="wrap">
        <Box>
          <Typography variant="caption" color="text.secondary">
            Run ID
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {run.id}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Started
          </Typography>
          <Typography variant="body2">{formatDate(run.startedAt)}</Typography>
        </Box>
        {run.completedAt && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="body2">{formatDate(run.completedAt)}</Typography>
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Triggered By
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Person sx={{ fontSize: 16, color: "action.active" }} />
            <Typography variant="body2">{run.triggeredBy}</Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Validation Status */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Validation
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: run.validation.isValid ? "success.50" : "error.50",
            borderColor: run.validation.isValid ? "success.main" : "error.main",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {run.validation.isValid ? (
              <CheckCircle color="success" />
            ) : (
              <Error color="error" />
            )}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {run.validation.isValid ? "Validation Passed" : "Validation Failed"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {run.validation.message}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
            {run.validation.datasetColumns.map((col) => (
              <Chip
                key={col}
                label={col}
                size="small"
                color={run.validation.expectedColumns.includes(col) ? "success" : "default"}
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>
      </Box>

      {/* Metrics */}
      {run.metrics && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Training Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                label="Accuracy"
                value={`${(run.metrics.accuracy * 100).toFixed(1)}%`}
                icon={<TrendingUp />}
                color="success.main"
              />
            </Grid>
            {run.metrics.precision !== undefined && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  label="Precision"
                  value={`${(run.metrics.precision * 100).toFixed(1)}%`}
                  icon={<TrendingUp />}
                />
              </Grid>
            )}
            {run.metrics.recall !== undefined && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  label="Recall"
                  value={`${(run.metrics.recall * 100).toFixed(1)}%`}
                  icon={<TrendingUp />}
                />
              </Grid>
            )}
            {run.metrics.f1Score !== undefined && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  label="F1 Score"
                  value={`${(run.metrics.f1Score * 100).toFixed(1)}%`}
                  icon={<TrendingUp />}
                />
              </Grid>
            )}
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                label="Training Time"
                value={formatDuration(run.metrics.trainingTime)}
                icon={<AccessTime />}
              />
            </Grid>
            {run.metrics.epochs !== undefined && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <MetricCard
                  label="Epochs"
                  value={run.metrics.epochs}
                  icon={<Speed />}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Output Model */}
      {run.outputModelPath && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Output Model
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FolderOpen color="action" />
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {run.outputModelPath}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Logs */}
      {run.logs && run.logs.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Training Logs
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: "grey.900",
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {run.logs.map((log, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "grey.300",
                  whiteSpace: "pre-wrap",
                }}
              >
                {log}
              </Typography>
            ))}
          </Paper>
        </Box>
      )}
    </Stack>
  );
}
