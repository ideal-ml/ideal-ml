import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ContentCopy, ExpandMore, Storage, TableChart, Check } from "@mui/icons-material";
import { Dataset } from "../../types";

interface DatasetPreviewProps {
  dataset: Dataset;
  isConnected: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DatasetPreview({ dataset }: DatasetPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPath = async () => {
    await navigator.clipboard.writeText(dataset.filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, mr: 2 }}>
          <TableChart color="action" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {dataset.name}
            </Typography>
            {dataset.description && (
              <Typography variant="body2" color="text.secondary">
                {dataset.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {dataset.rowCount && (
              <Chip
                icon={<Storage sx={{ fontSize: 16 }} />}
                label={`${dataset.rowCount.toLocaleString()} rows`}
                size="small"
                variant="outlined"
              />
            )}
            {dataset.columns && (
              <Chip
                label={`${dataset.columns.length} columns`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
                px: 1.5,
                py: 0.75,
                flex: 1,
                mr: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", color: "text.secondary", flex: 1 }}
              >
                {dataset.filePath}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy path"}>
                <IconButton size="small" onClick={handleCopyPath}>
                  {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>

          {dataset.columns && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Columns:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {dataset.columns.map((col) => (
                  <Chip key={col} label={col} size="small" />
                ))}
              </Stack>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Added {formatDate(dataset.addedAt)}
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
