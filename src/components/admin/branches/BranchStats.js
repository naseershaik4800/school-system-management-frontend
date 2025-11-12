import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BranchStats.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const BranchStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/branches/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
        setLoading(false);
      } catch (err) {
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
    <div className="branch-stats-container">
      <h2 className="stats-title">Branch Statistics</h2>
      <div className="stats-grid">
        {stats.map((branch) => (
          <div key={branch.branchId} className="branch-card">
            <h3 className="branch-header">
              {branch.branchName}
              <span className={`status-badge ${branch.status.toLowerCase()}`}>
                {branch.status}
              </span>
            </h3>

            <div className="stats-content">
              <div className="stats-row">
                <p>
                  Principals: <span>{branch.counts.principals}</span>
                </p>
                <p>
                  Teachers: <span>{branch.counts.teachers}</span>
                </p>
              </div>
              <div className="stats-row">
                <p>
                  Students: <span>{branch.counts.students}</span>
                </p>
                <p>
                  Parents: <span>{branch.counts.parents}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchStats;
