import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { Provider } from "react-redux";
import theme from "./theme/theme";
import { store } from "./store/store";
import Header from "./components/Header";
import Home from "./components/Home";
import ReportIssue from "./components/ReportIssue";
import MyIssues from "./components/MyIssues";
import Login from "./components/Login";
import Register from "./components/Register";
import { AuthProvider } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthSelection from "./components/AuthSelection";
import TestAuthFlow from "./components/TestAuthFlow";
import ConnectionStatus from "./components/ConnectionStatus";
import RegistrationDebugger from "./components/RegistrationDebugger";
import EmailVerification from "./components/EmailVerification";

import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./components/NotFound";

import Community from "./pages/Community";
import { Suspense } from "react";

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ErrorBoundary>
            <Router>
              <ConnectionStatus />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "100vh",
                  bgcolor: "background.default",
                }}
              >
                <Header />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route
                      path="/report"
                      element={
                        <ProtectedRoute redirectTo="/auth">
                          <ReportIssue />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-issues"
                      element={
                        <ProtectedRoute redirectTo="/auth">
                          <MyIssues />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/community" element={<Suspense fallback={<div>Loading...</div>}><Community /></Suspense>} />
                    <Route path="/auth" element={<AuthSelection />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/test-auth" element={<TestAuthFlow />} />
                    <Route
                      path="/debug-registration"
                      element={<RegistrationDebugger />}
                    />
                    <Route
                      path="/verify-email"
                      element={<EmailVerification />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Box>
              </Box>
            </Router>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
