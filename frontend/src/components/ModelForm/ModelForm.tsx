import { useState, useEffect, FormEvent } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { Model, ModelStatus } from "../../types";

interface ModelFormProps {
  model: Model | null;
  onSave: (model: Omit<Model, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const frameworks = [
  "PyTorch",
  "TensorFlow",
  "scikit-learn",
  "Hugging Face",
  "JAX",
  "XGBoost",
  "Other",
];

const statuses: { value: ModelStatus; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "archived", label: "Archived" },
];

export default function ModelForm({ model, onSave, onCancel }: ModelFormProps) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState(frameworks[0]);
  const [status, setStatus] = useState<ModelStatus>("development");
  const [owner, setOwner] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [latency, setLatency] = useState("");

  useEffect(() => {
    if (model) {
      setName(model.name);
      setVersion(model.version);
      setDescription(model.description);
      setFramework(model.framework);
      setStatus(model.status);
      setOwner(model.owner);
      setAccuracy(
        model.metrics?.accuracy !== undefined
          ? (model.metrics.accuracy * 100).toString()
          : ""
      );
      setLatency(
        model.metrics?.latency !== undefined
          ? model.metrics.latency.toString()
          : ""
      );
    }
  }, [model]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const metrics: Model["metrics"] = {};
    if (accuracy) {
      metrics.accuracy = parseFloat(accuracy) / 100;
    }
    if (latency) {
      metrics.latency = parseFloat(latency);
    }

    onSave({
      name,
      version,
      description,
      framework,
      status,
      owner,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
    });
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {model ? "Edit Model" : "Add New Model"}
        </Typography>
        <IconButton onClick={onCancel} size="small" aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Name and Version row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Model Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Customer Churn Predictor"
                fullWidth
                size="small"
              />
              <TextField
                label="Version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
                placeholder="e.g., 1.0.0"
                fullWidth
                size="small"
              />
            </Stack>

            {/* Description */}
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe what this model does..."
              multiline
              rows={3}
              fullWidth
              size="small"
            />

            {/* Framework and Status row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Framework</InputLabel>
                <Select
                  value={framework}
                  label="Framework"
                  onChange={(e) => setFramework(e.target.value)}
                >
                  {frameworks.map((fw) => (
                    <MenuItem key={fw} value={fw}>
                      {fw}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as ModelStatus)}
                >
                  {statuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Owner */}
            <TextField
              label="Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
              placeholder="e.g., Sarah Chen"
              fullWidth
              size="small"
            />

            {/* Metrics Section */}
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", mb: 2 }}
              >
                Metrics (Optional)
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Accuracy (%)"
                  type="number"
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  placeholder="e.g., 92.5"
                  fullWidth
                  size="small"
                  slotProps={{
                    htmlInput: { min: 0, max: 100, step: 0.1 },
                  }}
                />
                <TextField
                  label="Latency (ms)"
                  type="number"
                  value={latency}
                  onChange={(e) => setLatency(e.target.value)}
                  placeholder="e.g., 45"
                  fullWidth
                  size="small"
                  slotProps={{
                    htmlInput: { min: 0, step: 1 },
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {model ? "Save Changes" : "Create Model"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
