import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import { Model, ModelStatus } from "../../types";
import ModelCard from "../ModelCard/ModelCard";

interface ModelListProps {
  models: Model[];
  onEdit: (model: Model) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  isReadOnly?: boolean;
  isConnected?: boolean;
  onRefresh?: () => void;
}

const statusOptions: { value: ModelStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
  { value: "archived", label: "Archived" },
];

export default function ModelList({
  models,
  onEdit,
  onDelete,
  onAddNew,
  isReadOnly = false,
  onRefresh,
}: ModelListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.framework.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || model.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as ModelStatus | "all");
  };

  return (
    <Box sx={{ maxWidth: 1200 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Models
        </Typography>
        {!isReadOnly && (
          <Button variant="contained" startIcon={<Add />} onClick={onAddNew}>
            Add Model
          </Button>
        )}
        {isReadOnly && (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Chip
              label="View Only (from GitHub)"
              size="small"
              sx={{ bgcolor: "grey.100", color: "text.secondary" }}
            />
            {onRefresh && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
                title="Refresh from GitHub"
              >
                Refresh
              </Button>
            )}
          </Stack>
        )}
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: 400 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={statusFilter} onChange={handleStatusChange}>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Model Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: 3,
        }}
      >
        {filteredModels.length === 0 ? (
          <Paper
            sx={{
              gridColumn: "1 / -1",
              textAlign: "center",
              py: 6,
              px: 3,
              bgcolor: "background.paper",
            }}
          >
            <Typography color="text.secondary">
              No models found matching your criteria.
            </Typography>
          </Paper>
        ) : (
          filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={onEdit}
              onDelete={onDelete}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
