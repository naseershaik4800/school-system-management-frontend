import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./BranchDetails.css";
const BASE_URL = process.env.NODE_ENV === "production" 
  ? process.env.REACT_APP_API_DEPLOYED_URL 
  : process.env.REACT_APP_API_URL;

const BranchDetails = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [branchDetails, setBranchDetails] = useState({
    students: [],
    teachers: [],
    parents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [studentPage, setStudentPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [parentPage, setParentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const token = localStorage.getItem("token");
        const branchRes = await axios.get(`${BASE_URL}/api/branches/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranch(branchRes.data);
        fetchBranchDetails(branchId);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching branch");
        setLoading(false);
      }
    };

    const fetchBranchDetails = async (id) => {
      try {
        const token = localStorage.getItem("token");
        const [studentsRes, teachersRes, parentsRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/students?branchId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/teachers?branchId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/parents?branchId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setBranchDetails({
          students: studentsRes.data.filter((student) => student.branchId === id),
          teachers: teachersRes.data.filter((teacher) => teacher.branchId === id),
          parents: parentsRes.data.filter((parent) => parent.branchId === id),
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching branch details");
        setLoading(false);
      }
    };

    fetchBranch();
  }, [branchId]);

  // Handler functions
  const handleStudentClick = (studentId) => {
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  const handleParentClick = (parentId) => {
    setSelectedParentId(selectedParentId === parentId ? null : parentId);
  };

  const handleTeacherClick = (teacherId) => {
    setSelectedTeacherId(selectedTeacherId === teacherId ? null : teacherId);
  };

  // Pagination handlers
  const handleNextPage = (type) => {
    switch (type) {
      case 'student':
        if (studentPage < Math.ceil(branchDetails.students.length / itemsPerPage)) {
          setStudentPage(studentPage + 1);
        }
        break;
      case 'teacher':
        if (teacherPage < Math.ceil(branchDetails.teachers.length / itemsPerPage)) {
          setTeacherPage(teacherPage + 1);
        }
        break;
      case 'parent':
        if (parentPage < Math.ceil(branchDetails.parents.length / itemsPerPage)) {
          setParentPage(parentPage + 1);
        }
        break;
      default:
        break;
    }
  };

  const handlePrevPage = (type) => {
    switch (type) {
      case 'student':
        if (studentPage > 1) setStudentPage(studentPage - 1);
        break;
      case 'teacher':
        if (teacherPage > 1) setTeacherPage(teacherPage - 1);
        break;
      case 'parent':
        if (parentPage > 1) setParentPage(parentPage - 1);
        break;
      default:
        break;
    }
  };

  // Pagination calculation
  const paginate = (array, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return array.slice(startIndex, startIndex + itemsPerPage);
  };

  if (loading) return <div className="branch-view-loading">Loading...</div>;
  if (error) return <div className="branch-view-error">{error}</div>;
  if (!branch) return <div>No branch found</div>;

  return (
    <div className="branch-view-wrapper">
      <h3 className="branch-view-header">{branch.branchName} Details</h3>
      <div className="branch-view-principal-section">
        <h4 className="branch-view-subheader">Principal</h4>
        {branch.principal ? (
          <div className="principal-view-details">
            <p><strong>Name:</strong> {branch.principal.name}</p>
            <p><strong>Email:</strong> {branch.principal.email}</p>
          </div>
        ) : (
          <p className="branch-view-placeholder">Not Assigned</p>
        )}
      </div>
      <div className="branch-view-grid">
        {/* Students Column */}
        <div className="branch-view-column">
          <h4 className="branch-view-subheader">Students</h4>
          {branchDetails.students.length > 0 ? (
            <>
              <ul className="branch-view-list">
                {paginate(branchDetails.students, studentPage).map((student) => (
                  <li key={student._id} className="branch-view-list-item">
                    <span
                      onClick={() => handleStudentClick(student._id)}
                      className="branch-view-clickable"
                    >
                      {student.name} - {student.email} - {student.phone}
                    </span>
                    {selectedStudentId === student._id && (
                      <div className="student-view-details">
                        <p><strong>Admission Number:</strong> {student.admissionNo}</p>
                        <p><strong>Roll Number:</strong> {student.rollNumber}</p>
                        <p><strong>Email:</strong> {student.email}</p>
                        <p><strong>Phone:</strong> {student.phone}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="pagination-controls">
                <button
                  onClick={() => handlePrevPage('student')}
                  disabled={studentPage === 1}
                  className="pagination-btn"
                >
                  ← 
                </button>
                <span>Page {studentPage} of {Math.ceil(branchDetails.students.length / itemsPerPage)}</span>
                <button
                  onClick={() => handleNextPage('student')}
                  disabled={studentPage === Math.ceil(branchDetails.students.length / itemsPerPage)}
                  className="pagination-btn"
                >
                   →
                </button>
              </div>
            </>
          ) : (
            <p className="branch-view-placeholder">No students found for this branch.</p>
          )}
        </div>

        {/* Teachers Column */}
        <div className="branch-view-column">
          <h4 className="branch-view-subheader">Teachers</h4>
          {branchDetails.teachers.length > 0 ? (
            <>
              <ul className="branch-view-list">
                {paginate(branchDetails.teachers, teacherPage).map((teacher) => (
                  <li key={teacher._id} className="branch-view-list-item">
                    <span
                      onClick={() => handleTeacherClick(teacher._id)}
                      className="branch-view-clickable"
                    >
                      {teacher.name} - {teacher.email} - {teacher.phoneNo}
                    </span>
                    {selectedTeacherId === teacher._id && (
                      <div className="teacher-view-details">
                        <p><strong>Teacher ID:</strong> {teacher.teacherId}</p>
                        <p><strong>Name:</strong> {teacher.name}</p>
                        <p><strong>Email:</strong> {teacher.email}</p>
                        <p><strong>Phone:</strong> {teacher.phoneNo}</p>
                        <p><strong>Qualification:</strong> {teacher.qualification || "N/A"}</p>
                        <p><strong>Class Teacher For:</strong> {teacher.classTeacherFor || "N/A"}</p>
                        <p><strong>Staff Type:</strong> {teacher.staffType}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="pagination-controls">
                <button
                  onClick={() => handlePrevPage('teacher')}
                  disabled={teacherPage === 1}
                  className="pagination-btn"
                >
                  ← 
                </button>
                <span>Page {teacherPage} of {Math.ceil(branchDetails.teachers.length / itemsPerPage)}</span>
                <button
                  onClick={() => handleNextPage('teacher')}
                  disabled={teacherPage === Math.ceil(branchDetails.teachers.length / itemsPerPage)}
                  className="pagination-btn"
                >
                   →
                </button>
              </div>
            </>
          ) : (
            <p className="branch-view-placeholder">No teachers found for this branch.</p>
          )}
        </div>

        {/* Parents Column */}
        <div className="branch-view-column">
          <h4 className="branch-view-subheader">Parents</h4>
          {branchDetails.parents.length > 0 ? (
            <>
              <ul className="branch-view-list">
                {paginate(branchDetails.parents, parentPage).map((parent) => (
                  <li key={parent._id} className="branch-view-list-item">
                    <span
                      onClick={() => handleParentClick(parent._id)}
                      className="branch-view-clickable"
                    >
                      {parent.name} - {parent.email} - {parent.phone}
                    </span>
                    {selectedParentId === parent._id && (
                      <div className="parent-view-details">
                        <p><strong>Email:</strong> {parent.email}</p>
                        <p><strong>Phone:</strong> {parent.phone}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="pagination-controls">
                <button
                  onClick={() => handlePrevPage('parent')}
                  disabled={parentPage === 1}
                  className="pagination-btn"
                >
                  ← 
                </button>
                <span>Page {parentPage} of {Math.ceil(branchDetails.parents.length / itemsPerPage)}</span>
                <button
                  onClick={() => handleNextPage('parent')}
                  disabled={parentPage === Math.ceil(branchDetails.parents.length / itemsPerPage)}
                  className="pagination-btn"
                >
                   →
                </button>
              </div>
            </>
          ) : (
            <p className="branch-view-placeholder">No parents found for this branch.</p>
          )}
        </div>
      </div>
      <button
        onClick={() => navigate("/branches")}
        className="branch-view-back-btn"
      >
        Back to Branch List
      </button>
    </div>
  );
};

export default BranchDetails;