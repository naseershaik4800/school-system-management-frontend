import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PrincipalList.css";
import Swal from "sweetalert2";

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const PrincipalList = () => {
  const [principals, setPrincipals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrincipals = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${BASE_URL}/api/branches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const principalData = res.data
          .filter((branch) => branch.principal)
          .map((branch) => ({
            _id: branch.principal._id,
            name: branch.principal.name,
            email: branch.principal.email,
            branchId: branch._id,
            branchName: branch.branchName,
            status: branch.status === "active" ? "active" : "inactive",
          }));
        setPrincipals(principalData);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching principals");
        setLoading(false);
      }
    };
    fetchPrincipals();
  }, []);

  const handleDelete = async (branchId, principalName) => {
    Swal.fire({
      title: `Are you sure you want to remove ${principalName} as principal?`,
      text: "This will unassign them from the branch.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove them!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          console.log("Attempting to delete principal:", branchId);

          await axios.delete(`${BASE_URL}/api/branches/principal/${branchId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPrincipals(principals.filter((p) => p.branchId !== branchId));
          Swal.fire(
            "Deleted!",
            `${principalName} has been removed as principal.`,
            "success"
          );
        } catch (err) {
          Swal.fire(
            "Error!",
            err.response?.data?.message || "Failed to delete principal",
            "error"
          );
        }
      }
    });
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="principal-list-container">
      <h2 className="principal-list-title">Principal List</h2>
      <div className="principal-table-wrapper">
        <table className="principal-table">
          <thead className="principal-table-header">
            <tr>
              <th className="principal-table-cell-name">Name</th>
              <th className="principal-table-cell-email">Email</th>
              <th className="principal-table-cell-branch">Branch</th>
              <th className="principal-table-cell-status">Status</th>
              <th className="principal-table-cell-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {principals.map((principal) => (
              <tr key={principal._id} className="principal-table-row">
                <td className="principal-table-cell principal-table-cell-name">
                  {principal.name}
                </td>
                <td className="principal-table-cell principal-table-cell-email">
                  {principal.email}
                </td>
                <td className="principal-table-cell principal-table-cell-branch">
                  {principal.branchName || "Not Assigned"}
                </td>
                <td className="principal-table-cell principal-table-cell-status">
                  <span
                    className={`principal-status-badge ${
                      principal.status === "active"
                        ? "principal-status-active"
                        : "principal-status-inactive"
                    }`}
                  >
                    {principal.status}
                  </span>
                </td>
                <td className="principal-table-cell principal-table-cell-actions">
                  <button
                    onClick={() =>
                      navigate(`/admin/principals/edit/${principal._id}`)
                    }
                    className="principal-edit-button mb-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(principal.branchId, principal.name)
                    }
                    className="principal-delete-button mb-2"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrincipalList;
