import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Dashboard, Refresh, Settings } from "@mui/icons-material";
import { User, ConnectionStatus } from "../../types";
import UserInfo from "../UserInfo/UserInfo";

interface LayoutProps {
  children: ReactNode;
  user: User;
  connectionStatus: ConnectionStatus;
  onRefreshClick: () => void;
}

const SIDEBAR_WIDTH = 360;

const statusConfig: Record<ConnectionStatus, { label: string; color: string }> = {
  connected: { label: "GitHub Connected", color: "#22c55e" },
  connecting: { label: "Connecting...", color: "#f59e0b" },
  disconnected: { label: "Local Mode", color: "#64748b" },
  error: { label: "Connection Error", color: "#ef4444" },
};

export default function Layout({
  children,
  user,
  connectionStatus,
  onRefreshClick,
}: LayoutProps) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box
        component="aside"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          bgcolor: "#1e293b",
          color: "white",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Ideal ML
          </Typography>
        </Box>

        {/* Connection Indicator */}
        <Box
          sx={{
            mx: 2,
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: statusConfig[connectionStatus].color,
            }}
          />
          <Typography variant="caption" sx={{ flex: 1, color: "grey.400" }}>
            {statusConfig[connectionStatus].label}
          </Typography>
          {connectionStatus === "connected" && (
            <IconButton
              size="small"
              onClick={onRefreshClick}
              title="Refresh from GitHub"
              sx={{ color: "grey.400", "&:hover": { color: "white" } }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Navigation */}
        <Box component="nav" sx={{ flex: 1, px: 1 }}>
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/models"
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  color: "grey.400",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                  "&.active": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "white" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                  <Dashboard fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Models" sx={{ fontSize: "2rem" }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/settings"
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  color: "grey.400",
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                  "&.active": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "white" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Settings" sx={{ fontSize: "2rem" }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* User Info Footer */}
        <Box sx={{ p: 2, mt: "auto" }}>
          <ListItemButton
            component={NavLink}
            to="/account"
            title="Edit account"
            sx={{
              borderRadius: 1,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
              "&.active": { bgcolor: "rgba(255, 255, 255, 0.15)" },
            }}
          >
            <UserInfo user={user} />
          </ListItemButton>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          p: 4,
          bgcolor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
