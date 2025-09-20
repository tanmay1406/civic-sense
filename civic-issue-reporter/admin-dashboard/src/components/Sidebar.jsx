import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240;

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
  },
  {
    text: "Issue Management",
    icon: <AssignmentIcon />,
    path: "/issues",
  },
  {
    text: "Analytics",
    icon: <AnalyticsIcon />,
    path: "/analytics",
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="white">
          Civic Admin
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: "white",
                "&.Mui-selected": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
