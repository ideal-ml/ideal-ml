import { useState, useEffect, FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack, OpenInNew } from "@mui/icons-material";
import { GitHubSettings, ConnectionStatus } from "../../types";
import {
  getSettings,
  saveSettings,
  clearSettings,
  fetchModelsFromGitHub,
  invalidateCache,
} from "../../services/github";

interface SettingsProps {
  onSave: (settings: GitHubSettings | null) => void;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
}

const statusConfig: Record<ConnectionStatus, { label: string; color: "success" | "warning" | "default" | "error" }> = {
  connected: { label: "Connected", color: "success" },
  connecting: { label: "Connecting...", color: "warning" },
  disconnected: { label: "Not connected", color: "default" },
  error: { label: "Error", color: "error" },
};

export default function Settings({
  onSave,
  connectionStatus,
  connectionError,
}: SettingsProps) {
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [branch, setBranch] = useState("main");
  const [configPath, setConfigPath] = useState("models.yaml");
  const [token, setToken] = useState("");

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [testDetails, setTestDetails] = useState<string | null>(null);

  useEffect(() => {
    const existing = getSettings();
    if (existing) {
      setRepoOwner(existing.repoOwner);
      setRepoName(existing.repoName);
      setBranch(existing.branch);
      setConfigPath(existing.configPath);
      setToken(existing.token);
    }
  }, []);

  const buildApiUrl = () => {
    const owner = repoOwner.trim();
    const repo = repoName.trim();
    const br = branch.trim() || "main";
    const path = configPath.trim() || "models.yaml";
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${br}`;
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestError(null);
    setTestDetails(null);

    const settings: GitHubSettings = {
      repoOwner: repoOwner.trim(),
      repoName: repoName.trim(),
      branch: branch.trim() || "main",
      configPath: configPath.trim() || "models.yaml",
      token: token.trim(),
    };

    const apiUrl = buildApiUrl();
    setTestDetails(`Fetching: ${apiUrl}`);

    try {
      invalidateCache();
      const models = await fetchModelsFromGitHub(settings);
      setTestStatus("success");
      setTestDetails(`Success! Found ${models.length} model(s).`);
      setTestError(null);
    } catch (error) {
      setTestStatus("error");
      const message = error instanceof Error ? error.message : "Unknown error";
      setTestError(message);
      setTestDetails(`API URL: ${apiUrl}`);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const settings: GitHubSettings = {
      repoOwner: repoOwner.trim(),
      repoName: repoName.trim(),
      branch: branch.trim() || "main",
      configPath: configPath.trim() || "models.yaml",
      token: token.trim(),
    };

    saveSettings(settings);
    invalidateCache();
    onSave(settings);
  };

  const handleRetry = () => {
    const settings: GitHubSettings = {
      repoOwner: repoOwner.trim(),
      repoName: repoName.trim(),
      branch: branch.trim() || "main",
      configPath: configPath.trim() || "models.yaml",
      token: token.trim(),
    };

    saveSettings(settings);
    invalidateCache();
    onSave(settings);
  };

  const handleDisconnect = () => {
    clearSettings();
    onSave(null);
    setRepoOwner("");
    setRepoName("");
    setBranch("main");
    setConfigPath("models.yaml");
    setToken("");
    setTestStatus("idle");
    setTestError(null);
    setTestDetails(null);
  };

  const hasSettings = getSettings() !== null;
  const canTest = repoOwner.trim() && repoName.trim() && token.trim();

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ mb: 4 }}
      >
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
          Settings
        </Typography>
      </Stack>

      {/* Settings Card */}
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Card Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                GitHub Connection
              </Typography>
              <Chip
                label={statusConfig[connectionStatus].label}
                color={statusConfig[connectionStatus].color}
                size="small"
              />
            </Stack>

            {/* Connection Error */}
            {connectionError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>Connection Error:</strong> {connectionError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {/* Repository Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
                    Repository
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Owner"
                        value={repoOwner}
                        onChange={(e) => setRepoOwner(e.target.value)}
                        required
                        placeholder="e.g., my-org"
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Repository"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        required
                        placeholder="e.g., ml-models"
                        fullWidth
                        size="small"
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Config File Path"
                        value={configPath}
                        onChange={(e) => setConfigPath(e.target.value)}
                        placeholder="models.yaml"
                        fullWidth
                        size="small"
                      />
                    </Stack>
                    {repoOwner.trim() && repoName.trim() && (
                      <Button
                        href={`https://github.com/${repoOwner.trim()}/${repoName.trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        endIcon={<OpenInNew />}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        View on GitHub
                      </Button>
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Authentication Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
                    Authentication
                  </Typography>
                  <Stack spacing={1}>
                    <TextField
                      label="Personal Access Token"
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      placeholder="ghp_xxxxxxxxxxxx"
                      fullWidth
                      size="small"
                    />
                    {token.length >= 8 && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Token ending in: <code>...{token.slice(-8)}</code>
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Create a token with <code>repo</code> scope at{" "}
                      <Link
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub Settings
                      </Link>
                    </Typography>
                  </Stack>
                </Box>

                <Divider />

                {/* Test Connection Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
                    Test Connection
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={handleTestConnection}
                      disabled={!canTest || testStatus === "testing"}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {testStatus === "testing" ? "Testing..." : "Test Connection"}
                    </Button>

                    {testStatus === "success" && (
                      <Alert severity="success">{testDetails}</Alert>
                    )}

                    {testStatus === "error" && (
                      <Alert severity="error">
                        <strong>Failed:</strong> {testError}
                        {testDetails && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {testDetails}
                          </Typography>
                        )}
                      </Alert>
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Form Actions */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={2}
                >
                  {hasSettings ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Box />
                  )}
                  <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                    {hasSettings && connectionStatus === "error" && (
                      <Button variant="outlined" onClick={handleRetry}>
                        Retry Connection
                      </Button>
                    )}
                    <Button type="submit" variant="contained">
                      {hasSettings ? "Save & Reconnect" : "Connect"}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
