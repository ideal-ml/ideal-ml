import { Avatar, Box, Typography } from "@mui/material";
import { User } from "../../types";

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar
        sx={{
          width: 48,
          height: 48,
          bgcolor: "primary.main",
          fontSize: "1rem",
          fontWeight: 500,
        }}
      >
        {initials}
      </Avatar>
      <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: "white", fontSize: "1.5rem" }}
        >
          {user.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: "1rem" }}
        >
          {user.role}
        </Typography>
      </Box>
    </Box>
  );
}
