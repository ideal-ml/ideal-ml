import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { Model } from "../../types";

interface ModelCardProps {
  model: Model;
  onEdit: (model: Model) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

const statusColors: Record<Model["status"], "warning" | "info" | "success" | "default"> = {
  development: "warning",
  staging: "info",
  production: "success",
  archived: "default",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ModelCard({
  model,
  onEdit,
  onDelete,
  isReadOnly = false,
}: ModelCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete "${model.name}"?`)) {
      onDelete(model.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(model);
  };

  return (
    <Card
      component={Link}
      to={`/models/${model.id}`}
      sx={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {/* Header */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {model.name}
            </Typography>
            <Chip
              label={model.status}
              color={statusColors[model.status]}
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              v{model.version}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {model.framework}
            </Typography>
          </Stack>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {model.description}
        </Typography>

        {/* Metrics */}
        {model.metrics && (
          <Stack
            direction="row"
            spacing={3}
            sx={{
              py: 1.5,
              borderTop: 1,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {model.metrics.accuracy !== undefined && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                  }}
                >
                  Accuracy
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, color: "primary.main" }}
                >
                  {(model.metrics.accuracy * 100).toFixed(1)}%
                </Typography>
              </Box>
            )}
            {model.metrics.latency !== undefined && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                  }}
                >
                  Latency
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, color: "primary.main" }}
                >
                  {model.metrics.latency}ms
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: "auto",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ display: "block", fontWeight: 500 }}>
              {model.owner}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Updated {formatDate(model.updatedAt)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              to={`/models/${model.id}/metrics`}
              size="small"
              variant="contained"
              onClick={(e) => e.stopPropagation()}
              aria-label={`View metrics for ${model.name}`}
            >
              Metrics
            </Button>
            {!isReadOnly && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleEdit}
                  aria-label={`Edit ${model.name}`}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  aria-label={`Delete ${model.name}`}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
