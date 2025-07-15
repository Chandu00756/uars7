import React, { useState, useContext } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLoginOptions,
  finishLogin,
} from "../services/authService";
import { AuthContext } from "../contexts/AuthContext";

/* ──────────────── Utils ────────────────────── */
const toBase64Url = (str: string) =>
  str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

/* ──────────────── Styled components ────────── */
const GradientBackground = styled(Box)({
  minHeight: "100vh",
  minWidth: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(120deg,#1B263B 0%,#415A77 60%,#232946 100%)",
  overflow: "hidden",
  position: "fixed",
  inset: 0,
});

const LoginCard = styled(Paper)(({ theme }) => ({
  padding: "56px 56px 44px 56px",
  borderRadius: 24,
  boxShadow: "0 8px 48px 0 rgba(27,38,59,0.22)",
  background: "rgba(28,34,51,0.96)",
  color: "#fff",
  width: "100%",
  maxWidth: 540,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "97vw",
    padding: "32px 8vw 30px 8vw",
  },
}));

/* ──────────────── Component ────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");

  const handleLogin = async () => {
    console.log("[Login] Attempting login for username:", username);
    setError(null);
    setLoading(true);
    try {
      // 1. fetch request options (send username)
      const { data } = await getLoginOptions({ username });
      console.log("[Login] getLoginOptions response:", data);
      const opts: any = data.publicKey ?? data;

      if (!opts?.challenge) {
        throw new Error("Server did not return valid options.");
      }

      // 2. convert to base64url
      opts.challenge = toBase64Url(opts.challenge);
      if (Array.isArray(opts.allowCredentials)) {
        opts.allowCredentials = opts.allowCredentials.map((c: any) => ({
          ...c,
          id: toBase64Url(c.id),
        }));
      }

      // 3. browser ceremony
      const assertion = await startAuthentication(opts);
      console.log("[Login] startAuthentication assertion:", assertion);

      // 4. send to backend (include username like registration)
      const resp = await finishLogin({ username, assertion });
      console.log("[Login] finishLogin response:", resp);

      // 5. Check if login was successful (backend uses session-based auth)
      if (resp.status === 200 && resp.data === "success") {
        // Backend uses session cookies, no need to store tokens
        console.log("✅ Login successful, updating auth state and redirecting");
        login(); // Update auth context
        navigate("/dashboard");
      } else {
        throw new Error("Backend rejected the assertion.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ──────────────── Render ──────────────────── */
  return (
    <GradientBackground>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 64, scale: 0.98 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
          }}
          exit={{
            opacity: 0,
            y: 32,
            scale: 0.97,
            transition: { duration: 0.4 },
          }}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <LoginCard elevation={12}>
            {/* Logo */}
            <Box sx={{ mb: 4 }}>
              <motion.img
                src="/portalvii-logo.svg"
                alt="PortalVII"
                style={{
                  height: 54,
                  marginBottom: 12,
                  filter: "drop-shadow(0 2px 8px #FF7F50cc)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.7, delay: 0.15 },
                }}
                draggable={false}
              />
            </Box>

            <Typography
              variant="h4"
              fontWeight={800}
              letterSpacing={1}
              sx={{
                mb: 2,
                background: "linear-gradient(90deg,#36D1DC 0%,#FF7F50 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: 28, md: 36 },
              }}
            >
              Login to PortalVII
            </Typography>

            <Typography
              variant="subtitle1"
              color="#F8F9FA"
              sx={{
                mb: 4,
                opacity: 0.85,
                fontWeight: 500,
                fontSize: 20,
                textAlign: "center",
              }}
            >
              Passwordless authentication with your registered device.
            </Typography>

            <Box sx={{ mb: 2, width: '100%' }}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #415A77',
                  fontSize: 18,
                  marginBottom: 8,
                  background: '#232946',
                  color: '#fff',
                }}
                autoFocus
              />
            </Box>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error-message"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
                >
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={false}
              animate={{
                scale: loading ? 0.98 : 1,
                filter: loading ? "brightness(0.85)" : "none",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 3,
                  px: 5,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: "0 2px 16px 0 rgba(255,127,80,0.18)",
                  background:
                    "linear-gradient(90deg,#FF7F50 0%,#36D1DC 100%)",
                  color: "#fff",
                  mb: 2,
                  transition: "background 0.3s",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg,#36D1DC 0%,#FF7F50 100%)",
                  },
                }}
                onClick={handleLogin}
                disabled={loading}
                aria-label="Login with Security Key"
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ color: "#fff", mr: 2 }} />
                    Logging in…
                  </>
                ) : (
                  "Login with Security Key"
                )}
              </Button>
            </motion.div>

            <Typography
              variant="caption"
              sx={{
                color: "#36D1DC",
                mt: 3,
                opacity: 0.7,
                fontWeight: 500,
                letterSpacing: 1,
                display: "block",
              }}
            >
              FIDO2/WebAuthn passwordless login
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#BFC9DA",
                mt: 5,
                opacity: 0.55,
                fontWeight: 400,
                fontSize: 13,
                letterSpacing: 1,
              }}
            >
              © 2025 PortalVII. All rights reserved.
            </Typography>
          </LoginCard>
        </motion.div>
      </AnimatePresence>
    </GradientBackground>
  );
}
