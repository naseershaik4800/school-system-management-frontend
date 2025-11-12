import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const AdminTeacherAttendance = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [submittedAttendance, setSubmittedAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Retrieve token from localStorage for authentication
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/attendance/teachers`, config);
        setTeachers(res.data);
        const initialAttendance = {};
        res.data.forEach((teacher) => {
          initialAttendance[teacher._id] = "Present"; // Use _id as key
        });
        setAttendance(initialAttendance);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching teachers");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleAttendanceChange = (teacherId, status) => {
    setAttendance((prev) => ({ ...prev, [teacherId]: status }));
  };

  const submitAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const attendanceRecords = teachers.map((teacher) => ({
        teacherObjectId: teacher._id, // MongoDB ObjectId from User schema
        teacherId: teacher.teacherId, // Custom teacher ID from Teacher schema
        teacherName: teacher.name,
        status: attendance[teacher._id] || "Present",
      }));

      const payload = { date, attendanceRecords };
      await axios.post(`${BASE_URL}/api/attendance/mark`, payload, config);
      alert("Attendance marked successfully!");
      fetchAttendanceByDate(selectedDate); // Refresh submitted attendance
    } catch (err) {
      setError(err.response?.data?.message || "Error marking attendance");
      alert("Error marking attendance!");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async (dateToFetch) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${BASE_URL}/api/attendance/fetch/${dateToFetch}`,
        config
      );
      if (res.data && res.data.attendanceRecords) {
        setSubmittedAttendance(res.data.attendanceRecords);
      } else {
        setSubmittedAttendance([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceByDate(selectedDate);
  }, [selectedDate]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Teacher Attendance Management</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* <div style={styles.dateContainer}>
        <label style={styles.label}>Mark Attendance Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
        />
      </div> */}

      <div style={styles.dateContainer}>
        <label style={styles.label}>Mark Attendance Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]} // Restrict to today or earlier
          style={styles.input}
        />
      </div>

      {teachers.length > 0 && (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Teacher ID</th>
                  <th style={styles.th}>Teacher Name</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher._id}>
                    <td style={styles.td}>{teacher.teacherId}</td>
                    <td style={styles.td}>{teacher.name}</td>
                    <td style={styles.td}>
                      <select
                        value={attendance[teacher._id] || "Present"}
                        onChange={(e) => handleAttendanceChange(teacher._id, e.target.value)}
                        style={styles.select}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={submitAttendance} style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Submit Attendance"}
          </button>
        </>
      )}

      <h3 style={styles.subtitle}>View Submitted Attendance</h3>
      <div style={styles.dateContainer}>
        <label style={styles.label}>View Attendance Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
          max={new Date().toISOString().split("T")[0]} // Restrict to today or earlier

        />
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Teacher ID</th>
              <th style={styles.th}>Teacher Name</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {submittedAttendance.length > 0 ? (
              submittedAttendance.map((record) => (
                <tr key={record.teacherObjectId}>
                  <td style={styles.td}>{record.teacherId}</td>
                  <td style={styles.td}>{record.teacherName}</td>
                  <td style={styles.td}>{record.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={styles.td}>
                  No attendance records found for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "auto",
    padding: "20px",
    boxSizing: "border-box",
  },
  title: { fontSize: "24px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" },
  subtitle: { fontSize: "20px", fontWeight: "bold", margin: "20px 0", textAlign: "center" },
  dateContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "15px",
  },
  label: { fontSize: "16px", fontWeight: "bold", marginBottom: "5px" },
  input: { padding: "5px", fontSize: "16px", width: "100%", maxWidth: "300px" },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px", // Ensures table doesn't break on small screens
  },
  th: { borderBottom: "2px solid #000", padding: "10px", background: "#f4f4f4", textAlign: "left" },
  td: { padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" },
  select: { padding: "5px", fontSize: "16px", width: "100%" },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    cursor: "pointer",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    width: "100%",
    maxWidth: "300px",
    margin: "0 auto",
    display: "block",
    opacity: (props) => (props.disabled ? "0.6" : "1"),
  },
  error: { color: "red", marginBottom: "15px", textAlign: "center" },
};

export default AdminTeacherAttendance;