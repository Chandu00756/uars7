import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import styles from "./Login.module.css";

export default function LoginForm() {
  const { login } = React.useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const navigate   = useNavigate();
  const location   = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    /* Dummy credential check – replace with real API call */
    if (username === "Chandu" && password === "1111") {
      /* 1. Persist flag for PrivateRoute */
      localStorage.setItem("authToken", "session");
      /* 2. Optional role */
      localStorage.setItem("role", "admin");   // remove if not needed
      /* 3. Update context (if you use one) */
      login();
      /* 4. Navigate to the original destination */
      navigate(from, { replace: true });
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <h2 className={styles.title}>Login</h2>

        {/* Username */}
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            autoFocus
            required
          />
        </div>

        {/* Password */}
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button}>Login</button>
      </form>
    </div>
  );
}
