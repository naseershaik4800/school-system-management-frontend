import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./AddBranch.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

// Validation schema using Yup
const schema = yup.object({
  branchName: yup
    .string()
    .required("Branch name is required")
    .min(2, "Branch name must be at least 2 characters")
    .max(50, "Branch name cannot exceed 50 characters")
    .matches(/^[a-zA-Z0-9\s]+$/, "Branch name can only contain letters, numbers, and spaces")
    .matches(/[a-zA-Z]/, "Branch name must contain at least one letter"),
  
  location: yup
    .string()
    .required("Location is required")
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location cannot exceed 100 characters")
    .matches(/^[a-zA-Z0-9\s]+$/, "Location can only contain letters, numbers, and spaces")
    .matches(/[a-zA-Z]/, "Location must contain at least one letter"),
  
  address: yup.object({
    street: yup
      .string()
      .required("Street is required")
      .min(5, "Street must be at least 5 characters")
      .max(100, "Street cannot exceed 100 characters")
      .matches(/^[a-zA-Z0-9\s]+$/, "Street can only contain letters, numbers, and spaces")
      .matches(/[a-zA-Z]/, "Street must contain at least one letter"),
    
    city: yup
      .string()
      .required("City is required")
      .min(2, "City must be at least 2 characters")
      .max(50, "City cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/, "City can only contain letters and spaces")
      .matches(/[a-zA-Z]/, "City must contain at least one letter"),
    
    state: yup
      .string()
      .required("State is required")
      .min(2, "State must be at least 2 characters")
      .max(50, "State cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/, "State can only contain letters and spaces")
      .matches(/[a-zA-Z]/, "State must contain at least one letter"),
    
    zipCode: yup
      .string()
      .required("Zip code is required")
      .matches(/^\d{5}(-\d{4})?$/, "Invalid zip code format (e.g., 12345 or 12345-6789)"),
    
    country: yup
      .string()
      .required("Country is required")
      .min(2, "Country must be at least 2 characters")
      .max(50, "Country cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/, "Country can only contain letters and spaces")
      .matches(/[a-zA-Z]/, "Country must contain at least one letter"),
  }),
  status: yup
    .string()
    .required("Status is required")
    .oneOf(["active", "inactive"], "Status must be either active or inactive"),
}).required();

const AddBranch = () => {
  const [principals, setPrincipals] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      branchName: "",
      location: "",
      status: "active",
      address: { street: "", city: "", state: "", zipCode: "", country: "" },
    },
  });

  const status = watch("status");

  useEffect(() => {
    const fetchPrincipals = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/users?role=principal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPrincipals(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching principals");
      }
    };
    fetchPrincipals();
  }, []);

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/api/branches`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/branches");
    } catch (err) {
      setError(err.response?.data?.message || "Error creating branch");
    }
  };

  const handleStatusChange = (newStatus) => {
    setValue("status", newStatus);
    trigger("status");
  };
  return (
    <div className="add-branch-wrapper">
      <div className="add-branch-container">
        <h2 className="add-branch-title">Add New Branch</h2>
        {error && <div className="add-branch-error">{error}</div>}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="add-branch-form-content mt-5"
        >
          <div className="add-branch-form-row">
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">Branch Name</label>
              <input
                {...register("branchName")}
                className="add-branch-input"
                onChange={(e) => {
                  register("branchName").onChange(e);
                  trigger("branchName");
                }}
              />
              {touchedFields.branchName && errors.branchName && (
                <span className="add-branch-error-text">
                  {errors.branchName.message}
                </span>
              )}
            </div>
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">Location</label>
              <input
                {...register("location")}
                className="add-branch-input"
                onChange={(e) => {
                  register("location").onChange(e);
                  trigger("location");
                }}
              />
              {touchedFields.location && errors.location && (
                <span className="add-branch-error-text">
                  {errors.location.message}
                </span>
              )}
            </div>
          </div>
          <div className="add-branch-form-row">
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">Street</label>
              <input
                {...register("address.street")}
                className="add-branch-input"
                onChange={(e) => {
                  register("address.street").onChange(e);
                  trigger("address.street");
                }}
              />
              {touchedFields.address?.street && errors.address?.street && (
                <span className="add-branch-error-text">
                  {errors.address.street.message}
                </span>
              )}
            </div>
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">City</label>
              <input
                {...register("address.city")}
                className="add-branch-input"
                onChange={(e) => {
                  register("address.city").onChange(e);
                  trigger("address.city");
                }}
              />
              {touchedFields.address?.city && errors.address?.city && (
                <span className="add-branch-error-text">
                  {errors.address.city.message}
                </span>
              )}
            </div>
          </div>
          <div className="add-branch-form-row">
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">State</label>
              <input
                {...register("address.state")}
                className="add-branch-input"
                onChange={(e) => {
                  register("address.state").onChange(e);
                  trigger("address.state");
                }}
              />
              {touchedFields.address?.state && errors.address?.state && (
                <span className="add-branch-error-text">
                  {errors.address.state.message}
                </span>
              )}
            </div>
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">Zip Code</label>
              <input
                {...register("address.zipCode")}
                className="add-branch-input"
                onChange={(e) => {
                  register("address.zipCode").onChange(e);
                  trigger("address.zipCode");
                }}
              />
              {touchedFields.address?.zipCode && errors.address?.zipCode && (
                <span className="add-branch-error-text">
                  {errors.address.zipCode.message}
                </span>
              )}
            </div>
          </div>
          <div className="add-branch-form-row">
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">Country</label>
              <input
                {...register("address.country")}
                className="add-branch-input"
                onChange={(e) => {
                  register("address.country").onChange(e);
                  trigger("address.country");
                }}
              />
              {touchedFields.address?.country && errors.address?.country && (
                <span className="add-branch-error-text">
                  {errors.address.country.message}
                </span>
              )}
            </div>
            <div className="add-branch-form-group">
              <label className="add-branch-label text-white">Status</label>
              <div className="add-branch-status-buttons">
                <button
                  type="button"
                  className={`add-branch-status-btn ${
                    status === "active" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("active")}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`add-branch-status-btn ${
                    status === "inactive" ? "active" : ""
                  }`}
                  onClick={() => handleStatusChange("inactive")}
                >
                  Inactive
                </button>
              </div>
              {touchedFields.status && errors.status && (
                <span className="add-branch-error-text">
                  {errors.status.message}
                </span>
              )}
            </div>
          </div>
          <button type="submit" className="add-branch-submit-btn">
            Create Branch
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBranch;