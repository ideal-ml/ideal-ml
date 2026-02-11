import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { Model } from "../../types";

interface ModelMetricsProps {
  model: Model;
}

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

export default function ModelMetrics({ model }: ModelMetricsProps) {
  const hasMetrics = model.metrics && (model.metrics.accuracy !== undefined || model.metrics.latency !== undefined);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" sx={{ mb: 4 }}>
        <Button
          component={RouterLink}
          to={`/models/${model.id}`}
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1, textAlign: "center", mr: 10 }}>
          Model Metrics
        </Typography>
      </Stack>

      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Hero Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {model.name}
              </Typography>
              <Chip
                label={model.status}
                color={statusColors[model.status]}
                size="small"
                sx={{ textTransform: "capitalize" }}
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={3}>
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
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        {hasMetrics ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mb: 3,
            }}
          >
            {model.metrics?.accuracy !== undefined && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Accuracy
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "primary.main", mb: 2 }}>
                    {(model.metrics.accuracy * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={model.metrics.accuracy * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 2,
                      backgroundColor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Model prediction accuracy on the validation dataset
                  </Typography>
                </CardContent>
              </Card>
            )}

            {model.metrics?.latency !== undefined && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Latency
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: "warning.main", mb: 2 }}>
                    {model.metrics.latency}ms
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((model.metrics.latency / 100) * 100, 100)}
                    color="warning"
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 2,
                      backgroundColor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Average inference time per prediction
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              No Metrics Available
            </Typography>
            <Typography color="text.secondary">
              This model does not have any metrics recorded yet.
            </Typography>
          </Paper>
        )}

        {/* Performance Summary */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Performance Summary
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Status
                </Typography>
                <Chip
                  label={model.status}
                  color={statusColors[model.status]}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Framework
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {model.framework}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(model.updatedAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Created
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(model.createdAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
