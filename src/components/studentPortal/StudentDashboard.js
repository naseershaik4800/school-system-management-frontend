import { Mode, Announcement, CalendarToday, Event, Refresh } from '@mui/icons-material';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import {
  DateCalendar,
  LocalizationProvider,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import {
  FaBook,
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaMedal,
  FaTrophy,
  FaTrash
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
} from "date-fns";

// Custom ServerDay component for the calendar
function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isHighlighted =
    !outsideCurrentMonth &&
    highlightedDays.some((date) => isValid(date) && isSameDay(date, day));

  return (
    <PickersDay
      {...other}
      outsideCurrentMonth={outsideCurrentMonth}
      day={day}
      sx={{
        ...(isHighlighted && {
          backgroundColor: "var(--primary-color, #1976d2)",
          color: "#fff",
          "&:hover": { backgroundColor: "#1565c0" },
        }),
      }}
    />
  );
}

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function StudentDashboard() {
  const [stats, setStats] = useState({
    attendance: 0,
    assignments: 0,
    averageGrade: 0,
    badge: { name: 'None', class: 'bg-light text-muted' },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  // Calendar and Events/Announcements State
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  // Setup Axios interceptors for authorization
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
          Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Please log in again.',
          }).then(() => {
            localStorage.clear();
            window.location.href = '/login';
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
  }, []);

  // Fetch calendar-related data
  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/events`);
      return response.data.map((event) => ({
        ...event,
        date: parseISO(event.date),
      }));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error.response?.data?.message || "Failed to fetch events";
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/announcements`);
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: parseISO(announcement.announcementDate),
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error.response?.data?.message || "Failed to fetch announcements";
    }
  }, []);

  const fetchCalendarData = useCallback(async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const [eventsData, announcementsData] = await Promise.all([
        fetchEvents(),
        fetchAnnouncements(),
      ]);
      setEvents(eventsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      setCalendarError("Failed to load events and announcements. Please try again later.");
    } finally {
      setCalendarLoading(false);
    }
  }, [fetchEvents, fetchAnnouncements]);

  useEffect(() => {
    if (!user || user.role !== 'student' || !user.email) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please log in as a student to view the dashboard',
      });
      return;
    }
    fetchDashboardData1();
    fetchTimetableData();
    fetchCalendarData(); // Fetch calendar data
    const interval = setInterval(fetchCalendarData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [user, fetchCalendarData]);

  const handleMonthChange = (date) => setCurrentMonth(startOfMonth(date));

  const highlightedDays = useMemo(() => {
    const currentMonthEvents = events.filter(
      (event) =>
        isSameMonth(event.date, currentMonth) &&
        getMonth(event.date) === getMonth(currentMonth) &&
        getYear(event.date) === getYear(currentMonth)
    );
    const currentMonthAnnouncements = announcements.filter(
      (announcement) =>
        isSameMonth(announcement.announcementDate, currentMonth) &&
        getMonth(announcement.announcementDate) === getMonth(currentMonth) &&
        getYear(announcement.announcementDate) === getYear(currentMonth)
    );
    return [
      ...currentMonthEvents.map((event) => event.date),
      ...currentMonthAnnouncements.map((announcement) => announcement.announcementDate),
    ];
  }, [events, announcements, currentMonth]);

  const getSelectedDateItems = useCallback(() => {
    const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate));
    const dayAnnouncements = announcements.filter((announcement) =>
      isSameDay(announcement.announcementDate, selectedDate)
    );
    return { dayEvents, dayAnnouncements };
  }, [events, announcements, selectedDate]);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const fetchDashboardData1 = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;
    try {
      const response = await axios.get(
        `${BASE_URL}/api/student/dashboard/${encodeURIComponent(email)}`
      );
      setStats(response.data.stats);
      setRecentActivities(response.data.recentActivities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchTimetableData = async () => {
    try {
      const studentResponse = await axios.get(
        `${BASE_URL}/api/student/${user.email}`
      );
      const timetableResponse = await axios.get(
        `${BASE_URL}/api/timetable/${studentResponse.data.className}/${studentResponse.data.section}`
      );
      let scheduleData = [];
      if (timetableResponse.data.success && Array.isArray(timetableResponse.data.data)) {
        scheduleData = timetableResponse.data.data.flatMap((timetable) =>
          timetable.schedule.map((entry) => ({
            examName: timetable.examName,
            date: entry.date,
            day: entry.day,
            from: entry.from,
            to: entry.to,
            subject: entry.subject,
          }))
        );
      } else {
        setTimetableError("Unexpected timetable response structure.");
        return;
      }
      setTimetable(scheduleData);
      if (scheduleData.length === 0) {
        setTimetableError("No timetable entries found for this class.");
      } else {
        setTimetableError("");
      }
    } catch (err) {
      setTimetableError(err.response?.data?.message || "Failed to load timetable details.");
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;
    if (!email) return;
    try {
      await axios.post(
        `${BASE_URL}/api/student/leave-request/${encodeURIComponent(email)}`,
        leaveRequest
      );
      setShowLeaveModal(false);
      setLeaveRequest({ fromDate: "", toDate: "", reason: "" });
      fetchDashboardData1();
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;
    if (!email) return;
    try {
      await axios.delete(
        `${BASE_URL}/api/student/leave-request/${encodeURIComponent(
          email
        )}/${requestId}`
      );
      fetchDashboardData1();
    } catch (error) {
      console.error("Error deleting leave request:", error);
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className='text-center p-3 text-muted'>
        Please log in as a student to view the dashboard.
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Calendar and Events/Announcements Section */}
      <Box
        sx={{
          backgroundColor: "#f0f7ff",
          p: { xs: 1, sm: 2, md: 3 },
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" } }}>
            Student Dashboard
          </Typography>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Box>

        {calendarLoading ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography>Loading calendar...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, sm: 3 } }}>
            <Paper
              elevation={3}
              sx={{
                p: { xs: 1, sm: 2 },
                backgroundColor: "background.paper",
                width: { xs: "100%", md: "50%" },
                maxWidth: { xs: "100%", sm: "400px", md: "450px", lg: "500px" },
                mx: "auto",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: { xs: 1, sm: 2 },
                  display: "flex",
                  alignItems: "center",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                <CalendarToday sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                Calendar - {format(currentMonth, "MMMM yyyy")}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  onMonthChange={handleMonthChange}
                  slots={{ day: ServerDay }}
                  slotProps={{ day: { highlightedDays } }}
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    height: { xs: "auto", sm: "350px", md: "400px", lg: "600px" },
                    "& .MuiPickersDay-root": {
                      fontSize: { xs: "0.65rem", sm: "0.875rem", md: "1rem", lg: "1.1rem" },
                      width: { xs: 24, sm: 36, md: 40, lg: 46 },
                      height: { xs: 24, sm: 36, md: 33, lg: 32 },
                      "&.Mui-selected": { backgroundColor: "var(--primary-color, #1976d2)" },
                    },
                    "& .MuiPickersDay-today": { border: "1px solid var(--primary-color, #1976d2)" },
                    "& .MuiDayCalendar-weekDayLabel": {
                      fontSize: { xs: "0.65rem", sm: "0.875rem", lg: "1rem" },
                      width: { xs: 24, sm: 36, md: 40, lg: 46 },
                    },
                    "& .MuiPickersCalendarHeader-label": {
                      fontSize: { xs: "0.85rem", sm: "1rem", lg: "1.1rem" },
                    },
                    "& .MuiDayCalendar-slideTransition": {
                      minHeight: { xs: "210px", sm: "220px", md: "260px", lg: "400px" },
                    },
                  }}
                />
              </LocalizationProvider>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                p: 2,
                maxHeight: { xs: 300, sm: 400 },
                overflow: "auto",
                backgroundColor: "background.paper",
                width: { xs: "100%", md: "50%" },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                {format(selectedDate, "MMMM d, yyyy")} - Events & Announcements
              </Typography>
              <List>
                <motion.div>
                  {getSelectedDateItems().dayEvents.map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ListItem
                        sx={{
                          mb: 1,
                          bgcolor: "background.default",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              <Event color="primary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                              <Typography variant="subtitle1" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                {event.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            event.img && (
                              <Box sx={{ mt: 1 }}>
                                <img
                                  src={event.img || "/placeholder.svg"}
                                  alt={event.name}
                                  style={{ width: "100%", maxWidth: { xs: 150, sm: 200 }, height: "auto", borderRadius: 4 }}
                                />
                              </Box>
                            )
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                  {getSelectedDateItems().dayAnnouncements.map((announcement) => (
                    <motion.div
                      key={announcement._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ListItem
                        sx={{
                          mb: 1,
                          bgcolor: "background.default",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              <Announcement color="secondary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                              <Typography variant="subtitle1" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                {announcement.title}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                              {announcement.message}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                  {getSelectedDateItems().dayEvents.length === 0 &&
                    getSelectedDateItems().dayAnnouncements.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ListItem>
                          <ListItemText
                            primary="No events or announcements for this date"
                            sx={{ color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" } }}
                          />
                        </ListItem>
                      </motion.div>
                    )}
                </motion.div>
              </List>
            </Paper>
          </Box>
        )}
        {calendarError && (
          <Typography color="error" sx={{ mt: 2 }}>
            {calendarError}
          </Typography>
        )}
      </Box>

      {/* Existing Student Dashboard Content */}
      <Button variant="primary" onClick={() => setShowLeaveModal(true)} className="mb-4">
        Request Leave
      </Button>

      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleLeaveSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={leaveRequest.fromDate}
                onChange={(e) =>
                  setLeaveRequest({ ...leaveRequest, fromDate: e.target.value })
                }
                min={today}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={leaveRequest.toDate}
                onChange={(e) =>
                  setLeaveRequest({ ...leaveRequest, toDate: e.target.value })
                }
                min={today}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={leaveRequest.reason}
                onChange={(e) =>
                  setLeaveRequest({ ...leaveRequest, reason: e.target.value })
                }
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Recent Activities</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>From Date</th>
                <th>To Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity._id}>
                  <td>{new Date(activity.fromDate).toLocaleDateString()}</td>
                  <td>{new Date(activity.toDate).toLocaleDateString()}</td>
                  <td>{activity.description || activity.reason}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        activity.status === "completed" || activity.status === "approved"
                          ? "success"
                          : activity.status === "rejected"
                          ? "danger"
                          : "warning"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                  <td>
                    {activity.status === "pending" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteRequest(activity._id)}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className='mt-4'
      >
        <Container className='timetable-container p-4 bg-light rounded-3 shadow'>
          <h3 className='text-center mb-4 text-dark'>
            <FaCalendarAlt className='me-2' />
            Time Table
          </h3>
          <Card className='shadow'>
            <Card.Body className='p-4'>
              <h5 className='card-title text-primary mb-4'>
                <FaBook className='me-2' />
                Exam Timetable
              </h5>
              {timetableLoading ? (
                <div className='text-center'>
                  <p>Loading timetable...</p>
                </div>
              ) : timetableError ? (
                <div className='text-center text-danger'>{timetableError}</div>
              ) : timetable.length > 0 ? (
                <Table striped bordered hover responsive className='mt-3'>
                  <thead className='table-primary'>
                    <tr>
                      <th><FaCalendarAlt className='me-2' />Exam Name</th>
                      <th><FaCalendarAlt className='me-2' />Date</th>
                      <th>Day</th>
                      <th><FaClock className='me-2' />From</th>
                      <th><FaClock className='me-2' />To</th>
                      <th>Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.examName}</td>
                        <td>{entry.date}</td>
                        <td>{entry.day}</td>
                        <td>{entry.from}</td>
                        <td>{entry.to}</td>
                        <td>{entry.subject}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className='text-center'>
                  No timetable available for this class.
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </motion.div>

      <style>{`
        .stats-card.bg-bronze {
          background-color: #cd7f32;
          color: white;
        }
        .stats-card.bg-warning {
          background-color: #ffc107;
          color: #212529;
        }
        .stats-card.bg-secondary {
          background-color: #6c757d;
          color: white;
        }
        .stats-card.bg-light {
          background-color: #f8f9fa;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}

export default StudentDashboard;