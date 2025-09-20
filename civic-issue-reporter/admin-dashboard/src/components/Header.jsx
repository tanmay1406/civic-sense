import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import { AccountCircle, Notifications } from "@mui/icons-material";

const Header = () => {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        borderBottom: "1px solid #e0e0e0",
        mb: 2,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, color: "text.primary" }}
        >
          Municipal Governance System
        </Typography>
        <Box sx={{ display: "flex" }}>
          <IconButton
            size="large"
            color="inherit"
            sx={{ color: "text.primary" }}
          >
            <Notifications />
          </IconButton>
          <IconButton
            size="large"
            color="inherit"
            sx={{ color: "text.primary" }}
          >
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
