import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // Add useNavigate
import "./BranchList.css";
import Swal from "sweetalert2";
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

console.log("kamal", BASE_URL, process.env.NODE_ENV);

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/branches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching branches");
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const handleDelete = async () => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the branch if no users are assigned.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel",
    });

    if (confirmDelete.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${BASE_URL}/api/branches/${branchToDelete}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(branches.filter((branch) => branch._id !== branchToDelete));
        setShowModal(false);
        setBranchToDelete(null);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Branch has been deleted.",
        });
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Error deleting branch";
        setError(errorMessage);
        setShowModal(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    }
  };

  const handleBranchClick = (branchId) => {
    navigate(`/admin/branches/details/${branchId}`);
  };

  if (loading) return <div className="branch-list-loading">Loading...</div>;
  if (error) return <div className="branch-list-error">{error}</div>;

  return (
    <div className="branch-list-container">
      <h2 className="branch-list-title">Branch List</h2>
      <div className="branch-list-table-wrapper">
        <table className="branch-list-table">
          <thead className="branch-list-table-header">
            <tr>
              <th className="branch-list-table-header-cell">Name</th>
              <th className="branch-list-table-header-cell">Location</th>
              <th className="branch-list-table-header-cell">Status</th>
              <th className="branch-list-table-header-cell">Principal</th>
              <th className="branch-list-table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch._id} className="branch-list-table-row">
                <td
                  className="branch-list-table-cell branch-list-branch-name"
                  onClick={() => handleBranchClick(branch._id)}
                  style={{ cursor: "pointer" }}
                >
                  {branch.branchName}
                </td>
                <td className="branch-list-table-cell">{branch.location}</td>
                <td className="branch-list-table-cell">
                  <span
                    className={`branch-list-status-badge ${
                      branch.status === "active"
                        ? "branch-list-status-active"
                        : "branch-list-status-inactive"
                    }`}
                  >
                    {branch.status}
                  </span>
                </td>
                <td className="branch-list-table-cell">
                  {branch.principal?.name || "Not Assigned"}
                </td>
                <td className="branch-list-table-cell branch-list-actions">
                  <Link
                    to={`/branches/edit/${branch._id}`}
                    className="branch-list-edit-link branch-list-edit-button"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setBranchToDelete(branch._id);
                      setShowModal(true);
                    }}
                    className="branch-list-delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="branch-list-modal-overlay">
          <div className="branch-list-modal">
            <h3 className="branch-list-modal-title">Confirm Deletion</h3>
            <p className="branch-list-modal-text">
              Are you sure you want to delete this branch?
            </p>
            <div className="branch-list-modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="branch-list-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="branch-list-modal-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchList;
