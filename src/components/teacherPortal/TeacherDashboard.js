import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Grow,
  Card,
  Button
} from '@mui/material';
import {
  CalendarToday,
  Event,
  Announcement,
  ErrorOutline,
  Refresh,
  People,
  Class,
  Group,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Schedule,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar, PickersDay } from '@mui/x-date-pickers';
import { format, isSameDay, parseISO, isSameMonth, startOfMonth, getMonth, getYear } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@mui/material';
import { keyframes } from '@emotion/react';
// import { Row, Col, Card, Table, Button, Badge } from "react-bootstrap";

// const API_BASE_URL = 'http://localhost:5000';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Custom ServerDay component
function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isHighlighted = !outsideCurrentMonth && highlightedDays.some((date) => isSameDay(date, day));

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isHighlighted ? '•' : undefined}
      color="primary"
      sx={{
        '& .MuiBadge-badge': {
          bottom: '5px',
          fontSize: { xs: '14px', sm: '18px' },
          fontWeight: 'bold',
          backgroundColor: isHighlighted ? '#f4a261' : 'transparent',
        },
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

const TeacherDashboard = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState({ main: true, teacherData: true });
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [teacherClass, setTeacherClass] = useState('N/A');
  const [teacherSection, setTeacherSection] = useState('N/A');
  const [attendanceSummary, setAttendanceSummary] = useState({ totalStudents: 0, present: 0, absent: 0 });
  const [timetable, setTimetable] = useState([]);
  const [examData, setExamData] = useState([]);
  const [exams, setExams] = useState([]);
  const hasFetched = useRef(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const token = localStorage.getItem('token');

  const email = user?.email; // Optional chaining in case 'user' is null

  // Axios instance with auth header
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/api/events');
      return response.data.map((event) => ({
        ...event,
        date: parseISO(event.date),
      }));
    } catch (error) {
      console.error('Error fetching events:', error.response?.data || error.message);
      throw error;
    }
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await api.get('/api/announcements');
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: parseISO(announcement.announcementDate),
      }));
    } catch (error) {
      console.error('Error fetching announcements:', error.response?.data || error.message);
      throw error;
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Please log in to view events and announcements.');
      return;
    }
    setLoading((prev) => ({ ...prev, main: true }));
    setError(null);
    try {
      const [eventsData, announcementsData] = await Promise.all([fetchEvents(), fetchAnnouncements()]);
      setEvents(eventsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load events and announcements.');
    } finally {
      setLoading((prev) => ({ ...prev, main: false }));
    }
  }, [fetchEvents, fetchAnnouncements, token]);

  const fetchTeacherData = useCallback(async () => {
    if (!user || !user.email || !token) {
      setError('Please log in to view teacher data.');
      return;
    }

    setLoading((prev) => ({ ...prev, teacherData: true }));
    try {
      const teacherResponse = await api.get(`/api/teacher/${user.email}`);
      const teacherData = teacherResponse.data;
      setTeacherClass(teacherData.classTeacherFor || 'N/A');
      setTeacherSection(teacherData.section || 'N/A');
      setTimetable(teacherData.timetable || []);

      // const attendanceResponse = await api.get(`/api/attendance-summary/${user.email}`);
      // setAttendanceSummary(attendanceResponse.data);

      setError('');
    } catch (error) {
      console.error('Error fetching teacher data:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to load teacher data.');
    } finally {
      setLoading((prev) => ({ ...prev, teacherData: false }));
    }
  }, [user, token]);

  const fetchExamResults = useCallback(async () => {
    if (hasFetched.current || !user || !user.email || !token) {
      console.log(hasFetched.current ? 'Already fetched exam data' : 'No user/token, skipping fetch');
      return;
    }
  
    try {
      // Fetch exams created by the teacher
      const examsResponse = await api.get(`/api/exams/${user.email}`);
      const fetchedExams = examsResponse.data;
      console.log('Fetched Exams:', fetchedExams);
      setExams(fetchedExams);
  
      // Process each exam to calculate pass/fail percentages
      const results = fetchedExams.map((exam) => {
        let passCount = 0;
        let failCount = 0;
        let validStudents = 0;
  
        // Iterate over the embedded marks array
        const studentMarks = exam.marks || [];
        console.log(`Marks for ${exam.name}:`, studentMarks);
  
        studentMarks.forEach((studentMark) => {
          const marks = studentMark.marks || [];
          if (marks.length === 0) {
            console.log(`No marks recorded for student ${studentMark.studentId} in ${exam.name}`);
            return;
          }
  
          validStudents++;
          // Calculate total marks for this student across all subjects
          const totalMarks = marks.reduce((sum, mark) => sum + (Number(mark.marks) || 0), 0);
          const maxPossibleMarks = exam.maxMarks * exam.subjects.length;
          const percentage = maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks) * 100 : 0;
  
          console.log(
            `Student ${studentMark.studentId} in ${exam.name}: ${totalMarks}/${maxPossibleMarks} = ${percentage}%`
          );
  
          // Use 30% as the passing threshold (adjust as needed)
          if (percentage >= 30) passCount++;
          else failCount++;
        });
  
        const passPercentage = validStudents > 0 ? (passCount / validStudents) * 100 : 0;
        const failPercentage = validStudents > 0 ? (failCount / validStudents) * 100 : 0;
  
        console.log(
          `Exam ${exam.name}: Pass=${passPercentage}% (${passCount}), Fail=${failPercentage}% (${failCount}), Valid Students=${validStudents}`
        );
  
        return {
          examType: exam.name,
          pass: passPercentage,
          fail: failPercentage,
          passCount,
          failCount,
        };
      });
  
      console.log('Exam Results:', results);
      setExamData(results);
      hasFetched.current = true;
    } catch (error) {
      console.error('Error fetching exam results:', error.response?.data || error.message);
      setError('Failed to load exam performance data.');
    }
  }, [user, token]);

  const fetchLeaveRequests = useCallback(async () => {
    if (hasFetched.current || !user || !user.email || !token) {
      console.log(hasFetched.current ? 'Already fetched leave requests' : 'No user/token, skipping fetch');
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/api/teacher/leave-requests/${encodeURIComponent(
          user.email
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const fetchedRequests = response.data.leaveRequests || [];

      setLeaveRequests((prev) => {
        const prevString = JSON.stringify(prev);
        const newString = JSON.stringify(fetchedRequests);
        if (prevString !== newString) {
          console.log('Leave requests updated:', fetchedRequests);
          hasFetched.current = true;
          return fetchedRequests;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching leave requests:', error.response?.data || error.message);
      setError('Failed to load leave requests.');
    }
  }, [user, token]);


  useEffect(() => {
    fetchLeaveRequests();
    fetchData();
    fetchTeacherData();
    fetchExamResults();
    fetchLeaveRequests();
    // handleLeaveRequestAction();

    const interval = setInterval(() => {
      fetchData();
      fetchTeacherData();
      fetchExamResults();
      fetchLeaveRequests();
      // handleLeaveRequestAction();
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchData, fetchLeaveRequests, fetchTeacherData, fetchExamResults, refreshKey]);


  const handleLeaveRequestAction = async (id, status) => {
    const user = JSON.parse(localStorage.getItem("user")); // Ensure it's parsed
    const email = user?.email;
    console.log(id, status, email);

    try {
      const token = localStorage.getItem("token");
      setLeaveRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === id ? { ...req, status } : req
        )
      );
      await axios.put(
        `${BASE_URL}/api/teacher/leave-request/${id}`,
        { status, email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchLeaveRequests();
      // fetchNotifications();

      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    }
    catch (error) {
      console.error("Error updating leave request:", error.response ? error.response.data : error.message);
    }
    // window.location.reload();


  };



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

  const attendanceData = [
    { name: 'Present', value: attendanceSummary.present },
    { name: 'Absent', value: attendanceSummary.absent },
  ];

  const barData = examData.map((exam) => ({
    name: exam.examType,
    pass: exam.pass,
    fail: exam.fail,
    passCount: exam.passCount,
    failCount: exam.failCount,
  }));

  const COLORS = ['#f4a261', '#5e8c7d'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ bgcolor: '#2a5d53', p: 1, border: '1px solid #f4a261', borderRadius: 1, color: '#d9e8e3' }}>
          <Typography sx={{ fontWeight: 'bold' }}>{data.name} Exam</Typography>
          <Typography sx={{ color: payload[0].dataKey === 'pass' ? '#f4a261' : '#5e8c7d' }}>
            {`${payload[0].dataKey === 'pass' ? 'Pass' : 'Fail'}: ${payload[0].value.toFixed(0)}% (${data.passCount || data.failCount
              } students)`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  if (loading.main || loading.teacherData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'rgb(239,223,255)' }}>
        <Fade in={true}>
          <Box sx={{ textAlign: 'center', color: 'rgb(239,223,255)' }}>
            <CircularProgress color="inherit" />
            <Typography sx={{ mt: 2 }}>Loading teacher dashboard...</Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (!user || !user.email || !token) {
    return (
      <Box sx={{ textAlign: 'center', p: 3, bgcolor: '', color: '#d9e8e3' }}>
        <Fade in={true}>
          <Typography>Please log in to view the dashboard.</Typography>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'rgb(239, 223, 255)', p: { xs: 2, sm: 3, md: 4 } }}>
      <Fade in={true} timeout={1000}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: 'rgb(107, 7, 131)', animation: `${pulse} 2s infinite` }}>
            Teacher Dashboard
          </Typography>
          <IconButton onClick={handleRefresh} sx={{ color: 'rgb(107, 7, 131)' }}>
            <Refresh />
          </IconButton>
        </Box>
      </Fade>

      {error && (
        <Grow in={true} timeout={500}>
          <Alert
            severity="error"
            sx={{ mb: 3, bgcolor: 'rgb(107, 7, 131)', color: 'rgb(221, 237, 255)' }}
            action={
              <IconButton color="inherit" size="small" onClick={handleRefresh}>
                <ErrorOutline />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Grow>
      )}

      <Grid container spacing={3}>
        {[
          { icon: <Class />, label: 'Class', value: teacherClass },
          { icon: <Group />, label: 'Section', value: teacherSection },
          // { icon: <People />, label: 'Total Students', value: attendanceSummary.totalStudents },
        ].map((item, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Grow in={true} timeout={500 + index * 200}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'rgb(221, 237, 255)',
                  borderRadius: 2,
                  color: 'rgb(107, 7, 131)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  animation: `${fadeIn} 0.5s ease-in-out`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {React.cloneElement(item.icon, { sx: { mr: 1, color: 'rgb(107, 7, 131)' } })}
                  <Typography variant="h6" sx={{ color: 'rgb(107, 7, 131)' }}>{item.label}</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: 'rgb(107, 7, 131)' }}>{item.value}</Typography>
              </Paper>
            </Grow>
          </Grid>
        ))}
        {/* 
        <Grid item xs={12} md={6}>
          <Grow in={true} timeout={700}>
            <Paper sx={{ p: 2, bgcolor: 'rgb(221, 237, 255)', borderRadius: 2, color: 'rgb(107, 7, 131)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PieChartIcon sx={{ mr: 1, color: 'rgb(107, 7, 131)' }} />
                <Typography variant="h6" sx={{ color: 'rgb(107, 7, 131)', fontWeight: 'bold' }}>
                  Attendance Overview
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'rgb(107, 7, 131)' }}
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['rgb(107, 7, 131)', 'rgb(107, 7, 131)', 'rgb(221, 237, 255)'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ color: 'rgb(107, 7, 131)' }} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grow>
        </Grid> */}

<Grid item xs={12} md={12}>
  <Grow in={true} timeout={900}>
    <Paper sx={{ p: 2, bgcolor: 'rgb(221, 237, 255)', borderRadius: 2, color: 'rgb(107, 7, 131)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <BarChartIcon sx={{ mr: 1, color: 'rgb(107, 7, 131)' }} />
        <Typography variant="h6" sx={{ color: 'rgb(107, 7, 131)', fontWeight: 'bold' }}>
          Exam Performance
        </Typography>
      </Box>
      {exams.length > 0 ? (
        <>
          {console.log('barData for BarChart:', barData)}
          {barData.length > 0 && barData.some((d) => d.pass > 0 || d.fail > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(239, 223, 255)" />
                <XAxis dataKey="name" stroke="rgb(107, 7, 131)" />
                <YAxis stroke="rgb(107, 7, 131)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: 'rgb(107, 7, 131)' }} />
                <Bar dataKey="pass" fill="#5e8c7d" name="Pass" />
                <Bar dataKey="fail" fill="#f4a261" name="Fail" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="rgb(107, 7, 131)">
              {barData.length === 0 ? 'No performance data available.' : 'All students have 0% pass/fail rates.'}
            </Typography>
          )}
        </>
      ) : (
        <Typography color="rgb(107, 7, 131)">No exams available yet.</Typography>
      )}
    </Paper>
  </Grow>
</Grid>

        <Grid item xs={12}>
          <Grow in={true} timeout={1100}>
            <Paper sx={{ p: 2, bgcolor: 'rgb(221, 237, 255)', borderRadius: 2, color: 'rgb(107, 7, 131)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: 'rgb(107, 7, 131)' }} />
                <Typography variant="h6" sx={{ color: 'rgb(107, 7, 131)', fontWeight: 'bold' }}>
                  Timetable
                </Typography>
              </Box>
              {timetable.length > 0 ? (
                <TableContainer>
                  <Table sx={{ bgcolor: 'rgb(221, 237, 255)' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgb(107, 7, 131)', borderBottom: '1px solid rgb(239, 223, 255)' }}>Time</TableCell>
                        <TableCell sx={{ color: 'rgb(107, 7, 131)', borderBottom: '1px solid rgb(239, 223, 255)' }}>Class</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timetable.map((slot, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            bgcolor: slot.class.toLowerCase() === 'break' ? 'rgb(239, 223, 255)' : 'rgb(221, 237, 255)',
                            animation: `${fadeIn} 0.5s ease-in-out`,
                          }}
                        >
                          <TableCell sx={{ color: 'rgb(107, 7, 131)', borderBottom: '1px solid rgb(239, 223, 255)' }}>{slot.time}</TableCell>
                          <TableCell sx={{ color: 'rgb(107, 7, 131)', borderBottom: '1px solid rgb(239, 223, 255)' }}>{slot.class}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="rgb(107, 7, 131)">No timetable available.</Typography>
              )}
            </Paper>
          </Grow>
        </Grid>

        <Grid item xs={12} md={6}>
  <Grow in={true} timeout={1300}>
    <Paper
      sx={{
        p: { xs: 1, sm: 2 },
        bgcolor: 'rgb(221, 237, 255)',
        borderRadius: 2,
        color: 'rgb(107, 7, 131)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: { xs: '100%', sm: '400px', md: '450px', lg: '500px' },
        mx: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
        <CalendarToday sx={{ mr: 1, color: 'rgb(107, 7, 131)', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        <Typography
          variant="h6"
          sx={{
            color: 'rgb(107, 7, 131)',
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          Calendar - {format(currentMonth, 'MMMM yyyy')}
        </Typography>
      </Box>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateCalendar
          value={selectedDate}
          onChange={(newDate) => setSelectedDate(newDate)}
          onMonthChange={handleMonthChange}
          slots={{ day: ServerDay }}
          slotProps={{ day: { highlightedDays } }}
          sx={{
            width: '100%',
            maxWidth: '100%',
            height: { xs: 'auto', sm: '350px', md: '400px', lg: '600px' }, // Keep sufficient height for 1024px+
            color: 'rgb(107, 7, 131)',
            '& .MuiPickersDay-root': {
              fontSize: { 
                xs: '0.65rem', 
                sm: '0.875rem', 
                md: '1rem', // 900px+ (matches your @media min-width: 900px)
                lg: '1.1rem' // 1200px+ (matches your @media min-width: 1200px)
              },
              width: { 
                xs: 24, 
                sm: 36, 
                md: 40, // 900px+ (matches your @media min-width: 900px)
                lg: 46 // 1200px+ (matches your @media min-width: 1200px)
              },
              height: { 
                xs: 24, 
                sm: 36, 
                md: 33, // 900px+ (matches your @media min-width: 900px)
                lg: 32 // 1200px+ (matches your @media min-width: 1200px, using the last specified height of 32px)
              },
              color: 'rgb(107, 7, 131)',
              '&.Mui-selected': { bgcolor: 'rgb(107, 7, 131)', color: 'rgb(239, 223, 255)' },
              transition: 'background-color 0.3s ease',
            },
            '& .MuiPickersDay-today': { border: '1px solid rgb(107, 7, 131)' },
            '& .MuiPickersCalendarHeader-label': {
              color: 'rgb(107, 7, 131)',
              fontSize: { xs: '0.85rem', sm: '1rem', lg: '1.1rem' },
            },
            '& .MuiIconButton-root': {
              color: 'rgb(107, 7, 131)',
              fontSize: { xs: '0.9rem', sm: '1.25rem', lg: '1.5rem' },
              padding: { xs: '2px', sm: '8px' },
            },
            '& .MuiDayCalendar-weekDayLabel': {
              color: 'rgb(107, 7, 131)',
              fontSize: { xs: '0.65rem', sm: '0.875rem', lg: '1rem' },
              width: { xs: 24, sm: 36, md: 40, lg: 46 }, // Match .MuiPickersDay-root width
            },
            '& .MuiDayCalendar-slideTransition': {
              minHeight: { xs: '210px', sm: '220px', md: '260px', lg: '400px' }, // Keep sufficient grid height
            },
            '& .MuiDayCalendar-header': {
              marginBottom: { xs: '2px', sm: '8px' },
            },
          }}
        />
      </LocalizationProvider>
    </Paper>
  </Grow>
</Grid>

        <Grid item xs={12} md={6}>
          <Grow in={true} timeout={1500}>
            <Paper
              sx={{
                p: 2,
                maxHeight: { xs: 300, sm: 400 },
                overflow: 'auto',
                bgcolor: 'rgb(221, 237, 255)',
                borderRadius: 2,
                color: 'rgb(107, 7, 131)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: 'rgb(107, 7, 131)', fontWeight: 'bold' }}>
                {format(selectedDate, 'MMMM d, yyyy')} - Events & Announcements
              </Typography>
              <List>
                {getSelectedDateItems().dayEvents.map((event) => (
                  <Fade in={true} key={event._id} timeout={500}>
                    <ListItem sx={{ mb: 1, bgcolor: 'rgb(239, 223, 255)', borderRadius: 1, border: '1px solid rgb(107, 7, 131)' }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Event sx={{ color: 'rgb(107, 7, 131)' }} />
                            <Typography variant="subtitle1" sx={{ color: 'rgb(107, 7, 131)' }}>{event.name}</Typography>
                            <Chip label={event.type} size="small" sx={{ bgcolor: 'rgb(107, 7, 131)', color: 'rgb(221, 237, 255)' }} />
                          </Box>
                        }
                        secondary={
                          event.img && (
                            <Box sx={{ mt: 1 }}>
                              <img
                                src={event.img || '/placeholder.svg'}
                                alt={event.name}
                                style={{
                                  width: '100%',
                                  maxWidth: 200,
                                  height: 'auto',
                                  borderRadius: 4,
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                  '&:hover': { transform: 'scale(1.05)' },
                                }}
                              />
                            </Box>
                          )
                        }
                        sx={{ color: 'rgb(107, 7, 131)' }}
                      />
                    </ListItem>
                  </Fade>
                ))}
                {getSelectedDateItems().dayAnnouncements.map((announcement) => (
                  <Fade in={true} key={announcement._id} timeout={500}>
                    <ListItem sx={{ mb: 1, bgcolor: 'rgb(239, 223, 255)', borderRadius: 1, border: '1px solid rgb(107, 7, 131)' }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Announcement sx={{ color: 'rgb(107, 7, 131)' }} />
                            <Typography variant="subtitle1" sx={{ color: 'rgb(107, 7, 131)' }}>{announcement.title}</Typography>
                          </Box>
                        }
                        secondary={<Typography sx={{ color: 'rgb(107, 7, 131)' }}>{announcement.message}</Typography>}
                      />
                    </ListItem>
                  </Fade>
                ))}
                {getSelectedDateItems().dayEvents.length === 0 &&
                  getSelectedDateItems().dayAnnouncements.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No events or announcements for this date" sx={{ color: 'rgb(107, 7, 131)' }} />
                    </ListItem>
                  )}
              </List>
            </Paper>
          </Grow>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ mt: 4, bgcolor: 'rgb(221, 237, 255)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgb(239, 223, 255)' }}>
              <Typography variant="h5" sx={{ color: 'rgb(107, 7, 131)', mb: 0 }}>
                Leave Requests
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>From Date</TableCell>
                      <TableCell>To Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell>{request.studentId.name}</TableCell>
                        <TableCell>{request.reason}</TableCell>
                        <TableCell>{new Date(request.fromDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(request.toDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            color={
                              request.status === 'approved'
                                ? 'success'
                                : request.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleLeaveRequestAction(request._id, 'approved')}
                                sx={{ mr: 1 }}
                                className='mt-3'
                              >
                                Approve
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleLeaveRequestAction(request._id, 'rejected')}
                                className='mt-3'

                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        </Grid>

        {notifications.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ mt: 4, bgcolor: 'rgb(221, 237, 255)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgb(239, 223, 255)' }}>
                <Typography variant="h5" sx={{ color: 'rgb(107, 7, 131)', mb: 0 }}>
                  Notifications
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <List>
                  {notifications.map((notification) => (
                    <ListItem key={notification._id}>
                      <ListItemText
                        primary={`${notification.message} - ${new Date(notification.date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;