"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import ProfileSwitcher from "./ProfileSwitcher"
import {
  Box,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  Container,
  CircularProgress,
  Alert,
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
  Divider,
} from "@mui/material"
import { Event, Announcement } from "@mui/icons-material"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { LocalizationProvider, DateCalendar, PickersDay } from "@mui/x-date-pickers"
import { format, isSameDay, isValid } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
// import { AuthContext } from "../../App";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}


const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;


const ParentDashboard = () => {
  // const { studentId, setStudentId } = useContext(AuthContext);
  const [childData, setChildData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [error, setError] = useState(null)

  // Get user from localStorage and extract parentId
  const user = JSON.parse(localStorage.getItem("user"))
  const parentId = user?.roleId
  // Get the selected child ID from localStorage
  const studentId = localStorage.getItem("selectedChild")
  const token = localStorage.getItem("token")

  const fetchChildData = async (childId) => {
    if (!childId || !token) return
    try {
      setLoading(true)
      const response = await axios.get(`${BASE_URL}/api/students/${childId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      setChildData(response.data)
    } catch (err) {
      console.error("Error fetching student:", err.response?.data || err.message)
      setError(err.response?.data?.message || "Failed to fetch student data")
      setChildData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleChildSelect = (childId) => {
    if (childId && childId !== studentId) {
      localStorage.setItem("selectedChild", childId)
      fetchChildData(childId)
    }
  }

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data.map((event) => ({
        ...event,
        date: new Date(event.date),
      }))
    } catch (error) {
      console.error("Error fetching events:", error)
      throw error
    }
  }, [token])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: new Date(announcement.announcementDate),
      }))
    } catch (error) {
      console.error("Error fetching announcements:", error)
      throw error
    }
  }, [token])

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Please login to view data")
      return
    }
    setError(null)
    try {
      const [eventsData, announcementsData] = await Promise.all([fetchEvents(), fetchAnnouncements()])
      setEvents(eventsData)
      setAnnouncements(announcementsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load events and announcements. Please try again later.")
    }
  }, [fetchEvents, fetchAnnouncements, token])

  useEffect(() => {
    if (studentId && token) {
      fetchChildData(studentId)
      fetchData()
    }
  }, [studentId, fetchData, token])

  const getSelectedDateItems = useCallback(() => {
    const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate))
    const dayAnnouncements = announcements.filter((announcement) =>
      isSameDay(announcement.announcementDate, selectedDate),
    )
    return { dayEvents, dayAnnouncements }
  }, [events, announcements, selectedDate])

  const highlightedDays = useMemo(() => {
    const highlighted = [
      ...events.map((event) => event.date),
      ...announcements.map((announcement) => announcement.announcementDate),
    ]
    return highlighted.filter(isValid)
  }, [events, announcements])

  const getFeeSummary = useMemo(() => {
    if (!childData?.feeDetails) return { totalPaid: 0, totalPending: 0 }

    const totalPaid = childData.feeDetails.terms.reduce((sum, term) => sum + (term.paidAmount || 0), 0)
    const totalPending = childData.feeDetails.totalFee - totalPaid

    return { totalPaid, totalPending }
  }, [childData])

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <AppBar position="static" elevation={0} sx={{ background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
          <Toolbar sx={{ justifyContent: "flex-end", py: 1 }}>
            {parentId && token ? (
              <ProfileSwitcher parentId={parentId} onChildSelect={handleChildSelect} selectedChildId={studentId} />
            ) : (
              <Typography color="error">{token ? "Parent ID not found" : "Please login to continue"}</Typography>
            )}
          </Toolbar>
        </AppBar>
      </motion.div>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : childData ? (
          <motion.div
            key={childData._id}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <motion.div variants={cardVariants}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                      color: "white",
                      borderRadius: "15px",
                    }}
                  >
                    <Typography variant="h4" gutterBottom>
                      {childData.name}'s Dashboard
                    </Typography>
                    <Typography variant="subtitle1">Admission No: {childData.admissionNo}</Typography>
                    <Typography variant="subtitle1">
                      Class: {childData.className} {childData.section}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>

              {/* Calendar Section */}
              <Grid item xs={12} md={6}>
  <Paper
    sx={{
      p: { xs: 1, sm: 2 }, // Responsive padding: smaller on 320px
      backgroundColor: "#fff",
      borderRadius: 2,
      width: '100%',
      maxWidth: { xs: '100%', sm: '400px', md: '450px', lg: '500px' }, // Responsive maxWidth
      mx: 'auto', // Center horizontally
    }}
  >
    <Typography
      variant="h6"
      sx={{
        mb: { xs: 1, sm: 2 }, // Responsive margin-bottom
        color: "#333",
        fontSize: { xs: "1rem", sm: "1.25rem" }, // Match previous responsive typography
      }}
    >
      Calendar
    </Typography>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateCalendar
        value={selectedDate}
        onChange={(newDate) => setSelectedDate(newDate)}
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
              md: '1rem', // 900px+
              lg: '1.1rem' // 1200px+
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

              {/* Events & Announcements Section */}
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 2, maxHeight: 400, overflow: "auto", borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {format(selectedDate, "MMMM d, yyyy")} - Events & Announcements
                  </Typography>
                  <List>
                    <AnimatePresence>
                      {getSelectedDateItems().dayEvents.map((event) => (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ListItem sx={{ mb: 1, bgcolor: "background.default", borderRadius: 1 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Event color="primary" />
                                  <Typography variant="subtitle1">{event.name}</Typography>
                                  <Chip label={event.type} size="small" color="primary" sx={{ ml: 1 }} />
                                </Box>
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
                          <ListItem sx={{ mb: 1, bgcolor: "background.default", borderRadius: 1 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Announcement color="secondary" />
                                  <Typography variant="subtitle1">{announcement.title}</Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </motion.div>
                      ))}
                      {getSelectedDateItems().dayEvents.length === 0 &&
                        getSelectedDateItems().dayAnnouncements.length === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ListItem>
                              <ListItemText primary="No events or announcements for this date" />
                            </ListItem>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </List>
                </Paper>
              </Grid>

              {/* Fee Details Section */}
              <Grid item xs={12}>
                <motion.div variants={cardVariants}>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: "#333" }}>
                      Fee Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Total Fee: ₹{childData.feeDetails.totalFee}</Typography>
                      <Typography variant="subtitle1">Payment Option: {childData.feeDetails.paymentOption}</Typography>
                      <Typography variant="subtitle1">Total Paid: ₹{getFeeSummary.totalPaid}</Typography>
                      <Typography variant="subtitle1" color={getFeeSummary.totalPending > 0 ? "error" : "success"}>
                        Pending: ₹{getFeeSummary.totalPending}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Term</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {childData.feeDetails.terms.map((term) => (
                            <TableRow key={term._id}>
                              <TableCell>{term.termName}</TableCell>
                              <TableCell>₹{term.amount}</TableCell>
                              <TableCell>{format(new Date(term.dueDate), "MMM d, yyyy")}</TableCell>
                              <TableCell>₹{term.paidAmount}</TableCell>
                              <TableCell>
                                <Chip
                                  label={term.status}
                                  color={term.status === "Paid" ? "success" : "warning"}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Payment History */}
                    {childData.feeDetails.paymentHistory.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom sx={{ color: "#333" }}>
                          Payment History
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Receipt #</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {childData.feeDetails.paymentHistory.map((payment) => (
                                <TableRow key={payment._id}>
                                  <TableCell>{format(new Date(payment.paymentDate), "MMM d, yyyy")}</TableCell>
                                  <TableCell>₹{payment.amountPaid}</TableCell>
                                  <TableCell>{payment.paymentMethod}</TableCell>
                                  <TableCell>{payment.receiptNumber}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={payment.status}
                                      color={
                                        payment.status === "SUCCESS"
                                          ? "success"
                                          : payment.status === "FAILED"
                                            ? "error"
                                            : "warning"
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        ) : (
          <Typography align="center" variant="h6">
            {studentId ? "Child data not found" : "Select a child to view their dashboard"}
          </Typography>
        )}
      </Container>
    </Box>
  )
}

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props

  const isHighlighted = !outsideCurrentMonth && highlightedDays.some((date) => isValid(date) && isSameDay(date, day))

  return (
    <div {...other} style={{ position: "relative", zIndex: 1 }}>
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
      {isHighlighted && <span style={{ position: "absolute", top: 20, right: 5, color: "#ff0000" }}>•</span>}
    </div>
  )
}

export default ParentDashboard