"use client";

import "animate.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState, useRef } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth Components
import Login from "./components/auth/Login.js";
import Register from "./components/auth/Register.js";
import PrivateRoute from "./components/common/PrivateRoute.js";
import Layout from "./components/layout/Layout.js";

// Admin Components (Branch Management)
import AddBranch from "./components/admin/branches/AddBranch";
import BranchList from "./components/admin/branches/BranchList";
import BranchStats from "./components/admin/branches/BranchStats";
import EditBranch from "./components/admin/branches/EditBranch";
import AdminDashboard from "./components/admin/dashboard/AdminDashboard";
import AddPrincipal from "./components/admin/principals/AddPrincipal";
import EditPrincipal from "./components/admin/principals/EditPrincipal";
import PrincipalList from "./components/admin/principals/PrincipalList";

// Principal Components (Previous Admin Routes)
import PrincipalDashboard from "./components/dashboard/Dashboard.js";
import ParentList from "./components/parents/ParentList.js";
import BusList from "./components/principal/bus/BusList.js";
import SchoolEvents from "./components/principal/events/SchoolEvents.js";


import Fees from './components/principal/fee/Fees.js';
import FeeManagement from './components/principal/fee/FeeManagement.js';
import HostelFeeManagement from './components/principal/fee/HostelFeeManagement.js';
import LibraryManagement from "./components/principal/library/LibraryManagement.js";
import ExamTimetable from "./components/principal/timetable/ExamTimeTable.js";
import PeriodTimeTable from "./components/principal/timetable/PeriodTimeTable.js";
import Timetable from "./components/principal/timetable/PrincipalTimeTable.js";
import AddParentForm from "./components/students/AddParentForm.js";
import AddStudentForm from "./components/students/AddStudentForm.js";
import HealthRecordForm from "./components/students/healthRecord.js";
import StudentDetailsPage from "./components/students/StudentDetails.js";
import TeacherDetails from "./components/teacherPortal/teacherdetails.js";
import TeacherList from "./components/teachers/TeacherList.js";

// Teacher Components
import ExamGrade from "./components/teacherPortal/Exam&Grade.js";
import TeacherDashboard from "./components/teacherPortal/TeacherDashboard.js";
import TeacherLibrary from "./components/teacherPortal/TeacherLibrary.js";
import StudManage from "./components/teachers/AttendanceManager.js";

// Student Components
import StudentAttendance from "./components/studentPortal/StudentAttendance.js";
import StudentDashboard from "./components/studentPortal/StudentDashboard.js";
import StudentLibrary from "./components/studentPortal/StudentLibrary.js";

// Parent Components
import ParentDashboard from "./components/parentPortal/ParentDashboard.js";

// Global CSS for consistent styling
import "./App.css";
import BehavioralRecordDisplay from "./components/parentPortal/BehavioralRecordDisplay.js";
import FeeDashboard from "./components/parentPortal/feeDashboard.js";
import ParentNotification from "./components/parentPortal/ParentNotification.js";
import PaymentForm from "./components/parentPortal/PaymentForm.js";
import PaymentHistory from "./components/parentPortal/PaymentHistory.js";
import PaymentStatus from "./components/parentPortal/PaymentStatus.js";
import Receipt from "./components/parentPortal/Receipt.js";
import StudentHealthRecord from "./components/parentPortal/StudentHealthRecord.js";
import StudentProgressParent from "./components/parentPortal/StudentProgressParent.js";
import ParentProfileWrapper from "./components/parents/ParentProfileWrapper.js";
import AdminTeacherAttendance from "./components/principal/AdminTeacherAttendance.js";
import Notification from "./components/principal/notification/notification.js";
import ClassSectionExamTable from "./components/principal/score/ClassSectionExamTable.js";
import SubjectsManagement from "./components/principal/subjects/SubjectsManagement.js";
import Etimetable from "./components/studentPortal/Etimetable.js";
import Profile from "./components/studentPortal/Profile.js";
import StudentAssignment from "./components/studentPortal/StudentAssignment.js";
import StudentExamScores from "./components/studentPortal/StudentExamScores.js";
import StudentNotification from "./components/studentPortal/StudentNotification.js";
import ProgressPage from "./components/studentPortal/StudentProgress.js";
import BehavioralRecordForm from "./components/teacherPortal/BehavioralRecordForm.js";
import SubmittedWorks from "./components/teacherPortal/SubmittedWorks.js";
import TeacherAttendance from "./components/teacherPortal/TeacherAttendance.js";
import TeacherNotification from "./components/teacherPortal/TeacherNotification.js";
import BranchDetails from "./components/admin/branches/BranchDetails";
import DriverDashboard from "./components/driver/DriverDashboard.js";
import BusDetails from "./components/dashboard/BusDetails.js";
import BusRouteDisplay from "./components/parentPortal/BusRouteDisplay.js";

