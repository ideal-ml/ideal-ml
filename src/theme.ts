import { createTheme } from "@mui/material/styles";

// Brand colors mapped from CSS variables
const colors = {
  primary: {
    main: "#6366f1",
    dark: "#4f46e5",
    contrastText: "#ffffff",
  },
  error: {
    main: "#ef4444",
    dark: "#dc2626",
  },
  success: {
    main: "#22c55e",
  },
  warning: {
    main: "#f59e0b",
  },
  info: {
    main: "#3b82f6",
  },
  grey: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
};

const theme = createTheme({
  palette: {
    primary: colors.primary,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    grey: colors.grey,
    background: {
      default: colors.grey[50],
      paper: "#ffffff",
    },
    text: {
      primary: colors.grey[800],
      secondary: colors.grey[500],
    },
    divider: colors.grey[200],
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
      color: colors.grey[500],
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "none",
    "0 1px 3px rgba(0, 0, 0, 0.1)",
    "0 1px 3px rgba(0, 0, 0, 0.1)",
    "0 4px 6px rgba(0, 0, 0, 0.1)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
    "0 10px 25px rgba(0, 0, 0, 0.15)",
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: "0.8125rem",
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: "0.75rem",
        },
        colorSuccess: {
          backgroundColor: "#dcfce7",
          color: "#166534",
        },
        colorWarning: {
          backgroundColor: "#fef3c7",
          color: "#92400e",
        },
        colorError: {
          backgroundColor: "#fef2f2",
          color: "#991b1b",
        },
        colorInfo: {
          backgroundColor: "#dbeafe",
          color: "#1e40af",
        },
        colorDefault: {
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: colors.grey[200],
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
  },
});

export default theme;
