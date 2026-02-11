import { Avatar, Box, Typography } from "@mui/material";
import { User } from "../../types";

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar
        src={user.avatar_url}
        sx={{
          width: 48,
          height: 48,
          fontSize: "1rem",
          fontWeight: 500,
        }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: "white", fontSize: "1.5rem" }}
        >
          {user.name || user.login}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: "1rem" }}
        >
          @{user.login}
        </Typography>
      </Box>
    </Box>
  );
}
