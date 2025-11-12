import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./EditBranch.css"; // Import the CSS file

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const EditBranch = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [principals, setPrincipals] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [branchRes, principalRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/branches/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/users?role=principal`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setFormData(branchRes.data);
        setPrincipals(principalRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching data");
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/api/branches/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/branches");
    } catch (err) {
      setError(err.response?.data?.message || "Error updating branch");
    }
  };

  if (!formData) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-branch-container">
      <h2 className="edit-branch-title">Edit Branch</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="edit-branch-form">
        <div className="form-grid-two">
          <div className="form-group">
            <label className="form-label1">Branch Name</label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>
        <div className="form-grid-two">
          <div className="form-group">
            <label className="form-label1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label1">Street</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>
        <div className="form-grid-three">
          <div className="form-group">
            <label className="form-label1">City</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label1">State</label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label1">Zip Code</label>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>
        <div className="form-grid-two">
          <div className="form-group">
            <label className="form-label1">Country</label>
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label1">Principal</label>
            <select
              name="principal"
              value={formData.principal?._id || ""}
              onChange={handleChange}
              className="form-select"
              required
              disabled
            >
              <option value="">Select Principal</option>
              {principals.map((principal) => (
                <option key={principal._id} value={principal._id}>
                  {principal.name} ({principal.email})
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="submit-button">
          Update Branch
        </button>
      </form>
    </div>
  );
};

export default EditBranch;
