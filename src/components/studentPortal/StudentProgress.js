import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Table,
} from 'react-bootstrap';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom'; // For redirection
import Swal from 'sweetalert2';


const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function ProgressPage() {
  const [examProgress, setExamProgress] = useState({
    totalMarks: 0,
    maxMarks: 0,
    percentage: 0,
    badge: { name: 'None', class: 'bg-light text-muted' },
  });
  const [attendanceData, setAttendanceData] = useState({
    present: 0,
    total: 0,
    percentage: 0,
    badge: { name: 'None', class: 'bg-light text-muted' },
  });
  const [assignmentProgress, setAssignmentProgress] = useState({
    submitted: 0,
    total: 0,
    percentage: 0,
    badge: { name: 'None', class: 'bg-light text-muted' },
  });
  const [examDetails, setExamDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // For redirecting to login
  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  // Setup Axios interceptors for authorization
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            throw new Error('No authentication token found');
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            Swal.fire({
              icon: 'error',
              title: 'Session Expired',
              text: 'Please log in again.',
            }).then(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            });
          } else if (error.response?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Access Denied',
              text: 'You don’t have permission to view this data.',
            });
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
  }, [navigate]);

  // Fetch progress data when user is available
  useEffect(() => {
    if (!user || user.role !== 'student' || !user.email) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please log in as a student to view your progress',
      }).then(() => navigate('/login'));
      return;
    }
    fetchProgressData();
  }, [user, navigate]);

  const getBadge = (percentage) => {
    if (percentage >= 90)
      return { name: 'Gold', class: 'bg-warning text-dark' };
    if (percentage >= 75)
      return { name: 'Silver', class: 'bg-secondary text-white' };
    if (percentage >= 60)
      return { name: 'Bronze', class: 'bg-bronze text-white' };
    return { name: 'None', class: 'bg-light text-muted' };
  };

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // Fetch student details
      const studentRes = await axios.get(
        `${BASE_URL}/api/student/${user.email}`
      );
      const studentDetails = studentRes.data;

      // Fetch data with Promise.all
      const [examsRes, attendanceRes, assignmentsRes, submittedAssignmentsRes] =
        await Promise.all([
          axios.get(
            `${BASE_URL}/api/exams/byClassSection/${studentDetails.className}/${studentDetails.section}`
          ),
          axios.get(`${BASE_URL}/student-attendance/${studentDetails._id}`),
          axios.get(
            `${BASE_URL}/get/student-assignments/${encodeURIComponent(
              user.email
            )}`
          ),
          axios.get(
            `${BASE_URL}/get/submitted-assignments/${encodeURIComponent(
              user.email
            )}`
          ),
        ]);

      // Exam Progress
      const exams = examsRes.data;
      const attendance = attendanceRes.data.attendanceRecords || [];
      let totalMarks = 0;
      let totalMaxMarks = 0;
      const detailedExams = [];

      exams.forEach((exam, index) => {
        const studentMarks = exam.marks.find(
          (m) => m.studentId.toString() === studentDetails._id.toString()
        );
        if (studentMarks && studentMarks.marks.length > 0) {
          const examTotal = studentMarks.marks.reduce(
            (sum, sub) => sum + (typeof sub.marks === 'number' ? sub.marks : 0),
            0
          );
          const maxTotal = exam.maxMarks * exam.subjects.length;
          totalMarks += examTotal;
          totalMaxMarks += maxTotal;

          const examName = exam.examName || exam.name || `Exam ${index + 1}`;
          detailedExams.push({
            name: examName,
            marksObtained: examTotal,
            maxMarks: maxTotal,
          });
        }
      });
      const examPercentage =
        totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
      const examBadge = getBadge(examPercentage);

      // Attendance Progress
      let presentDays = 0;
      let totalDays = attendance.length;
      attendance.forEach((record) => {
        if (record.attendanceStatus === 'Present') presentDays++;
      });
      const attendancePercentage =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const attendanceBadge = getBadge(attendancePercentage);

      // Assignment Progress
      const assignments = assignmentsRes.data;
      const submittedAssignments = submittedAssignmentsRes.data;
      const totalAssignments = assignments.length;
      const submittedCount = submittedAssignments.length;
      const assignmentPercentage =
        totalAssignments > 0 ? (submittedCount / totalAssignments) * 100 : 0;
      const assignmentBadge = getBadge(assignmentPercentage);

      // Set States
      setExamProgress({
        totalMarks,
        maxMarks: totalMaxMarks,
        percentage: Math.round(examPercentage),
        badge: examBadge,
      });
      setAttendanceData({
        present: presentDays,
        total: totalDays,
        percentage: Math.round(attendancePercentage),
        badge: attendanceBadge,
      });
      setAssignmentProgress({
        submitted: submittedCount,
        total: totalAssignments,
        percentage: Math.round(assignmentPercentage),
        badge: assignmentBadge,
      });
      setExamDetails(detailedExams);
    } catch (error) {
      console.error(
        'Error fetching progress data:',
        error.response?.data || error.message
      );
      // Error handling is managed by Axios interceptors, but we can still log it
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  if (!user || user.role !== 'student') {
    return (
      <div className='container my-4 text-center'>
        <div className='alert alert-warning'>
          Please log in as a student to view your progress.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className='text-center p-3'>Loading your progress...</div>;
  }

  return (
    <Container
      fluid
      className='py-5'
      style={{ backgroundColor: '#f4f7fa', minHeight: '100vh' }}
    >
      <h1
        className='text-center mb-5'
        style={{ color: '#2c3e50', fontWeight: '700' }}
      >
        Progress Tracking
      </h1>

      <Row className='justify-content-center g-4'>
        <Col xs={12} sm={6} md={4} lg={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className='text-center p-3 border-0 shadow-lg'
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ffffff, #e8f0fe)',
                cursor: 'pointer',
              }}
              onClick={handleShowModal}
            >
              <Card.Body>
                <h5
                  className='mb-4'
                  style={{ color: '#2980b9', fontWeight: '600' }}
                >
                  Overall Exam Progress
                </h5>
                <div
                  style={{ width: '120px', height: '120px', margin: '0 auto' }}
                >
                  <CircularProgressbar
                    value={examProgress.percentage}
                    text={`${examProgress.percentage}%`}
                    styles={buildStyles({
                      pathColor: '#27ae60',
                      textColor: '#27ae60',
                      trailColor: '#dfe6e9',
                      textSize: '24px',
                      pathTransitionDuration: 0.5,
                    })}
                  />
                </div>
                <p className='mt-3' style={{ color: '#7f8c8d' }}>
                  {examProgress.totalMarks} / {examProgress.maxMarks} Marks
                </p>
                <Badge
                  className={`mt-2 ${examProgress.badge.class}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  {examProgress.badge.name}
                </Badge>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col xs={12} sm={6} md={4} lg={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card
              className='text-center p-3 border-0 shadow-lg'
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ffffff, #e8f0fe)',
              }}
            >
              <Card.Body>
                <h5
                  className='mb-4'
                  style={{ color: '#2980b9', fontWeight: '600' }}
                >
                  Attendance
                </h5>
                <div
                  style={{ width: '120px', height: '120px', margin: '0 auto' }}
                >
                  <CircularProgressbar
                    value={attendanceData.percentage}
                    text={`${attendanceData.percentage}%`}
                    styles={buildStyles({
                      pathColor: '#2980b9',
                      textColor: '#2980b9',
                      trailColor: '#dfe6e9',
                      textSize: '24px',
                      pathTransitionDuration: 0.5,
                    })}
                  />
                </div>
                <p className='mt-3' style={{ color: '#7f8c8d' }}>
                  {attendanceData.present} / {attendanceData.total} Days
                </p>
                <Badge
                  className={`mt-2 ${attendanceData.badge.class}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  {attendanceData.badge.name}
                </Badge>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col xs={12} sm={6} md={4} lg={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card
              className='text-center p-3 border-0 shadow-lg'
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ffffff, #e8f0fe)',
              }}
            >
              <Card.Body>
                <h5
                  className='mb-4'
                  style={{ color: '#2980b9', fontWeight: '600' }}
                >
                  Assignments
                </h5>
                <div
                  style={{ width: '120px', height: '120px', margin: '0 auto' }}
                >
                  <CircularProgressbar
                    value={assignmentProgress.percentage}
                    text={`${assignmentProgress.percentage}%`}
                    styles={buildStyles({
                      pathColor: '#e67e22',
                      textColor: '#e67e22',
                      trailColor: '#dfe6e9',
                      textSize: '24px',
                      pathTransitionDuration: 0.5,
                    })}
                  />
                </div>
                <p className='mt-3' style={{ color: '#7f8c8d' }}>
                  {assignmentProgress.submitted} / {assignmentProgress.total}{' '}
                  Submitted
                </p>
                <Badge
                  className={`mt-2 ${assignmentProgress.badge.class}`}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  {assignmentProgress.badge.name}
                </Badge>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleCloseModal} centered size='lg'>
        <Modal.Header closeButton className='bg-primary text-white'>
          <Modal.Title>My Exam Scores</Modal.Title>
        </Modal.Header>
        <Modal.Body className='p-4'>
          {examDetails.length > 0 ? (
            <div className='table-responsive'>
              <Table
                striped
                bordered
                hover
                className='text-center align-middle'
              >
                <thead className='table-success'>
                  <tr>
                    <th scope='col' style={{ width: '70%' }}>
                      Exam Name
                    </th>
                    <th scope='col' style={{ width: '30%' }}>
                      Marks Obtained
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {examDetails.map((exam, index) => (
                    <tr key={index}>
                      <td>{exam.name}</td>
                      <td>{`${exam.marksObtained}/${exam.maxMarks}`}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className='text-muted text-center'>
              No exam data available yet.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-secondary' onClick={handleCloseModal}>
            Close
          </button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease-in-out;
        }
        .bg-bronze {
          background-color: #cd7f32;
          color: white;
        }
      `}</style>
    </Container>
  );
}

export default ProgressPage;
