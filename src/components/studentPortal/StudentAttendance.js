import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Fade,
  Form,
  OverlayTrigger,
  ProgressBar,
  Row,
  Spinner,
  Table,
  Tooltip,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Setup Axios Interceptors for Authorization
const setupAxiosInterceptors = (navigate) => {
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
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied: Insufficient permissions');
      }
      return Promise.reject(error);
    }
  );
};


const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;


const StudentAttendance = ({ role = 'parent' }) => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [view, setView] = useState('list');

  const user = JSON.parse(localStorage.getItem('user'));

  let studentId;

  if (user.role === 'parent') {
    studentId = localStorage.getItem('selectedChild');
  } else if (user.role === 'student') {
    studentId = user.roleId;
  }

  // Setup interceptors on mount
  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentId) {
        setError('No student ID provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${BASE_URL}/api/attendance/student/${studentId}`
        );
        console.log('Frontend received:', response.data);
        const data = response.data || [];
        setAttendance(data);

        if (data.length > 0) {
          const firstRecord = data[0];
          setStudent({
            name: firstRecord.name || 'Student',
            class: firstRecord.className || 'N/A',
            section: firstRecord.section || 'N/A',
            admissionNo: firstRecord.admissionNo || 'N/A',
            rollNumber: firstRecord.rollNumber || 'N/A',
          });
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(err.response?.data?.message || 'Failed to load attendance');
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchAttendance();
  }, [studentId, navigate]);

  // Group attendance by month
  const groupByMonth = () => {
    const grouped = {};
    attendance.forEach((record) => {
      const date = new Date(record.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      grouped[monthYear] = grouped[monthYear] || [];
      grouped[monthYear].push(record);
    });
    return grouped;
  };

  // Filter records for selected month/year
  const filteredAttendance = () => {
    const monthYear = `${selectedYear}-${selectedMonth}`;
    return groupByMonth()[monthYear] || [];
  };

  // Calculate attendance statistics
  const calculateStats = (records) => {
    const total = records.length;
    const present = records.filter(
      (r) => r.attendanceStatus === 'Present'
    ).length;
    const absent = records.filter(
      (r) => r.attendanceStatus === 'Absent'
    ).length;

    return {
      total,
      present,
      absent,
      presentPercentage: total > 0 ? (present / total) * 100 : 0,
      absentPercentage: total > 0 ? (absent / total) * 100 : 0,
    };
  };

  // Generate month and year options
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <Container className='py-5 text-center'>
        <div
          className='d-flex flex-column align-items-center justify-content-center'
          style={{ minHeight: '50vh' }}
        >
          <Spinner animation='border' variant='primary' />
          <p className='mt-3 text-muted fs-6 fs-sm-5'>Loading attendance records...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className='py-5'>
        <Alert variant='danger'>
          <Alert.Heading className='fs-4 fs-sm-3'>Error</Alert.Heading>
          <p className='fs-6 fs-sm-5'>{error}</p>
          <div className='d-flex justify-content-end'>
            <Button variant='outline-primary' onClick={handleBack} size='sm'>
              Go Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const monthlyRecords = filteredAttendance();
  const stats = calculateStats(monthlyRecords);

  return (
    <Container fluid='lg' className='py-4 px-2 px-sm-3 px-md-4'>
      <Card className='shadow-sm border-0 mb-4'>
        <Card.Header className='bg-light border-bottom'>
          <Row className='align-items-center'>
            <Col xs={12} md={6}>
              <h3 className='mb-0 text-primary fs-5 fs-sm-4 fs-md-3'>Student Attendance</h3>
            </Col>
          </Row>
        </Card.Header>

        {student && (
          <Card.Body className='bg-light py-3 border-bottom'>
            <Row className='align-items-center'>
              <Col xs={12} md={6} className='mb-3 mb-md-0'>
                <h5 className='text-primary fs-6 fs-sm-5 fs-md-4'>{student.name}</h5>
                <p className='text-muted mb-0 fs-6 fs-sm-5'>
                  <strong>Class:</strong> {student.class} |{' '}
                  <strong>Section:</strong> {student.section}
                </p>
                <p className='text-muted mb-0 fs-6 fs-sm-5'>
                  <strong>Admission No:</strong> {student.admissionNo} |{' '}
                  <strong>Roll:</strong> {student.rollNumber}
                </p>
              </Col>
              <Col xs={12} md={6} className='text-md-end'>
                <div className='bg-white p-3 rounded shadow-sm d-inline-block'>
                  <div className='d-flex align-items-center justify-content-between mb-2'>
                    <span className='text-muted fs-6 fs-sm-5'>Monthly Attendance:</span>
                    <Badge
  bg={
    stats.presentPercentage >= 90
      ? "success"
      : stats.presentPercentage >= 75
      ? "warning"
      : "danger"
  }
  pill
  className="w-100 text-center text-wrap p-2"
>
  {stats.presentPercentage.toFixed(1)}%
</Badge>

                  </div>
                  <ProgressBar style={{ height: '8px', minWidth: '150px' }} className='w-100 w-sm-75 w-md-50'>
                    <ProgressBar
                      variant='success'
                      now={stats.presentPercentage}
                      key={1}
                    />
                    <ProgressBar
                      variant='danger'
                      now={stats.absentPercentage}
                      key={2}
                    />
                  </ProgressBar>
                  <div className='d-flex justify-content-between mt-2 fs-6 fs-sm-5'>
                    <span className='text-success'>
                      Present: {stats.present}
                    </span>
                    <span className='text-danger'>Absent: {stats.absent}</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        )}

        <Card.Body>
          <Row className='mb-4 align-items-center'>
            <Col xs={12} sm={6} lg={7} className='mb-3 mb-sm-0'>
              <div className='d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-center'>
                <h5 className='mb-2 mb-sm-0 me-sm-3 fs-6 fs-sm-5'>
                  {months[selectedMonth]} {selectedYear}
                </h5>
                <Badge bg='info' className='me-2 rounded-pill mb-2 mb-sm-0 fs-6 fs-sm-5'>
                  {stats.total} Records
                </Badge>
                <div className='d-flex'>
                  <Form.Check
                    type='radio'
                    id='view-list'
                    name='view'
                    label='List'
                    checked={view === 'list'}
                    onChange={() => setView('list')}
                    className='me-3 fs-6 fs-sm-5'
                    inline
                  />
                  <Form.Check
                    type='radio'
                    id='view-calendar'
                    name='view'
                    label='Calendar'
                    checked={view === 'calendar'}
                    onChange={() => setView('calendar')}
                    className='fs-6 fs-sm-5'
                    inline
                  />
                </div>
              </div>
            </Col>
            <Col xs={12} sm={6} lg={5}>
              <div className='d-flex flex-wrap justify-content-start justify-content-sm-end'>
                <Dropdown className='me-2 mb-2 mb-sm-0'>
                  <Dropdown.Toggle
                    variant='outline-primary'
                    size='sm'
                    id='month-dropdown'
                    className='fs-6 fs-sm-5'
                  >
                    {months[selectedMonth]}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {months.map((month, index) => (
                      <Dropdown.Item
                        key={index}
                        onClick={() => setSelectedMonth(index)}
                        active={selectedMonth === index}
                        className='fs-6 fs-sm-5'
                      >
                        {month}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle
                    variant='outline-primary'
                    size='sm'
                    id='year-dropdown'
                    className='fs-6 fs-sm-5'
                  >
                    {selectedYear}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {years.map((year) => (
                      <Dropdown.Item
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        active={selectedYear === year}
                        className='fs-6 fs-sm-5'
                      >
                        {year}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Col>
          </Row>

          <Fade in={!loading}>
            {view === 'list' ? (
              <div>
                {monthlyRecords.length === 0 ? (
                  <Alert variant='info' className='text-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='24'
                      height='24'
                      fill='currentColor'
                      className='bi bi-calendar-x mb-3'
                      viewBox='0 0 16 16'
                    >
                      <path d='M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708z' />
                      <path d='M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z' />
                    </svg>
                    <p className='fs-6 fs-sm-5'>
                      No attendance records found for {months[selectedMonth]}{' '}
                      {selectedYear}.
                    </p>
                    <Button
                      variant='outline-primary'
                      size='sm'
                      onClick={() => setSelectedMonth(new Date().getMonth())}
                    >
                      View Current Month
                    </Button>
                  </Alert>
                ) : (
                  <div className='table-responsive'>
                    <Table hover className='border bg-white table-sm'>
                      <thead className='bg-light'>
                        <tr>
                          <th scope='col' className='fs-6 fs-sm-5'>Date</th>
                          <th scope='col' className='fs-6 fs-sm-5'>Status</th>
                          <th scope='col' className='fs-6 fs-sm-5 d-none d-md-table-cell'>Class</th>
                          <th scope='col' className='fs-6 fs-sm-5 d-none d-lg-table-cell'>Teacher</th>
                          
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRecords.map((record, index) => (
                          <tr key={index} className='align-middle'>
                            <td className='fw-medium fs-6 fs-sm-5'>
                              {new Date(record.date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </td>
                            <td>
                              <Badge
                                bg={
                                  record.attendanceStatus === 'Present'
                                    ? 'success'
                                    : 'danger'
                                }
                                className='px-2 py-1 fs-6 fs-sm-5'
                              >
                                {record.attendanceStatus || 'N/A'}
                              </Badge>
                            </td>
                            <td className='fs-6 fs-sm-5 d-none d-md-table-cell'>
                              {record.className} - {record.section}
                            </td>
                            <td
                              className='text-truncate fs-6 fs-sm-5 d-none d-lg-table-cell'
                              style={{ maxWidth: '150px' }}
                            >
                              {record.teacherEmail}
                            </td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <Card className='border-0 shadow-sm'>
                <Card.Body>
                  <div className='table-responsive'>
                    <table className='table table-bordered table-sm'>
                      <thead className='bg-light'>
                        <tr>
                          <th className='fs-6 fs-sm-5 text-center'>Sun</th>
                          <th className='fs-6 fs-sm-5 text-center'>Mon</th>
                          <th className='fs-6 fs-sm-5 text-center'>Tue</th>
                          <th className='fs-6 fs-sm-5 text-center'>Wed</th>
                          <th className='fs-6 fs-sm-5 text-center'>Thu</th>
                          <th className='fs-6 fs-sm-5 text-center'>Fri</th>
                          <th className='fs-6 fs-sm-5 text-center'>Sat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateCalendarView(
                          selectedYear,
                          selectedMonth,
                          monthlyRecords
                        )}
                      </tbody>
                    </table>
                    <div className='d-flex flex-column flex-sm-row justify-content-center mt-3'>
                      <div className='d-flex align-items-center mb-2 mb-sm-0 me-sm-4'>
                        <div
                          className='rounded-circle bg-success me-2'
                          style={{ width: '12px', height: '12px' }}
                        ></div>
                        <span className='fs-6 fs-sm-5'>Present</span>
                      </div>
                      <div className='d-flex align-items-center mb-2 mb-sm-0 me-sm-4'>
                        <div
                          className='rounded-circle bg-danger me-2'
                          style={{ width: '12px', height: '12px' }}
                        ></div>
                        <span className='fs-6 fs-sm-5'>Absent</span>
                      </div>
                      <div className='d-flex align-items-center'>
                        <div
                          className='rounded-circle bg-light border me-2'
                          style={{ width: '12px', height: '12px' }}
                        ></div>
                        <span className='fs-6 fs-sm-5'>No Record</span>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Fade>
        </Card.Body>
      </Card>
    </Container>
  );
};

// Helper function to generate calendar view with tooltips
function generateCalendarView(year, month, records) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const dateStatusMap = {};
  records.forEach((record) => {
    const date = new Date(record.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      dateStatusMap[date.getDate()] = {
        status: record.attendanceStatus,
        reason: record.reason || 'None',
        teacher: record.teacherEmail || 'N/A',
      };
    }
  });

  const rows = [];
  let days = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<td key={`empty-${i}`} className='bg-white'></td>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const record = dateStatusMap[day];
    let cellClass = 'text-center position-relative p-1 p-sm-2';
    let statusBadge = null;

    if (record?.status === 'Present') {
      cellClass += ' bg-success bg-opacity-10';
      statusBadge = (
        <Badge
          bg='success'
          pill
          className='position-absolute top-0 end-0 mt-1 me-1 fs-6 fs-sm-5'
        >
          P
        </Badge>
      );
    } else if (record?.status === 'Absent') {
      cellClass += ' bg-danger bg-opacity-10';
      statusBadge = (
        <Badge
          bg='danger'
          pill
          className='position-absolute top-0 end-0 mt-1 me-1 fs-6 fs-sm-5'
        >
          A
        </Badge>
      );
    }

    const tooltipContent = record ? (
      <Tooltip id={`tooltip-${day}`}>
        <strong>Status:</strong> {record.status || 'N/A'}
        <br />
        <strong>Reason:</strong> {record.reason}
        <br />
        <strong>Teacher:</strong> {record.teacher}
      </Tooltip>
    ) : (
      <Tooltip id={`tooltip-${day}`}>No attendance record</Tooltip>
    );

    days.push(
      <OverlayTrigger key={day} placement='top' overlay={tooltipContent}>
        <td className={cellClass} style={{ height: '50px', minWidth: '40px' }}>
          <div className='fw-medium fs-6 fs-sm-5'>{day}</div>
          {statusBadge}
        </td>
      </OverlayTrigger>
    );

    if ((startingDayOfWeek + day) % 7 === 0 || day === daysInMonth) {
      if (day === daysInMonth && (startingDayOfWeek + day) % 7 !== 0) {
        const remainingDays = 7 - ((startingDayOfWeek + day) % 7);
        for (let i = 0; i < remainingDays; i++) {
          days.push(<td key={`empty-end-${i}`} className='bg-white'></td>);
        }
      }
      rows.push(<tr key={rows.length}>{days}</tr>);
      days = [];
    }
  }

  return rows;
}

export default StudentAttendance;