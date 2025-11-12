import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AddPrincipal.css";

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const AddPrincipal = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    branchId: "",
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validation regex
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const nameRegex = /^[A-Za-z\s]+$/; // Only letters and spaces
  const emailRegex = /^[^\s@]+@[^\s@0-9]+\.[^\s@]+$/; // No numbers after @

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/branches/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(res.data);
        setLoading(false);
      } catch (err) {
        setErrors({ general: "Failed to load branches. Please try again." });
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let newErrors = { ...errors };

    if (name === "name") {
      const trimmedValue = value.trim();
      if (!value) {
        newErrors.name = "Name is required";
      } else if (trimmedValue.length === 0) {
        newErrors.name = "Name cannot be just spaces";
      } else if (!nameRegex.test(value)) {
        newErrors.name = "Name must contain only letters";
      } else if (trimmedValue.replace(/\s/g, "").length < 2) {
        newErrors.name = "Name must contain at least 2 letters";
      } else {
        delete newErrors.name;
      }
    }

    if (name === "email") {
      if (!value) {
        newErrors.email = "Email is required";
      } else if (!emailRegex.test(value)) {
        newErrors.email =
          "Please enter a valid email (e.g., abc@xyz.com, no numbers after @)";
      } else {
        delete newErrors.email;
      }
    }

    if (name === "password") {
      if (!value) {
        newErrors.password = "Password is required";
      } else if (!passwordRegex.test(value)) {
        newErrors.password =
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)";
      } else {
        delete newErrors.password;
      }
    }

    if (name === "branchId") {
      if (!value) {
        newErrors.branchId = "Please select a branch";
      } else {
        delete newErrors.branchId;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    const trimmedName = formData.name.trim();

    // Validate name field
    if (!formData.name) {
      newErrors.name = "Name is required";
    } else if (trimmedName.length === 0) {
      newErrors.name = "Name cannot be just spaces";
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = "Name must contain only letters";
    } else if (trimmedName.replace(/\s/g, "").length < 2) {
      newErrors.name = "Name must contain at least 2 letters";
    }

    // Validate other fields
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email =
        "Please enter a valid email (e.g., abc@xyz.com, no numbers after @)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)";
    }

    if (!formData.branchId) {
      newErrors.branchId = "Please select a branch";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/api/principals`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/principals");
    } catch (err) {
      const errorMsg = err.response?.data?.message;
      if (errorMsg === "Email already exists") {
        setErrors({ email: "This email is already in use" });
      } else if (errorMsg === "Branch already has a principal assigned") {
        setErrors({ branchId: "This branch already has a principal assigned" });
      } else {
        setErrors({
          general: "Email and password already in use. Please try again.",
        });
      }
    }
  };

  if (loading) return <div className="loading">Loading branches...</div>;

  return (
    <div className="add-principal-wrapper">
      <div className="add-principal-container">
        <h2 className="add-principal-title mb-4">Add New Principal</h2>
        {errors.general && (
          <div className="add-principal-error">{errors.general}</div>
        )}
        <form onSubmit={handleSubmit} className="add-principal-form">
          <div className="add-principal-grid">
            <div>
              <label className="add-principal-label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="add-principal-input"
                required
              />
              {errors.name && (
                <div
                  className="add-principal-error"
                  style={{ fontSize: "0.8rem" }}
                >
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label className="add-principal-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="add-principal-input"
                required
              />
              {errors.email && (
                <div
                  className="add-principal-error"
                  style={{ fontSize: "0.8rem" }}
                >
                  {errors.email}
                </div>
              )}
            </div>
          </div>
          <div className="add-principal-grid">
            <div>
              <label className="add-principal-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="add-principal-input"
                required
              />
              {errors.password && (
                <div
                  className="add-principal-error"
                  style={{ fontSize: "0.8rem" }}
                >
                  {errors.password}
                </div>
              )}
            </div>
            <div>
              <label className="add-principal-label">Branch</label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="add-principal-input"
                required
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <div
                  className="add-principal-error"
                  style={{ fontSize: "0.8rem" }}
                >
                  {errors.branchId}
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="add-principal-button">
            Create Principal
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPrincipal;
