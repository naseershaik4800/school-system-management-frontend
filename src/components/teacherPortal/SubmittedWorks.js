import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Table } from 'react-bootstrap';
import "./Submit.css"

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function SubmittedWorks() {
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Retrieve token and user from localStorage
  const token = localStorage.getItem('token');
  const userLocalStorage = localStorage.getItem('user');
  const user = userLocalStorage ? JSON.parse(userLocalStorage) : null;

  // Axios instance with auth header
  const api = axios.create({
    baseURL: `${BASE_URL}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchSubmittedAssignments = async () => {
      if (!user || !token) {
        setError('Please log in to view submitted assignments.');
        setLoading(false);
        return;
      }

      const email = user.email;
      if (!email) {
        setError('User email not found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching submitted assignments for email:', email);
        const response = await api.get(
          `/get/submitted-assignments?email=${encodeURIComponent(email)}`
        );

        console.log('API Response Data:', response.data);

        setSubmittedAssignments(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error(
          '❌ Error fetching submitted assignments:',
          error.response?.data || error.message
        );
        setError(
          error.response?.data?.message ||
          'Failed to load submitted assignments.'
        );
        setLoading(false);
      }
    };

    fetchSubmittedAssignments();
  }, []); // Empty dependency array ensures it runs only on mount

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?'))
      return;

    try {
      await api.delete(`/delete/submitted-assignment/${id}`);
      alert('Submission deleted successfully!');

      // Remove the deleted submission from the UI
      setSubmittedAssignments((prev) =>
        prev.filter((submission) => submission._id !== id)
      );
    } catch (error) {
      console.error(
        '❌ Error deleting submission:',
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || 'Failed to delete submission.');
    }
  };

  return (
    <div className="container mt-4 Ks-di">
      <h3 className="text-center Ks-h">📄 Submitted Assignments</h3>

      {loading ? (
        <p
          style={{
            color: "rgb(107, 7, 131)",
            fontWeight: "500",
            fontSize: "1.1rem",
            textAlign: "center",
          }}
        >
          Loading...
        </p>
      ) : error ? (
        <div className="alert alert-danger Ks-al">{error}</div>
      ) : submittedAssignments.length === 0 ? (
        <div className="alert alert-info Ks-alin">
          No assignments have been submitted yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped table-bordered table-hover Ks-tble">
            <thead className="Ks-hd">
              <tr>
                <th className="Ks-thd">Student Name</th>
                <th className="Ks-thd">Email</th>
                <th className="Ks-thd">Class</th>
                <th className="Ks-thd">Section</th>
                <th className="Ks-thd">Submitted File</th>
                <th className="Ks-thd">Submitted At</th>
                <th className="Ks-thd">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submittedAssignments.map((submission, index) => (
                <tr
                  key={index}
                  style={{
                    transition: "background 0.3s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(239, 223, 255, 0.4)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td>{submission.name}</td>
                  <td>{submission.email}</td>
                  <td className="Ks-td">{submission.className}</td>
                  <td className="Ks-td">{submission.section}</td>
                  <td style={{ padding: "10px" }}>
                    <a
                      href={`${BASE_URL}/${submission.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm Ks-sty"
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = "rgb(221, 237, 255)";
                        e.target.style.color = "rgb(107, 7, 131)";
                        e.target.style.borderColor = "rgb(107, 7, 131)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = "rgb(255, 193, 7)";
                        e.target.style.color = "black";
                        e.target.style.borderColor = "rgb(255, 193, 7)";
                      }}
                    >
                      📥 Download
                    </a>
                  </td>
                  <td className="Ks-td">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteSubmission(submission._id)}
                      className="btn-danger"
                    >
                      🗑 Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SubmittedWorks;
