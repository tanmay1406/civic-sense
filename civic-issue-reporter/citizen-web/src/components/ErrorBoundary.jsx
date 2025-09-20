import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  Stack,
} from "@mui/material";
import { ErrorOutline, Refresh, Home } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ mb: 4 }}>
              <ErrorOutline
                sx={{
                  fontSize: 80,
                  color: "error.main",
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 600, mb: 2, color: "error.main" }}
              >
                Oops! Something went wrong
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
              >
                We apologize for the inconvenience. An unexpected error has occurred
                while loading the application. Please try refreshing the page or
                return to the home page.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 4, textAlign: "left" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Error Details:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Alert>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                onClick={this.handleReload}
                startIcon={<Refresh />}
                size="large"
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleGoHome}
                startIcon={<Home />}
                size="large"
              >
                Go to Home
              </Button>
            </Stack>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <Box sx={{ mt: 4, textAlign: "left" }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Development Error Info:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "grey.100",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
