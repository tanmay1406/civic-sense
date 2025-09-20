import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
  Stack,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ReportProblem,
  List as ListIcon,
  Notifications,
  AccountCircle,
  Logout,
  Help,
  Home,
  Phone,
  Email,
  LocationOn,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Mock notifications count
  const [notificationCount] = useState(3);
  const [notifications] = useState([
    {
      id: 1,
      title: "Issue Status Updated",
      message: "Your pothole report has been assigned to PWD",
      time: "5 min ago",
      type: "update",
    },
    {
      id: 2,
      title: "Issue Resolved",
      message: "Streetlight repair has been completed",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 3,
      title: "New Response",
      message: "Department has responded to your waste management issue",
      time: "1 day ago",
      type: "info",
    },
  ]);

  const navigationItems = [
    {
      label: "Home",
      path: "/",
      icon: <Home />,
      description: "Go to home page",
    },
    {
      label: "Report Issue",
      path: "/report",
      icon: <ReportProblem />,
      description: "Report a new civic issue",
    },
    {
      label: "My Issues",
      path: "/my-issues",
      icon: <ListIcon />,
      description: "View your reported issues",
    },
  ];

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = () => {
    logout?.();
    handleProfileMenuClose();
    navigate("/login");
  };

  const getActiveRoute = () => {
    return navigationItems.find((item) => item.path === location.pathname);
  };

  const activeRoute = getActiveRoute();

  const renderDesktopNavigation = () => (
    <>
      {navigationItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          color="inherit"
          sx={{
            mx: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: location.pathname === item.path ? 600 : 400,
            backgroundColor:
              location.pathname === item.path
                ? "rgba(25, 118, 210, 0.1)"
                : "transparent",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.05)",
            },
          }}
          startIcon={item.icon}
        >
          {item.label}
        </Button>
      ))}
    </>
  );

  const renderMobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: 280,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", mr: 2 }}>
            <Home />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Civic Issues
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Municipal Services
            </Typography>
          </Box>
        </Box>

        {isAuthenticated && user && (
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.3)", mr: 2 }}>
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user.name || "User"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <List sx={{ px: 2 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 1,
              backgroundColor:
                location.pathname === item.path
                  ? "rgba(255, 255, 255, 0.15)"
                  : "transparent",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              secondary={item.description}
              secondaryTypographyProps={{
                sx: { color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem" },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", mb: 2 }} />
        <Stack spacing={1}>
          <Button
            fullWidth
            startIcon={<Phone />}
            sx={{
              color: "white",
              justifyContent: "flex-start",
              textTransform: "none",
            }}
            href="tel:+916512234567"
          >
            Emergency: +91-651-223-4567
          </Button>
          <Button
            fullWidth
            startIcon={<Email />}
            sx={{
              color: "white",
              justifyContent: "flex-start",
              textTransform: "none",
            }}
            href="mailto:support@civicissues.gov"
          >
            support@civicissues.gov
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );

  const renderNotificationsMenu = () => (
    <Menu
      anchorEl={notificationsAnchor}
      open={Boolean(notificationsAnchor)}
      onClose={handleNotificationsClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          width: 360,
          maxHeight: 480,
          mt: 1,
          borderRadius: 2,
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You have {notificationCount} unread notifications
        </Typography>
      </Box>
      <Divider />
      <List sx={{ py: 0, maxHeight: 320, overflow: "auto" }}>
        {notifications.map((notification) => (
          <ListItem key={notification.id} sx={{ py: 1.5 }}>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {notification.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={notification.type}
                    color={
                      notification.type === "success"
                        ? "success"
                        : notification.type === "update"
                          ? "primary"
                          : "default"
                    }
                    sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" size="small">
          View All Notifications
        </Button>
      </Box>
    </Menu>
  );

  const renderProfileMenu = () => (
    <Menu
      anchorEl={profileMenuAnchor}
      open={Boolean(profileMenuAnchor)}
      onClose={handleProfileMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          width: 250,
          mt: 1,
          borderRadius: 2,
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      {isAuthenticated && user && (
        <>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user.name || "User"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label="Citizen"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Divider />
        </>
      )}

      <MenuItem
        onClick={() => {
          handleProfileMenuClose();
          navigate("/profile");
        }}
      >
        <ListItemIcon>
          <AccountCircle />
        </ListItemIcon>
        <ListItemText>Profile Settings</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          handleProfileMenuClose();
          navigate("/help");
        }}
      >
        <ListItemIcon>
          <Help />
        </ListItemIcon>
        <ListItemText>Help & Support</ListItemText>
      </MenuItem>

      <Divider />

      {isAuthenticated ? (
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <Logout />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      ) : (
        <MenuItem
          onClick={() => {
            handleProfileMenuClose();
            navigate("/login");
          }}
        >
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText>Login</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and Title */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: 2,
                width: 40,
                height: 40,
              }}
            >
              <LocationOn />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  fontWeight: 700,
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                }}
              >
                Civic Issues
              </Typography>
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  Municipal Services Portal
                </Typography>
              )}
            </Box>
          </Box>

          {/* Current Page Indicator (Mobile) */}
          {isMobile && activeRoute && (
            <Box sx={{ mx: 2 }}>
              <Chip
                icon={activeRoute.icon}
                label={activeRoute.label}
                size="small"
                variant="outlined"
                sx={{ bgcolor: "rgba(25, 118, 210, 0.1)" }}
              />
            </Box>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              {renderDesktopNavigation()}
            </Box>
          )}

          {/* Right Side Icons */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Notifications */}
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={notificationCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* Profile */}
            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              {isAuthenticated && user ? (
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Box>
        </Toolbar>

        {/* Page breadcrumb for desktop */}
        {!isMobile && activeRoute && (
          <Box
            sx={{
              px: 3,
              py: 1,
              bgcolor: "rgba(25, 118, 210, 0.05)",
              borderTop: "1px solid rgba(25, 118, 210, 0.1)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {activeRoute.description}
            </Typography>
          </Box>
        )}
      </AppBar>

      {/* Mobile Drawer */}
      {renderMobileDrawer()}

      {/* Menus */}
      {renderNotificationsMenu()}
      {renderProfileMenu()}
    </>
  );
};

export default Header;
