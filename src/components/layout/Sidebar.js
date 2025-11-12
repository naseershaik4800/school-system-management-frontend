"use client";

import { useState, useEffect, useCallback } from "react";
import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaBuilding,
  FaBus,
  FaCalendarCheck,
  FaChalkboardTeacher,
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaGraduationCap,
  FaBusAlt,
  FaHeartbeat,
  FaHome,
  FaMoneyBillWave,
  FaPlusCircle,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
  FaUserTie,
  FaBell,
  FaUser,
  FaTasks,
  FaClipboardCheck,
  FaUserCheck,
  FaBookOpen,
  FaIdCard,
  FaFileAlt,
  FaEnvelopeOpenText,
  FaReceipt,
  FaChartBar,


  FaNotesMedical
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";


const Sidebar = ({ showSidebar, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);

  const handleResize = useCallback(() => {
    setIsSmallScreen(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const roleId = user?.roleId;
  const studentId = localStorage.getItem("selectedChild");

  const handleItemClick = () => {
    toggleSidebar(); // Close sidebar when an item is clicked
  };

  const getMenuItems = (role) => {
    switch (role) {
      case "admin":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/branches", icon: FaBuilding, text: "Branches" },
          { path: "/branches/add", icon: FaPlusCircle, text: "Add Branch" },
          { path: "/branches/stats", icon: FaChartLine, text: "Branch Stats" },
          { path: "/principals", icon: FaUserTie, text: "Principals" },
          {
            path: "/principals/add",
            icon: FaPlusCircle,
            text: "Add Principal",
          },
        ];
      case "principal":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/teachers", icon: FaChalkboardTeacher, text: "Teachers" },
          { path: "/add-student", icon: FaUserGraduate, text: "Add Student" },
          { path: "/parents", icon: FaUsers, text: "Parents" },
          { path: "/library", icon: FaBook, text: "Library" },
          { path: "/bus", icon: FaBus, text: "Bus" },
          {
            path: "/teacherattendance",
            icon: FaClock,
            text: "Teacher Attendance",
          },
          // {
          //   dropdown: true,
          //   icon: FaMoneyBillWave,
          //   text: "Fees",
          //   items: [
          //     {
          //       text: "Hostel",
          //       action: () => {
          //         navigate("/fees/hostel");
          //         handleItemClick();
          //       },
          //     },
          //     {
          //       text: "General",
          //       action: () => {
          //         navigate("/fees");
          //         handleItemClick();
          //       },
          //     },
          //   ],
          // },
          { path: "/Fees", icon: FaMoneyBillWave, text: "Fees" },
          { path: "/studentscores", icon: FaBook, text: "Scores" },
          { path: "/events", icon: FaCalendarCheck, text: "Events" },
          { path: "/timetable", icon: FaClock, text: "Timetable" },
          {
            path: "/healthrecord",
            icon: FaClipboardList,
            text: "Health Records",
          },
          { path: "/subjects", icon: FaBook, text: "Subjects" },
          {
            path: "/principalNotification",
            icon: FaBell,
            text: "Notification",
          },
        ];
        case "teacher":
          return [
            { path: "/", icon: FaHome, text: "Dashboard" },
            { path: "/attendance", icon: FaClipboardCheck, text: "Attendance" }, // Changed to FaClipboardCheck for attendance tracking
            { path: "/teacherattendance", icon: FaUserCheck, text: "Teacher Attendance" }, // Changed to FaUserCheck (better for individual attendance)
            { path: "/teacherlibrary", icon: FaBookOpen, text: "Library" }, // Changed to FaBookOpen (better representation of a library)
            { path: "/details", icon: FaIdCard, text: "Details" }, // Changed to FaIdCard (better for user details)
            { path: "/exam", icon: FaChalkboardTeacher, text: "Exam & Grades" }, // Changed to FaChalkboardTeacher (better for teacher-related exams)
            { path: "/submittedassignments", icon: FaFileAlt, text: "Sent Assignments" }, // Changed to FaFileAlt (better for assignments)
            { path: "/teacherNotification", icon: FaEnvelopeOpenText, text: "Notification" }, // Changed to FaEnvelopeOpenText (better for notifications)
            { path: "/behavioral-record", icon: FaUserShield, text: "Behavioral Record" } // Kept FaUserShield (fits security theme)
          ];
      
        case "student":
          return [
            { path: "/", icon: FaHome, text: "Dashboard" },
            { path: "/profile", icon: FaUser, text: "Profile" },
            { path: "/studentlibrary", icon: FaBook, text: "Library" },
            { path: "/studentattendance", icon: FaCalendarCheck, text: "Attendance" },
            { path: "/studentassignment", icon: FaTasks, text: "Assignment" },
            { path: "/studentexamscores", icon: FaClipboardList, text: "Exam Scores" },
            { path: "/studentNotification", icon: FaBell, text: "Notification" },
            { path: "/timetable", icon: FaClock, text: "Time Table" },
            // { path: "/behavioral-record", icon: FaUserShield, text: "Behavioral Record" },
          ];
      
          case "parent":
            return [
              { path: "/", icon: FaHome, text: "Dashboard" },
              { path: "/fees", icon: FaMoneyBillWave, text: "Fees" },
              { path: "/parentNotification", icon: FaBell, text: "Notification" }, // Changed to FaBell (better for notifications)
              { path: `/attendance/${studentId}`, icon: FaClipboardCheck, text: "Attendance" }, // Changed to FaClipboardCheck (better attendance tracking)
              { path: `/profile/${roleId}`, icon: FaUser, text: "Profile" }, // Changed to FaUser (better for general profile)
              { path: `/student-health-record/${studentId}`, icon: FaNotesMedical, text: "Health Record" }, // Changed to FaNotesMedical (better for health records)
              { path: `/behavioral-record/${studentId}`, icon: FaUserShield, text: "Behavioral Record" }, // Kept the same (security-related)
              { path: `/payment-history/${studentId}`, icon: FaReceipt, text: "Payment History" }, // Changed to FaReceipt (better for payment tracking)
              { path: `/score-card/${studentId}`, icon: FaChartLine, text: "ScoreCard" }, // Changed to FaChartLine (better for score tracking)
              { path: "/studentprogress", icon: FaChartBar, text: "Progress" }, // Changed to FaChartBar (progress tracking)
              { path: "/bus-route", icon: FaBus, text: "Bus Route" } // Changed to FaBus (better representation of transportation)
            ];
        
      case "driver":
        return [{ path: "/", icon: FaHome, text: "Dashboard" }];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(user?.role);

  // Calculate sidebar height to ensure it's scrollable independently
  // const sidebarHeight = "calc(100vh - 70px)";

  return (
    <>
      {/* Overlay for closing sidebar on small screens */}
      <AnimatePresence>
        {showSidebar && isSmallScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-overlay show"
            onClick={toggleSidebar}
            style={{ zIndex: 999 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          width: showSidebar ? (isSmallScreen ? "250px" : "280px") : "60px",
          translateX: !showSidebar && isSmallScreen ? "-100%" : "0",
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="sidebar"
        style={{
          position: "fixed",
          top: "0",
          left: 0,
          marginTop: "0px",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 1000,
          background: "linear-gradient(180deg, #6b0783, #6b0783)",
          boxShadow: "4px 0 12px rgba(0, 0, 0, 0.2)",
          paddingLeft: "10px",
          paddingRight: "10px",
        }}
      >
        <div className="sidebar-content" style={{ height: "100%", paddingTop: "70px" }}>
          <Nav
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "10px",
            }}
          >
            {menuItems.map((item, index) =>
              item.dropdown ? (
                <Dropdown key={item.text} style={{ marginBottom: "10px" }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Dropdown.Toggle
                      variant="link"
                      style={{
                        color: "#fff",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        textDecoration: "none",
                        padding: "10px",
                      }}
                    >
                      <item.icon size={20} style={{ marginRight: "15px" }} />
                      {showSidebar && (
                        <span style={{ flexGrow: 1}}>{item.text}</span>
                      )}
                    </Dropdown.Toggle>
                  </motion.div>
                  {showSidebar && (
                    <Dropdown.Menu>
                      {item.items.map((subItem) => (
                        <Dropdown.Item
                          key={subItem.text}
                          onClick={subItem.action}
                          style={{
                            color: "#333",
                            padding: "8px 16px",
                            cursor: "pointer",
                          }}
                        >
                          {subItem.text}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  )}
                </Dropdown>
              ) : (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  style={{ marginBottom: "10px" }}
                >
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    className={`nav-link pt-3 ${
                      location.pathname === item.path ? "bg-warning" : ""
                    }`}
                    onClick={handleItemClick}
                  >
                    <item.icon size={20} style={{ marginRight: "10px" }} />
                    {showSidebar && (
                      <span style={{ flexGrow: 1 }}>{item.text}</span>
                    )}
                  </Nav.Link>
                </motion.div>
              )
            )}
          </Nav>

          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                textAlign: "center",
                padding: "15px",
                color: "#fff",
                borderTop: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <small style={{ display: "block" }}>Logged in as:</small>
              <span style={{ fontWeight: "600" }}>{user?.role || "Guest"}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;