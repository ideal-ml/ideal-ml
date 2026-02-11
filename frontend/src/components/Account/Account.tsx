import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowBack, Logout } from "@mui/icons-material";
import { User } from "../../types";

interface AccountProps {
  user: User;
  onLogout: () => void;
}

export default function Account({ user, onLogout }: AccountProps) {
  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" sx={{ mb: 4 }}>
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
          Account
        </Typography>
      </Stack>

      {/* Account Card */}
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Profile Header */}
            <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 4 }}>
              <Avatar
                src={user.avatar_url}
                sx={{ width: 80, height: 80 }}
              />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {user.name || user.login}
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  @{user.login}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
                  GitHub Profile
                </Typography>
                <Typography variant="body2">
                  Signed in as <strong>{user.login}</strong> via GitHub OAuth.
                </Typography>
              </Box>

              <Divider />

              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={onLogout}
                sx={{ alignSelf: "flex-start" }}
              >
                Sign out
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
