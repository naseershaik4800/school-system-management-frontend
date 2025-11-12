"use client";

import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const styles = `
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear {
    display: none !important;
  }
  input[type="password"] {
    -webkit-appearance: none;
    appearance: none;
  }
`;

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent navigation to login page if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  // Handle browser navigation controls
  useEffect(() => {
    // Disable browser back/forward during login process
    const disableNavigation = (e) => {
      if (loading) {
        e.preventDefault();
        window.history.forward();
      }
    };

    // Clear localStorage on component mount
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("childrenIds");
    localStorage.removeItem("selectedChild");

    // Add event listeners for navigation control
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", disableNavigation);

    return () => {
      window.removeEventListener("popstate", disableNavigation);
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // console.log("Sending login request:", formData);
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/login`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // console.log("Login response:", data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      if (data.user.role === "parent" && data.user.children) {
        localStorage.setItem("childrenIds", JSON.stringify(data.user.children));
      }

      if (setUser) {
        setUser(data.user);
      }

      // Replace history instead of pushing to prevent back navigation
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err.response?.data);
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <style>{styles}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="auth-card">
          <Card.Body>
            <h2 className="text-center mb-4">Login</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="text-dark">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group className="mb-3 position-relative">
                <Form.Label className="text-dark">Password</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="pe-5"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 pe-2"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ textDecoration: "none", padding: 0 }}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </Button>
                </div>
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </div>
  );
}

export default Login;
