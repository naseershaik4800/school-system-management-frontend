import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Add useNavigate
import axios from "axios";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Phone,
  Home,
  GraduationCap,
  Upload,
  Loader,
  X,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

// const API_URL = "http://localhost:5000/api";

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

// Special config for multipart/form-data with token
const getMultipartAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
};

const EditParentModal = ({ show, parent, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newChild, setNewChild] = useState("");
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // Add navigate hook

  useEffect(() => {
    if (parent) {
      setFormData({
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
        password: parent.password,
      });
      setChildren(parent.children || []);
      setProfilePreview(parent.profileImage || null);
    }
  }, [parent]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);
      if (formData.password.trim() !== "") {
        formDataToSend.append("password", formData.password);
      }
      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      }

      const config = getMultipartAuthConfig();
      await axios.put(
        `${BASE_URL}/api/parents/${parent._id}`,
        formDataToSend,
        config
      );
      toast.success("Parent updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating parent:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error(
          "Failed to update parent: " +
            (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild) return;

    try {
      const config = getAuthConfig();
      const validateResponse = await axios.post(
        `${BASE_URL}/api/validate-children`,
        { children: [newChild] },
        config
      );

      if (validateResponse.data.valid) {
        const response = await axios.put(
          `${BASE_URL}/api/parents/${parent._id}/add-child`,
          { admissionNo: newChild },
          config
        );

        setChildren(response.data.parent.children);
        setNewChild("");
        toast.success("Child added successfully");
        onUpdate();
      } else {
        toast.error("Invalid admission number");
      }
    } catch (error) {
      console.error("Error adding child:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error(
          "Failed to add child: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  const handleRemoveChild = async (admissionNo) => {
    try {
      const config = getAuthConfig();
      const response = await axios.put(
        `${BASE_URL}/api/parents/${parent._id}/remove-child`,
        { admissionNo },
        config
      );

      setChildren(response.data.parent.children);
      toast.success("Child removed successfully");
      onUpdate();
    } catch (error) {
      console.error("Error removing child:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error(
          "Failed to remove child: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Edit Parent</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* Profile Image Upload */}
              <div className="d-flex justify-content-center mb-4">
                <div className="position-relative">
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden border border-4 border-white shadow"
                    style={{ width: "128px", height: "128px" }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile Preview"
                        className="w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <User size={48} className="text-muted" />
                    )}
                  </div>
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary text-white p-2 rounded-circle cursor-pointer shadow"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={16} />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="d-none"
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Key size={18} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"} // Toggle between text and password
                        className="form-control"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="•••••••• (leave blank to keep unchanged)"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Address</label>
                  <div className="input-group">
                    <span className="input-group-text align-items-start pt-2">
                      <Home size={18} />
                    </span>
                    <textarea
                      className="form-control"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows="3"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Children</label>
                  {children.length > 0 && (
                    <div className="mb-3">
                      {children.map((child) => (
                        <div
                          key={child._id}
                          className="d-flex justify-content-between align-items-center p-3 bg-light border rounded mb-2"
                        >
                          <div className="d-flex align-items-center">
                            <GraduationCap
                              size={18}
                              className="text-primary me-2"
                            />
                            <div>
                              <p className="mb-0 fw-semibold">{child.name}</p>
                              <small className="text-muted">
                                {child.admissionNo} - Class {child.class}
                              </small>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(child.admissionNo)}
                            className="btn btn-sm btn-danger"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-group">
                    <span className="input-group-text">
                      <GraduationCap size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter student admission number"
                      value={newChild}
                      onChange={(e) =>
                        setNewChild(e.target.value.toUpperCase())
                      }
                    />
                    <button
                      type="button"
                      onClick={handleAddChild}
                      className="btn btn-primary"
                    >
                      Add Child
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="me-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditParentModal;