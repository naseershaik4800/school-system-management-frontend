import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ParentDetails from "./ParentDetails";

// const API_URL = "http://localhost:5000/api";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

// Reusable function to get auth config with token
const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const ParentProfileWrapper = ({ role }) => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParentData = async () => {
      if (!roleId || roleId === "undefined") {
        setError("Invalid parent ID");
        setLoading(false);
        return;
      }

      try {
        const config = getAuthConfig();
        const response = await axios.get(
          `${BASE_URL}/api/parents/${roleId}`,
          config
        );
        setParent(response.data);
        console.log("⭐ Parent Data:", response.data); // Debug log
      } catch (err) {
        console.error("Error fetching parent profile:", err);
        if (err.response?.status === 401) {
          // localStorage.removeItem("token");
          toast.error("Session expired. Please log in again.");
          // navigate("/login");
        } else {
          const errorMsg =
            err.response?.data?.message || "Failed to fetch parent profile";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchParentData();
  }, [roleId, navigate]); // Added navigate to dependencies

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading parent profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5 text-danger">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <ParentDetails
      parent={parent}
      onBack={() => navigate(role === "principal" ? "/" : "/")}
      role={role}
    />
  );
};

export default ParentProfileWrapper;