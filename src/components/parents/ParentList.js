import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ParentTable from "./ParentTable.js";
import EditParentModal from "./EditParent.js";
import { Search, PlusCircle } from "lucide-react";

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

const ParentList = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showParentModal, setShowParentModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();
      const parentsRes = await axios.get(`${BASE_URL}/api/parents`, config);
      setParents(parentsRes.data || []);
      console.log("⭐ Parents Data:", parentsRes.data); // Debug log
    } catch (err) {
      console.error("Error fetching parents:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error(
          "Failed to fetch parents: " +
            (err.response?.data?.error || err.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]); // Added navigate to dependencies for consistency

  const handleDelete = async (parentId) => {
    if (!window.confirm("Are you sure you want to delete this parent?")) return;
  
    try {
      const response = await axios.delete(`${BASE_URL}/api/parent/${parentId}`);
      alert(response.data.message); // Show success message
      window.location.reload(); // Refresh the page after deletion
    } catch (error) {
      console.error("❌ Error deleting parent:", error.response?.data || error.message);
      alert(error.response?.data.error || "Failed to delete parent");
    }
  };

  const handleEdit = (parent) => {
    setEditingItem(parent);
    setShowParentModal(true);
  };

  const handleParentSelect = (parent) => {
    navigate(`/parents/${parent._id}`); // Navigate to parent detail page
  };

  const filteredParents = parents.filter((parent) =>
    Object.values(parent).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div
      className="container-fluid p-4"
      style={{ minHeight: "100vh", background: "#f8f9fa" }}
    >
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h1 className="h3 fw-bold text-primary mb-0 animate__animated animate__fadeInDown">
            Parents Management
          </h1>
          <p className="text-muted small animate__animated animate__fadeInDown animate__delay-1s">
            Manage parent records efficiently
          </p>
        </div>
        <div className="col-auto">
          <button
            className="btn btn-success shadow-sm d-flex align-items-center animate__animated animate__fadeInRight"
            onClick={() => navigate("/add-parent")} // Updated to use navigate
          >
            <PlusCircle size={18} className="me-2" />
            Add Parent
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-12 col-md-6 mx-auto">
          <div className="input-group shadow-sm animate__animated animate__fadeInUp">
            <span className="input-group-text bg-white border-0">
              <Search size={20} className="text-primary" />
            </span>
            <input
              type="text"
              className="form-control border-0 py-2"
              placeholder="Search parents by name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ transition: "all 0.3s ease" }}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 10px rgba(0,123,255,0.2)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card shadow-lg border-0 animate__animated animate__zoomIn">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading parents data...</p>
            </div>
          ) : (
            <ParentTable
              parents={filteredParents}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onParentSelect={handleParentSelect}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditParentModal
        show={showParentModal}
        parent={editingItem}
        onClose={() => {
          setShowParentModal(false);
          setEditingItem(null);
        }}
        onUpdate={fetchData}
      />

      {/* Custom CSS for Animations */}
      <style jsx>{`
        .animate__animated {
          animation-duration: 0.8s;
        }
        .animate__fadeInDown {
          animation-name: fadeInDown;
        }
        .animate__fadeInUp {
          animation-name: fadeInUp;
        }
        .animate__zoomIn {
          animation-name: zoomIn;
        }
        .animate__delay-1s {
          animation-delay: 0.2s;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
        }
        .btn-success:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ParentList;