import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { GitHub } from "@mui/icons-material";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Login() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Ideal ML
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
            Sign in to manage your ML models
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GitHub />}
            href={`${API_BASE}/api/auth/github`}
            sx={{ textTransform: "none", fontSize: "1rem", px: 4, py: 1.5 }}
          >
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
