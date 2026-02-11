import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Dataset } from "../../types";

interface AddDatasetDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (dataset: Omit<Dataset, "id" | "addedAt">) => void;
}

export default function AddDatasetDialog({ open, onClose, onAdd }: AddDatasetDialogProps) {
  const [name, setName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [rowCount, setRowCount] = useState("");
  const [columns, setColumns] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !filePath.trim()) return;

    const dataset: Omit<Dataset, "id" | "addedAt"> = {
      name: name.trim(),
      filePath: filePath.trim(),
      description: description.trim() || undefined,
      rowCount: rowCount ? parseInt(rowCount, 10) : undefined,
      columns: columns.trim()
        ? columns.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined,
    };

    onAdd(dataset);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setFilePath("");
    setDescription("");
    setRowCount("");
    setColumns("");
    onClose();
  };

  const isValid = name.trim() && filePath.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Dataset</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add a CSV dataset to this model. This will create a new minor version.
            </Typography>
          </Box>

          <TextField
            label="Dataset Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., training_data.csv"
            required
            fullWidth
          />

          <TextField
            label="File Path"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g., s3://ml-datasets-prod/model/v1.0.0/training_data.csv"
            helperText="S3 path to the CSV file"
            required
            fullWidth
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this dataset"
            multiline
            rows={2}
            fullWidth
          />

          <TextField
            label="Row Count"
            value={rowCount}
            onChange={(e) => setRowCount(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g., 10000"
            helperText="Optional: Number of rows in the dataset"
            fullWidth
          />

          <TextField
            label="Columns"
            value={columns}
            onChange={(e) => setColumns(e.target.value)}
            placeholder="e.g., id, name, value, label"
            helperText="Optional: Comma-separated list of column names"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          Add Dataset
        </Button>
      </DialogActions>
    </Dialog>
  );
}