// Create a wrapper component to handle the inactivity timer
function InactivityWrapper() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  // Use useRef instead of useState for the timer to avoid re-renders
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds
  const navigate = useNavigate();
  const loadingRef = useRef(false); // Add loading state for navigation control

  // Function to handle user logout due to inactivity
  const handleInactivityLogout = () => {
    console.log("User logged out due to inactivity");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("childrenIds");
    localStorage.removeItem("selectedChild");
    setUser(null);
    navigate("/login", { replace: true });
  };

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only set a new timer if the user is logged in
    if (localStorage.getItem("user")) {
      inactivityTimerRef.current = setTimeout(
        handleInactivityLogout,
        INACTIVITY_TIMEOUT
      );
    }
  };

  // Handle browser navigation controls
  useEffect(() => {
    const disableNavigation = (e) => {
      if (loadingRef.current) {
        e.preventDefault();
        window.history.forward();
      }
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", disableNavigation);

    return () => {
      window.removeEventListener("popstate", disableNavigation);
    };
  }, []);

  // Set up event listeners for user activity
  useEffect(() => {
    if (user) {
      // List of events to track for user activity
      const activityEvents = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
        "keydown",
      ];

      // Create a single event handler function to avoid creating new functions on each render
      const handleUserActivity = () => resetInactivityTimer();

      // Add event listeners
      activityEvents.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });

      // Initialize the timer
      resetInactivityTimer();

      // Cleanup function
      return () => {
        // Remove event listeners
        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleUserActivity);
        });

        // Clear the timeout
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [user, navigate]); // Remove inactivityTimer from dependencies

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      setUser(updatedUser);
      // console.log("User updated:", updatedUser); // Debug user state
    };
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("user");
  });
  const [studentId, setStudentId] = useState(() => {
    return localStorage.getItem("selectedChild") || null;
  });
  const [roleId, setRoleId] = useState(() => {
    return user?.roleId || null;
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      setRoleId(user.roleId);
      if (user.role === "parent" && user.studentId) {
        setStudentId(user.studentId);
        localStorage.setItem("selectedChild", user.studentId);
      } else if (user.role === "student" && user._id) {
        setStudentId(user._id);
        localStorage.setItem("selectedChild", user._id);
      } else if (user.role === "parent" && !user.studentId) {
        const storedChildId = localStorage.getItem("selectedChild");
        if (storedChildId) setStudentId(storedChildId);
      } else {
        setStudentId(null);
        localStorage.removeItem("selectedChild");
      }
    } else {
      setStudentId(null);
      setRoleId(null);
      localStorage.removeItem("selectedChild");
    }
  }, [user]);

  const getRoutesByRole = (role) => {
    // console.log("getRoutesByRole - Role:", role); // Debug role
    switch (role) {
      case "admin":
        return (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="branches" element={<BranchList />} />
            <Route path="branches/add" element={<AddBranch />} />
            <Route path="branches/edit/:id" element={<EditBranch />} />
            <Route path="branches/stats" element={<BranchStats />} />
            <Route path="principals" element={<PrincipalList />} />
            <Route path="/principals/add" element={<AddPrincipal />} />
            <Route
              path="/admin/principals/edit/:id"
              element={<EditPrincipal />}
            />
            <Route
              path="/admin/branches/details/:branchId"
              element={<BranchDetails />}
            />
          </>
        );

      case "principal":
        return (
          <>
            <Route index element={<PrincipalDashboard />} />
            <Route path="teachers" element={<TeacherList />} />
            <Route path="parents" element={<ParentList />} />
            <Route path="library" element={<LibraryManagement />} />
            <Route path='Fees' element={<Fees />} />
            <Route path='fees/general' element={<FeeManagement />} />
            <Route path='fees/hostel' element={<HostelFeeManagement />} />
            <Route path="events" element={<SchoolEvents />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="timetable/period" element={<PeriodTimeTable />} />
            <Route path="timetable/exam" element={<ExamTimetable />} />
            <Route path="add-student" element={<AddStudentForm />} />
            <Route path="add-parent" element={<AddParentForm />} />
            <Route path="healthrecord" element={<HealthRecordForm />} />
            <Route
              path="details/:id"
              element={<StudentDetailsPage role="principal" />}
            />
            <Route path="bus" element={<BusList />} />
            <Route
              path="teacherattendance"
              element={<AdminTeacherAttendance />}
            />
            <Route path="subjects" element={<SubjectsManagement />} />
            <Route path="studentscores" element={<ClassSectionExamTable />} />
            <Route path="principalNotification" element={<Notification />} />

            <Route
              path="parents/:roleId"
              element={<ParentProfileWrapper role="principal" />}
            />
            <Route path="/bus-details" element={<BusDetails />} />
            {/* <Route path="/profile/:roleId" element={<ParentDetails />} /> */}
          </>
        );

      case "teacher":
        return (
          <>
            <Route index element={<TeacherDashboard />} />
            <Route path="attendance" element={<StudManage />} />
            <Route path="teacherlibrary" element={<TeacherLibrary />} />
            <Route path="details" element={<TeacherDetails />} />
            <Route path="exam" element={<ExamGrade />} />
            <Route path="teacherattendance" element={<TeacherAttendance />} />
            <Route path="submittedassignments" element={<SubmittedWorks />} />
            <Route
              path="teacherNotification"
              element={<TeacherNotification />}
            />
            <Route
              path="behavioral-record"
              element={<BehavioralRecordForm />}
            />
          </>
        );

      case "student":
        return (
          <>
            <Route index element={<StudentDashboard />} />
            <Route path="studentlibrary" element={<StudentLibrary />} />
            <Route path="studentattendance" element={<StudentAttendance />} />
            <Route path="studentassignment" element={<StudentAssignment />} />
            <Route path="profile" element={<Profile />} />
            <Route path="studentexamscores" element={<StudentExamScores />} />
            <Route
              path="studentNotification"
              element={<StudentNotification />}
            />
            <Route path="timetable" element={<Etimetable />} />
            <Route path="studentprogress" element={<ProgressPage />} />
          </>
        );

      case "parent":
        return (
          <>
            <Route index element={<ParentDashboard />} />
            <Route path="fees" element={<FeeDashboard />} />
            <Route path="parentNotification" element={<ParentNotification />} />
            <Route
              path="pay/:studentId"
              element={<PaymentForm studentId={studentId} />}
            />
            <Route path="payment-status" element={<PaymentStatus />} />
            <Route path="receipt/:receiptId" element={<Receipt />} />
            <Route
              path="payment-history/:studentId"
              element={<PaymentHistory />}
            />

            <Route
              path="attendance/:studentId"
              element={<StudentAttendance role="parent" />}
            />
            <Route
              path="profile/:roleId"
              element={<ParentProfileWrapper role="parent" />}
            />

            <Route
              path="details/:childId"
              element={<StudentDetailsPage role="parent" />}
            />
            <Route
              path="student-health-record/:studentId"
              element={<StudentHealthRecord studentId={studentId} />}
            />
            <Route
              path="behavioral-record/:studentId"
              element={<BehavioralRecordDisplay studentId={studentId} />}
            />
            <Route
              path="/score-card/:studentId"
              element={<StudentExamScores />}
            />
            <Route path="studentprogress" element={<StudentProgressParent />} />
            <Route path="/bus-route" element={<BusRouteDisplay />} />
          </>
        );

      case "driver":
        return (
          <>
            <Route index element={<DriverDashboard />} />
          </>
        );

      default:
        return <Route index element={<Navigate to="/login" replace />} />;
    }
  };

  return (
    <div className="app-wrapper">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{
          borderRadius: "8px",
          fontFamily: "Poppins, sans-serif",
          fontSize: "0.9rem",
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <Login
                setUser={(userData) => {
                  loadingRef.current = true;
                  setUser(userData);
                  loadingRef.current = false;
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute
              roles={[
                "admin",
                "principal",
                "teacher",
                "student",
                "parent",
                "driver",
              ]}
            >
              <Layout />
            </PrivateRoute>
          }
        >
          {user && getRoutesByRole(user.role)}
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

// Main App component that renders the InactivityWrapper
function App() {
  return <InactivityWrapper />;
}

export default App;