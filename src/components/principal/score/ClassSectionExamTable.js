import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

// const API_BASE_URL = "http://localhost:5000";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

export default function ClassSectionExamTable() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  const selectedExam = exams.find((exam) => exam._id === selectedExamId) || null;

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const sortClasses = (classArray) => {
    const gradeOrder = {
      Nursery: -1,
      LKG: 0,
      UKG: 1,
      KG: 2,
    };

    return classArray.sort((a, b) => {
      if (gradeOrder[a] !== undefined && gradeOrder[b] !== undefined) {
        return gradeOrder[a] - gradeOrder[b];
      }
      if (gradeOrder[a] !== undefined) return -1;
      if (gradeOrder[b] !== undefined) return 1;

      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      return a.localeCompare(b);
    });
  };

  // Function to initialize fees
  const initializeFees = async () => {
    if (!token) {
      setError("Please log in to initialize fees.");
      return;
    }

    try {
      const response = await api.post("/api/fees/initialize");
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message,
      });
      // Refresh classes after initialization
      fetchClasses();
    } catch (error) {
      console.error("Error initializing fees:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to initialize fees");
    }
  };

  const fetchClasses = async () => {
    if (!token) {
      setError("Please log in to view classes.");
      return;
    }

    try {
      const response = await api.get("/api/fees/classes");
      const fetchedClasses = response.data;
      console.log("Fetched classes from Fee (unsorted):", fetchedClasses);
      const sortedClasses = sortClasses(fetchedClasses);
      console.log("Sorted classes:", sortedClasses);
      setClasses(sortedClasses);
      setError("");
    } catch (error) {
      console.error("Error fetching classes:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to fetch classes");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection("");
      setExams([]);
      setSelectedExamId(null);
      setStudents([]);
      return;
    }

    const fetchSections = async () => {
      if (!token) {
        setError("Please log in to view sections.");
        return;
      }

      try {
        const response = await api.get(`/api/classSections/${selectedClass}`);
        console.log("Fetched sections for", selectedClass, ":", response.data.sections);
        setSections(response.data.sections || []);
        setSelectedSection("");
        setExams([]);
        setSelectedExamId(null);
        setStudents([]);
        setError("");
      } catch (error) {
        console.error("Error fetching sections:", error.response?.data || error.message);
        setError(error.response?.data?.message || "Failed to fetch sections");
        setSections([]);
      }
    };
    fetchSections();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSection) return;

    const fetchExams = async () => {
      if (!token) {
        setError("Please log in to view exams.");
        return;
      }

      try {
        const response = await api.get(
          `/api/exams/byClassSection/${selectedClass}/${selectedSection}`
        );
        console.log("Fetched exams:", response.data);
        setExams(response.data);
        setSelectedExamId(null);
        setStudents([]);
        setError("");
      } catch (error) {
        console.error("Error fetching exams:", error.response?.data || error.message);
        setError(error.response?.data?.message || "Failed to fetch exams");
      }
    };
    fetchExams();
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (!selectedExamId || !selectedExam) return;

    const fetchStudents = async () => {
      if (!token) {
        setError("Please log in to view students.");
        return;
      }

      try {
        const studentResponse = await api.get(
          `/api/students/${selectedClass}/${selectedSection}`
        );
        console.log("Fetched students:", studentResponse.data);
        const studentData = studentResponse.data.map((student) => {
          const studentMarks = selectedExam.marks.find((m) =>
            m.studentId.toString() === student._id
          );
          return {
            _id: student._id,
            studentId: student.admissionNo,
            studentName: student.name,
            marks: selectedExam.subjects.map((subject) => {
              const foundMark = studentMarks?.marks?.find((m) => m.subject === subject);
              return foundMark || { subject, marks: "-", grade: "", status: "" };
            }),
          };
        });
        setStudents(studentData);
        setError("");
      } catch (error) {
        console.error("Error fetching students:", error.response?.data || error.message);
        setError(error.response?.data?.message || "Failed to fetch students");
      }
    };
    fetchStudents();
  }, [selectedExamId, selectedExam]);

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const calculateTotal = (marks) =>
    marks.reduce((sum, sub) => sum + (typeof sub.marks === "number" ? sub.marks : 0), 0);
  const calculatePercentage = (total) =>
    ((total / (selectedExam?.subjects.length * selectedExam?.maxMarks)) * 100).toFixed(2);

  const getGrade = (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 68) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 30) return "D";
    return "F";
  };

  return (
    <div className="container my-4">
      <div className="card shadow-sm p-3">
        <h3 className="text-center mb-3 fw-bold text-primary">Class & Section Exam Results</h3>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="mb-3 text-center">
          <button className="btn btn-primary" onClick={initializeFees}>
            Initialize Classes
          </button>
        </div>

        <div className="row mb-3 g-2">
          <div className="col-md-6">
            <label htmlFor="classSelect" className="form-label fw-semibold">
              Select Class
            </label>
            <select
              id="classSelect"
              className="form-select"
              value={selectedClass}
              onChange={handleClassChange}
            >
              <option value="">-- Select Class --</option>
              {classes.map((className, index) => (
                <option key={index} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="sectionSelect" className="form-label fw-semibold">
              Select Section
            </label>
            <select
              id="sectionSelect"
              className="form-select"
              value={selectedSection}
              onChange={handleSectionChange}
              disabled={!selectedClass}
            >
              <option value="">-- Select Section --</option>
              {sections.map((sec, index) => (
                <option key={index} value={sec.sectionName}>
                  {sec.sectionName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSection && (
          <div className="mb-3 text-center">
            <h5 className="fw-semibold text-secondary mb-2">Select an Exam</h5>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <button
                    key={exam._id}
                    className={`btn btn-sm ${
                      selectedExamId === exam._id ? "btn-success" : "btn-outline-primary"
                    }`}
                    onClick={() => setSelectedExamId(exam._id)}
                  >
                    {exam.name}
                  </button>
                ))
              ) : (
                <p className="text-muted">No exams available for this class and section.</p>
              )}
            </div>
          </div>
        )}

        {selectedExam && (
          <div className="card p-3 bg-white shadow-sm">
            <h5 className="fw-semibold text-success text-center mb-3">{selectedExam.name}</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-hover text-center align-middle">
                <thead className="table-success">
                  <tr>
                    <th scope="col" style={{ width: "10%" }}>
                      Student ID
                    </th>
                    <th scope="col" style={{ width: "15%" }}>
                      Name
                    </th>
                    {selectedExam.subjects.map((subject, i) => (
                      <th
                        key={i}
                        scope="col"
                        style={{ width: `${60 / selectedExam.subjects.length}%` }}
                      >
                        {subject}
                      </th>
                    ))}
                    <th scope="col" style={{ width: "10%" }}>
                      Total
                    </th>
                    <th scope="col" style={{ width: "10%" }}>
                      Grade
                    </th>
                    <th scope="col" style={{ width: "10%" }}>
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const totalMarks = calculateTotal(student.marks);
                    const percentage = calculatePercentage(totalMarks);
                    return (
                      <tr key={student._id}>
                        <td>{student.studentId}</td>
                        <td>{student.studentName}</td>
                        {student.marks.map((sub, subjectIndex) => (
                          <td key={subjectIndex}>{sub.marks === "-" ? "-" : sub.marks}</td>
                        ))}
                        <td>{totalMarks}</td>
                        <td>
                          {totalMarks
                            ? getGrade(totalMarks, selectedExam.maxMarks * selectedExam.subjects.length)
                            : "-"}
                        </td>
                        <td>{totalMarks > 0 ? `${percentage}%` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}