import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Trash } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ExamTable.css';

// const API_BASE_URL = 'http://localhost:5000';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

export default function ExamTable() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [submittingStatus, setSubmittingStatus] = useState({});
  const [examForm, setExamForm] = useState({ name: '', subjects: [], maxMarks: '' });
  const [showModal, setShowModal] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState('');
  const [examNameError, setExamNameError] = useState('');

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  const selectedExam = exams.find((exam) => exam._id === selectedExamId) || null;

  useEffect(() => {
    if (!user || !user.email || !token) {
      setError('Please log in to manage exams.');
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingSubjects(true);
        const teacherRes = await api.get(`/api/teachers/${user.email}`);
        const { classTeacherFor } = teacherRes.data;

        const [subjectsRes, examsRes] = await Promise.all([
          api.get(`/api/subjects/${classTeacherFor}`),
          api.get(`/api/exams/${user.email}`),
        ]);

        setSubjects(subjectsRes.data.subjects || []);
        setExams(examsRes.data);
        setLoadingSubjects(false);
        setError('');
      } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
        setError(error.response?.data?.message || 'Failed to fetch initial data');
        setLoadingSubjects(false);
      }
    };
    fetchData();
  }, [user, token]);

  useEffect(() => {
    if (!user || !user.email || !token || !selectedExamId || !selectedExam) return;

    const fetchStudents = async () => {
      try {
        const studentRes = await api.get(`/api/stu/${user.email}`);
        const studentData = studentRes.data.map((student) => {
          const studentMarks = selectedExam.marks.find((m) => m.studentId.toString() === student._id.toString());
          const marks = selectedExam.subjects.map((subject) => {
            const foundMark =
              studentMarks?.marks.find((m) => m.subject === subject) || { marks: '', grade: '', status: '' };
            return { subject, marks: foundMark.marks, grade: foundMark.grade, status: foundMark.status };
          });
          return {
            _id: student._id,
            studentId: student.admissionNo,
            studentName: student.name,
            marks,
          };
        });
        setStudents(studentData);
        setError('');
      } catch (error) {
        console.error('Fetch Students Error:', error.response?.data || error.message);
        setError(error.response?.data?.message || 'Failed to fetch students');
      }
    };
    fetchStudents();
  }, [selectedExamId, user, token, selectedExam]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subjects') {
      setExamForm((prev) => {
        const subjects = prev.subjects.includes(value)
          ? prev.subjects.filter((s) => s !== value)
          : [...prev.subjects, value];
        return { ...prev, subjects };
      });
    } else {
      setExamForm((prev) => ({ ...prev, [name]: value }));
      if (name === 'name') {
        const isDuplicate = exams.some((exam) => exam.name.toLowerCase() === value.trim().toLowerCase());
        setExamNameError(isDuplicate ? 'Exam name already exists' : '');
      }
    }
  };

  const handleCreateExam = async () => {
    if (!token) {
      setError('Please log in to create an exam.');
      return;
    }

    if (examNameError || !examForm.name.trim() || !examForm.maxMarks || examForm.subjects.length === 0) {
      setExamNameError(!examForm.name.trim() ? 'Exam name is required' : examNameError);
      return;
    }

    try {
      const teacherRes = await api.get(`/api/teachers/${user.email}`);
      const { classTeacherFor, section } = teacherRes.data;

      const newExam = { ...examForm, className: classTeacherFor, section, createdBy: user.email };
      const res = await api.post('/api/exams', newExam);
      setExams((prev) => [...prev, res.data.data]);
      setExamForm({ name: '', subjects: [], maxMarks: '' });
      setShowModal(false);
      setExamNameError('');
      Swal.fire({ icon: 'success', title: 'Exam Created!' });
      setError('');
    } catch (error) {
      console.error('Create Exam Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!token) {
      setError('Please log in to delete an exam.');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the exam permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/exams/${examId}`);
        setExams((prev) => prev.filter((exam) => exam._id !== examId));
        if (selectedExamId === examId) setSelectedExamId(null);
        Swal.fire({ icon: 'success', title: 'Exam Deleted!' });
        setError('');
      } catch (error) {
        console.error('Delete Exam Error:', error.response?.data || error.message);
        setError(error.response?.data?.message || 'Failed to delete exam');
      }
    }
  };

  const handleMarksChange = (studentIndex, subjectIndex, value) => {
    const maxMarks = selectedExam.maxMarks;
    let marks = value.trim() === '' ? '' : Number(value);
    if (isNaN(marks) || marks < 0 || marks > maxMarks) return;

    setStudents((prev) =>
      prev.map((student, i) =>
        i === studentIndex
          ? {
              ...student,
              marks: student.marks.map((m, j) =>
                j === subjectIndex ? { ...m, marks, grade: getGrade(marks, maxMarks), status: getStatus(marks) } : m
              ),
            }
          : student
      )
    );
  };

  const getGrade = (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 68) return 'B';
    if (percentage >= 55) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  };

  const getStatus = (marks) => (marks < selectedExam.maxMarks * 0.5 ? 'Failed' : 'Passed');

  const calculateTotal = (marks) => marks.reduce((sum, sub) => sum + (sub.marks || 0), 0);
  const calculatePercentage = (total) =>
    ((total / (selectedExam.subjects.length * selectedExam.maxMarks)) * 100).toFixed(2);

  const handleSubmit = async (student) => {
    if (!token) {
      setError('Please log in to submit marks.');
      return;
    }

    if (student.marks.some((m) => m.marks === '')) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Marks' });
      return;
    }

    const payload = {
      studentId: student._id,
      examId: selectedExam._id,
      className: selectedExam.className,
      section: selectedExam.section,
      marks: student.marks.map((mark) => ({
        subject: mark.subject,
        marks: Number(mark.marks),
        grade: mark.grade,
        status: mark.status,
      })),
    };

    setSubmittingStatus((prev) => ({ ...prev, [student.studentId]: true }));
    try {
      await api.post('/api/saveMarks', payload);
      Swal.fire({ icon: 'success', title: `Marks Submitted for ${student.studentName}!` });
      setError('');

      const examsRes = await api.get(`/api/exams/${user.email}`);
      setExams(examsRes.data);

      const updatedSelectedExam = examsRes.data.find((exam) => exam._id === selectedExamId);
      if (updatedSelectedExam) {
        const studentRes = await api.get(`/api/stu/${user.email}`);
        const updatedStudentData = studentRes.data.map((student) => {
          const studentMarks = updatedSelectedExam.marks.find(
            (m) => m.studentId.toString() === student._id.toString()
          );
          const marks = updatedSelectedExam.subjects.map((subject) => {
            const foundMark =
              studentMarks?.marks.find((m) => m.subject === subject) || { marks: '', grade: '', status: '' };
            return { subject, marks: foundMark.marks, grade: foundMark.grade, status: foundMark.status };
          });
          return {
            _id: student._id,
            studentId: student.admissionNo,
            studentName: student.name,
            marks,
          };
        });
        setStudents(updatedStudentData);
      }
    } catch (error) {
      console.error('Submit Marks Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to submit marks');
    }
    setSubmittingStatus((prev) => ({ ...prev, [student.studentId]: false }));
  };

  const handleOpenModal = () => setShowModal(true);

  const handleCloseModal = () => {
    setShowModal(false);
    setExamForm({ name: '', subjects: [], maxMarks: '' });
    setExamNameError('');
  };

  if (!user || !user.email || !token) {
    return <div className="text-center p-3 text-muted">Please log in to manage exams.</div>;
  }

  return (
    <div
      className="exam-table-container position-relative Ke-dic"
      style={{ minHeight: '100vh' }}
    >
      {error && (
        <div className="alert alert-danger text-center" style={{ fontWeight: '600', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      <div className="card shadow-sm p-3 Ke-sh">
        <h3 className="text-center mb-3 fw-bold Ke-bo">Exam Management</h3>

        <div className="text-end mb-3">
          <button className="btn btn-success btn-sm Ke-mod" onClick={handleOpenModal}>
            Create Exam
          </button>
        </div>

        <div className="mb-3 text-center">
          <h5 className="fw-semibold text-secondary mb-2 Ke-bo">Select an Exam</h5>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {exams.map((exam) => (
              <button
                key={exam._id}
                className={`btn btn-sm ${selectedExamId === exam._id ? 'btn-success' : 'btn-outline-primary Ke-bt'}`}
                onClick={() => setSelectedExamId(exam._id)}
              >
                {exam.name}
              </button>
            ))}
          </div>
        </div>

        {selectedExam && (
          <div
            className="card p-3 bg-white shadow-sm"
            style={{ borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.08)' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5
                className="fw-semibold text-success flex-grow-1 text-center"
                style={{ color: 'rgb(107, 7, 131)' }}
              >
                {selectedExam.name}
              </h5>
              <button className="btn btn-danger btn-sm mx-1" onClick={() => handleDeleteExam(selectedExam._id)}>
                <Trash size={16} />
              </button>
            </div>
            <div className="table-responsive">
              <table
                className="table table-bordered table-hover text-center align-middle"
                style={{ borderRadius: '12px', overflow: 'hidden' }}
              >
                <thead
                  className="table-success"
                  style={{ backgroundColor: 'rgb(221, 237, 255)', color: 'rgb(107, 7, 131)', fontWeight: '600' }}
                >
                  <tr>
                    <th scope="col" style={{ width: '10%' }}>
                      Student ID
                    </th>
                    <th scope="col" style={{ width: '15%' }}>
                      Name
                    </th>
                    {selectedExam.subjects.map((subject, i) => (
                      <th key={i} scope="col" style={{ width: `${60 / selectedExam.subjects.length}%` }}>
                        {subject}
                      </th>
                    ))}
                    <th scope="col" style={{ width: '10%' }}>
                      Total
                    </th>
                    <th scope="col" style={{ width: '10%' }}>
                      Grade
                    </th>
                    <th scope="col" style={{ width: '10%' }}>
                      Percentage
                    </th>
                    <th scope="col" style={{ width: '15%' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, studentIndex) => {
                    const totalMarks = calculateTotal(student.marks);
                    const maxPossibleMarks = selectedExam.maxMarks * selectedExam.subjects.length;
                    const percentage = calculatePercentage(totalMarks);
                    return (
                      <tr key={student._id}>
                        <td>{student.studentId}</td>
                        <td>{student.studentName}</td>
                        {student.marks.map((sub, subjectIndex) => (
                          <td key={subjectIndex}>
                            <input
                              type="number"
                              className="form-control form-control-sm text-center mx-auto Ke-inps"
                              value={sub.marks}
                              onChange={(e) => handleMarksChange(studentIndex, subjectIndex, e.target.value)}
                            />
                          </td>
                        ))}
                        <td>{`${totalMarks}/${maxPossibleMarks}`}</td>
                        <td>{totalMarks ? getGrade(totalMarks, maxPossibleMarks) : ''}</td>
                        <td>{percentage}%</td>
                        <td>
                          <button
                            className="btn btn-sm w-100 Ke-bt2"
                            onClick={() => handleSubmit(student)}
                            disabled={
                              submittingStatus[student.studentId] || student.marks.some((m) => m.marks === '')
                            }
                          >
                            {submittingStatus[student.studentId] ? 'Submitting...' : 'Submit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay Ke-over"
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // width: '100vw',
             height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
            // paddingLeft:"auto",
          }}
        >
          <div
            className="modal-content-custom Ke-cust"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              margin: '0 auto', // Ensure horizontal centering
              position: 'relative', // Keep it within the flex container
            }}
          >
            <div className="modal-header Ke-he">
              <h5 className="modal-title Ke-tit">Create New Exam</h5>
            </div>

            <div className="modal-body">
              <div className="row g-2">
                <div className="col-12">
                  <input
                    type="text"
                    name="name"
                    value={examForm.name}
                    onChange={handleFormChange}
                    placeholder="Enter Exam Name"
                    className={`form-control form-control-sm mb-1 Ke-inps1 ${examNameError ? 'is-invalid' : ''}`}
                    required
                  />
                  {examNameError && (
                    <div className="invalid-feedback" style={{ fontSize: '0.85rem' }}>
                      {examNameError}
                    </div>
                  )}
                </div>

                <div className="col-12">
                  <div
                    className="border rounded p-2 bg-white"
                    style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: '1px solid rgb(107, 7, 131)',
                      borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    }}
                  >
                    {loadingSubjects ? (
                      <p className="text-center text-muted">Loading subjects...</p>
                    ) : subjects.length === 0 ? (
                      <p className="text-center text-muted">No subjects available</p>
                    ) : (
                      <div className="btn-group-vertical w-100" role="group">
                        {subjects.map((sub) => (
                          <button
                            key={sub._id}
                            type="button"
                            className={`btn btn-sm mb-1 ${
                              examForm.subjects.includes(sub.name) ? 'btn-primary' : 'btn-outline-secondary Ke-sec'
                            }`}
                            onClick={() => handleFormChange({ target: { name: 'subjects', value: sub.name } })}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <input
                    type="number"
                    name="maxMarks"
                    value={examForm.maxMarks}
                    onChange={handleFormChange}
                    placeholder="Max Marks"
                    className="form-control form-control-sm mt-3 Ke-int"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer Ke-foo">
              <button type="button" className="btn btn-secondary btn-sm Ke-bt1" onClick={handleCloseModal}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm Ke-bt2"
                onClick={handleCreateExam}
                disabled={!!examNameError}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}