import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { Model, User, ConnectionStatus } from "./types";
import { initialModels } from "./data/mockData";
import { getCurrentUser, logout, getConnectionStatus, fetchModels as apiFetchModels, setCachedConnectionInfo } from "./services/api";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login/Login";
import ModelList from "./components/ModelList/ModelList";
import ModelForm from "./components/ModelForm/ModelForm";
import Settings from "./components/Settings/Settings";
import Account from "./components/Account/Account";
import ModelDetail from "./components/ModelDetail/ModelDetail";
import ModelMetrics from "./components/ModelMetrics/ModelMetrics";

interface AppContextProps {
  models: Model[];
  connectionStatus: ConnectionStatus;
  onModelUpdate?: (model: Model) => void;
}

function ModelDetailWrapper({ models, connectionStatus, onModelUpdate }: AppContextProps) {
  const { id } = useParams<{ id: string }>();
  const model = models.find((m) => m.id === id);

  if (!model) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Model not found
        </Typography>
        <Typography color="text.secondary">
          The model with ID "{id}" could not be found.
        </Typography>
      </Paper>
    );
  }

  return (
    <ModelDetail
      model={model}
      isConnected={connectionStatus === "connected"}
      onModelUpdate={onModelUpdate}
    />
  );
}

function ModelMetricsWrapper({ models }: { models: Model[] }) {
  const { id } = useParams<{ id: string }>();
  const model = models.find((m) => m.id === id);

  if (!model) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Model not found
        </Typography>
        <Typography color="text.secondary">
          The model with ID "{id}" could not be found.
        </Typography>
      </Paper>
    );
  }

  return <ModelMetrics model={model} />;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setConnectionError(null);

    try {
      const connStatus = await getConnectionStatus();
      setCachedConnectionInfo(connStatus);
      if (connStatus.status === "connected") {
        setConnectionStatus("connecting");
        const { models: fetchedModels } = await apiFetchModels();
        setModels(fetchedModels);
        setConnectionStatus("connected");
      } else {
        setModels(initialModels);
        setConnectionStatus("disconnected");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch models";
      setConnectionError(message);
      setConnectionStatus("error");
      setModels(initialModels);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadModels();
    }
  }, [user, loadModels]);

  const handleSettingsSave = () => {
    loadModels();
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { models: freshModels } = await apiFetchModels(true);
      setModels(freshModels);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh";
      setConnectionError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingModel(null);
    setIsFormOpen(true);
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  const generateId = () => `model-${Date.now()}`;

  const handleSave = (
    modelData: Omit<Model, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date().toISOString();

    if (editingModel) {
      setModels((prev) =>
        prev.map((m) =>
          m.id === editingModel.id ? { ...m, ...modelData, updatedAt: now } : m
        )
      );
    } else {
      const newModel: Model = {
        ...modelData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setModels((prev) => [newModel, ...prev]);
    }

    setIsFormOpen(false);
    setEditingModel(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingModel(null);
  };

  const handleModelUpdate = (updatedModel: Model) => {
    setModels((prev) =>
      prev.map((m) => (m.id === updatedModel.id ? updatedModel : m))
    );
  };

  if (!authChecked) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderModelsContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography color="text.secondary">Loading models...</Typography>
        </Box>
      );
    }

    return (
      <ModelList
        models={models}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
        isReadOnly={connectionStatus === "connected"}
        isConnected={connectionStatus === "connected"}
        onRefresh={connectionStatus === "connected" ? handleRefresh : undefined}
      />
    );
  };

  return (
    <BrowserRouter>
      <Layout
        user={user}
        connectionStatus={connectionStatus}
        onRefreshClick={handleRefresh}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/models" replace />} />
          <Route path="/models" element={renderModelsContent()} />
          <Route
            path="/models/:id"
            element={
              <ModelDetailWrapper
                models={models}
                connectionStatus={connectionStatus}
                onModelUpdate={handleModelUpdate}
              />
            }
          />
          <Route
            path="/models/:id/metrics"
            element={<ModelMetricsWrapper models={models} />}
          />
          <Route
            path="/settings"
            element={
              <Settings
                onSave={handleSettingsSave}
                connectionStatus={connectionStatus}
                connectionError={connectionError}
              />
            }
          />
          <Route
            path="/account"
            element={<Account user={user} onLogout={handleLogout} />}
          />
        </Routes>
        {isFormOpen && (
          <ModelForm
            model={editingModel}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Layout>
    </BrowserRouter>
  );
}

export default App;
