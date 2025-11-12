import React, { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function StudentAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submittedAssignments, setSubmittedAssignments] = useState({});

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAssignments();
    fetchSubmittedAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !token) {
        setError("User not found or not authenticated. Please log in.");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/get/student-assignments/${encodeURIComponent(user.email)}`,
        config
      );
      setAssignments(response.data);
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedAssignments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !token) {
        setError("User not found or not authenticated. Please log in.");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/get/submitted-assignments/${encodeURIComponent(
          user.email
        )}`,
        config
      );
      const submittedData = response.data;

      const submittedMap = {};
      submittedData.forEach((submission) => {
        submittedMap[submission.assignmentId] = true;
      });
      setSubmittedAssignments(submittedMap);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load submitted assignments.");
    }
  };

  const handleFileChange = (event, assignmentId) => {
    const file = event.target.files[0];
    if (file && file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }
    setSelectedFiles((prevFiles) => ({
      ...prevFiles,
      [assignmentId]: file,
    }));
  };

  const handleSubmit = async (assignment) => {
    const file = selectedFiles[assignment._id];
    if (!file) {
      alert("Please select a PDF file before submitting.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !token) {
      alert("User details not found or not authenticated. Please log in.");
      return;
    }

    const teacherEmail = assignment.teacherEmail || assignment.email;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", user.name);
    formData.append("email", user.email);
    formData.append("assignmentId", assignment._id);
    formData.append("teacherEmail", teacherEmail);

    try {
      await axios.post(`${BASE_URL}/submit-assignment`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Assignment submitted successfully!");
      setSubmittedAssignments((prev) => ({
        ...prev,
        [assignment._id]: true,
      }));
      setSelectedFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[assignment._id];
        return newFiles;
      });
    } catch (error) {
      alert("Failed to submit assignment: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">📚 Student Assignments</h2>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover className="table-sm">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Title</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Teacher Email</th>
                <th>Submit</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td>{assignment.assignment.subject}</td>
                    <td>{assignment.assignment.title}</td>
                    <td>{assignment.assignment.description || "N/A"}</td>
                    <td>{new Date(assignment.assignment.dueDate).toLocaleDateString()}</td>
                    <td>{assignment.email}</td>
                    <td>
                      {!submittedAssignments[assignment._id] ? (
                        <>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleFileChange(e, assignment._id)}
                            disabled={loading}
                            className="w-100"
                          />
                          <Button
                            variant="success"
                            className="mt-2 w-100"
                            onClick={() => handleSubmit(assignment)}
                            disabled={loading || !selectedFiles[assignment._id]}
                          >
                            {loading ? "Submitting..." : "Submit"}
                          </Button>
                        </>
                      ) : (
                        <Button variant="primary" disabled className="w-100">
                          Submitted
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No assignments available.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default StudentAssignment;
