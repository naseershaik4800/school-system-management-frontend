"use client";

import {
  Announcement,
  CalendarToday,
  ErrorOutline,
  DirectionsBus,
  Event,
  Group,
  People,
  Refresh,
  School,
} from "@mui/icons-material";
import {
  Alert,
  Badge,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import {
  DateCalendar,
  LocalizationProvider,
  PickersDay,
} from "@mui/x-date-pickers";

import { useNavigate } from "react-router-dom"; // For React Router navigation

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
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
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock notices data (replace with API if available)
const notices = [
  { title: "School annual sports day", date: "20 July 2023", views: "20k", img: "/path/to/sports.jpg" },
  { title: "Annual Function celebration 2023-24", date: "05 July 2023", views: "15k", img: "/path/to/function.jpg" },
  { title: "Mid term examination routine published", date: "15 June 2023", views: "22k", img: "/path/to/exam.jpg" },
  { title: "Inter school annual painting competition", date: "18 May 2023", views: "18k", img: "/path/to/painting.jpg" },
];

// Custom ServerDay component (unchanged)
function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isHighlighted =
    !outsideCurrentMonth &&
    highlightedDays.some((date) => isValid(date) && isSameDay(date, day));

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={isHighlighted ? "•" : undefined}
      color="primary"
      sx={{
        "& .MuiBadge-badge": {
          bottom: "5px",
          fontSize: { xs: "14px", sm: "18px" },
          fontWeight: "bold",
          backgroundColor: isHighlighted ? "var(--primary-color, #1976d2)" : "transparent",
        },
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const Dashboard = () => {
    const navigate = useNavigate(); // For navigation
  
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState({
    main: true,
    students: true,
    teachers: true,
    parents: true,
    earnings: true,
  });
  const [error, setError] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);

const [busCount, setBusCount] = useState(0);
  const [buses, setBuses] = useState([]); // Store bus data for navigation
  
  const [earnings, setEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(5);
  const [selectedWeek, setSelectedWeek] = useState("thisWeek");
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [refreshKey, setRefreshKey] = useState(0);

  const classOptions = [
    "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  ];

  const genderData = useMemo(() => {
    const boysPercentage = 0.6;
    const girlsPercentage = 1 - boysPercentage;
    const boys = Math.floor(studentCount * boysPercentage);
    const girls = studentCount - boys;
    return [
      { name: "Boys", value: boys, percentage: boysPercentage * 100 },
      { name: "Girls", value: girls, percentage: girlsPercentage * 100 },
    ];
  }, [studentCount]);

  const getAttendanceData = () => {
    const thisWeekData = [
      { name: "Mon", present: 300, absent: 50 },
      { name: "Tue", present: 290, absent: 60 },
      { name: "Wed", present: 280, absent: 70 },
      { name: "Thu", present: 300, absent: 50 },
      { name: "Fri", present: 310, absent: 40 },
      { name: "Sat", present: 0, absent: 0 },
    ];
    const pastWeekData = [
      { name: "Mon", present: 295, absent: 55 },
      { name: "Tue", present: 285, absent: 65 },
      { name: "Wed", present: 275, absent: 75 },
      { name: "Thu", present: 305, absent: 45 },
      { name: "Fri", present: 315, absent: 35 },
      { name: "Sat", present: 0, absent: 0 },
    ];
    return selectedWeek === "thisWeek" ? thisWeekData : pastWeekData;
  };

  // Fetch methods with authentication
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found, please log in");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchEvents = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(
        `${BASE_URL}/api/events`,
        config
      );
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
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/announcements`, config);
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: parseISO(announcement.announcementDate),
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error.response?.data?.message || "Failed to fetch announcements";
    }
  }, []);

  const fetchStudentCount = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/student-count`, config);
      return response.data.totalStudents || 0;
    } catch (error) {
      console.error("Error fetching student count:", error);
      throw error.response?.data?.message || "Failed to fetch student count";
    }
  }, []);

  const fetchTeacherCount = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/teacher-count`, config);
      return response.data.totalTeachers || 0;
    } catch (error) {
      console.error("Error fetching teacher count:", error);
      throw error.response?.data?.message || "Failed to fetch teacher count";
    }
  }, []);

  const fetchBusCount = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/driver-profiles`, config);
      setBuses(response.data); // Store bus data
      return response.data.length || 0;
    } catch (error) {
      console.error("Error fetching bus count:", error);
      throw error.response?.data?.message || "Failed to fetch bus count";
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/earnings`, config);
      return response.data.totalEarnings || 0;
    } catch (error) {
      console.error("Error fetching earnings:", error);
      throw error.response?.data?.message || "Failed to fetch earnings";
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, main: true }));
    setError(null);
    try {
      const [eventsData, announcementsData] = await Promise.all([
        fetchEvents(),
        fetchAnnouncements(),
      ]);
      setEvents(eventsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      setError("Failed to load events and announcements. Please try again later.");
    } finally {
      setLoading((prev) => ({ ...prev, main: false }));
    }
  }, [fetchEvents, fetchAnnouncements]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const loadStudentCount = async () => {
      setLoading((prev) => ({ ...prev, students: true }));
      try {
        const count = await fetchStudentCount();
        setStudentCount(count);
      } catch (error) {
        setStudentCount(0);
      } finally {
        setLoading((prev) => ({ ...prev, students: false }));
      }
    };
    loadStudentCount();
  }, [fetchStudentCount]);

  useEffect(() => {
    const loadTeacherCount = async () => {
      setLoading((prev) => ({ ...prev, teachers: true }));
      try {
        const count = await fetchTeacherCount();
        setTeacherCount(count);
      } catch (error) {
        setTeacherCount(0);
      } finally {
        setLoading((prev) => ({ ...prev, teachers: false }));
      }
    };
    loadTeacherCount();
  }, [fetchTeacherCount]);

  useEffect(() => {
      const loadBusCount = async () => {
        setLoading((prev) => ({ ...prev, buses: true }));
        try {
          const count = await fetchBusCount();
          setBusCount(count);
        } catch (error) {
          setBusCount(0);
        } finally {
          setLoading((prev) => ({ ...prev, buses: false }));
        }
      };
      loadBusCount();
    }, [fetchBusCount]);

    const handleBusClick = () => {
      navigate("/bus-details", { state: { buses } }); // Navigate to BusDetails with bus data
    };

  useEffect(() => {
    const loadEarnings = async () => {
      setLoading((prev) => ({ ...prev, earnings: true }));
      try {
        const earnings = await fetchEarnings();
        setEarnings(earnings);
      } catch (error) {
        setEarnings(0);
      } finally {
        setLoading((prev) => ({ ...prev, earnings: false }));
      }
    };
    loadEarnings();
  }, [fetchEarnings]);

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

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWeekChange = (event) => setSelectedWeek(event.target.value);
  const handleClassChange = (event) => setSelectedClass(event.target.value);
  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  if (loading.main) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  // Rest of the JSX remains unchanged (rendering logic)
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f0f7ff",
        flexDirection: "column",
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" } }}>
            Dashboard
          </Typography>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
          {[
            { loading: loading.students, icon: <School />, label: "Total Students", count: studentCount },
            { loading: loading.teachers, icon: <Group />, label: "Total Teachers", count: teacherCount },
            {
              loading: loading.buses,
              icon: <DirectionsBus />,
              label: "Total Buses",
              count: busCount,
              onClick: handleBusClick,
            },
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  backgroundColor: "#e3f2fd",
                  borderRadius: 2,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: item.onClick ? "pointer" : "default",
                }}
                onClick={item.onClick}
              >
                {item.loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    {React.cloneElement(item.icon, { sx: { fontSize: { xs: 30, sm: 40 }, color: "#1976d2" } })}
                    <Typography variant="h6" sx={{ color: "#666", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: "#1976d2", fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                      {item.count}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <Typography variant="h6" sx={{ mb: 2, color: "#333", fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                Total Students by Gender
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    labelLine={true}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                  >
                    <Cell fill="#1976d2" />
                    <Cell fill="#4caf50" />
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, `${name} (${genderData.find((d) => d.name === name).percentage.toFixed(0)}%)`]} />
                </PieChart>
              </ResponsiveContainer>
              <Typography variant="h5" sx={{ textAlign: "center", mt: 2, color: "#333", fontWeight: "bold", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                {studentCount}
              </Typography>
              <Typography sx={{ textAlign: "center", color: "#666", fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                Boys: {genderData[0].value} ({genderData[0].percentage.toFixed(0)}%) | Girls: {genderData[1].value} ({genderData[1].percentage.toFixed(0)}%)
              </Typography>
            </Paper>
          </Grid>


          <Grid item xs={12} md={6}>
  <Paper
    elevation={3}
    sx={{
      p: { xs: 1, sm: 2 }, // Responsive padding: smaller on 320px
      backgroundColor: "background.paper",
      transition: "box-shadow 0.3s ease-in-out",
      "&:hover": { boxShadow: 6 },
      width: '100%',
      maxWidth: { xs: '100%', sm: '400px', md: '450px', lg: '500px' }, // Consistent maxWidth scaling
      mx: 'auto', // Center horizontally
    }}
  >
    <Typography
      variant="h6"
      sx={{
        mb: { xs: 1, sm: 2 }, // Responsive margin-bottom
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
          maxWidth: '100%', // Ensure calendar fits container
          height: { xs: 'auto', sm: '350px', md: '400px', lg: '600px' }, // Responsive height
          "& .MuiPickersDay-root": {
            fontSize: { 
              xs: '0.65rem', // 320px
              sm: '0.875rem', // 600px+
              md: '1rem', // 900px+ (per your @media min-width: 900px)
              lg: '1.1rem' // 1200px+ (per your @media min-width: 1200px)
            },
            width: { 
              xs: 24, // 320px
              sm: 36, // 600px+
              md: 40, // 900px+
              lg: 46 // 1200px+
            },
            height: { 
              xs: 24, // 320px
              sm: 36, // 600px+
              md: 33, // 900px+
              lg: 32 // 1200px+
            },
            "&.Mui-selected": { backgroundColor: "var(--primary-color, #1976d2)" },
            transition: 'background-color 0.3s ease', // Smooth selection transition
          },
          "& .MuiPickersDay-today": { border: "1px solid var(--primary-color, #1976d2)" },
          "& .MuiDayCalendar-weekDayLabel": {
            fontSize: { 
              xs: '0.65rem', // 320px
              sm: '0.875rem', // 600px+
              lg: '1rem' // 1200px+
            },
            width: { 
              xs: 24, // 320px
              sm: 36, // 600px+
              md: 40, // 900px+
              lg: 46 // 1200px+
            },
          },
          "& .MuiPickersCalendarHeader-label": {
            fontSize: { 
              xs: '0.85rem', // 320px
              sm: '1rem', // 600px+
              lg: '1.1rem' // 1200px+
            },
          },
          "& .MuiIconButton-root": {
            fontSize: { 
              xs: '0.9rem', // 320px
              sm: '1.25rem', // 600px+
              lg: '1.5rem' // 1200px+
            },
            padding: { xs: '2px', sm: '8px' }, // Responsive padding for navigation
          },
          "& .MuiDayCalendar-slideTransition": {
            minHeight: { 
              xs: '210px', // 320px
              sm: '220px', // 600px+
              md: '260px', // 900px+
              lg: '400px' // 1200px+
            },
          },
          "& .MuiDayCalendar-header": {
            marginBottom: { xs: '2px', sm: '8px' }, // Tighten spacing on 320px
          },
        }}
      />
    </LocalizationProvider>
  </Paper>
</Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                maxHeight: { xs: 300, sm: 400 },
                overflow: "auto",
                backgroundColor: "background.paper",
                transition: "box-shadow 0.3s ease-in-out",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                {format(selectedDate, "MMMM d, yyyy")} - Events & Announcements
              </Typography>
              <List>
                <AnimatePresence mode="wait">
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
                          transition: "all 0.2s ease-in-out",
                          "&:hover": { bgcolor: "action.hover", transform: "translateX(5px)" },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              <Event color="primary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                              <Typography variant="subtitle1" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                                {event.name}
                              </Typography>
                              <Chip label={event.type} size="small" color="primary" sx={{ ml: 1 }} />
                            </Box>
                          }
                          secondary={
                            event.img && (
                              <Box sx={{ mt: 1 }}>
                                <img
                                  src={event.img || "/placeholder.svg"}
                                  alt={event.name}
                                  style={{ width: "100%", maxWidth: { xs: 150, sm: 200 }, height: "auto", borderRadius: 4, objectFit: "cover" }}
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
                          transition: "all 0.2s ease-in-out",
                          "&:hover": { bgcolor: "action.hover", transform: "translateX(5px)" },
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
                </AnimatePresence>
              </List>
            </Paper>
          </Grid>
        </Grid>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Alert
                severity="error"
                sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: "0.875rem", sm: "1rem" } }}
                action={<IconButton color="inherit" size="small" onClick={handleRefresh}><ErrorOutline /></IconButton>}
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default Dashboard;