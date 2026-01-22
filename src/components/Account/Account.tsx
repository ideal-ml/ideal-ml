import { useState, useEffect, FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { User } from "../../types";

interface AccountProps {
  user: User;
  onSave: (user: User) => void;
}

const roleOptions = [
  "ML Engineer",
  "Data Scientist",
  "Software Engineer",
  "Engineering Manager",
  "Product Manager",
  "Research Scientist",
  "DevOps Engineer",
  "Other",
];

export default function Account({ user, onSave }: AccountProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    if (roleOptions.includes(user.role)) {
      setRole(user.role);
      setCustomRole("");
    } else {
      setRole("Other");
      setCustomRole(user.role);
    }
  }, [user]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      role: role === "Other" ? customRole.trim() : role,
    };

    onSave(updatedUser);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {name || "Your Name"}
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  {role === "Other" ? customRole : role || "Your Role"}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Profile Information Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
                    Profile Information
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter your full name"
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      placeholder="Enter your role"
                      fullWidth
                      size="small"
                    />
                    {role === "Other" && (
                      <TextField
                        label="Custom Role"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        required
                        placeholder="Enter your role"
                        fullWidth
                        size="small"
                      />
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Form Actions */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Collapse in={isSaved} orientation="horizontal">
                    <Alert severity="success" sx={{ py: 0 }}>
                      Changes saved successfully!
                    </Alert>
                  </Collapse>
                  <Box sx={{ flex: 1 }} />
                  <Button type="submit" variant="contained">
                    Save Changes
                  </Button>
                </Stack>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
