import axios from 'axios';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Alert, Card, Col, Container, Row, Table } from 'react-bootstrap';
import { FaBook, FaCalendarAlt, FaClock, FaUser } from 'react-icons/fa';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function Etimetable() {
  const [studentData, setStudentData] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [periodTimetable, setPeriodTimetable] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  // Setup Axios interceptors for authorization (runs once)
  useEffect(() => {
    const token = localStorage.getItem('token');

    axios.interceptors.request.use(
      (config) => {
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
          setError('Session expired. Please log in again.');
          localStorage.clear();
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          setError('Access denied. You don’t have permission to view this data.');
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Fetch data when user changes
  useEffect(() => {
    if (!user) {
      setError('No user is logged in.');
      setLoading(false);
      return;
    }

    const fetchStudentDetails = async () => {
      setLoading(true);
      try {
        const studentResponse = await axios.get(
          `${BASE_URL}/api/student/${user.email}`
        );
        setStudentData(studentResponse.data);

        const timetableResponse = await axios.get(
          `${BASE_URL}/api/timetable/${studentResponse.data.className}/${studentResponse.data.section}`
        );

        // Handle different response structures
        let scheduleData = [];
        if (Array.isArray(timetableResponse.data)) {
          scheduleData = timetableResponse.data.flatMap((entry) => entry.schedule || []);
        } else if (timetableResponse.data?.schedule) {
          scheduleData = timetableResponse.data.schedule;
        }
        setTimetable(scheduleData);

        const getPeriodClass = (className, section) => {
          const noSectionClasses = ['Nursery', 'LKG', 'UKG'];
          return noSectionClasses.includes(className) ? className : `${className}-${section}`;
        };

        const periodClass = getPeriodClass(studentResponse.data.className, studentResponse.data.section);

        try {
          const periodTimetableResponse = await axios.get(
            `${BASE_URL}/studentTimeTable/${periodClass}`
          );
          setPeriodTimetable(periodTimetableResponse.data.schedule || null);
          setTimeSlots(periodTimetableResponse.data.timeSlots || []);
        } catch (err) {
          if (err.response?.status === 404) {
            setPeriodTimetable(null);
            setTimeSlots([]);
          } else {
            console.error('Error fetching period timetable:', err);
            setError('Failed to load period timetable.');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load student or timetable details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [user]);

  if (error) {
    return (
      <Container className='mt-5'>
        <Alert variant='danger' className='text-center shadow'>
          {error}
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className='mt-5'>
        <Alert variant='info' className='text-center shadow'>
          Loading...
        </Alert>
      </Container>
    );
  }

  return (
    <Container className='timetable-container mt-4 p-4 bg-light rounded-3 shadow'>
      <h3 className='text-center mb-4 text-primary'>
        <FaCalendarAlt className='me-2' /> Time Table
      </h3>

      {studentData && (
        <Card className='mb-4 shadow'>
          <Card.Body className='p-4'>
            <h5 className='card-title text-primary mb-4'>
              <FaUser className='me-2' /> Student Details
            </h5>
            <Row>
              <Col md={6}>
                <p className='mb-3'>
                  <strong>Name:</strong> {studentData.name}
                </p>
                <p className='mb-3'>
                  <strong>Email:</strong> {studentData.email}
                </p>
              </Col>
              <Col md={6}>
                <p className='mb-3'>
                  <strong>Roll Number:</strong> {studentData.rollNumber}
                </p>
                <p className='mb-3'>
                  <strong>Class:</strong> {studentData.className}
                </p>
                <p className='mb-3'>
                  <strong>Section:</strong> {studentData.section}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

  

      <Card className='mt-4 shadow'>
        <Card.Body className='p-4'>
          <h5 className='card-title text-primary mb-4'>
            <FaBook className='me-2 ' /> Period Timetable
          </h5>
          {periodTimetable && timeSlots.length > 0 ? (
            <Table striped bordered hover responsive className='mt-3'>
              <thead className='table-primary'>
                <tr>
                  <th>Day</th>
                  {timeSlots.map((slot, index) => (
                    <th key={index}>{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day, dayIndex) => (
                  <tr key={dayIndex}>
                    <td>{day}</td>
                    {timeSlots.map((slot, slotIndex) => (
                      <td key={slotIndex}>
                        {periodTimetable[day]?.[slotIndex] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant='info' className='mt-3 shadow'>
              No period timetable available for this class.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Etimetable;