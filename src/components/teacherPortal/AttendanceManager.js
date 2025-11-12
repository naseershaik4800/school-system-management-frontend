import React, { useState, useEffect } from "react";
import { Card, Form, Button, Table, Alert, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function AttendanceManager() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/users?role=student&class=${selectedClass}&section=${selectedSection}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents(response.data);

      // Initialize attendance state
      const attendanceState = {};
      response.data.forEach((student) => {
        attendanceState[student._id] = "present";
      });
      setAttendance(attendanceState);
    } catch (error) {
      setError("Error fetching students");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const attendanceRecords = Object.entries(attendance).map(
        ([studentId, status]) => ({
          student: studentId,
          class: selectedClass,
          section: selectedSection,
          date,
          status,
        })
      );
      await Promise.all(
        attendanceRecords.map((record) =>
          axios.post(`${BASE_URL}/api/attendance`, record, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
 setMessage("Attendance marked successfully");
    } catch (error) {
      setError("Error marking attendance");
    }
  };

  return (
    <div>
      <h1 className="mb-4">Attendance Manager</h1>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-4">
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class</Form.Label>
                    <Form.Control
                      as="select"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      required
                    >
                      <option value="">Select Class</option>
                      {/* Add class options dynamically */}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <Form.Control
                      as="select"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      required
                    >
                      <option value="">Select Section</option>
                      {/* Add section options dynamically */}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {students.length > 0 && (
                <>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td>{student.rollNo}</td>
                          <td>{student.name}</td>
                          <td>
                            <Form.Control
                              as="select"
                              value={attendance[student._id]}
                              onChange={(e) =>
                                setAttendance({
                                  ...attendance,
                                  [student._id]: e.target.value,
                                })
                              }
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                            </Form.Control>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Button type="submit" variant="primary">
                    Submit Attendance
                  </Button>
                </>
              )}
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </div>
  );
}

export default AttendanceManager;
