import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./EditPrincipal.css";

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const EditPrincipal = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [principalRes, branchesRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/branches`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setFormData(principalRes.data);
        setBranches(branchesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching data");
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/api/users/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/principals");
    } catch (err) {
      setError(err.response?.data?.message || "Error updating principal");
    }
  };

  if (!formData)
    return <div className="edit-principal-loading">Loading...</div>;
  if (error) return <div className="edit-principal-error">{error}</div>;

  return (
    <div className="edit-principal-container">
      <h2 className="edit-principal-title">Edit Principal</h2>
      {error && <div className="edit-principal-error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="edit-principal-form">
        <div className="edit-principal-form-group">
          <label className="edit-principal-label">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="edit-principal-input"
            required
          />
        </div>
        <div className="edit-principal-form-group">
          <label className="edit-principal-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="edit-principal-input"
            required
          />
        </div>
        <div className="edit-principal-form-group">
          <label className="edit-principal-label">Branch</label>
          <select
            name="branchId"
            value={formData.branchId?._id || ""}
            onChange={handleChange}
            className="edit-principal-select"
            required
            disabled
          >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.branchName}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="edit-principal-submit-btn">
          Update Principal
        </button>
      </form>
    </div>
  );
};

export default EditPrincipal;
