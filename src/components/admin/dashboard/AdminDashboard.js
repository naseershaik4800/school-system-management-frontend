import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    branches: 0,
    principals: 0,
    teachers: 0,
    students: 0,
    parents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigate hook
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found in localStorage");
        const res = await axios.get(`${BASE_URL}/api/branches/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const totalStats = res.data.reduce(
          (acc, branch) => ({
            branches: acc.branches + 1,
            principals: acc.principals + branch.counts.principals,
            teachers: acc.teachers + branch.counts.teachers,
            students: acc.students + branch.counts.students,
            parents: acc.parents + branch.counts.parents,
          }),
          { branches: 0, principals: 0, teachers: 0, students: 0, parents: 0 }
        );
        setStats(totalStats);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Error fetching stats");
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Dashboard</h2>
      <div className="admin-buttons" style={{ marginBottom: "50px" }}>
        <button
          className="admin-btn admin-btn-blue"
          onClick={() => navigate("/branches/add")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Add New Branch
        </button>
        <button
          className="admin-btn admin-btn-green"
          onClick={() => navigate("/principals/add")}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Add New Principal
        </button>
      </div>

      {/* All Cards in a Single Row */}
      <div className="admin-grid">
        <div className="admin-card admin-card-blue">
          <i className="fas fa-school admin-icon"></i>
          <h3 className="mt-2">Total Branches</h3>
          <p>{stats.branches}</p>
        </div>

        <div className="admin-card admin-card-green">
          <i className="fas fa-user-tie admin-icon"></i>
          <h3 className="mt-2">Total Principals</h3>
          <p>{stats.principals}</p>
        </div>

        <div className="admin-card admin-card-yellow">
          <i className="fas fa-chalkboard-teacher admin-icon"></i>
          <h3 className="mt-2">Total Teachers</h3>
          <p>{stats.teachers}</p>
        </div>

        <div className="admin-card admin-card-purple">
          <i className="fas fa-user-graduate admin-icon"></i>
          <h3 className="mt-2">Total Students</h3>
          <p>{stats.students}</p>
        </div>

        <div className="admin-card admin-card-pink">
          <i className="fas fa-users admin-icon"></i>
          <h3 className="mt-2">Total Parents</h3>
          <p>{stats.parents}</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="admin-grid">
        <div
          className="admin-card1 admin-card-blue1"
          onClick={() => navigate("/branches")}
        >
          <i className="fas fa-building admin-icon"></i>
          <h3>Manage Branches</h3>
          <p>View/Edit Branches</p>
        </div>

        <div
          className="admin-card1 admin-card-green1"
          onClick={() => navigate("/principals")}
        >
          <i className="fas fa-user-shield admin-icon"></i>
          <h3>Manage Principals</h3>
          <p>View/Edit Principals</p>
        </div>

        <div
          className="admin-card1 admin-card-purple1"
          onClick={() => navigate("/branches/stats")}
        >
          <i className="fas fa-chart-bar admin-icon"></i>
          <h3>View Detailed Stats</h3>
          <p>Analyze Statistics</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
