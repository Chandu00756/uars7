import React, { useState, useEffect } from "react";
import "./index.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from "@mui/material";

import Login            from "./pages/Login";
import Register         from "./pages/Register";
import Dashboard        from "./pages/Dashboard";
import DeviceEnrollment from "./pages/DeviceEnrollment";
import IntentTokens     from "./pages/IntentTokens";
import CapsuleAccess    from "./pages/CapsuleAccess";
import SecurityEvents   from "./pages/SecurityEvents";
import AdminPanel       from "./pages/AdminPanel";

import PrivateRoute from "./components/PrivateRoute";
import Footer       from "./components/Footer";
import theme        from "./theme";
import { AuthContext } from "./contexts/AuthContext";
import { checkSession, logout as authLogout } from "./services/authService";

function AppShell() {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    isLoading: boolean;
    hasChecked: boolean;
  }>({
    isAuthenticated: false,
    isLoading: true,
    hasChecked: false
  });

  const location = useLocation();
  const hideSidebarRoutes = ["/login", "/register"];
  const isDashboardRoute = location.pathname === "/dashboard";

  const login = () => {
    console.log("🔐 Login function called");
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      hasChecked: true
    });
  };
  
  const logout = async () => {
    console.log("🚪 Logout function called");
    try {
      await authLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      hasChecked: true
    });
  };

  // Authentication initialization
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      console.log("🚀 Starting authentication check...");
      
      try {
        // Check session with backend (uses cookies)
        console.log("🔄 Verifying session with backend...");
        const isValid = await checkSession();

        if (isMounted) {
          console.log(isValid ? "✅ Authentication successful" : "❌ Not authenticated");
          setAuthState({
            isAuthenticated: isValid,
            isLoading: false,
            hasChecked: true
          });
        }
      } catch (error) {
        console.error("💥 Auth check error:", error);
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            hasChecked: true
          });
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debug current state
  useEffect(() => {
    console.log("🔄 Auth state:", authState, "Path:", location.pathname);
  }, [authState, location.pathname]);

  // Show loading while checking authentication
  if (authState.isLoading || !authState.hasChecked) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={44} />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: authState.isAuthenticated, 
      login, 
      logout 
    }}>
      <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Box sx={{ 
            flex: 1, 
            p: isDashboardRoute ? 0 : (hideSidebarRoutes.includes(location.pathname) ? 0 : { xs: 2, md: 4 })
          }}>
            <Routes>
              <Route path="/" element={
                <Navigate to={authState.isAuthenticated ? "/dashboard" : "/login"} replace />
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/devices"
                element={
                  <PrivateRoute>
                    <DeviceEnrollment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/intents"
                element={
                  <PrivateRoute>
                    <IntentTokens />
                  </PrivateRoute>
                }
              />
              <Route
                path="/capsules"
                element={
                  <PrivateRoute>
                    <CapsuleAccess />
                  </PrivateRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <PrivateRoute>
                    <SecurityEvents />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute admin>
                    <AdminPanel />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          {!hideSidebarRoutes.includes(location.pathname) && !isDashboardRoute && <Footer />}
        </Box>
      </Box>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  );
}
