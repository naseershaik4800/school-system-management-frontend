import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Custom CSS for table styling
const tableStyles = `
  .custom-table {
    border-collapse: collapse;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  .custom-table th, .custom-table td {
    border: 1px solid #dee2e6;
    padding: 12px;
    vertical-align: middle;
  }
  .custom-table th {
    background-color: #e9f7ef;
    font-weight: 600;
  }
  .custom-table tbody tr:nth-child(even) {
    background-color: #f8f9fa;
  }
  .custom-table tbody tr:hover {
    background-color: #f1f3f5;
  }
`;

// Setup Axios Interceptors for Authorization
const setupAxiosInterceptors = (navigate) => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        throw new Error("No authentication token found");
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("Access denied: Insufficient permissions");
      }
      return Promise.reject(error);
    }
  );
};

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;


export default function StudentExamScores() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const studentId =
    user.role === "parent"
      ? localStorage.getItem("selectedChild")
      : user.role === "student"
      ? user.roleId
      : null;

  const selectedExam =
    studentData?.scores?.find((exam) => exam.examId === selectedExamId) || null;

  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchStudentScores = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to continue");
          navigate("/login");
          return;
        }

        console.log("Fetching scores for studentId:", studentId);
        const response = await axios.get(
          `${BASE_URL}/api/student/${studentId}/scores`
        );
        console.log("Fetched student data:", response.data);
        setStudentData(response.data);
        if (response.data.scores?.length > 0) {
          setSelectedExamId(response.data.scores[0].examId);
        }
      } catch (error) {
        console.error(
          "Error fetching student scores:",
          error.response?.data || error.message
        );
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            `Failed to fetch scores for student ID: ${studentId}`,
        });
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchStudentScores();
  }, [studentId, navigate]);

  const calculateTotal = (marks) =>
    marks?.reduce(
      (sum, sub) => sum + (typeof sub.marks === "number" ? sub.marks : 0),
      0
    ) || 0;

  const calculatePercentage = (total) =>
    selectedExam?.subjects?.length && selectedExam?.maxMarks
      ? (
          (total / (selectedExam.subjects.length * selectedExam.maxMarks)) *
          100
        ).toFixed(2)
      : "0.00";

  const calculateGrade = (marks, maxMarks) => {
    if (!marks || !maxMarks) return "-";
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 68) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 30) return "D";
    return "F";
  };

  const calculateTotalGrade = (percentage) => {
    if (!percentage || isNaN(percentage)) return "-";
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 68) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 30) return "D";
    return "F";
  };

  if (loading) {
    return (
      <div className="container my-4 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading exam scores...</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="container my-4 text-center">
        <div className="alert alert-warning">
          No student ID provided. Please select a student or log in as a student.
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <style>{tableStyles}</style>
      <div className="card shadow-sm p-3">
        <h3 className="text-center mb-4 fw-bold text-primary">
          Student Scorecard
        </h3>

        {studentData?.student && (
          <div className="mb-4">
            <table
              className="table custom-table"
              style={{ maxWidth: "600px", margin: "0 auto" }}
            >
              <tbody>
                <tr>
                  <th scope="row" style={{ width: "25%" }}>Student ID</th>
                  <td style={{ width: "25%" }}>{studentData.student.admissionNo}</td>
                  <th scope="row" style={{ width: "25%" }}>Name</th>
                  <td style={{ width: "25%" }}>{studentData.student.name}</td>
                </tr>
                <tr>
                  <th scope="row" style={{ width: "25%" }}>Class</th>
                  <td style={{ width: "25%" }}>{studentData.student.className}</td>
                  <th scope="row" style={{ width: "25%" }}>Section</th>
                  <td style={{ width: "25%" }}>{studentData.student.section}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {studentData?.scores?.length > 0 && (
          <div className="mb-4 text-center">
            <h5 className="fw-semibold text-secondary mb-2">Select an Exam</h5>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {studentData.scores.map((exam) => (
                <button
                  key={exam.examId}
                  className={`btn btn-sm ${
                    selectedExamId === exam.examId
                      ? "btn-success"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setSelectedExamId(exam.examId)}
                >
                  {exam.examName}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedExam && selectedExam.subjects && selectedExam.marks ? (
          <div className="card p-3 bg-white shadow-sm">
            <h5 className="fw-semibold text-success text-center mb-4">
              {selectedExam.examName}
            </h5>
            
            {/* Marks Table (Vertical) */}
            <div className="table-responsive mb-4">
              <table
                className="table custom-table"
                style={{ maxWidth: "450px", margin: "0 auto" }}
              >
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "40%" }}>Subject</th>
                    <th scope="col" style={{ width: "30%" }}>Marks</th>
                    <th scope="col" style={{ width: "30%" }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExam.subjects.map((subject, i) => (
                    <tr key={i}>
                      <th scope="row">{subject}</th>
                      <td>
                        {selectedExam.marks[i]?.marks === undefined || selectedExam.marks[i].marks === 0
                          ? "-"
                          : `${selectedExam.marks[i].marks} / ${selectedExam.maxMarks}`}
                      </td>
                      <td>
                        {selectedExam.marks[i]?.marks === undefined || selectedExam.marks[i].marks === 0
                          ? "-"
                          : calculateGrade(selectedExam.marks[i].marks, selectedExam.maxMarks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Table (Horizontal) */}
            <div className="table-responsive">
              <table
                className="table custom-table"
                style={{ maxWidth: "650px", margin: "0 auto" }}
              >
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "25%" }}>Student ID</th>
                    <th scope="col" style={{ width: "25%" }}>Total Marks</th>
                    <th scope="col" style={{ width: "25%" }}>Percentage</th>
                    <th scope="col" style={{ width: "25%" }}>Overall Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{studentData.student.admissionNo}</td>
                    <td>
                      {calculateTotal(selectedExam.marks)} /{" "}
                      {selectedExam.subjects.length * selectedExam.maxMarks}
                    </td>
                    <td>
                      {calculateTotal(selectedExam.marks) > 0
                        ? `${calculatePercentage(calculateTotal(selectedExam.marks))}%`
                        : "-"}
                    </td>
                    <td>
                      {calculateTotal(selectedExam.marks) > 0
                        ? calculateTotalGrade(
                            calculatePercentage(calculateTotal(selectedExam.marks))
                          )
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          selectedExam && (
            <div className="text-center mt-3">
              <p className="text-muted">
                Exam data is incomplete. Please check the server response.
              </p>
            </div>
          )
        )}

        {studentData && studentData.scores?.length === 0 && (
          <div className="text-center mt-3">
            <p className="text-muted">
              No exam scores available for this student.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}